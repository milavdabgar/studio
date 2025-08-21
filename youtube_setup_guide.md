# YouTube Podcast Publisher Setup Guide

## 🚀 Quick Start

This guide will help you set up YouTube API credentials and publish your audio podcast to YouTube.

## 📋 Prerequisites

1. Google account
2. YouTube channel
3. Python environment (already set up in `.venv`)

## 🔧 Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **YouTube Data API v3**:
   - Go to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure OAuth consent screen (if not done):
   - User Type: External (for testing)
   - Add your email to test users
4. Application type: "Desktop application"
5. Download the JSON file
6. Rename it to `youtube_credentials.json` and place in this directory

### 3. Upload Your Podcast

```bash
# Activate the virtual environment
source .venv/bin/activate

# Basic upload (private by default)
python youtube_podcast_publisher.py "ai_voiceover_system/podcasts/MLP_Week_1.m4a" \
  --title "MLP Week 1 - Machine Learning Podcast" \
  --description "First episode of our Machine Learning Podcast series" \
  --tags "machine learning" "podcast" "education" "AI"

# Upload as unlisted (shareable link)
python youtube_podcast_publisher.py "ai_voiceover_system/podcasts/MLP_Week_1.m4a" \
  --title "MLP Week 1 - Machine Learning Podcast" \
  --description "First episode of our Machine Learning Podcast series" \
  --privacy unlisted \
  --tags "machine learning" "podcast" "education" "AI"

# Upload as public
python youtube_podcast_publisher.py "ai_voiceover_system/podcasts/MLP_Week_1.m4a" \
  --title "MLP Week 1 - Machine Learning Podcast" \
  --description "First episode of our Machine Learning Podcast series" \
  --privacy public \
  --tags "machine learning" "podcast" "education" "AI"
```

## 🎨 Features

- **Auto-generated thumbnails**: Creates professional podcast thumbnails
- **Resumable uploads**: Handles large files and network interruptions
- **Privacy controls**: Upload as private, unlisted, or public
- **Metadata rich**: Adds proper titles, descriptions, and tags
- **Upload tracking**: Saves upload information for reference

## 🔒 Privacy Settings

- **Private**: Only you can see the video
- **Unlisted**: Anyone with the link can view (good for sharing)
- **Public**: Visible to everyone and searchable

## 📄 Output Files

After upload, you'll get:
- Upload confirmation with video URL
- `upload_info_[VIDEO_ID].json` - Contains all upload details
- Auto-generated thumbnail (temporarily created, then cleaned up)

## 🎯 Next Steps

1. Save your `youtube_credentials.json` file in this directory
2. Run the upload command with your desired settings
3. The first time you run it, you'll need to authorize the app in your browser
4. Future uploads will use the saved authentication token

## ⚠️ Important Notes

- **First run**: You'll be redirected to Google for authorization
- **Token storage**: Authentication is saved in `youtube_token.json`
- **API Quotas**: YouTube has daily upload quotas (usually sufficient for podcasts)
- **File formats**: Supports common audio formats (M4A, MP3, WAV, etc.)

## 🆘 Troubleshooting

- **Credentials error**: Make sure `youtube_credentials.json` is in the correct location
- **Upload fails**: Check your internet connection and try again (resumable uploads)
- **Quota exceeded**: Wait 24 hours for quota reset or request quota increase
- **Permission denied**: Ensure your Google account has access to the YouTube channel