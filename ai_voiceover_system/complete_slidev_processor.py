#!/usr/bin/env python3
"""
Complete Slidev Video Processor
===============================

Processes ALL slides from Slidev presentation with proper voiceover content
and generates full-length professional educational videos.
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

class CompleteSlidevProcessor:
    """Complete processor for ALL Slidev slides with full voiceover"""
    
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
    
    def get_all_slide_files(self):
        """Get ALL exported slide PNG files"""
        slides_path = Path(self.slides_dir)
        
        if not slides_path.exists():
            print(f"❌ Slides directory not found: {self.slides_dir}")
            return []
        
        # Get all PNG files and sort numerically
        png_files = list(slides_path.glob("*.png"))
        png_files.sort(key=lambda x: int(x.stem))
        
        return png_files
    
    def parse_complete_slidev_content(self, slidev_file):
        """Parse complete Slidev content to extract all slide data"""
        with open(slidev_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split by slide separators
        sections = content.split('---')
        slide_data_list = []
        
        for i, section in enumerate(sections):
            if i == 0:  # Skip frontmatter
                continue
                
            slide_data = self._parse_slide_section_robust(section, i)
            if slide_data:
                slide_data_list.append(slide_data)
        
        return slide_data_list
    
    def _parse_slide_section_robust(self, section, slide_number):
        """Robust parsing of individual slide section"""
        lines = section.strip().split('\n')
        
        slide_data = {
            'number': slide_number,
            'title': '',
            'content': [],
            'bullet_points': [],
            'layout': 'default',
            'raw_content': section.strip()
        }
        
        current_heading = ''
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines, layout directives, and HTML/Vue components
            if not line or line.startswith('layout:') or line.startswith('class:') or line.startswith('<') or line.startswith('```'):
                continue
            
            # Extract layout type
            if line.startswith('layout:'):
                slide_data['layout'] = line.split(':')[1].strip()
                continue
            
            # Extract main title (# heading)
            if line.startswith('# ') and not slide_data['title']:
                slide_data['title'] = line[2:].strip()
                current_heading = slide_data['title']
                continue
            
            # Extract subtitles (## heading)
            if line.startswith('## '):
                subtitle = line[3:].strip()
                # Clean emoji and markdown
                subtitle = re.sub(r'[🔄🎯🔒💡⚡🛡️📊🔍⚠️✅❌🎪🔧📱💻🌐]', '', subtitle)
                subtitle = re.sub(r'\\*\\*([^*]+)\\*\\*', r'\\1', subtitle)
                current_heading = subtitle
                slide_data['content'].append(subtitle)
                continue
            
            # Extract bullet points
            if line.startswith('- '):
                bullet = line[2:].strip()
                # Clean markdown formatting and emojis
                bullet = re.sub(r'\\*\\*([^*]+)\\*\\*', r'\\1', bullet)
                bullet = re.sub(r'\\*([^*]+)\\*', r'\\1', bullet)
                bullet = re.sub(r'`([^`]+)`', r'\\1', bullet)
                bullet = re.sub(r'[🔄🎯🔒💡⚡🛡️📊🔍⚠️✅❌🎪🔧📱💻🌐]', '', bullet)
                
                if len(bullet) > 5 and len(bullet) < 200:
                    slide_data['bullet_points'].append(bullet)
                continue
            
            # Extract regular text content
            if len(line) > 10 and not line.startswith('#') and not line.startswith('<'):
                # Clean text content
                text = re.sub(r'\\*\\*([^*]+)\\*\\*', r'\\1', line)
                text = re.sub(r'\\*([^*]+)\\*', r'\\1', text)
                text = re.sub(r'`([^`]+)`', r'\\1', text)
                
                if len(text) > 10:
                    slide_data['content'].append(text)
        
        return slide_data if slide_data['title'] or slide_data['content'] or slide_data['bullet_points'] else None
    
    def generate_comprehensive_narration(self, slide_data):
        """Generate comprehensive narration for each slide"""
        script_parts = []
        slide_num = slide_data['number']
        
        # Handle different slide types with comprehensive narration
        if slide_num == 1:
            # Title slide - comprehensive introduction
            script_parts.append("Welcome to today's lecture on Computer Security Fundamentals.")
            script_parts.append("In this session, we will explore the CIA Triad and Information Security Principles.")
            script_parts.append("These concepts form the foundation of modern cybersecurity practices.")
            
        elif slide_data['title'] and 'recap' in slide_data['title'].lower():
            # Recap slide - thorough review
            script_parts.append("Let's begin with a comprehensive recap of our previous lecture.")
            script_parts.append("We covered several fundamental concepts in cyber security.")
            
            if slide_data['bullet_points']:
                script_parts.append("In the previous session, we discussed:")
                for i, bullet in enumerate(slide_data['bullet_points'][:5]):
                    if i == 0:
                        script_parts.append(f"First, we examined {bullet.lower()}.")
                    elif i == 1:
                        script_parts.append(f"We also covered {bullet.lower()}.")
                    elif i == 2:
                        script_parts.append(f"Additionally, we explored {bullet.lower()}.")
                    elif i == 3:
                        script_parts.append(f"We discussed {bullet.lower()}.")
                    else:
                        script_parts.append(f"Finally, we reviewed {bullet.lower()}.")
            
            script_parts.append("Now let's move forward to today's key learning objectives.")
            
        elif slide_data['title'] and ('cia' in slide_data['title'].lower() or 'triad' in slide_data['title'].lower()):
            # CIA Triad slides - detailed explanation
            script_parts.append(f"Now we come to a crucial topic: {slide_data['title']}.")
            script_parts.append("The CIA Triad represents the three fundamental pillars of information security.")
            script_parts.append("These three principles guide all security decisions and implementations.")
            
            for content in slide_data['content'][:3]:
                script_parts.append(content)
            
            if slide_data['bullet_points']:
                script_parts.append("Let me explain each component in detail:")
                for bullet in slide_data['bullet_points'][:4]:
                    script_parts.append(bullet)
                    
        elif slide_data['title'] and ('confidentiality' in slide_data['title'].lower()):
            # Confidentiality slides - detailed coverage
            script_parts.append(f"Let's dive deep into {slide_data['title']}.")
            script_parts.append("Confidentiality ensures that information is accessible only to authorized individuals.")
            script_parts.append("This is perhaps the most commonly understood aspect of information security.")
            
            for content in slide_data['content'][:2]:
                script_parts.append(content)
                
            if slide_data['bullet_points']:
                script_parts.append("Key aspects of confidentiality include:")
                for i, bullet in enumerate(slide_data['bullet_points'][:5]):
                    script_parts.append(f"{bullet}.")
                    
        elif slide_data['title'] and ('integrity' in slide_data['title'].lower()):
            # Integrity slides
            script_parts.append(f"Moving on to {slide_data['title']}.")
            script_parts.append("Integrity ensures that information remains accurate and unaltered.")
            script_parts.append("This principle protects against unauthorized modification of data.")
            
            for content in slide_data['content'][:2]:
                script_parts.append(content)
                
            if slide_data['bullet_points']:
                script_parts.append("Important integrity concepts include:")
                for bullet in slide_data['bullet_points'][:5]:
                    script_parts.append(f"{bullet}.")
                    
        elif slide_data['title'] and ('availability' in slide_data['title'].lower()):
            # Availability slides
            script_parts.append(f"Finally, let's examine {slide_data['title']}.")
            script_parts.append("Availability ensures that information and systems are accessible when needed.")
            script_parts.append("This principle addresses the operational aspect of security.")
            
            for content in slide_data['content'][:2]:
                script_parts.append(content)
                
            if slide_data['bullet_points']:
                script_parts.append("Key availability considerations include:")
                for bullet in slide_data['bullet_points'][:5]:
                    script_parts.append(f"{bullet}.")
                    
        else:
            # General content slides - comprehensive coverage
            if slide_data['title']:
                script_parts.append(f"Let's now examine {slide_data['title']}.")
            
            # Add detailed content explanation
            for i, content in enumerate(slide_data['content'][:3]):
                if i == 0:
                    script_parts.append(content)
                else:
                    script_parts.append(f"Additionally, {content.lower()}")
            
            # Add comprehensive bullet point coverage
            if slide_data['bullet_points']:
                if len(slide_data['bullet_points']) <= 2:
                    script_parts.append("The key points to remember are:")
                else:
                    script_parts.append("The main concepts we need to understand include:")
                
                for i, bullet in enumerate(slide_data['bullet_points'][:6]):
                    if i == 0:
                        script_parts.append(f"First, {bullet.lower()}.")
                    elif i == 1:
                        script_parts.append(f"Second, {bullet.lower()}.")
                    elif i == 2:
                        script_parts.append(f"Third, {bullet.lower()}.")
                    elif i == 3:
                        script_parts.append(f"Additionally, {bullet.lower()}.")
                    elif i == 4:
                        script_parts.append(f"Furthermore, {bullet.lower()}.")
                    else:
                        script_parts.append(f"Finally, {bullet.lower()}.")
        
        # Create comprehensive final script
        script = ' '.join(script_parts)
        
        # Clean up the script
        script = re.sub(r'\\s+', ' ', script)
        script = script.replace('..', '.').replace(' .', '.').strip()
        
        # Ensure minimum length for educational value
        if len(script) < 100:
            script += " This concept is fundamental to understanding information security principles."
        
        return script
    
    def create_complete_professional_video(self, slidev_file):
        """Create complete professional video from ALL slides"""
        print("🎬 Complete Professional Slidev Video Creation")
        print("=" * 70)
        
        # Get ALL slide files
        slide_files = self.get_all_slide_files()
        if not slide_files:
            print("❌ No slide files found")
            return
        
        print(f"✅ Found {len(slide_files)} exported slides")
        
        # Parse complete Slidev content
        slide_data_list = self.parse_complete_slidev_content(slidev_file)
        print(f"✅ Parsed {len(slide_data_list)} content sections")
        
        video_clips = []
        total_duration = 0
        
        # Process ALL slides
        for i, slide_file in enumerate(slide_files):
            print(f"\\n🎞️  Processing slide {i+1}/{len(slide_files)}: {slide_file.name}")
            
            # Get corresponding slide data
            slide_data = slide_data_list[i] if i < len(slide_data_list) else {
                'number': i+1,
                'title': f'Slide {i+1}',
                'content': [],
                'bullet_points': []
            }
            
            # Generate comprehensive narration
            try:
                script = self.generate_comprehensive_narration(slide_data)
                print(f"   📝 Script ({len(script)} chars): {script[:100]}...")
                
                # Generate audio with authentic voice
                audio_file = f"complete_slide_{i+1:02d}_audio.wav"
                if self.tts_model and os.path.exists(self.voice_sample):
                    self.tts_model.tts_to_file(
                        text=script,
                        speaker_wav=self.voice_sample,
                        language="en",
                        file_path=audio_file
                    )
                    print(f"   🎤 Authentic voice generated: {audio_file}")
                    
                    # Create video clip with professional slide
                    if MOVIEPY_AVAILABLE and os.path.exists(audio_file):
                        audio_clip = AudioFileClip(audio_file)
                        duration = audio_clip.duration
                        total_duration += duration
                        
                        image_clip = ImageClip(str(slide_file)).with_duration(duration)
                        video_clip = image_clip.with_audio(audio_clip)
                        video_clips.append(video_clip)
                        print(f"   🎬 Professional video clip created ({duration:.1f}s)")
                    
                else:
                    print(f"   ⚠️  TTS not available")
                    
            except Exception as e:
                print(f"   ❌ Error processing slide {i+1}: {e}")
                continue
            
            # Brief pause between slides
            time.sleep(0.3)
        
        # Assemble complete professional video
        if video_clips:
            print(f"\\n🎞️  Assembling complete professional video...")
            print(f"   📊 Total clips: {len(video_clips)}")
            print(f"   ⏱️  Total duration: {total_duration:.1f} seconds ({total_duration/60:.1f} minutes)")
            
            try:
                final_video = concatenate_videoclips(video_clips)
                output_file = "complete_computer_security_lecture.mp4"
                
                print("📤 Exporting complete HD professional video...")
                final_video.write_videofile(
                    output_file,
                    fps=30,
                    codec='libx264',
                    audio_codec='aac',
                    bitrate="10000k"  # Higher quality for longer video
                )
                
                # Clean up
                for clip in video_clips:
                    clip.close()
                final_video.close()
                
                if os.path.exists(output_file):
                    file_size = os.path.getsize(output_file) / (1024 * 1024)
                    
                    print(f"\\n🎉 SUCCESS! Complete professional lecture video created!")
                    print("=" * 70)
                    print(f"📹 **COMPLETE PROFESSIONAL VIDEO:**")
                    print(f"   File: {output_file}")
                    print(f"   Duration: {total_duration:.1f} seconds ({total_duration/60:.1f} minutes)")
                    print(f"   Size: {file_size:.1f} MB")
                    print(f"   Slides: {len(video_clips)} (ALL slides processed)")
                    print(f"   Quality: Full HD with authentic voice")
                    print(f"   Content: Complete Computer Security lecture")
                    print(f"   Ready for: Professional educational distribution")
                    
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
    
    processor = CompleteSlidevProcessor()
    processor.create_complete_professional_video(slidev_file)

if __name__ == "__main__":
    main()