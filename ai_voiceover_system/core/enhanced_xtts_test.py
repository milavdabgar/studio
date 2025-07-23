#!/usr/bin/env python3
"""
Enhanced XTTS-v2 Test
====================

Test enhanced XTTS-v2 parameters for better voice cloning quality.
Compare with original implementation.

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


class EnhancedXTTSTest:
    """Enhanced XTTS-v2 parameter testing"""
    
    def __init__(self, voice_sample: str):
        self.voice_sample = Path(voice_sample)
        self.output_dir = Path("enhanced_xtts_test")
        self.output_dir.mkdir(exist_ok=True)
        
        # Models
        self.xtts_model = None
        
        # Voice samples
        self.processed_sample = None
        
        print("🎭 Enhanced XTTS-v2 Parameter Test")
        print("=" * 50)
        
        self._setup_model()
    
    def _setup_model(self):
        """Setup XTTS-v2 model"""
        if not self.voice_sample.exists():
            print(f"❌ Voice sample not found: {self.voice_sample}")
            return
        
        if not AUDIO_AVAILABLE:
            print("❌ Audio processing not available")
            return
        
        # Process voice sample
        self._process_voice_sample()
        
        # Setup XTTS-v2
        if XTTS_AVAILABLE:
            try:
                print("🔄 Loading XTTS-v2...")
                self.xtts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
                print("✅ XTTS-v2 loaded")
            except Exception as e:
                print(f"⚠️ XTTS-v2 failed: {e}")
    
    def _process_voice_sample(self):
        """Process voice sample with enhanced preprocessing"""
        try:
            print("🎵 Processing voice sample with enhanced preprocessing...")
            
            # Load audio
            audio, sr = librosa.load(self.voice_sample, sr=22050)
            duration = len(audio) / sr
            
            print(f"📊 Original voice sample: {duration:.1f}s ({duration/60:.1f}min)")
            
            # Enhanced preprocessing
            print("🔧 Applying enhanced preprocessing...")
            
            # 1. Preemphasis for better high-frequency content
            audio_enhanced = librosa.effects.preemphasis(audio, coef=0.97)
            
            # 2. Normalize volume
            audio_enhanced = librosa.util.normalize(audio_enhanced)
            
            # 3. Intelligent silence removal
            audio_enhanced, _ = librosa.effects.trim(
                audio_enhanced, 
                top_db=25,  # More aggressive silence removal
                frame_length=2048,
                hop_length=512
            )
            
            # 4. Optional: Apply gentle low-pass filter to reduce noise
            # This can help with voice cloning quality
            if sr > 16000:
                # Apply anti-aliasing filter
                audio_enhanced = librosa.resample(audio_enhanced, orig_sr=sr, target_sr=sr)
            
            # Save processed sample
            self.processed_sample = self.output_dir / "enhanced_voice_sample.wav"
            sf.write(self.processed_sample, audio_enhanced, sr)
            
            processed_duration = len(audio_enhanced) / sr
            print(f"✅ Enhanced preprocessing complete:")
            print(f"   Original: {duration/60:.1f}min")
            print(f"   Processed: {processed_duration/60:.1f}min")
            print(f"   Saved: {self.processed_sample}")
            
        except Exception as e:
            print(f"❌ Voice processing failed: {e}")
            traceback.print_exc()
    
    def generate_basic_xtts(self, text: str, output_file: Path) -> Dict[str, Any]:
        """Generate audio with basic XTTS-v2 parameters"""
        result = {"success": False, "error": None, "generation_time": 0, "parameters": "basic"}
        
        if not self.xtts_model or not self.processed_sample:
            result["error"] = "XTTS-v2 not available"
            return result
        
        try:
            start_time = time.time()
            
            # Basic XTTS-v2 parameters (current implementation)
            self.xtts_model.tts_to_file(
                text=text,
                file_path=str(output_file),
                speaker_wav=str(self.processed_sample),
                language="en",
                split_sentences=True
            )
            
            result["generation_time"] = time.time() - start_time
            
            if output_file.exists() and output_file.stat().st_size > 0:
                result["success"] = True
                result["file_size_kb"] = output_file.stat().st_size / 1024
            else:
                result["error"] = "Audio file not created"
                
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    def generate_enhanced_xtts(self, text: str, output_file: Path, quality_mode: str = "high") -> Dict[str, Any]:
        """Generate audio with enhanced XTTS-v2 parameters"""
        result = {"success": False, "error": None, "generation_time": 0, "parameters": quality_mode}
        
        if not self.xtts_model or not self.processed_sample:
            result["error"] = "XTTS-v2 not available"
            return result
        
        try:
            start_time = time.time()
            
            # Enhanced parameters based on quality mode
            if quality_mode == "high":
                params = {
                    "temperature": 0.75,        # Lower = more consistent
                    "length_penalty": 1.0,      # Speech pace control
                    "repetition_penalty": 5.0,  # Reduce repetition
                    "top_k": 50,                # Vocabulary sampling
                    "top_p": 0.85,              # Nucleus sampling
                    "speed": 1.0                # Normal speed
                }
            elif quality_mode == "natural":
                params = {
                    "temperature": 0.65,        # Even more consistent
                    "length_penalty": 0.9,      # Slightly faster
                    "repetition_penalty": 7.0,  # Strong repetition reduction
                    "top_k": 40,                # More focused vocabulary
                    "top_p": 0.8,               # More focused sampling
                    "speed": 0.95               # Slightly slower for clarity
                }
            elif quality_mode == "expressive":
                params = {
                    "temperature": 0.85,        # More variation
                    "length_penalty": 1.1,      # Slightly slower
                    "repetition_penalty": 4.0,  # Allow some variation
                    "top_k": 60,                # Broader vocabulary
                    "top_p": 0.9,               # More creative sampling
                    "speed": 1.05               # Slightly faster
                }
            else:  # balanced
                params = {
                    "temperature": 0.8,
                    "repetition_penalty": 5.0,
                    "top_k": 50,
                    "top_p": 0.85,
                    "speed": 1.0
                }
            
            # Generate with enhanced parameters
            self.xtts_model.tts_to_file(
                text=text,
                file_path=str(output_file),
                speaker_wav=str(self.processed_sample),
                language="en",
                split_sentences=True,
                **params
            )
            
            result["generation_time"] = time.time() - start_time
            result["parameters_used"] = params
            
            if output_file.exists() and output_file.stat().st_size > 0:
                result["success"] = True
                result["file_size_kb"] = output_file.stat().st_size / 1024
            else:
                result["error"] = "Audio file not created"
                
        except Exception as e:
            result["error"] = str(e)
            print(f"Enhanced XTTS error: {traceback.format_exc()}")
        
        return result
    
    def run_parameter_comparison(self):
        """Run comparison test with different parameter sets"""
        
        # Test text (from cybersecurity slides)
        test_text = "Computer security is the protection of computer systems from damage to the hardware, software, or electronic data, as well as from disruption or misdirection of the services they provide. This includes protecting against unauthorized access, cyber attacks, and ensuring the confidentiality, integrity, and availability of information."
        
        print(f"\n🧪 Running parameter comparison test...")
        print(f"📝 Test text: {test_text[:80]}...")
        print("=" * 60)
        
        if not self.xtts_model:
            print("❌ XTTS-v2 model not available")
            return
        
        results = []
        
        # Test configurations
        configs = [
            ("basic", "Basic XTTS-v2 (current implementation)"),
            ("high", "High Quality Mode"),
            ("natural", "Natural Speech Mode"),
            ("expressive", "Expressive Mode")
        ]
        
        for config_name, description in configs:
            print(f"\n🔄 Testing {description}...")
            
            if config_name == "basic":
                output_file = self.output_dir / f"test_{config_name}.wav"
                result = self.generate_basic_xtts(test_text, output_file)
            else:
                output_file = self.output_dir / f"test_{config_name}.wav"
                result = self.generate_enhanced_xtts(test_text, output_file, config_name)
            
            result["config_name"] = config_name
            result["description"] = description
            results.append(result)
            
            if result["success"]:
                print(f"   ✅ Generated in {result['generation_time']:.1f}s ({result['file_size_kb']:.1f}KB)")
                if "parameters_used" in result:
                    print(f"   🎛️ Parameters: temp={result['parameters_used'].get('temperature', 'N/A')}, rep_penalty={result['parameters_used'].get('repetition_penalty', 'N/A')}")
            else:
                print(f"   ❌ Failed: {result['error']}")
        
        # Save results
        results_data = {
            "test_text": test_text,
            "voice_sample": str(self.voice_sample),
            "processed_sample": str(self.processed_sample),
            "results": results,
            "summary": self._calculate_summary(results)
        }
        
        results_file = self.output_dir / "parameter_comparison_results.json"
        with open(results_file, 'w') as f:
            json.dump(results_data, f, indent=2)
        
        # Print summary
        self._print_summary(results_data)
        
        return results_data
    
    def _calculate_summary(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate comparison summary"""
        successful = [r for r in results if r["success"]]
        
        if not successful:
            return {"message": "No successful generations"}
        
        avg_time = sum(r["generation_time"] for r in successful) / len(successful)
        avg_size = sum(r["file_size_kb"] for r in successful) / len(successful)
        
        fastest = min(successful, key=lambda x: x["generation_time"])
        largest = max(successful, key=lambda x: x["file_size_kb"])
        
        return {
            "successful_configs": len(successful),
            "total_configs": len(results),
            "average_generation_time": avg_time,
            "average_file_size_kb": avg_size,
            "fastest_config": fastest["config_name"],
            "fastest_time": fastest["generation_time"],
            "largest_file_config": largest["config_name"],
            "largest_file_size": largest["file_size_kb"]
        }
    
    def _print_summary(self, results_data: Dict[str, Any]):
        """Print comparison summary"""
        print("\n" + "=" * 60)
        print("🎉 ENHANCED XTTS-v2 PARAMETER TEST COMPLETE!")
        print("=" * 60)
        
        summary = results_data["summary"]
        
        if "message" in summary:
            print(f"❌ {summary['message']}")
            return
        
        print("📊 **PARAMETER COMPARISON RESULTS:**")
        print(f"   Successful Configs: {summary['successful_configs']}/{summary['total_configs']}")
        print(f"   Average Generation Time: {summary['average_generation_time']:.1f}s")
        print(f"   Average File Size: {summary['average_file_size_kb']:.1f}KB")
        print(f"   Fastest Config: {summary['fastest_config']} ({summary['fastest_time']:.1f}s)")
        print(f"   Largest File: {summary['largest_file_config']} ({summary['largest_file_size']:.1f}KB)")
        
        print(f"\n🎬 **AUDIO FILES GENERATED:**")
        print(f"   Output Directory: {self.output_dir}")
        
        successful_results = [r for r in results_data["results"] if r["success"]]
        for result in successful_results:
            print(f"   🎵 {result['description']}: test_{result['config_name']}.wav")
        
        print(f"\n🎯 **QUALITY COMPARISON RECOMMENDATIONS:**")
        print(f"   1. Listen to all generated audio files")
        print(f"   2. Compare voice similarity to your original")
        print(f"   3. Note differences in naturalness and clarity")
        print(f"   4. Choose the best parameter set for production")
        
        if any(r["config_name"] == "natural" and r["success"] for r in results_data["results"]):
            print(f"\n🌟 **RECOMMENDED:** Try 'Natural Speech Mode' first - optimized for clarity and authenticity")


def main():
    """Run enhanced XTTS-v2 parameter test"""
    voice_sample = "milav_voice_sample.wav"
    
    if not os.path.exists(voice_sample):
        print(f"❌ Voice sample not found: {voice_sample}")
        return
    
    print("🎭 Enhanced XTTS-v2 Parameter Test")
    print("=" * 50)
    
    # Run test
    tester = EnhancedXTTSTest(voice_sample)
    results = tester.run_parameter_comparison()
    
    return results


if __name__ == "__main__":
    main()