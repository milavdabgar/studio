#!/usr/bin/env python3
"""
Enhanced XTTS-v2 Voice Cloning
==============================

Improved voice cloning with optimized parameters for better quality.
This should give you much better results than your current implementation.
"""

import os
import sys
import time
from pathlib import Path
import librosa
import soundfile as sf

try:
    from TTS.api import TTS
    XTTS_AVAILABLE = True
except ImportError:
    print("Install Coqui TTS: pip install coqui-tts")
    XTTS_AVAILABLE = False


class EnhancedVoiceCloning:
    def __init__(self, voice_sample_path: str):
        self.voice_sample = Path(voice_sample_path)
        self.output_dir = Path("enhanced_voice_output")
        self.output_dir.mkdir(exist_ok=True)
        
        # Process voice sample
        self.processed_sample = self._enhance_voice_sample()
        
        # Load XTTS-v2 model
        if XTTS_AVAILABLE:
            print("Loading XTTS-v2 model...")
            self.tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
            print("✅ Model loaded successfully")
        else:
            self.tts_model = None
    
    def _enhance_voice_sample(self) -> Path:
        """Apply professional voice sample preprocessing"""
        print("🎵 Enhancing voice sample...")
        
        # Load and process audio
        audio, sr = librosa.load(self.voice_sample, sr=22050)
        
        # Apply enhancements
        audio = librosa.effects.preemphasis(audio, coef=0.97)  # Better high frequencies
        audio = librosa.util.normalize(audio)                   # Consistent volume
        audio, _ = librosa.effects.trim(audio, top_db=20)      # Remove silence
        
        # Save enhanced sample
        enhanced_path = self.output_dir / "enhanced_voice_sample.wav"
        sf.write(enhanced_path, audio, sr)
        
        duration = len(audio) / sr
        print(f"✅ Enhanced sample ready: {duration/60:.1f} minutes")
        
        return enhanced_path
    
    def generate_enhanced_audio(self, text: str, output_file: str, quality_mode: str = "high"):
        """Generate audio with enhanced parameters"""
        if not self.tts_model:
            print("❌ XTTS-v2 model not available")
            return False
        
        print(f"🎤 Generating with {quality_mode} quality...")
        
        # Quality-specific parameters
        if quality_mode == "high":
            params = {
                "temperature": 0.75,        # More consistent
                "repetition_penalty": 5.0,  # Reduce repetition
                "top_k": 50,                # Vocabulary control
                "top_p": 0.85,              # Nucleus sampling  
                "speed": 1.0,               # Natural pace
                "length_penalty": 1.0       # Speech flow
            }
        elif quality_mode == "natural":
            params = {
                "temperature": 0.65,        # Very consistent
                "repetition_penalty": 7.0,  # Strong repetition control
                "top_k": 40,                # Focused vocabulary
                "top_p": 0.8,               # More focused
                "speed": 0.95,              # Slightly slower for clarity
                "length_penalty": 0.9
            }
        else:  # balanced
            params = {
                "temperature": 0.8,
                "repetition_penalty": 4.0,
                "top_k": 55,
                "top_p": 0.9,
                "speed": 1.0
            }
        
        try:
            start_time = time.time()
            
            # Generate with enhanced parameters
            self.tts_model.tts_to_file(
                text=text,
                file_path=output_file,
                speaker_wav=str(self.processed_sample),
                language="en",
                split_sentences=True,
                **params
            )
            
            generation_time = time.time() - start_time
            file_size = os.path.getsize(output_file) / 1024 if os.path.exists(output_file) else 0
            
            print(f"✅ Generated in {generation_time:.1f}s ({file_size:.1f}KB)")
            print(f"   Audio file: {output_file}")
            print(f"   Parameters: temp={params['temperature']}, rep_penalty={params['repetition_penalty']}")
            
            return True
            
        except Exception as e:
            print(f"❌ Generation failed: {e}")
            return False
    
    def test_quality_modes(self):
        """Test different quality modes"""
        test_text = "Computer security is the protection of computer systems from damage to the hardware, software, or electronic data, as well as from disruption or misdirection of the services they provide."
        
        print("\n🧪 Testing Enhanced Quality Modes")
        print("=" * 50)
        
        modes = [
            ("high", "Optimized for voice similarity"),
            ("natural", "Focus on natural speech flow"),
            ("balanced", "Balance of quality and speed")
        ]
        
        for mode, description in modes:
            print(f"\n📊 Testing {mode} mode: {description}")
            output_file = self.output_dir / f"test_{mode}_quality.wav" 
            
            success = self.generate_enhanced_audio(test_text, str(output_file), mode)
            
            if success:
                print(f"   🎵 Listen to: {output_file}")
            else:
                print(f"   ❌ {mode} mode failed")
        
        print(f"\n🎧 Compare the audio files to hear the quality improvement!")
        print(f"📁 All files saved in: {self.output_dir}")


def main():
    """Run enhanced voice cloning test"""
    voice_sample = "milav_voice_sample.wav"
    
    if not os.path.exists(voice_sample):
        print(f"❌ Voice sample not found: {voice_sample}")
        return
    
    print("🎭 Enhanced Voice Cloning Test")
    print("=" * 40)
    
    # Create enhanced voice cloning system
    cloner = EnhancedVoiceCloning(voice_sample)
    
    # Test different quality modes
    cloner.test_quality_modes()
    
    print("\n🚀 Next Steps:")
    print("1. Listen to the generated audio files")
    print("2. Compare with your current voice cloning")  
    print("3. Choose the best quality mode")
    print("4. Use the chosen mode for all slide generation")


if __name__ == "__main__":
    main()
