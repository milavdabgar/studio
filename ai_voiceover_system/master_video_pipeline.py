#!/usr/bin/env python3
"""
Master Video Pipeline
=====================

Complete end-to-end video creation pipeline that integrates:
- Slide content parsing
- Intelligent script generation  
- Voice cloning and audio synthesis
- Professional video assembly
- Advanced effects and transitions

Usage:
    python master_video_pipeline.py --slides presentation.md --title "My Presentation"

Author: AI Assistant  
Date: 2024-07-23
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional

# Add core modules to path
sys.path.append(str(Path(__file__).parent / "core"))

# Set TTS environment
os.environ['COQUI_TOS_AGREED'] = '1'
os.environ['COQUI_TTS_AGREED'] = '1'

try:
    from intelligent_script_generator import IntelligentScriptGenerator
    from advanced_video_assembler import AdvancedVideoAssembler
    from complete_video_pipeline import CompleteVideoPipeline
    CORE_MODULES_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  Core modules not available: {e}")
    CORE_MODULES_AVAILABLE = False

try:
    from TTS.api import TTS
    import librosa
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False

try:
    from moviepy.editor import *
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


class MasterVideoPipeline:
    """Complete video creation pipeline orchestrator"""
    
    def __init__(self, output_dir: str = "master_video_output"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize components
        self.script_generator = IntelligentScriptGenerator() if CORE_MODULES_AVAILABLE else None
        self.video_assembler = AdvancedVideoAssembler(self.output_dir / "assembly") if CORE_MODULES_AVAILABLE else None
        self.pipeline = CompleteVideoPipeline(str(self.output_dir / "pipeline")) if CORE_MODULES_AVAILABLE else None
        
        # Voice settings
        self.voice_sample = "milav_voice_sample.wav"
        self.tts_model = None
        
        # Output directories
        self.scripts_dir = self.output_dir / "scripts"
        self.audio_dir = self.output_dir / "audio"
        self.slides_dir = self.output_dir / "slides"
        self.final_dir = self.output_dir / "final"
        
        for dir_path in [self.scripts_dir, self.audio_dir, self.slides_dir, self.final_dir]:
            dir_path.mkdir(exist_ok=True)
        
        # Initialize TTS
        if TTS_AVAILABLE:
            self._initialize_tts()
    
    def _initialize_tts(self):
        """Initialize TTS model"""
        try:
            print("🎤 Loading XTTS v2 model...")
            self.tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
            print("✅ TTS model loaded successfully")
        except Exception as e:
            print(f"❌ TTS model loading failed: {e}")
            self.tts_model = None
    
    def check_dependencies(self) -> Dict[str, bool]:
        """Check all required dependencies"""
        deps = {
            'tts': TTS_AVAILABLE and self.tts_model is not None,
            'moviepy': MOVIEPY_AVAILABLE,
            'pil': PIL_AVAILABLE,
            'core_modules': CORE_MODULES_AVAILABLE,
            'voice_sample': os.path.exists(self.voice_sample),
            'ffmpeg': self._check_ffmpeg()
        }
        
        print("🔍 Checking dependencies...")
        for dep, available in deps.items():
            status = "✅" if available else "❌"
            print(f"   {dep}: {status}")
        
        return deps
    
    def _check_ffmpeg(self) -> bool:
        """Check FFmpeg availability"""
        try:
            import subprocess
            subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
            return True
        except:
            return False
    
    def create_sample_presentation(self, filename: str = "sample_presentation.md") -> str:
        """Create a sample presentation for testing"""
        sample_content = """---
layout: cover
title: AI Voice Cloning Demo
subtitle: Professional Educational Content Creation
---

# AI Voice Cloning Technology
## Revolutionizing Educational Content

Welcome to this comprehensive demonstration of AI voice cloning technology for educational purposes.

---

# What is Voice Cloning?

Voice cloning is an advanced AI technology that can replicate human speech patterns.

