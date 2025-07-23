#!/usr/bin/env python3
"""
Complete Video Production System
================================

Creates professional videos from Slidev slides + AI voiceover audio.
Integrates slide export, audio synchronization, and final video production.

Author: AI Assistant
Date: 2024-07-23
"""

import os
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Any, Tuple
import json
import time
import glob

# Try importing video libraries
try:
    from moviepy.editor import *
    MOVIEPY_AVAILABLE = True
    print("✅ MoviePy available for video generation")
except ImportError:
    MOVIEPY_AVAILABLE = False
    print("⚠️  MoviePy not available")

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
    print("✅ PIL available for slide generation")
except ImportError:
    PIL_AVAILABLE = False
    print("⚠️  PIL not available")


class VideoProductionSystem:
    """Complete video production pipeline"""
    
    def __init__(self, slide_file: str, audio_dir: str, output_dir: str = "video_production"):
        self.slide_file = Path(slide_file)
        self.audio_dir = Path(audio_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Video configuration
        self.video_width = 1920
        self.video_height = 1080
        self.fps = 30
        self.background_color = (255, 255, 255)  # White background
        
        # Directories
        self.slides_dir = self.output_dir / "slides"
        self.video_dir = self.output_dir / "videos"
        
        for dir_path in [self.slides_dir, self.video_dir]:
            dir_path.mkdir(exist_ok=True)
    
    def check_dependencies(self) -> Dict[str, bool]:
        """Check required dependencies"""
        print("🔍 Checking video production dependencies...")
        
        deps = {
            "moviepy": MOVIEPY_AVAILABLE,
            "pil": PIL_AVAILABLE,
            "ffmpeg": self._check_ffmpeg(),
            "slidev": self._check_slidev()
        }
        
        for dep, available in deps.items():
            status = "✅" if available else "❌"
            print(f"   {dep}: {status}")
        
        return deps
    
    def _check_ffmpeg(self) -> bool:
        """Check if FFmpeg is available"""
        try:
            subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
            return True
        except:
            return False
    
    def _check_slidev(self) -> bool:
        """Check if Slidev is available"""
        try:
            subprocess.run(["npx", "slidev", "--version"], capture_output=True, check=True)
            return True
        except:
            return False
    
    def export_slides_as_images(self) -> List[str]:
        """Export Slidev slides as individual images"""
        print("📸 Exporting slides as images...")
        
        # Try Slidev export first
        if self._check_slidev():
            return self._export_with_slidev()
        else:
            print("🔄 Slidev not available, using fallback slide generation")
            return self._generate_fallback_slides()
    
    def _export_with_slidev(self) -> List[str]:
        """Export slides using Slidev"""
        try:
            print("🎨 Using Slidev to export slides...")
            
            # Change to slide directory
            slide_dir = self.slide_file.parent
            
            # Run Slidev export
            cmd = [
                "npx", "slidev", "export",
                "--format", "png",
                "--output", str(self.slides_dir),
                "--width", str(self.video_width),
                "--height", str(self.video_height),
                str(self.slide_file.name)
            ]
            
            result = subprocess.run(cmd, cwd=slide_dir, capture_output=True, text=True)
            
            if result.returncode == 0:
                # Find exported images
                image_files = sorted(self.slides_dir.glob("*.png"))
                print(f"✅ Exported {len(image_files)} slides with Slidev")
                return [str(f) for f in image_files]
            else:
                print(f"⚠️  Slidev export failed: {result.stderr}")
                return self._generate_fallback_slides()
        
        except Exception as e:
            print(f"❌ Slidev export error: {e}")
            return self._generate_fallback_slides()
    
    def _generate_fallback_slides(self) -> List[str]:
        """Generate fallback slide images"""
        if not PIL_AVAILABLE:
            print("❌ Cannot generate fallback slides without PIL")
            return []
        
        print("🎨 Generating fallback slide images...")
        
        # Parse slide content (simplified)
        with open(self.slide_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split by slide separators
        slides = content.split('\n---\n')[1:]  # Skip frontmatter
        
        image_files = []
        
        for i, slide_content in enumerate(slides, 1):
            # Extract title
            title = self._extract_slide_title(slide_content)
            
            # Create slide image
            img = Image.new('RGB', (self.video_width, self.video_height), self.background_color)
            draw = ImageDraw.Draw(img)
            
            # Try to load fonts
            try:
                title_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 72)
                content_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 36)
            except:
                title_font = ImageFont.load_default()
                content_font = ImageFont.load_default()
            
            # Add slide number
            draw.text((50, 50), f"Slide {i}", fill=(128, 128, 128), font=content_font)
            
            # Add title
            if title:
                # Center title
                title_bbox = draw.textbbox((0, 0), title, font=title_font)
                title_width = title_bbox[2] - title_bbox[0]
                title_x = (self.video_width - title_width) // 2
                draw.text((title_x, 300), title, fill=(0, 0, 0), font=title_font)
            
            # Add content preview
            content_preview = self._extract_slide_content(slide_content)
            if content_preview:
                draw.text((100, 500), content_preview[:200] + "...", fill=(64, 64, 64), font=content_font)
            
            # Save slide image
            image_file = self.slides_dir / f"slide_{i:02d}.png"
            img.save(image_file)
            image_files.append(str(image_file))
        
        print(f"✅ Generated {len(image_files)} fallback slides")
        return image_files
    
    def _extract_slide_title(self, slide_content: str) -> str:
        """Extract title from slide content"""
        lines = slide_content.split('\n')
        for line in lines:
            line = line.strip()
            if line.startswith('# '):
                return line[2:].strip()
        return ""
    
    def _extract_slide_content(self, slide_content: str) -> str:
        """Extract readable content from slide"""
        # Remove markdown and HTML
        content = slide_content
        content = content.replace('**', '').replace('*', '')
        content = content.replace('`', '')
        
        # Extract meaningful lines
        lines = []
        for line in content.split('\n'):
            line = line.strip()
            if line and not line.startswith('#') and not line.startswith('<') and not line.startswith('```'):
                lines.append(line)
                if len(lines) >= 5:  # Limit preview
                    break
        
        return ' '.join(lines)
    
    def get_audio_files(self) -> List[Dict[str, Any]]:
        """Get available audio files with metadata"""
        print("🎵 Scanning for audio files...")
        
        audio_files = []
        
        # Scan for audio files
        audio_patterns = ['*.mp3', '*.wav', '*.m4a']
        
        for pattern in audio_patterns:
            for audio_file in self.audio_dir.glob(pattern):
                # Extract slide number from filename
                slide_num = self._extract_slide_number(audio_file.name)
                
                if slide_num:
                    file_info = {
                        'slide_number': slide_num,
                        'file_path': str(audio_file),
                        'file_size': audio_file.stat().st_size,
                        'format': audio_file.suffix.lower()
                    }
                    audio_files.append(file_info)
        
        # Sort by slide number
        audio_files.sort(key=lambda x: x['slide_number'])
        
        print(f"✅ Found {len(audio_files)} audio files")
        return audio_files
    
    def _extract_slide_number(self, filename: str) -> int:
        """Extract slide number from filename"""
        import re
        match = re.search(r'slide_(\d+)', filename.lower())
        return int(match.group(1)) if match else 0
    
    def create_video_clips(self, image_files: List[str], audio_files: List[Dict]) -> List:
        """Create video clips from images and audio"""
        if not MOVIEPY_AVAILABLE:
            print("❌ Cannot create video clips without MoviePy")
            return []
        
        print("🎬 Creating video clips...")
        
        clips = []
        
        # Create audio lookup
        audio_lookup = {af['slide_number']: af for af in audio_files}
        
        for i, image_file in enumerate(image_files, 1):
            print(f"📽️  Creating clip {i}/{len(image_files)}")
            
            # Get corresponding audio
            audio_info = audio_lookup.get(i)
            
            if audio_info:
                # Create clip with audio
                try:
                    audio_clip = AudioFileClip(audio_info['file_path'])
                    duration = audio_clip.duration
                    
                    image_clip = ImageClip(image_file, duration=duration)
                    video_clip = image_clip.set_audio(audio_clip)
                    
                    clips.append(video_clip)
                    print(f"   ✅ Slide {i}: {duration:.1f}s with audio")
                    
                except Exception as e:
                    print(f"   ⚠️  Audio error for slide {i}: {e}")
                    # Fallback to image only
                    image_clip = ImageClip(image_file, duration=5.0)
                    clips.append(image_clip)
            else:
                # Image only with default duration
                image_clip = ImageClip(image_file, duration=5.0)
                clips.append(image_clip)
                print(f"   📷 Slide {i}: 5.0s (no audio)")
        
        print(f"✅ Created {len(clips)} video clips")
        return clips
    
    def create_final_video(self, clips: List, output_filename: str = "computer_security_fundamentals.mp4") -> str:
        """Combine clips into final video"""
        if not MOVIEPY_AVAILABLE or not clips:
            print("❌ Cannot create final video")
            return ""
        
        print("🎞️  Creating final video...")
        
        try:
            # Concatenate all clips
            final_video = concatenate_videoclips(clips, method="compose")
            
            # Add intro and outro
            final_video = self._add_intro_outro(final_video)
            
            # Export video
            output_path = self.video_dir / output_filename
            
            print(f"📤 Exporting video to {output_path}")
            print("⏳ This may take several minutes...")
            
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
            
            # Clean up clips
            for clip in clips:
                clip.close()
            final_video.close()
            
            print(f"✅ Video created successfully: {output_path}")
            return str(output_path)
            
        except Exception as e:
            print(f"❌ Video creation failed: {e}")
            return ""
    
    def _add_intro_outro(self, video):
        """Add intro and outro to video"""
        if not PIL_AVAILABLE:
            return video
        
        # Create intro slide
        intro_img = Image.new('RGB', (self.video_width, self.video_height), (30, 58, 138))  # Blue background
        draw = ImageDraw.Draw(intro_img)
        
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 64)
        except:
            font = ImageFont.load_default()
        
        # Add intro text
        intro_lines = [
            "Computer Security Fundamentals",
            "Lecture 2: CIA Triad",
            "Information Security Principles"
        ]
        
        y_start = 400
        for i, line in enumerate(intro_lines):
            # Center text
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            x = (self.video_width - text_width) // 2
            draw.text((x, y_start + i * 80), line, fill=(255, 255, 255), font=font)
        
        # Save intro image
        intro_file = self.slides_dir / "intro.png"
        intro_img.save(intro_file)
        
        # Create intro clip
        intro_clip = ImageClip(str(intro_file), duration=3.0)
        
        # Create outro
        outro_img = Image.new('RGB', (self.video_width, self.video_height), (30, 58, 138))
        draw = ImageDraw.Draw(outro_img)
        
        outro_lines = [
            "Thank You!",
            "Computer Security Fundamentals Complete",
            "Next: Computer Security Terminology"
        ]
        
        y_start = 450
        for i, line in enumerate(outro_lines):
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            x = (self.video_width - text_width) // 2
            draw.text((x, y_start + i * 80), line, fill=(255, 255, 255), font=font)
        
        outro_file = self.slides_dir / "outro.png"
        outro_img.save(outro_file)
        
        outro_clip = ImageClip(str(outro_file), duration=3.0)
        
        # Combine intro + video + outro
        return concatenate_videoclips([intro_clip, video, outro_clip])
    
    def create_complete_video(self) -> Dict[str, Any]:
        """Complete video production pipeline"""
        print("🎬 Complete Video Production Pipeline")
        print("=" * 60)
        
        # Check dependencies
        deps = self.check_dependencies()
        
        if not deps.get('moviepy') and not deps.get('pil'):
            print("❌ Missing required dependencies for video production")
            return {"success": False, "error": "Missing dependencies"}
        
        # Export slides as images
        image_files = self.export_slides_as_images()
        if not image_files:
            return {"success": False, "error": "No slide images generated"}
        
        # Get audio files
        audio_files = self.get_audio_files()
        
        # Create video clips
        clips = self.create_video_clips(image_files, audio_files)
        if not clips:
            return {"success": False, "error": "No video clips created"}
        
        # Create final video
        video_path = self.create_final_video(clips)
        if not video_path:
            return {"success": False, "error": "Final video creation failed"}
        
        # Calculate statistics
        total_duration = sum(getattr(clip, 'duration', 5.0) for clip in clips)
        video_size = Path(video_path).stat().st_size / (1024*1024)  # MB
        
        results = {
            "success": True,
            "video_path": video_path,
            "statistics": {
                "slides": len(image_files),
                "audio_files": len(audio_files),
                "duration_minutes": total_duration / 60,
                "video_size_mb": video_size,
                "resolution": f"{self.video_width}x{self.video_height}",
                "fps": self.fps
            },
            "files_created": {
                "slides_dir": str(self.slides_dir),
                "video_file": video_path,
                "output_dir": str(self.output_dir)
            }
        }
        
        # Save results
        results_file = self.output_dir / "video_production_results.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        return results


