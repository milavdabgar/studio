#!/usr/bin/env python3
"""
Standalone F5-TTS Test
=====================

Test F5-TTS voice cloning quality with the same slides used previously.
Direct comparison with XTTS-v2 results.

Author: AI Assistant
Date: 2024-07-23
"""

import os
import sys
import json
import time
import traceback
from pathlib import Path
from typing import Dict, Any, List

try:
    import librosa
    import soundfile as sf
    import numpy as np
    AUDIO_AVAILABLE = True
except ImportError as e:
    print(f"❌ Audio libraries not available: {e}")
    AUDIO_AVAILABLE = False

try:
    from TTS.api import TTS
    XTTS_AVAILABLE = True
except ImportError:
    XTTS_AVAILABLE = False

try:
    from f5_tts.api import F5TTS
    F5_AVAILABLE = True
except ImportError:
    try:
        # Alternative import method
        import f5_tts
        F5_AVAILABLE = True
    except ImportError:
        F5_AVAILABLE = False


class StandaloneVoiceTest:
    """Standalone voice cloning test"""
    
    def __init__(self, voice_sample: str):
        self.voice_sample = Path(voice_sample)
        self.output_dir = Path("f5_vs_xtts_comparison")
        self.output_dir.mkdir(exist_ok=True)
        
        # Models
        self.xtts_model = None
        self.f5_model = None
        
        # Voice samples
        self.processed_sample = None
        self.short_sample = None
        
        print("🎭 Standalone Voice Cloning Comparison")
        print("=" * 50)
        
        self._setup_models()
    
    def _setup_models(self):
        """Setup both TTS models"""
        if not self.voice_sample.exists():
            print(f"❌ Voice sample not found: {self.voice_sample}")
            return
        
        if not AUDIO_AVAILABLE:
            print("❌ Audio processing not available")
            return
        
        # Process voice samples
        self._process_voice_samples()
        
        # Setup XTTS-v2
        if XTTS_AVAILABLE:
            try:
                print("🔄 Loading XTTS-v2...")
                self.xtts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
                print("✅ XTTS-v2 loaded")
            except Exception as e:
                print(f"⚠️ XTTS-v2 failed: {e}")
        
        # Setup F5-TTS
        if F5_AVAILABLE:
            try:
                print("🔄 Loading F5-TTS...")
                from f5_tts.api import F5TTS
                self.f5_model = F5TTS(model='F5TTS_v1_Base')
                print("✅ F5-TTS loaded")
            except Exception as e:
                print(f"⚠️ F5-TTS failed: {e}")
                print(f"   Error details: {traceback.format_exc()}")
    
    def _process_voice_samples(self):
        """Process voice samples for both models"""
        try:
            print("🎵 Processing voice samples...")
            
            # Load audio
            audio, sr = librosa.load(self.voice_sample, sr=22050)
            duration = len(audio) / sr
            
            print(f"📊 Voice sample: {duration:.1f}s")
            
            # Enhanced preprocessing
            audio = librosa.effects.preemphasis(audio, coef=0.97)
            audio = librosa.util.normalize(audio)
            audio, _ = librosa.effects.trim(audio, top_db=25)
            
            # Full sample for XTTS-v2
            self.processed_sample = self.output_dir / "voice_full.wav"
            sf.write(self.processed_sample, audio, sr)
            
            # Short sample for F5-TTS (10-15 seconds)
            if len(audio) > 15 * sr:
                segment_start = min(sr * 5, len(audio) // 4)
                segment_end = segment_start + (15 * sr)
                short_audio = audio[segment_start:segment_end]
            else:
                short_audio = audio
            
            self.short_sample = self.output_dir / "voice_short.wav"
            sf.write(self.short_sample, short_audio, sr)
            
            short_duration = len(short_audio) / sr
            print(f"✅ Samples processed:")
            print(f"   Full: {self.processed_sample} ({duration/60:.1f}min)")
            print(f"   Short: {self.short_sample} ({short_duration:.1f}s)")
            
        except Exception as e:
            print(f"❌ Voice processing failed: {e}")
    
    def generate_xtts_audio(self, text: str, output_file: Path) -> Dict[str, Any]:
        """Generate audio with XTTS-v2"""
        result = {"success": False, "error": None, "generation_time": 0}
        
        if not self.xtts_model or not self.processed_sample:
            result["error"] = "XTTS-v2 not available"
            return result
        
        try:
            start_time = time.time()
            
            # Enhanced XTTS-v2 parameters
            self.xtts_model.tts_to_file(
                text=text,
                file_path=str(output_file),
                speaker_wav=str(self.processed_sample),
                language="en",
                split_sentences=True,
                temperature=0.75,
                repetition_penalty=5.0,
                top_k=50,
                top_p=0.85,
                speed=1.0
            )
            
            result["generation_time"] = time.time() - start_time
            
            if output_file.exists():
                result["success"] = True
                result["file_size_kb"] = output_file.stat().st_size / 1024
            else:
                result["error"] = "Audio file not created"
                
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    def generate_f5_audio(self, text: str, output_file: Path) -> Dict[str, Any]:
        """Generate audio with F5-TTS"""
        result = {"success": False, "error": None, "generation_time": 0}
        
        if not self.f5_model or not self.short_sample:
            result["error"] = "F5-TTS not available"
            return result
        
        try:
            start_time = time.time()
            
            # F5-TTS generation with correct API
            wav = self.f5_model.infer(
                ref_file=str(self.short_sample),
                ref_text="",  # F5-TTS can work without reference text
                gen_text=text,
                remove_silence=True,
                speed=1.0,
                file_wave=str(output_file)
            )
            
            result["generation_time"] = time.time() - start_time
            
            if output_file.exists() and output_file.stat().st_size > 0:
                result["success"] = True
                result["file_size_kb"] = output_file.stat().st_size / 1024
            else:
                result["error"] = "Audio file not created or empty"
                
        except Exception as e:
            result["error"] = str(e)
            print(f"F5-TTS detailed error: {traceback.format_exc()}")
        
        return result
    
    def run_comparison_test(self):
        """Run comparison test with sample texts"""
        
        # Test texts (same as used in previous demos)
        test_texts = [
            "Computer security is the protection of computer systems from damage to the hardware, software, or electronic data, as well as from disruption or misdirection of the services they provide.",
            
            "Authentication is the process of verifying the identity of a user, device, or system before allowing access to resources or services.",
            
            "A firewall is a network security device that monitors and controls incoming and outgoing network traffic based on predetermined security rules.",
            
            "Encryption is the process of converting plaintext data into ciphertext to protect it from unauthorized access during transmission or storage.",
            
            "In cybersecurity, the principle of least privilege means granting users only the minimum access rights needed to perform their job functions."
        ]
        
        print(f"\n🧪 Running comparison test with {len(test_texts)} samples...")
        print("=" * 60)
        
        results = {
            "xtts_results": [],
            "f5_results": [],
            "comparison": {}
        }
        
        for i, text in enumerate(test_texts, 1):
            print(f"\n📝 Test {i}/{len(test_texts)}: {text[:50]}...")
            
            # Test XTTS-v2
            if self.xtts_model:
                print("   🔄 Generating with XTTS-v2...")
                xtts_file = self.output_dir / f"test_{i:02d}_xtts.wav"
                xtts_result = self.generate_xtts_audio(text, xtts_file)
                xtts_result["text"] = text
                xtts_result["test_number"] = i
                results["xtts_results"].append(xtts_result)
                
                if xtts_result["success"]:
                    print(f"   ✅ XTTS-v2: {xtts_result['generation_time']:.1f}s ({xtts_result['file_size_kb']:.1f}KB)")
                else:
                    print(f"   ❌ XTTS-v2: {xtts_result['error']}")
            
            # Test F5-TTS
            if self.f5_model:
                print("   🔄 Generating with F5-TTS...")
                f5_file = self.output_dir / f"test_{i:02d}_f5.wav"
                f5_result = self.generate_f5_audio(text, f5_file)
                f5_result["text"] = text
                f5_result["test_number"] = i
                results["f5_results"].append(f5_result)
                
                if f5_result["success"]:
                    print(f"   ✅ F5-TTS: {f5_result['generation_time']:.1f}s ({f5_result['file_size_kb']:.1f}KB)")
                else:
                    print(f"   ❌ F5-TTS: {f5_result['error']}")
            
            time.sleep(0.1)  # Brief pause
        
        # Calculate comparison stats
        xtts_successful = [r for r in results["xtts_results"] if r["success"]]
        f5_successful = [r for r in results["f5_results"] if r["success"]]
        
        if xtts_successful:
            xtts_avg_time = sum(r["generation_time"] for r in xtts_successful) / len(xtts_successful)
            xtts_avg_size = sum(r["file_size_kb"] for r in xtts_successful) / len(xtts_successful)
        else:
            xtts_avg_time = 0
            xtts_avg_size = 0
        
        if f5_successful:
            f5_avg_time = sum(r["generation_time"] for r in f5_successful) / len(f5_successful)
            f5_avg_size = sum(r["file_size_kb"] for r in f5_successful) / len(f5_successful)
        else:
            f5_avg_time = 0
            f5_avg_size = 0
        
        results["comparison"] = {
            "xtts_success_rate": f"{len(xtts_successful)}/{len(test_texts)} ({len(xtts_successful)/len(test_texts)*100:.1f}%)",
            "f5_success_rate": f"{len(f5_successful)}/{len(test_texts)} ({len(f5_successful)/len(test_texts)*100:.1f}%)",
            "xtts_avg_generation_time": xtts_avg_time,
            "f5_avg_generation_time": f5_avg_time,
            "xtts_avg_file_size_kb": xtts_avg_size,
            "f5_avg_file_size_kb": f5_avg_size,
            "speed_improvement": f"{(xtts_avg_time / f5_avg_time):.1f}x faster" if f5_avg_time > 0 and xtts_avg_time > 0 else "N/A"
        }
        
        # Save results
        results_file = self.output_dir / "comparison_results.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        # Print summary
        self._print_summary(results)
        
        return results
    
    def _print_summary(self, results: Dict[str, Any]):
        """Print comparison summary"""
        print("\n" + "=" * 60)
        print("🎉 VOICE CLONING COMPARISON COMPLETE!")
        print("=" * 60)
        
        comp = results["comparison"]
        
        print("📊 **COMPARISON RESULTS:**")
        print(f"   XTTS-v2 Success Rate: {comp['xtts_success_rate']}")
        print(f"   F5-TTS Success Rate: {comp['f5_success_rate']}")
        
        if comp['xtts_avg_generation_time'] > 0:
            print(f"   XTTS-v2 Avg Speed: {comp['xtts_avg_generation_time']:.1f}s per sample")
        if comp['f5_avg_generation_time'] > 0:
            print(f"   F5-TTS Avg Speed: {comp['f5_avg_generation_time']:.1f}s per sample")
        
        if comp.get('speed_improvement') and comp['speed_improvement'] != "N/A":
            print(f"   Speed Improvement: F5-TTS is {comp['speed_improvement']}")
        
        print(f"\n🎬 **AUDIO FILES GENERATED:**")
        print(f"   Output Directory: {self.output_dir}")
        print(f"   Compare audio quality manually")
        
        print(f"\n🎯 **NEXT STEPS:**")
        print(f"   1. Listen to both sets of audio files")
        print(f"   2. Compare voice similarity to your original")
        print(f"   3. Choose the better model for full production")
        
        if results["f5_results"] and any(r["success"] for r in results["f5_results"]):
            print(f"\n🚀 **RECOMMENDATION:**")
            print(f"   F5-TTS appears to be working - test audio quality!")


def main():
    """Run standalone voice cloning test"""
    voice_sample = "milav_voice_sample.wav"
    
    if not os.path.exists(voice_sample):
        print(f"❌ Voice sample not found: {voice_sample}")
        return
    
    print("🎭 F5-TTS vs XTTS-v2 Voice Cloning Test")
    print("=" * 50)
    
    # Run test
    tester = StandaloneVoiceTest(voice_sample)
    results = tester.run_comparison_test()
    
    return results


if __name__ == "__main__":
    main()