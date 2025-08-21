#!/usr/bin/env python3
"""
NotebookLM Podcast Multi-Platform Publisher
==========================================

Comprehensive system to publish NotebookLM podcasts to:
- Audio platforms: Apple Podcasts, Spotify, Google Podcasts, etc.
- Video platform: YouTube (with visualizations)
- Generate RSS feeds and metadata

Usage:
    python podcast_publisher.py <audio_file.m4a> [options]
"""

import os
import sys
import argparse
import json
import time
from pathlib import Path
from datetime import datetime, timezone
import subprocess
import uuid
import hashlib
import re

# Audio processing
try:
    from pydub import AudioSegment
    from pydub.utils import which as pydub_which
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    pydub_which = None

# Video processing 
try:
    from moviepy.editor import AudioFileClip, ImageClip, CompositeVideoClip, TextClip, ColorClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False

# Web/API libraries
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

class PodcastPublisher:
    """Multi-platform podcast publisher for NotebookLM audio content"""
    
    def __init__(self, config_file="podcast_config.json"):
        self.config_file = config_file
        self.config = self.load_config()
        self.output_dir = Path("published_podcasts")
        self.output_dir.mkdir(exist_ok=True)
        
        print("🎙️ NotebookLM Podcast Multi-Platform Publisher")
        print("=" * 50)
        self._display_capabilities()
    
    def _display_capabilities(self):
        """Display available capabilities"""
        print(f"📦 Available Components:")
        print(f"   {'✅' if PYDUB_AVAILABLE else '❌'} PyDub (Audio processing): {PYDUB_AVAILABLE}")
        print(f"   {'✅' if MOVIEPY_AVAILABLE else '❌'} MoviePy (Video creation): {MOVIEPY_AVAILABLE}")
        print(f"   {'✅' if REQUESTS_AVAILABLE else '❌'} Requests (API calls): {REQUESTS_AVAILABLE}")
        ffmpeg_available = pydub_which('ffmpeg') if pydub_which else False
        print(f"   {'✅' if ffmpeg_available else '❌'} FFmpeg: {'Available' if ffmpeg_available else 'Not found'}")
        print()
    
    def load_config(self):
        """Load configuration file or create default"""
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            default_config = {
                "podcast_info": {
                    "title": "AI Generated Insights",
                    "description": "Deep dive conversations powered by NotebookLM",
                    "author": "AI Assistant",
                    "email": "your.email@example.com",
                    "language": "en-US",
                    "category": "Technology",
                    "subcategory": "Artificial Intelligence",
                    "explicit": False,
                    "copyright": f"© {datetime.now().year} AI Generated Content",
                    "website": "https://yourwebsite.com"
                },
                "youtube": {
                    "channel_name": "AI Insights",
                    "thumbnail_template": "default",
                    "description_template": "default",
                    "tags": ["AI", "NotebookLM", "Podcast", "Technology", "Discussion"]
                },
                "audio_platforms": {
                    "apple_podcasts": {"enabled": True, "connect_id": ""},
                    "spotify": {"enabled": True, "client_id": "", "client_secret": ""},
                    "google_podcasts": {"enabled": True},
                    "anchor": {"enabled": True, "api_key": ""}
                },
                "processing": {
                    "audio_quality": "high",
                    "video_resolution": "1920x1080",
                    "thumbnail_size": "1280x720",
                    "enable_chapters": True,
                    "enable_transcription": True
                }
            }
            
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, indent=2, ensure_ascii=False)
            
            print(f"📝 Created default config: {self.config_file}")
            print("   Please edit the configuration file with your platform credentials")
            
            return default_config
    
    def extract_metadata(self, audio_file):
        """Extract metadata from NotebookLM audio file"""
        file_path = Path(audio_file)
        
        # Try to extract info from filename
        title = file_path.stem.replace('_', ' ').replace('-', ' ')
        # Clean up common NotebookLM patterns
        title = re.sub(r'^\d+\.\s*', '', title)  # Remove leading numbers
        title = ' '.join(word.capitalize() for word in title.split())
        
        # Get file stats
        stats = file_path.stat()
        creation_time = datetime.fromtimestamp(stats.st_ctime, tz=timezone.utc)
        
        # Try to get audio duration
        duration_seconds = 0
        if PYDUB_AVAILABLE:
            try:
                audio = AudioSegment.from_file(str(audio_file))
                duration_seconds = len(audio) / 1000.0
            except Exception as e:
                print(f"⚠️ Could not extract duration: {e}")
        
        # Generate episode metadata
        episode_id = str(uuid.uuid4())
        file_hash = self._generate_file_hash(audio_file)
        
        metadata = {
            "episode_id": episode_id,
            "title": title,
            "description": f"An AI-generated deep dive conversation exploring {title.lower()}. Created with NotebookLM.",
            "pub_date": creation_time.isoformat(),
            "duration": duration_seconds,
            "file_size": stats.st_size,
            "file_hash": file_hash,
            "source_file": str(file_path.absolute()),
            "tags": self._generate_tags(title),
            "season": 1,
            "episode": self._get_episode_number()
        }
        
        return metadata
    
    def _generate_file_hash(self, file_path):
        """Generate SHA256 hash of file for uniqueness"""
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()[:16]
    
    def _generate_tags(self, title):
        """Generate relevant tags from title"""
        base_tags = ["AI", "NotebookLM", "Podcast", "Discussion", "Technology"]
        
        # Add title-specific tags
        words = title.lower().split()
        relevant_words = [word for word in words if len(word) > 3 and word not in ['the', 'and', 'with', 'from']]
        
        return base_tags + [word.capitalize() for word in relevant_words[:5]]
    
    def _get_episode_number(self):
        """Get next episode number based on existing episodes"""
        existing_episodes = list(self.output_dir.glob("episode_*.json"))
        return len(existing_episodes) + 1
    
    def create_video_visualization(self, audio_file, metadata, style="waveform"):
        """Create YouTube video with audio visualization"""
        if not MOVIEPY_AVAILABLE:
            print("❌ MoviePy not available - cannot create video")
            return None
        
        print("🎬 Creating YouTube video visualization...")
        
        try:
            # Load audio
            audio_clip = AudioFileClip(str(audio_file))
            duration = audio_clip.duration
            
            # Create background
            if style == "waveform":
                background = self._create_waveform_background(audio_clip, metadata)
            elif style == "spectrum":
                background = self._create_spectrum_background(audio_clip, metadata)
            else:
                background = self._create_simple_background(duration, metadata)
            
            # Add title overlay
            title_clip = self._create_title_overlay(metadata, duration)
            
            # Combine elements
            video = CompositeVideoClip([background, title_clip])
            video = video.set_audio(audio_clip)
            
            # Export video
            output_path = self.output_dir / f"{metadata['episode_id']}_youtube.mp4"
            
            print("📤 Rendering video (this may take a while)...")
            video.write_videofile(
                str(output_path),
                fps=30,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile=str(self.output_dir / "temp_audio.m4a"),
                remove_temp=True
            )
            
            # Cleanup
            audio_clip.close()
            video.close()
            
            print(f"✅ Video created: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"❌ Video creation failed: {e}")
            return None
    
    def _create_simple_background(self, duration, metadata):
        """Create simple gradient background"""
        # Create gradient background
        background = ColorClip(
            size=(1920, 1080), 
            color=(25, 25, 50),
            duration=duration
        )
        
        # Add podcast info
        info_text = f"🎙️ {self.config['podcast_info']['title']}\n\n{metadata['title']}"
        
        text_clip = TextClip(
            info_text,
            fontsize=60,
            color='white',
            font='Arial-Bold',
            method='caption',
            size=(1600, None)
        ).set_position('center').set_duration(duration)
        
        return CompositeVideoClip([background, text_clip])
    
    def _create_title_overlay(self, metadata, duration):
        """Create title overlay for video"""
        title_text = f"{metadata['title']}\n\n🎙️ {self.config['podcast_info']['title']}"
        
        # Create semi-transparent background for text
        text_bg = ColorClip(
            size=(1920, 200),
            color=(0, 0, 0),
            duration=duration
        ).set_opacity(0.7).set_position(('center', 50))
        
        # Create title text
        title_clip = TextClip(
            title_text,
            fontsize=48,
            color='white',
            font='Arial-Bold',
            method='caption',
            size=(1800, None)
        ).set_position(('center', 70)).set_duration(duration)
        
        return CompositeVideoClip([text_bg, title_clip])
    
    def convert_audio_formats(self, source_file, metadata):
        """Convert m4a to various formats needed by different platforms"""
        if not PYDUB_AVAILABLE:
            print("❌ PyDub not available - cannot convert audio formats")
            return {}
        
        print("🔄 Converting audio to multiple formats...")
        
        converted_files = {}
        source_path = Path(source_file)
        base_name = f"{metadata['episode_id']}_{source_path.stem}"
        
        try:
            # Load source audio
            audio = AudioSegment.from_file(str(source_file))
            
            # MP3 for most platforms (highest compatibility)
            mp3_path = self.output_dir / f"{base_name}.mp3"
            audio.export(str(mp3_path), format="mp3", bitrate="128k")
            converted_files['mp3'] = mp3_path
            print(f"   ✅ MP3: {mp3_path}")
            
            # WAV for high quality
            wav_path = self.output_dir / f"{base_name}.wav" 
            audio.export(str(wav_path), format="wav")
            converted_files['wav'] = wav_path
            print(f"   ✅ WAV: {wav_path}")
            
            # Keep original M4A
            m4a_path = self.output_dir / f"{base_name}.m4a"
            audio.export(str(m4a_path), format="mp4")  # mp4 container for m4a
            converted_files['m4a'] = m4a_path
            print(f"   ✅ M4A: {m4a_path}")
            
        except Exception as e:
            print(f"❌ Audio conversion failed: {e}")
        
        return converted_files
    
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
        <itunes:explicit>{str(self.config['podcast_info']['explicit']).lower()}</itunes:explicit>
        <copyright>{self.config['podcast_info']['copyright']}</copyright>
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
        
        print(f"✅ RSS feed generated: {rss_path}")
        return rss_path
    
    def create_episode_metadata_file(self, metadata, converted_files, video_file):
        """Create comprehensive episode metadata file"""
        episode_data = {
            **metadata,
            "files": {
                "audio": {str(k): str(v) for k, v in converted_files.items()},
                "video": str(video_file) if video_file else None
            },
            "processing_date": datetime.now(timezone.utc).isoformat(),
            "status": "processed",
            "publishing": {
                "youtube": {"uploaded": False, "video_id": None},
                "apple_podcasts": {"submitted": False},
                "spotify": {"submitted": False}, 
                "google_podcasts": {"submitted": False}
            }
        }
        
        metadata_file = self.output_dir / f"episode_{metadata['episode_id']}.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(episode_data, f, indent=2, ensure_ascii=False)
        
        print(f"📝 Episode metadata saved: {metadata_file}")
        return metadata_file
    
    def process_podcast(self, audio_file, create_video=True, video_style="simple"):
        """Main processing pipeline for a single podcast episode"""
        print(f"\n🎙️ Processing podcast: {audio_file}")
        print("=" * 60)
        
        # Step 1: Extract metadata
        metadata = self.extract_metadata(audio_file)
        print(f"📊 Episode: {metadata['episode']} - {metadata['title']}")
        print(f"⏱️ Duration: {metadata['duration']:.1f} seconds ({metadata['duration']/60:.1f} minutes)")
        
        # Step 2: Convert audio formats
        converted_files = self.convert_audio_formats(audio_file, metadata)
        
        # Step 3: Create video for YouTube (optional)
        video_file = None
        if create_video:
            video_file = self.create_video_visualization(audio_file, metadata, video_style)
        
        # Step 4: Create episode metadata
        metadata_file = self.create_episode_metadata_file(metadata, converted_files, video_file)
        
        # Step 5: Load all episodes and generate RSS feed
        all_episodes = self._load_all_episodes()
        rss_file = self.generate_rss_feed(all_episodes)
        
        print(f"\n🎉 Podcast processing complete!")
        print(f"📁 Output directory: {self.output_dir.absolute()}")
        
        return {
            "metadata": metadata,
            "files": converted_files,
            "video": video_file,
            "metadata_file": metadata_file,
            "rss_feed": rss_file
        }
    
    def _load_all_episodes(self):
        """Load metadata for all processed episodes"""
        episodes = []
        for metadata_file in self.output_dir.glob("episode_*.json"):
            with open(metadata_file, 'r', encoding='utf-8') as f:
                episode_data = json.load(f)
                episodes.append(episode_data)
        
        # Sort by episode number
        episodes.sort(key=lambda x: x.get('episode', 0))
        return episodes
    
    def generate_publishing_guide(self):
        """Generate guide for manual publishing to platforms"""
        guide_content = """# Podcast Publishing Guide

## Generated Files
Your podcast has been processed and the following files are ready:

### Audio Files
- **MP3**: Most compatible format for all platforms
- **M4A**: High quality, preferred by Apple Podcasts  
- **WAV**: Uncompressed, highest quality

### Video Files  
- **MP4**: YouTube-ready video with audio visualization

### Metadata Files
- **RSS Feed**: `podcast_feed.xml` - Upload to podcast hosting service
- **Episode JSON**: Contains all metadata for each episode

## Publishing Platforms

### 1. Apple Podcasts
1. Go to [Apple Podcasts Connect](https://podcastsconnect.apple.com)
2. Submit your RSS feed URL
3. Upload episode artwork (1400x1400 px minimum)
4. Use M4A audio files for best quality

### 2. Spotify for Podcasters
1. Go to [Spotify for Podcasters](https://podcasters.spotify.com)
2. Upload your RSS feed
3. Use MP3 files (recommended bitrate: 128kbps)

### 3. Google Podcasts
1. Submit RSS feed to [Google Podcasts Manager](https://podcastsmanager.google.com)
2. Ensure RSS feed is publicly accessible
3. MP3 format recommended

### 4. YouTube
1. Upload MP4 video files directly
2. Use generated titles and descriptions
3. Add to podcast playlist
4. Enable automatic captions

### 5. Other Platforms
- **Anchor**: Supports direct upload and distribution
- **Podcast Addict**: Automatic via RSS feed
- **Overcast**: Uses RSS feed
- **Pocket Casts**: Submit RSS feed

## Next Steps
1. Choose a podcast hosting service (Anchor, Libsyn, etc.)
2. Upload your RSS feed to the hosting service
3. Submit to platforms using the hosting service's RSS URL
4. Upload videos manually to YouTube

For automated publishing, consider setting up API credentials in the config file.
"""
        
        guide_path = self.output_dir / "PUBLISHING_GUIDE.md"
        with open(guide_path, 'w', encoding='utf-8') as f:
            f.write(guide_content)
        
        print(f"📖 Publishing guide created: {guide_path}")
        return guide_path

def main():
    parser = argparse.ArgumentParser(
        description="NotebookLM Podcast Multi-Platform Publisher",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python podcast_publisher.py podcast.m4a
  python podcast_publisher.py podcast.m4a --no-video
  python podcast_publisher.py podcast.m4a --video-style spectrum
  python podcast_publisher.py --batch podcasts/
        """
    )
    
    parser.add_argument('input', help='Input audio file or directory')
    parser.add_argument('--no-video', action='store_true', help='Skip video creation')
    parser.add_argument('--video-style', choices=['simple', 'waveform', 'spectrum'], 
                       default='simple', help='Video visualization style')
    parser.add_argument('--batch', action='store_true', help='Process all files in directory')
    parser.add_argument('--config', default='podcast_config.json', help='Configuration file')
    
    args = parser.parse_args()
    
    # Initialize publisher
    publisher = PodcastPublisher(args.config)
    
    # Process files
    if args.batch or Path(args.input).is_dir():
        # Batch processing
        input_dir = Path(args.input)
        audio_files = list(input_dir.glob("*.m4a")) + list(input_dir.glob("*.mp3"))
        
        if not audio_files:
            print("❌ No audio files found in directory")
            return
        
        print(f"📁 Found {len(audio_files)} audio files to process")
        
        for audio_file in audio_files:
            try:
                publisher.process_podcast(
                    str(audio_file), 
                    create_video=not args.no_video,
                    video_style=args.video_style
                )
            except Exception as e:
                print(f"❌ Failed to process {audio_file}: {e}")
                continue
    else:
        # Single file processing
        if not Path(args.input).exists():
            print(f"❌ File not found: {args.input}")
            return
        
        publisher.process_podcast(
            args.input,
            create_video=not args.no_video, 
            video_style=args.video_style
        )
    
    # Generate publishing guide
    publisher.generate_publishing_guide()
    
    print(f"\n🎉 All processing complete!")
    print(f"📁 Check output directory: {publisher.output_dir.absolute()}")

if __name__ == "__main__":
    main()