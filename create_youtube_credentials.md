# Create Your Own YouTube API Credentials

## 🔧 Step-by-Step Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project"
3. Name it something like "YouTube Podcast Publisher"
4. Click "Create"

### 2. Enable YouTube Data API
1. In your new project, go to "APIs & Services" > "Library"
2. Search for "YouTube Data API v3"
3. Click on it and press "Enable"

### 3. Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required fields:
   - App name: "YouTube Podcast Publisher"
   - User support email: Your email
   - Developer contact: Your email
4. Add your email address to "Test users" section
5. Save and continue through all steps

### 4. Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Application type: "Desktop application"
4. Name: "YouTube Podcast Uploader"
5. Click "Create"
6. Download the JSON file
7. Save it as `youtube_credentials.json` in your project directory

### 5. Upload Your Podcast
```bash
source .venv/bin/activate

python youtube_podcast_publisher.py "ai_voiceover_system/podcasts/MLP_Week_1.m4a" \
  --title "MLP Week 1 - Machine Learning Fundamentals" \
  --description "First episode covering ML fundamentals and core concepts." \
  --privacy unlisted \
  --tags "machine learning" "podcast" "education" "AI"
```

## 🔒 Why This Happens
- Google requires app verification for public OAuth apps
- Unverified apps can only be used by the developer and approved test users
- Creating your own project bypasses this limitation

## ✅ Benefits of Your Own Project
- Full control over API quotas
- No dependency on external projects
- Can publish immediately without verification delays
- Can add other users as needed

## 🎯 Next Steps
1. Create your own Google Cloud project following the steps above
2. Download your own credentials file
3. Replace the existing `youtube_credentials.json`
4. Run the upload command again

The whole process takes about 5-10 minutes!