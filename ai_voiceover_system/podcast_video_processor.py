#!/usr/bin/env python3
"""
Podcast Video Processor - Educational Slides with Original Audio
===============================================================

Modified version of slidev_unified_processor that creates educational videos by:
1. Using original NotebookLM podcast audio (not TTS)
2. Syncing Slidev slides with audio timing
3. Creating proper educational lecture videos

Usage:
    python podcast_video_processor.py <slidev_slides.md> <original_audio.m4a> [options]
"""

import os
import sys
import argparse
import json
import time
from pathlib import Path
from datetime import datetime
import re
import math

# Video processing
try:
    from moviepy.editor import (
        AudioFileClip, ImageClip, TextClip, CompositeVideoClip, 
        concatenate_videoclips, ColorClip
    )
    MOVIEPY_AVAILABLE = True
except ImportError:
    try:
        from moviepy import (
            AudioFileClip, ImageClip, TextClip, CompositeVideoClip, 
            concatenate_videoclips, ColorClip
        )
        MOVIEPY_AVAILABLE = True
    except ImportError:
        MOVIEPY_AVAILABLE = False

# Audio processing
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False

class PodcastVideoProcessor:
    """Create educational videos from Slidev slides + original podcast audio"""
    
    def __init__(self, config_file="podcast_video_config.json"):
        self.config_file = config_file
        self.config = self.load_config()
        self.output_dir = Path("podcast_videos")
        self.output_dir.mkdir(exist_ok=True)
        
        print("🎬 Podcast Educational Video Processor")
        print("=" * 50)
        self._display_capabilities()
    
    def _display_capabilities(self):
        """Display available capabilities"""
        print("📦 Available Components:")
        print(f"   {'✅' if MOVIEPY_AVAILABLE else '❌'} MoviePy: {MOVIEPY_AVAILABLE}")
        print(f"   {'✅' if PYDUB_AVAILABLE else '❌'} PyDub: {PYDUB_AVAILABLE}")
        print()
    
    def load_config(self):
        """Load or create configuration"""
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            default_config = {
                "video_settings": {
                    "resolution": [1920, 1080],
                    "fps": 30,
                    "background_color": [26, 26, 46],  # Dark blue
                    "text_color": [255, 255, 255],     # White
                    "font_size": 60,
                    "margin": 100
                },
                "timing": {
                    "slides_per_minute": 2.0,  # Base slides per minute
                    "min_slide_duration": 10,   # Minimum seconds per slide
                    "max_slide_duration": 60,   # Maximum seconds per slide
                    "transition_duration": 1    # Slide transition time
                },
                "slide_layouts": {
                    "intro": {"font_size": 80, "center": True},
                    "conclusion": {"font_size": 70, "center": True},
                    "default": {"font_size": 60, "center": False}
                }
            }
            
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, indent=2, ensure_ascii=False)
            
            print(f"📝 Created config: {self.config_file}")
            return default_config
    
    def parse_slidev_markdown(self, slides_file):
        """Parse Slidev markdown file and extract slide content"""
        print(f"📖 Parsing Slidev slides: {slides_file}")
        
        with open(slides_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split slides by --- separator
        slides_raw = content.split('---')
        slides = []
        
        for i, slide_content in enumerate(slides_raw):
            slide_content = slide_content.strip()
            
            # Skip frontmatter (first slide) and empty slides
            if i == 0 or not slide_content:
                continue
            
            slide = self._parse_single_slide(slide_content, i)
            if slide:
                slides.append(slide)
        
        print(f"✅ Parsed {len(slides)} slides")
        return slides
    
    def _parse_single_slide(self, content, slide_num):
        """Parse individual slide content"""
        lines = content.strip().split('\\n')
        
        slide = {
            "number": slide_num,
            "title": "",
            "content": [],
            "layout": "default"
        }
        
        # Extract title and content
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Main title (# or ##)
            if line.startswith('# '):
                slide["title"] = line[2:].strip()
                slide["layout"] = "intro" if "introduction" in slide["title"].lower() else "default"
                if "summary" in slide["title"].lower() or "conclusion" in slide["title"].lower():
                    slide["layout"] = "conclusion"
            elif line.startswith('## '):
                slide["title"] = line[3:].strip()
            
            # Bullet points
            elif line.startswith('- '):
                slide["content"].append(line[2:].strip())
            
            # Regular text
            elif line and not line.startswith('<') and not line.startswith('```'):
                # Skip HTML and code blocks
                if slide["title"]:  # Only add content if we have a title
                    slide["content"].append(line)
        
        return slide if slide["title"] else None
    
    def calculate_slide_timing(self, slides, total_audio_duration):
        """Calculate timing for each slide based on audio duration"""
        print(f"⏰ Calculating timing for {len(slides)} slides over {total_audio_duration/60:.1f} minutes")
        
        # Base duration per slide
        base_duration = total_audio_duration / len(slides)
        transition_duration = self.config["timing"]["transition_duration"]
        min_duration = self.config["timing"]["min_slide_duration"]
        max_duration = self.config["timing"]["max_slide_duration"]
        
        # Adjust durations based on content
        slide_timings = []
        current_time = 0
        
        for i, slide in enumerate(slides):
            # Calculate duration based on content length
            content_length = len(slide["title"]) + sum(len(point) for point in slide["content"])
            
            # More content = longer duration (within limits)
            content_factor = min(2.0, max(0.5, content_length / 200))
            duration = max(min_duration, min(max_duration, base_duration * content_factor))
            
            # Special handling for intro/conclusion slides
            if slide["layout"] in ["intro", "conclusion"]:
                duration *= 1.2  # 20% longer
            
            slide_timing = {
                "slide": slide,
                "start_time": current_time,
                "duration": duration,
                "end_time": current_time + duration
            }
            
            slide_timings.append(slide_timing)
            current_time += duration + transition_duration
            
            print(f"   Slide {i+1}: {duration:.1f}s - '{slide['title'][:30]}...'")
        
        return slide_timings
    
    def create_slide_video(self, slide, duration):
        """Create video clip for a single slide"""
        config = self.config["video_settings"]
        layout_config = self.config["slide_layouts"].get(slide["layout"], self.config["slide_layouts"]["default"])
        
        width, height = config["resolution"]
        
        # Create background
        background = ColorClip(
            size=(width, height), 
            color=config["background_color"],
            duration=duration
        )
        
        # Create title
        title_size = layout_config.get("font_size", config["font_size"])
        title_clip = TextClip(
            slide["title"],
            fontsize=title_size,
            color='white',
            method="caption",
            size=(width - 2*config["margin"], None)
        )
        
        # Position title
        if layout_config.get("center", False):
            title_y = height // 3
        else:
            title_y = config["margin"]
        
        title_clip = title_clip.set_position(("center", title_y)).set_duration(duration)
        
        # Create content clips
        content_clips = [background, title_clip]
        
        if slide["content"]:
            content_text = "\\n\\n".join(f"• {point}" for point in slide["content"])
            
            content_clip = TextClip(
                content_text,
                fontsize=config["font_size"] - 10,
                color='white',
                method="caption",
                size=(width - 2*config["margin"], None)
            )
            
            # Position content below title
            content_y = title_y + title_clip.h + 50
            content_clip = content_clip.set_position(("center", content_y)).set_duration(duration)
            content_clips.append(content_clip)
        
        # Add slide number
        slide_num_clip = TextClip(
            f"Slide {slide['number']}",
            fontsize=24,
            color='gray'
        ).set_position((width - 150, height - 50)).set_duration(duration)
        
        content_clips.append(slide_num_clip)
        
        # Composite all elements
        return CompositeVideoClip(content_clips)
    
    def process_podcast_video(self, slides_file, audio_file, output_name=None):
        """Main processing pipeline"""
        if not MOVIEPY_AVAILABLE:
            print("❌ MoviePy not available - cannot create video")
            return None
        
        slides_path = Path(slides_file)
        audio_path = Path(audio_file)
        
        if not slides_path.exists():
            print(f"❌ Slides file not found: {slides_file}")
            return None
        
        if not audio_path.exists():
            print(f"❌ Audio file not found: {audio_file}")
            return None
        
        print(f"\\n🎬 Processing educational video: {slides_path.stem}")
        print("=" * 70)
        
        # Step 1: Parse slides
        slides = self.parse_slidev_markdown(slides_file)
        if not slides:
            print("❌ No slides found in markdown file")
            return None
        
        # Step 2: Load audio and get duration
        try:
            audio_clip = AudioFileClip(str(audio_file))
            audio_duration = audio_clip.duration
            print(f"🎵 Audio duration: {audio_duration/60:.1f} minutes")
        except Exception as e:
            print(f"❌ Failed to load audio: {e}")
            return None
        
        # Step 3: Calculate slide timing
        slide_timings = self.calculate_slide_timing(slides, audio_duration)
        
        # Step 4: Create video clips for each slide
        print("🎬 Creating slide videos...")
        video_clips = []
        
        for i, timing in enumerate(slide_timings):
            print(f"   Creating slide {i+1}/{len(slide_timings)}: {timing['slide']['title'][:40]}...")
            
            try:
                slide_clip = self.create_slide_video(timing["slide"], timing["duration"])
                video_clips.append(slide_clip)
            except Exception as e:
                print(f"   ❌ Failed to create slide {i+1}: {e}")
                continue
        
        if not video_clips:
            print("❌ No video clips created")
            return None
        
        # Step 5: Concatenate slides
        print("🔗 Combining slides...")
        try:
            # Add transitions between slides
            final_clips = []
            for i, clip in enumerate(video_clips):
                final_clips.append(clip)
                
                # Add transition (fade) between slides
                if i < len(video_clips) - 1:
                    transition_duration = self.config["timing"]["transition_duration"]
                    if transition_duration > 0:
                        transition = ColorClip(
                            size=self.config["video_settings"]["resolution"],
                            color=[0, 0, 0],
                            duration=transition_duration
                        ).set_opacity(0.5)
                        final_clips.append(transition)
            
            video = concatenate_videoclips(final_clips, method="compose")
            
            # Trim or extend video to match audio duration
            if video.duration > audio_duration:
                video = video.subclip(0, audio_duration)
            elif video.duration < audio_duration:
                # Extend last slide
                last_slide = video_clips[-1]
                extension_duration = audio_duration - video.duration
                extended_last = last_slide.set_duration(last_slide.duration + extension_duration)
                
                # Recreate video with extended last slide
                final_clips[-1] = extended_last
                video = concatenate_videoclips(final_clips[:-1] + [extended_last], method="compose")
            
        except Exception as e:
            print(f"❌ Failed to combine slides: {e}")
            return None
        
        # Step 6: Add audio
        print("🔊 Adding audio...")
        try:
            final_video = video.set_audio(audio_clip)
        except Exception as e:
            print(f"❌ Failed to add audio: {e}")
            return None
        
        # Step 7: Export video
        if not output_name:
            output_name = f"{slides_path.stem}_educational_video.mp4"
        
        output_path = self.output_dir / output_name
        
        print(f"📤 Rendering final video: {output_path}")
        print("   This may take several minutes...")
        
        try:
            final_video.write_videofile(
                str(output_path),
                fps=self.config["video_settings"]["fps"],
                codec='libx264',
                audio_codec='aac',
                temp_audiofile=str(self.output_dir / "temp_audio.m4a"),
                remove_temp=True,
                verbose=False,
                logger=None
            )
            
            # Cleanup
            audio_clip.close()
            video.close()
            final_video.close()
            
            print(f"✅ Educational video created: {output_path}")
            
            # Create metadata
            metadata = {
                "source_slides": str(slides_path.absolute()),
                "source_audio": str(audio_path.absolute()),
                "output_video": str(output_path.absolute()),
                "slides_count": len(slides),
                "video_duration": audio_duration,
                "processing_date": datetime.now().isoformat(),
                "slide_timings": [
                    {
                        "slide_number": t["slide"]["number"],
                        "title": t["slide"]["title"],
                        "start_time": t["start_time"],
                        "duration": t["duration"]
                    }
                    for t in slide_timings
                ]
            }
            
            metadata_path = self.output_dir / f"{slides_path.stem}_metadata.json"
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            print(f"📝 Metadata saved: {metadata_path}")
            
            return {
                "video_path": output_path,
                "metadata_path": metadata_path,
                "duration": audio_duration,
                "slides_count": len(slides)
            }
            
        except Exception as e:
            print(f"❌ Video rendering failed: {e}")
            return None

def main():
    parser = argparse.ArgumentParser(
        description="Create educational videos from Slidev slides + podcast audio",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python podcast_video_processor.py slides.md podcast.m4a
  python podcast_video_processor.py slides.md podcast.m4a --output my_lecture.mp4
        """
    )
    
    parser.add_argument('slides_file', help='Slidev markdown file (.md)')
    parser.add_argument('audio_file', help='Original podcast audio file (.m4a, .mp3, .wav)')
    parser.add_argument('--output', help='Output video filename')
    parser.add_argument('--config', default='podcast_video_config.json', help='Configuration file')
    
    args = parser.parse_args()
    
    processor = PodcastVideoProcessor(args.config)
    result = processor.process_podcast_video(args.slides_file, args.audio_file, args.output)
    
    if result:
        print(f"\\n🎉 Educational video processing complete!")
        print(f"📁 Output: {result['video_path']}")
        print(f"⏱️ Duration: {result['duration']/60:.1f} minutes")
        print(f"📊 Slides: {result['slides_count']}")
    else:
        print("❌ Video processing failed")
        sys.exit(1)

if __name__ == "__main__":
    main()