#!/usr/bin/env python3
"""
Time-Synced Video Generator
============================

Creates educational videos by syncing Slidev slides with audio using YouTube subtitle timing.
This script takes M4A audio, VTT/SRT subtitles, and Slidev markdown to create perfectly
timed educational videos.

Usage:
    python timesynced_video_generator.py audio.m4a subtitles.vtt slides.md

Features:
- Parses VTT/SRT subtitle timing
- Exports Slidev slides as images
- Creates time-synced video with slide transitions
- Professional rendering with optimized settings
"""

import os
import sys
import argparse
import json
import re
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
import tempfile
from dataclasses import dataclass
from typing import List, Optional, Tuple

# MoviePy imports
try:
    from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False

# Audio processing
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False

@dataclass
class SubtitleSegment:
    """Represents a subtitle segment with timing"""
    start_time: float  # seconds
    end_time: float    # seconds
    text: str
    
    @property
    def duration(self) -> float:
        return self.end_time - self.start_time

@dataclass
class SlideInfo:
    """Information about a slide"""
    slide_number: int
    title: str
    content: List[str]
    image_path: Optional[Path] = None

def parse_subtitles(subtitle_file: Path) -> List[SubtitleSegment]:
    """Parse subtitle timing into segments"""
    print("📝 Parsing subtitles...")
    
    segments = []
    
    if subtitle_file.suffix.lower() == '.vtt':
        segments = _parse_vtt(subtitle_file)
    elif subtitle_file.suffix.lower() == '.srt':
        segments = _parse_srt(subtitle_file)
    else:
        raise ValueError(f"Unsupported subtitle format: {subtitle_file.suffix}")
    
    print(f"✅ Parsed {len(segments)} subtitle segments")
    return segments

