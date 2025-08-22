# YouTube Authentication Setup Guide

## Step 1: Download Credentials File

1. In Google Cloud Console (the page you showed in the screenshot)
2. Click the **Download** button (📥) next to your "Youtube Desktop" OAuth client
3. Save the downloaded file as `youtube_credentials.json` in your project root
4. The file should contain both client_id and client_secret

## Step 2: Extract Client Secret

From the downloaded JSON file, copy the `client_secret` value and update your `.env.local`:

```bash
# In .env.local
YOUTUBE_CLIENT_ID=952449410589-b691our9p6aogg1jf64nft8iv5olcgko.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=paste_your_client_secret_here
```

## Step 3: Test Authentication

Run this command to test the YouTube integration:

```bash
node youtube-podcast-integration.js auth
```

This will:
1. Open a browser to Google's OAuth page
2. Ask you to sign in and grant permissions
3. Give you a code to paste back
4. Save the authentication token for future use

## Step 4: Integrate with Podcast System

Once authenticated, your podcast system will automatically upload to YouTube when new episodes are detected.

## Troubleshooting

### If you get "redirect_uri_mismatch" error:
1. Go to Google Cloud Console
2. Edit your OAuth client
3. Add these redirect URIs:
   - `http://localhost`
   - `urn:ietf:wg:oauth:2.0:oob`

### If you get "access_denied" error:
1. Make sure YouTube Data API v3 is enabled
2. Check that your Google account has YouTube channel access
3. Try creating a test YouTube channel if needed

## File Structure After Setup

Your project should have:
```
studio/
├── youtube_credentials.json     # Downloaded from Google Cloud
├── youtube_token.json          # Created after first auth
├── .env.local                  # Updated with client ID & secret
└── youtube-podcast-integration.js
```

## Testing the Complete Flow

```bash
# 1. Authenticate
node youtube-podcast-integration.js auth

# 2. Test upload
node youtube-podcast-integration.js test

# 3. Start podcast automation with YouTube enabled
node podcast-automation.js start
```