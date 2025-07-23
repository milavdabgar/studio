#!/usr/bin/env python3
"""
Complete Video Generation Pipeline for AI Voiceover Presentations
=================================================================

This script creates a complete video presentation from Slidev slides and AI-generated voiceovers.
It exports slides as images, generates synchronized audio, and combines them into a final video.

Features:
- Exports Slidev presentations to high-quality images
- Synchronizes slide timing with audio duration
- Adds smooth transitions between slides
- Generates final MP4 video ready for YouTube
- Supports custom branding and styling

Author: AI Assistant  
Date: 2024-07-23
"""

import os
import subprocess
import json
from pathlib import Path
from typing import List, Dict, Any, Tuple
import time
import shutil

try:
    from moviepy.editor import *
    from moviepy.video.fx import fadein, fadeout
    import librosa
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Installing required packages...")
    subprocess.run([
        "pip", "install", 
        "moviepy", "librosa", "Pillow", 
        "soundfile", "numpy"
    ], check=True)
    from moviepy.editor import *
    from moviepy.video.fx import fadein, fadeout
    import librosa
    from PIL import Image, ImageDraw, ImageFont

from ai_voiceover_generator import SlidevVoiceoverGenerator


class VideoGenerator:
    """Complete video generation pipeline for AI voiceover presentations"""
    
    def __init__(self, slide_file: str, output_dir: str = "video_output"):
        self.slide_file = Path(slide_file)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Video settings
        self.video_width = 1920
        self.video_height = 1080
        self.fps = 30
        self.transition_duration = 0.5  # seconds
        
        # Directories
        self.slides_dir = self.output_dir / "slides"
        self.audio_dir = self.output_dir / "audio"
        self.video_dir = self.output_dir / "videos"
        
        # Create directories
        for dir_path in [self.slides_dir, self.audio_dir, self.video_dir]:
            dir_path.mkdir(exist_ok=True)
        
        # Initialize voiceover generator
        self.voiceover_generator = SlidevVoiceoverGenerator(slide_file, str(self.output_dir))
    
    def export_slides_to_images(self) -> List[str]:
        """Export Slidev presentation to individual slide images"""
        print("📸 Exporting slides to images...")
        
        slide_dir = self.slide_file.parent
        
        # Check if Slidev is available
        if not self._check_slidev_available():
            print("⚠️  Slidev not found, using fallback slide generation...")
            return self._generate_fallback_slides()
        
        # Export slides using Slidev
        try:
            export_cmd = [
                "npx", "slidev", "export", 
                "--format", "png",
                "--output", str(self.slides_dir),
                "--width", str(self.video_width),
                "--height", str(self.video_height),
                str(self.slide_file)
            ]
            
            print(f"Running: {' '.join(export_cmd)}")
            result = subprocess.run(export_cmd, cwd=slide_dir, capture_output=True, text=True)
            
            if result.returncode != 0:
                print(f"❌ Slidev export failed: {result.stderr}")
                return self._generate_fallback_slides()
            
            # Find exported images
            image_files = sorted(list(self.slides_dir.glob("*.png")))
            print(f"✅ Exported {len(image_files)} slide images")
            return [str(f) for f in image_files]
            
        except Exception as e:
            print(f"❌ Slidev export error: {e}")
            return self._generate_fallback_slides()
    
    def _check_slidev_available(self) -> bool:
        """Check if Slidev is available in the system"""
        try:
            result = subprocess.run(["npx", "slidev", "--version"], 
                                  capture_output=True, text=True)
            return result.returncode == 0
        except:
            return False
    
    def _generate_fallback_slides(self) -> List[str]:
        """Generate fallback slide images when Slidev is not available"""
        print("🎨 Generating fallback slide images...")
        
        # Parse slides
        slides = self.voiceover_generator.parse_slidev_content()
        
        image_files = []
        
        for i, slide in enumerate(slides, 1):
            # Create slide image
            img = Image.new('RGB', (self.video_width, self.video_height), color='white')
            draw = ImageDraw.Draw(img)
            
            # Try to load a font, fall back to default if not available
            try:
                title_font = ImageFont.truetype("Arial.ttf", 72)
                content_font = ImageFont.truetype("Arial.ttf", 36)
            except:
                title_font = ImageFont.load_default()
                content_font = ImageFont.load_default()
            
            # Add slide number
            draw.text((50, 50), f"Slide {i}", fill='gray', font=content_font)
            
            # Add title
            title = slide.get('title', f'Slide {i}')
            title_y = 200
            
            # Word wrap title
            title_lines = self._wrap_text(title, title_font, self.video_width - 100)
            for line in title_lines:
                draw.text((50, title_y), line, fill='black', font=title_font)
                title_y += 80
            
            # Add content
            content = slide.get('content', '')
            content_lines = content.split('\n')
            content_y = title_y + 50
            
            for line in content_lines[:10]:  # Limit to 10 lines
                line = line.strip()
                if line and not line.startswith('#'):
                    # Remove markdown formatting
                    line = line.replace('**', '').replace('*', '').replace('`', '')
                    
                    # Word wrap content
                    wrapped_lines = self._wrap_text(line, content_font, self.video_width - 100)
                    for wrapped_line in wrapped_lines:
                        if content_y < self.video_height - 100:
                            draw.text((50, content_y), wrapped_line, fill='black', font=content_font)
                            content_y += 45
            
            # Save image
            image_file = self.slides_dir / f"slide_{i:02d}.png"
            img.save(image_file)
            image_files.append(str(image_file))
        
        print(f"✅ Generated {len(image_files)} fallback slide images")
        return image_files
    
    def _wrap_text(self, text: str, font, max_width: int) -> List[str]:
        """Wrap text to fit within specified width"""
        words = text.split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            # Approximate text width (fallback for when textsize is not available)
            if len(test_line) * 20 < max_width:  # Rough approximation
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                current_line = [word]
        
        if current_line:
            lines.append(' '.join(current_line))
        
        return lines
    
    def generate_video_clips(self, image_files: List[str], audio_files: List[str]) -> List[VideoClip]:
        """Generate synchronized video clips from images and audio"""
        print("🎬 Creating video clips...")
        
        clips = []
        
        for i, (image_file, audio_file) in enumerate(zip(image_files, audio_files)):
            # Get audio duration
            try:
                if os.path.exists(audio_file):
                    audio_duration = librosa.get_duration(filename=audio_file)
                else:
                    audio_duration = 10.0  # Default duration
            except:
                audio_duration = 10.0  # Fallback
            
            # Create image clip
            image_clip = ImageClip(image_file, duration=audio_duration)
            
            # Add audio if available
            if os.path.exists(audio_file):
                try:
                    audio_clip = AudioFileClip(audio_file)
                    image_clip = image_clip.set_audio(audio_clip)
                except Exception as e:
                    print(f"⚠️  Could not add audio for slide {i+1}: {e}")
            
            # Add fade transitions
            if i == 0:
                image_clip = image_clip.fx(fadein, self.transition_duration)
            
            if i == len(image_files) - 1:
                image_clip = image_clip.fx(fadeout, self.transition_duration)
            
            clips.append(image_clip)
            
        print(f"✅ Created {len(clips)} video clips")
        return clips
    
    def create_final_video(self, clips: List[VideoClip], output_file: str) -> str:
        """Combine all clips into final video"""
        print("🎞️  Creating final video...")
        
        # Concatenate all clips
        final_video = concatenate_videoclips(clips, method="compose")
        
        # Add intro and outro if desired
        final_video = self._add_intro_outro(final_video)
        
        # Export video
        output_path = self.video_dir / output_file
        
        try:
            final_video.write_videofile(
                str(output_path),
                fps=self.fps,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile='temp-audio.m4a',
                remove_temp=True,
                verbose=False,
                logger=None
            )
            
            print(f"✅ Video created: {output_path}")
            return str(output_path)
            
        except Exception as e:
            print(f"❌ Video creation failed: {e}")
            # Try simpler export
            final_video.write_videofile(
                str(output_path),
                fps=self.fps,
                verbose=False,
                logger=None
            )
            return str(output_path)
    
    def _add_intro_outro(self, video: VideoClip) -> VideoClip:
        """Add intro and outro to the video"""
        # Create simple intro slide
        intro_img = Image.new('RGB', (self.video_width, self.video_height), color='#1e3a8a')
        draw = ImageDraw.Draw(intro_img)
        
        # Try to load font
        try:
            font = ImageFont.truetype("Arial.ttf", 64)
        except:
            font = ImageFont.load_default()
        
        # Add intro text
        intro_text = "Computer Security Fundamentals\nLecture 2: CIA Triad"
        text_lines = intro_text.split('\n')
        y = self.video_height // 2 - 100
        
        for line in text_lines:
            # Center text (approximate)
            x = (self.video_width - len(line) * 30) // 2
            draw.text((x, y), line, fill='white', font=font)
            y += 80
        
        # Save intro image
        intro_file = self.slides_dir / "intro.png"
        intro_img.save(intro_file)
        
        # Create intro clip
        intro_clip = ImageClip(str(intro_file), duration=3).fx(fadein, 1).fx(fadeout, 1)
        
        # Create outro
        outro_img = Image.new('RGB', (self.video_width, self.video_height), color='#1e3a8a')
        draw = ImageDraw.Draw(outro_img)
        
        outro_text = "Thank You!\nNext: Computer Security Terminology"
        text_lines = outro_text.split('\n')
        y = self.video_height // 2 - 100
        
        for line in text_lines:
            x = (self.video_width - len(line) * 30) // 2
            draw.text((x, y), line, fill='white', font=font)
            y += 80
        
        # Save outro image
        outro_file = self.slides_dir / "outro.png"
        outro_img.save(outro_file)
        
        # Create outro clip
        outro_clip = ImageClip(str(outro_file), duration=3).fx(fadein, 1).fx(fadeout, 1)
        
        # Combine intro + video + outro
        return concatenate_videoclips([intro_clip, video, outro_clip])
    
    def generate_complete_video(self) -> str:
        """Complete pipeline: slides -> audio -> video"""
        print("🚀 Starting complete video generation pipeline...")
        
        # Step 1: Parse slides and generate scripts
        print("\n1️⃣  Parsing slides and generating scripts...")
        slides = self.voiceover_generator.parse_slidev_content()
        scripts = self.voiceover_generator.generate_voiceover_scripts()
        
        # Step 2: Export slides to images
        print("\n2️⃣  Exporting slides to images...")
        image_files = self.export_slides_to_images()
        
        # Step 3: Generate audio files
        print("\n3️⃣  Generating audio files...")
        try:
            audio_files = self.voiceover_generator.generate_audio_files()
        except Exception as e:
            print(f"⚠️  Audio generation failed: {e}")
            # Create placeholder audio files
            audio_files = []
            for i in range(len(image_files)):
                placeholder = self.audio_dir / f"slide_{i+1:02d}.txt"
                with open(placeholder, 'w') as f:
                    f.write(f"Audio placeholder for slide {i+1}")
                audio_files.append(str(placeholder))
        
        # Step 4: Create video clips
        print("\n4️⃣  Creating synchronized video clips...")
        clips = self.generate_video_clips(image_files, audio_files)
        
        # Step 5: Create final video
        print("\n5️⃣  Creating final video...")
        video_file = self.create_final_video(clips, "computer_security_fundamentals.mp4")
        
        print(f"\n🎉 Video generation complete!")
        print(f"📁 Output directory: {self.output_dir}")
        print(f"🎬 Final video: {video_file}")
        
        return video_file
    
    def create_youtube_metadata(self) -> Dict[str, Any]:
        """Generate YouTube-ready metadata"""
        metadata = {
            "title": "Computer Security Fundamentals - Lecture 2: CIA Triad & Information Security Principles",
            "description": """
📚 Complete lecture on Computer Security Fundamentals covering the CIA Triad and Information Security Principles.

🎯 Topics Covered:
• Confidentiality: Keeping secrets secret
• Integrity: Ensuring data accuracy  
• Availability: Ensuring system access
• Real-world applications and case studies
• Security controls and implementation
• Industry standards and frameworks

👨‍🏫 This lecture is part of the Cyber Security (4353204) course series.

⏰ Chapters:
00:00 Introduction
02:00 CIA Triad Overview
05:00 Confidentiality Deep Dive
12:00 Integrity Principles
18:00 Availability Requirements
25:00 Real-World Applications
30:00 Implementation Best Practices
35:00 Case Studies
40:00 Q&A and Discussion

🔗 Course Resources:
• Slides: Available in description
• Additional materials: [Course website]

#CyberSecurity #InformationSecurity #CIATriad #Security #InfoSec #Education

Generated with AI Voiceover Technology 🤖
            """.strip(),
            "tags": [
                "cybersecurity", "information security", "CIA triad", 
                "confidentiality", "integrity", "availability",
                "computer security", "infosec", "security fundamentals",
                "education", "lecture", "tutorial"
            ],
            "category": "Education",
            "privacy": "public",
            "language": "en"
        }
        
        # Save metadata
        metadata_file = self.output_dir / "youtube_metadata.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"📋 YouTube metadata saved: {metadata_file}")
        return metadata


