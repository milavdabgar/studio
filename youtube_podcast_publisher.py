#!/usr/bin/env python3
"""
YouTube Podcast Publisher
Uploads audio files to YouTube as audio-only podcasts with generated thumbnails.
"""

import os
import sys
import json
import argparse
from datetime import datetime
from pathlib import Path
import googleapiclient.discovery
import googleapiclient.errors
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.http import MediaFileUpload
from PIL import Image, ImageDraw, ImageFont
import uuid

# YouTube API scopes
SCOPES = ['https://www.googleapis.com/auth/youtube.upload']

class YouTubePodcastPublisher:
    def __init__(self, credentials_file="youtube_credentials.json", token_file="youtube_token.json"):
        """Initialize the YouTube publisher."""
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
                creds.refresh(Request())
            else:
                if not os.path.exists(self.credentials_file):
                    print(f"❌ Error: Credentials file '{self.credentials_file}' not found!")
                    print("Please download your OAuth 2.0 credentials from Google Cloud Console:")
                    print("1. Go to https://console.cloud.google.com/")
                    print("2. Enable YouTube Data API v3")
                    print("3. Create OAuth 2.0 credentials")
                    print("4. Download and save as 'youtube_credentials.json'")
                    sys.exit(1)
                
                try:
                    # Try as installed app first (desktop application)
                    flow = InstalledAppFlow.from_client_secrets_file(self.credentials_file, SCOPES)
                    creds = flow.run_local_server(port=0)
                except Exception as e:
                    print(f"⚠️ Failed to authenticate as desktop app: {e}")
                    print("🔄 Trying web application flow...")
                    
                    # Read credentials file to check type
                    with open(self.credentials_file, 'r') as f:
                        cred_data = json.load(f)
                    
                    if 'web' in cred_data:
                        # Convert web credentials to installed format
                        installed_creds = {
                            "installed": {
                                "client_id": cred_data['web']['client_id'],
                                "client_secret": cred_data['web']['client_secret'],
                                "auth_uri": cred_data['web']['auth_uri'],
                                "token_uri": cred_data['web']['token_uri'],
                                "auth_provider_x509_cert_url": cred_data['web'].get('auth_provider_x509_cert_url'),
                                "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
                            }
                        }
                        
                        # Save temporary converted file
                        temp_creds_file = "temp_youtube_credentials.json"
                        with open(temp_creds_file, 'w') as f:
                            json.dump(installed_creds, f)
                        
                        try:
                            flow = InstalledAppFlow.from_client_secrets_file(temp_creds_file, SCOPES)
                            creds = flow.run_local_server(port=8080)
                            os.remove(temp_creds_file)  # Clean up
                        except Exception as e2:
                            if os.path.exists(temp_creds_file):
                                os.remove(temp_creds_file)
                            raise e2
                    else:
                        raise e
            
            # Save credentials for next run
            with open(self.token_file, 'w') as token:
                token.write(creds.to_json())
        
        # Build YouTube service
        self.youtube = googleapiclient.discovery.build('youtube', 'v3', credentials=creds)
        print("✅ Successfully authenticated with YouTube API")
    
    def create_audio_thumbnail(self, title, duration=None, output_path="thumbnail.png"):
        """Create a simple thumbnail for audio-only content."""
        try:
            # Create image
            width, height = 1280, 720
            img = Image.new('RGB', (width, height), color='#1a1a1a')
            draw = ImageDraw.Draw(img)
            
            # Try to use a nice font, fallback to default
            try:
                font_large = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 60)
                font_small = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 30)
            except:
                font_large = ImageFont.load_default()
                font_small = ImageFont.load_default()
            
            # Draw podcast icon (simple circle with play symbol)
            center_x, center_y = width // 2, height // 3
            circle_radius = 80
            draw.ellipse([center_x - circle_radius, center_y - circle_radius,
                         center_x + circle_radius, center_y + circle_radius],
                        fill='#ff6b6b', outline='#ffffff', width=3)
            
            # Draw play triangle
            triangle_size = 30
            triangle_points = [
                (center_x - triangle_size//2, center_y - triangle_size//2),
                (center_x - triangle_size//2, center_y + triangle_size//2),
                (center_x + triangle_size//2, center_y)
            ]
            draw.polygon(triangle_points, fill='#ffffff')
            
            # Draw title (wrap text if too long)
            max_chars_per_line = 25
            if len(title) > max_chars_per_line:
                words = title.split()
                lines = []
                current_line = ""
                for word in words:
                    if len(current_line + " " + word) <= max_chars_per_line:
                        current_line += " " + word if current_line else word
                    else:
                        if current_line:
                            lines.append(current_line)
                        current_line = word
                if current_line:
                    lines.append(current_line)
                title_text = "\n".join(lines[:3])  # Max 3 lines
            else:
                title_text = title
            
            # Calculate text position
            text_y = center_y + circle_radius + 50
            for i, line in enumerate(title_text.split('\n')):
                bbox = draw.textbbox((0, 0), line, font=font_large)
                text_width = bbox[2] - bbox[0]
                text_x = (width - text_width) // 2
                draw.text((text_x, text_y + i * 70), line, fill='#ffffff', font=font_large)
            
            # Add "PODCAST" label
            podcast_text = "🎧 PODCAST"
            bbox = draw.textbbox((0, 0), podcast_text, font=font_small)
            text_width = bbox[2] - bbox[0]
            text_x = (width - text_width) // 2
            draw.text((text_x, height - 100), podcast_text, fill='#cccccc', font=font_small)
            
            # Save thumbnail
            img.save(output_path, 'PNG')
            print(f"✅ Created thumbnail: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"⚠️ Warning: Could not create thumbnail: {e}")
            return None
    
    def upload_podcast(self, audio_file, title, description="", tags=None, privacy="private", 
                      category_id="22", thumbnail=None):
        """Upload audio file to YouTube as a podcast."""
        try:
            if not os.path.exists(audio_file):
                print(f"❌ Error: Audio file '{audio_file}' not found!")
                return None
            
            # Generate thumbnail if not provided
            if not thumbnail:
                thumbnail_path = f"thumbnail_{uuid.uuid4().hex[:8]}.png"
                thumbnail = self.create_audio_thumbnail(title, output_path=thumbnail_path)
            
            # Prepare upload metadata
            tags = tags or ["podcast", "audio", "talk"]
            body = {
                'snippet': {
                    'title': title,
                    'description': description + "\n\n🎧 This is an audio-only podcast episode.",
                    'tags': tags,
                    'categoryId': category_id  # Education category
                },
                'status': {
                    'privacyStatus': privacy,
                    'selfDeclaredMadeForKids': False
                }
            }
            
            print(f"📤 Uploading '{title}' to YouTube...")
            print(f"📁 File: {audio_file}")
            print(f"🔒 Privacy: {privacy}")
            
            # Upload video
            media = MediaFileUpload(audio_file, chunksize=-1, resumable=True)
            insert_request = self.youtube.videos().insert(
                part=",".join(body.keys()),
                body=body,
                media_body=media
            )
            
            video_id = self._resumable_upload(insert_request)
            
            if video_id:
                # Upload thumbnail if available
                if thumbnail and os.path.exists(thumbnail):
                    try:
                        self.youtube.thumbnails().set(
                            videoId=video_id,
                            media_body=MediaFileUpload(thumbnail)
                        ).execute()
                        print(f"✅ Thumbnail uploaded")
                        
                        # Clean up generated thumbnail
                        if thumbnail.startswith("thumbnail_"):
                            os.remove(thumbnail)
                            
                    except Exception as e:
                        print(f"⚠️ Warning: Could not upload thumbnail: {e}")
                
                video_url = f"https://www.youtube.com/watch?v={video_id}"
                print(f"✅ Successfully uploaded!")
                print(f"🔗 Video URL: {video_url}")
                print(f"🆔 Video ID: {video_id}")
                
                # Save upload info
                upload_info = {
                    "video_id": video_id,
                    "video_url": video_url,
                    "title": title,
                    "upload_time": datetime.now().isoformat(),
                    "audio_file": audio_file,
                    "privacy": privacy
                }
                
                info_file = f"upload_info_{video_id}.json"
                with open(info_file, 'w') as f:
                    json.dump(upload_info, f, indent=2)
                print(f"📄 Upload info saved to: {info_file}")
                
                return video_id
            
        except googleapiclient.errors.HttpError as e:
            print(f"❌ YouTube API Error: {e}")
            return None
        except Exception as e:
            print(f"❌ Upload Error: {e}")
            return None
    
    def _resumable_upload(self, insert_request):
        """Execute resumable upload."""
        response = None
        error = None
        retry = 0
        
        while response is None:
            try:
                print(f"📊 Uploading... (attempt {retry + 1})")
                status, response = insert_request.next_chunk()
                if response is not None:
                    if 'id' in response:
                        return response['id']
                    else:
                        raise Exception(f"Upload failed: {response}")
            except googleapiclient.errors.HttpError as e:
                if e.resp.status in [500, 502, 503, 504]:
                    error = f"Server error: {e}"
                    retry += 1
                    if retry > 3:
                        raise Exception(f"Upload failed after 3 retries: {error}")
                else:
                    raise e
            except Exception as e:
                error = f"Unexpected error: {e}"
                break
        
        if error:
            raise Exception(error)

def main():
    parser = argparse.ArgumentParser(description='Upload audio podcast to YouTube')
    parser.add_argument('audio_file', help='Path to audio file')
    parser.add_argument('--title', required=True, help='Video title')
    parser.add_argument('--description', default='', help='Video description')
    parser.add_argument('--tags', nargs='+', default=['podcast', 'audio'], help='Video tags')
    parser.add_argument('--privacy', choices=['private', 'unlisted', 'public'], 
                       default='private', help='Privacy setting')
    parser.add_argument('--thumbnail', help='Custom thumbnail image path')
    parser.add_argument('--credentials', default='youtube_credentials.json', 
                       help='OAuth credentials file')
    
    args = parser.parse_args()
    
    # Initialize publisher
    publisher = YouTubePodcastPublisher(credentials_file=args.credentials)
    
    # Upload podcast
    video_id = publisher.upload_podcast(
        audio_file=args.audio_file,
        title=args.title,
        description=args.description,
        tags=args.tags,
        privacy=args.privacy,
        thumbnail=args.thumbnail
    )
    
    if video_id:
        print(f"\n🎉 Podcast successfully published!")
        print(f"🔗 Watch at: https://www.youtube.com/watch?v={video_id}")
    else:
        print("\n❌ Failed to upload podcast")
        sys.exit(1)

if __name__ == "__main__":
    main()