#!/usr/bin/env python3
"""
Simple YouTube Podcast Publisher
Handles both web and installed app credentials with manual authentication fallback.
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
from google_auth_oauthlib.flow import Flow
from googleapiclient.http import MediaFileUpload
from PIL import Image, ImageDraw, ImageFont
import uuid
import webbrowser

# YouTube API scopes
SCOPES = ['https://www.googleapis.com/auth/youtube.upload']

class SimpleYouTubeUploader:
    def __init__(self, credentials_file="youtube_credentials.json", token_file="youtube_token.json"):
        """Initialize the YouTube uploader with flexible authentication."""
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.youtube = None
        self._authenticate()
    
    def _authenticate(self):
        """Authenticate with YouTube API using manual flow for web credentials."""
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
                
                # Read credentials to determine type
                with open(self.credentials_file, 'r') as f:
                    cred_data = json.load(f)
                
                if 'web' in cred_data:
                    print("🔐 Using web application credentials...")
                    creds = self._manual_web_auth(cred_data['web'])
                elif 'installed' in cred_data:
                    print("🔐 Using installed application credentials...")
                    try:
                        from google_auth_oauthlib.flow import InstalledAppFlow
                        flow = InstalledAppFlow.from_client_secrets_file(self.credentials_file, SCOPES)
                        creds = flow.run_local_server(port=0)
                    except Exception as e:
                        print(f"❌ Authentication failed: {e}")
                        sys.exit(1)
                else:
                    print("❌ Invalid credentials format")
                    sys.exit(1)
            
            # Save credentials for next run
            with open(self.token_file, 'w') as token:
                token.write(creds.to_json())
        
        # Build YouTube service
        self.youtube = googleapiclient.discovery.build('youtube', 'v3', credentials=creds)
        print("✅ Successfully authenticated with YouTube API")
    
    def _manual_web_auth(self, web_config):
        """Manual authentication flow for web applications."""
        # Create flow
        flow = Flow.from_client_config({
            "web": web_config
        }, SCOPES)
        
        # Set redirect URI to out-of-band
        flow.redirect_uri = 'urn:ietf:wg:oauth:2.0:oob'
        
        # Get authorization URL
        auth_url, _ = flow.authorization_url(prompt='consent')
        
        print("\n🔗 Manual Authentication Required")
        print("="*50)
        print("1. Open this URL in your browser:")
        print(f"   {auth_url}")
        print("\n2. Complete the authorization process")
        print("3. Copy the authorization code from the browser")
        print("="*50)
        
        # Try to open browser automatically
        try:
            webbrowser.open(auth_url)
            print("✅ Browser opened automatically")
        except:
            print("⚠️ Could not open browser automatically")
        
        # Get code from user
        auth_code = input("\n📝 Enter the authorization code: ").strip()
        
        if not auth_code:
            print("❌ No authorization code provided")
            sys.exit(1)
        
        # Exchange code for token
        try:
            flow.fetch_token(code=auth_code)
            return flow.credentials
        except Exception as e:
            print(f"❌ Failed to exchange code for token: {e}")
            sys.exit(1)
    
    def create_audio_thumbnail(self, title, output_path="thumbnail.png"):
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
                try:
                    font_large = ImageFont.load_default()
                    font_small = ImageFont.load_default()
                except:
                    # If even default font fails, skip text
                    font_large = None
                    font_small = None
            
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
            
            # Draw title if fonts are available
            if font_large:
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
                    try:
                        bbox = draw.textbbox((0, 0), line, font=font_large)
                        text_width = bbox[2] - bbox[0]
                        text_x = (width - text_width) // 2
                        draw.text((text_x, text_y + i * 70), line, fill='#ffffff', font=font_large)
                    except:
                        # Fallback without textbbox
                        text_x = width // 4
                        draw.text((text_x, text_y + i * 70), line, fill='#ffffff', font=font_large)
                
                # Add "PODCAST" label
                if font_small:
                    podcast_text = "🎧 PODCAST"
                    try:
                        bbox = draw.textbbox((0, 0), podcast_text, font=font_small)
                        text_width = bbox[2] - bbox[0]
                        text_x = (width - text_width) // 2
                        draw.text((text_x, height - 100), podcast_text, fill='#cccccc', font=font_small)
                    except:
                        draw.text((width // 2 - 50, height - 100), podcast_text, fill='#cccccc', font=font_small)
            
            # Save thumbnail
            img.save(output_path, 'PNG')
            print(f"✅ Created thumbnail: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"⚠️ Warning: Could not create thumbnail: {e}")
            return None
    
    def upload_podcast(self, audio_file, title, description="", tags=None, privacy="private"):
        """Upload audio file to YouTube as a podcast."""
        try:
            if not os.path.exists(audio_file):
                print(f"❌ Error: Audio file '{audio_file}' not found!")
                return None
            
            # Generate thumbnail
            thumbnail_path = f"thumbnail_{uuid.uuid4().hex[:8]}.png"
            thumbnail = self.create_audio_thumbnail(title, output_path=thumbnail_path)
            
            # Prepare upload metadata
            tags = tags or ["podcast", "audio", "talk"]
            body = {
                'snippet': {
                    'title': title,
                    'description': description + "\n\n🎧 This is an audio-only podcast episode.",
                    'tags': tags,
                    'categoryId': "22"  # Education category
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
                    except Exception as e:
                        print(f"⚠️ Warning: Could not upload thumbnail: {e}")
                    finally:
                        # Clean up thumbnail
                        try:
                            os.remove(thumbnail)
                        except:
                            pass
                
                video_url = f"https://www.youtube.com/watch?v={video_id}"
                print(f"✅ Successfully uploaded!")
                print(f"🔗 Video URL: {video_url}")
                print(f"🆔 Video ID: {video_id}")
                
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
    parser.add_argument('--credentials', default='youtube_credentials.json', 
                       help='OAuth credentials file')
    
    args = parser.parse_args()
    
    # Initialize uploader
    uploader = SimpleYouTubeUploader(credentials_file=args.credentials)
    
    # Upload podcast
    video_id = uploader.upload_podcast(
        audio_file=args.audio_file,
        title=args.title,
        description=args.description,
        tags=args.tags,
        privacy=args.privacy
    )
    
    if video_id:
        print(f"\n🎉 Podcast successfully published!")
        print(f"🔗 Watch at: https://www.youtube.com/watch?v={video_id}")
    else:
        print("\n❌ Failed to upload podcast")
        sys.exit(1)

if __name__ == "__main__":
    main()