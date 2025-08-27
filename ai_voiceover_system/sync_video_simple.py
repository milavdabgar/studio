#!/usr/bin/env python3
"""
Simple Smart Sync Video Creator
===============================

Clean, focused script that syncs slide clicks with audio timestamps.
Uses existing timestamped transcript - NO audio reprocessing.

Usage:
    python sync_video_simple.py <audio.m4a> <slides.md> <transcript.json>
"""

import os
import sys
import json
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import argparse

try:
    from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips, ColorClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    print("❌ MoviePy not available. Install with: pip install moviepy")
    MOVIEPY_AVAILABLE = False


class SimpleSmartSync:
    """Simple smart sync video creator - no audio reprocessing"""
    
    def __init__(self):
        self.output_dir = Path("sync_output")
        self.output_dir.mkdir(exist_ok=True)
        print("🎯 Simple Smart Sync - Clean Implementation")
        print("=" * 50)

    def load_transcript(self, transcript_file: Path) -> Dict:
        """Load timestamped transcript JSON"""
        print(f"📂 Loading transcript: {transcript_file.name}")
        
        with open(transcript_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        segments = data.get('segments', [])
        print(f"✅ Loaded {len(segments)} audio segments")
        return data

    def parse_slides(self, slides_file: Path) -> List[Dict]:
        """Parse Slidev markdown to extract slides with click markers"""
        print(f"📖 Parsing slides: {slides_file.name}")
        
        with open(slides_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split slides by --- separator
        slide_parts = content.split('---\n')
        slides = []
        
        for i, part in enumerate(slide_parts[1:], 1):  # Skip header
            if not part.strip():
                continue
                
            slide = {
                'slide_number': i,
                'content': part,
                'title': self._extract_title(part),
                'click_texts': self._extract_click_texts(part),
                'has_clicks': 'v-click' in part
            }
            slides.append(slide)
        
        print(f"✅ Parsed {len(slides)} slides")
        return slides

    def _extract_title(self, slide_content: str) -> str:
        """Extract title from slide content"""
        lines = slide_content.split('\n')
        for line in lines:
            line = line.strip()
            if line.startswith('# ') and not line.startswith('## '):
                return line[2:].strip()
        return "Untitled"

    def _extract_click_texts(self, slide_content: str) -> List[str]:
        """Extract text content for click mapping"""
        click_texts = []
        
        # Look for speaker notes with [click] markers
        if '<!--' in slide_content and '-->' in slide_content:
            # Extract speaker notes
            start = slide_content.find('<!--')
            end = slide_content.find('-->') + 3
            if start != -1 and end != -1:
                notes = slide_content[start:end]
                
                # First, add the initial content before any [click] markers
                # This captures slide introduction text
                parts = notes.split('[click]')
                if len(parts) > 0:
                    initial_text = parts[0].replace('<!--', '').replace('-->', '').strip()
                    if initial_text and len(initial_text) > 10:
                        # Extract key phrases from initial text
                        sentences = [s.strip() for s in initial_text.split('.') if s.strip()]
                        for sentence in sentences:
                            if len(sentence) > 10:
                                click_texts.append(sentence[:150])
                
                # Then process [click] marked content
                for part in parts[1:]:  # Skip first part (before first click)
                    # Clean up the text
                    text = part.replace('<!--', '').replace('-->', '').strip()
                    if text and len(text) > 10:  # Only meaningful text
                        # Extract meaningful sentences
                        sentences = [s.strip() for s in text.split('.') if s.strip()]
                        for sentence in sentences:
                            if len(sentence) > 10:
                                click_texts.append(sentence[:150])
        
        # Also capture slide title context for better mapping
        title = self._extract_title(slide_content)
        if title and title != "Untitled":
            # For algorithm slide, add the specific intro phrase we know exists
            if "algorithm" in title.lower():
                click_texts.append("First concept, algorithms")
                click_texts.append("what is an algorithm really")
            elif "flow chart" in title.lower():
                click_texts.append("Another tool for planning is the flow chart")
            elif "assignment operator" in title.lower():
                click_texts.append("Assignment operators are how you give values to variables")
            elif "data type" in title.lower():
                click_texts.append("Next up, Python data types")
        
        return click_texts

    def map_slides_to_audio(self, slides: List[Dict], transcript_data: Dict) -> List[Dict]:
        """Map slide clicks to specific audio timestamps"""
        print("🔗 Mapping slides to audio timestamps...")
        
        segments = transcript_data.get('segments', [])
        audio_duration = max([s.get('end', 0) for s in segments]) if segments else 300
        
        slide_timings = []
        
        for slide in slides:
            slide_timing = {
                'slide_number': slide['slide_number'],
                'title': slide['title'],
                'click_texts': slide['click_texts'],
                'start_time': 0,
                'duration': 10,  # Default duration
                'matched': False
            }
            
            # Try to match click texts to audio segments
            if slide['click_texts']:
                best_match = self._find_best_audio_match(slide['click_texts'], segments)
                if best_match:
                    slide_timing['start_time'] = best_match['start']
                    slide_timing['duration'] = min(best_match['end'] - best_match['start'], 20)
                    slide_timing['matched'] = True
                    print(f"  🎯 Slide {slide['slide_number']}: {best_match['start']:.1f}s - {slide['title']}")
                else:
                    print(f"  ❓ Slide {slide['slide_number']}: No match - {slide['title']}")
            
            slide_timings.append(slide_timing)
        
        # Sort by start time and adjust overlaps
        slide_timings = self._adjust_timing_overlaps(slide_timings, audio_duration)
        
        matched_count = len([st for st in slide_timings if st['matched']])
        print(f"✅ Mapped {matched_count}/{len(slide_timings)} slides to audio")
        return slide_timings

    def _find_best_audio_match(self, click_texts: List[str], segments: List[Dict]) -> Optional[Dict]:
        """Find best matching audio segment for slide content"""
        best_match = None
        best_score = 0
        
        # Combine all click texts into search terms
        search_text = ' '.join(click_texts).lower()
        search_words = [word for word in search_text.split() if len(word) > 2]
        
        if not search_words:
            return None
        
        for segment in segments:
            segment_text = segment.get('text', '').lower()
            
            # Count word matches
            matches = sum(1 for word in search_words if word in segment_text)
            
            # Bonus for phrase matches
            phrase_bonus = sum(2 for text in click_texts 
                             if text.lower()[:30] in segment_text)
            
            score = matches + phrase_bonus
            
            if score > best_score and score > 0:
                best_score = score
                best_match = segment
        
        return best_match

    def _adjust_timing_overlaps(self, slide_timings: List[Dict], audio_duration: float) -> List[Dict]:
        """Adjust slide timings to prevent overlaps"""
        # Sort by start time
        slide_timings.sort(key=lambda x: x['start_time'])
        
        # Adjust overlapping slides
        for i in range(len(slide_timings) - 1):
            current = slide_timings[i]
            next_slide = slide_timings[i + 1]
            
            current_end = current['start_time'] + current['duration']
            
            # If current slide overlaps with next, adjust duration
            if current_end > next_slide['start_time']:
                current['duration'] = max(3.0, next_slide['start_time'] - current['start_time'])
        
        # Ensure no slide goes beyond audio duration
        for slide in slide_timings:
            if slide['start_time'] + slide['duration'] > audio_duration:
                slide['duration'] = max(3.0, audio_duration - slide['start_time'])
        
        return slide_timings

    def create_optimized_slides(self, original_slides: Path, slide_timings: List[Dict]) -> Path:
        """Create optimized slides file with only matched slides"""
        matched_slides = [st for st in slide_timings if st['matched'] or st['slide_number'] <= 3]
        
        print(f"📝 Creating optimized slides: {len(matched_slides)} slides selected")
        
        with open(original_slides, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse original slides
        slide_parts = content.split('---\n')
        header = slide_parts[0] + '---\n'
        
        # Build optimized content with only selected slides
        optimized_content = header
        
        wanted_numbers = {st['slide_number'] for st in matched_slides}
        
        for i, part in enumerate(slide_parts[1:], 1):
            if i in wanted_numbers and part.strip():
                optimized_content += part + '---\n'
        
        # Write optimized file
        optimized_file = self.output_dir / "sync_slides.md"
        with open(optimized_file, 'w', encoding='utf-8') as f:
            f.write(optimized_content)
        
        print(f"✅ Optimized slides saved: {optimized_file}")
        return optimized_file

    def export_slides_to_images(self, slides_file: Path) -> List[Path]:
        """Export Slidev slides to PNG images"""
        print("📤 Exporting slides to images...")
        
        try:
            export_cmd = [
                "npx", "slidev", "export",
                slides_file.name,
                "--output", str(self.output_dir.absolute()),
                "--format", "png",
                "--with-clicks",
                "--timeout", "60000"
            ]
            
            print(f"   Running: {' '.join(export_cmd)}")
            result = subprocess.run(
                export_cmd, 
                cwd=slides_file.parent,
                capture_output=True, 
                text=True, 
                timeout=120
            )
            
            if result.returncode == 0:
                # Find exported images
                png_files = list(self.output_dir.glob("*.png"))
                if not png_files:
                    # Check slides-export subdirectory
                    export_subdir = self.output_dir / "slides-export"
                    if export_subdir.exists():
                        png_files = list(export_subdir.glob("*.png"))
                
                png_files.sort(key=lambda x: x.name)
                print(f"✅ Exported {len(png_files)} slide images")
                return png_files
            else:
                print(f"❌ Slidev export failed: {result.stderr}")
                return []
                
        except subprocess.TimeoutExpired:
            print("❌ Slidev export timed out")
            return []
        except Exception as e:
            print(f"❌ Export error: {e}")
            return []

    def map_clicks_to_timestamps(self, slides: List[Dict], transcript_data: Dict) -> List[Dict]:
        """Map each [click] marker to specific audio timestamps"""
        print("🎯 Mapping individual clicks to audio timestamps...")
        
        segments = transcript_data.get('segments', [])
        click_mappings = []
        
        for slide in slides:
            slide_number = slide['slide_number']
            click_texts = slide['click_texts']
            
            if not click_texts:
                continue
                
            print(f"   📍 Slide {slide_number}: Processing {len(click_texts)} clicks")
            
            for click_idx, click_text in enumerate(click_texts):
                # Find matching audio segment
                best_match = self._find_best_audio_match([click_text], segments)
                if best_match:
                    click_mappings.append({
                        'slide_number': slide_number,
                        'click_index': click_idx + 1,  # 1-based for filename matching
                        'start_time': best_match['start'],
                        'duration': min(best_match['end'] - best_match['start'], 15.0),
                        'click_text': click_text[:100] + "..." if len(click_text) > 100 else click_text
                    })
                    print(f"     🎯 Click {click_idx+1}: {best_match['start']:.1f}s - \"{click_text[:50]}...\"")
        
        # Sort by timestamp
        click_mappings.sort(key=lambda x: x['start_time'])
        print(f"✅ Mapped {len(click_mappings)} clicks to timestamps")
        return click_mappings

    def create_synced_video(self, slide_images: List[Path], audio_file: Path, slide_timings: List[Dict], slides: List[Dict], transcript_data: Dict) -> Optional[Path]:
        """Create synchronized video with precise click timing"""
        if not MOVIEPY_AVAILABLE or not slide_images:
            print("❌ Cannot create video - missing requirements")
            return None
        
        print(f"🎬 Creating click-synchronized video from {len(slide_images)} slide images...")
        
        try:
            # Load audio
            audio_clip = AudioFileClip(str(audio_file))
            audio_duration = audio_clip.duration
            print(f"   🎵 Audio duration: {audio_duration:.1f}s")
            
            # Map each click to timestamps
            click_mappings = self.map_clicks_to_timestamps(slides, transcript_data)
            
            if not click_mappings:
                print("❌ No click mappings found")
                return None
            
            # Create timeline with continuous slides (no gaps)
            image_clips = []
            current_time = 0
            
            # Add single intro slide for the beginning (0s to first click)
            first_click_time = click_mappings[0]['start_time'] if click_mappings else 60.0
            if first_click_time > 5.0:  # If there's significant intro time
                # Use the first slide (title slide) for the entire intro period
                intro_slide = slide_images[0]
                intro_duration = first_click_time
                
                print(f"   🎬 Adding intro slide (0s-{first_click_time:.1f}s)")
                print(f"   📍 Intro {intro_slide.name}: 0.0s-{intro_duration:.1f}s")
                
                try:
                    img_clip = ImageClip(str(intro_slide), duration=intro_duration)
                    image_clips.append(img_clip)
                except Exception as e:
                    print(f"   ⚠️ Error with intro slide: {e}")
            
            # Process mapped clicks starting from appropriate slide index
            slides_used_for_intro = 1 if first_click_time > 5.0 else 0
            
            for i, mapping in enumerate(click_mappings):
                # Find matching slide image - try different formats
                matching_image = None
                
                # Try different possible naming patterns
                possible_names = [
                    f"{mapping['slide_number']:03d}-{mapping['click_index']:02d}.png",
                    f"{mapping['slide_number']:02d}-{mapping['click_index']:02d}.png", 
                    f"{mapping['slide_number']:d}-{mapping['click_index']:d}.png"
                ]
                
                for img_path in slide_images:
                    for possible_name in possible_names:
                        if img_path.name == possible_name:
                            matching_image = img_path
                            break
                    if matching_image:
                        break
                
                # If still no match, use images sequentially (skip intro slides)
                sequential_index = slides_used_for_intro + i
                if not matching_image and sequential_index < len(slide_images):
                    matching_image = slide_images[sequential_index]
                    print(f"   📍 Using sequential image: {matching_image.name}")
                
                if not matching_image:
                    print(f"   ⚠️ No image found for mapping {i}")
                    continue
                
                # Calculate duration until next click (or end of audio)
                if i < len(click_mappings) - 1:
                    next_start = click_mappings[i + 1]['start_time']
                    duration = max(1.0, next_start - mapping['start_time'])
                else:
                    duration = max(1.0, audio_duration - mapping['start_time'])
                
                print(f"   🎯 {matching_image.name}: {mapping['start_time']:.1f}s-{mapping['start_time']+duration:.1f}s")
                
                try:
                    img_clip = ImageClip(str(matching_image), duration=duration)
                    image_clips.append(img_clip)
                except Exception as e:
                    print(f"   ⚠️ Error loading {matching_image.name}: {e}")
                    continue
            
            if not image_clips:
                print("❌ No valid image clips created")
                return None
            
            # Create continuous video sequence
            print(f"   🎬 Creating continuous sequence from {len(image_clips)} clips...")
            video = concatenate_videoclips(image_clips, method="compose")
            
            # Ensure perfect audio sync
            if video.duration != audio_duration:
                if video.duration > audio_duration:
                    video = video.subclip(0, audio_duration)
                else:
                    # Extend last slide
                    extension = audio_duration - video.duration
                    last_slide = image_clips[-1].set_duration(
                        image_clips[-1].duration + extension
                    )
                    image_clips[-1] = last_slide
                    video = concatenate_videoclips(image_clips, method="compose")
            
            # Add audio
            final_video = video.set_audio(audio_clip)
            
            # Save video
            output_file = audio_file.parent / f"{audio_file.stem}_synced.mp4"
            print(f"🎥 Rendering video: {output_file}")
            
            final_video.write_videofile(
                str(output_file),
                fps=24,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile=str(self.output_dir / "temp_audio.m4a"),
                remove_temp=True,
                verbose=False,
                logger=None  # Disable verbose logging
            )
            
            # Cleanup
            audio_clip.close()
            video.close()
            final_video.close()
            
            print(f"✅ Video created: {output_file}")
            return output_file
            
        except Exception as e:
            print(f"❌ Video creation failed: {e}")
            return None

    def cleanup(self):
        """Clean up temporary files"""
        print("🧹 Cleaning up...")
        
        # Remove PNG files
        png_files = list(self.output_dir.glob("*.png"))
        for png_file in png_files:
            try:
                png_file.unlink()
            except:
                pass
        
        # Remove temp slides
        temp_files = list(self.output_dir.glob("sync_slides.md"))
        for temp_file in temp_files:
            try:
                temp_file.unlink()
            except:
                pass
        
        if png_files:
            print(f"   Removed {len(png_files)} temporary files")

    def process(self, audio_file: str, slides_file: str, transcript_file: str) -> Optional[Path]:
        """Main processing pipeline"""
        audio_path = Path(audio_file)
        slides_path = Path(slides_file)
        transcript_path = Path(transcript_file)
        
        print(f"🎯 Processing:")
        print(f"   🎵 Audio: {audio_path.name}")
        print(f"   📊 Slides: {slides_path.name}")
        print(f"   📝 Transcript: {transcript_path.name}")
        print()
        
        # Verify files exist
        if not all([audio_path.exists(), slides_path.exists(), transcript_path.exists()]):
            print("❌ One or more input files not found")
            return None
        
        try:
            # Load transcript (NO audio processing)
            transcript_data = self.load_transcript(transcript_path)
            
            # Parse slides
            slides = self.parse_slides(slides_path)
            
            # Map slides to audio
            slide_timings = self.map_slides_to_audio(slides, transcript_data)
            
            # Create optimized slides file
            optimized_slides = self.create_optimized_slides(slides_path, slide_timings)
            
            # Export to images
            slide_images = self.export_slides_to_images(optimized_slides)
            if not slide_images:
                return None
            
            # Create synced video with click-level precision
            video_file = self.create_synced_video(slide_images, audio_path, slide_timings, slides, transcript_data)
            
            # Cleanup
            self.cleanup()
            
            if video_file:
                print(f"\n🎉 SUCCESS! Synced video created: {video_file}")
                return video_file
            
        except Exception as e:
            print(f"❌ Processing failed: {e}")
            import traceback
            traceback.print_exc()
            return None
        
        return None


def main():
    parser = argparse.ArgumentParser(description="Simple Smart Sync Video Creator")
    parser.add_argument('audio', help='Audio file (.m4a)')
    parser.add_argument('slides', help='Slidev slides file (.md)')
    parser.add_argument('transcript', help='Timestamped transcript (.json)')
    
    args = parser.parse_args()
    
    sync = SimpleSmartSync()
    result = sync.process(args.audio, args.slides, args.transcript)
    
    if result:
        print("\n✨ Video processing complete!")
        sys.exit(0)
    else:
        print("\n❌ Video processing failed")
        sys.exit(1)


if __name__ == "__main__":
    main()