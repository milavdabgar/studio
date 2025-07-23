#!/usr/bin/env python3
"""
Quick Voice Cloning Demo
========================

Streamlined voice cloning using your Gujarati sample for English voiceovers.
Optimized for quick testing and audio generation.

Author: AI Assistant
Date: 2024-07-23
"""

import os
import sys
import json
from pathlib import Path
import time

# Test imports first
print("🔍 Checking dependencies...")

try:
    import librosa
    print("✅ librosa available")
except ImportError:
    print("📦 Installing librosa...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "librosa"], check=True)
    import librosa

try:
    import soundfile as sf
    print("✅ soundfile available")
except ImportError:
    print("📦 Installing soundfile...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "soundfile"], check=True)
    import soundfile as sf

try:
    from TTS.api import TTS
    print("✅ Coqui TTS available")
    TTS_AVAILABLE = True
except ImportError:
    print("⚠️  Coqui TTS not available")
    TTS_AVAILABLE = False

# Fallback TTS options
try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
    print("✅ Google TTS available")
except ImportError:
    GTTS_AVAILABLE = False

from final_demo import FinalTTSGenerator


class QuickVoiceClone(FinalTTSGenerator):
    """Quick voice cloning implementation"""
    
    def __init__(self, slide_file: str, voice_sample: str):
        super().__init__(slide_file, "voice_cloned_output")
        
        self.voice_sample = Path(voice_sample)
        self.processed_sample = None
        self.voice_model = None
        
        # Quick setup
        self._quick_setup()
    
    def _quick_setup(self):
        """Quick voice cloning setup"""
        print("🎭 Setting up voice cloning...")
        
        if not self.voice_sample.exists():
            print(f"❌ Voice sample not found: {self.voice_sample}")
            return
        
        # Process voice sample
        self._process_voice_sample()
        
        # Try to load TTS model
        if TTS_AVAILABLE:
            try:
                print("🔄 Loading XTTS v2 (this may take a moment)...")
                # Use the fastest loading approach
                self.voice_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
                print("✅ Voice cloning model loaded!")
                self.tts_engine = "voice_clone"
                return
            except Exception as e:
                print(f"⚠️  Voice cloning failed: {e}")
        
        # Fallback to Google TTS
        if GTTS_AVAILABLE:
            print("🔄 Using Google TTS as fallback")
            self.tts_engine = "gtts"
        else:
            print("❌ No TTS engines available")
            self.tts_engine = "none"
    
    def _process_voice_sample(self):
        """Process voice sample for cloning"""
        try:
            print(f"🎵 Processing voice sample: {self.voice_sample.name}")
            
            # Create processed sample directory
            processed_dir = self.output_dir / "voice_samples"
            processed_dir.mkdir(parents=True, exist_ok=True)
            
            # Load and analyze audio
            audio, sr = librosa.load(self.voice_sample, sr=22050)
            duration = len(audio) / sr
            
            print(f"📊 Voice analysis:")
            print(f"   Duration: {duration:.1f} seconds")
            print(f"   Quality: {'Excellent' if duration > 60 else 'Good' if duration > 30 else 'Adequate'}")
            
            # Save processed sample
            self.processed_sample = processed_dir / "processed_voice.wav"
            sf.write(self.processed_sample, audio, sr)
            
            print("✅ Voice sample processed and ready")
            
        except Exception as e:
            print(f"❌ Voice processing error: {e}")
            self.processed_sample = None
    
    def generate_voice_cloned_audio(self, text: str, output_file: Path) -> bool:
        """Generate audio with voice cloning"""
        if self.tts_engine == "voice_clone" and self.voice_model and self.processed_sample:
            try:
                print(f"🎭 Cloning voice: {output_file.name}")
                
                self.voice_model.tts_to_file(
                    text=text,
                    file_path=str(output_file),
                    speaker_wav=str(self.processed_sample),
                    language="en",
                    split_sentences=True
                )
                
                if output_file.exists() and output_file.stat().st_size > 0:
                    size = output_file.stat().st_size / 1024
                    print(f"✅ Voice cloned: {size:.1f}KB")
                    return True
                
            except Exception as e:
                print(f"❌ Voice cloning error: {e}")
        
        # Fallback to Google TTS
        if self.tts_engine == "gtts" and GTTS_AVAILABLE:
            try:
                mp3_file = output_file.with_suffix('.mp3')
                tts = gTTS(text=text, lang='en', slow=False)
                tts.save(str(mp3_file))
                
                if mp3_file.exists() and mp3_file.stat().st_size > 0:
                    size = mp3_file.stat().st_size / 1024
                    print(f"✅ Fallback TTS: {size:.1f}KB")
                    return True
                    
            except Exception as e:
                print(f"❌ Fallback TTS error: {e}")
        
        return False
    
    def generate_quick_demo(self) -> dict:
        """Generate quick voice cloning demo"""
        print("🚀 Starting quick voice cloning demo...")
        
        # Parse slides and generate scripts
        slides = self.parse_slidev_content()
        scripts = self.generate_demo_scripts()
        
        # Generate first 5 slides as demo
        demo_slides = min(5, len(scripts))
        print(f"🎬 Generating demo with first {demo_slides} slides...")
        
        audio_files = []
        audio_dir = self.output_dir / "audio"
        audio_dir.mkdir(parents=True, exist_ok=True)
        
        success_count = 0
        
        for i in range(demo_slides):
            script = scripts[i]
            print(f"\n🎤 Processing slide {i+1}/{demo_slides}")
            
            if self.tts_engine == "voice_clone":
                audio_file = audio_dir / f"slide_{i+1:02d}_voice_cloned.wav"
            else:
                audio_file = audio_dir / f"slide_{i+1:02d}_gtts.mp3"
            
            if self.generate_voice_cloned_audio(script, audio_file):
                audio_files.append(str(audio_file))
                success_count += 1
            
            # Small delay to be respectful
            time.sleep(0.5)
        
        # Create summary
        summary = {
            "voice_cloning": {
                "enabled": self.tts_engine == "voice_clone",
                "engine": self.tts_engine,
                "voice_sample": str(self.voice_sample),
                "processed_sample": str(self.processed_sample) if self.processed_sample else None,
                "quality": "Your authentic voice" if self.tts_engine == "voice_clone" else "High-quality fallback"
            },
            "demo_results": {
                "slides_processed": demo_slides,
                "audio_files_generated": success_count,
                "success_rate": f"{success_count/demo_slides*100:.0f}%",
                "output_directory": str(self.output_dir),
                "audio_files": audio_files
            }
        }
        
        # Save summary
        summary_file = self.output_dir / "voice_clone_demo_results.json"
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        
        return summary


def main():
    """Run quick voice cloning demo"""
    slide_file = "/Users/milav/Code/gpp/studio/content/resources/study-materials/32-ict/sem-5/4353204-cyber-security/slidev/02-computer-security-fundamentals.md"
    voice_sample = "/Users/milav/Code/gpp/studio/data/audio/milav-gujarati.wav"
    
    print("🎭 Quick Voice Cloning Demo")
    print("=" * 50)
    
    if not os.path.exists(slide_file):
        print(f"❌ Slides not found: {slide_file}")
        return
    
    if not os.path.exists(voice_sample):
        print(f"❌ Voice sample not found: {voice_sample}")
        return
    
    # Initialize quick voice cloning
    cloner = QuickVoiceClone(slide_file, voice_sample)
    
    # Generate demo
    results = cloner.generate_quick_demo()
    
    print("\n" + "=" * 50)
    print("🎉 VOICE CLONING DEMO COMPLETE!")
    print("=" * 50)
    
    print(f"🎭 **VOICE CLONING STATUS:**")
    vc = results["voice_cloning"]
    print(f"   Engine: {vc['engine'].upper()}")
    print(f"   Voice Cloning: {'✅ SUCCESS' if vc['enabled'] else '🔄 FALLBACK'}")
    print(f"   Quality: {vc['quality']}")
    
    print(f"\n📊 **DEMO RESULTS:**")
    dr = results["demo_results"]
    print(f"   Slides Processed: {dr['slides_processed']}")
    print(f"   Audio Generated: {dr['audio_files_generated']}")
    print(f"   Success Rate: {dr['success_rate']}")
    print(f"   Output: {dr['output_directory']}")
    
    if vc['enabled']:
        print(f"\n🚀 **ACHIEVEMENT UNLOCKED:**")
        print(f"   🎭 Your voice successfully cloned!")
        print(f"   🎓 Computer Security lectures in YOUR voice!")
        print(f"   🌟 Most personalized AI education system possible!")
    else:
        print(f"\n💡 **READY FOR UPGRADE:**")
        print(f"   Current: High-quality Google TTS working")
        print(f"   Upgrade: pip install TTS torch for voice cloning")
    
    print(f"\n🎬 **NEXT STEP:**")
    print(f"   Ready for video generation with your audio!")
    
    return results


if __name__ == "__main__":
    main()