#!/usr/bin/env python3
"""
Slidev Click-Synchronized Video Processor (ElevenLabs Edition)
=============================================================

Creates videos with click-level narration synchronization using proper Slidev 
click markers [click] within presenter notes and --with-clicks PNG export.
Uses ElevenLabs API for high-quality voice generation.

Generates individual video segments for each click state, providing perfect
timing where each visual element appears exactly when it's mentioned in narration.

Proper Slidev click format:
<!--
Initial notes before any clicks

[click] Notes for first click

[click] Notes for second click

[click:3] Skip to third click
-->
"""

import os
import sys
import time
import re
import subprocess
from pathlib import Path
import requests

# Set TTS environment
os.environ['COQUI_TOS_AGREED'] = '1'
os.environ['COQUI_TTS_AGREED'] = '1'

try:
    from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False

# ElevenLabs API configuration
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')
ELEVENLABS_VOICE_ID = "Milav English"  # Your cloned voice
ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"

class SlidevClickProcessorElevenLabs:
    """Processor for Slidev click-synchronized video generation with ElevenLabs TTS"""
    
    def __init__(self, slidev_file):
        self.slides_dir = "temp_proper_slides"
        self.slidev_md_file = slidev_file
        self.temp_audio_files = []
        self.voice_id = None
        
        print("🎯 Slidev Click-Synchronized Video Processor (ElevenLabs Edition)")
        print("📍 Using [click] markers with --with-clicks PNG export")
        print(f"✅ ElevenLabs API Available: {bool(ELEVENLABS_API_KEY)}")
        print(f"✅ MoviePy Available: {MOVIEPY_AVAILABLE}")
        
        if ELEVENLABS_API_KEY:
            self._initialize_elevenlabs()
        else:
            print("❌ ELEVENLABS_API_KEY environment variable not set!")
    
    def _initialize_elevenlabs(self):
        """Initialize ElevenLabs connection and find voice ID"""
        try:
            print("🔍 Finding ElevenLabs voice...")
            headers = {
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json"
            }
            
            # Get available voices
            response = requests.get(f"{ELEVENLABS_API_URL}/voices", headers=headers)
            if response.status_code == 200:
                voices = response.json()["voices"]
                
                # Find the "Milav English" voice
                for voice in voices:
                    if voice["name"] == ELEVENLABS_VOICE_ID:
                        self.voice_id = voice["voice_id"]
                        print(f"   ✅ Found voice '{ELEVENLABS_VOICE_ID}': {self.voice_id}")
                        return
                
                print(f"   ❌ Voice '{ELEVENLABS_VOICE_ID}' not found")
                print("   Available voices:")
                for voice in voices:
                    print(f"     - {voice['name']} ({voice['voice_id']})")
            else:
                print(f"   ❌ Failed to get voices: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ ElevenLabs initialization error: {str(e)}")
    
    def parse_proper_click_notes(self, slidev_file):
        """Parse slidev markdown to extract proper [click] presenter notes"""
        if not os.path.exists(slidev_file):
            print(f"❌ Slidev file not found: {slidev_file}")
            return []
        
        with open(slidev_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split by slide separators
        sections = content.split('---')
        slide_data_list = []
        
        slide_counter = 1
        for i, section in enumerate(sections):
            if i == 0:  # Skip YAML frontmatter
                continue
            
            # Skip config sections
            if (section.strip().startswith('theme:') or 
                section.strip().startswith('layout:') or
                ('background:' in section and 'title:' in section and '# ' not in section)):
                continue
            
            slide_data = self._parse_slide_proper_clicks(section, slide_counter)
            if slide_data:
                slide_data_list.append(slide_data)
                slide_counter += 1
        
        print(f"✅ Parsed {len(slide_data_list)} slides with proper click notes")
        return slide_data_list
    
    def _parse_slide_proper_clicks(self, section, slide_number):
        """Parse individual slide section for proper [click] markers in presenter notes"""
        lines = section.strip().split('\n')
        
        slide_data = {
            'number': slide_number,
            'title': '',
            'click_segments': [],  # Array of click segments with narration
            'raw_content': section.strip()
        }
        
        # Extract title
        for line in lines:
            line = line.strip()
            if line.startswith('# ') and not slide_data['title']:
                slide_data['title'] = line[2:].strip()
                break
        
        # Find HTML comment with presenter notes
        html_comment_pattern = r'<!--\s*(.*?)\s*-->'
        comment_matches = re.findall(html_comment_pattern, section, re.DOTALL)
        
        if not comment_matches:
            print(f"   ⚠️ No presenter notes found for slide {slide_number}")
            return slide_data if slide_data['title'] else None
        
        # Use the last comment as presenter notes (Slidev convention)
        presenter_notes = comment_matches[-1].strip()
        
        # Parse click markers within the notes
        # Split by [click] markers, handling [click:n] format as well
        click_pattern = r'\[click(?::(\d+))?\]'
        
        # Split the notes by click markers
        parts = re.split(click_pattern, presenter_notes)
        
        current_click = 0
        
        # First part is always before any clicks (click 0)
        if parts[0].strip():
            slide_data['click_segments'].append({
                'click': 0,
                'narration': parts[0].strip(),
                'duration': None
            })
            print(f"   📝 Found initial segment for slide {slide_number}: {len(parts[0].strip())} chars")
        
        # Process remaining parts (they alternate between click numbers and content)
        i = 1
        while i < len(parts):
            click_num_str = parts[i] if parts[i] else None
            content = parts[i + 1] if i + 1 < len(parts) else ""
            
            if click_num_str:
                # Explicit click number [click:n]
                current_click = int(click_num_str)
            else:
                # Sequential click [click]
                current_click += 1
            
            if content.strip():
                slide_data['click_segments'].append({
                    'click': current_click,
                    'narration': content.strip(),
                    'duration': None
                })
                print(f"   🖱️ Found click {current_click} for slide {slide_number}: {len(content.strip())} chars")
            
            i += 2
        
        # Sort segments by click number
        slide_data['click_segments'].sort(key=lambda x: x['click'])
        
        return slide_data if slide_data['title'] or slide_data['click_segments'] else None
    
    def export_click_slides(self, slidev_file):
        """Export slides with click states using --with-clicks flag"""
        print("📤 Exporting slides with click animations...")
        
        if not os.path.exists(slidev_file):
            print(f"❌ Slidev file not found: {slidev_file}")
            return False
        
        # Create output directory
        os.makedirs(self.slides_dir, exist_ok=True)
        
        try:
            slidev_dir = os.path.dirname(slidev_file)
            slidev_filename = os.path.basename(slidev_file)
            
            print(f"   📁 Working directory: {slidev_dir}")
            print(f"   📄 Slidev file: {slidev_filename}")
            
            # PNG export WITH --with-clicks to capture each click state
            export_cmd = [
                "npx", "slidev", "export", 
                slidev_filename,
                "--output", os.path.abspath(self.slides_dir),
                "--format", "png",
                "--with-clicks",  # This exports each click state as separate PNG
                "--timeout", "60000"
            ]
            
            print(f"   🚀 Running: {' '.join(export_cmd)}")
            
            result = subprocess.run(
                export_cmd,
                cwd=slidev_dir,
                capture_output=True,
                text=True,
                timeout=120
            )
            
            if result.returncode == 0:
                print("   ✅ Click-based slides exported successfully!")
                
                slide_files = list(Path(self.slides_dir).glob("*.png"))
                if slide_files:
                    print(f"   📊 Exported {len(slide_files)} click states")
                    return True
                else:
                    print("   ❌ No PNG files found after export")
                    return False
            else:
                print(f"   ❌ Slidev export failed:")
                print(f"   Error: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            print("   ❌ Slidev export timed out")
            return False
        except FileNotFoundError:
            print("   ❌ Slidev not found. Please install with: npm install -g @slidev/cli")
            return False
        except Exception as e:
            print(f"   ❌ Export error: {str(e)}")
            return False
    
    def generate_audio_with_elevenlabs(self, script, output_file):
        """Generate audio using ElevenLabs API"""
        if not ELEVENLABS_API_KEY or not self.voice_id:
            print("   ❌ ElevenLabs not properly configured")
            return False
        
        try:
            print(f"   🎙️ Generating audio with ElevenLabs (Milav English)")
            
            headers = {
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json"
            }
            
            data = {
                "text": script,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.75,
                    "similarity_boost": 0.75,
                    "style": 0.0,
                    "use_speaker_boost": True
                }
            }
            
            response = requests.post(
                f"{ELEVENLABS_API_URL}/text-to-speech/{self.voice_id}",
                headers=headers,
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                with open(output_file, 'wb') as f:
                    f.write(response.content)
                
                if os.path.exists(output_file) and os.path.getsize(output_file) > 1000:
                    print(f"   ✅ Audio generated successfully")
                    return True
                else:
                    print(f"   ❌ Audio file too small or not created")
                    return False
            else:
                print(f"   ❌ ElevenLabs API error: {response.status_code}")
                if response.text:
                    print(f"   Error details: {response.text[:100]}...")
                return False
                
        except requests.exceptions.Timeout:
            print(f"   ❌ ElevenLabs API timeout")
            return False
        except Exception as e:
            print(f"   ❌ ElevenLabs TTS failed: {str(e)[:50]}...")
            return False
    
    def create_proper_click_video(self, slidev_file, max_slides=None):
        """Create video with proper [click] synchronized narration using ElevenLabs"""
        print("🎬 Proper Click-Synced Video Creation (ElevenLabs Edition)")
        print("=" * 50)
        
        # Step 1: Parse proper click notes
        click_data_list = self.parse_proper_click_notes(slidev_file)
        if not click_data_list:
            print("❌ No click data found")
            return
        
        # Limit slides if requested
        if max_slides:
            click_data_list = click_data_list[:max_slides]
        
        # Step 2: Export slides with click states
        if not self.export_click_slides(slidev_file):
            print("❌ Failed to export slides")
            return
        
        # Step 3: Get exported slide files (now with click states)
        slide_files = list(Path(self.slides_dir).glob("*.png"))
        # Sort by slide number then click number (001-01.png, 001-02.png, etc.)
        slide_files.sort(key=lambda x: (
            int(re.search(r'(\d{3})', x.stem).group()),  # slide number
            int(re.search(r'-(\d{2})', x.stem).group(1)) # click number
        ))
        
        print(f"📊 Processing {len(click_data_list)} slides with {len(slide_files)} click state images")
        
        video_clips = []
        total_duration = 0
        
        # Create a mapping of slide files by slide and click number
        slide_file_map = {}
        for img_file in slide_files:
            match = re.search(r'(\d{3})-(\d{2})\.png', img_file.name)
            if match:
                slide_num = int(match.group(1))
                click_num = int(match.group(2))
                if slide_num not in slide_file_map:
                    slide_file_map[slide_num] = {}
                slide_file_map[slide_num][click_num] = img_file
        
        print(f"📋 Mapped {len(slide_file_map)} slides with click states")
        
        # Process each slide with its click segments
        for slide_data in click_data_list:
            slide_num = slide_data['number']
            slide_title = slide_data.get('title', f'Slide {slide_num}')
            click_segments = slide_data.get('click_segments', [])
            
            print(f"\n🎞️ Processing slide {slide_num}: {slide_title[:50]}...")
            
            if not click_segments:
                print(f"   ⚠️ No click segments found for slide {slide_num}, skipping")
                continue
                
            if slide_num not in slide_file_map:
                print(f"   ❌ No exported images found for slide {slide_num}")
                continue
            
            slide_images = slide_file_map[slide_num]
            print(f"   📷 Found {len(slide_images)} click states for slide {slide_num}")
            
            # Process each click segment and match with corresponding image
            for segment in click_segments:
                click_num = segment['click']
                narration = segment['narration']
                
                # Find the corresponding image for this click state
                # Click 0 = state 1, click 1 = state 2, etc.
                image_state = click_num + 1
                
                if image_state not in slide_images:
                    # Use the last available state if exact match not found
                    available_states = sorted(slide_images.keys())
                    if available_states:
                        image_state = min(image_state, max(available_states))
                    else:
                        print(f"   ❌ No image state available for click {click_num}")
                        continue
                
                slide_image = slide_images[image_state]
                
                if click_num == 0:
                    print(f"   📝 Processing initial segment → {slide_image.name}: {narration[:50]}...")
                else:
                    print(f"   🖱️ Processing click {click_num} → {slide_image.name}: {narration[:50]}...")
                
                # Generate audio for this segment using ElevenLabs
                audio_file = f"temp_proper_slide_{slide_num}_click_{click_num}.mp3"
                self.temp_audio_files.append(audio_file)
                
                if self.generate_audio_with_elevenlabs(narration, audio_file):
                    # Create video clip for this segment with correct click state image
                    try:
                        audio_clip = AudioFileClip(audio_file)
                        duration = audio_clip.duration
                        segment['duration'] = duration
                        total_duration += duration
                        
                        # Use the specific click state image
                        image_clip = ImageClip(str(slide_image)).set_duration(duration)
                        video_clip = image_clip.set_audio(audio_clip)
                        video_clips.append(video_clip)
                        
                        if click_num == 0:
                            print(f"      ✅ Initial segment processed ({duration:.1f}s)")
                        else:
                            print(f"      ✅ Click {click_num} processed ({duration:.1f}s)")
                        
                    except Exception as e:
                        print(f"      ❌ Video clip error: {str(e)[:50]}...")
                        continue
                else:
                    print(f"      ❌ Audio generation failed for segment")
        
        # Assemble final video
        if video_clips:
            print(f"\n📹 Assembling proper click-synced video...")
            print(f"   📊 Total clips: {len(video_clips)}")
            print(f"   ⏱️ Total duration: {total_duration:.1f} seconds ({total_duration/60:.1f} minutes)")
            
            try:
                final_video = concatenate_videoclips(video_clips)
                
                # Generate output filename
                input_basename = os.path.splitext(os.path.basename(slidev_file))[0]
                output_file = f"ELEVENLABS_CLICK_SYNCED_{input_basename}.mp4"
                
                print("📤 Exporting ElevenLabs click-synchronized video...")
                final_video.write_videofile(
                    output_file,
                    fps=30,
                    codec='libx264',
                    audio_codec='aac',
                    bitrate="8000k"
                )
                
                # Clean up
                for clip in video_clips:
                    clip.close()
                final_video.close()
                
                if os.path.exists(output_file):
                    file_size = os.path.getsize(output_file) / (1024 * 1024)
                    
                    print(f"\n🎉 SUCCESS! ElevenLabs click-synced video created!")
                    print("=" * 50)
                    print(f"📹 **ELEVENLABS CLICK-SYNCHRONIZED VIDEO:**")
                    print(f"   File: {output_file}")
                    print(f"   Duration: {total_duration:.1f} seconds ({total_duration/60:.1f} minutes)")
                    print(f"   Size: {file_size:.1f} MB")
                    print(f"   Clips: {len(video_clips)} (Proper [click] synchronized)")
                    print(f"   Voice: Milav English (ElevenLabs)")
                    print(f"   Quality: HD with proper Slidev click timing")
                    
                    self.cleanup_temp_files()
                else:
                    print("❌ Video file not created")
                    self.cleanup_temp_files()
                    
            except Exception as e:
                print(f"❌ Final video creation failed: {e}")
                self.cleanup_temp_files()
        else:
            print("❌ No video clips to process")
            self.cleanup_temp_files()
    
    def cleanup_temp_files(self):
        """Clean up temporary files"""
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

def main():
    """Main execution for proper click-synced processing with ElevenLabs"""
    print("🎯 Slidev Click-Synchronized Video Processor (ElevenLabs Edition)")
    print("=" * 50)
    
    if len(sys.argv) < 2:
        print("❌ Error: Slidev file path is required!")
        print("💡 Usage: python slidev_click_processor_elevenlabs.py <slidev_file.md> [max_slides]")
        print("💡 Examples:")
        print("   python slidev_click_processor_elevenlabs.py content/slides/my-presentation.md")
        print("   python slidev_click_processor_elevenlabs.py content/slides/my-presentation.md 5")
        print("💡 Environment: Set ELEVENLABS_API_KEY environment variable")
        return
    
    slidev_file = sys.argv[1]
    max_slides = None
    
    if len(sys.argv) > 2:
        try:
            max_slides = int(sys.argv[2])
            if max_slides <= 0:
                print("⚠️ Invalid max_slides value, using all slides")
                max_slides = None
        except ValueError:
            print("⚠️ Invalid max_slides argument, using all slides")
    
    if not os.path.exists(slidev_file):
        print(f"❌ Slidev file not found: {slidev_file}")
        return
    
    if not slidev_file.lower().endswith('.md'):
        print(f"⚠️ Warning: File doesn't have .md extension: {slidev_file}")
    
    processor = SlidevClickProcessorElevenLabs(slidev_file)
    
    print(f"📁 Input file: {slidev_file}")
    if max_slides:
        print(f"🎬 Processing: {max_slides} slides max")
    else:
        print(f"🎬 Processing: All slides")
    print()
    
    try:
        processor.create_proper_click_video(slidev_file, max_slides)
    except KeyboardInterrupt:
        print("\n⚠️ Process interrupted by user")
        processor.cleanup_temp_files()
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        processor.cleanup_temp_files()

if __name__ == "__main__":
    main()