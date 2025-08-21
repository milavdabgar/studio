#!/usr/bin/env python3
"""
YouTube Podcast Downloader
===========================

Downloads audio (M4A) and auto-generated subtitles (VTT/SRT) from YouTube videos
for creating time-synced educational presentations.

Usage:
    python youtube_podcast_downloader.py "https://www.youtube.com/watch?v=VIDEO_ID"
    
Features:
- Downloads highest quality M4A audio
- Gets auto-generated subtitles in specified language
- Saves metadata and video info
- Prepares files for time-synced slide generation
"""

import os
import sys
import argparse
import json
import subprocess
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse, parse_qs
import re

def extract_video_id(url):
    """Extract YouTube video ID from various URL formats"""
    # Handle different YouTube URL formats
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([^&\n?#]+)',
        r'youtube\.com/watch\?.*v=([^&\n?#]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    raise ValueError(f"Could not extract video ID from URL: {url}")

def sanitize_filename(filename):
    """Sanitize filename by removing/replacing problematic characters"""
    # Replace problematic characters
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove multiple underscores
    sanitized = re.sub(r'_+', '_', sanitized)
    # Trim length
    if len(sanitized) > 100:
        sanitized = sanitized[:100] + "..."
    return sanitized.strip('_')

def check_dependencies():
    """Check if yt-dlp is available"""
    try:
        result = subprocess.run(['yt-dlp', '--version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print(f"✅ yt-dlp version: {result.stdout.strip()}")
            return True
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    
    print("❌ yt-dlp not found. Please install it:")
    print("   pip install yt-dlp")
    print("   or brew install yt-dlp")
    return False

def get_video_info(url):
    """Get video metadata using yt-dlp"""
    try:
        cmd = ['yt-dlp', '--dump-json', '--no-download', url]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            raise Exception(f"yt-dlp failed: {result.stderr}")
        
        info = json.loads(result.stdout)
        return {
            'id': info.get('id'),
            'title': info.get('title'),
            'uploader': info.get('uploader'),
            'duration': info.get('duration'),
            'upload_date': info.get('upload_date'),
            'description': info.get('description', '')[:500] + '...',
            'view_count': info.get('view_count'),
            'like_count': info.get('like_count'),
            'thumbnail': info.get('thumbnail')
        }
    except Exception as e:
        print(f"❌ Failed to get video info: {e}")
        return None

def download_audio(url, output_dir, video_info):
    """Download highest quality M4A audio"""
    print("🎵 Downloading audio...")
    
    try:
        # Create safe filename
        safe_title = sanitize_filename(video_info['title'])
        audio_filename = f"{safe_title}.%(ext)s"
        
        cmd = [
            'yt-dlp',
            '--extract-audio',
            '--audio-format', 'm4a',
            '--audio-quality', '0',  # Best quality
            '--output', str(output_dir / audio_filename),
            '--no-playlist',
            url
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            raise Exception(f"Audio download failed: {result.stderr}")
        
        # Find the downloaded file
        audio_files = list(output_dir.glob(f"{safe_title}.m4a"))
        if not audio_files:
            raise Exception("Audio file not found after download")
        
        audio_file = audio_files[0]
        print(f"✅ Audio downloaded: {audio_file.name}")
        return audio_file
        
    except Exception as e:
        print(f"❌ Audio download failed: {e}")
        return None

def download_subtitles(url, output_dir, video_info, languages=['gu', 'en']):
    """Download auto-generated subtitles in specified languages"""
    print(f"📝 Downloading subtitles for languages: {', '.join(languages)}")
    
    downloaded_subs = []
    safe_title = sanitize_filename(video_info['title'])
    
    for lang in languages:
        try:
            print(f"   Downloading {lang} subtitles...")
            
            subtitle_filename = f"{safe_title}.%(ext)s"
            
            cmd = [
                'yt-dlp',
                '--write-auto-subs',
                '--sub-langs', lang,
                '--skip-download',
                '--output', str(output_dir / subtitle_filename),
                '--no-playlist',
                url
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0:
                # Find downloaded subtitle files (yt-dlp automatically adds language code)
                # Pattern: title.gu.vtt (not title.gu.gu.vtt)
                sub_files = list(output_dir.glob(f"{safe_title}.{lang}.*"))
                if sub_files:
                    for sub_file in sub_files:
                        if sub_file.suffix in ['.vtt', '.srt']:
                            downloaded_subs.append({
                                'language': lang,
                                'file': sub_file,
                                'format': sub_file.suffix[1:]  # Remove dot
                            })
                            print(f"   ✅ {lang} subtitles: {sub_file.name}")
                else:
                    print(f"   ⚠️  {lang} subtitles not available")
            else:
                print(f"   ⚠️  {lang} subtitles download failed")
                
        except Exception as e:
            print(f"   ❌ {lang} subtitles error: {e}")
    
    if not downloaded_subs:
        print("❌ No subtitles downloaded")
    
    return downloaded_subs

def save_metadata(output_dir, video_info, audio_file, subtitles):
    """Save download metadata"""
    metadata = {
        'download_date': datetime.now().isoformat(),
        'video_info': video_info,
        'files': {
            'audio': str(audio_file.name) if audio_file else None,
            'subtitles': [
                {
                    'language': sub['language'],
                    'file': str(sub['file'].name),
                    'format': sub['format']
                }
                for sub in subtitles
            ]
        },
        'pipeline_ready': bool(audio_file and subtitles)
    }
    
    metadata_file = output_dir / "download_metadata.json"
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Metadata saved: {metadata_file.name}")
    return metadata_file

def main():
    parser = argparse.ArgumentParser(
        description="Download YouTube podcast audio and subtitles for educational video creation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python youtube_podcast_downloader.py "https://www.youtube.com/watch?v=KmaNnnPZ9X4"
  python youtube_podcast_downloader.py "https://youtu.be/KmaNnnPZ9X4" --languages gu en hi
  python youtube_podcast_downloader.py "https://www.youtube.com/watch?v=KmaNnnPZ9X4" --output ~/Downloads/podcast
        """
    )
    
    parser.add_argument('url', help='YouTube video URL')
    parser.add_argument('--languages', nargs='+', default=['gu', 'en'], 
                       help='Subtitle languages to download (default: gu en)')
    parser.add_argument('--output', default='youtube_downloads', 
                       help='Output directory (default: youtube_downloads)')
    
    args = parser.parse_args()
    
    # Check dependencies
    if not check_dependencies():
        return 1
    
    # Extract video ID and validate URL
    try:
        video_id = extract_video_id(args.url)
        print(f"🎯 Video ID: {video_id}")
    except ValueError as e:
        print(f"❌ {e}")
        return 1
    
    # Create output directory
    output_dir = Path(args.output)
    output_dir.mkdir(exist_ok=True)
    print(f"📁 Output directory: {output_dir.absolute()}")
    
    # Get video information
    print("📊 Getting video information...")
    video_info = get_video_info(args.url)
    if not video_info:
        return 1
    
    print(f"📺 Title: {video_info['title']}")
    print(f"👤 Uploader: {video_info['uploader']}")
    print(f"⏱️  Duration: {video_info['duration']} seconds")
    
    # Download audio
    audio_file = download_audio(args.url, output_dir, video_info)
    
    # Download subtitles
    subtitles = download_subtitles(args.url, output_dir, video_info, args.languages)
    
    # Save metadata
    metadata_file = save_metadata(output_dir, video_info, audio_file, subtitles)
    
    # Summary
    print("\n🎉 Download Summary:")
    print(f"✅ Audio: {'Downloaded' if audio_file else 'Failed'}")
    print(f"✅ Subtitles: {len(subtitles)} language(s) downloaded")
    print(f"✅ Metadata: Saved to {metadata_file.name}")
    
    if audio_file and subtitles:
        print("\n🚀 Ready for next steps:")
        print("1. Review subtitle timing and content")
        print("2. Create Slidev presentation manually")
        print("3. Use time-synced video generator script")
        
        # Show file structure
        print(f"\n📂 Files in {output_dir}:")
        for file in sorted(output_dir.iterdir()):
            if file.is_file():
                print(f"   📄 {file.name}")
    else:
        print("\n❌ Download incomplete. Please check errors above.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())