def main():
    """Main execution function"""
    slide_file = "/Users/milav/Code/gpp/studio/content/resources/study-materials/32-ict/sem-5/4353204-cyber-security/slidev/02-computer-security-fundamentals.md"
    
    # Check if file exists
    if not os.path.exists(slide_file):
        print(f"❌ Slide file not found: {slide_file}")
        return
    
    # Initialize video generator
    print("🎬 Initializing AI Voiceover Video Generator...")
    generator = VideoGenerator(slide_file)
    
    # Generate complete video
    try:
        video_file = generator.generate_complete_video()
        
        # Create YouTube metadata
        metadata = generator.create_youtube_metadata()
        
        print("\n" + "="*60)
        print("🎉 SUCCESS! AI Voiceover Video Generation Complete")
        print("="*60)
        print(f"📁 Output Directory: {generator.output_dir}")
        print(f"🎬 Video File: {video_file}")
        print(f"📊 Slides: {len(generator.voiceover_generator.slides)} slides")
        print(f"🎤 Scripts: {len(generator.voiceover_generator.voiceover_scripts)} voiceovers")
        print("\n🚀 Next Steps:")
        print("1. Review the generated video")
        print("2. Upload to YouTube using the generated metadata")
        print("3. Share with your students!")
        print("\n💡 Tips:")
        print("- Set OPENAI_API_KEY or ELEVENLABS_API_KEY for better TTS")
        print("- Install Slidev for better slide export")
        print("- Customize voiceover scripts in ai_voiceover_generator.py")
        
    except Exception as e:
        print(f"❌ Video generation failed: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Ensure all dependencies are installed")
        print("2. Check that the slide file exists and is valid")
        print("3. Verify you have write permissions in the output directory")


if __name__ == "__main__":
    main()