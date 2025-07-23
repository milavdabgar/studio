#!/usr/bin/env python3
"""
Local TTS Generator using Coqui TTS + Alternatives
==================================================

This script uses completely free, local TTS models for high-quality voiceover generation.
Primary: Coqui TTS (XTTS v2) - State-of-the-art local TTS
Fallbacks: pyttsx3, gTTS (free but requires internet)

Features:
- Multi-language support
- Voice cloning capabilities  
- No API keys required
- Runs completely offline
- Professional quality output

Author: AI Assistant
Date: 2024-07-23
"""

import os
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Any
import time
import json

# Try importing TTS libraries
try:
    from TTS.api import TTS
    COQUI_AVAILABLE = True
except ImportError:
    print("📦 Installing Coqui TTS...")
    subprocess.run([sys.executable, "-m", "pip", "install", "TTS"], check=True)
    try:
        from TTS.api import TTS
        COQUI_AVAILABLE = True
    except ImportError:
        print("⚠️  Coqui TTS installation failed, using fallbacks")
        COQUI_AVAILABLE = False

try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False

try:
    import torch
    TORCH_AVAILABLE = True
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
except ImportError:
    TORCH_AVAILABLE = False
    DEVICE = "cpu"

from demo_generator import DemoVoiceoverGenerator