- **Neural Networks**: Uses deep learning models
- **Voice Synthesis**: Creates natural-sounding speech
- **Personalization**: Maintains speaker characteristics
- **Quality**: Produces broadcast-quality audio

This technology enables personalized educational content at scale.

---

# Technical Implementation

Our system uses several cutting-edge technologies:

- **XTTS v2**: State-of-the-art voice cloning model
- **MoviePy**: Professional video processing
- **PIL**: Advanced image manipulation
- **FFmpeg**: High-quality audio/video encoding

The pipeline processes slides, generates scripts, creates audio, and assembles professional videos.

---

# Benefits for Education

Voice cloning offers transformative benefits for educational content:

- **Consistency**: Same instructor voice across all materials
- **Accessibility**: Multi-language support and localization
- **Efficiency**: Rapid content creation and updates
- **Quality**: Professional presentation standards
- **Scalability**: Create unlimited content variations

This democratizes high-quality educational content creation.

---

# Real-World Applications

The technology has numerous practical applications:

- **Online Courses**: Consistent instructor presence
- **Training Materials**: Corporate and institutional content
- **Accessibility**: Audio descriptions and narrations
- **Localization**: Multi-language course delivery
- **Updates**: Quick content revisions without re-recording

Modern AI makes these applications both feasible and cost-effective.

---

# Future Developments

Voice cloning technology continues to evolve:

- **Real-time Generation**: Instant speech synthesis
- **Emotion Control**: Adjustable speaking styles
- **Multi-speaker**: Multiple voices in single presentations
- **Interactive**: Responsive educational assistants

The future of educational technology is increasingly personalized and AI-driven.

---

# Conclusion

AI voice cloning represents a paradigm shift in educational content creation.

- **Professional Quality**: Broadcast-standard results
- **Personal Touch**: Authentic instructor voice
- **Scalable Solution**: Unlimited content generation
- **Future-Ready**: Cutting-edge technology implementation

Thank you for exploring this revolutionary educational technology with us.

---

# Thank You!

Questions and Discussion

