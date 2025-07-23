#!/usr/bin/env python3
"""
Professional Slidev Video Processor
====================================

Uses properly exported Slidev PNG slides with authentic voice narration
to create professional educational videos.
"""

import os
import sys
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
    from TTS.api import TTS
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False

class ProfessionalSlidevProcessor:
    """Professional video processor using exported Slidev slides"""
    
    def __init__(self):
        self.tts_model = None
        self.voice_sample = "milav_voice_sample.wav"
        self.slides_dir = "exported_slides"
        
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
    
    def get_slide_files(self):
        """Get list of exported slide PNG files"""
        slide_files = []
        slides_path = Path(self.slides_dir)
        
        if not slides_path.exists():
            print(f"❌ Slides directory not found: {self.slides_dir}")
            return []
        
        # Get all PNG files and sort numerically
        png_files = list(slides_path.glob("*.png"))
        png_files.sort(key=lambda x: int(x.stem))
        
        return png_files
    
    def parse_slidev_content_for_slide(self, slide_number, slidev_file):
        """Parse Slidev content to get script for specific slide"""
        with open(slidev_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split by slide separators
        sections = content.split('---')
        
        if slide_number >= len(sections):
            return None
        
        section = sections[slide_number] if slide_number < len(sections) else ""
        return self._parse_slide_section(section, slide_number)
    
    def _parse_slide_section(self, section, slide_number):
        """Parse individual slide section"""
        lines = section.strip().split('\n')
        
        slide_data = {
            'number': slide_number,
            'title': '',
            'content': [],
            'bullet_points': []
        }
        
        # Extract content from slide
        for line in lines:
            line = line.strip()
            
            # Skip empty lines and directives
            if not line or line.startswith('layout:') or line.startswith('class:') or line.startswith('<'):
                continue
            
            # Extract main title
            if line.startswith('# ') and not slide_data['title']:
                slide_data['title'] = line[2:].strip()
                continue
            
            # Extract subtitles
            if line.startswith('## '):
                slide_data['content'].append(line[3:].strip())
                continue
            
            # Extract bullet points
            if line.startswith('- '):
                bullet = line[2:].strip()
                # Clean markdown formatting
                bullet = re.sub(r'\\*\\*([^*]+)\\*\\*', r'\\1', bullet)
                bullet = re.sub(r'\\*([^*]+)\\*', r'\\1', bullet)
                bullet = re.sub(r'`([^`]+)`', r'\\1', bullet)
                
                if len(bullet) > 5 and len(bullet) < 150:
                    slide_data['bullet_points'].append(bullet)
                continue
        
        return slide_data
    
    def generate_slide_narration(self, slide_data):
        """Generate natural narration for slide"""
        script_parts = []
        
        # Handle different slide types
        if slide_data['number'] == 1:
            # Title slide
            script_parts.append("Welcome to our lecture on Computer Security Fundamentals.")
            script_parts.append("Today we'll explore the CIA Triad and Information Security Principles.")
        elif slide_data['title'] and 'recap' in slide_data['title'].lower():
            # Recap slide
            script_parts.append("Let's begin with a recap of our previous lecture.")
            script_parts.append("We covered several important topics in cyber security.")
            
            if slide_data['bullet_points']:
                script_parts.append("Previously, we discussed:")
                for bullet in slide_data['bullet_points'][:4]:
                    script_parts.append(bullet)
        else:
            # Regular content slide
            if slide_data['title']:
                script_parts.append(f"Now let's examine {slide_data['title']}.")
            
            # Add content
            for content in slide_data['content'][:2]:
                script_parts.append(content)
            
            # Add bullet points naturally
            if slide_data['bullet_points']:
                if len(slide_data['bullet_points']) <= 2:
                    script_parts.append("The key points are:")
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
        script = re.sub(r'\\s+', ' ', script)
        script = script.replace('..', '.').strip()
        
        return script
    
    def create_professional_video(self, slidev_file, max_slides=5):
        """Create professional video from exported slides"""
        print("🎬 Professional Slidev Video Creation")
        print("=" * 60)
        
        # Get slide files
        slide_files = self.get_slide_files()
        if not slide_files:
            print("❌ No slide files found")
            return
        
        print(f"✅ Found {len(slide_files)} exported slides")
        
        # Limit slides for processing
        test_slides = slide_files[:max_slides]
        video_clips = []
        
        for i, slide_file in enumerate(test_slides, 1):
            print(f"\\n🎞️  Processing slide {i}: {slide_file.name}")
            
            # Parse slide content from markdown
            slide_data = self.parse_slidev_content_for_slide(i, slidev_file)
            
            if not slide_data:
                print(f"   ⚠️  No content data for slide {i}")
                continue
            
            # Generate narration script
            script = self.generate_slide_narration(slide_data)
            print(f"   📝 Script ({len(script)} chars): {script[:80]}...")
            
            # Generate audio with authentic voice
            audio_file = f"slide_{i:02d}_narration.wav"
            if self.tts_model and os.path.exists(self.voice_sample):
                try:
                    self.tts_model.tts_to_file(
                        text=script,
                        speaker_wav=self.voice_sample,
                        language="en",
                        file_path=audio_file
                    )
                    print(f"   🎤 Authentic voice generated: {audio_file}")
                except Exception as e:
                    print(f"   ❌ Audio generation failed: {e}")
                    continue
            else:
                print(f"   ⚠️  TTS not available")
                continue
            
            # Create video clip with professional slide
            if MOVIEPY_AVAILABLE and os.path.exists(audio_file):
                try:
                    audio_clip = AudioFileClip(audio_file)
                    image_clip = ImageClip(str(slide_file)).with_duration(audio_clip.duration)
                    video_clip = image_clip.with_audio(audio_clip)
                    video_clips.append(video_clip)
                    print(f"   🎬 Professional video clip created ({audio_clip.duration:.1f}s)")
                except Exception as e:
                    print(f"   ❌ Video clip creation failed: {e}")
            
            time.sleep(0.5)
        
        # Assemble final professional video
        if video_clips:
            print(f"\\n🎞️  Assembling final professional video...")
            try:
                final_video = concatenate_videoclips(video_clips)
                output_file = "professional_computer_security_lecture.mp4"
                
                print("📤 Exporting HD professional video...")
                final_video.write_videofile(
                    output_file,
                    fps=30,
                    codec='libx264',
                    audio_codec='aac',
                    bitrate="8000k"  # High quality bitrate
                )
                
                # Clean up
                for clip in video_clips:
                    clip.close()
                final_video.close()
                
                if os.path.exists(output_file):
                    file_size = os.path.getsize(output_file) / (1024 * 1024)
                    total_duration = sum(clip.duration for clip in video_clips)
                    
                    print(f"\\n🎉 SUCCESS! Professional lecture video created!")
                    print("=" * 60)
                    print(f"📹 **PROFESSIONAL VIDEO:**")
                    print(f"   File: {output_file}")
                    print(f"   Duration: {total_duration:.1f} seconds")
                    print(f"   Size: {file_size:.1f} MB")
                    print(f"   Slides: {len(video_clips)}")
                    print(f"   Quality: Full HD with authentic voice")
                    print(f"   Ready for: Educational distribution, YouTube upload")
                    
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
    
    processor = ProfessionalSlidevProcessor()
    processor.create_professional_video(slidev_file, max_slides=5)

if __name__ == "__main__":
    main()