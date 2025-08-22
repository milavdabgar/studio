# 🎧 Comprehensive Podcast Distribution System

A complete automated podcast distribution system that syncs with Google Drive and publishes to multiple podcast platforms.

## 🌟 Features

### ✅ Automated Workflow
- **Google Drive Integration**: Automatically detects new M4A files in your Google Drive folder
- **RSS Feed Generation**: Creates compliant RSS feeds for all podcast platforms
- **Multi-Domain Support**: Serves RSS feeds from all your domains (gppalanpur.ac.in, milav.in, gppalanpur.in)
- **Auto-Distribution**: Automatically uploads to YouTube and prepares for other platforms
- **Webhook Support**: Real-time notifications when new files are added to Google Drive

### ✅ Platform Support
- **YouTube**: Direct automated upload with custom thumbnails
- **Spotify for Podcasters**: RSS submission ready
- **Apple Podcasts**: iTunes-compatible RSS feed
- **Google Podcasts**: Optimized for Google's indexing
- **Amazon Music/Audible**: Amazon-compatible RSS feed

### ✅ Management Dashboard
- **Admin Interface**: Complete control panel at `/admin/podcasts`
- **Episode Management**: View, edit, and manage all episodes
- **Distribution Status**: Track submission status across platforms
- **Sync Monitoring**: Real-time sync status and logs
- **Configuration**: Easy podcast metadata management

## 🚀 Quick Setup

### 1. Environment Configuration

Copy the environment variables from `.env.example` and configure:

```bash
# Required for Google Drive sync
GOOGLE_DRIVE_API_KEY=your_google_drive_api_key
GOOGLE_DRIVE_FOLDER_ID=1q4WfSEztt3vxZex4qhIO8rd1VIjwopYZ

# Required for database
MONGODB_URI=mongodb://localhost:27017/podcast-distribution

# Required for RSS feeds
NEXT_PUBLIC_BASE_URL=https://gppalanpur.ac.in
```

### 2. Start the Automation System

```bash
# Install dependencies
npm install

# Start the automation system
node podcast-automation.js start
```

### 3. Access Your RSS Feeds

Your podcast RSS feeds are automatically available at:
- **Primary**: https://gppalanpur.ac.in/api/podcasts
- **Personal**: https://milav.in/api/podcasts  
- **Backup**: https://gppalanpur.in/api/podcasts

### 4. Manage via Admin Dashboard

Visit: https://gppalanpur.ac.in/admin/podcasts

## 📂 Google Drive Setup

### Folder Structure
```
Your Google Drive Folder/
├── MLP_Week_1.m4a
├── Lecture_01_Introduction.m4a
├── Episode_05_Advanced_Topics.m4a
└── Weekly_Discussion_12.m4a
```

### File Naming Convention
The system automatically generates episode titles from filenames:
- `MLP_Week_1.m4a` → "MLP Week 1"
- `Lecture_01_Introduction.m4a` → "Lecture 01 Introduction"
- `weekly_discussion.m4a` → "Weekly Discussion"

## 🎯 Platform Submission Guide

### Automatic Platforms
- **YouTube**: Fully automated upload with thumbnails

### Manual Submission Platforms

#### Spotify for Podcasters
1. Go to https://podcasters.spotify.com/
2. Sign in and click "Add your podcast"
3. Enter RSS URL: `https://gppalanpur.ac.in/api/podcasts`
4. Complete verification (3-5 days)

#### Apple Podcasts
1. Go to https://podcastsconnect.apple.com/
2. Click "+" to add new podcast
3. Enter RSS URL: `https://gppalanpur.ac.in/api/podcasts`
4. Submit for review (2-3 days)

#### Google Podcasts
1. Go to https://podcastsmanager.google.com/
2. Click "Add a podcast"
3. Enter RSS URL: `https://gppalanpur.ac.in/api/podcasts`
4. Verify ownership (24-48 hours)

#### Amazon Music/Audible
1. Go to https://creators.amazon.com/podcasts
2. Click "Submit your podcast"
3. Enter RSS URL: `https://gppalanpur.ac.in/api/podcasts`
4. Complete submission form (5-7 days)