Contact: your-email@example.com
Website: your-website.com
"""
        
        filepath = Path(filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(sample_content)
        
        print(f"📝 Created sample presentation: {filename}")
        return str(filepath)
    
    def process_presentation(self, slides_file: str, title: str = "AI Generated Presentation") -> Dict[str, Any]:
        """Process complete presentation from slides to final video"""
        
        print("🚀 Master Video Pipeline - Complete Processing")
        print("=" * 70)
        
        start_time = time.time()
        
        # Check dependencies
        deps = self.check_dependencies()
        if not all([deps['tts'], deps['moviepy'], deps['pil'], deps['core_modules']]):
            missing = [dep for dep, available in deps.items() if not available]
            return {
                "success": False,
                "error": f"Missing dependencies: {', '.join(missing)}",
                "dependencies": deps
            }
        
        # Step 1: Parse slides
        print("\n📖 Step 1: Parsing presentation slides...")
        if not self.pipeline:
            return {"success": False, "error": "Pipeline not initialized"}
        
        slides_data = self.pipeline.parse_slide_content(slides_file)
        if not slides_data:
            return {"success": False, "error": "No slides parsed from file"}
        
        print(f"✅ Parsed {len(slides_data)} slides")
        
        # Step 2: Generate intelligent scripts
        print("\n🎭 Step 2: Generating intelligent scripts...")
        scripts_data = []
        
        for slide in slides_data:
            if self.script_generator:
                script_output = self.script_generator.export_script_with_timing(slide, self.scripts_dir)
                scripts_data.append(script_output)
                print(f"   📝 Script generated for slide {slide['number']}: {script_output['timing']['estimated_duration']:.1f}s")
        
        # Step 3: Generate voice audio
        print("\n🎤 Step 3: Generating voice audio with cloned voice...")
        audio_files = []
        
        for i, script_data in enumerate(scripts_data):
            slide_num = script_data['slide_number']
            script_text = script_data['script']
            
            audio_file = self.audio_dir / f"slide_{slide_num:02d}_voice.wav"
            
            if self.tts_model:
                try:
                    print(f"   🎤 Generating audio for slide {slide_num}...")
                    self.tts_model.tts_to_file(
                        text=script_text,
                        speaker_wav=self.voice_sample,
                        language="en",
                        file_path=str(audio_file)
                    )
                    
                    if audio_file.exists():
                        audio_files.append(str(audio_file))
                        print(f"   ✅ Audio generated: {audio_file.name}")
                    else:
                        audio_files.append(None)
                        print(f"   ❌ Audio generation failed for slide {slide_num}")
                except Exception as e:
                    print(f"   ❌ Audio error for slide {slide_num}: {e}")
                    audio_files.append(None)
            else:
                audio_files.append(None)
            
            time.sleep(0.1)  # Small delay for stability
        
        # Step 4: Create slide images
        print("\n📸 Step 4: Creating professional slide images...")
        image_files = []
        
        for slide in slides_data:
            if self.pipeline:
                image_file = self.pipeline.create_slide_image(slide)
                image_files.append(image_file)
        
        # Step 5: Assemble professional video
        print("\n🎬 Step 5: Assembling professional video...")
        
        if self.video_assembler and image_files:
            final_video_path = self.video_assembler.create_professional_video(
                slides_data, image_files, audio_files, title
            )
        else:
            # Fallback to basic video creation
            if self.pipeline:
                clips = []
                for i, slide in enumerate(slides_data):
                    if image_files[i]:
                        clip = self.pipeline.create_video_clip(slide, image_files[i], audio_files[i])
                        if clip:
                            clips.append(clip)
                
                if clips:
                    final_video_path = self.pipeline.export_final_video(clips, f"{title.lower().replace(' ', '_')}.mp4")
                else:
                    final_video_path = ""
            else:
                final_video_path = ""
        
        # Calculate results
        total_time = time.time() - start_time
        
        if final_video_path and os.path.exists(final_video_path):
            video_size = Path(final_video_path).stat().st_size / (1024*1024)  # MB
            
            # Calculate total duration from audio files
            total_duration = 0
            for audio_file in audio_files:
                if audio_file and os.path.exists(audio_file):
                    try:
                        duration = librosa.get_duration(path=audio_file)
                        total_duration += duration
                    except:
                        total_duration += 5.0  # Estimate
                else:
                    total_duration += 5.0
            
            results = {
                "success": True,
                "video_path": final_video_path,
                "title": title,
                "statistics": {
                    "slides_processed": len(slides_data),
                    "scripts_generated": len(scripts_data),
                    "audio_files_created": len([af for af in audio_files if af]),
                    "video_duration_minutes": total_duration / 60,
                    "processing_time_minutes": total_time / 60,
                    "video_size_mb": video_size,
                    "average_slide_duration": total_duration / len(slides_data) if slides_data else 0
                },
                "files_created": {
                    "scripts_directory": str(self.scripts_dir),
                    "audio_directory": str(self.audio_dir),
                    "slides_directory": str(self.slides_dir),
                    "final_video": final_video_path,
                    "output_directory": str(self.output_dir)
                },
                "quality_metrics": {
                    "voice_cloning": "XTTS v2 - High Quality",
                    "video_resolution": "1920x1080 HD",
                    "audio_format": "WAV - Professional Quality",
                    "video_codec": "H.264 - Standard Compatible"
                }
            }
            
        else:
            results = {
                "success": False,
                "error": "Final video creation failed",
                "partial_results": {
                    "slides_parsed": len(slides_data),
                    "scripts_generated": len(scripts_data),
                    "audio_files": len([af for af in audio_files if af])
                }
            }
        
        # Save results
        results_file = self.output_dir / "master_pipeline_results.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        return results
    
    def print_results(self, results: Dict[str, Any]):
        """Print formatted results"""
        if results["success"]:
            print("\n" + "=" * 70)
            print("🎉 MASTER VIDEO PIPELINE COMPLETE!")
            print("=" * 70)
            
            stats = results["statistics"]
            files = results["files_created"]
            quality = results["quality_metrics"]
            
            print(f"🎬 **FINAL VIDEO READY:**")
            print(f"   Title: {results['title']}")
            print(f"   File: {files['final_video']}")
            print(f"   Duration: {stats['video_duration_minutes']:.1f} minutes")
            print(f"   Size: {stats['video_size_mb']:.1f} MB")
            
            print(f"\n📊 **PRODUCTION STATISTICS:**")
            print(f"   Slides Processed: {stats['slides_processed']}")
            print(f"   Scripts Generated: {stats['scripts_generated']}")
            print(f"   Audio Files Created: {stats['audio_files_created']}")
            print(f"   Processing Time: {stats['processing_time_minutes']:.1f} minutes")
            print(f"   Average Slide Duration: {stats['average_slide_duration']:.1f} seconds")
            
            print(f"\n🏆 **QUALITY METRICS:**")
            print(f"   Voice Cloning: {quality['voice_cloning']}")
            print(f"   Video Resolution: {quality['video_resolution']}")
            print(f"   Audio Format: {quality['audio_format']}")
            print(f"   Video Codec: {quality['video_codec']}")
            
            print(f"\n🚀 **READY FOR:**")
            print(f"   📤 YouTube upload")
            print(f"   🎓 Educational distribution")
            print(f"   📱 Online learning platforms")
            print(f"   💼 Professional presentations")
            
            print(f"\n🎯 **ACHIEVEMENT UNLOCKED:**")
            print(f"   🤖 Complete AI-powered video creation")
            print(f"   🎭 Professional voice cloning integration")
            print(f"   ✨ Broadcast-quality educational content")
            
        else:
            print(f"\n❌ Pipeline failed: {results.get('error', 'Unknown error')}")
            
            if 'partial_results' in results:
                partial = results['partial_results']
                print(f"\n📊 **PARTIAL PROGRESS:**")
                print(f"   Slides parsed: {partial.get('slides_parsed', 0)}")
                print(f"   Scripts generated: {partial.get('scripts_generated', 0)}")
                print(f"   Audio files: {partial.get('audio_files', 0)}")


def main():
    """Main execution with command line arguments"""
    parser = argparse.ArgumentParser(description="Master Video Pipeline - Complete AI Video Creation")
    parser.add_argument("--slides", "-s", type=str, help="Path to slides markdown file")
    parser.add_argument("--title", "-t", type=str, default="AI Generated Presentation", 
                       help="Video title")
    parser.add_argument("--output", "-o", type=str, default="master_video_output",
                       help="Output directory")
    parser.add_argument("--create-sample", action="store_true", 
                       help="Create sample presentation for testing")
    
    args = parser.parse_args()
    
    # Initialize pipeline
    pipeline = MasterVideoPipeline(args.output)
    
    # Create sample if requested
    if args.create_sample:
        sample_file = pipeline.create_sample_presentation("sample_presentation.md")
        print(f"✅ Sample presentation created: {sample_file}")
        args.slides = sample_file
    
    # Check for slides file
    if not args.slides:
        print("❌ No slides file specified. Use --slides or --create-sample")
        return
    
    if not os.path.exists(args.slides):
        print(f"❌ Slides file not found: {args.slides}")
        return
    
    print("🚀 Master Video Pipeline")
    print("=" * 50)
    print(f"Input: {args.slides}")
    print(f"Title: {args.title}")
    print(f"Output: {args.output}")
    
    # Process presentation
    results = pipeline.process_presentation(args.slides, args.title)
    
    # Print results
    pipeline.print_results(results)


if __name__ == "__main__":
    main()