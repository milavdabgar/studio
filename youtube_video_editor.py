#!/usr/bin/env python3
"""
YouTube Video Editor
Edit video details, metadata, and settings after upload using YouTube Data API.
"""

import os
import sys
import json
import argparse
from datetime import datetime
import googleapiclient.discovery
import googleapiclient.errors
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.http import MediaFileUpload

# YouTube API scopes
SCOPES = ['https://www.googleapis.com/auth/youtube']

class YouTubeVideoEditor:
    def __init__(self, credentials_file="youtube_credentials.json", token_file="youtube_token.json"):
        """Initialize the YouTube video editor."""
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.youtube = None
        self._authenticate()
    
    def _authenticate(self):
        """Authenticate with YouTube API."""
        creds = None
        
        # Load existing token if available
        if os.path.exists(self.token_file):
            creds = Credentials.from_authorized_user_file(self.token_file, SCOPES)
        
        # If there are no valid credentials, request authorization
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception as e:
                    print(f"⚠️ Token refresh failed: {e}")
                    creds = None
            
            if not creds:
                if not os.path.exists(self.credentials_file):
                    print(f"❌ Error: Credentials file '{self.credentials_file}' not found!")
                    sys.exit(1)
                
                flow = InstalledAppFlow.from_client_secrets_file(self.credentials_file, SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Save credentials for next run
            with open(self.token_file, 'w') as token:
                token.write(creds.to_json())
        
        # Build YouTube service
        self.youtube = googleapiclient.discovery.build('youtube', 'v3', credentials=creds)
        print("✅ Successfully authenticated with YouTube API")
    
    def get_video_details(self, video_id):
        """Get current video details."""
        try:
            request = self.youtube.videos().list(
                part="snippet,status,contentDetails,localizations",
                id=video_id
            )
            response = request.execute()
            
            if not response['items']:
                print(f"❌ Video with ID '{video_id}' not found")
                return None
            
            video = response['items'][0]
            print(f"📺 Video found: {video['snippet']['title']}")
            return video
            
        except googleapiclient.errors.HttpError as e:
            print(f"❌ Error fetching video details: {e}")
            return None
    
    def update_video_metadata(self, video_id, title=None, description=None, tags=None, 
                            category_id=None, default_language=None):
        """Update video title, description, tags, and other metadata."""
        try:
            # Get current video details
            current_video = self.get_video_details(video_id)
            if not current_video:
                return False
            
            # Prepare update payload
            snippet = current_video['snippet'].copy()
            
            # Update fields if provided
            if title:
                snippet['title'] = title
                print(f"📝 Title: {title}")
            
            if description:
                snippet['description'] = description
                print(f"📄 Description updated ({len(description)} characters)")
            
            if tags:
                snippet['tags'] = tags if isinstance(tags, list) else tags.split(',')
                print(f"🏷️ Tags: {', '.join(snippet['tags'])}")
            
            if category_id:
                snippet['categoryId'] = str(category_id)
                print(f"📂 Category ID: {category_id}")
            
            if default_language:
                snippet['defaultLanguage'] = default_language
                print(f"🌐 Language: {default_language}")
            
            # Update video
            request = self.youtube.videos().update(
                part="snippet",
                body={
                    "id": video_id,
                    "snippet": snippet
                }
            )
            
            response = request.execute()
            print(f"✅ Video metadata updated successfully!")
            return True
            
        except googleapiclient.errors.HttpError as e:
            print(f"❌ Error updating video metadata: {e}")
            return False
    
    def update_video_privacy(self, video_id, privacy_status):
        """Update video privacy settings."""
        try:
            # Get current video details
            current_video = self.get_video_details(video_id)
            if not current_video:
                return False
            
            # Update privacy
            request = self.youtube.videos().update(
                part="status",
                body={
                    "id": video_id,
                    "status": {
                        "privacyStatus": privacy_status,
                        "selfDeclaredMadeForKids": current_video['status'].get('selfDeclaredMadeForKids', False)
                    }
                }
            )
            
            response = request.execute()
            print(f"✅ Privacy updated to: {privacy_status}")
            return True
            
        except googleapiclient.errors.HttpError as e:
            print(f"❌ Error updating privacy: {e}")
            return False
    
    def update_thumbnail(self, video_id, thumbnail_path):
        """Update video thumbnail."""
        try:
            if not os.path.exists(thumbnail_path):
                print(f"❌ Thumbnail file not found: {thumbnail_path}")
                return False
            
            request = self.youtube.thumbnails().set(
                videoId=video_id,
                media_body=MediaFileUpload(thumbnail_path)
            )
            
            response = request.execute()
            print(f"✅ Thumbnail updated: {thumbnail_path}")
            return True
            
        except googleapiclient.errors.HttpError as e:
            print(f"❌ Error updating thumbnail: {e}")
            return False
    
    def add_to_playlist(self, video_id, playlist_id):
        """Add video to a playlist."""
        try:
            request = self.youtube.playlistItems().insert(
                part="snippet",
                body={
                    "snippet": {
                        "playlistId": playlist_id,
                        "resourceId": {
                            "kind": "youtube#video",
                            "videoId": video_id
                        }
                    }
                }
            )
            
            response = request.execute()
            print(f"✅ Video added to playlist: {playlist_id}")
            return True
            
        except googleapiclient.errors.HttpError as e:
            print(f"❌ Error adding to playlist: {e}")
            return False
    
    def get_video_analytics(self, video_id):
        """Get basic video statistics."""
        try:
            request = self.youtube.videos().list(
                part="statistics,snippet",
                id=video_id
            )
            response = request.execute()
            
            if not response['items']:
                print(f"❌ Video with ID '{video_id}' not found")
                return None
            
            video = response['items'][0]
            stats = video.get('statistics', {})
            
            print(f"\n📊 Video Analytics:")
            print(f"👀 Views: {stats.get('viewCount', 0)}")
            print(f"👍 Likes: {stats.get('likeCount', 0)}")
            print(f"💬 Comments: {stats.get('commentCount', 0)}")
            print(f"📅 Published: {video['snippet']['publishedAt']}")
            
            return stats
            
        except googleapiclient.errors.HttpError as e:
            print(f"❌ Error fetching analytics: {e}")
            return None
    
    def list_my_videos(self, max_results=10):
        """List user's recent videos."""
        try:
            request = self.youtube.search().list(
                part="snippet",
                forMine=True,
                type="video",
                order="date",
                maxResults=max_results
            )
            response = request.execute()
            
            print(f"\n📺 Your Recent Videos:")
            for i, item in enumerate(response.get('items', []), 1):
                video_id = item['id']['videoId']
                title = item['snippet']['title']
                published = item['snippet']['publishedAt'][:10]
                print(f"{i:2d}. {video_id} - {title} ({published})")
            
            return response.get('items', [])
            
        except googleapiclient.errors.HttpError as e:
            print(f"❌ Error listing videos: {e}")
            return []

def main():
    parser = argparse.ArgumentParser(description='Edit YouTube video details')
    parser.add_argument('action', choices=['update', 'privacy', 'thumbnail', 'playlist', 
                                         'analytics', 'list', 'show'], 
                       help='Action to perform')
    parser.add_argument('--video-id', help='YouTube video ID')
    parser.add_argument('--title', help='New video title')
    parser.add_argument('--description', help='New video description')
    parser.add_argument('--tags', nargs='+', help='New video tags')
    parser.add_argument('--privacy', choices=['private', 'unlisted', 'public'], 
                       help='Privacy setting')
    parser.add_argument('--thumbnail', help='Path to new thumbnail image')
    parser.add_argument('--playlist-id', help='Playlist ID to add video to')
    parser.add_argument('--category', type=int, default=22, help='YouTube category ID')
    parser.add_argument('--language', help='Default language code (e.g., en)')
    parser.add_argument('--credentials', default='youtube_credentials.json', 
                       help='OAuth credentials file')
    
    args = parser.parse_args()
    
    # Initialize editor
    editor = YouTubeVideoEditor(credentials_file=args.credentials)
    
    # Perform action
    if args.action == 'update':
        if not args.video_id:
            print("❌ --video-id is required for update action")
            sys.exit(1)
        
        success = editor.update_video_metadata(
            video_id=args.video_id,
            title=args.title,
            description=args.description,
            tags=args.tags,
            category_id=args.category,
            default_language=args.language
        )
        
    elif args.action == 'privacy':
        if not args.video_id or not args.privacy:
            print("❌ --video-id and --privacy are required")
            sys.exit(1)
        
        success = editor.update_video_privacy(args.video_id, args.privacy)
        
    elif args.action == 'thumbnail':
        if not args.video_id or not args.thumbnail:
            print("❌ --video-id and --thumbnail are required")
            sys.exit(1)
        
        success = editor.update_thumbnail(args.video_id, args.thumbnail)
        
    elif args.action == 'playlist':
        if not args.video_id or not args.playlist_id:
            print("❌ --video-id and --playlist-id are required")
            sys.exit(1)
        
        success = editor.add_to_playlist(args.video_id, args.playlist_id)
        
    elif args.action == 'analytics':
        if not args.video_id:
            print("❌ --video-id is required for analytics")
            sys.exit(1)
        
        stats = editor.get_video_analytics(args.video_id)
        success = stats is not None
        
    elif args.action == 'list':
        videos = editor.list_my_videos()
        success = len(videos) > 0
        
    elif args.action == 'show':
        if not args.video_id:
            print("❌ --video-id is required for show action")
            sys.exit(1)
        
        video = editor.get_video_details(args.video_id)
        if video:
            snippet = video['snippet']
            status = video['status']
            
            print(f"\n📺 Video Details:")
            print(f"🔗 URL: https://www.youtube.com/watch?v={args.video_id}")
            print(f"📝 Title: {snippet['title']}")
            print(f"📄 Description: {snippet['description'][:200]}...")
            print(f"🏷️ Tags: {', '.join(snippet.get('tags', []))}")
            print(f"🔒 Privacy: {status['privacyStatus']}")
            print(f"📅 Published: {snippet['publishedAt']}")
            
            # Get analytics too
            editor.get_video_analytics(args.video_id)
        
        success = video is not None
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()