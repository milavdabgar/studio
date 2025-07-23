#!/usr/bin/env python3
"""
Advanced Video Assembler
=========================

Professional video assembly with:
- Advanced transitions and effects
- Audio synchronization and enhancement
- Professional styling and branding
- Optimized rendering

Author: AI Assistant
Date: 2024-07-23
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

try:
    import moviepy
    from moviepy import ImageClip, AudioFileClip, concatenate_videoclips, ColorClip, CompositeAudioClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False


class AdvancedVideoAssembler:
    """Professional video assembly with advanced features"""
    
    def __init__(self, output_dir: Path = Path("advanced_video_output")):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories
        self.temp_dir = self.output_dir / "temp"
        self.assets_dir = self.output_dir / "assets"
        self.final_dir = self.output_dir / "final"
        
        for dir_path in [self.temp_dir, self.assets_dir, self.final_dir]:
            dir_path.mkdir(exist_ok=True)
        
        # Video settings
        self.video_width = 1920
        self.video_height = 1080
        self.fps = 30
        
        # Brand colors and styling
        self.brand_colors = {
            'primary': (30, 58, 138),    # Dark blue
            'secondary': (59, 130, 246), # Light blue
            'accent': (16, 185, 129),    # Green
            'text': (31, 41, 55),        # Dark gray
            'background': (249, 250, 251) # Light gray
        }
        
        # Transition settings
        self.transition_duration = 1.0
        self.fade_duration = 0.5
        
        # Audio settings
        self.audio_fade_duration = 0.3
        self.background_music_volume = 0.1
    
    def create_professional_intro(self, title: str, subtitle: str = ""):
        """Create professional intro with animations"""
        if not PIL_AVAILABLE:
            return None
        
        print("🎬 Creating professional intro...")
        
        # Create intro background with gradient
        intro_img = self._create_gradient_background()
        draw = ImageDraw.Draw(intro_img)
        
        # Load fonts
        try:
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 80)
            subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 48)
            accent_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 36)
        except:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
            accent_font = ImageFont.load_default()
        
        # Add logo area (placeholder)
        logo_area = (self.video_width // 2 - 100, 200, self.video_width // 2 + 100, 300)
        draw.rounded_rectangle(logo_area, radius=20, fill=self.brand_colors['accent'])
        
        # Add main title
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = (self.video_width - title_width) // 2
        title_y = 400
        
        # Add text shadow effect
        shadow_offset = 3
        draw.text((title_x + shadow_offset, title_y + shadow_offset), title, 
                 fill=(0, 0, 0, 100), font=title_font)
        draw.text((title_x, title_y), title, fill=(255, 255, 255), font=title_font)
        
        # Add subtitle
        if subtitle:
            subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
            subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
            subtitle_x = (self.video_width - subtitle_width) // 2
            subtitle_y = title_y + 100
            draw.text((subtitle_x, subtitle_y), subtitle, fill=(200, 200, 200), font=subtitle_font)
        
        # Add accent line
        line_y = subtitle_y + 80 if subtitle else title_y + 100
        line_start = (self.video_width // 2 - 200, line_y)
        line_end = (self.video_width // 2 + 200, line_y)
        draw.line([line_start, line_end], fill=self.brand_colors['accent'], width=4)
        
        # Add professional text
        professional_text = "AI-Generated Educational Content"
        prof_bbox = draw.textbbox((0, 0), professional_text, font=accent_font)
        prof_width = prof_bbox[2] - prof_bbox[0]
        prof_x = (self.video_width - prof_width) // 2
        prof_y = line_y + 40
        draw.text((prof_x, prof_y), professional_text, fill=(180, 180, 180), font=accent_font)
        
        # Save intro image
        intro_file = self.temp_dir / "professional_intro.png"
        intro_img.save(intro_file)
        
        # Create animated intro clip
        if MOVIEPY_AVAILABLE:
            intro_clip = ImageClip(str(intro_file), duration=4.0)
            
            # Add fade in animation
            intro_clip = intro_clip.fadein(1.0)
            
            return intro_clip
        
        return None
    
    def create_professional_outro(self, title: str = "Thank You"):
        """Create professional outro"""
        if not PIL_AVAILABLE:
            return None
        
        print("🎬 Creating professional outro...")
        
        # Create outro background
        outro_img = self._create_gradient_background(reverse=True)
        draw = ImageDraw.Draw(outro_img)
        
        # Load fonts
        try:
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 90)
            subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 42)
        except:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        # Add main title
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = (self.video_width - title_width) // 2
        title_y = 350
        
        # Add text with shadow
        shadow_offset = 4
        draw.text((title_x + shadow_offset, title_y + shadow_offset), title, 
                 fill=(0, 0, 0, 120), font=title_font)
        draw.text((title_x, title_y), title, fill=(255, 255, 255), font=title_font)
        
        # Add closing message
        closing_messages = [
            "Generated with AI Voice Cloning Technology",
            "Professional Educational Content Creation",
            "Visit our channel for more AI-generated courses"
        ]
        
        y_pos = title_y + 120
        for message in closing_messages:
            msg_bbox = draw.textbbox((0, 0), message, font=subtitle_font)
            msg_width = msg_bbox[2] - msg_bbox[0]
            msg_x = (self.video_width - msg_width) // 2
            draw.text((msg_x, y_pos), message, fill=(200, 200, 200), font=subtitle_font)
            y_pos += 60
        
        # Add decorative elements
        self._add_decorative_elements(draw)
        
        # Save outro image
        outro_file = self.temp_dir / "professional_outro.png"
        outro_img.save(outro_file)
        
        if MOVIEPY_AVAILABLE:
            outro_clip = ImageClip(str(outro_file), duration=4.0)
            outro_clip = outro_clip.fadeout(1.0)
            return outro_clip
        
        return None
    
    def _create_gradient_background(self, reverse: bool = False) -> Image.Image:
        """Create gradient background"""
        img = Image.new('RGB', (self.video_width, self.video_height))
        
        if NUMPY_AVAILABLE:
            # Create gradient using numpy
            gradient = np.zeros((self.video_height, self.video_width, 3), dtype=np.uint8)
            
            for y in range(self.video_height):
                if reverse:
                    ratio = 1.0 - (y / self.video_height)
                else:
                    ratio = y / self.video_height
                
                # Interpolate between brand colors
                r = int(self.brand_colors['primary'][0] * (1 - ratio) + 
                       self.brand_colors['secondary'][0] * ratio)
                g = int(self.brand_colors['primary'][1] * (1 - ratio) + 
                       self.brand_colors['secondary'][1] * ratio)
                b = int(self.brand_colors['primary'][2] * (1 - ratio) + 
                       self.brand_colors['secondary'][2] * ratio)
                
                gradient[y, :] = [r, g, b]
            
            img = Image.fromarray(gradient)
        else:
            # Simple solid color fallback
            img = Image.new('RGB', (self.video_width, self.video_height), 
                          self.brand_colors['primary'])
        
        return img
    
    def _add_decorative_elements(self, draw: ImageDraw.Draw):
        """Add decorative elements to slides"""
        # Add corner accents
        corner_size = 50
        
        # Top left accent
        draw.polygon([
            (0, 0), (corner_size, 0), (0, corner_size)
        ], fill=self.brand_colors['accent'])
        
        # Bottom right accent
        draw.polygon([
            (self.video_width, self.video_height),
            (self.video_width - corner_size, self.video_height),
            (self.video_width, self.video_height - corner_size)
        ], fill=self.brand_colors['accent'])
        
        # Add subtle geometric patterns
        for i in range(5):
            x = self.video_width - 200 + i * 30
            y = 100 + i * 40
            draw.ellipse([x, y, x + 20, y + 20], 
                        fill=(*self.brand_colors['accent'], 50))
    
    def enhance_slide_image(self, image_path: str, slide_number: int) -> str:
        """Enhance slide image with professional styling"""
        if not PIL_AVAILABLE:
            return image_path
        
        try:
            # Load original image
            img = Image.open(image_path)
            
            # Create enhanced version with border and effects
            enhanced = Image.new('RGB', (self.video_width, self.video_height), 
                               self.brand_colors['background'])
            
            # Add subtle shadow
            shadow = Image.new('RGBA', img.size, (0, 0, 0, 50))
            enhanced.paste(shadow, (8, 8))
            enhanced.paste(img, (0, 0))
            
            # Add slide number badge
            draw = ImageDraw.Draw(enhanced)
            
            # Slide number badge
            badge_x, badge_y = self.video_width - 120, 30
            badge_size = 60
            draw.ellipse([badge_x, badge_y, badge_x + badge_size, badge_y + badge_size],
                        fill=self.brand_colors['accent'])
            
            try:
                badge_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
            except:
                badge_font = ImageFont.load_default()
            
            badge_text = str(slide_number)
            bbox = draw.textbbox((0, 0), badge_text, font=badge_font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            text_x = badge_x + (badge_size - text_width) // 2
            text_y = badge_y + (badge_size - text_height) // 2
            draw.text((text_x, text_y), badge_text, fill=(255, 255, 255), font=badge_font)
            
            # Add bottom brand line
            line_y = self.video_height - 20
            draw.rectangle([0, line_y, self.video_width, line_y + 8], 
                          fill=self.brand_colors['accent'])
            
            # Save enhanced image
            enhanced_path = self.temp_dir / f"enhanced_slide_{slide_number:02d}.png"
            enhanced.save(enhanced_path)
            
            return str(enhanced_path)
            
        except Exception as e:
            print(f"⚠️  Image enhancement failed: {e}")
            return image_path
    
    def create_transition_clip(self, duration: float = 1.0) -> Optional:
        """Create smooth transition between slides"""
        if not MOVIEPY_AVAILABLE:
            return None
        
        # Create a simple fade transition
        # In a more advanced implementation, you could add:
        # - Slide transitions, wipe effects, etc.
        
        # For now, return a short black clip for transitions
        black_clip = ColorClip(size=(self.video_width, self.video_height), 
                              color=(0, 0, 0), duration=duration)
        return black_clip.fadein(duration/2).fadeout(duration/2)
    
    def enhance_audio_clip(self, audio_path: str) -> Optional:
        """Enhance audio quality and add effects"""
        if not MOVIEPY_AVAILABLE or not os.path.exists(audio_path):
            return None
        
        try:
            audio_clip = AudioFileClip(audio_path)
            
            # Apply audio enhancements
            enhanced_audio = audio_clip
            
            # Normalize audio levels
            try:
                enhanced_audio = audio_normalize(enhanced_audio)
            except:
                pass  # Skip if normalize not available
            
            # Add fade in/out
            enhanced_audio = enhanced_audio.audio_fadein(self.audio_fade_duration)
            enhanced_audio = enhanced_audio.audio_fadeout(self.audio_fade_duration)
            
            return enhanced_audio
            
        except Exception as e:
            print(f"⚠️  Audio enhancement failed: {e}")
            return AudioFileClip(audio_path) if os.path.exists(audio_path) else None
    
    def add_background_music(self, main_audio_duration: float) -> Optional:
        """Add subtle background music"""
        # This would typically load a background music file
        # For now, we'll skip this feature
        return None
    
    def create_professional_video(self, slides_data: List[Dict], 
                                image_files: List[str], 
                                audio_files: List[str],
                                title: str = "AI Generated Presentation") -> str:
        """Create professional video with all enhancements"""
        
        if not MOVIEPY_AVAILABLE:
            print("❌ MoviePy required for video creation")
            return ""
        
        print("🎬 Creating professional video...")
        
        all_clips = []
        
        # Create intro
        intro_clip = self.create_professional_intro(title)
        if intro_clip:
            all_clips.append(intro_clip)
        
        # Process each slide
        for i, (slide_data, image_file, audio_file) in enumerate(zip(slides_data, image_files, audio_files)):
            print(f"🎞️  Processing slide {i + 1}/{len(slides_data)}")
            
            # Enhance slide image
            enhanced_image = self.enhance_slide_image(image_file, i + 1)
            
            # Create video clip
            if audio_file and os.path.exists(audio_file):
                # Enhanced audio
                audio_clip = self.enhance_audio_clip(audio_file)
                duration = audio_clip.duration if audio_clip else 5.0
                
                # Create image clip
                image_clip = ImageClip(enhanced_image, duration=duration)
                
                # Combine with audio
                if audio_clip:
                    video_clip = image_clip.set_audio(audio_clip)
                else:
                    video_clip = image_clip
                
                # Add slide transitions
                if i > 0:  # Add fade-in for all slides except first
                    video_clip = video_clip.fadein(self.fade_duration)
                
                all_clips.append(video_clip)
                
                # Add transition clip between slides (optional)
                if i < len(slides_data) - 1:
                    transition = self.create_transition_clip(0.3)
                    if transition:
                        all_clips.append(transition)
            
            else:
                # Image only clip
                image_clip = ImageClip(enhanced_image, duration=5.0)
                image_clip = image_clip.fadein(self.fade_duration)
                all_clips.append(image_clip)
        
        # Create outro
        outro_clip = self.create_professional_outro()
        if outro_clip:
            all_clips.append(outro_clip)
        
        if not all_clips:
            print("❌ No clips to assemble")
            return ""
        
        # Concatenate all clips
        print("🔗 Concatenating video clips...")
        final_video = concatenate_videoclips(all_clips, method="compose")
        
        # Add background music if available
        background_music = self.add_background_music(final_video.duration)
        if background_music:
            # Mix background music with main audio
            final_audio = CompositeAudioClip([
                final_video.audio,
                background_music.volumex(self.background_music_volume)
            ])
            final_video = final_video.set_audio(final_audio)
        
        # Export final video
        output_filename = f"{title.lower().replace(' ', '_')}_professional.mp4"
        output_path = self.final_dir / output_filename
        
        print(f"📤 Exporting professional video to {output_path}")
        print("⏳ This may take several minutes...")
        
        try:
            final_video.write_videofile(
                str(output_path),
                fps=self.fps,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile=str(self.temp_dir / 'temp_audio.m4a'),
                remove_temp=True,
                verbose=False,
                logger=None,
                preset='medium',  # Balance between quality and speed
                ffmpeg_params=['-crf', '18']  # High quality
            )
            
            # Clean up clips
            for clip in all_clips:
                clip.close()
            final_video.close()
            
            print(f"✅ Professional video created: {output_path}")
            return str(output_path)
            
        except Exception as e:
            print(f"❌ Video export failed: {e}")
            return ""


def main():
    """Test the advanced video assembler"""
    print("🎬 Advanced Video Assembler Test")
    print("=" * 50)
    
    assembler = AdvancedVideoAssembler()
    
    # Create sample data
    sample_slides = [
        {'number': 1, 'title': 'Introduction', 'content': ['Welcome to our presentation']},
        {'number': 2, 'title': 'Key Concepts', 'content': ['Important information here']},
    ]
    
    # This would normally use actual image and audio files
    # For testing, we'll just create the intro/outro
    intro = assembler.create_professional_intro("Test Presentation", "AI Generated Content")
    outro = assembler.create_professional_outro()
    
    if intro:
        print("✅ Professional intro created")
    if outro:
        print("✅ Professional outro created")
    
    print("🚀 Advanced Video Assembler ready for use!")


if __name__ == "__main__":
    main()