def main():
    """Run complete video production"""
    slide_file = "/Users/milav/Code/gpp/studio/content/resources/study-materials/32-ict/sem-5/4353204-cyber-security/slidev/02-computer-security-fundamentals.md"
    audio_dir = "/Users/milav/Code/gpp/studio/voice_cloned_output/audio"
    
    if not os.path.exists(slide_file):
        print(f"❌ Slide file not found: {slide_file}")
        return
    
    if not os.path.exists(audio_dir):
        print(f"❌ Audio directory not found: {audio_dir}")
        return
    
    print("🎬 Video Production System")
    print("=" * 50)
    print("Creating professional video from slides + AI voiceover...")
    
    # Initialize video production
    producer = VideoProductionSystem(slide_file, audio_dir)
    
    # Create complete video
    results = producer.create_complete_video()
    
    if results["success"]:
        print("\n" + "=" * 50)
        print("🎉 VIDEO PRODUCTION COMPLETE!")
        print("=" * 50)
        
        stats = results["statistics"]
        files = results["files_created"]
        
        print(f"🎬 **FINAL VIDEO READY:**")
        print(f"   File: {files['video_file']}")
        print(f"   Duration: {stats['duration_minutes']:.1f} minutes")
        print(f"   Size: {stats['video_size_mb']:.1f} MB")
        print(f"   Resolution: {stats['resolution']} @ {stats['fps']} FPS")
        
        print(f"\n📊 **PRODUCTION STATS:**")
        print(f"   Slides: {stats['slides']} images")
        print(f"   Audio: {stats['audio_files']} voiceover files")
        print(f"   Quality: Professional HD video")
        
        print(f"\n🚀 **READY FOR:**")
        print(f"   📤 YouTube upload")
        print(f"   🎓 Student distribution")
        print(f"   📱 Online learning platforms")
        
        print(f"\n🎯 **ACHIEVEMENT:**")
        print(f"   Computer Security Fundamentals transformed from")
        print(f"   static slides → professional AI voiceover video!")
        
    else:
        print("\n❌ Video production failed:")
        print(f"   Error: {results.get('error', 'Unknown error')}")
        
        print(f"\n🔧 Troubleshooting suggestions:")
        print(f"   1. Install dependencies: pip install moviepy pillow")
        print(f"   2. Check audio files are available")
        print(f"   3. Ensure sufficient disk space")


if __name__ == "__main__":
    main()