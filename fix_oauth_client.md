# Fix OAuth Client Type

## 🔧 Create Desktop Application OAuth Client

Your current OAuth client is configured as "Web application" but we need "Desktop application" for command-line tools.

### Steps to Fix:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. **Click "Create Credentials" > "OAuth 2.0 Client IDs"**
3. **Choose Application Type**: **"Desktop application"** (NOT Web application)
4. **Name**: "YouTube Podcast Uploader Desktop"
5. **Click "Create"**
6. **Download the JSON file**
7. **Save it as `youtube_credentials.json`**

### Why This Matters:
- **Web applications**: Need specific redirect URIs and run on servers
- **Desktop applications**: Can use `urn:ietf:wg:oauth:2.0:oob` for command-line tools
- **Mobile applications**: For mobile apps
- **TV applications**: For smart TV apps

### Alternative Quick Fix:
You can also convert your existing web client, but creating a new desktop client is cleaner.

### After Creating Desktop Client:
```bash
# Replace the credentials file and try again
source .venv/bin/activate
python simple_youtube_uploader.py "ai_voiceover_system/podcasts/MLP_Week_1.m4a" \
  --title "MLP Week 1 - Machine Learning Fundamentals" \
  --privacy unlisted
```

The desktop application client will work perfectly with our command-line uploader!