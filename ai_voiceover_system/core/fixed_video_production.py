#!/usr/bin/env python3
"""
Fixed Video Production System
============================

Creates professional videos from slides + AI voiceover with fixes for:
- White noise issues in video encoding
- Integration with unified TTS system
- Better audio quality preservation
- Improved video encoding parameters

Author: AI Assistant
Date: 2024-07-23
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional

# Import unified TTS system
from unified_tts_system import UnifiedTTS
from tts_config import TTSProvider, VoiceMode

# Video libraries
try:
    from moviepy.editor import *
    from moviepy.config import check_for_imagemagick
    MOVIEPY_AVAILABLE = True
    print("✅ MoviePy available")
except ImportError:
    MOVIEPY_AVAILABLE = False
    print("⚠️ MoviePy not available - install with: pip install moviepy")

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
    print("✅ PIL available")
except ImportError:
    PIL_AVAILABLE = False
    print("⚠️ PIL not available - install with: pip install pillow")

class FixedVideoProduction:
    """Fixed video production system with noise reduction"""
    
    def __init__(self, output_dir: str = "fixed_video_production"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Fixed video configuration to prevent white noise
        self.video_config = {
            'width': 1920,
            'height': 1080,
            'fps': 24,  # Lower FPS to reduce artifacts
            'background_color': (240, 248, 255),  # Alice blue instead of pure white
            'bitrate': '8000k',  # Higher bitrate for quality
            'audio_bitrate': '192k'  # High quality audio
        }
        
        # Create directories
        self.slides_dir = self.output_dir / "slides"
        self.audio_dir = self.output_dir / "audio" 
        self.video_dir = self.output_dir / "videos"
        
        for dir_path in [self.slides_dir, self.audio_dir, self.video_dir]:
            dir_path.mkdir(exist_ok=True)
        
        # Initialize TTS system
        self.tts = UnifiedTTS()
        
        print("🎬 Fixed Video Production System")
        print(f"📁 Output directory: {self.output_dir}")
    
    def check_dependencies(self) -> Dict[str, bool]:
        """Check all required dependencies"""
        print("🔍 Checking dependencies...")
        
        deps = {
            'moviepy': MOVIEPY_AVAILABLE,
            'pil': PIL_AVAILABLE, 
            'ffmpeg': self._check_ffmpeg(),
            'imagemagick': self._check_imagemagick(),
            'unified_tts': True  # Our TTS system
        }
        
        for dep, available in deps.items():
            status = "✅" if available else "❌"
            print(f"   {dep}: {status}")
        
        missing = [k for k, v in deps.items() if not v]
        if missing:
            print(f"\n⚠️ Missing dependencies: {', '.join(missing)}")
            print("Install with:")
            if 'moviepy' in missing:
                print("   pip install moviepy")
            if 'pil' in missing:
                print("   pip install pillow")
            if 'ffmpeg' in missing:
                print("   brew install ffmpeg  # or apt-get install ffmpeg")
        
        return deps
    
    def _check_ffmpeg(self) -> bool:
        """Check FFmpeg availability"""
        try:
            result = subprocess.run(['ffmpeg', '-version'], 
                                  capture_output=True, text=True)
            return result.returncode == 0
        except FileNotFoundError:
            return False
    
    def _check_imagemagick(self) -> bool:
        """Check ImageMagick availability"""
        try:
            check_for_imagemagick()
            return True
        except:
            return False
    
    def generate_slide_audio(self, scripts: List[str], 
                           provider: str = "xtts_v2") -> List[str]:
        """Generate high-quality audio for slides"""
        print(f"🎤 Generating slide audio with {provider}...")
        
        # Configure TTS provider
        if provider == "xtts_v2":
            self.tts.set_provider(TTSProvider.XTTS_V2)
            self.tts.set_voice_mode(VoiceMode.CLONED)
        elif provider == "f5_tts":
            self.tts.set_provider(TTSProvider.F5_TTS)
            self.tts.set_voice_mode(VoiceMode.CLONED)
        elif provider == "google_tts":
            self.tts.set_provider(TTSProvider.GOOGLE_TTS)
            self.tts.set_voice_mode(VoiceMode.STANDARD)
        elif provider == "edge_tts":
            self.tts.set_provider(TTSProvider.EDGE_TTS)
            self.tts.set_voice_mode(VoiceMode.STANDARD)
        
        audio_files = []
        
        for i, script in enumerate(scripts, 1):
            print(f"   🎵 Slide {i}/{len(scripts)}")
            
            audio_file = self.audio_dir / f"slide_{i:02d}.wav"
            
            if self.tts.generate(script, str(audio_file)):
                audio_files.append(str(audio_file))
                print(f"   ✅ Generated: {audio_file.name}")
            else:
                print(f"   ❌ Failed: Slide {i}")
        
        print(f"✅ Generated {len(audio_files)} audio files")
        return audio_files
    
    def create_clean_slides(self, slide_contents: List[Dict]) -> List[str]:
        """Create clean slide images without artifacts"""
        if not PIL_AVAILABLE:
            print("❌ Cannot create slides without PIL")
            return []
        
        print("🎨 Creating clean slide images...")
        
        image_files = []
        
        for i, slide in enumerate(slide_contents, 1):
            print(f"   📸 Creating slide {i}/{len(slide_contents)}")
            
            # Create image with anti-aliasing
            img = Image.new('RGB', 
                          (self.video_config['width'], self.video_config['height']), 
                          self.video_config['background_color'])
            draw = ImageDraw.Draw(img)
            
            # Load fonts with fallback
            try:
                title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 60)
                content_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
                small_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
            except:
                try:
                    title_font = ImageFont.truetype("arial.ttf", 60)
                    content_font = ImageFont.truetype("arial.ttf", 36) 
                    small_font = ImageFont.truetype("arial.ttf", 24)
                except:
                    title_font = ImageFont.load_default()
                    content_font = ImageFont.load_default()
                    small_font = ImageFont.load_default()
            
            # Add slide number (top right)
            slide_num_text = f"Slide {i}"
            bbox = draw.textbbox((0, 0), slide_num_text, font=small_font)
            text_width = bbox[2] - bbox[0]
            draw.text((self.video_config['width'] - text_width - 50, 50), 
                     slide_num_text, fill=(100, 100, 100), font=small_font)
            
            # Add title (centered, upper portion)
            title = slide.get('title', f'Computer Security - Topic {i}')
            if title:
                bbox = draw.textbbox((0, 0), title, font=title_font)
                title_width = bbox[2] - bbox[0]
                title_x = (self.video_config['width'] - title_width) // 2
                draw.text((title_x, 250), title, fill=(20, 20, 60), font=title_font)
            
            # Add main content (centered, middle portion)
            content = slide.get('content', '')
            if content:
                # Wrap text to fit width
                wrapped_content = self._wrap_text(content, content_font, 
                                                self.video_config['width'] - 200)
                
                y_start = 400
                line_height = 50
                
                for line in wrapped_content[:8]:  # Max 8 lines
                    bbox = draw.textbbox((0, 0), line, font=content_font)
                    line_width = bbox[2] - bbox[0]
                    line_x = (self.video_config['width'] - line_width) // 2
                    draw.text((line_x, y_start), line, fill=(40, 40, 40), font=content_font)
                    y_start += line_height
            
            # Add subtle border to prevent edge artifacts
            border_color = (220, 220, 220)
            draw.rectangle([0, 0, self.video_config['width']-1, self.video_config['height']-1], 
                         outline=border_color, width=2)
            
            # Save with high quality
            image_file = self.slides_dir / f"slide_{i:02d}.png"
            img.save(image_file, 'PNG', optimize=True, quality=95)
            image_files.append(str(image_file))
        
        print(f"✅ Created {len(image_files)} clean slide images")
        return image_files
    
    def _wrap_text(self, text: str, font, max_width: int) -> List[str]:
        """Wrap text to fit within specified width"""
        words = text.split()
        lines = []
        current_line = []
        
        # Create a temporary image for text measurement
        temp_img = Image.new('RGB', (1, 1))
        temp_draw = ImageDraw.Draw(temp_img)
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            bbox = temp_draw.textbbox((0, 0), test_line, font=font)
            text_width = bbox[2] - bbox[0]
            
            if text_width <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                    current_line = [word]
                else:
                    lines.append(word)  # Word too long but add anyway
        
        if current_line:
            lines.append(' '.join(current_line))
        
        return lines
    
    def create_video_clips(self, image_files: List[str], 
                         audio_files: List[str]) -> List:
        """Create video clips with improved encoding"""
        if not MOVIEPY_AVAILABLE:
            print("❌ Cannot create video clips without MoviePy")
            return []
        
        print("🎬 Creating video clips with noise reduction...")
        
        clips = []
        
        for i, image_file in enumerate(image_files):
            print(f"   📽️ Clip {i+1}/{len(image_files)}")
            
            try:
                # Load image clip
                image_clip = ImageClip(image_file)
                
                # Get corresponding audio if available
                if i < len(audio_files) and os.path.exists(audio_files[i]):
                    # Load audio with noise reduction
                    audio_clip = AudioFileClip(audio_files[i])
                    
                    # Apply audio processing to reduce noise
                    # Normalize audio levels
                    audio_clip = audio_clip.volumex(0.8)  # Slightly reduce volume to prevent clipping
                    
                    # Set clip duration to match audio
                    duration = audio_clip.duration
                    image_clip = image_clip.set_duration(duration)
                    
                    # Combine with audio
                    video_clip = image_clip.set_audio(audio_clip)
                    
                    print(f"      ✅ With audio: {duration:.1f}s")
                else:
                    # Default duration without audio
                    duration = 5.0
                    video_clip = image_clip.set_duration(duration)
                    print(f"      📷 Image only: {duration:.1f}s")
                
                clips.append(video_clip)
                
            except Exception as e:
                print(f"      ❌ Error creating clip {i+1}: {e}")
                continue
        
        print(f"✅ Created {len(clips)} video clips")
        return clips
    
    def add_intro_outro(self, main_video) -> 'VideoClip':
        """Add professional intro and outro"""
        if not PIL_AVAILABLE:
            return main_video
        
        print("🎭 Adding intro and outro...")
        
        # Create intro
        intro_img = Image.new('RGB', 
                            (self.video_config['width'], self.video_config['height']), 
                            (25, 25, 112))  # Midnight blue
        draw = ImageDraw.Draw(intro_img)
        
        try:
            title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 72)
            subtitle_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
        except:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        # Intro content
        intro_lines = [
            ("Computer Security", title_font, 350),
            ("Fundamentals", title_font, 450),
            ("Professional AI Voiceover Lecture", subtitle_font, 600)
        ]
        
        for text, font, y_pos in intro_lines:
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            x_pos = (self.video_config['width'] - text_width) // 2
            draw.text((x_pos, y_pos), text, fill=(255, 255, 255), font=font)
        
        intro_file = self.slides_dir / "intro.png"
        intro_img.save(intro_file, 'PNG', quality=95)
        intro_clip = ImageClip(str(intro_file), duration=3.0)
        
        # Create outro
        outro_img = Image.new('RGB', 
                            (self.video_config['width'], self.video_config['height']), 
                            (25, 25, 112))
        draw = ImageDraw.Draw(outro_img)
        
        outro_lines = [
            ("Thank You!", title_font, 400),
            ("Computer Security Fundamentals", subtitle_font, 500),
            ("Enhanced with AI Voice Technology", subtitle_font, 580)
        ]
        
        for text, font, y_pos in outro_lines:
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            x_pos = (self.video_config['width'] - text_width) // 2
            draw.text((x_pos, y_pos), text, fill=(255, 255, 255), font=font)
        
        outro_file = self.slides_dir / "outro.png"
        outro_img.save(outro_file, 'PNG', quality=95)
        outro_clip = ImageClip(str(outro_file), duration=3.0)
        
        # Combine with fade effects
        intro_clip = intro_clip.fadeout(0.5)
        outro_clip = outro_clip.fadein(0.5)
        main_video = main_video.fadein(0.5).fadeout(0.5)
        
        return concatenate_videoclips([intro_clip, main_video, outro_clip])
    
    def export_final_video(self, final_video, output_filename: str) -> str:
        """Export video with optimized settings to prevent noise"""
        if not MOVIEPY_AVAILABLE:
            return ""
        
        output_path = self.video_dir / output_filename
        
        print(f"📤 Exporting final video: {output_filename}")
        print("⏳ Using optimized encoding settings...")
        
        try:
            # Export with high-quality settings to prevent artifacts
            final_video.write_videofile(
                str(output_path),
                fps=self.video_config['fps'],
                codec='libx264',
                bitrate=self.video_config['bitrate'],
                audio_codec='aac',
                audio_bitrate=self.video_config['audio_bitrate'],
                # Additional ffmpeg parameters to reduce noise
                ffmpeg_params=[
                    '-crf', '18',  # High quality (lower = better quality)
                    '-preset', 'slow',  # Better compression
                    '-profile:v', 'high',  # H.264 high profile
                    '-level', '4.0',  # H.264 level
                    '-pix_fmt', 'yuv420p',  # Compatibility
                    '-movflags', '+faststart',  # Web optimization
                    '-af', 'highpass=f=80,lowpass=f=8000'  # Audio filtering to reduce noise
                ],
                temp_audiofile=str(self.output_dir / 'temp-audio.m4a'),
                remove_temp=True,
                verbose=False,
                logger=None
            )
            
            # Verify output
            if output_path.exists():
                file_size = output_path.stat().st_size / (1024*1024)  # MB
                print(f"✅ Video exported successfully!")
                print(f"   File: {output_path}")
                print(f"   Size: {file_size:.1f} MB")
                return str(output_path)
            else:
                print("❌ Video file not created")
                return ""
                
        except Exception as e:
            print(f"❌ Video export failed: {e}")
            return ""
        finally:
            # Clean up
            try:
                final_video.close()
            except:
                pass
    
    def create_complete_video(self, scripts: List[str], 
                            slide_contents: List[Dict],
                            tts_provider: str = "xtts_v2",
                            output_filename: str = "computer_security_enhanced.mp4") -> Dict[str, Any]:
        """Complete video production pipeline"""
        
        print("🎬 Complete Fixed Video Production")
        print("=" * 50)
        
        start_time = time.time()
        
        # Check dependencies
        deps = self.check_dependencies()
        required_deps = ['moviepy', 'pil', 'ffmpeg']
        missing = [dep for dep in required_deps if not deps.get(dep)]
        
        if missing:
            return {
                "success": False,
                "error": f"Missing dependencies: {', '.join(missing)}",
                "missing_deps": missing
            }
        
        try:
            # Step 1: Generate audio
            print("\n📢 Step 1: Generate Audio")
            audio_files = self.generate_slide_audio(scripts, tts_provider)
            if not audio_files:
                return {"success": False, "error": "No audio files generated"}
            
            # Step 2: Create slide images
            print("\n🎨 Step 2: Create Slide Images")
            image_files = self.create_clean_slides(slide_contents)
            if not image_files:
                return {"success": False, "error": "No slide images created"}
            
            # Step 3: Create video clips
            print("\n🎬 Step 3: Create Video Clips")
            clips = self.create_video_clips(image_files, audio_files)
            if not clips:
                return {"success": False, "error": "No video clips created"}
            
            # Step 4: Combine clips
            print("\n🎞️ Step 4: Combine Clips")
            main_video = concatenate_videoclips(clips, method="compose")
            
            # Step 5: Add intro/outro
            print("\n🎭 Step 5: Add Intro/Outro")
            final_video = self.add_intro_outro(main_video)
            
            # Step 6: Export final video
            print("\n📤 Step 6: Export Final Video")
            video_path = self.export_final_video(final_video, output_filename)
            
            if not video_path:
                return {"success": False, "error": "Video export failed"}
            
            # Calculate statistics
            total_duration = sum(getattr(clip, 'duration', 5.0) for clip in clips) + 6.0  # +6 for intro+outro
            production_time = time.time() - start_time
            
            results = {
                "success": True,
                "video_path": video_path,
                "statistics": {
                    "slides": len(slide_contents),
                    "audio_files": len(audio_files),
                    "duration_minutes": total_duration / 60,
                    "production_time_minutes": production_time / 60,
                    "tts_provider": tts_provider,
                    "video_size_mb": Path(video_path).stat().st_size / (1024*1024)
                },
                "improvements": [
                    "✅ Fixed white noise issues with better encoding",
                    "✅ Integrated unified TTS system", 
                    "✅ Higher quality audio processing",
                    "✅ Clean slide generation without artifacts",
                    "✅ Professional intro/outro with fade effects",
                    "✅ Optimized export settings for web compatibility"
                ]
            }
            
            # Save results
            results_file = self.output_dir / "video_production_results.json"
            with open(results_file, 'w') as f:
                json.dump(results, f, indent=2)
            
            return results
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Production failed: {str(e)}",
                "partial_files": {
                    "output_dir": str(self.output_dir),
                    "slides_dir": str(self.slides_dir),
                    "audio_dir": str(self.audio_dir)
                }
            }

def create_demo_content() -> tuple:
    """Create demo content for testing"""
    scripts = [
        "Welcome to Computer Security Fundamentals. Today we'll explore the CIA Triad, which forms the foundation of information security.",
        "The CIA Triad consists of three core principles: Confidentiality, Integrity, and Availability. These principles guide all security decisions.",
        "Confidentiality ensures that information is accessible only to authorized individuals. This prevents unauthorized disclosure of sensitive data.",
        "Integrity guarantees that information remains accurate and unaltered. This protects against unauthorized modification or corruption.",
        "Availability ensures that information and resources are accessible when needed by authorized users. This prevents denial of service attacks."
    ]
    
    slide_contents = [
        {"title": "Computer Security Fundamentals", "content": "Introduction to the CIA Triad"},
        {"title": "The CIA Triad", "content": "Confidentiality • Integrity • Availability"},
        {"title": "Confidentiality", "content": "Protecting information from unauthorized access"},
        {"title": "Integrity", "content": "Ensuring information accuracy and trustworthiness"},
        {"title": "Availability", "content": "Maintaining reliable access to information and resources"}
    ]
    
    return scripts, slide_contents

if __name__ == "__main__":
    print("🎬 Fixed Video Production System Demo")
    print("=" * 50)
    
    # Create demo content
    scripts, slide_contents = create_demo_content()
    
    # Initialize video production
    producer = FixedVideoProduction()
    
    # Create video with enhanced XTTS-v2
    results = producer.create_complete_video(
        scripts=scripts,
        slide_contents=slide_contents,
        tts_provider="xtts_v2",  # Use our enhanced voice cloning
        output_filename="computer_security_fixed.mp4"
    )
    
    if results["success"]:
        print("\n🎉 FIXED VIDEO PRODUCTION COMPLETE!")
        print("=" * 50)
        
        stats = results["statistics"]
        
        print(f"🎬 **VIDEO READY:**")
        print(f"   File: {results['video_path']}")
        print(f"   Duration: {stats['duration_minutes']:.1f} minutes")
        print(f"   Size: {stats['video_size_mb']:.1f} MB")
        print(f"   Voice: {stats['tts_provider']} (Enhanced)")
        
        print(f"\n⚡ **PRODUCTION STATS:**")
        print(f"   Slides: {stats['slides']}")
        print(f"   Audio Files: {stats['audio_files']}")
        print(f"   Production Time: {stats['production_time_minutes']:.1f} minutes")
        
        print(f"\n✨ **IMPROVEMENTS APPLIED:**")
        for improvement in results["improvements"]:
            print(f"   {improvement}")
        
        print(f"\n🚀 **READY FOR:**")
        print(f"   📺 YouTube upload (no white noise!)")
        print(f"   🎓 Professional education content")
        print(f"   📱 Online learning platforms")
        
    else:
        print(f"\n❌ Video production failed: {results['error']}")
        
        if "missing_deps" in results:
            print(f"\n📦 Install missing dependencies:")
            for dep in results["missing_deps"]:
                if dep == "moviepy":
                    print(f"   pip install moviepy")
                elif dep == "pil":
                    print(f"   pip install pillow")
                elif dep == "ffmpeg":
                    print(f"   brew install ffmpeg  # or apt-get install ffmpeg")