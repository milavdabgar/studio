# Fix OAuth Consent Screen for YouTube Upload

## 🚫 Problem
Your app "nblm" hasn't completed Google verification and can only be accessed by approved test users.

## ✅ Solution: Add Yourself as Test User

### Steps:
1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials/consent
2. **Click "OAuth consent screen"** in the left sidebar
3. **Scroll down to "Test users" section**
4. **Click "ADD USERS"**
5. **Add your email**: `milav.dabgar@gmail.com`
6. **Click "Save"**

### Alternative Solutions:

#### Option 1: Change User Type (if you have Google Workspace)
- In OAuth consent screen, change from "External" to "Internal"
- Internal apps don't need verification for users in your organization

#### Option 2: Publish App (requires verification)
- Click "PUBLISH APP" in OAuth consent screen
- This requires Google's verification process (takes weeks)
- Only needed for public apps

#### Option 3: Use Different Scopes
- YouTube upload scope requires verification
- Consider using less sensitive scopes if possible

## 🎯 Recommended Approach
**Add yourself as a test user** - this is the quickest solution for personal use.

### After Adding Test User:
```bash
source .venv/bin/activate
python simple_youtube_uploader.py "ai_voiceover_system/podcasts/MLP_Week_1.m4a" \
  --title "MLP Week 1 - Machine Learning Fundamentals" \
  --privacy unlisted
```

The authentication should work immediately after adding yourself as a test user!