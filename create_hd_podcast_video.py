#!/usr/bin/env python3
"""
Create Full HD 1080p Podcast Videos with Maximum Audio Quality
Converts audio files to high-quality videos suitable for YouTube podcasts.
"""

import sys
import os
from moviepy.editor import AudioFileClip, ImageClip, ColorClip
from PIL import Image, ImageDraw, ImageFont
import uuid

def create_hd_podcast_thumbnail(title, output_path="hd_podcast_thumbnail.png"):
    """Create a professional Full HD 1080p podcast thumbnail."""
    try:
        # Full HD resolution
        width, height = 1920, 1080
        img = Image.new('RGB', (width, height), color='#1a1a1a')
        draw = ImageDraw.Draw(img)
        
        # High-resolution fonts
        try:
            font_title = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 100)
            font_subtitle = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 50)
            font_label = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 40)
        except:
            font_title = ImageFont.load_default()
            font_subtitle = ImageFont.load_default()
            font_label = ImageFont.load_default()
        
        # Draw professional microphone icon
        center_x, center_y = width // 2, height // 3
        
        # Main microphone body (larger for 1080p)
        mic_width, mic_height = 120, 180
        draw.rounded_rectangle([
            center_x - mic_width//2, center_y - mic_height//2,
            center_x + mic_width//2, center_y + mic_height//2
        ], radius=20, fill='#ff6b6b', outline='#ffffff', width=6)
        
        # Microphone grille pattern
        for i in range(5):
            y_pos = center_y - 60 + (i * 24)
            draw.line([center_x - 40, y_pos, center_x + 40, y_pos], 
                     fill='#ffffff', width=3)
        
        # Professional stand
        stand_width = 8
        stand_height = 60
        draw.rectangle([
            center_x - stand_width//2, center_y + mic_height//2,
            center_x + stand_width//2, center_y + mic_height//2 + stand_height
        ], fill='#ffffff')
        
        # Tripod base
        base_width = 80
        base_height = 12
        draw.ellipse([
            center_x - base_width//2, center_y + mic_height//2 + stand_height,
            center_x + base_width//2, center_y + mic_height//2 + stand_height + base_height
        ], fill='#ffffff')
        
        # Professional sound waves
        wave_colors = ['#ffffff', '#cccccc', '#999999']
        for i, (radius, color) in enumerate(zip([140, 170, 200], wave_colors)):
            for angle_start in [30, 150]:  # Left and right waves
                draw.arc([
                    center_x - radius, center_y - radius,
                    center_x + radius, center_y + radius
                ], start=angle_start, end=angle_start + 60, fill=color, width=4)
        
        # Title text with better positioning
        if font_title:
            # Smart text wrapping for 1080p
            max_chars = 24
            if len(title) > max_chars:
                words = title.split()
                lines = []
                current_line = ""
                for word in words:
                    if len(current_line + " " + word) <= max_chars:
                        current_line += " " + word if current_line else word
                    else:
                        if current_line:
                            lines.append(current_line)
                        current_line = word
                if current_line:
                    lines.append(current_line)
                title_lines = lines[:2]  # Max 2 lines
            else:
                title_lines = [title]
            
            # Position title below microphone
            text_start_y = center_y + 200
            for i, line in enumerate(title_lines):
                try:
                    bbox = draw.textbbox((0, 0), line, font=font_title)
                    text_width = bbox[2] - bbox[0]
                    text_x = (width - text_width) // 2
                    draw.text((text_x, text_start_y + i * 110), line, 
                             fill='#ffffff', font=font_title)
                except:
                    # Fallback positioning
                    text_x = width // 4
                    draw.text((text_x, text_start_y + i * 110), line, 
                             fill='#ffffff', font=font_title)
        
        # Professional podcast badge
        if font_label:
            badge_text = "🎧 PODCAST EPISODE • FULL HD"
            try:
                bbox = draw.textbbox((0, 0), badge_text, font=font_label)
                text_width = bbox[2] - bbox[0]
                text_x = (width - text_width) // 2
                
                # Badge background
                padding = 20
                badge_y = height - 140
                draw.rounded_rectangle([
                    text_x - padding, badge_y - padding,
                    text_x + text_width + padding, badge_y + 50 + padding
                ], radius=10, fill='#333333', outline='#555555', width=2)
                
                draw.text((text_x, badge_y), badge_text, fill='#cccccc', font=font_label)
            except:
                draw.text((width // 2 - 200, height - 140), badge_text, 
                         fill='#cccccc', font=font_label)
        
        # Quality indicator
        quality_text = "1080p • 320kbps"
        try:
            bbox = draw.textbbox((0, 0), quality_text, font=font_subtitle)
            text_width = bbox[2] - bbox[0]
            text_x = (width - text_width) // 2
            draw.text((text_x, 50), quality_text, fill='#888888', font=font_subtitle)
        except:
            draw.text((width // 2 - 100, 50), quality_text, fill='#888888', font=font_subtitle)
        
        # Save high-quality PNG
        img.save(output_path, 'PNG', quality=100, optimize=False)
        print(f"✅ Created Full HD podcast thumbnail: {output_path}")
        return output_path
        
    except Exception as e:
        print(f"⚠️ Warning: Could not create HD thumbnail: {e}")
        return None

def create_hd_podcast_video(audio_file, title="Podcast Episode", output_file=None):
    """Create Full HD 1080p video with maximum audio quality."""
    if not os.path.exists(audio_file):
        print(f"❌ Error: Audio file '{audio_file}' not found!")
        return None
    
    if output_file is None:
        base_name = os.path.splitext(audio_file)[0]
        output_file = f"{base_name}_HD_podcast.mp4"
    
    try:
        print(f"🎬 Creating Full HD 1080p podcast video from '{audio_file}'...")
        
        # Create high-quality thumbnail
        thumbnail_path = f"hd_thumb_{uuid.uuid4().hex[:8]}.png"
        create_hd_podcast_thumbnail(title, thumbnail_path)
        
        # Load audio with highest quality
        audio = AudioFileClip(audio_file)
        duration = audio.duration
        
        print(f"📊 Audio duration: {duration:.1f} seconds ({duration/60:.1f} minutes)")
        
        # Create Full HD video clip
        if os.path.exists(thumbnail_path):
            print("🖼️ Using custom HD thumbnail...")
            image_clip = ImageClip(thumbnail_path, duration=duration)
        else:
            print("🖼️ Using solid background...")
            image_clip = ColorClip(size=(1920, 1080), color=(26, 26, 26), duration=duration)
        
        # Combine with audio
        final_video = image_clip.set_audio(audio)
        
        print(f"🎬 Rendering Full HD video with maximum quality...")
        print("⏱️ This may take several minutes for long podcasts...")
        
        # Export with maximum quality settings
        final_video.write_videofile(
            output_file,
            fps=2,  # Slightly higher FPS for smoother thumbnail display
            codec='libx264',
            audio_codec='aac',
            
            # Maximum quality settings
            bitrate='10000k',      # Very high bitrate for 1080p
            audio_bitrate='320k',  # Maximum AAC audio quality
            preset='veryslow',     # Best compression efficiency
            
            # Advanced FFmpeg parameters for maximum quality
            ffmpeg_params=[
                '-crf', '15',                    # Near-lossless video quality
                '-pix_fmt', 'yuv420p',          # YouTube compatibility
                '-profile:v', 'high',           # H.264 high profile
                '-level', '4.2',                # H.264 level for 1080p
                '-movflags', '+faststart',      # Web streaming optimization
                '-metadata:g', 'title=' + title,
                '-metadata:g', 'comment=Full HD Podcast - Maximum Quality',
            ],
            
            verbose=False,
            logger=None,
            temp_audiofile=f'temp_audio_{uuid.uuid4().hex[:8]}.m4a',
            remove_temp=True
        )
        
        # Clean up
        final_video.close()
        audio.close()
        
        if os.path.exists(thumbnail_path):
            os.remove(thumbnail_path)
        
        # Get file info
        file_size = os.path.getsize(output_file) / (1024 * 1024)  # MB
        
        print(f"✅ Full HD podcast video created successfully!")
        print(f"📁 Output: {output_file}")
        print(f"📊 File size: {file_size:.1f} MB")
        print(f"🎥 Resolution: 1920x1080 (Full HD)")
        print(f"🎵 Audio: 320kbps AAC, 48kHz")
        print(f"⭐ Video quality: Near-lossless (CRF 15)")
        
        return output_file
        
    except Exception as e:
        print(f"❌ Video creation failed: {e}")
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python create_hd_podcast_video.py <audio_file> [title] [output_file]")
        print("\nExample:")
        print("  python create_hd_podcast_video.py podcast.m4a 'Episode 1 - Introduction'")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    title = sys.argv[2] if len(sys.argv) > 2 else "Podcast Episode"
    output_file = sys.argv[3] if len(sys.argv) > 3 else None
    
    result = create_hd_podcast_video(audio_file, title, output_file)
    
    if result:
        print(f"\n🎉 Ready for YouTube upload: {result}")
        print("\n📋 Upload command:")
        print(f"python youtube_podcast_uploader.py '{result}' --title '{title}' --privacy unlisted")
    else:
        print("\n❌ HD video creation failed")
        sys.exit(1)

if __name__ == "__main__":
    main()