#!/usr/bin/env python3
"""
Simple Video Test with Actual Slidev Content
=============================================

Test the pipeline with real computer security slides.
"""

import os
import sys
import json
import time
from pathlib import Path

# Set TTS environment
os.environ['COQUI_TOS_AGREED'] = '1'
os.environ['COQUI_TTS_AGREED'] = '1'

try:
    from moviepy import ImageClip, AudioFileClip, concatenate_videoclips
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    from TTS.api import TTS
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False

def parse_slidev_content(file_path):
    """Parse Slidev content and extract slides"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by slide separators
    sections = content.split('---')
    slides = []
    
    for i, section in enumerate(sections[1:], 1):  # Skip frontmatter
        lines = section.strip().split('\n')
        
        # Extract title and content
        title = ""
        content_lines = []
        bullet_points = []
        
        for line in lines:
            line = line.strip()
            if line.startswith('# ') and not title:
                title = line[2:].strip()
            elif line.startswith('- **') or line.startswith('- '):
                # Clean bullet point
                bullet = line[2:].strip()
                bullet = bullet.replace('**', '').replace('*', '')
                if bullet and len(bullet) < 100:  # Reasonable length
                    bullet_points.append(bullet)
            elif line and not line.startswith('#') and not line.startswith('<') and not line.startswith('```'):
                clean_line = line.replace('**', '').replace('*', '').replace('`', '')
                if clean_line and len(clean_line) > 10 and len(clean_line) < 200:
                    content_lines.append(clean_line)
        
        if title or content_lines or bullet_points:
            slides.append({
                'number': i,
                'title': title,
                'content': content_lines[:3],  # Limit content
                'bullet_points': bullet_points[:4]  # Limit bullets
            })
    
    return slides

def generate_script(slide_data):
    """Generate natural script for slide"""
    script_parts = []
    
    if slide_data['title']:
        script_parts.append(f"Let's discuss {slide_data['title']}.")
    
    for content_line in slide_data['content']:
        script_parts.append(content_line)
    
    if slide_data['bullet_points']:
        script_parts.append("The key points include:")
        for i, point in enumerate(slide_data['bullet_points']):
            if i == 0:
                script_parts.append(f"First, {point}.")
            elif i == 1:
                script_parts.append(f"Second, {point}.")
            elif i == 2:
                script_parts.append(f"Additionally, {point}.")
            else:
                script_parts.append(f"Also, {point}.")
    
    script = ' '.join(script_parts)
    # Clean up
    script = script.replace('  ', ' ').strip()
    return script

def create_slide_image(slide_data, width=1920, height=1080):
    """Create slide image"""
    if not PIL_AVAILABLE:
        return None
    
    # Create image
    img = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Load font
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
        content_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 36)
    except:
        title_font = ImageFont.load_default()
        content_font = ImageFont.load_default()
    
    y_pos = 100
    
    # Slide number
    draw.text((50, 50), f"Slide {slide_data['number']}", fill=(128, 128, 128), font=content_font)
    
    # Title
    if slide_data['title']:
        title_bbox = draw.textbbox((0, 0), slide_data['title'], font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = max(100, (width - title_width) // 2)
        draw.text((title_x, y_pos), slide_data['title'], fill=(30, 58, 138), font=title_font)
        y_pos += 150
    
    # Content
    for content_line in slide_data['content']:
        if y_pos > height - 200:
            break
        if len(content_line) > 80:
            # Split long lines
            words = content_line.split()
            line1 = ' '.join(words[:len(words)//2])
            line2 = ' '.join(words[len(words)//2:])
            draw.text((100, y_pos), line1, fill=(64, 64, 64), font=content_font)
            y_pos += 50
            draw.text((100, y_pos), line2, fill=(64, 64, 64), font=content_font)
            y_pos += 70
        else:
            draw.text((100, y_pos), content_line, fill=(64, 64, 64), font=content_font)
            y_pos += 70
    
    # Bullet points
    if slide_data['bullet_points'] and y_pos < height - 100:
        for bullet in slide_data['bullet_points']:
            if y_pos > height - 100:
                break
            bullet_text = f"• {bullet}"
            if len(bullet_text) > 90:
                bullet_text = bullet_text[:87] + "..."
            draw.text((120, y_pos), bullet_text, fill=(0, 0, 0), font=content_font)
            y_pos += 50
    
    # Save image
    image_file = f"slide_{slide_data['number']:02d}.png"
    img.save(image_file)
    return image_file

def main():
    """Test with real Slidev content"""
    print("🧪 Simple Video Test with Computer Security Slides")
    print("=" * 60)
    
    # Parse the actual Slidev file
    slidev_file = "/home/milav/dev/studio/content/resources/study-materials/32-ict/sem-5/4353204-cyber-security/slidev/02-computer-security-fundamentals.md"
    
    if not os.path.exists(slidev_file):
        print(f"❌ Slidev file not found: {slidev_file}")
        return
    
    print("📖 Parsing Slidev content...")
    slides = parse_slidev_content(slidev_file)
    print(f"✅ Found {len(slides)} slides")
    
    # Test with first few slides only
    test_slides = slides[:3]  # First 3 slides
    
    if not test_slides:
        print("❌ No slides found")
        return
    
    # Initialize TTS
    if TTS_AVAILABLE:
        print("🎤 Loading TTS model...")
        tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
        voice_sample = "milav_voice_sample.wav"
        
        if not os.path.exists(voice_sample):
            print(f"❌ Voice sample not found: {voice_sample}")
            return
        
        print("✅ TTS model loaded")
    else:
        print("❌ TTS not available")
        return
    
    # Process slides
    video_clips = []
    
    for slide in test_slides:
        print(f"\n🎬 Processing slide {slide['number']}: {slide['title'][:50]}...")
        
        # Generate script
        script = generate_script(slide)
        print(f"   📝 Script: {script[:100]}...")
        
        # Generate audio
        audio_file = f"slide_{slide['number']:02d}_audio.wav"
        try:
            tts.tts_to_file(
                text=script,
                speaker_wav=voice_sample,
                language="en",
                file_path=audio_file
            )
            print(f"   🎤 Audio generated: {audio_file}")
        except Exception as e:
            print(f"   ❌ Audio generation failed: {e}")
            continue
        
        # Create slide image
        image_file = create_slide_image(slide)
        if image_file:
            print(f"   📸 Image created: {image_file}")
        else:
            print(f"   ❌ Image creation failed")
            continue
        
        # Create video clip
        if MOVIEPY_AVAILABLE and os.path.exists(audio_file) and os.path.exists(image_file):
            try:
                audio_clip = AudioFileClip(audio_file)
                image_clip = ImageClip(image_file).with_duration(audio_clip.duration)
                video_clip = image_clip.with_audio(audio_clip)
                video_clips.append(video_clip)
                print(f"   🎬 Video clip created ({audio_clip.duration:.1f}s)")
            except Exception as e:
                print(f"   ❌ Video clip creation failed: {e}")
        
        time.sleep(0.5)  # Small delay
    
    # Create final video
    if video_clips:
        print(f"\n🎞️  Creating final video from {len(video_clips)} clips...")
        try:
            final_video = concatenate_videoclips(video_clips)
            output_file = "computer_security_test.mp4"
            
            print("📤 Exporting video...")
            final_video.write_videofile(
                output_file,
                fps=30,
                codec='libx264',
                audio_codec='aac'
            )
            
            # Clean up
            for clip in video_clips:
                clip.close()
            final_video.close()
            
            if os.path.exists(output_file):
                file_size = os.path.getsize(output_file) / (1024 * 1024)
                print(f"✅ Video created successfully!")
                print(f"   File: {output_file}")
                print(f"   Size: {file_size:.1f} MB")
                print(f"   Slides: {len(video_clips)}")
                
                # Show sample data
                print(f"\n📊 Sample Content Processed:")
                for slide in test_slides:
                    print(f"   Slide {slide['number']}: {slide['title']}")
            else:
                print("❌ Video file not created")
            
        except Exception as e:
            print(f"❌ Final video creation failed: {e}")
    else:
        print("❌ No video clips to combine")

if __name__ == "__main__":
    main()