## 🔄 Automation Commands

```bash
# Start continuous monitoring
node podcast-automation.js start

# Perform one-time sync
node podcast-automation.js sync

# Check system status
node podcast-automation.js status

# Stop automation
node podcast-automation.js stop
```

## 📊 API Endpoints

### RSS Feed
- `GET /api/podcasts` - RSS XML feed
- `GET /api/podcasts?format=json` - JSON feed

### Management
- `POST /api/podcasts/sync` - Trigger Google Drive sync
- `POST /api/podcasts/distribute` - Distribute to platforms
- `POST /api/podcasts/webhook` - Google Drive webhook endpoint

## 🛠️ Advanced Configuration

### Auto-Distribution Settings
```javascript
// In podcast-automation.js
const CONFIG = {
  automation: {
    checkInterval: 300000, // 5 minutes
    enableAutoUpload: true,
    enableNotifications: true
  },
  platforms: {
    youtube: { enabled: true, requiresManual: false },
    spotify: { enabled: true, requiresManual: true },
    // ... other platforms
  }
}
```

### Webhook Configuration
Set up Google Drive webhook for real-time updates:
```bash
curl -X POST /api/podcasts/sync -d '{"action": "setup-webhook"}'
```

## 📱 Monitoring & Notifications

### Admin Dashboard Features
- **Real-time Sync Status**: See last sync time and results
- **Episode List**: Manage all episodes and metadata
- **Distribution Tracking**: Monitor platform submission status
- **Configuration**: Update podcast metadata and settings

### Automated Notifications
- New episode alerts
- Sync status updates
- Distribution confirmations
- Error notifications

## 🔒 Security Features

- **Webhook Verification**: Secure webhook endpoint with token verification
- **Domain Validation**: RSS feeds served from trusted domains only
- **API Rate Limiting**: Protection against abuse
- **Environment Variables**: Secure credential management

## 📈 Benefits

### For Content Creators
- **Zero Manual Work**: Drop files in Google Drive, everything else is automatic
- **Multi-Platform Reach**: Instant distribution to all major podcast platforms
- **Professional RSS**: Industry-standard podcast RSS feeds
- **Custom Branding**: Automated thumbnail generation and metadata

### For Institutions (GPP)
- **Educational Content**: Perfect for lecture recordings and educational podcasts
- **Multi-Domain**: Leverage all institutional domains for maximum reach
- **Professional Presence**: Automated, consistent podcast distribution
- **Analytics Ready**: Track episodes across platforms

## 🚨 Troubleshooting

### Common Issues
1. **Sync Not Working**: Check Google Drive API key and folder permissions
2. **RSS Feed Empty**: Verify MongoDB connection and episode data
3. **YouTube Upload Fails**: Check YouTube API credentials and quotas
4. **Webhook Not Triggering**: Verify webhook URL and verification token

### Debug Commands
```bash
# Check sync status
curl https://gppalanpur.ac.in/api/podcasts/sync?action=sync-status

# Manual sync
curl -X POST https://gppalanpur.ac.in/api/podcasts/sync -d '{"action": "sync-now"}'

# View RSS feed
curl https://gppalanpur.ac.in/api/podcasts
```

## 🔮 Future Enhancements

- **AI-Generated Descriptions**: More intelligent episode descriptions
- **Transcript Generation**: Automatic podcast transcripts
- **Chapter Markers**: Auto-generated chapter markers
- **Analytics Dashboard**: Listener analytics across platforms
- **Social Media Integration**: Auto-posting to social media
- **Email Newsletters**: Automatic episode notifications

---

## 📞 Support

- **Admin Dashboard**: https://gppalanpur.ac.in/admin/podcasts
- **RSS Feeds**: Available on all domains
- **Automation Logs**: Check `podcast-automation.log`
- **System Status**: Run `node podcast-automation.js status`

**Perfect for**: Educational institutions, content creators, automated podcast distribution, multi-platform publishing, Google Drive workflows.

🎉 **Your NotebookLM M4A files are now automatically distributed to all major podcast platforms!**