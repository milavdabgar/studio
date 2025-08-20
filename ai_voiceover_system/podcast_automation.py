#!/usr/bin/env python3
"""
Complete Podcast Automation Pipeline
===================================

End-to-end automation for NotebookLM podcasts:
1. Process audio files
2. Create video visualizations  
3. Upload to YouTube
4. Generate RSS feeds
5. Prepare for other platforms

Usage:
    python podcast_automation.py --input podcasts/ --auto-upload
"""

import os
import sys
import argparse
import json
from pathlib import Path
import time

from podcast_publisher import PodcastPublisher
from youtube_uploader import YouTubeUploader

class PodcastAutomation:
    """Complete automation pipeline for NotebookLM podcasts"""
    
    def __init__(self, config_file="podcast_automation_config.json"):
        self.config_file = config_file
        self.config = self.load_automation_config()
        
        # Initialize components
        self.publisher = PodcastPublisher("podcast_config.json")
        self.youtube_uploader = YouTubeUploader("youtube_credentials.json")
        
        print("🤖 Podcast Automation Pipeline")
        print("=" * 40)
    
    def load_automation_config(self):
        """Load automation configuration"""
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r') as f:
                return json.load(f)
        else:
            default_config = {
                "processing": {
                    "create_video": True,
                    "video_style": "simple",
                    "auto_upload_youtube": False,
                    "auto_generate_thumbnails": True
                },
                "youtube": {
                    "playlist_name": "AI Generated Podcasts",
                    "playlist_id": None,
                    "auto_create_playlist": True,
                    "privacy_status": "public",
                    "enable_comments": True,
                    "enable_notifications": True
                },
                "audio_platforms": {
                    "generate_rss": True,
                    "prepare_anchor_upload": True,
                    "prepare_spotify_metadata": True
                },
                "monitoring": {
                    "webhook_url": None,
                    "email_notifications": False,
                    "slack_notifications": False
                }
            }
            
            with open(self.config_file, 'w') as f:
                json.dump(default_config, f, indent=2)
            
            return default_config
    
    def process_batch(self, input_path, auto_upload=False):
        """Process all podcasts in batch"""
        input_dir = Path(input_path)
        
        if not input_dir.exists():
            print(f"❌ Input directory not found: {input_path}")
            return []
        
        # Find all audio files
        audio_files = []
        for ext in ['*.m4a', '*.mp3', '*.wav']:
            audio_files.extend(input_dir.glob(ext))
        
        if not audio_files:
            print("❌ No audio files found")
            return []
        
        print(f"📁 Found {len(audio_files)} audio files to process")
        
        # Create YouTube playlist if needed
        playlist_id = self._ensure_youtube_playlist()
        
        processed_episodes = []
        
        for i, audio_file in enumerate(audio_files, 1):
            print(f"\n📻 Processing {i}/{len(audio_files)}: {audio_file.name}")
            print("-" * 60)
            
            try:
                # Process podcast
                result = self.publisher.process_podcast(
                    str(audio_file),
                    create_video=self.config['processing']['create_video'],
                    video_style=self.config['processing']['video_style']
                )
                
                # Upload to YouTube if enabled
                if auto_upload and result['video']:
                    youtube_result = self._upload_to_youtube(result, playlist_id)
                    result['youtube'] = youtube_result
                
                # Send notifications
                self._send_notifications(result, i, len(audio_files))
                
                processed_episodes.append(result)
                
                print(f"✅ Episode {i} processed successfully")
                
                # Brief delay between uploads
                if auto_upload and i < len(audio_files):
                    print("⏱️ Waiting 30 seconds before next upload...")
                    time.sleep(30)
                
            except Exception as e:
                print(f"❌ Failed to process {audio_file.name}: {e}")
                continue
        
        # Generate final summary
        self._generate_batch_summary(processed_episodes)
        
        return processed_episodes
    
    def _ensure_youtube_playlist(self):
        """Create YouTube playlist if it doesn't exist"""
        playlist_id = self.config['youtube'].get('playlist_id')
        
        if not playlist_id and self.config['youtube']['auto_create_playlist']:
            playlist_name = self.config['youtube']['playlist_name']
            playlist_id = self.youtube_uploader.create_playlist(
                playlist_name,
                "Automatically generated playlist for AI podcast episodes"
            )
            
            if playlist_id:
                # Save playlist ID to config
                self.config['youtube']['playlist_id'] = playlist_id
                with open(self.config_file, 'w') as f:
                    json.dump(self.config, f, indent=2)
        
        return playlist_id
    
    def _upload_to_youtube(self, episode_result, playlist_id):
        """Upload episode to YouTube"""
        if not episode_result['video']:
            print("⚠️ No video file to upload")
            return None
        
        print("📤 Uploading to YouTube...")
        
        try:
            video_id = self.youtube_uploader.upload_video(
                episode_result['video'],
                episode_result['metadata'],
                playlist_id=playlist_id
            )
            
            if video_id:
                # Update episode metadata with YouTube info
                metadata_file = episode_result['metadata_file']
                with open(metadata_file, 'r') as f:
                    episode_data = json.load(f)
                
                episode_data['publishing']['youtube'] = {
                    'uploaded': True,
                    'video_id': video_id,
                    'url': f"https://www.youtube.com/watch?v={video_id}",
                    'upload_date': time.time()
                }
                
                with open(metadata_file, 'w') as f:
                    json.dump(episode_data, f, indent=2)
                
                return {
                    'success': True,
                    'video_id': video_id,
                    'url': f"https://www.youtube.com/watch?v={video_id}"
                }
            
        except Exception as e:
            print(f"❌ YouTube upload failed: {e}")
            
        return {'success': False, 'error': str(e)}
    
    def _send_notifications(self, result, current, total):
        """Send notifications about processing status"""
        if self.config['monitoring']['webhook_url']:
            self._send_webhook_notification(result, current, total)
        
        # Add email/Slack notifications here if configured
    
    def _send_webhook_notification(self, result, current, total):
        """Send webhook notification"""
        import requests
        
        webhook_data = {
            "text": f"Podcast processed: {result['metadata']['title']} ({current}/{total})",
            "episode": result['metadata']['episode'],
            "title": result['metadata']['title'], 
            "duration": result['metadata']['duration'],
            "youtube_uploaded": bool(result.get('youtube', {}).get('success')),
            "progress": f"{current}/{total}"
        }
        
        try:
            requests.post(
                self.config['monitoring']['webhook_url'],
                json=webhook_data,
                timeout=10
            )
        except Exception as e:
            print(f"⚠️ Webhook notification failed: {e}")
    
    def _generate_batch_summary(self, episodes):
        """Generate summary report for batch processing"""
        if not episodes:
            return
        
        summary = {
            "batch_processed": len(episodes),
            "total_duration": sum(ep['metadata']['duration'] for ep in episodes),
            "youtube_uploads": sum(1 for ep in episodes if ep.get('youtube', {}).get('success')),
            "processing_date": time.time(),
            "episodes": [
                {
                    "title": ep['metadata']['title'],
                    "episode": ep['metadata']['episode'],
                    "duration": ep['metadata']['duration'],
                    "youtube_url": ep.get('youtube', {}).get('url'),
                    "files_created": len(ep['files'])
                }
                for ep in episodes
            ]
        }
        
        # Save summary
        summary_file = self.publisher.output_dir / "batch_summary.json"
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        
        # Print summary
        print(f"\n📊 BATCH PROCESSING SUMMARY")
        print("=" * 50)
        print(f"✅ Episodes processed: {summary['batch_processed']}")
        print(f"⏱️ Total duration: {summary['total_duration']/60:.1f} minutes")
        print(f"📤 YouTube uploads: {summary['youtube_uploads']}")
        print(f"📁 Output directory: {self.publisher.output_dir.absolute()}")
        
        if summary['youtube_uploads'] > 0:
            print(f"\n🎥 YouTube Videos:")
            for ep in summary['episodes']:
                if ep.get('youtube_url'):
                    print(f"   • {ep['title']}: {ep['youtube_url']}")
    
    def setup_platform_integrations(self):
        """Interactive setup for platform integrations"""
        print("🔧 Platform Integration Setup")
        print("=" * 30)
        
        # YouTube setup
        if input("Setup YouTube integration? (y/n): ").lower() == 'y':
            print("\n📺 YouTube Setup:")
            print("1. Go to https://console.cloud.google.com/")
            print("2. Create a new project or select existing")
            print("3. Enable YouTube Data API v3")
            print("4. Create OAuth 2.0 credentials")
            print("5. Download credentials as JSON")
            print("6. Replace the template in youtube_credentials.json")
            
        # Spotify setup  
        if input("\nSetup Spotify integration? (y/n): ").lower() == 'y':
            print("\n🎵 Spotify Setup:")
            print("1. Go to https://developer.spotify.com/dashboard")
            print("2. Create a new app")
            print("3. Get Client ID and Client Secret")
            print("4. Add credentials to podcast_config.json")
        
        # RSS hosting setup
        if input("\nSetup RSS hosting? (y/n): ").lower() == 'y':
            print("\n📡 RSS Feed Hosting:")
            print("Consider these options:")
            print("• Anchor.fm - Free hosting with auto-distribution")
            print("• Libsyn - Professional podcast hosting")
            print("• GitHub Pages - Free static hosting")
            print("• Your own web server")
        
        print(f"\n✅ Setup complete! Edit {self.config_file} to customize settings.")

def main():
    parser = argparse.ArgumentParser(
        description="Complete Podcast Automation Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument('--input', required=True, help='Input directory with audio files')
    parser.add_argument('--auto-upload', action='store_true', help='Automatically upload to YouTube')
    parser.add_argument('--setup', action='store_true', help='Setup platform integrations')
    parser.add_argument('--config', default='podcast_automation_config.json', help='Config file')
    
    args = parser.parse_args()
    
    automation = PodcastAutomation(args.config)
    
    if args.setup:
        automation.setup_platform_integrations()
        return
    
    # Process batch
    episodes = automation.process_batch(args.input, args.auto_upload)
    
    if episodes:
        print(f"\n🎉 Batch processing complete!")
        print(f"📁 Check output: {automation.publisher.output_dir.absolute()}")
        
        # Show next steps
        print(f"\n📋 Next Steps:")
        print(f"1. Review generated files in output directory")
        print(f"2. Upload RSS feed to podcast hosting service")
        print(f"3. Submit to Apple Podcasts, Spotify, etc.")
        if not args.auto_upload:
            print(f"4. Manually upload videos to YouTube")
        print(f"5. Check PUBLISHING_GUIDE.md for detailed instructions")

if __name__ == "__main__":
    main()