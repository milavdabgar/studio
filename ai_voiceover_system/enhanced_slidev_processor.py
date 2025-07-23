#!/usr/bin/env python3
"""
Enhanced Slidev Processor
==========================

Properly processes Slidev presentations with better content extraction
and creates professional videos with your authentic voice.
"""

import os
import sys
import json
import time
import re
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

class SlidevProcessor:
    """Enhanced processor for Slidev presentations"""
    
    def __init__(self):
        self.tts_model = None
        self.voice_sample = "milav_voice_sample.wav"
        
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
    
    def parse_slidev_content(self, file_path):
        """Enhanced Slidev content parsing"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split by slide separators
        sections = content.split('---')
        slides = []
        
        for i, section in enumerate(sections[1:], 1):  # Skip frontmatter
            slide_data = self._parse_slide_section(section, i)
            
            # Only include slides with meaningful content
            if (slide_data['title'] or slide_data['content'] or slide_data['bullet_points']):
                slides.append(slide_data)
        
        # Filter out layout-only slides and focus on content slides
        content_slides = []
        for slide in slides:
            if self._is_content_slide(slide):
                content_slides.append(slide)
        
        return content_slides
    
    def _parse_slide_section(self, section, slide_number):
        """Parse individual slide section"""
        lines = section.strip().split('\n')
        
        slide_data = {
            'number': slide_number,
            'title': '',
            'content': [],
            'bullet_points': [],
            'layout': 'default'
        }
        
        # Skip layout declarations and focus on content
        content_started = False
        current_heading = ""
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines and layout directives
            if not line or line.startswith('layout:') or line.startswith('class:'):
                continue
            
            # Skip HTML/Vue components
            if line.startswith('<') or line.startswith('```'):
                continue
            
            # Extract main title (single #)
            if line.startswith('# ') and not slide_data['title']:
                slide_data['title'] = line[2:].strip()
                content_started = True
                continue
            
            # Extract subtitles (## level)
            if line.startswith('## '):
                current_heading = line[3:].strip()
                slide_data['content'].append(current_heading)
                content_started = True
                continue
            
            # Extract bullet points
            if line.startswith('- '):
                bullet = line[2:].strip()
                # Clean markdown formatting
                bullet = re.sub(r'\*\*([^*]+)\*\*', r'\1', bullet)  # Bold
                bullet = re.sub(r'\*([^*]+)\*', r'\1', bullet)      # Italic
                bullet = re.sub(r'`([^`]+)`', r'\1', bullet)        # Code
                
                # Remove excessive length bullets and meaningless ones
                if len(bullet) > 10 and len(bullet) < 150 and not bullet.startswith('http'):
                    slide_data['bullet_points'].append(bullet)
                continue
            
            # Extract regular content
            if content_started and line and not line.startswith('#'):
                # Clean line
                clean_line = re.sub(r'\*\*([^*]+)\*\*', r'\1', line)
                clean_line = re.sub(r'\*([^*]+)\*', r'\1', clean_line)
                clean_line = re.sub(r'`([^`]+)`', r'\1', clean_line)
                
                # Only add meaningful content
                if (len(clean_line) > 15 and len(clean_line) < 300 and 
                    not clean_line.startswith('http') and 
                    '://' not in clean_line):
                    slide_data['content'].append(clean_line)
        
        return slide_data
    
    def _is_content_slide(self, slide_data):
        """Check if slide has meaningful content"""
        # Must have either a good title or substantial content
        has_title = slide_data['title'] and len(slide_data['title']) > 3
        has_content = len(slide_data['content']) > 0 or len(slide_data['bullet_points']) > 0
        
        # Skip slides that are just layout or navigation
        skip_keywords = ['layout:', 'class:', 'Press Space', 'carbon:arrow']
        title_has_skip = any(keyword in slide_data['title'] for keyword in skip_keywords)
        
        return (has_title or has_content) and not title_has_skip
    
    def generate_natural_script(self, slide_data):
        """Generate natural narration script"""
        script_parts = []
        
        # Introduction based on slide
        if slide_data['title']:
            if slide_data['number'] == 1:
                script_parts.append(f"Welcome to our presentation on {slide_data['title']}.")
            else:
                script_parts.append(f"Now let's discuss {slide_data['title']}.")
        
        # Main content
        for content_line in slide_data['content'][:3]:  # Limit to 3 lines
            # Skip headings that are just repeated
            if content_line != slide_data['title']:
                script_parts.append(content_line)
        
        # Bullet points with natural flow
        if slide_data['bullet_points']:
            if len(slide_data['bullet_points']) == 1:
                script_parts.append(f"The key point is: {slide_data['bullet_points'][0]}.")
            else:
                script_parts.append("The main points include:")
                
                for i, bullet in enumerate(slide_data['bullet_points'][:4]):
                    if i == 0:
                        script_parts.append(f"First, {bullet}.")
                    elif i == 1:
                        script_parts.append(f"Second, {bullet}.")
                    elif i == 2:
                        script_parts.append(f"Additionally, {bullet}.")
                    else:
                        script_parts.append(f"Finally, {bullet}.")
        
        # Create final script
        script = ' '.join(script_parts)
        
        # Clean up script
        script = re.sub(r'\s+', ' ', script)  # Multiple spaces
        script = script.replace('..', '.').strip()
        
        return script
    
    def create_professional_slide(self, slide_data, width=1920, height=1080):
        """Create professional slide image"""
        if not PIL_AVAILABLE:
            return None
        
        # Create gradient background
        img = Image.new('RGB', (width, height), (249, 250, 251))
        draw = ImageDraw.Draw(img)
        
        # Add subtle gradient (simplified)
        for y in range(height // 3):
            alpha = int(255 * (1 - y / (height // 3)) * 0.1)
            draw.rectangle([0, y, width, y + 1], fill=(30, 58, 138, alpha))
        
        # Load fonts
        try:
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 64)
            subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
            content_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 36)
            bullet_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
        except:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
            content_font = ImageFont.load_default()
            bullet_font = ImageFont.load_default()
        
        y_pos = 100
        margin = 80
        
        # Add slide number badge
        badge_size = 60
        badge_x, badge_y = width - 120, 30
        draw.ellipse([badge_x, badge_y, badge_x + badge_size, badge_y + badge_size],
                    fill=(30, 58, 138))
        
        badge_text = str(slide_data['number'])
        bbox = draw.textbbox((0, 0), badge_text, font=content_font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        text_x = badge_x + (badge_size - text_width) // 2
        text_y = badge_y + (badge_size - text_height) // 2
        draw.text((text_x, text_y), badge_text, fill=(255, 255, 255), font=content_font)
        
        # Add main title
        if slide_data['title']:
            # Center title with proper wrapping
            title_words = slide_data['title'].split()
            if len(' '.join(title_words)) > 50:
                # Split long titles
                mid = len(title_words) // 2
                title_line1 = ' '.join(title_words[:mid])
                title_line2 = ' '.join(title_words[mid:])
                
                # Line 1
                bbox1 = draw.textbbox((0, 0), title_line1, font=title_font)
                width1 = bbox1[2] - bbox1[0]
                x1 = max(margin, (width - width1) // 2)
                draw.text((x1, y_pos), title_line1, fill=(30, 58, 138), font=title_font)
                
                # Line 2
                y_pos += 80
                bbox2 = draw.textbbox((0, 0), title_line2, font=title_font)
                width2 = bbox2[2] - bbox2[0]
                x2 = max(margin, (width - width2) // 2)
                draw.text((x2, y_pos), title_line2, fill=(30, 58, 138), font=title_font)
                
                y_pos += 100
            else:
                # Single line title
                bbox = draw.textbbox((0, 0), slide_data['title'], font=title_font)
                title_width = bbox[2] - bbox[0]
                title_x = max(margin, (width - title_width) // 2)
                draw.text((title_x, y_pos), slide_data['title'], fill=(30, 58, 138), font=title_font)
                y_pos += 120
        
        # Add decorative line
        line_start = (width // 2 - 200, y_pos)
        line_end = (width // 2 + 200, y_pos)
        draw.line([line_start, line_end], fill=(59, 130, 246), width=4)
        y_pos += 60
        
        # Add content
        for content_line in slide_data['content'][:3]:
            if y_pos > height - 200:
                break
            
            # Wrap long content
            if len(content_line) > 80:
                words = content_line.split()
                mid = len(words) // 2
                line1 = ' '.join(words[:mid])
                line2 = ' '.join(words[mid:])
                
                draw.text((margin, y_pos), line1, fill=(64, 64, 64), font=content_font)
                y_pos += 50
                draw.text((margin, y_pos), line2, fill=(64, 64, 64), font=content_font)
                y_pos += 70
            else:
                draw.text((margin, y_pos), content_line, fill=(64, 64, 64), font=content_font)
                y_pos += 70
        
        # Add bullet points
        if slide_data['bullet_points'] and y_pos < height - 150:
            y_pos += 20
            for bullet in slide_data['bullet_points'][:4]:
                if y_pos > height - 100:
                    break
                
                bullet_text = f"• {bullet}"
                if len(bullet_text) > 90:
                    bullet_text = bullet_text[:87] + "..."
                
                draw.text((margin + 20, y_pos), bullet_text, fill=(31, 41, 55), font=bullet_font)
                y_pos += 50
        
        # Add bottom accent line
        draw.rectangle([0, height - 20, width, height], fill=(16, 185, 129))
        
        # Save image
        image_file = f"enhanced_slide_{slide_data['number']:02d}.png"
        img.save(image_file)
        return image_file
    
    def process_presentation(self, slidev_file, max_slides=5):
        """Process complete presentation"""
        print("🎬 Enhanced Slidev Video Processing")
        print("=" * 60)
        
        # Parse slides
        print("📖 Parsing Slidev presentation...")
        slides = self.parse_slidev_content(slidev_file)
        
        if not slides:
            print("❌ No content slides found")
            return
        
        print(f"✅ Found {len(slides)} content slides")
        
        # Limit slides for testing
        test_slides = slides[:max_slides]
        
        # Process each slide
        video_clips = []
        
        for slide in test_slides:
            print(f"\n🎞️  Processing slide {slide['number']}: {slide['title'][:50]}...")
            
            # Generate script
            script = self.generate_natural_script(slide)
            print(f"   📝 Script ({len(script)} chars): {script[:80]}...")
            
            # Generate audio
            audio_file = f"enhanced_slide_{slide['number']:02d}_audio.wav"
            if self.tts_model and os.path.exists(self.voice_sample):
                try:
                    self.tts_model.tts_to_file(
                        text=script,
                        speaker_wav=self.voice_sample,
                        language="en",
                        file_path=audio_file
                    )
                    print(f"   🎤 Audio generated: {audio_file}")
                except Exception as e:
                    print(f"   ❌ Audio generation failed: {e}")
                    continue
            else:
                print(f"   ⚠️  TTS not available, skipping audio")
                continue
            
            # Create slide image
            image_file = self.create_professional_slide(slide)
            if image_file:
                print(f"   📸 Professional slide created: {image_file}")
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
            
            time.sleep(0.5)
        
        # Create final video
        if video_clips:
            print(f"\n🎞️  Assembling final video from {len(video_clips)} clips...")
            try:
                final_video = concatenate_videoclips(video_clips)
                output_file = "enhanced_computer_security_presentation.mp4"
                
                print("📤 Exporting professional video...")
                final_video.write_videofile(
                    output_file,
                    fps=30,
                    codec='libx264',
                    audio_codec='aac',
                    bitrate="5000k"  # Higher quality
                )
                
                # Clean up
                for clip in video_clips:
                    clip.close()
                final_video.close()
                
                if os.path.exists(output_file):
                    file_size = os.path.getsize(output_file) / (1024 * 1024)
                    total_duration = sum(clip.duration for clip in video_clips)
                    
                    print(f"\n🎉 SUCCESS! Professional video created!")
                    print("=" * 60)
                    print(f"📹 **FINAL VIDEO:**")
                    print(f"   File: {output_file}")
                    print(f"   Duration: {total_duration/60:.1f} minutes")
                    print(f"   Size: {file_size:.1f} MB")
                    print(f"   Slides: {len(video_clips)}")
                    print(f"   Quality: HD 1920x1080 @ 30fps")
                    
                    print(f"\n📊 **CONTENT PROCESSED:**")
                    for i, slide in enumerate(test_slides):
                        duration = video_clips[i].duration if i < len(video_clips) else 0
                        print(f"   Slide {slide['number']:2d}: {slide['title'][:40]:40s} ({duration:.1f}s)")
                    
                    print(f"\n🚀 **READY FOR:**")
                    print(f"   📤 YouTube upload")
                    print(f"   🎓 Educational distribution")
                    print(f"   💼 Professional presentations")
                    
                else:
                    print("❌ Video file not created")
                
            except Exception as e:
                print(f"❌ Final video creation failed: {e}")
        else:
            print("❌ No video clips to process")

def main():
    """Main execution"""
    slidev_file = "/home/milav/dev/studio/content/resources/study-materials/32-ict/sem-5/4353204-cyber-security/slidev/02-computer-security-fundamentals.md"
    
    if not os.path.exists(slidev_file):
        print(f"❌ Slidev file not found: {slidev_file}")
        return
    
    processor = SlidevProcessor()
    processor.process_presentation(slidev_file, max_slides=5)

if __name__ == "__main__":
    main()