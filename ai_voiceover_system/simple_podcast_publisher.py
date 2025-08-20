#!/usr/bin/env python3
"""
Simple NotebookLM Podcast Publisher
===================================

Simplified, reliable version that focuses on core functionality:
- Audio format conversion
- RSS feed generation  
- Basic YouTube video creation
- Platform publishing preparation

Usage:
    python simple_podcast_publisher.py <audio_file.m4a>
"""

import os
import sys
import argparse
import json
import time
from pathlib import Path
from datetime import datetime, timezone
import uuid
import hashlib
import re
import shutil

# Audio processing with fallback
try:
    from pydub import AudioSegment
    from pydub.utils import which as pydub_which
    PYDUB_AVAILABLE = True
    print("✅ PyDub available for audio processing")
except ImportError:
    PYDUB_AVAILABLE = False
    pydub_which = None
    print("❌ PyDub not available - audio conversion will be limited")

# Video processing with fallback
try:
    from moviepy.editor import AudioFileClip, ColorClip, CompositeVideoClip
    MOVIEPY_AVAILABLE = True
    print("✅ MoviePy available for video creation")
except ImportError:
    try:
        from moviepy import AudioFileClip, ColorClip, CompositeVideoClip
        MOVIEPY_AVAILABLE = True
        print("✅ MoviePy available for video creation (fallback import)")
    except ImportError:
        MOVIEPY_AVAILABLE = False
        print("❌ MoviePy not available - video creation disabled")

import requests