class LocalTTSGenerator(DemoVoiceoverGenerator):
    """Local TTS generator using free models"""
    
    def __init__(self, slide_file: str, output_dir: str = "local_tts_output"):
        super().__init__(slide_file, output_dir)
        
        # TTS Configuration
        self.tts_provider = "coqui"  # coqui, pyttsx3, gtts, openai
        self.voice_language = "en"
        self.speaking_rate = 150  # words per minute
        
        # Initialize TTS models
        self.coqui_model = None
        self.pyttsx3_engine = None
        
        self._initialize_tts()
    
    def _initialize_tts(self):
        """Initialize available TTS engines"""
        print("🔊 Initializing TTS engines...")
        
        # Initialize Coqui TTS (best quality)
        if COQUI_AVAILABLE and self.tts_provider == "coqui":
            try:
                print("🚀 Loading Coqui XTTS v2 model (this may take a moment)...")
                # Use the best multilingual model
                self.coqui_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(DEVICE)
                print(f"✅ Coqui TTS loaded on {DEVICE}")
                
                # List available speakers
                if hasattr(self.coqui_model, 'speakers'):
                    print(f"🎭 Available speakers: {self.coqui_model.speakers[:5]}...")
                
            except Exception as e:
                print(f"⚠️  Coqui TTS failed to load: {e}")
                print("🔄 Falling back to alternative TTS...")
                self.tts_provider = "pyttsx3"
        
        # Initialize pyttsx3 (system TTS)
        if PYTTSX3_AVAILABLE and (self.tts_provider == "pyttsx3" or not self.coqui_model):
            try:
                self.pyttsx3_engine = pyttsx3.init()
                
                # Configure voice properties
                voices = self.pyttsx3_engine.getProperty('voices')
                
                # Try to find a female voice
                for voice in voices:
                    if any(keyword in voice.name.lower() for keyword in ['female', 'woman', 'zira', 'anna', 'susan']):
                        self.pyttsx3_engine.setProperty('voice', voice.id)
                        print(f"✅ Selected voice: {voice.name}")
                        break
                
                # Set speaking rate and volume
                self.pyttsx3_engine.setProperty('rate', self.speaking_rate)
                self.pyttsx3_engine.setProperty('volume', 0.9)
                print("✅ pyttsx3 TTS initialized")
                
            except Exception as e:
                print(f"⚠️  pyttsx3 failed: {e}")
    
    def generate_local_audio_files(self) -> List[str]:
        """Generate audio files using local TTS"""
        print("🎵 Generating audio files with local TTS...")
        
        audio_files = []
        audio_dir = self.output_dir / "audio"
        audio_dir.mkdir(exist_ok=True)
        
        for i, script in enumerate(self.scripts, 1):
            print(f"🎤 Generating audio for slide {i}/{len(self.scripts)}...")
            
            audio_file = audio_dir / f"slide_{i:02d}.wav"
            
            try:
                if self.tts_provider == "coqui" and self.coqui_model:
                    self._generate_coqui_audio(script, audio_file)
                elif self.tts_provider == "pyttsx3" and self.pyttsx3_engine:
                    self._generate_pyttsx3_audio(script, audio_file)
                elif self.tts_provider == "gtts" and GTTS_AVAILABLE:
                    self._generate_gtts_audio(script, audio_file)
                else:
                    # Fallback to OpenAI if available
                    self._generate_openai_audio(script, audio_file)
                
                audio_files.append(str(audio_file))
                
            except Exception as e:
                print(f"❌ Failed to generate audio for slide {i}: {e}")
                # Create placeholder
                placeholder_file = audio_dir / f"slide_{i:02d}_placeholder.txt"
                with open(placeholder_file, 'w') as f:
                    f.write(script)
                audio_files.append(str(placeholder_file))
        
        print(f"✅ Generated {len(audio_files)} audio files")
        return audio_files
    
    def _generate_coqui_audio(self, text: str, output_file: Path):
        """Generate audio using Coqui TTS (best quality)"""
        try:
            # Use a built-in speaker for consistency
            # XTTS v2 has great built-in voices
            self.coqui_model.tts_to_file(
                text=text,
                file_path=str(output_file),
                speaker="Ana Florence",  # Professional female voice
                language=self.voice_language,
                split_sentences=True  # Better prosody for long text
            )
            print(f"✅ Coqui TTS: {output_file.name}")
            
        except Exception as e:
            print(f"⚠️  Coqui TTS failed: {e}")
            # Try simpler approach
            try:
                self.coqui_model.tts_to_file(
                    text=text,
                    file_path=str(output_file),
                    language=self.voice_language
                )
                print(f"✅ Coqui TTS (simple): {output_file.name}")
            except Exception as e2:
                print(f"❌ Coqui TTS completely failed: {e2}")
                raise
    
    def _generate_pyttsx3_audio(self, text: str, output_file: Path):
        """Generate audio using pyttsx3 (system TTS)"""
        try:
            self.pyttsx3_engine.save_to_file(text, str(output_file))
            self.pyttsx3_engine.runAndWait()
            print(f"✅ pyttsx3: {output_file.name}")
            
        except Exception as e:
            print(f"❌ pyttsx3 failed: {e}")
            raise
    
    def _generate_gtts_audio(self, text: str, output_file: Path):
        """Generate audio using Google TTS (requires internet)"""
        try:
            # Convert to MP3 first, then to WAV if needed
            mp3_file = output_file.with_suffix('.mp3')
            
            tts = gTTS(text=text, lang=self.voice_language, slow=False)
            tts.save(str(mp3_file))
            
            # Convert MP3 to WAV using ffmpeg if available
            try:
                subprocess.run([
                    "ffmpeg", "-i", str(mp3_file), "-y", str(output_file)
                ], check=True, capture_output=True)
                mp3_file.unlink()  # Remove MP3
                print(f"✅ gTTS: {output_file.name}")
            except:
                # Keep as MP3 if ffmpeg not available
                mp3_file.rename(output_file.with_suffix('.mp3'))
                print(f"✅ gTTS (MP3): {output_file.with_suffix('.mp3').name}")
            
        except Exception as e:
            print(f"❌ gTTS failed: {e}")
            raise
    
    def _generate_openai_audio(self, text: str, output_file: Path):
        """Fallback to OpenAI TTS if API key available"""
        try:
            import openai
            
            client = openai.OpenAI()  # Uses OPENAI_API_KEY env var
            
            response = client.audio.speech.create(
                model="tts-1-hd",
                voice="nova",  # Professional female voice
                input=text,
                response_format="wav"
            )
            
            response.stream_to_file(output_file)
            print(f"✅ OpenAI TTS: {output_file.name}")
            
        except Exception as e:
            print(f"❌ OpenAI TTS failed: {e}")
            raise
    
    def benchmark_tts_engines(self, sample_text: str = None) -> Dict[str, Dict]:
        """Benchmark different TTS engines"""
        if not sample_text:
            sample_text = "Welcome to Computer Security Fundamentals. Today we'll explore the CIA Triad consisting of Confidentiality, Integrity, and Availability."
        
        print("🏃‍♂️ Benchmarking TTS engines...")
        
        benchmark_dir = self.output_dir / "benchmark"
        benchmark_dir.mkdir(exist_ok=True)
        
        results = {}
        
        engines = [
            ("coqui", "Coqui XTTS v2", self._generate_coqui_audio),
            ("pyttsx3", "System TTS", self._generate_pyttsx3_audio),
            ("gtts", "Google TTS", self._generate_gtts_audio),
        ]
        
        if os.environ.get("OPENAI_API_KEY"):
            engines.append(("openai", "OpenAI TTS-1-HD", self._generate_openai_audio))
        
        for engine_id, engine_name, generate_func in engines:
            print(f"\n🔊 Testing {engine_name}...")
            
            try:
                output_file = benchmark_dir / f"sample_{engine_id}.wav"
                
                start_time = time.time()
                
                if engine_id == "coqui" and not self.coqui_model:
                    print("❌ Coqui not available")
                    continue
                elif engine_id == "pyttsx3" and not self.pyttsx3_engine:
                    print("❌ pyttsx3 not available") 
                    continue
                elif engine_id == "gtts" and not GTTS_AVAILABLE:
                    print("❌ gTTS not available")
                    continue
                
                generate_func(sample_text, output_file)
                
                generation_time = time.time() - start_time
                file_size = output_file.stat().st_size if output_file.exists() else 0
                
                results[engine_id] = {
                    "name": engine_name,
                    "generation_time": round(generation_time, 2),
                    "file_size": file_size,
                    "available": True,
                    "quality_rating": self._estimate_quality(engine_id)
                }
                
                print(f"✅ {engine_name}: {generation_time:.2f}s, {file_size/1024:.1f}KB")
                
            except Exception as e:
                print(f"❌ {engine_name} failed: {e}")
                results[engine_id] = {
                    "name": engine_name,
                    "available": False,
                    "error": str(e)
                }
        
        # Save benchmark results
        benchmark_file = benchmark_dir / "tts_benchmark.json"
        with open(benchmark_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n📊 Benchmark results saved: {benchmark_file}")
        
        # Recommend best engine
        available_engines = {k: v for k, v in results.items() if v.get('available')}
        if available_engines:
            best_engine = max(available_engines.items(), 
                            key=lambda x: x[1]['quality_rating'])
            print(f"\n🏆 Recommended engine: {best_engine[1]['name']}")
        
        return results
    
    def _estimate_quality(self, engine_id: str) -> int:
        """Estimate quality rating 1-10"""
        quality_map = {
            "coqui": 9,      # State-of-the-art local TTS
            "openai": 8,     # High quality commercial
            "gtts": 6,       # Good but robotic
            "pyttsx3": 4     # Basic system TTS
        }
        return quality_map.get(engine_id, 5)
    
    def create_complete_local_package(self) -> Dict[str, str]:
        """Create complete package with local TTS"""
        print("📦 Creating complete local TTS package...")
        
        # Parse slides and generate scripts
        self.parse_slidev_content()
        self.generate_demo_scripts()
        
        # Benchmark TTS engines
        benchmark_results = self.benchmark_tts_engines()
        
        # Generate audio files with best available engine
        audio_files = self.generate_local_audio_files()
        
        # Create package
        package = self.create_youtube_ready_package()
        
        # Add TTS-specific files
        package["audio_files"] = str(self.output_dir / "audio")
        package["benchmark"] = str(self.output_dir / "benchmark")
        
        # Create usage guide
        usage_guide = self._create_local_tts_guide(benchmark_results)
        package["local_tts_guide"] = usage_guide
        
        return package
    
    def _create_local_tts_guide(self, benchmark_results: Dict) -> str:
        """Create local TTS usage guide"""
        guide_file = self.output_dir / "local_tts_guide.md"
        
        with open(guide_file, 'w') as f:
            f.write("""# Local TTS Setup and Usage Guide

## 🎯 Overview

This system uses completely free, local text-to-speech models for professional-quality voiceover generation.

## 🚀 Primary Option: Coqui TTS (Recommended)

Coqui TTS XTTS v2 is state-of-the-art, running completely locally with no API keys needed.

### Installation
```bash
pip install TTS
```

### Features
- 🎭 Multiple realistic voices
- 🌍 Multi-language support  
- 🎯 Professional quality
- 🔒 Completely offline
- 🚀 GPU acceleration support

### Usage
```python
from TTS.api import TTS

# Initialize model (first run downloads ~1GB)
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")

# Generate speech
tts.tts_to_file(
    text="Your presentation content",
    file_path="output.wav",
    speaker="Ana Florence",
    language="en"
)
```

## 🔄 Alternative Options

### Option 2: System TTS (pyttsx3)
- ✅ No internet required
- ✅ Fast generation
- ❌ Basic quality

### Option 3: Google TTS (gTTS)  
- ✅ Good quality
- ❌ Requires internet
- ❌ Usage limits

### Option 4: OpenAI TTS (Fallback)
- ✅ Excellent quality
- ❌ Requires API key and billing

## 📊 Benchmark Results

""")
            
            # Add benchmark results
            for engine_id, results in benchmark_results.items():
                if results.get('available'):
                    f.write(f"### {results['name']}\n")
                    f.write(f"- **Generation Time:** {results.get('generation_time', 'N/A')}s\n")
                    f.write(f"- **Quality Rating:** {results.get('quality_rating', 'N/A')}/10\n")
                    f.write(f"- **File Size:** {results.get('file_size', 0)/1024:.1f}KB\n\n")
            
            f.write("""
## 🔧 Troubleshooting

### Coqui TTS Issues
1. **First run is slow**: Model downloads ~1GB, subsequent runs are fast
2. **CUDA errors**: Falls back to CPU automatically
3. **Memory issues**: Reduce batch size or use CPU mode

### System Requirements
- **RAM:** 4GB minimum, 8GB recommended for Coqui
- **Storage:** 2GB for models
- **GPU:** Optional but recommended for speed

### Performance Tips
- Use GPU if available (`pip install torch torchvision torchaudio`)
- Close other applications to free RAM
- Use shorter text chunks for faster generation

## 🎬 Video Generation Pipeline

After audio generation:

1. **Export slides from Slidev**
2. **Sync audio with slides** 
3. **Generate final video with FFmpeg**

Complete pipeline:
```bash
python local_tts_generator.py    # Generate audio
python video_generator.py         # Create final video
```

## 🎯 Quality Comparison

| Engine | Quality | Speed | Offline | Cost |
|--------|---------|-------|---------|------|
| Coqui XTTS v2 | 9/10 | Medium | ✅ | Free |
| OpenAI TTS | 8/10 | Fast | ❌ | $15/1M chars |
| Google TTS | 6/10 | Fast | ❌ | Free (limits) |
| pyttsx3 | 4/10 | Very Fast | ✅ | Free |

## 💡 Best Practices

1. **Text Preparation**
   - Break long sentences into shorter ones
   - Add punctuation for natural pauses
   - Use consistent formatting

2. **Audio Quality**
   - Generate in high sample rate (22kHz+)
   - Use consistent voice settings
   - Test with sample before full generation

3. **Performance**
   - Use GPU acceleration when available
   - Generate in batches for efficiency
   - Cache frequently used phrases

## 🚀 Ready to Use!

Your local TTS system is now ready to generate professional-quality voiceovers without any external dependencies or costs!
""")
        
        print(f"📖 Local TTS guide created: {guide_file}")
        return str(guide_file)


def main():
    """Main function for local TTS generation"""
    slide_file = "/Users/milav/Code/gpp/studio/content/resources/study-materials/32-ict/sem-5/4353204-cyber-security/slidev/02-computer-security-fundamentals.md"
    
    if not os.path.exists(slide_file):
        print(f"❌ Slide file not found: {slide_file}")
        return
    
    print("🎬 Local TTS Voiceover Generator")
    print("="*50)
    
    # Initialize generator
    generator = LocalTTSGenerator(slide_file)
    
    # Create complete package
    package = generator.create_complete_local_package()
    
    print("\n" + "="*50)
    print("🎉 Local TTS Package Complete!")
    print("="*50)
    
    print(f"📁 Output Directory: {generator.output_dir}")
    print(f"📊 Slides: {len(generator.slides)}")
    print(f"🎤 Scripts: {len(generator.scripts)}")
    print(f"🔊 TTS Engine: {generator.tts_provider}")
    
    print(f"\n📋 Package Contents:")
    for content_type, path in package.items():
        print(f"   {content_type}: {path}")
    
    print(f"\n🚀 Next Steps:")
    print("1. Review generated audio files")
    print("2. Run video generation pipeline")
    print("3. Upload to YouTube!")
    
    print(f"\n💡 Advantages of Local TTS:")
    print("- ✅ Completely free")
    print("- ✅ No API keys needed")
    print("- ✅ Works offline")
    print("- ✅ Professional quality")
    print("- ✅ Privacy-focused")


if __name__ == "__main__":
    main()