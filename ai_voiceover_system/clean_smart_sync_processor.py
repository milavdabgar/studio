#!/usr/bin/env python3
"""
Clean Smart Sync Video Processor - No Audio Processing
=====================================================

ONLY uses existing timestamped transcripts. Never processes audio.
"""

import os
import sys
import argparse
import json
import subprocess
from pathlib import Path
from datetime import datetime
import re
from typing import Dict, List, Optional

try:
    from moviepy.editor import AudioFileClip, ImageClip, CompositeVideoClip, ColorClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False

class CleanSmartSyncProcessor:
    """Clean smart sync processor - uses existing transcripts only"""
    
    def __init__(self):
        self.output_dir = Path("enhanced_podcast_output")
        self.output_dir.mkdir(exist_ok=True)
        self.root_dir = Path.cwd()
        
        print("🎯 Clean Smart Sync Processor - Using Existing Transcripts Only")
        print("=" * 65)
    
    def load_timestamped_transcript(self, transcript_file: Path) -> Dict:
        """Load timestamped transcript - NO AUDIO PROCESSING"""
        print(f"⏱️  Loading existing timestamped transcript: {transcript_file.name}")
        
        if not transcript_file.exists():
            raise FileNotFoundError(f"Transcript file not found: {transcript_file}")
        
        with open(transcript_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"✅ Loaded {len(data['segments'])} existing timestamped segments")
        return data

    def parse_slide_content(self, slides_file: Path) -> Dict:
        """Parse slides to extract click markers"""
        print(f"📖 Parsing slide content: {slides_file.name}")
        
        with open(slides_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        slides = []
        current_slide = None
        slide_number = 0
        in_frontmatter = False
        
        lines = content.split('\n')
        in_speaker_notes = False
        
        for i, line in enumerate(lines):
            # Handle frontmatter
            if line.strip() == '---' and not in_frontmatter and slide_number == 0:
                in_frontmatter = True
                continue
            elif line.strip() == '---' and in_frontmatter:
                in_frontmatter = False
                # Start the first slide after frontmatter
                slide_number += 1
                current_slide = {
                    'slide_number': slide_number,
                    'title': '',
                    'content': [],
                    'speaker_notes': '',
                    'click_count': 0,
                    'topics': []
                }
                print(f"   🔍 DEBUG Started slide {slide_number} at line {i+1} (after frontmatter)")
                continue
                
            if in_frontmatter:
                continue
                
            if line.strip() == '---' and current_slide is not None:
                # End of current slide
                slides.append(current_slide)
                current_slide = None
                in_speaker_notes = False
                # Start new slide
                slide_number += 1
                current_slide = {
                    'slide_number': slide_number,
                    'title': '',
                    'content': [],
                    'speaker_notes': '',
                    'click_count': 0,
                    'topics': []
                }
                # DEBUG: Print slide boundary detection
                if slide_number <= 3:
                    print(f"   🔍 DEBUG Started slide {slide_number} at line {i+1}: {repr(line[:50])}")
                continue
                
            if line.strip().startswith('layout:') and current_slide is None:
                # Start of new slide with layout
                slide_number += 1
                current_slide = {
                    'slide_number': slide_number,
                    'title': '',
                    'content': [],
                    'speaker_notes': '',
                    'click_count': 0,
                    'topics': []
                }
                # DEBUG: Print slide boundary detection
                if slide_number <= 3:
                    print(f"   🔍 DEBUG Started slide {slide_number} at line {i+1}: {repr(line[:50])}")
                continue
            
            if current_slide is None:
                continue
                
            if line.strip().startswith('<!--'):
                in_speaker_notes = True
                # DEBUG: Show when speaker notes start
                if current_slide['slide_number'] <= 3:
                    print(f"   🔍 DEBUG Slide {current_slide['slide_number']} - Found speaker notes START at line {i+1}")
                # Include any text after <!-- on the same line
                text_after_start = line.split('<!--', 1)[1]
                if text_after_start.strip() and not text_after_start.strip().startswith('-->'):
                    current_slide['speaker_notes'] += text_after_start + '\n'
                continue
            elif '-->' in line:
                # Include any text before --> on the same line
                text_before_end = line.split('-->', 1)[0]
                if text_before_end.strip() and in_speaker_notes:
                    current_slide['speaker_notes'] += text_before_end + '\n'
                # DEBUG: Show when speaker notes end
                if current_slide['slide_number'] <= 3:
                    print(f"   🔍 DEBUG Slide {current_slide['slide_number']} - Found speaker notes END at line {i+1}")
                in_speaker_notes = False
                continue
            
            if in_speaker_notes:
                current_slide['speaker_notes'] += line + '\n'
                current_slide['click_count'] += line.count('[click]')
            else:
                if line.startswith('#') and not current_slide['title']:
                    current_slide['title'] = line.lstrip('#').strip()
                current_slide['content'].append(line)
                if 'v-click' in line:
                    current_slide['click_count'] += line.count('v-click')
        
        # Don't forget the last slide
        if current_slide:
            slides.append(current_slide)
        
        print(f"✅ Parsed {len(slides)} slides with click markers")
        return {'slides': slides, 'total_slides': len(slides)}

    def map_clicks_to_audio(self, slides_data: Dict, transcript_data: Dict) -> List[Dict]:
        """Map slide clicks to audio segments"""
        print("🔗 Mapping slide clicks to audio timestamps...")
        
        slides = slides_data['slides']
        segments = transcript_data['segments']
        
        click_mappings = []
        
        for slide in slides:
            speaker_notes = slide.get('speaker_notes', '')
            
            # DEBUG: Show speaker notes for first few slides
            if slide['slide_number'] <= 3:
                print(f"   🔍 DEBUG Slide {slide['slide_number']} speaker_notes: {repr(speaker_notes[:100])}")
            
            # Extract text after [click] markers
            click_texts = []
            if '[click]' in speaker_notes:
                lines = speaker_notes.split('\n')
                for line in lines:
                    if '[click]' in line:
                        # Extract text after [click] on the same line
                        text_after_click = line.split('[click]')[-1].strip()
                        if text_after_click:
                            click_texts.append(text_after_click)
            
            print(f"   📝 Slide {slide['slide_number']}: {len(click_texts)} clicks found")
            
            # Map each click to audio
            for click_idx, click_text in enumerate(click_texts):
                best_match = self._find_best_audio_match(click_text, segments)
                if best_match:
                    click_mappings.append({
                        'slide_number': slide['slide_number'],
                        'click_index': click_idx,
                        'audio_start': best_match['start'],
                        'audio_end': best_match['end'],
                        'duration': best_match['end'] - best_match['start']
                    })
        
        # Convert to slide timings
        slide_timings = []
        for slide in slides:
            slide_clicks = [m for m in click_mappings if m['slide_number'] == slide['slide_number']]
            
            if slide_clicks:
                first_click_start = min(m['audio_start'] for m in slide_clicks)
                last_click_end = max(m['audio_end'] for m in slide_clicks)
                
                slide_timings.append({
                    'slide_number': slide['slide_number'],
                    'title': slide['title'],
                    'start_time': first_click_start,
                    'duration': last_click_end - first_click_start,
                    'synced': True
                })
            else:
                # Default timing for slides without clicks
                slide_timings.append({
                    'slide_number': slide['slide_number'], 
                    'title': slide['title'],
                    'start_time': 0,
                    'duration': 5.0,
                    'synced': False
                })
        
        synced_count = len([st for st in slide_timings if st['synced']])
        print(f"✅ Mapped {synced_count} slides to audio timestamps")
        return slide_timings

    def _find_best_audio_match(self, click_text: str, segments: List[Dict]) -> Optional[Dict]:
        """Find audio segment matching click text"""
        if not click_text.strip():
            return None
            
        # Simple keyword matching
        words = [w.lower().strip('.,!?;:"()[]{}') for w in click_text.split() if len(w) > 2]
        
        best_match = None
        best_score = 0
        
        for segment in segments:
            segment_text = segment['text'].lower()
            score = sum(1 for word in words if word in segment_text)
            
            if score > best_score:
                best_score = score
                best_match = segment
        
        return best_match

    def export_slides(self, slides_file: Path) -> List[Path]:
        """Export slides using Slidev"""
        print("📤 Exporting slides...")
        
        try:
            export_cmd = [
                "npx", "slidev", "export",
                str(slides_file.name),
                "--output", str(self.output_dir.absolute()),
                "--format", "png",
                "--with-clicks",
                "--timeout", "60000"
            ]
            
            result = subprocess.run(export_cmd, cwd=slides_file.parent,
                                  capture_output=True, text=True, timeout=90)
            
            if result.returncode == 0:
                png_files = sorted(self.output_dir.glob("*.png"), key=lambda x: x.name)
                print(f"✅ Exported {len(png_files)} slide images")
                return png_files
            else:
                print(f"❌ Export failed: {result.stderr}")
                return []
                
        except Exception as e:
            print(f"❌ Export error: {e}")
            return []

    def create_synced_video(self, slide_images: List[Path], audio_file: str, slide_timings: List[Dict]) -> Optional[Path]:
        """Create synchronized video"""
        if not MOVIEPY_AVAILABLE or not slide_images:
            return None
        
        print(f"🎬 Creating synchronized video from {len(slide_images)} slides...")
        print(f"   📊 Slide images: {len(slide_images)} | Slide timings: {len(slide_timings)}")
        
        try:
            # Load audio for duration only
            audio_clip = AudioFileClip(audio_file)
            total_duration = audio_clip.duration
            print(f"   🎵 Total audio duration: {total_duration:.1f}s")
            
            # Create timeline mapping: distribute slide images across synced timings
            synced_slides = [timing for timing in slide_timings if timing['synced']]
            print(f"   🔗 Synced slides with audio: {len(synced_slides)}")
            
            if not synced_slides:
                print("   ❌ No slides could be synced to audio - falling back to equal distribution")
                # Fallback to equal distribution
                duration_per_slide = total_duration / len(slide_images)
                video_clips = []
                
                for i, slide_path in enumerate(slide_images):
                    start_time = i * duration_per_slide
                    duration = duration_per_slide
                    
                    if start_time < total_duration:
                        img_clip = (ImageClip(str(slide_path), duration=duration)
                                   .set_start(start_time)
                                   .set_position('center'))
                        video_clips.append(img_clip)
            else:
                # Create smart mapping between slide images and synced timings
                video_clips = []
                
                # Sort synced slides by start time
                synced_slides.sort(key=lambda x: x['start_time'])
                
                # Distribute slide images across synced slide time periods
                images_per_timing = len(slide_images) // len(synced_slides)
                remaining_images = len(slide_images) % len(synced_slides)
                
                print(f"   📈 Distributing {len(slide_images)} images across {len(synced_slides)} time periods")
                print(f"   🎯 ~{images_per_timing} images per timing period")
                
                image_idx = 0
                for timing_idx, timing in enumerate(synced_slides):
                    # Calculate how many images for this timing period
                    images_for_this_timing = images_per_timing
                    if timing_idx < remaining_images:
                        images_for_this_timing += 1
                    
                    if images_for_this_timing == 0:
                        continue
                        
                    # Distribute images within this timing period
                    period_start = timing['start_time']
                    period_duration = timing['duration']
                    duration_per_image = period_duration / images_for_this_timing
                    
                    print(f"     📍 Timing {timing_idx+1}: {period_start:.1f}s-{period_start+period_duration:.1f}s ({images_for_this_timing} images)")
                    
                    for img_in_period in range(images_for_this_timing):
                        if image_idx >= len(slide_images):
                            break
                            
                        slide_path = slide_images[image_idx]
                        start_time = period_start + (img_in_period * duration_per_image)
                        duration = duration_per_image
                        
                        # Ensure we don't exceed audio duration
                        if start_time < total_duration:
                            actual_duration = min(duration, total_duration - start_time)
                            img_clip = (ImageClip(str(slide_path), duration=actual_duration)
                                       .set_start(start_time)
                                       .set_position('center'))
                            video_clips.append(img_clip)
                            print(f"       🖼️  Image {image_idx+1}: {slide_path.name} at {start_time:.1f}s for {actual_duration:.1f}s")
                        
                        image_idx += 1
            
            # Create background
            background = ColorClip(size=(1920, 1080), color=(25, 25, 50), duration=total_duration)
            all_clips = [background] + video_clips
            
            # Compose final video
            video = CompositeVideoClip(all_clips, size=(1920, 1080))
            video = video.set_duration(total_duration).set_audio(audio_clip)
            
            # Output
            output_file = Path(audio_file).parent / f"{Path(audio_file).stem}_clean_sync.mp4"
            
            print(f"   🎥 Rendering video with {len(video_clips)} timed slide clips...")
            video.write_videofile(
                str(output_file),
                fps=30,
                codec='libx264', 
                audio_codec='aac',
                verbose=False,
                logger=None
            )
            
            # Cleanup
            audio_clip.close()
            video.close()
            
            print(f"✅ Clean synchronized video created: {output_file}")
            return output_file
            
        except Exception as e:
            print(f"❌ Video creation failed: {e}")
            return None

    def process(self, audio_file: str, slides_file: str, transcript_file: str) -> Optional[Path]:
        """Main processing - uses existing transcript only"""
        print(f"\n🎯 Clean Smart Sync Processing")
        print("=" * 40)
        print(f"🎵 Audio: {Path(audio_file).name}")
        print(f"📊 Slides: {Path(slides_file).name}")
        print(f"⏱️  Transcript: {Path(transcript_file).name}")
        print("🔄 Mode: Using existing transcript (NO audio processing)")
        
        try:
            # Load existing transcript (no audio processing)
            transcript_data = self.load_timestamped_transcript(Path(transcript_file))
            
            # Parse slides
            slides_data = self.parse_slide_content(Path(slides_file))
            
            # Map clicks to audio
            slide_timings = self.map_clicks_to_audio(slides_data, transcript_data)
            
            # Export slides
            slide_images = self.export_slides(Path(slides_file))
            if not slide_images:
                return None
            
            # Create video
            return self.create_synced_video(slide_images, audio_file, slide_timings)
            
        except Exception as e:
            print(f"❌ Processing failed: {e}")
            return None


def main():
    parser = argparse.ArgumentParser(description="Clean Smart Sync - Uses existing transcripts only")
    parser.add_argument('audio_file', help='Audio file (.m4a)')
    parser.add_argument('--slides', help='Slides file (.md)', required=True)
    parser.add_argument('--transcript', help='Existing timestamped transcript (.json)', required=True)
    
    args = parser.parse_args()
    
    processor = CleanSmartSyncProcessor()
    result = processor.process(args.audio_file, args.slides, args.transcript)
    
    if result:
        print("\n✨ Clean smart sync completed successfully!")
        print("🎯 No audio processing - used existing transcript only")
    else:
        print("\n❌ Processing failed")
        sys.exit(1)


if __name__ == "__main__":
    main()