class SimplePodcastPublisher:
    """Simple, reliable podcast publisher"""
    
    def __init__(self):
        self.output_dir = Path("published_podcasts")
        self.output_dir.mkdir(exist_ok=True)
        
        self.config = {
            "podcast_info": {
                "title": "AI Generated Insights",
                "description": "Deep dive conversations powered by NotebookLM",
                "author": "AI Assistant",
                "email": "your.email@example.com",
                "language": "en-US",
                "category": "Technology",
                "subcategory": "Artificial Intelligence",
                "website": "https://yourwebsite.com"
            }
        }
        
        print("🎙️ Simple NotebookLM Podcast Publisher")
        print("=" * 50)
    
    def extract_metadata(self, audio_file):
        """Extract basic metadata from audio file"""
        file_path = Path(audio_file)
        
        # Clean up filename for title
        title = file_path.stem.replace('_', ' ').replace('-', ' ')
        title = re.sub(r'^\d+\.\s*', '', title)  # Remove leading numbers
        title = ' '.join(word.capitalize() for word in title.split())
        
        # Get file stats
        stats = file_path.stat()
        creation_time = datetime.fromtimestamp(stats.st_ctime, tz=timezone.utc)
        
        # Try to get duration
        duration_seconds = 0
        if PYDUB_AVAILABLE:
            try:
                audio = AudioSegment.from_file(str(audio_file))
                duration_seconds = len(audio) / 1000.0
                print(f"✅ Audio duration: {duration_seconds/60:.1f} minutes")
            except Exception as e:
                print(f"⚠️ Could not extract duration: {e}")
        else:
            print("⚠️ Duration extraction disabled (PyDub not available)")
        
        episode_id = str(uuid.uuid4())
        
        metadata = {
            "episode_id": episode_id,
            "title": title,
            "description": f"An AI-generated deep dive conversation exploring {title.lower()}. Created with NotebookLM.",
            "pub_date": creation_time.isoformat(),
            "duration": duration_seconds,
            "file_size": stats.st_size,
            "source_file": str(file_path.absolute()),
            "tags": ["AI", "NotebookLM", "Podcast", "Discussion"] + [word.capitalize() for word in title.split()[:3]],
            "season": 1,
            "episode": self._get_episode_number()
        }
        
        return metadata
    
    def _get_episode_number(self):
        """Get next episode number"""
        existing_episodes = list(self.output_dir.glob("episode_*.json"))
        return len(existing_episodes) + 1
    
    def convert_audio_formats(self, source_file, metadata):
        """Convert to common podcast formats"""
        print("🔄 Converting audio formats...")
        
        converted_files = {}
        source_path = Path(source_file)
        base_name = f"{metadata['episode_id']}_{source_path.stem}"
        
        # Copy original file
        original_copy = self.output_dir / f"{base_name}.m4a"
        shutil.copy2(source_file, original_copy)
        converted_files['m4a'] = original_copy
        print(f"✅ Original M4A: {original_copy}")
        
        if PYDUB_AVAILABLE:
            try:
                audio = AudioSegment.from_file(str(source_file))
                
                # MP3 for maximum compatibility
                mp3_path = self.output_dir / f"{base_name}.mp3"
                audio.export(str(mp3_path), format="mp3", bitrate="128k")
                converted_files['mp3'] = mp3_path
                print(f"✅ MP3: {mp3_path}")
                
            except Exception as e:
                print(f"⚠️ Audio conversion failed: {e}")
                print("   Using original file only")
        else:
            print("⚠️ Audio conversion skipped (PyDub not available)")
        
        return converted_files
    
    def create_simple_video(self, audio_file, metadata):
        """Create simple video for YouTube"""
        if not MOVIEPY_AVAILABLE:
            print("❌ Video creation skipped (MoviePy not available)")
            return None
        
        print("🎬 Creating simple YouTube video...")
        
        try:
            # Load audio
            audio_clip = AudioFileClip(str(audio_file))
            duration = audio_clip.duration
            
            # For very long podcasts, create a shorter version for testing
            if duration > 300:  # 5 minutes
                print(f"⏰ Creating shorter video ({duration/60:.1f} min original)")
                duration = 60  # 1 minute test
                audio_clip = audio_clip.subclip(0, duration)
            
            # Create simple colored background
            background = ColorClip(
                size=(1920, 1080), 
                color=(25, 25, 50),  # Dark blue
                duration=duration
            )
            
            # Combine with audio
            video = background.set_audio(audio_clip)
            
            # Export
            output_path = self.output_dir / f"{metadata['episode_id']}_youtube.mp4"
            
            print("📤 Rendering video...")
            video.write_videofile(
                str(output_path),
                fps=30,
                codec='libx264',
                audio_codec='aac',
                verbose=False,
                logger=None
            )
            
            # Cleanup
            audio_clip.close()
            video.close()
            
            print(f"✅ Video created: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"❌ Video creation failed: {e}")
            return None
    
    def generate_rss_feed(self, episodes_metadata):
        """Generate RSS feed for podcast platforms"""
        print("📡 Generating RSS feed...")
        
        rss_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
    <channel>
        <title>{self.config['podcast_info']['title']}</title>
        <description>{self.config['podcast_info']['description']}</description>
        <language>{self.config['podcast_info']['language']}</language>
        <itunes:author>{self.config['podcast_info']['author']}</itunes:author>
        <itunes:email>{self.config['podcast_info']['email']}</itunes:email>
        <itunes:category text="{self.config['podcast_info']['category']}">
            <itunes:category text="{self.config['podcast_info']['subcategory']}" />
        </itunes:category>
        <link>{self.config['podcast_info']['website']}</link>
        <lastBuildDate>{datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S %z')}</lastBuildDate>
"""

        for episode in episodes_metadata:
            episode_date = datetime.fromisoformat(episode['pub_date']).strftime('%a, %d %b %Y %H:%M:%S %z')
            duration_formatted = f"{int(episode['duration']//3600):02d}:{int((episode['duration']%3600)//60):02d}:{int(episode['duration']%60):02d}"
            
            rss_content += f"""
        <item>
            <title>{episode['title']}</title>
            <description>{episode['description']}</description>
            <pubDate>{episode_date}</pubDate>
            <itunes:duration>{duration_formatted}</itunes:duration>
            <guid>{episode['episode_id']}</guid>
            <itunes:episodeType>full</itunes:episodeType>
            <itunes:season>{episode['season']}</itunes:season>
            <itunes:episode>{episode['episode']}</itunes:episode>
        </item>"""
        
        rss_content += """
    </channel>
</rss>"""
        
        # Save RSS feed
        rss_path = self.output_dir / "podcast_feed.xml"
        with open(rss_path, 'w', encoding='utf-8') as f:
            f.write(rss_content)
        
        print(f"✅ RSS feed: {rss_path}")
        return rss_path
    
    def process_podcast(self, audio_file, create_video=True):
        """Main processing pipeline"""
        print(f"\n🎙️ Processing: {Path(audio_file).name}")
        print("=" * 60)
        
        # Extract metadata
        metadata = self.extract_metadata(audio_file)
        print(f"📊 Episode {metadata['episode']}: {metadata['title']}")
        
        # Convert audio formats  
        converted_files = self.convert_audio_formats(audio_file, metadata)
        
        # Create video (optional)
        video_file = None
        if create_video:
            video_file = self.create_simple_video(audio_file, metadata)
        
        # Save episode metadata
        episode_data = {
            **metadata,
            "files": {
                "audio": {str(k): str(v) for k, v in converted_files.items()},
                "video": str(video_file) if video_file else None
            },
            "processing_date": datetime.now(timezone.utc).isoformat(),
            "status": "processed"
        }
        
        metadata_file = self.output_dir / f"episode_{metadata['episode_id']}.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(episode_data, f, indent=2, ensure_ascii=False)
        
        print(f"📝 Metadata: {metadata_file}")
        
        # Generate/update RSS feed
        all_episodes = self._load_all_episodes()
        rss_file = self.generate_rss_feed(all_episodes)
        
        # Generate publishing guide
        self._generate_publishing_guide()
        
        print(f"\n🎉 Processing complete!")
        print(f"📁 Output: {self.output_dir.absolute()}")
        
        return {
            "metadata": metadata,
            "files": converted_files,
            "video": video_file,
            "rss_feed": rss_file
        }
    
    def _load_all_episodes(self):
        """Load all episode metadata"""
        episodes = []
        for metadata_file in self.output_dir.glob("episode_*.json"):
            with open(metadata_file, 'r', encoding='utf-8') as f:
                episode_data = json.load(f)
                episodes.append(episode_data)
        
        episodes.sort(key=lambda x: x.get('episode', 0))
        return episodes
    
    def _generate_publishing_guide(self):
        """Generate simple publishing guide"""
        guide_content = """# 🎙️ Podcast Publishing Guide

## Generated Files

Your podcast has been processed! Here's what you have:

### Audio Files
- **M4A**: Original format, best for Apple Podcasts
- **MP3**: Universal format, works everywhere

### Video Files
- **MP4**: YouTube-ready video with simple background

### RSS Feed
- **podcast_feed.xml**: Upload this to your podcast host

## Quick Publishing Steps

### 1. Choose a Podcast Host
- **Anchor.fm** (Free): Upload your audio files directly
- **Spotify for Podcasters** (Free): Upload and auto-distribute
- **Libsyn** (Paid): Professional hosting with analytics

### 2. Upload to YouTube
- Upload the MP4 file directly to YouTube
- Add a good title and description
- Create a podcast playlist

### 3. Submit to Platforms
Once your host has your RSS feed URL:
- **Apple Podcasts**: Submit at [podcasts.apple.com](https://podcasts.apple.com)
- **Google Podcasts**: Submit at [podcastsmanager.google.com](https://podcastsmanager.google.com)
- **Spotify**: Use Spotify for Podcasters

## Tips
- Use consistent branding across platforms
- Upload a podcast cover image (1400x1400px minimum)
- Write compelling episode descriptions
- Enable automatic episode distribution from your host

Happy podcasting! 🎉
"""
        
        guide_path = self.output_dir / "QUICK_PUBLISHING_GUIDE.md"
        with open(guide_path, 'w', encoding='utf-8') as f:
            f.write(guide_content)
        
        print(f"📖 Guide: {guide_path}")

def main():
    parser = argparse.ArgumentParser(description="Simple NotebookLM Podcast Publisher")
    parser.add_argument('audio_file', help='Input audio file (M4A, MP3, WAV)')
    parser.add_argument('--no-video', action='store_true', help='Skip video creation')
    parser.add_argument('--batch', action='store_true', help='Process all audio files in directory')
    
    args = parser.parse_args()
    
    publisher = SimplePodcastPublisher()
    
    if args.batch:
        # Batch processing
        input_path = Path(args.audio_file)
        if not input_path.is_dir():
            print(f"❌ {args.audio_file} is not a directory")
            return
        
        audio_files = []
        for ext in ['*.m4a', '*.mp3', '*.wav']:
            audio_files.extend(input_path.glob(ext))
        
        if not audio_files:
            print("❌ No audio files found")
            return
        
        print(f"📁 Found {len(audio_files)} files to process")
        
        for audio_file in audio_files:
            try:
                publisher.process_podcast(str(audio_file), create_video=not args.no_video)
            except Exception as e:
                print(f"❌ Failed to process {audio_file}: {e}")
                continue
    else:
        # Single file processing
        if not Path(args.audio_file).exists():
            print(f"❌ File not found: {args.audio_file}")
            return
        
        publisher.process_podcast(args.audio_file, create_video=not args.no_video)
    
    print(f"\n🎉 All done! Check the published_podcasts folder for your files.")

if __name__ == "__main__":
    main()