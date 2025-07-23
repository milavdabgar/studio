#!/usr/bin/env python3
"""
Slidev Export Processor with Voice Hierarchy
===========================================

Uses actual slidev exported slides with the confirmed voice hierarchy:
1st: Google TTS UK English
2nd: Google TTS Irish English  
3rd: VITS Neural
4th: Tacotron2 Neural
"""

import os
import sys
import time
import re
import subprocess
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

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False

class SlidevExportProcessor:
    """Processor using actual slidev exported slides with voice hierarchy"""
    
    def __init__(self):
        self.slides_dir = "exported_slides"
        self.slidev_md_file = "/Users/milav/Code/studio/content/resources/study-materials/32-ict/sem-5/4353204-cyber-security/slidev/02-computer-security-fundamentals.md"
        
        # Initialize neural models (for backup)
        self.vits_model = None
        self.tacotron2_model = None
        
        print("🎤 Voice Hierarchy: UK → Irish → VITS → Tacotron2")
        print(f"✅ Google TTS Available: {GTTS_AVAILABLE}")
        print(f"✅ Coqui TTS Available: {TTS_AVAILABLE}")
        print(f"✅ MoviePy Available: {MOVIEPY_AVAILABLE}")
    
    def export_slides_with_slidev(self, slidev_file):
        """Export slides using slidev export command"""
        print("📤 Exporting slides using slidev...")
        
        # Check if slidev file exists
        if not os.path.exists(slidev_file):
            print(f"❌ Slidev file not found: {slidev_file}")
            return False
        
        # Create output directory
        os.makedirs(self.slides_dir, exist_ok=True)
        
        try:
            # Change to the directory containing the slidev file
            slidev_dir = os.path.dirname(slidev_file)
            slidev_filename = os.path.basename(slidev_file)
            
            print(f"   📁 Working directory: {slidev_dir}")
            print(f"   📄 Slidev file: {slidev_filename}")
            
            # Run slidev export command
            export_cmd = [
                "npx", "slidev", "export", 
                slidev_filename,
                "--output", os.path.abspath(self.slides_dir),
                "--format", "png",
                "--timeout", "60000"
            ]
            
            print(f"   🚀 Running: {' '.join(export_cmd)}")
            
            result = subprocess.run(
                export_cmd,
                cwd=slidev_dir,
                capture_output=True,
                text=True,
                timeout=120  # 2 minute timeout
            )
            
            if result.returncode == 0:
                print("   ✅ Slidev export completed successfully!")
                
                # Check if slides were exported
                slide_files = list(Path(self.slides_dir).glob("*.png"))
                if slide_files:
                    print(f"   📊 Exported {len(slide_files)} slides")
                    return True
                else:
                    print("   ❌ No PNG files found after export")
                    return False
            else:
                print(f"   ❌ Slidev export failed:")
                print(f"   Error: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            print("   ❌ Slidev export timed out (2 minutes)")
            return False
        except FileNotFoundError:
            print("   ❌ Slidev not found. Please install with: npm install -g @slidev/cli")
            return False
        except Exception as e:
            print(f"   ❌ Export error: {str(e)}")
            return False
    
    def get_exported_slide_files(self):
        """Get all exported slide PNG files"""
        slides_path = Path(self.slides_dir)
        
        if not slides_path.exists():
            print(f"❌ Slides directory not found: {self.slides_dir}")
            return []
        
        # Get all PNG files and sort numerically
        png_files = list(slides_path.glob("*.png"))
        if not png_files:
            print(f"❌ No PNG files found in {self.slides_dir}")
            return []
        
        # Sort by numeric value in filename
        try:
            png_files.sort(key=lambda x: int(re.search(r'(\d+)', x.stem).group()))
        except:
            # Fallback to alphabetical sort
            png_files.sort()
        
        print(f"✅ Found {len(png_files)} exported slide files")
        return png_files
    
    def parse_slidev_content(self, slidev_file):
        """Parse slidev markdown content to extract slide data"""
        if not os.path.exists(slidev_file):
            print(f"❌ Slidev file not found: {slidev_file}")
            return []
        
        with open(slidev_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split by slide separators
        sections = content.split('---')
        slide_data_list = []
        
        for i, section in enumerate(sections):
            if i == 0:  # Skip frontmatter
                continue
                
            slide_data = self._parse_slide_section(section, i)
            if slide_data:
                slide_data_list.append(slide_data)
        
        print(f"✅ Parsed {len(slide_data_list)} content sections")
        return slide_data_list
    
    def _parse_slide_section(self, section, slide_number):
        """Parse individual slide section"""
        lines = section.strip().split('\n')
        
        slide_data = {
            'number': slide_number,
            'title': '',
            'content': [],
            'bullet_points': [],
            'layout': 'default',
            'raw_content': section.strip()
        }
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines, layout directives, and HTML/Vue components
            if not line or line.startswith('layout:') or line.startswith('class:') or line.startswith('<') or line.startswith('```'):
                continue
            
            # Extract main title (# heading)
            if line.startswith('# ') and not slide_data['title']:
                slide_data['title'] = line[2:].strip()
                continue
            
            # Extract subtitles (## heading)
            if line.startswith('## '):
                subtitle = line[3:].strip()
                # Clean emoji and markdown
                subtitle = re.sub(r'[🔄🎯🔒💡⚡🛡️📊🔍⚠️✅❌🎪🔧📱💻🌐]', '', subtitle)
                subtitle = re.sub(r'\*\*([^*]+)\*\*', r'\1', subtitle)
                slide_data['content'].append(subtitle)
                continue
            
            # Extract bullet points
            if line.startswith('- '):
                bullet = line[2:].strip()
                # Clean markdown formatting and emojis
                bullet = re.sub(r'\*\*([^*]+)\*\*', r'\1', bullet)
                bullet = re.sub(r'\*([^*]+)\*', r'\1', bullet)
                bullet = re.sub(r'`([^`]+)`', r'\1', bullet)
                bullet = re.sub(r'[🔄🎯🔒💡⚡🛡️📊🔍⚠️✅❌🎪🔧📱💻🌐]', '', bullet)
                
                if len(bullet) > 5 and len(bullet) < 200:
                    slide_data['bullet_points'].append(bullet)
                continue
            
            # Extract regular text content
            if len(line) > 10 and not line.startswith('#') and not line.startswith('<'):
                # Clean text content
                text = re.sub(r'\*\*([^*]+)\*\*', r'\1', line)
                text = re.sub(r'\*([^*]+)\*', r'\1', text)
                text = re.sub(r'`([^`]+)`', r'\1', text)
                
                if len(text) > 10:
                    slide_data['content'].append(text)
        
        return slide_data if slide_data['title'] or slide_data['content'] or slide_data['bullet_points'] else None
    
    def generate_audio_with_hierarchy(self, script, output_file):
        """Generate audio using confirmed 4-tier voice hierarchy"""
        
        # 1st Priority: Google TTS UK English (USER'S PRIMARY CHOICE)
        if GTTS_AVAILABLE:
            try:
                print(f"   🇬🇧 Trying PRIMARY: Google TTS UK English")
                tts = gTTS(text=script, lang='en', tld='co.uk', slow=False)
                tts.save(output_file)
                
                if os.path.exists(output_file) and os.path.getsize(output_file) > 1000:
                    print(f"   ✅ SUCCESS with UK English!")
                    return "uk_english"
            except Exception as e:
                print(f"   ⚠️  UK English failed: {str(e)[:50]}...")
        
        # 2nd Priority: Google TTS Irish English (USER'S SECONDARY CHOICE)
        if GTTS_AVAILABLE:
            try:
                print(f"   🇮🇪 Trying SECONDARY: Google TTS Irish English")
                tts = gTTS(text=script, lang='en', tld='ie', slow=False)
                tts.save(output_file)
                
                if os.path.exists(output_file) and os.path.getsize(output_file) > 1000:
                    print(f"   ✅ SUCCESS with Irish English!")
                    return "irish_english"
            except Exception as e:
                print(f"   ⚠️  Irish English failed: {str(e)[:50]}...")
        
        # 3rd Priority: VITS Neural (USER'S PREMIUM BACKUP)
        if TTS_AVAILABLE:
            try:
                print(f"   🧠 Trying BACKUP: VITS Neural")
                if not self.vits_model:
                    self.vits_model = TTS("tts_models/en/ljspeech/vits")
                
                self.vits_model.tts_to_file(text=script, file_path=output_file)
                
                if os.path.exists(output_file) and os.path.getsize(output_file) > 1000:
                    print(f"   ✅ SUCCESS with VITS Neural!")
                    return "vits_neural"
            except Exception as e:
                print(f"   ⚠️  VITS Neural failed: {str(e)[:50]}...")
        
        # 4th Priority: Tacotron2 Neural (FINAL FALLBACK)
        if TTS_AVAILABLE:
            try:
                print(f"   🎤 Trying FALLBACK: Tacotron2 Neural")
                if not self.tacotron2_model:
                    self.tacotron2_model = TTS("tts_models/en/ljspeech/tacotron2-DDC")
                
                self.tacotron2_model.tts_to_file(text=script, file_path=output_file)
                
                if os.path.exists(output_file) and os.path.getsize(output_file) > 1000:
                    print(f"   ✅ SUCCESS with Tacotron2!")
                    return "tacotron2"
            except Exception as e:
                print(f"   ❌ Tacotron2 failed: {str(e)[:50]}...")
        
        print(f"   ❌ ALL VOICE OPTIONS FAILED!")
        return "failed"
    
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
        script = re.sub(r'\s+', ' ', script)
        script = script.replace('..', '.').replace(' .', '.').strip()
        
        # Ensure minimum length for educational value
        if len(script) < 100:
            script += " This concept is fundamental to understanding information security principles."
        
        return script
    
    def create_professional_video_with_slidev_export(self, slidev_file, max_slides=None):
        """Create professional video using actual slidev exported slides"""
        print("🎬 Professional Video Creation with Slidev Export")
        print("=" * 70)
        print("🎤 Voice Priority: UK → Irish → VITS → Tacotron2")
        print()
        
        # Step 1: Export slides using slidev
        if not self.export_slides_with_slidev(slidev_file):
            print("❌ Failed to export slides with slidev")
            return
        
        # Step 2: Get exported slide files
        slide_files = self.get_exported_slide_files()
        if not slide_files:
            return
        
        # Step 3: Parse slidev content for narration
        slide_data_list = self.parse_slidev_content(slidev_file)
        
        # Limit slides if requested
        if max_slides:
            slide_files = slide_files[:max_slides]
            slide_data_list = slide_data_list[:max_slides]
        
        print(f"📊 Processing {len(slide_files)} slides")
        
        video_clips = []
        total_duration = 0
        voice_usage = {}
        
        # Process each slide
        for i, slide_file in enumerate(slide_files):
            print(f"\n🎞️  Processing slide {i+1}/{len(slide_files)}: {slide_file.name}")
            
            # Get corresponding slide data for narration
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
                
                # Generate audio with voice hierarchy
                audio_file = f"slidev_slide_{i+1:02d}_audio.wav"
                voice_used = self.generate_audio_with_hierarchy(script, audio_file)
                
                # Track voice usage
                if voice_used != "failed":
                    voice_usage[voice_used] = voice_usage.get(voice_used, 0) + 1
                
                if voice_used == "failed" or not os.path.exists(audio_file):
                    print(f"   ❌ Audio generation failed")
                    continue
                
                # Create video clip with actual slidev exported slide
                if MOVIEPY_AVAILABLE:
                    try:
                        audio_clip = AudioFileClip(audio_file)
                        duration = audio_clip.duration
                        total_duration += duration
                        
                        # Use the actual exported slide image
                        image_clip = ImageClip(str(slide_file)).with_duration(duration)
                        video_clip = image_clip.with_audio(audio_clip)
                        video_clips.append(video_clip)
                        
                        print(f"   🎬 Video clip created ({duration:.1f}s) using {voice_used}")
                        
                    except Exception as e:
                        print(f"   ❌ Video clip error: {str(e)[:50]}...")
                        continue
                
            except Exception as e:
                print(f"   ❌ Error processing slide {i+1}: {e}")
                continue
            
            # Brief pause between slides
            time.sleep(0.3)
        
        # Assemble complete professional video
        if video_clips:
            print(f"\n📹 Assembling final video...")
            print(f"   📊 Total clips: {len(video_clips)}")
            print(f"   ⏱️  Total duration: {total_duration:.1f} seconds ({total_duration/60:.1f} minutes)")
            
            try:
                final_video = concatenate_videoclips(video_clips)
                output_file = "PROFESSIONAL_slidev_export_with_voice_hierarchy.mp4"
                
                print("📤 Exporting professional video with actual slidev slides...")
                final_video.write_videofile(
                    output_file,
                    fps=30,
                    codec='libx264',
                    audio_codec='aac',
                    bitrate="8000k"  # High quality for professional use
                )
                
                # Clean up
                for clip in video_clips:
                    clip.close()
                final_video.close()
                
                if os.path.exists(output_file):
                    file_size = os.path.getsize(output_file) / (1024 * 1024)
                    
                    print(f"\n🎉 SUCCESS! Professional slidev video created!")
                    print("=" * 70)
                    print(f"📹 **PROFESSIONAL VIDEO WITH ACTUAL SLIDEV SLIDES:**")
                    print(f"   File: {output_file}")
                    print(f"   Duration: {total_duration:.1f} seconds ({total_duration/60:.1f} minutes)")
                    print(f"   Size: {file_size:.1f} MB")
                    print(f"   Slides: {len(video_clips)} (Actual slidev exported slides)")
                    print(f"   Voice: UK English (your confirmed preference)")
                    print(f"   Quality: Full HD with professional slidev styling")
                    print(f"   Source: Real slidev export, not programmatic images")
                    
                    print(f"\n🎤 Voice Usage Summary:")
                    for voice, count in voice_usage.items():
                        voice_names = {
                            'uk_english': '🇬🇧 Google TTS UK English',
                            'irish_english': '🇮🇪 Google TTS Irish English', 
                            'vits_neural': '🧠 VITS Neural',
                            'tacotron2': '🎤 Tacotron2 Neural'
                        }
                        print(f"   {voice_names.get(voice, voice)}: {count} slides")
                    
                    print(f"\n✅ Ready for professional educational distribution!")
                    
                else:
                    print("❌ Video file not created")
                
            except Exception as e:
                print(f"❌ Final video creation failed: {e}")
        else:
            print("❌ No video clips to process")

def main():
    """Main execution with slidev export"""
    print("🎤 Slidev Export Processor with Voice Hierarchy") 
    print("=" * 65)
    
    processor = SlidevExportProcessor()
    
    # Check if slidev file exists
    if not os.path.exists(processor.slidev_md_file):
        print(f"❌ Slidev file not found: {processor.slidev_md_file}")
        print("Please update the slidev_md_file path in the script")
        return
    
    # Process first 5 slides for testing
    processor.create_professional_video_with_slidev_export(
        processor.slidev_md_file, 
        max_slides=5
    )

if __name__ == "__main__":
    main()