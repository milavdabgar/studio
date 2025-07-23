#!/usr/bin/env python3
"""
Unified TTS System
==================

Clean, configurable text-to-speech system supporting:
- XTTS-v2 voice cloning (enhanced quality)
- F5-TTS premium voice cloning  
- Google TTS standard voices
- Edge TTS Microsoft voices

Usage:
    from unified_tts_system import UnifiedTTS
    
    tts = UnifiedTTS()
    tts.generate("Hello world", "output.wav")
    
    # Switch to F5-TTS
    tts.set_provider("f5_tts")
    tts.generate("Premium quality", "premium.wav")

Author: AI Assistant
Date: 2024-07-23
"""

import os
import sys
import ssl
import time
from pathlib import Path
from typing import Optional, Union
import librosa
import soundfile as sf

from tts_config import TTSConfig, TTSProvider, VoiceMode, get_config, setup_environment

# SSL bypass for downloads
ssl._create_default_https_context = ssl._create_unverified_context

class UnifiedTTS:
    """Unified TTS system with multiple providers"""
    
    def __init__(self, config: Optional[TTSConfig] = None):
        """Initialize TTS system"""
        self.config = config or get_config()
        setup_environment()
        
        self._xtts_model = None
        self._f5_model = None
        self._google_client = None
        
        print(f"🎤 Unified TTS System initialized")
        print(f"   Provider: {self.config.provider.value}")
        print(f"   Mode: {self.config.voice_mode.value}")
    
    def set_provider(self, provider: Union[str, TTSProvider]):
        """Switch TTS provider"""
        if isinstance(provider, str):
            provider = TTSProvider(provider)
        
        self.config.provider = provider
        print(f"🔄 Switched to {provider.value}")
    
    def set_voice_mode(self, mode: Union[str, VoiceMode]):
        """Switch voice mode"""
        if isinstance(mode, str):
            mode = VoiceMode(mode)
            
        self.config.voice_mode = mode
        print(f"🎵 Voice mode: {mode.value}")
    
    def generate(self, text: str, output_path: str, **kwargs) -> bool:
        """Generate speech from text"""
        
        print(f"🎤 Generating with {self.config.provider.value}...")
        print(f"📝 Text: {text[:60]}{'...' if len(text) > 60 else ''}")
        
        start_time = time.time()
        
        try:
            if self.config.provider == TTSProvider.XTTS_V2:
                success = self._generate_xtts(text, output_path, **kwargs)
            elif self.config.provider == TTSProvider.F5_TTS:
                success = self._generate_f5(text, output_path, **kwargs)
            elif self.config.provider == TTSProvider.GOOGLE_TTS:
                success = self._generate_google(text, output_path, **kwargs)
            elif self.config.provider == TTSProvider.EDGE_TTS:
                success = self._generate_edge(text, output_path, **kwargs)
            else:
                print(f"❌ Unsupported provider: {self.config.provider}")
                return False
            
            if success:
                generation_time = time.time() - start_time
                file_size = os.path.getsize(output_path) / 1024 if os.path.exists(output_path) else 0
                print(f"✅ Generated in {generation_time:.1f}s ({file_size:.1f}KB)")
                print(f"🎧 Audio: {output_path}")
                return True
            else:
                print("❌ Generation failed")
                return False
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def _generate_xtts(self, text: str, output_path: str, **kwargs) -> bool:
        """Generate with XTTS-v2"""
        
        if not self._xtts_model:
            print("🤖 Loading XTTS-v2 model...")
            try:
                from TTS.api import TTS
                self._xtts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
                print("✅ XTTS-v2 loaded")
            except Exception as e:
                print(f"❌ XTTS-v2 load error: {e}")
                return False
        
        if self.config.voice_mode == VoiceMode.CLONED:
            # Use voice cloning
            if not os.path.exists(self.config.voice_sample_path):
                print(f"❌ Voice sample not found: {self.config.voice_sample_path}")
                return False
            
            # Enhanced parameters from working system
            self._xtts_model.tts_to_file(
                text=text,
                file_path=output_path,
                speaker_wav=self.config.voice_sample_path,
                language="en",
                split_sentences=True,
                temperature=kwargs.get('temperature', self.config.xtts_temperature),
                repetition_penalty=kwargs.get('repetition_penalty', self.config.xtts_repetition_penalty),
                top_k=kwargs.get('top_k', 50),
                top_p=kwargs.get('top_p', 0.85),
                speed=kwargs.get('speed', self.config.xtts_speed),
                length_penalty=kwargs.get('length_penalty', 1.0)
            )
        else:
            # Use XTTS standard speaker
            self._xtts_model.tts_to_file(
                text=text,
                file_path=output_path,
                language="en"
            )
        
        return os.path.exists(output_path)
    
    def _generate_f5(self, text: str, output_path: str, **kwargs) -> bool:
        """Generate with F5-TTS"""
        
        if not self._f5_model:
            print("🤖 Loading F5-TTS model...")
            try:
                from f5_tts.api import F5TTS
                self._f5_model = F5TTS()
                print("✅ F5-TTS loaded")
            except Exception as e:
                print(f"❌ F5-TTS load error: {e}")
                return False
        
        if self.config.voice_mode == VoiceMode.CLONED:
            # Prepare reference audio
            reference_path = self._prepare_f5_reference()
            if not reference_path:
                return False
            
            # Generate with F5-TTS
            wav, sr, _ = self._f5_model.infer(
                ref_file=reference_path,
                ref_text="",
                gen_text=text,
                show_info=lambda x: None,
                target_rms=kwargs.get('target_rms', self.config.f5_target_rms),
                speed=kwargs.get('speed', self.config.f5_speed),
                remove_silence=True
            )
            
            # Export audio
            self._f5_model.export_wav(wav, output_path, sr)
        else:
            print("❌ F5-TTS only supports cloned voice mode")
            return False
        
        return os.path.exists(output_path)
    
    def _generate_google(self, text: str, output_path: str, **kwargs) -> bool:
        """Generate with Google TTS"""
        
        try:
            from google.cloud import texttospeech
            
            if not self._google_client:
                self._google_client = texttospeech.TextToSpeechClient()
            
            # Configure voice
            voice_name = kwargs.get('voice_name', self.config.google_voice_name)
            
            synthesis_input = texttospeech.SynthesisInput(text=text)
            voice = texttospeech.VoiceSelectionParams(
                language_code="en-US",
                name=voice_name
            )
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.LINEAR16,
                speaking_rate=kwargs.get('speaking_rate', self.config.google_speaking_rate),
                pitch=kwargs.get('pitch', self.config.google_pitch)
            )
            
            # Generate
            response = self._google_client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )
            
            # Save audio
            with open(output_path, "wb") as out:
                out.write(response.audio_content)
            
            return True
            
        except Exception as e:
            print(f"❌ Google TTS error: {e}")
            print("💡 Ensure Google Cloud credentials are set up")
            return False
    
    def _generate_edge(self, text: str, output_path: str, **kwargs) -> bool:
        """Generate with Edge TTS"""
        
        try:
            import edge_tts
            import asyncio
            
            voice_name = kwargs.get('voice_name', self.config.edge_voice_name)
            rate = kwargs.get('rate', self.config.edge_rate)
            pitch = kwargs.get('pitch', self.config.edge_pitch)
            
            async def generate_edge():
                communicate = edge_tts.Communicate(text, voice_name, rate=rate, pitch=pitch)
                await communicate.save(output_path)
            
            # Run async generation
            asyncio.run(generate_edge())
            
            return os.path.exists(output_path)
            
        except Exception as e:
            print(f"❌ Edge TTS error: {e}")
            print("💡 Install with: pip install edge-tts")
            return False
    
    def _prepare_f5_reference(self) -> Optional[str]:
        """Prepare F5-TTS reference audio"""
        
        reference_path = "f5_reference.wav"
        
        if os.path.exists(reference_path):
            return reference_path
        
        if not os.path.exists(self.config.voice_sample_path):
            print(f"❌ Voice sample not found: {self.config.voice_sample_path}")
            return None
        
        try:
            # Load and process audio for F5-TTS
            audio, sr = librosa.load(self.config.voice_sample_path, sr=24000)
            
            # Extract reference segment
            duration = self.config.f5_reference_duration
            start_sec = len(audio) // 4
            segment_length = duration * sr
            audio_segment = audio[start_sec:start_sec + segment_length]
            
            # Clean audio
            audio_segment = librosa.effects.preemphasis(audio_segment, coef=0.97)
            audio_segment = librosa.util.normalize(audio_segment)
            audio_segment, _ = librosa.effects.trim(audio_segment, top_db=25)
            
            # Save reference
            sf.write(reference_path, audio_segment, 24000)
            
            print(f"✅ F5-TTS reference prepared ({len(audio_segment)/24000:.1f}s)")
            return reference_path
            
        except Exception as e:
            print(f"❌ F5-TTS reference prep error: {e}")
            return None
    
    def list_available_voices(self) -> list:
        """List available voices for current provider"""
        from tts_config import get_available_voices
        return get_available_voices(self.config.provider)
    
    def get_status(self) -> dict:
        """Get system status"""
        return {
            'provider': self.config.provider.value,
            'voice_mode': self.config.voice_mode.value,
            'voice_sample_exists': os.path.exists(self.config.voice_sample_path),
            'models_loaded': {
                'xtts': self._xtts_model is not None,
                'f5': self._f5_model is not None,
                'google': self._google_client is not None
            }
        }

# Convenience functions
def quick_generate(text: str, output_path: str, provider: str = "xtts_v2") -> bool:
    """Quick generation with default settings"""
    tts = UnifiedTTS()
    tts.set_provider(provider)
    return tts.generate(text, output_path)

if __name__ == "__main__":
    # Demo usage
    print("🎭 Unified TTS System Demo")
    print("=" * 40)
    
    tts = UnifiedTTS()
    
    test_text = "This is a test of the unified TTS system with enhanced voice cloning capabilities."
    
    print("\n🎤 Testing XTTS-v2...")
    tts.set_provider("xtts_v2")
    tts.generate(test_text, "demo_xtts.wav")
    
    print(f"\n📊 System Status:")
    status = tts.get_status()
    for key, value in status.items():
        print(f"   {key}: {value}")