#!/usr/bin/env python3
"""
Complete Video Creation Pipeline
================================

End-to-end pipeline for creating professional educational videos:
1. Parse slide content from Markdown/Slidev files
2. Generate voice audio with cloned voice
3. Create slide images 
4. Synchronize audio with visuals
5. Add transitions and effects
6. Export final video

Author: AI Assistant
Date: 2024-07-23
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import re

# Set up environment for TTS
os.environ['COQUI_TOS_AGREED'] = '1'
os.environ['COQUI_TTS_AGREED'] = '1'

try:
    import moviepy
    from moviepy import ImageClip, AudioFileClip, concatenate_videoclips, ColorClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False
    print("⚠️  MoviePy not available - install with: pip install moviepy")

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("⚠️  PIL not available - install with: pip install pillow")

try:
    from TTS.api import TTS
    import librosa
    import soundfile as sf
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False
    print("⚠️  TTS libraries not available")


class CompleteVideoPipeline:
    """Complete video creation pipeline"""
    
    def __init__(self, output_dir: str = "complete_video_output"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories
        self.slides_dir = self.output_dir / "slides"
        self.audio_dir = self.output_dir / "audio"
        self.video_dir = self.output_dir / "videos"
        self.temp_dir = self.output_dir / "temp"
        
        for dir_path in [self.slides_dir, self.audio_dir, self.video_dir, self.temp_dir]:
            dir_path.mkdir(exist_ok=True)
        
        # Video settings
        self.video_width = 1920
        self.video_height = 1080
        self.fps = 30
        self.background_color = (255, 255, 255)
        
        # Voice settings
        self.voice_sample = "milav_voice_sample.wav"
        self.tts_model = None
        
        # Initialize TTS if available
        if TTS_AVAILABLE:
            self._initialize_tts()
    
    def _initialize_tts(self):
        """Initialize TTS model"""
        try:
            print("🎤 Loading XTTS v2 model...")
            self.tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
            print("✅ TTS model loaded successfully")
        except Exception as e:
            print(f"❌ Failed to load TTS model: {e}")
            self.tts_model = None
    
    def parse_slide_content(self, slide_file: str) -> List[Dict[str, Any]]:
        """Parse slide content from markdown file"""
        print(f"📖 Parsing slide content from {slide_file}")
        
        slide_path = Path(slide_file)
        if not slide_path.exists():
            print(f"❌ Slide file not found: {slide_file}")
            return []
        
        with open(slide_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split by slide separators
        sections = content.split('---')
        slides = []
        
        for i, section in enumerate(sections[1:], 1):  # Skip frontmatter
            slide_data = self._parse_single_slide(section, i)
            if slide_data:
                slides.append(slide_data)
        
        print(f"✅ Parsed {len(slides)} slides")
        return slides
    
    def _parse_single_slide(self, content: str, slide_number: int) -> Dict[str, Any]:
        """Parse a single slide section"""
        lines = content.strip().split('\n')
        
        slide_data = {
            'number': slide_number,
            'title': '',
            'content': [],
            'bullet_points': [],
            'code_blocks': [],
            'images': [],
            'speaker_notes': ''
        }
        
        current_section = 'content'
        code_block = False
        
        for line in lines:
            line = line.strip()
            
            if not line:
                continue
            
            # Extract title
            if line.startswith('# ') and not slide_data['title']:
                slide_data['title'] = line[2:].strip()
            
            # Extract bullet points
            elif line.startswith('- ') or line.startswith('* '):
                slide_data['bullet_points'].append(line[2:].strip())
            
            # Extract code blocks
            elif line.startswith('```'):
                code_block = not code_block
                if not code_block and 'current_code' in locals():
                    slide_data['code_blocks'].append('\n'.join(current_code))
                else:
                    current_code = []
            elif code_block:
                current_code.append(line)
            
            # Extract images
            elif line.startswith('!['):
                match = re.search(r'!\[([^\]]*)\]\(([^)]+)\)', line)
                if match:
                    slide_data['images'].append({
                        'alt': match.group(1),
                        'src': match.group(2)
                    })
            
            # Regular content
            elif not line.startswith('#') and not code_block:
                # Clean up markdown formatting
                clean_line = re.sub(r'\*\*([^*]+)\*\*', r'\1', line)  # Bold
                clean_line = re.sub(r'\*([^*]+)\*', r'\1', clean_line)  # Italic
                clean_line = re.sub(r'`([^`]+)`', r'\1', clean_line)  # Code
                
                if clean_line:
                    slide_data['content'].append(clean_line)
        
        return slide_data
    
    def generate_slide_script(self, slide_data: Dict[str, Any]) -> str:
        """Generate speaker script for a slide"""
        script_parts = []
        
        # Add title
        if slide_data['title']:
            script_parts.append(f"Let's discuss {slide_data['title']}.")
        
        # Add main content
        for content_line in slide_data['content']:
            script_parts.append(content_line)
        
        # Add bullet points
        if slide_data['bullet_points']:
            script_parts.append("The key points are:")
            for point in slide_data['bullet_points']:
                script_parts.append(f"First, {point}.")
        
        script = ' '.join(script_parts)
        
        # Clean up script
        script = re.sub(r'\s+', ' ', script)  # Multiple spaces
        script = script.replace('..', '.')  # Double periods
        
        return script.strip()
    
    def generate_audio_for_slide(self, slide_data: Dict[str, Any]) -> Optional[str]:
        """Generate audio for a single slide"""
        if not self.tts_model:
            print("❌ TTS model not available")
            return None
        
        script = self.generate_slide_script(slide_data)
        if not script:
            print(f"⚠️  No script content for slide {slide_data['number']}")
            return None
        
        audio_file = self.audio_dir / f"slide_{slide_data['number']:02d}.wav"
        
        try:
            print(f"🎤 Generating audio for slide {slide_data['number']}: {slide_data['title'][:50]}...")
            
            # Generate with voice cloning
            self.tts_model.tts_to_file(
                text=script,
                speaker_wav=self.voice_sample,
                language="en",
                file_path=str(audio_file)
            )
            
            if audio_file.exists():
                # Get duration
                try:
                    duration = librosa.get_duration(path=str(audio_file))
                    print(f"   ✅ Generated {duration:.1f}s of audio")
                    return str(audio_file)
                except:
                    print(f"   ✅ Audio generated successfully")
                    return str(audio_file)
            else:
                print(f"   ❌ Audio file not created")
                return None
                
        except Exception as e:
            print(f"   ❌ Audio generation failed: {e}")
            return None
    
    def create_slide_image(self, slide_data: Dict[str, Any]) -> Optional[str]:
        """Create visual slide image"""
        if not PIL_AVAILABLE:
            print("❌ PIL not available for slide image creation")
            return None
        
        # Create slide image
        img = Image.new('RGB', (self.video_width, self.video_height), self.background_color)
        draw = ImageDraw.Draw(img)
        
        # Load fonts
        try:
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 64)
            content_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 36)
            bullet_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
        except:
            try:
                title_font = ImageFont.truetype("arial.ttf", 64)
                content_font = ImageFont.truetype("arial.ttf", 36)
                bullet_font = ImageFont.truetype("arial.ttf", 32)
            except:
                title_font = ImageFont.load_default()
                content_font = ImageFont.load_default()
                bullet_font = ImageFont.load_default()
        
        y_position = 100
        margin = 80
        
        # Add slide number
        draw.text((50, 50), f"Slide {slide_data['number']}", fill=(128, 128, 128), font=content_font)
        
        # Add title
        if slide_data['title']:
            # Center title
            title_bbox = draw.textbbox((0, 0), slide_data['title'], font=title_font)
            title_width = title_bbox[2] - title_bbox[0]
            title_x = max(margin, (self.video_width - title_width) // 2)
            
            draw.text((title_x, y_position), slide_data['title'], fill=(30, 58, 138), font=title_font)
            y_position += 120
        
        # Add content
        for content_line in slide_data['content'][:3]:  # Limit to 3 lines
            if y_position > self.video_height - 200:
                break
            
            # Wrap text if too long
            if len(content_line) > 80:
                words = content_line.split()
                line1 = ' '.join(words[:len(words)//2])
                line2 = ' '.join(words[len(words)//2:])
                
                draw.text((margin, y_position), line1, fill=(64, 64, 64), font=content_font)
                y_position += 50
                draw.text((margin, y_position), line2, fill=(64, 64, 64), font=content_font)
                y_position += 70
            else:
                draw.text((margin, y_position), content_line, fill=(64, 64, 64), font=content_font)
                y_position += 70
        
        # Add bullet points
        if slide_data['bullet_points'] and y_position < self.video_height - 100:
            for bullet in slide_data['bullet_points'][:4]:  # Limit bullets
                if y_position > self.video_height - 100:
                    break
                
                bullet_text = f"• {bullet}"
                if len(bullet_text) > 90:
                    bullet_text = bullet_text[:87] + "..."
                
                draw.text((margin + 20, y_position), bullet_text, fill=(0, 0, 0), font=bullet_font)
                y_position += 50
        
        # Save slide image
        image_file = self.slides_dir / f"slide_{slide_data['number']:02d}.png"
        img.save(image_file)
        
        print(f"📸 Created slide image: slide_{slide_data['number']:02d}.png")
        return str(image_file)
    
    def create_video_clip(self, slide_data: Dict[str, Any], image_file: str, audio_file: str) -> Optional:
        """Create video clip for a single slide"""
        if not MOVIEPY_AVAILABLE:
            print("❌ MoviePy not available")
            return None
        
        try:
            # Create image clip
            if audio_file and os.path.exists(audio_file):
                # Get audio duration
                audio_clip = AudioFileClip(audio_file)
                duration = audio_clip.duration
                
                # Create video clip with audio
                image_clip = ImageClip(image_file, duration=duration)
                video_clip = image_clip.set_audio(audio_clip)
                
                print(f"🎬 Created video clip for slide {slide_data['number']} ({duration:.1f}s)")
                return video_clip
            else:
                # Create clip without audio (5 second default)
                image_clip = ImageClip(image_file, duration=5.0)
                print(f"🎬 Created video clip for slide {slide_data['number']} (5.0s, no audio)")
                return image_clip
                
        except Exception as e:
            print(f"❌ Failed to create video clip for slide {slide_data['number']}: {e}")
            return None
    
    def add_transitions(self, clips: List) -> List:
        """Add transitions between clips"""
        if not clips or len(clips) < 2:
            return clips
        
        print("✨ Adding transitions between slides...")
        
        transition_clips = []
        
        for i, clip in enumerate(clips):
            transition_clips.append(clip)
            
            # Add fade transition between clips (except for last clip)
            if i < len(clips) - 1:
                try:
                    # Fade out current clip
                    clip_with_fadeout = clip.fadeout(0.5)
                    # Fade in next clip
                    next_clip_with_fadein = clips[i + 1].fadein(0.5)
                    
                    # Replace clips with faded versions
                    transition_clips[i] = clip_with_fadeout
                    
                except Exception as e:
                    print(f"⚠️  Transition failed for clip {i}: {e}")
        
        return transition_clips
    
    def create_intro_outro(self):
        """Create intro and outro clips"""
        if not PIL_AVAILABLE or not MOVIEPY_AVAILABLE:
            return None, None
        
        print("🎬 Creating intro and outro...")
        
        # Create intro
        intro_img = Image.new('RGB', (self.video_width, self.video_height), (30, 58, 138))
        draw = ImageDraw.Draw(intro_img)
        
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
        except:
            font = ImageFont.load_default()
        
        intro_lines = [
            "AI Voice-Over Presentation",
            "Generated with Cloned Voice",
            "Professional Educational Content"
        ]
        
        y_start = 400
        for i, line in enumerate(intro_lines):
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            x = (self.video_width - text_width) // 2
            draw.text((x, y_start + i * 100), line, fill=(255, 255, 255), font=font)
        
        intro_file = self.temp_dir / "intro.png"
        intro_img.save(intro_file)
        intro_clip = ImageClip(str(intro_file), duration=3.0)
        
        # Create outro
        outro_img = Image.new('RGB', (self.video_width, self.video_height), (30, 58, 138))
        draw = ImageDraw.Draw(outro_img)
        
        outro_lines = [
            "Thank You!",
            "Video Generated with AI Voice Cloning",
            "Professional Educational Content"
        ]
        
        for i, line in enumerate(outro_lines):
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            x = (self.video_width - text_width) // 2
            draw.text((x, y_start + i * 100), line, fill=(255, 255, 255), font=font)
        
        outro_file = self.temp_dir / "outro.png"
        outro_img.save(outro_file)
        outro_clip = ImageClip(str(outro_file), duration=3.0)
        
        return intro_clip, outro_clip
    
    def export_final_video(self, clips: List, output_filename: str = "ai_voiceover_presentation.mp4") -> str:
        """Export final video"""
        if not MOVIEPY_AVAILABLE or not clips:
            print("❌ Cannot export video")
            return ""
        
        print("🎞️  Exporting final video...")
        
        try:
            # Add intro and outro
            intro_clip, outro_clip = self.create_intro_outro()
            
            final_clips = []
            if intro_clip:
                final_clips.append(intro_clip)
            
            final_clips.extend(clips)
            
            if outro_clip:
                final_clips.append(outro_clip)
            
            # Concatenate all clips
            final_video = concatenate_videoclips(final_clips, method="compose")
            
            # Export settings
            output_path = self.video_dir / output_filename
            
            print(f"📤 Exporting to {output_path}")
            print("⏳ This may take several minutes...")
            
            final_video.write_videofile(
                str(output_path),
                fps=self.fps,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile=str(self.temp_dir / 'temp-audio.m4a'),
                remove_temp=True,
                verbose=False,
                logger=None
            )
            
            # Clean up
            for clip in final_clips:
                clip.close()
            final_video.close()
            
            print(f"✅ Video exported successfully: {output_path}")
            return str(output_path)
            
        except Exception as e:
            print(f"❌ Video export failed: {e}")
            return ""
    
    def create_complete_video(self, slide_file: str) -> Dict[str, Any]:
        """Complete end-to-end video creation pipeline"""
        print("🎬 Complete Video Creation Pipeline")
        print("=" * 70)
        
        start_time = time.time()
        
        # Step 1: Parse slides
        print("\n📖 Step 1: Parsing slide content...")
        slides = self.parse_slide_content(slide_file)
        if not slides:
            return {"success": False, "error": "No slides parsed"}
        
        # Step 2: Generate audio for all slides
        print(f"\n🎤 Step 2: Generating audio for {len(slides)} slides...")
        audio_files = []
        for slide in slides:
            audio_file = self.generate_audio_for_slide(slide)
            audio_files.append(audio_file)
            time.sleep(0.1)  # Small delay for stability
        
        # Step 3: Create slide images
        print(f"\n📸 Step 3: Creating slide images...")
        image_files = []
        for slide in slides:
            image_file = self.create_slide_image(slide)
            image_files.append(image_file)
        
        # Step 4: Create video clips
        print(f"\n🎬 Step 4: Creating video clips...")
        clips = []
        for i, slide in enumerate(slides):
            if image_files[i]:
                clip = self.create_video_clip(slide, image_files[i], audio_files[i])
                if clip:
                    clips.append(clip)
        
        if not clips:
            return {"success": False, "error": "No video clips created"}
        
        # Step 5: Add transitions
        print(f"\n✨ Step 5: Adding transitions...")
        clips = self.add_transitions(clips)
        
        # Step 6: Export final video
        print(f"\n🎞️  Step 6: Exporting final video...")
        video_path = self.export_final_video(clips)
        
        if not video_path:
            return {"success": False, "error": "Video export failed"}
        
        # Calculate statistics
        total_time = time.time() - start_time
        total_duration = sum(getattr(clip, 'duration', 5.0) for clip in clips)
        video_size = Path(video_path).stat().st_size / (1024*1024)  # MB
        
        results = {
            "success": True,
            "video_path": video_path,
            "statistics": {
                "slides_processed": len(slides),
                "audio_files_generated": len([af for af in audio_files if af]),
                "video_duration_minutes": total_duration / 60,
                "processing_time_minutes": total_time / 60,
                "video_size_mb": video_size,
                "resolution": f"{self.video_width}x{self.video_height}",
                "fps": self.fps
            },
            "files_created": {
                "slides_dir": str(self.slides_dir),
                "audio_dir": str(self.audio_dir),
                "video_file": video_path,
                "output_dir": str(self.output_dir)
            }
        }
        
        # Save results
        results_file = self.output_dir / "video_creation_results.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        return results


def main():
    """Main execution function"""
    # Example slide file - update this path as needed
    slide_file = "sample_slides.md"
    
    # Create sample slide file if it doesn't exist
    if not os.path.exists(slide_file):
        create_sample_slides(slide_file)
    
    print("🚀 AI Voice-Over Video Creation Pipeline")
    print("=" * 60)
    
    # Initialize pipeline
    pipeline = CompleteVideoPipeline()
    
    # Create complete video
    results = pipeline.create_complete_video(slide_file)
    
    if results["success"]:
        print("\n" + "=" * 60)
        print("🎉 VIDEO CREATION COMPLETE!")
        print("=" * 60)
        
        stats = results["statistics"]
        files = results["files_created"]
        
        print(f"🎬 **FINAL VIDEO READY:**")
        print(f"   File: {files['video_file']}")
        print(f"   Duration: {stats['video_duration_minutes']:.1f} minutes")
        print(f"   Size: {stats['video_size_mb']:.1f} MB")
        print(f"   Resolution: {stats['resolution']} @ {stats['fps']} FPS")
        
        print(f"\n📊 **PRODUCTION STATS:**")
        print(f"   Slides: {stats['slides_processed']}")
        print(f"   Audio Files: {stats['audio_files_generated']}")
        print(f"   Processing Time: {stats['processing_time_minutes']:.1f} minutes")
        
        print(f"\n🚀 **READY FOR:**")
        print(f"   📤 YouTube upload")
        print(f"   🎓 Educational distribution")
        print(f"   📱 Online platforms")
        
    else:
        print(f"\n❌ Video creation failed: {results.get('error', 'Unknown error')}")


def create_sample_slides(filename: str):
    """Create sample slide content for demonstration"""
    sample_content = """---
layout: cover
title: AI Voice-Over Demo
---

# AI Voice-Over Demo
## Professional Educational Content

---

# Introduction to AI Voice Cloning

Welcome to this demonstration of AI voice cloning technology.

- Voice cloning uses advanced neural networks
- Enables personalized educational content
- Creates authentic-sounding speech
- Supports multiple languages

---

# Technology Overview

The system uses several key components:

- **XTTS v2**: Advanced voice cloning model
- **MoviePy**: Video processing and editing
- **PIL**: Image generation and manipulation
- **FFmpeg**: Audio/video codec support

Modern voice cloning can create highly realistic speech from just a few minutes of sample audio.

---

# Benefits for Education

Voice cloning technology offers numerous advantages:

- Consistent instructor voice across all content
- Multilingual capability for global reach
- Time-efficient content creation
- Professional presentation quality

This technology democratizes high-quality educational content creation.

---

# Conclusion

AI voice cloning represents a significant advancement in educational technology.

Thank you for watching this demonstration of automated video creation with voice cloning.

"""
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(sample_content)
    
    print(f"📝 Created sample slides: {filename}")


if __name__ == "__main__":
    main()