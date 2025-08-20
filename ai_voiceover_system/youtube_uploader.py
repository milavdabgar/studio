#!/usr/bin/env python3
"""
YouTube Automated Uploader for Podcast Videos
============================================

Handles automated YouTube uploads with proper metadata, thumbnails, and playlists.
"""

import os
import json
import pickle
from pathlib import Path
from datetime import datetime

try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    from googleapiclient.http import MediaFileUpload
    YOUTUBE_API_AVAILABLE = True
except ImportError:
    YOUTUBE_API_AVAILABLE = False

class YouTubeUploader:
    """Automated YouTube uploader for podcast videos"""
    
    SCOPES = ['https://www.googleapis.com/auth/youtube.upload',
              'https://www.googleapis.com/auth/youtube']
    
    def __init__(self, credentials_file="youtube_credentials.json"):
        self.credentials_file = credentials_file
        self.token_file = "youtube_token.pickle"
        self.service = None
        
        if YOUTUBE_API_AVAILABLE:
            self._authenticate()
        else:
            print("❌ YouTube API libraries not available")
    
    def _authenticate(self):
        """Handle YouTube API authentication"""
        creds = None
        
        # Load existing token
        if os.path.exists(self.token_file):
            with open(self.token_file, 'rb') as token:
                creds = pickle.load(token)
        
        # If no valid credentials, get new ones
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(self.credentials_file):
                    self._create_credentials_template()
                    print(f"❌ Please add your YouTube API credentials to {self.credentials_file}")
                    return
                
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, self.SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Save credentials
            with open(self.token_file, 'wb') as token:
                pickle.dump(creds, token)
        
        self.service = build('youtube', 'v3', credentials=creds)
        print("✅ YouTube API authenticated")
    
    def _create_credentials_template(self):
        """Create template for YouTube API credentials"""
        template = {
            "installed": {
                "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
                "project_id": "your-project-id", 
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_secret": "YOUR_CLIENT_SECRET",
                "redirect_uris": ["http://localhost"]
            }
        }
        
        with open(self.credentials_file, 'w') as f:
            json.dump(template, f, indent=2)
        
        print(f"📝 Created credentials template: {self.credentials_file}")
        print("   Get your credentials from: https://console.cloud.google.com/")
    
    def upload_video(self, video_file, metadata, thumbnail_file=None, playlist_id=None):
        """Upload video to YouTube with metadata"""
        if not self.service:
            print("❌ YouTube service not authenticated")
            return None
        
        print(f"📤 Uploading to YouTube: {metadata['title']}")
        
        # Prepare video metadata
        body = {
            'snippet': {
                'title': metadata['title'],
                'description': self._format_description(metadata),
                'tags': metadata.get('tags', []),
                'categoryId': '22',  # People & Blogs category
                'defaultLanguage': 'en',
                'defaultAudioLanguage': 'en'
            },
            'status': {
                'privacyStatus': 'public',  # or 'private', 'unlisted'
                'selfDeclaredMadeForKids': False
            }
        }
        
        # Upload video
        media = MediaFileUpload(
            video_file,
            chunksize=1024*1024,  # 1MB chunks
            resumable=True,
            mimetype='video/mp4'
        )
        
        try:
            request = self.service.videos().insert(
                part=','.join(body.keys()),
                body=body,
                media_body=media
            )
            
            response = self._resumable_upload(request)
            video_id = response['id']
            
            print(f"✅ Video uploaded successfully!")
            print(f"   Video ID: {video_id}")
            print(f"   URL: https://www.youtube.com/watch?v={video_id}")
            
            # Upload thumbnail if provided
            if thumbnail_file and os.path.exists(thumbnail_file):
                self._upload_thumbnail(video_id, thumbnail_file)
            
            # Add to playlist if provided
            if playlist_id:
                self._add_to_playlist(video_id, playlist_id)
            
            return video_id
            
        except HttpError as e:
            print(f"❌ YouTube upload failed: {e}")
            return None
    
    def _format_description(self, metadata):
        """Format video description for YouTube"""
        description = f"""🎙️ {metadata['title']}

{metadata.get('description', 'An AI-generated deep dive conversation powered by NotebookLM.')}

📅 Episode {metadata.get('episode', 'N/A')}
⏱️ Duration: {self._format_duration(metadata.get('duration', 0))}

🏷️ Tags: {', '.join(metadata.get('tags', []))}

---

This podcast was generated using NotebookLM and processed with AI tools for multi-platform distribution.

🔗 Links:
• Apple Podcasts: [Add your link]
• Spotify: [Add your link] 
• Google Podcasts: [Add your link]
• RSS Feed: [Add your link]

#Podcast #AI #NotebookLM #Discussion #{' #'.join(metadata.get('tags', [])[:5])}

Generated on {datetime.now().strftime('%B %d, %Y')}"""
        
        return description
    
    def _format_duration(self, duration_seconds):
        """Format duration as MM:SS"""
        minutes = int(duration_seconds // 60)
        seconds = int(duration_seconds % 60)
        return f"{minutes}:{seconds:02d}"
    
    def _resumable_upload(self, request):
        """Handle resumable upload with progress"""
        response = None
        error = None
        retry = 0
        
        while response is None:
            try:
                print("📤 Uploading...", end="", flush=True)
                status, response = request.next_chunk()
                if status:
                    print(f"\rUpload progress: {int(status.progress() * 100)}%", end="", flush=True)
            except HttpError as e:
                if e.resp.status in [500, 502, 503, 504]:
                    error = f"Server error: {e.resp.status}"
                    retry += 1
                    if retry > 5:
                        raise e
                    print(f"\nRetrying upload (attempt {retry})...")
                else:
                    raise e
            except Exception as e:
                raise e
        
        print("\n✅ Upload completed!")
        return response
    
    def _upload_thumbnail(self, video_id, thumbnail_file):
        """Upload custom thumbnail"""
        try:
            request = self.service.thumbnails().set(
                videoId=video_id,
                media_body=MediaFileUpload(thumbnail_file, mimetype='image/jpeg')
            )
            response = request.execute()
            print(f"✅ Thumbnail uploaded")
        except Exception as e:
            print(f"⚠️ Thumbnail upload failed: {e}")
    
    def _add_to_playlist(self, video_id, playlist_id):
        """Add video to playlist"""
        try:
            request = self.service.playlistItems().insert(
                part="snippet",
                body={
                    'snippet': {
                        'playlistId': playlist_id,
                        'resourceId': {
                            'kind': 'youtube#video',
                            'videoId': video_id
                        }
                    }
                }
            )
            response = request.execute()
            print(f"✅ Added to playlist: {playlist_id}")
        except Exception as e:
            print(f"⚠️ Failed to add to playlist: {e}")
    
    def create_playlist(self, title, description="AI Generated Podcast Episodes"):
        """Create new YouTube playlist"""
        if not self.service:
            return None
        
        try:
            request = self.service.playlists().insert(
                part="snippet,status",
                body={
                    'snippet': {
                        'title': title,
                        'description': description,
                        'defaultLanguage': 'en'
                    },
                    'status': {
                        'privacyStatus': 'public'
                    }
                }
            )
            response = request.execute()
            playlist_id = response['id']
            
            print(f"✅ Playlist created: {title}")
            print(f"   Playlist ID: {playlist_id}")
            print(f"   URL: https://www.youtube.com/playlist?list={playlist_id}")
            
            return playlist_id
            
        except Exception as e:
            print(f"❌ Failed to create playlist: {e}")
            return None