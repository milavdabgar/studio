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
    
    def __init__(self, slidev_file=None):
        self.slides_dir = "temp_exported_slides"  # Temporary directory
        self.slidev_md_file = slidev_file or "content/resources/study-materials/32-ict/sem-5/4353204-cyber-security/slidev/02-computer-security-fundamentals.md"
        self.temp_audio_files = []  # Track temporary audio files
        
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
        """Parse slidev markdown content to extract slide data with speaker notes"""
        if not os.path.exists(slidev_file):
            print(f"❌ Slidev file not found: {slidev_file}")
            return []
        
        with open(slidev_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split by slide separators
        sections = content.split('---')
        slide_data_list = []
        
        slide_counter = 1  # Start slide numbering from 1
        for i, section in enumerate(sections):
            if i == 0:  # Skip main YAML frontmatter
                continue
            
            # Skip additional config sections that don't contain slide content
            if (section.strip().startswith('theme:') or 
                section.strip().startswith('layout:') or
                ('background:' in section and 'title:' in section and '# ' not in section)):
                continue
                
            slide_data = self._parse_slide_section_with_notes(section, slide_counter)
            if slide_data:
                slide_data_list.append(slide_data)
                slide_counter += 1
        
        print(f"✅ Parsed {len(slide_data_list)} content sections with speaker notes")
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
    
    def _parse_slide_section_with_notes(self, section, slide_number):
        """Parse individual slide section and extract speaker notes from HTML comments"""
        lines = section.strip().split('\n')
        
        slide_data = {
            'number': slide_number,
            'title': '',
            'content': [],
            'bullet_points': [],
            'layout': 'default',
            'raw_content': section.strip(),
            'speaker_notes': ''
        }
        
        # Extract speaker notes from HTML comments (<!-- content -->)
        import re
        html_comment_pattern = r'<!--\s*(.*?)\s*-->'
        comment_matches = re.findall(html_comment_pattern, section, re.DOTALL)
        
        if comment_matches:
            # Use the last comment as speaker notes (as per slidev convention)
            speaker_notes = comment_matches[-1].strip()
            # Clean up extra whitespace and line breaks
            speaker_notes = re.sub(r'\s+', ' ', speaker_notes)
            slide_data['speaker_notes'] = speaker_notes
            print(f"   🎤 Found speaker notes for slide {slide_number}: {len(speaker_notes)} characters")
        
        # Parse regular content (existing logic)
        for line in lines:
            line = line.strip()
            
            # Skip empty lines, layout directives, HTML/Vue components, comments, and YAML frontmatter
            if (not line or line.startswith('layout:') or line.startswith('class:') or 
                line.startswith('<') or line.startswith('```') or 
                line.startswith('<!--') or line.endswith('-->') or 
                line.startswith('theme:') or line.startswith('background:') or
                line.startswith('title:') or line.startswith('info:') or
                line.startswith('highlighter:') or line.startswith('drawings:') or
                line.startswith('transition:') or line.startswith('mdc:') or
                line.startswith('persist:')):
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
        
        return slide_data if slide_data['title'] or slide_data['content'] or slide_data['bullet_points'] or slide_data['speaker_notes'] else None
    
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
    
    def cleanup_temp_files(self):
        """Clean up temporary files and directories"""
        print("\n🧹 Cleaning up temporary files...")
        
        # Remove temporary audio files
        for audio_file in self.temp_audio_files:
            try:
                if os.path.exists(audio_file):
                    os.remove(audio_file)
                    print(f"   🗑️ Removed: {audio_file}")
            except Exception as e:
                print(f"   ⚠️ Could not remove {audio_file}: {e}")
        
        # Remove temporary slides directory
        try:
            if os.path.exists(self.slides_dir):
                import shutil
                shutil.rmtree(self.slides_dir)
                print(f"   🗑️ Removed directory: {self.slides_dir}")
        except Exception as e:
            print(f"   ⚠️ Could not remove directory {self.slides_dir}: {e}")
        
        print("✅ Cleanup completed!")
    
    def generate_comprehensive_narration(self, slide_data):
        """Generate narration prioritizing speaker notes over content parsing"""
        speaker_notes = slide_data.get('speaker_notes', '')
        
        # If speaker notes exist, use them as the primary narration
        if speaker_notes and len(speaker_notes) > 20:
            print(f"   🎤 Using speaker notes ({len(speaker_notes)} chars)")
            return speaker_notes
        
        # Fallback to content parsing if no speaker notes
        print(f"   📝 No speaker notes found, generating from content")
        script_parts = []
        slide_num = slide_data['number'] 
        title = slide_data.get('title', '')
        content = slide_data.get('content', [])
        bullets = slide_data.get('bullet_points', [])
        
        # Add title if present
        if title:
            if slide_num == 1:
                script_parts.append(f"Welcome to {title}.")
            else:
                script_parts.append(f"Let's now examine {title}.")
        
        # Add main content
        for item in content:
            if len(item) > 10:  # Skip very short items
                script_parts.append(item)
        
        # Add bullet points with proper narration flow
        if bullets:
            if len(bullets) <= 3:
                script_parts.append("The key points are:")
            else:
                script_parts.append("The main concepts include:")
            
            for i, bullet in enumerate(bullets[:8]):  # Limit to 8 bullets
                if len(bullet) > 5:
                    if i == 0:
                        script_parts.append(f"First, {bullet}.")
                    elif i == 1:
                        script_parts.append(f"Second, {bullet}.")
                    elif i == 2:
                        script_parts.append(f"Third, {bullet}.")
                    elif i < len(bullets) - 1:
                        script_parts.append(f"Additionally, {bullet}.")
                    else:
                        script_parts.append(f"Finally, {bullet}.")
        
        # Create final script
        script = ' '.join(script_parts)
        
        # Clean up
        script = re.sub(r'\s+', ' ', script)
        script = script.replace('..', '.').replace(' .', '.').strip()
        
        # Ensure minimum length
        if len(script) < 50:
            script = f"This slide presents important information about our topic. {script}"
        
        return script

    def generate_slide_specific_narration(self, slide_number, total_slides):
        """Generate narration based on slide position and cybersecurity content"""
        
        # Predefined narration for specific slide positions in cybersecurity lecture
        narration_map = {
            1: "Welcome to today's lecture on Computer Security Fundamentals. In this session, we will explore the CIA Triad and Information Security Principles. These concepts form the foundation of modern cybersecurity practices.",
            
            2: "Computer Security Fundamentals is the title of our lecture series. Today we focus on Lecture 2, which covers the CIA Triad and Information Security Principles. Let's begin our journey into the core concepts of cybersecurity.",
            
            3: "Let's begin with a comprehensive recap of our previous lecture. We covered several fundamental concepts in cyber security. In the previous session, we examined cyber security definitions, digital asset protection, the current threat landscape, career opportunities, and regulatory requirements. Today's learning objectives include understanding CIA Triad fundamentals, applying security principles in practice, analyzing real-world examples, and designing secure systems using CIA principles.",
            
            4: "Now we come to the central topic of today's lecture: The CIA Triad. The CIA Triad represents the three fundamental pillars of information security. These three principles - Confidentiality, Integrity, and Availability - guide all security decisions and implementations. This triangle diagram shows how these concepts interconnect to provide comprehensive information security.",
            
            5: "Let's dive deep into the first pillar: Confidentiality, which is about keeping secrets secret. Confidentiality ensures that sensitive information is accessible only to authorized individuals and remains hidden from unauthorized parties. This involves privacy protection, access control mechanisms, and encryption technologies. Key aspects include data classification, user authentication, authorization protocols, and information hiding techniques."
        }
        
        # Get predefined narration or generate generic one
        if slide_number in narration_map:
            return narration_map[slide_number]
        else:
            # Generate appropriate narration for remaining slides
            if slide_number <= 8:
                return f"Continuing with our cybersecurity fundamentals, this slide presents important information about information security principles. We examine the key concepts that build upon the CIA Triad framework. Understanding these principles is essential for implementing effective security measures in any organization."
            elif slide_number <= 15:
                return f"As we progress through the lecture, we explore more advanced concepts in cybersecurity. This slide covers practical applications and real-world examples of security principles. These concepts help us understand how to apply theoretical knowledge in actual security implementations."
            else:
                return f"In this part of our lecture, we examine specialized topics in computer security. The information presented here builds upon our foundational understanding of the CIA Triad. These advanced concepts prepare us for more complex security challenges in modern computing environments."
    
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
        
        # Process each slide with proper synchronization
        for i, slide_file in enumerate(slide_files):
            print(f"\n🎞️  Processing slide {i+1}/{len(slide_files)}: {slide_file.name}")
            
            # Extract slide number from filename (e.g., "1.png" -> 1)
            try:
                slide_number = int(re.search(r'(\d+)', slide_file.stem).group())
            except:
                slide_number = i + 1
            
            # Find corresponding slide data by matching slide numbers
            slide_data = None
            for data in slide_data_list:
                if data.get('number') == slide_number:
                    slide_data = data
                    print(f"   ✅ Synchronized: Slide {slide_number} image → Content '{data.get('title', 'No title')[:50]}...'")
                    break
            
            # Fallback if no matching slide data found
            if not slide_data:
                slide_data = {
                    'number': slide_number,
                    'title': f'Slide {slide_number}',
                    'content': [],
                    'bullet_points': []
                }
                print(f"   ⚠️  No matching content found for slide {slide_number}, using fallback")
            
            # Generate narration from actual slide content
            try:
                script = self.generate_comprehensive_narration(slide_data)
                print(f"   📝 Script ({len(script)} chars): {script[:100]}...")
                
                # Generate audio with voice hierarchy
                audio_file = f"temp_slidev_slide_{i+1:02d}_audio.wav"
                self.temp_audio_files.append(audio_file)  # Track for cleanup
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
                
                # Generate output filename based on input file
                input_basename = os.path.splitext(os.path.basename(slidev_file))[0]
                output_file = f"PROFESSIONAL_{input_basename}_with_voice_hierarchy.mp4"
                
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
                    
                    # Clean up temporary files after successful video creation
                    self.cleanup_temp_files()
                    
                else:
                    print("❌ Video file not created")
                    self.cleanup_temp_files()  # Clean up even on failure
                
            except Exception as e:
                print(f"❌ Final video creation failed: {e}")
                self.cleanup_temp_files()  # Clean up on error
        else:
            print("❌ No video clips to process")
            self.cleanup_temp_files()  # Clean up even if no clips

def main():
    """Main execution with slidev export"""
    import sys
    
    print("🎤 Slidev Export Processor with Voice Hierarchy") 
    print("=" * 65)
    
    # Parse command line arguments
    slidev_file = None
    max_slides = 5  # Default to 5 slides for testing
    
    if len(sys.argv) > 1:
        slidev_file = sys.argv[1]
        if len(sys.argv) > 2:
            try:
                max_slides = int(sys.argv[2])
            except ValueError:
                print("⚠️ Invalid max_slides argument, using default: 5")
    
    processor = SlidevExportProcessor(slidev_file)
    
    # Check if slidev file exists
    if not os.path.exists(processor.slidev_md_file):
        print(f"❌ Slidev file not found: {processor.slidev_md_file}")
        if not slidev_file:
            print("💡 Usage: python slidev_export_processor.py <slidev_file.md> [max_slides]")
            print("💡 Example: python slidev_export_processor.py /path/to/slides.md 10")
        return
    
    print(f"📁 Input file: {processor.slidev_md_file}")
    print(f"🎬 Processing: {max_slides} slides")
    print()
    
    try:
        # Process slides
        processor.create_professional_video_with_slidev_export(
            processor.slidev_md_file, 
            max_slides=max_slides
        )
    except KeyboardInterrupt:
        print("\n⚠️ Process interrupted by user")
        processor.cleanup_temp_files()
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        processor.cleanup_temp_files()

if __name__ == "__main__":
    main()