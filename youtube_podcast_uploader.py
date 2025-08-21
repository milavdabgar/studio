#!/usr/bin/env python3
"""
YouTube Podcast Uploader
Upload audio files as proper podcast episodes using YouTube's podcast feature.
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
from PIL import Image, ImageDraw, ImageFont
import uuid

# YouTube API scopes - need broader scope for podcast features
SCOPES = ['https://www.googleapis.com/auth/youtube']

class YouTubePodcastUploader:
    def __init__(self, credentials_file="youtube_credentials.json", token_file="youtube_token.json"):
        """Initialize the YouTube podcast uploader."""
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
    
    def create_podcast_thumbnail(self, title, output_path="podcast_thumbnail.png"):
        """Create a professional podcast thumbnail in Full HD 1080p."""
        try:
            # Create image in Full HD 1080p resolution
            width, height = 1920, 1080
            img = Image.new('RGB', (width, height), color='#1a1a1a')
            draw = ImageDraw.Draw(img)
            
            # Try to use a nice font - scaled up for 1080p
            try:
                font_large = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 90)
                font_medium = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 60)
                font_small = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 45)
            except:
                font_large = ImageFont.load_default()
                font_medium = ImageFont.load_default()
                font_small = ImageFont.load_default()
            
            # Draw podcast icon (microphone-style)
            center_x, center_y = width // 2, height // 3
            
            # Microphone body - scaled up for 1080p
            mic_width, mic_height = 90, 150
            draw.rectangle([
                center_x - mic_width//2, center_y - mic_height//2,
                center_x + mic_width//2, center_y + mic_height//2
            ], fill='#ff6b6b', outline='#ffffff', width=5)
            
            # Microphone stand - scaled up
            draw.rectangle([
                center_x - 5, center_y + mic_height//2,
                center_x + 5, center_y + mic_height//2 + 45
            ], fill='#ffffff')
            
            # Base - scaled up
            draw.rectangle([
                center_x - 30, center_y + mic_height//2 + 45,
                center_x + 30, center_y + mic_height//2 + 52
            ], fill='#ffffff')
            
            # Sound waves - scaled up
            for i, radius in enumerate([120, 150, 180]):
                draw.arc([
                    center_x - radius, center_y - radius,
                    center_x + radius, center_y + radius
                ], start=45, end=135, fill='#ffffff', width=3)
            
            # Draw title
            if font_large:
                max_chars_per_line = 20
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
                    title_text = "\n".join(lines[:2])  # Max 2 lines
                else:
                    title_text = title
                
                # Position title below microphone - adjusted for 1080p
                text_y = center_y + 150
                for i, line in enumerate(title_text.split('\n')):
                    try:
                        bbox = draw.textbbox((0, 0), line, font=font_large)
                        text_width = bbox[2] - bbox[0]
                        text_x = (width - text_width) // 2
                        draw.text((text_x, text_y + i * 90), line, fill='#ffffff', font=font_large)
                    except:
                        text_x = width // 4
                        draw.text((text_x, text_y + i * 90), line, fill='#ffffff', font=font_large)
            
            # Add "PODCAST" label
            if font_small:
                podcast_text = "🎧 PODCAST EPISODE"
                try:
                    bbox = draw.textbbox((0, 0), podcast_text, font=font_small)
                    text_width = bbox[2] - bbox[0]
                    text_x = (width - text_width) // 2
                    draw.text((text_x, height - 120), podcast_text, fill='#cccccc', font=font_small)
                except:
                    draw.text((width // 2 - 120, height - 120), podcast_text, fill='#cccccc', font=font_small)
            
            # Save thumbnail
            img.save(output_path, 'PNG')
            print(f"✅ Created podcast thumbnail: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"⚠️ Warning: Could not create thumbnail: {e}")
            return None
    
    def create_or_get_podcast_series(self, series_title, series_description=""):
        """Create a new podcast series or get existing one."""
        try:
            # First, check if we have any existing playlists that could be podcast series
            request = self.youtube.playlists().list(
                part="snippet",
                mine=True,
                maxResults=50
            )
            response = request.execute()
            
            # Look for existing podcast series
            for playlist in response.get('items', []):
                if 'podcast' in playlist['snippet']['title'].lower() or series_title.lower() in playlist['snippet']['title'].lower():
                    print(f"📺 Found existing podcast series: {playlist['snippet']['title']}")
                    return playlist['id']
            
            # Create new playlist as podcast series
            request = self.youtube.playlists().insert(
                part="snippet,status",
                body={
                    "snippet": {
                        "title": series_title,
                        "description": series_description + "\n\n🎧 This is a podcast series.",
                        "defaultLanguage": "en"
                    },
                    "status": {
                        "privacyStatus": "public"
                    }
                }
            )
            response = request.execute()
            
            playlist_id = response['id']
            print(f"✅ Created new podcast series: {series_title} (ID: {playlist_id})")
            return playlist_id
            
        except googleapiclient.errors.HttpError as e:
            print(f"⚠️ Warning: Could not create podcast series: {e}")
            return None
    
    def upload_podcast_episode(self, audio_file, title, description="", tags=None, 
                             privacy="unlisted", series_title=None, episode_number=None):
        """Upload audio as a podcast episode."""
        try:
            if not os.path.exists(audio_file):
                print(f"❌ Error: Audio file '{audio_file}' not found!")
                return None
            
            # Create thumbnail
            thumbnail_path = f"podcast_thumb_{uuid.uuid4().hex[:8]}.png"
            thumbnail = self.create_podcast_thumbnail(title, output_path=thumbnail_path)
            
            # Enhance description for podcast
            podcast_description = description
            if episode_number:
                podcast_description = f"Episode {episode_number}\n\n{description}"
            
            podcast_description += "\n\n🎧 This is an audio podcast episode."
            
            # Add episode markers
            if ":" in title and any(word in title.lower() for word in ['week', 'episode', 'part']):
                podcast_description += f"\n\n📚 Part of the {series_title or 'podcast'} series."
            
            # Prepare upload metadata with podcast-specific settings
            tags = tags or ["podcast", "audio", "education", "talk"]
            if not "podcast" in tags:
                tags.append("podcast")
            
            # Use Education category for podcasts
            body = {
                'snippet': {
                    'title': title,
                    'description': podcast_description,
                    'tags': tags,
                    'categoryId': "27",  # Education category - better for podcasts
                    'defaultAudioLanguage': 'en'
                },
                'status': {
                    'privacyStatus': privacy,
                    'selfDeclaredMadeForKids': False,
                    'embeddable': True,
                    'publicStatsViewable': True
                }
            }
            
            print(f"🎙️ Uploading podcast episode: '{title}'")
            print(f"📁 File: {audio_file}")
            print(f"🔒 Privacy: {privacy}")
            
            # Check if input is already a video file
            video_extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm']
            audio_extensions = ['.mp3', '.m4a', '.wav', '.aac', '.ogg', '.flac']
            
            file_ext = os.path.splitext(audio_file)[1].lower()
            
            if file_ext in video_extensions:
                # Input is already a video, use it directly
                print(f"🎥 Using existing video file: {audio_file}")
                temp_video = audio_file
                
            elif file_ext in audio_extensions:
                # Need to create video from audio
                from moviepy.editor import AudioFileClip, ImageClip
                
                temp_video = f"temp_podcast_{uuid.uuid4().hex[:8]}.mp4"
                
                try:
                    # Load audio
                    audio = AudioFileClip(audio_file)
                    duration = audio.duration
                    
                    # Create Full HD 1080p video with thumbnail
                    if thumbnail and os.path.exists(thumbnail):
                        image_clip = ImageClip(thumbnail, duration=duration)
                    else:
                        from moviepy.editor import ColorClip
                        image_clip = ColorClip(size=(1920, 1080), color=(26, 26, 26), duration=duration)
                    
                    video = image_clip.set_audio(audio)
                    
                    print(f"🎬 Creating Full HD 1080p podcast video (duration: {duration:.1f}s)...")
                    video.write_videofile(
                        temp_video,
                        fps=1,  # Very low FPS for audio content - saves space
                        codec='libx264',
                        audio_codec='aac',
                        # High quality settings for 1080p and lossless audio
                        bitrate='8000k',  # High bitrate for 1080p
                        audio_bitrate='320k',  # Maximum audio quality
                        preset='slow',  # Better compression
                        ffmpeg_params=[
                            '-crf', '18',  # Very high video quality
                            '-pix_fmt', 'yuv420p',  # YouTube compatibility
                            '-profile:v', 'high',  # H.264 high profile
                            '-level', '4.0',  # H.264 level for 1080p
                            '-movflags', '+faststart',  # Web optimization
                        ],
                        verbose=False,
                        logger=None
                    )
                    
                    video.close()
                    audio.close()
                    
                except Exception as e:
                    print(f"❌ Error creating video from audio: {e}")
                    return None
            
            else:
                print(f"❌ Unsupported file format: {file_ext}")
                return None
            
            # Upload the video
            media = MediaFileUpload(temp_video, chunksize=-1, resumable=True)
            insert_request = self.youtube.videos().insert(
                part=",".join(body.keys()),
                body=body,
                media_body=media
            )
            
            video_id = self._resumable_upload(insert_request)
            
            if video_id:
                # Upload custom thumbnail
                if thumbnail and os.path.exists(thumbnail):
                    try:
                        self.youtube.thumbnails().set(
                            videoId=video_id,
                            media_body=MediaFileUpload(thumbnail)
                        ).execute()
                        print(f"✅ Podcast thumbnail uploaded")
                    except Exception as e:
                        print(f"⚠️ Warning: Could not upload thumbnail: {e}")
                
                # Add to podcast series playlist if specified
                if series_title:
                    playlist_id = self.create_or_get_podcast_series(series_title)
                    if playlist_id:
                        try:
                            self.youtube.playlistItems().insert(
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
                            ).execute()
                            print(f"✅ Added to podcast series: {series_title}")
                        except Exception as e:
                            print(f"⚠️ Warning: Could not add to series: {e}")
                
                video_url = f"https://www.youtube.com/watch?v={video_id}"
                print(f"✅ Podcast episode uploaded successfully!")
                print(f"🔗 Episode URL: {video_url}")
                print(f"🆔 Video ID: {video_id}")
                
                # Clean up temporary files (but not original video)
                try:
                    if temp_video != audio_file and os.path.exists(temp_video):
                        os.remove(temp_video)
                    if thumbnail and os.path.exists(thumbnail):
                        os.remove(thumbnail)
                except:
                    pass
                
                # Save episode info
                episode_info = {
                    "video_id": video_id,
                    "video_url": video_url,
                    "title": title,
                    "episode_number": episode_number,
                    "series_title": series_title,
                    "upload_time": datetime.now().isoformat(),
                    "audio_file": audio_file,
                    "privacy": privacy,
                    "is_podcast": True
                }
                
                info_file = f"podcast_episode_{video_id}.json"
                with open(info_file, 'w') as f:
                    json.dump(episode_info, f, indent=2)
                print(f"📄 Episode info saved to: {info_file}")
                
                return video_id
            
        except Exception as e:
            print(f"❌ Upload Error: {e}")
            return None
    
    def _resumable_upload(self, insert_request):
        """Execute resumable upload with progress."""
        response = None
        error = None
        retry = 0
        
        while response is None:
            try:
                print(f"📤 Uploading podcast... (attempt {retry + 1})")
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
    parser = argparse.ArgumentParser(description='Upload audio as YouTube podcast episode')
    parser.add_argument('audio_file', help='Path to audio file')
    parser.add_argument('--title', required=True, help='Episode title')
    parser.add_argument('--description', default='', help='Episode description')
    parser.add_argument('--tags', nargs='+', default=['podcast', 'audio'], help='Episode tags')
    parser.add_argument('--privacy', choices=['private', 'unlisted', 'public'], 
                       default='unlisted', help='Privacy setting')
    parser.add_argument('--series', help='Podcast series name')
    parser.add_argument('--episode', type=int, help='Episode number')
    parser.add_argument('--credentials', default='youtube_credentials.json', 
                       help='OAuth credentials file')
    
    args = parser.parse_args()
    
    # Initialize uploader
    uploader = YouTubePodcastUploader(credentials_file=args.credentials)
    
    # Upload podcast episode
    video_id = uploader.upload_podcast_episode(
        audio_file=args.audio_file,
        title=args.title,
        description=args.description,
        tags=args.tags,
        privacy=args.privacy,
        series_title=args.series,
        episode_number=args.episode
    )
    
    if video_id:
        print(f"\n🎉 Podcast episode successfully published!")
        print(f"🔗 Listen at: https://www.youtube.com/watch?v={video_id}")
    else:
        print("\n❌ Failed to upload podcast episode")
        sys.exit(1)

if __name__ == "__main__":
    main()