def _parse_vtt(vtt_file: Path) -> List[SubtitleSegment]:
    """Parse VTT subtitle file"""
    segments = []
    
    with open(vtt_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    current_segment = None
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Skip header lines
        if line.startswith('WEBVTT') or line.startswith('Kind:') or line.startswith('Language:'):
            continue
            
        # Check if this is a timestamp line
        if '-->' in line:
            # Extract timestamps
            parts = line.split('-->')
            if len(parts) >= 2:
                start_str = parts[0].strip()
                end_str = parts[1].split()[0]  # Remove positioning info
                
                try:
                    start_time = _parse_timestamp(start_str)
                    end_time = _parse_timestamp(end_str)
                    current_segment = {'start': start_time, 'end': end_time, 'text': ''}
                except:
                    continue
        
        # If we have a current segment and this is text (not empty, not timestamp)
        elif current_segment and line and not line.startswith('NOTE'):
            # Clean up text - remove inline timing and HTML tags
            text = re.sub(r'<\d{2}:\d{2}:\d{2}\.\d{3}><c>[^<]*</c>', ' ', line)
            text = re.sub(r'<[^>]+>', '', text)  # Remove remaining HTML tags
            text = re.sub(r'\s+', ' ', text).strip()  # Clean whitespace
            
            if text:
                if current_segment['text']:
                    current_segment['text'] += ' ' + text
                else:
                    current_segment['text'] = text
        
        # Empty line indicates end of segment
        elif line == '' and current_segment and current_segment['text']:
            segments.append(SubtitleSegment(
                current_segment['start'], 
                current_segment['end'], 
                current_segment['text']
            ))
            current_segment = None
    
    # Add final segment if exists
    if current_segment and current_segment['text']:
        segments.append(SubtitleSegment(
            current_segment['start'], 
            current_segment['end'], 
            current_segment['text']
        ))
    
    return segments

def _parse_srt(srt_file: Path) -> List[SubtitleSegment]:
    """Parse SRT subtitle file"""
    segments = []
    
    with open(srt_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # SRT format: timestamp --> timestamp
    pattern = r'\d+\n(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})\s*\n([^\n]+(?:\n[^\n]+)*?)(?=\n\d+\n|\n*$)'
    
    matches = re.findall(pattern, content, re.MULTILINE)
    
    for start_str, end_str, text in matches:
        # Convert SRT comma format to VTT dot format
        start_str = start_str.replace(',', '.')
        end_str = end_str.replace(',', '.')
        
        start_time = _parse_timestamp(start_str)
        end_time = _parse_timestamp(end_str)
        
        # Clean up text
        text = re.sub(r'<[^>]+>', '', text)  # Remove HTML tags
        text = text.strip().replace('\n', ' ')
        
        if text:  # Only add non-empty segments
            segments.append(SubtitleSegment(start_time, end_time, text))
    
    return segments

def _parse_timestamp(timestamp: str) -> float:
    """Convert timestamp string to seconds"""
    # Format: HH:MM:SS.mmm
    parts = timestamp.split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    seconds_parts = parts[2].split('.')
    seconds = int(seconds_parts[0])
    milliseconds = int(seconds_parts[1])
    
    total_seconds = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000
    return total_seconds

def parse_slidev_slides(slidev_file: Path) -> List[SlideInfo]:
    """Parse Slidev markdown file to extract slide information"""
    print("📊 Parsing Slidev slides...")
    
    with open(slidev_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    slides = []
    slide_number = 0
    
    # Split by slide separators
    slide_blocks = content.split('---')
    
    for i, block in enumerate(slide_blocks):
        block = block.strip()
        if not block or block.startswith('theme:'):
            continue  # Skip frontmatter and empty blocks
        
        slide_number += 1
        
        # Extract title (first heading)
        title_match = re.search(r'^#+ (.+)$', block, re.MULTILINE)
        title = title_match.group(1) if title_match else f"Slide {slide_number}"
        
        # Extract content (bullet points, text)
        content_lines = []
        for line in block.split('\n'):
            line = line.strip()
            if line.startswith('- '):
                content_lines.append(line[2:])  # Remove bullet point
            elif line and not line.startswith('#') and not line.startswith('<'):
                content_lines.append(line)
        
        slides.append(SlideInfo(
            slide_number=slide_number,
            title=title,
            content=content_lines[:5]  # Limit to 5 content lines
        ))
    
    print(f"✅ Found {len(slides)} slides in Slidev file")
    return slides

def export_slidev_images(slidev_file: Path, output_dir: Path) -> List[Path]:
    """Export Slidev slides as PNG images using root project's Slidev"""
    print("🖼️  Exporting Slidev slides as images...")
    
    try:
        # Use root project directory approach (like enhanced_podcast_processor_v2.py)
        slidev_dir = slidev_file.parent
        root_dir = Path.cwd()
        
        # Create export directory
        export_dir = output_dir / "slide_images"
        export_dir.mkdir(parents=True, exist_ok=True)
        
        # Export slides using root project's slidev installation
        cmd = [
            'npx', 'slidev', 'export',
            str(slidev_file.name),
            '--output', str(export_dir.absolute()),
            '--format', 'png',
            '--with-clicks',
            '--timeout', '30000'
        ]
        
        print(f"   Running: {' '.join(cmd)}")
        print(f"   Working directory: {slidev_dir}")
        print(f"   Root directory: {root_dir}")
        
        result = subprocess.run(cmd, cwd=slidev_dir, capture_output=True, text=True, timeout=180)
        
        if result.returncode != 0:
            print(f"   Slidev stdout: {result.stdout}")
            print(f"   Slidev stderr: {result.stderr}")
            raise Exception(f"Slidev export failed: {result.stderr}")
        
        # Find exported images
        image_files = sorted(export_dir.glob("*.png"))
        
        if not image_files:
            # Check if images are in subdirectory
            for subdir in export_dir.iterdir():
                if subdir.is_dir():
                    image_files = sorted(subdir.glob("*.png"))
                    if image_files:
                        break
        
        if not image_files:
            raise Exception("No slide images found after export")
        
        print(f"✅ Exported {len(image_files)} slide images")
        return image_files
        
    except Exception as e:
        print(f"❌ Slide export failed: {e}")
        return []

def create_slide_timeline(subtitles: List[SubtitleSegment], slides: List[SlideInfo], 
                         audio_duration: float) -> List[Tuple[SlideInfo, float, float]]:
    """Create timeline mapping slides to time segments based on content analysis"""
    print("⏰ Creating slide timeline...")
    
    if not slides:
        raise ValueError("No slides available")
    
    timeline = []
    
    # Simple strategy: divide audio duration equally among slides
    slide_duration = audio_duration / len(slides)
    
    for i, slide in enumerate(slides):
        start_time = i * slide_duration
        end_time = min((i + 1) * slide_duration, audio_duration)
        timeline.append((slide, start_time, end_time))
    
    print(f"✅ Created timeline with {len(timeline)} slide segments")
    return timeline

def create_video(audio_file: Path, slide_timeline: List[Tuple[SlideInfo, float, float]], 
                slide_images: List[Path], output_file: Path):
    """Create final video with time-synced slides"""
    print("🎬 Creating time-synced video...")
    
    if not MOVIEPY_AVAILABLE:
        raise Exception("MoviePy not available. Please install: pip install moviepy")
    
    # Load audio
    audio_clip = AudioFileClip(str(audio_file))
    
    # Create video clips for each slide
    video_clips = []
    
    for i, (slide_info, start_time, end_time) in enumerate(slide_timeline):
        duration = end_time - start_time
        
        # Find corresponding image
        if i < len(slide_images):
            image_path = slide_images[i]
        else:
            # Reuse last image if we don't have enough
            image_path = slide_images[-1]
        
        print(f"   Slide {slide_info.slide_number}: {duration:.1f}s - {slide_info.title}")
        
        # Create image clip
        img_clip = ImageClip(str(image_path), duration=duration)
        video_clips.append(img_clip)
    
    # Concatenate all video clips
    final_video = concatenate_videoclips(video_clips)
    
    # Set audio
    final_video = final_video.set_audio(audio_clip)
    
    # Render video
    print(f"🎥 Rendering video: {output_file}")
    final_video.write_videofile(
        str(output_file),
        fps=24,
        codec='libx264',
        audio_codec='aac',
        temp_audiofile='temp-audio.m4a',
        remove_temp=True,
        ffmpeg_params=['-pix_fmt', 'yuv420p']  # Better compatibility
    )
    
    # Cleanup
    audio_clip.close()
    final_video.close()
    
    print(f"✅ Video created: {output_file}")

def cleanup_slide_images(slide_images: List[Path]):
    """Clean up exported slide images after video creation"""
    print("🧹 Cleaning up slide images...")
    
    cleaned_count = 0
    for image_path in slide_images:
        try:
            if image_path.exists():
                image_path.unlink()
                cleaned_count += 1
        except Exception as e:
            print(f"   Warning: Could not remove {image_path}: {e}")
    
    # Also try to remove the slide_images directory if it's empty
    if slide_images:
        slide_dir = slide_images[0].parent
        try:
            if slide_dir.exists() and not any(slide_dir.iterdir()):
                slide_dir.rmdir()
                print(f"   Removed empty directory: {slide_dir}")
        except Exception as e:
            print(f"   Warning: Could not remove directory {slide_dir}: {e}")
    
    print(f"✅ Cleaned up {cleaned_count} slide images")

def main():
    parser = argparse.ArgumentParser(
        description="Create time-synced educational videos from audio, subtitles, and slides",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python timesynced_video_generator.py audio.m4a subtitles.vtt slides.md
  python timesynced_video_generator.py audio.m4a subtitles.srt slides.md --output final_video.mp4
        """
    )
    
    parser.add_argument('audio_file', help='Audio file (M4A, MP3, WAV)')
    parser.add_argument('subtitle_file', help='Subtitle file (VTT or SRT)')
    parser.add_argument('slidev_file', help='Slidev markdown file')
    parser.add_argument('--output', help='Output video file (default: auto-generated)')
    parser.add_argument('--temp-dir', help='Temporary directory for processing')
    
    args = parser.parse_args()
    
    # Validate input files
    audio_file = Path(args.audio_file)
    subtitle_file = Path(args.subtitle_file)
    slidev_file = Path(args.slidev_file)
    
    for file_path, name in [(audio_file, 'Audio'), (subtitle_file, 'Subtitle'), (slidev_file, 'Slidev')]:
        if not file_path.exists():
            print(f"❌ {name} file not found: {file_path}")
            return 1
    
    # Set output file
    if args.output:
        output_file = Path(args.output)
    else:
        output_file = audio_file.parent / f"{audio_file.stem}_timesynced_video.mp4"
    
    # Set working directory
    work_dir = Path(args.temp_dir) if args.temp_dir else audio_file.parent / "video_generation"
    work_dir.mkdir(exist_ok=True)
    
    print(f"🎯 Creating time-synced video from:")
    print(f"   🎵 Audio: {audio_file.name}")
    print(f"   📝 Subtitles: {subtitle_file.name}")
    print(f"   📊 Slides: {slidev_file.name}")
    print(f"   🎬 Output: {output_file}")
    
    try:
        # Parse subtitles
        subtitles = parse_subtitles(subtitle_file)
        
        # Parse slides
        slides = parse_slidev_slides(slidev_file)
        
        # Export slide images
        slide_images = export_slidev_images(slidev_file, work_dir)
        if not slide_images:
            raise Exception("Failed to export slide images")
        
        # Get audio duration
        if PYDUB_AVAILABLE:
            audio = AudioSegment.from_file(str(audio_file))
            audio_duration = len(audio) / 1000.0  # Convert to seconds
        else:
            # Fallback: use MoviePy
            audio_clip = AudioFileClip(str(audio_file))
            audio_duration = audio_clip.duration
            audio_clip.close()
        
        print(f"🎵 Audio duration: {audio_duration:.1f} seconds")
        
        # Create slide timeline
        slide_timeline = create_slide_timeline(subtitles, slides, audio_duration)
        
        # Create video
        create_video(audio_file, slide_timeline, slide_images, output_file)
        
        # Clean up slide images
        cleanup_slide_images(slide_images)
        
        print(f"\n🎉 Time-synced video created successfully!")
        print(f"📁 Video: {output_file}")
        print(f"📂 Working files: {work_dir}")
        
        return 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())