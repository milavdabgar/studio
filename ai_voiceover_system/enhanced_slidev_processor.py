#!/usr/bin/env python3
"""
Enhanced Slidev Processor for NotebookLM Podcasts
================================================

Creates high-quality educational videos with click animations and rich bullet points,
matching the quality of slidev_unified_processor.py but using original NotebookLM audio.

Key Features:
- Enhanced transcript analysis with Whisper
- Rich Slidev slides with progressive bullet points  
- Click animations using v-click directives
- Audio-synchronized video creation
- Professional slide export

Usage:
    python enhanced_slidev_processor.py <audio_file.m4a>
"""

import os
import sys
import argparse
import json
import subprocess
from pathlib import Path
from datetime import datetime
import re
import tempfile
import shutil

# Audio processing
try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False

# Video processing  
try:
    from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips, CompositeVideoClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False

class EnhancedSlidevProcessor:
    """Create educational videos with click animations from NotebookLM podcasts"""
    
    def __init__(self, config_file="enhanced_slidev_config.json"):
        self.config_file = config_file
        self.config = self.load_config()
        self.output_dir = Path("enhanced_slidev_output")
        self.output_dir.mkdir(exist_ok=True)
        
        print("🎬 Enhanced Slidev Processor for NotebookLM Podcasts")
        print("=" * 60)
        self._display_capabilities()
    
    def _display_capabilities(self):
        """Display available capabilities"""
        print("📦 Available Components:")
        print(f"   {'✅' if WHISPER_AVAILABLE else '❌'} Whisper (Transcription): {WHISPER_AVAILABLE}")
        print(f"   {'✅' if MOVIEPY_AVAILABLE else '❌'} MoviePy (Video): {MOVIEPY_AVAILABLE}")
        print(f"   {'✅' if self._check_slidev() else '❌'} Slidev (Export): {self._check_slidev()}")
        print(f"   {'✅' if self._check_imagemagick() else '❌'} ImageMagick: {self._check_imagemagick()}")
        print()
    
    def _check_slidev(self):
        """Check if Slidev is available"""
        try:
            result = subprocess.run(['npx', 'slidev', '--version'], 
                                 capture_output=True, text=True, timeout=10)
            return result.returncode == 0
        except:
            return False
    
    def _check_imagemagick(self):
        """Check if ImageMagick is available"""
        try:
            result = subprocess.run(['magick', '--version'], 
                                 capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        except:
            return False
    
    def load_config(self):
        """Load or create configuration"""
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        
        # Create default config matching slidev_unified_processor quality
        default_config = {
            "transcription": {
                "model": "base",
                "language": "auto"
            },
            "slide_generation": {
                "slides_per_minute": 1.5,
                "min_slide_duration": 15,
                "max_slide_duration": 45,
                "bullet_points_per_slide": 4,
                "min_content_length": 30
            },
            "slidev_settings": {
                "theme": "academic", 
                "background": "#1a1a2e",
                "transition": "slide-left",
                "highlighter": "shiki",
                "line_numbers": False
            },
            "export_settings": {
                "format": "png",
                "width": 1920,
                "height": 1080,
                "with_clicks": True
            },
            "video_settings": {
                "fps": 30,
                "codec": "libx264",
                "audio_codec": "aac"
            }
        }
        
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, indent=2, ensure_ascii=False)
        
        print(f"📝 Created config: {self.config_file}")
        return default_config
    
    def transcribe_with_timing(self, audio_file):
        """Transcribe audio with detailed timing information"""
        if not WHISPER_AVAILABLE:
            print("❌ Whisper not available for transcription")
            return None
        
        print(f"🎤 Transcribing audio: {Path(audio_file).name}")
        print("   This may take a few minutes...")
        
        try:
            # Load Whisper model
            model = whisper.load_model(self.config["transcription"]["model"])
            
            # Transcribe with word-level timestamps
            result = model.transcribe(
                audio_file, 
                language=self.config["transcription"]["language"] if self.config["transcription"]["language"] != "auto" else None,
                word_timestamps=True,
                verbose=False
            )
            
            print(f"✅ Transcription complete: {len(result['segments'])} segments")
            return result
            
        except Exception as e:
            print(f"❌ Transcription failed: {e}")
            return None
    
    def analyze_transcript_for_slides(self, transcript_result, audio_duration):
        """Analyze transcript and create slide content with timing"""
        if not transcript_result:
            return None
        
        print("📊 Analyzing transcript for educational content...")
        
        slides = []
        segments = transcript_result["segments"]
        
        # Configuration
        slides_per_minute = self.config["slide_generation"]["slides_per_minute"]
        target_slides = max(3, int(audio_duration / 60 * slides_per_minute))
        min_duration = self.config["slide_generation"]["min_slide_duration"]
        max_bullets = self.config["slide_generation"]["bullet_points_per_slide"]
        
        print(f"   Target slides: {target_slides} (based on {audio_duration/60:.1f} min audio)")
        
        # Group segments into slides
        segments_per_slide = max(1, len(segments) // target_slides)
        current_slide = None
        slide_count = 0
        
        for i, segment in enumerate(segments):
            text = segment["text"].strip()
            
            # Skip very short segments
            if len(text) < self.config["slide_generation"]["min_content_length"]:
                continue
            
            # Start new slide
            if current_slide is None or len(current_slide["bullet_points"]) >= max_bullets:
                if current_slide:
                    slides.append(current_slide)
                
                slide_count += 1
                current_slide = {
                    "title": self._generate_slide_title(text, slide_count),
                    "bullet_points": [],
                    "start_time": segment["start"],
                    "end_time": segment["end"],
                    "duration": 0
                }
            
            # Add content as bullet point
            if len(current_slide["bullet_points"]) < max_bullets:
                bullet = self._clean_text_for_bullet(text)
                if bullet:
                    current_slide["bullet_points"].append(bullet)
                    current_slide["end_time"] = segment["end"]
        
        # Add final slide
        if current_slide and current_slide["bullet_points"]:
            slides.append(current_slide)
        
        # Calculate durations and adjust timing
        self._adjust_slide_timing(slides, audio_duration)
        
        print(f"✅ Created {len(slides)} slides with rich content")
        return slides
    
    def _generate_slide_title(self, text, slide_number):
        """Generate meaningful slide titles"""
        # Extract key concepts from text
        words = text.split()
        
        # Look for key educational terms
        key_terms = []
        important_words = [
            'transistor', 'component', 'technology', 'digital', 'revolution',
            'innovation', 'development', 'system', 'process', 'concept',
            'principle', 'application', 'advantage', 'benefit', 'feature'
        ]
        
        for word in words[:10]:  # Check first 10 words
            clean_word = re.sub(r'[^\w]', '', word.lower())
            if clean_word in important_words:
                key_terms.append(clean_word.title())
        
        if key_terms:
            return f"{key_terms[0]} Technology"
        elif slide_number == 1:
            return "Introduction"
        elif slide_number <= 3:
            return f"Key Concepts {slide_number}"
        else:
            return f"Advanced Topics {slide_number - 3}"
    
    def _clean_text_for_bullet(self, text):
        """Clean and format text for bullet points"""
        # Remove filler words and clean up
        text = re.sub(r'\b(um|uh|you know|like|basically)\b', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Limit length
        words = text.split()
        if len(words) > 15:
            text = ' '.join(words[:15]) + '...'
        
        # Capitalize first letter
        if text:
            text = text[0].upper() + text[1:] if len(text) > 1 else text.upper()
        
        return text if len(text) > 10 else None
    
    def _adjust_slide_timing(self, slides, total_duration):
        """Adjust slide timing to fit audio duration"""
        if not slides:
            return
        
        min_duration = self.config["slide_generation"]["min_slide_duration"]
        
        for i, slide in enumerate(slides):
            if i < len(slides) - 1:
                # Calculate duration until next slide
                slide["duration"] = max(min_duration, slides[i + 1]["start_time"] - slide["start_time"])
            else:
                # Last slide takes remaining time
                slide["duration"] = max(min_duration, total_duration - slide["start_time"])
    
    def create_rich_slidev_presentation(self, slides, audio_file):
        """Create rich Slidev presentation with click animations"""
        if not slides:
            return None
        
        audio_name = Path(audio_file).stem
        slidev_dir = self.output_dir / f"{audio_name}_slidev"
        slidev_dir.mkdir(exist_ok=True)
        
        print(f"📝 Creating rich Slidev presentation: {slidev_dir}")
        
        # Create slides.md with enhanced content
        slides_content = self._generate_slidev_content(slides, audio_name)
        
        slides_file = slidev_dir / "slides.md"
        with open(slides_file, 'w', encoding='utf-8') as f:
            f.write(slides_content)
        
        # Create package.json for Slidev
        package_json = {
            "name": f"{audio_name}-presentation",
            "type": "module",
            "scripts": {
                "dev": "slidev",
                "build": "slidev build",
                "export": "slidev export"
            }
        }
        
        package_file = slidev_dir / "package.json"
        with open(package_file, 'w', encoding='utf-8') as f:
            json.dump(package_json, f, indent=2)
        
        print(f"✅ Created Slidev presentation: {slides_file}")
        return slides_file
    
    def _generate_slidev_content(self, slides, presentation_title):
        """Generate Slidev markdown with click animations"""
        config = self.config["slidev_settings"]
        
        # Header with configuration
        content = f"""---
theme: {config["theme"]}
background: {config["background"]}
class: text-center
highlighter: {config["highlighter"]}
lineNumbers: {config["line_numbers"]}
info: |
  ## {presentation_title.replace('_', ' ').title()}
  Enhanced educational content with click animations
drawings:
  persist: false
transition: {config["transition"]}
title: {presentation_title.replace('_', ' ').title()}
---

# {presentation_title.replace('_', ' ').title()}

Enhanced Educational Content from NotebookLM

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next slide <carbon:arrow-right class="inline"/>
  </span>
</div>

<div class="abs-br m-6 flex gap-2">
  <button @click="$slidev.nav.openInEditor()" title="Open in Editor">
    <carbon:edit />
  </button>
  <a href="https://github.com/slidevjs/slidev" target="_blank" alt="GitHub"
    class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon-logo-github />
  </a>
</div>

---

"""
        
        # Generate content slides with click animations
        for i, slide in enumerate(slides):
            content += f"""# {slide["title"]}

"""
            
            # Add bullet points with click animations
            for j, bullet in enumerate(slide["bullet_points"]):
                click_num = j + 1
                content += f"""<div v-click="{click_num}">

• {bullet}

</div>

"""
            
            # Add timing information as comment
            content += f"""<!--
Slide {i+1} Timing:
- Start: {slide["start_time"]:.1f}s
- Duration: {slide["duration"]:.1f}s
- Bullets: {len(slide["bullet_points"])}
-->

---

"""
        
        # Add conclusion slide
        content += """# Summary

<div v-click="1">

## Key Takeaways

</div>

<div v-click="2">

• Comprehensive overview of the topic

</div>

<div v-click="3">

• In-depth analysis and insights

</div>

<div v-click="4">

• Thank you for watching!

</div>

<!--
Enhanced presentation created with Claude Code
-->
"""
        
        return content
    
    def export_slides_with_clicks(self, slidev_file):
        """Export Slidev slides as PNG images with click states"""
        slidev_dir = slidev_file.parent
        
        print(f"📤 Exporting slides with click animations...")
        print(f"   Working directory: {slidev_dir}")
        
        try:
            # Install dependencies
            subprocess.run(['npm', 'install', '@slidev/cli'], cwd=slidev_dir, 
                         capture_output=True, check=True)
            
            # Export with clicks
            export_cmd = ['npx', 'slidev', 'export', '--with-clicks', '--format', 'png']
            if self.config["export_settings"]["with_clicks"]:
                export_cmd.extend(['--width', str(self.config["export_settings"]["width"]),
                                 '--height', str(self.config["export_settings"]["height"])])
            
            result = subprocess.run(export_cmd, cwd=slidev_dir, 
                                  capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0:
                print("✅ Slides exported successfully")
                
                # Find exported images
                exports_dir = slidev_dir / "dist"
                if exports_dir.exists():
                    png_files = list(exports_dir.glob("*.png"))
                    print(f"   Generated {len(png_files)} slide images")
                    return png_files
                else:
                    print("⚠️  Export directory not found, checking alternative locations...")
                    png_files = list(slidev_dir.glob("**/*.png"))
                    return png_files
            else:
                print(f"❌ Export failed: {result.stderr}")
                return []
        
        except subprocess.TimeoutExpired:
            print("❌ Export timed out after 2 minutes")
            return []
        except Exception as e:
            print(f"❌ Export error: {e}")
            return []
    
    def create_video_from_slides(self, slide_images, audio_file, slide_timings):
        """Create final video from slide images and audio"""
        if not MOVIEPY_AVAILABLE or not slide_images:
            print("❌ Cannot create video - MoviePy unavailable or no slides")
            return None
        
        print(f"🎬 Creating video from {len(slide_images)} slides...")
        
        try:
            # Load audio
            audio_clip = AudioFileClip(audio_file)
            video_clips = []
            
            # Sort slide images by name
            slide_images = sorted(slide_images, key=lambda x: x.name)
            
            # Create video clips for each slide
            for i, (slide_img, timing) in enumerate(zip(slide_images, slide_timings)):
                print(f"   Processing slide {i+1}/{len(slide_images)}: {timing['duration']:.1f}s")
                
                try:
                    # Create image clip
                    img_clip = ImageClip(str(slide_img), duration=timing["duration"])
                    video_clips.append(img_clip)
                except Exception as e:
                    print(f"   ⚠️  Skipping slide {i+1}: {e}")
                    continue
            
            if not video_clips:
                print("❌ No valid video clips created")
                return None
            
            # Concatenate all slides
            video = concatenate_videoclips(video_clips, method="compose")
            
            # Trim or extend to match audio
            if video.duration > audio_clip.duration:
                video = video.subclip(0, audio_clip.duration)
            elif video.duration < audio_clip.duration:
                # Extend last slide
                extension = audio_clip.duration - video.duration
                last_slide = video_clips[-1].set_duration(video_clips[-1].duration + extension)
                video_clips[-1] = last_slide
                video = concatenate_videoclips(video_clips, method="compose")
            
            # Add audio
            final_video = video.set_audio(audio_clip)
            
            # Export
            audio_name = Path(audio_file).stem
            output_file = self.output_dir / f"{audio_name}_enhanced_video.mp4"
            
            print(f"📹 Rendering final video: {output_file}")
            
            final_video.write_videofile(
                str(output_file),
                fps=self.config["video_settings"]["fps"],
                codec=self.config["video_settings"]["codec"],
                audio_codec=self.config["video_settings"]["audio_codec"],
                temp_audiofile=str(self.output_dir / "temp_audio.m4a"),
                remove_temp=True,
                verbose=False,
                logger='bar'
            )
            
            # Cleanup
            audio_clip.close()
            video.close()
            final_video.close()
            
            print(f"✅ Enhanced video created: {output_file}")
            return output_file
            
        except Exception as e:
            print(f"❌ Video creation failed: {e}")
            return None
    
    def process_podcast_to_enhanced_video(self, audio_file):
        """Main processing pipeline"""
        audio_path = Path(audio_file)
        
        if not audio_path.exists():
            print(f"❌ Audio file not found: {audio_file}")
            return None
        
        print(f"\n🎓 Processing: {audio_path.name}")
        print("=" * 70)
        
        # Step 1: Transcribe audio
        transcript = self.transcribe_with_timing(audio_file)
        if not transcript:
            print("❌ Failed to transcribe audio")
            return None
        
        # Get audio duration
        try:
            with AudioFileClip(audio_file) as audio_clip:
                audio_duration = audio_clip.duration
        except:
            audio_duration = transcript.get("duration", 300)  # fallback
        
        print(f"🎵 Audio duration: {audio_duration/60:.1f} minutes")
        
        # Step 2: Analyze for slides
        slides = self.analyze_transcript_for_slides(transcript, audio_duration)
        if not slides:
            print("❌ Failed to generate slides")
            return None
        
        # Step 3: Create Slidev presentation
        slidev_file = self.create_rich_slidev_presentation(slides, audio_file)
        if not slidev_file:
            print("❌ Failed to create Slidev presentation")
            return None
        
        # Step 4: Export slides with clicks
        slide_images = self.export_slides_with_clicks(slidev_file)
        if not slide_images:
            print("❌ Failed to export slides")
            return None
        
        # Step 5: Create final video
        video_file = self.create_video_from_slides(slide_images, audio_file, slides)
        
        if video_file:
            # Save metadata
            metadata = {
                "source_audio": str(audio_path.absolute()),
                "output_video": str(video_file.absolute()),
                "slidev_presentation": str(slidev_file.absolute()),
                "slides_count": len(slides),
                "video_duration": audio_duration,
                "processing_date": datetime.now().isoformat(),
                "config": self.config
            }
            
            metadata_file = self.output_dir / f"{audio_path.stem}_metadata.json"
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            print(f"\n🎉 SUCCESS! Enhanced educational video created")
            print(f"📁 Video: {video_file}")
            print(f"📝 Slides: {slidev_file}")
            print(f"📊 Metadata: {metadata_file}")
            
            return {
                "video": video_file,
                "slides": slidev_file,
                "metadata": metadata_file
            }
        
        return None

def main():
    parser = argparse.ArgumentParser(
        description="Create enhanced educational videos from NotebookLM podcasts",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python enhanced_slidev_processor.py podcast.m4a
  python enhanced_slidev_processor.py gujarati_podcast.m4a --config custom_config.json
        """
    )
    
    parser.add_argument('audio_file', help='NotebookLM podcast file (.m4a, .mp3, .wav)')
    parser.add_argument('--config', default='enhanced_slidev_config.json', help='Configuration file')
    
    args = parser.parse_args()
    
    processor = EnhancedSlidevProcessor(args.config)
    result = processor.process_podcast_to_enhanced_video(args.audio_file)
    
    if result:
        print("\n✨ Enhanced educational video processing complete!")
    else:
        print("\n❌ Processing failed")
        sys.exit(1)

if __name__ == "__main__":
    main()