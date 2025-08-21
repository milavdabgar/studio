#!/usr/bin/env python3
"""
Create a video from audio for YouTube podcast upload
"""
import sys
from moviepy.editor import AudioFileClip, ImageClip, CompositeVideoClip
from PIL import Image, ImageDraw, ImageFont
import os

def create_podcast_thumbnail(title, output_path="podcast_thumbnail.png", width=1280, height=720):
    """Create a thumbnail image for the podcast."""
    try:
        # Create image
        img = Image.new('RGB', (width, height), color='#1a1a1a')
        draw = ImageDraw.Draw(img)
        
        # Try to use a nice font, fallback to default
        try:
            font_large = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 60)
            font_small = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 30)
        except:
            try:
                font_large = ImageFont.load_default()
                font_small = ImageFont.load_default()
            except:
                font_large = None
                font_small = None
        
        # Draw podcast icon (simple circle with play symbol)
        center_x, center_y = width // 2, height // 3
        circle_radius = 80
        draw.ellipse([center_x - circle_radius, center_y - circle_radius,
                     center_x + circle_radius, center_y + circle_radius],
                    fill='#ff6b6b', outline='#ffffff', width=3)
        
        # Draw play triangle
        triangle_size = 30
        triangle_points = [
            (center_x - triangle_size//2, center_y - triangle_size//2),
            (center_x - triangle_size//2, center_y + triangle_size//2),
            (center_x + triangle_size//2, center_y)
        ]
        draw.polygon(triangle_points, fill='#ffffff')
        
        # Draw title if fonts are available
        if font_large:
            max_chars_per_line = 25
            if len(title) > max_chars_per_line:
                words = title.split()
                lines = []
                current_line = ""
                for word in words:
                    if len(current_line + " " + word) <= max_chars_per_line:
                        current_line += " " + word if current_line else word
                    else:
                        if current_line:
                            lines.append(current_line)
                        current_line = word
                if current_line:
                    lines.append(current_line)
                title_text = "\n".join(lines[:3])  # Max 3 lines
            else:
                title_text = title
            
            # Calculate text position
            text_y = center_y + circle_radius + 50
            for i, line in enumerate(title_text.split('\n')):
                try:
                    bbox = draw.textbbox((0, 0), line, font=font_large)
                    text_width = bbox[2] - bbox[0]
                    text_x = (width - text_width) // 2
                    draw.text((text_x, text_y + i * 70), line, fill='#ffffff', font=font_large)
                except:
                    # Fallback without textbbox
                    text_x = width // 4
                    draw.text((text_x, text_y + i * 70), line, fill='#ffffff', font=font_large)
            
            # Add "PODCAST" label
            if font_small:
                podcast_text = "🎧 PODCAST"
                try:
                    bbox = draw.textbbox((0, 0), podcast_text, font=font_small)
                    text_width = bbox[2] - bbox[0]
                    text_x = (width - text_width) // 2
                    draw.text((text_x, height - 100), podcast_text, fill='#cccccc', font=font_small)
                except:
                    draw.text((width // 2 - 50, height - 100), podcast_text, fill='#cccccc', font=font_small)
        
        # Save thumbnail
        img.save(output_path, 'PNG')
        print(f"✅ Created podcast thumbnail: {output_path}")
        return output_path
        
    except Exception as e:
        print(f"⚠️ Warning: Could not create thumbnail: {e}")
        return None

def create_podcast_video(audio_file, title="Podcast Episode", output_file=None):
    """Create a video from audio file with static image background."""
    if not os.path.exists(audio_file):
        print(f"❌ Error: Audio file '{audio_file}' not found!")
        return None
    
    if output_file is None:
        # Create output filename
        base_name = os.path.splitext(audio_file)[0]
        output_file = f"{base_name}_video.mp4"
    
    try:
        print(f"🎬 Creating video from '{audio_file}'...")
        
        # Create thumbnail image
        thumbnail_path = "temp_podcast_thumbnail.png"
        create_podcast_thumbnail(title, thumbnail_path)
        
        # Load audio
        audio = AudioFileClip(audio_file)
        duration = audio.duration
        
        print(f"📊 Audio duration: {duration:.1f} seconds")
        
        # Create video clip with static image
        if os.path.exists(thumbnail_path):
            image_clip = ImageClip(thumbnail_path, duration=duration)
        else:
            # Fallback: create a simple colored background
            from moviepy.editor import ColorClip
            image_clip = ColorClip(size=(1280, 720), color=(26, 26, 26), duration=duration)
        
        # Combine audio and image
        video = image_clip.set_audio(audio)
        
        # Write the video file
        print(f"🎬 Rendering video... (this may take a few minutes)")
        video.write_videofile(
            output_file,
            fps=1,  # Low FPS since it's static image
            codec='libx264',
            audio_codec='aac',
            verbose=False,
            logger=None,
            temp_audiofile='temp-audio.m4a',
            remove_temp=True
        )
        
        # Clean up
        video.close()
        audio.close()
        if os.path.exists(thumbnail_path):
            os.remove(thumbnail_path)
        
        print(f"✅ Video created successfully: {output_file}")
        return output_file
        
    except Exception as e:
        print(f"❌ Video creation failed: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python create_podcast_video.py <audio_file> [title]")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    title = sys.argv[2] if len(sys.argv) > 2 else "Podcast Episode"
    
    result = create_podcast_video(audio_file, title)
    
    if result:
        print(f"\n🎥 Ready for YouTube upload: {result}")
    else:
        print("\n❌ Video creation failed")
        sys.exit(1)