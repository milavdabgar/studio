# YouTube Video Editing Guide

## 🎬 Edit Your Uploaded Videos

The YouTube Data API allows you to edit video details after upload. Here are all the available editing options:

## 🔧 Available Operations

### 1. Update Video Metadata
```bash
# Update title, description, and tags
python youtube_video_editor.py update --video-id u005EbysPnw \
  --title "MLP Week 1 - Machine Learning Fundamentals (Updated)" \
  --description "Updated description with more details about the episode content." \
  --tags "machine learning" "AI" "podcast" "education" "fundamentals" "neural networks"
```

### 2. Change Privacy Settings
```bash
# Make video public
python youtube_video_editor.py privacy --video-id u005EbysPnw --privacy public

# Make video private
python youtube_video_editor.py privacy --video-id u005EbysPnw --privacy private

# Keep as unlisted
python youtube_video_editor.py privacy --video-id u005EbysPnw --privacy unlisted
```

### 3. Update Thumbnail
```bash
# Upload new custom thumbnail
python youtube_video_editor.py thumbnail --video-id u005EbysPnw \
  --thumbnail "path/to/new_thumbnail.png"
```

### 4. Add to Playlist
```bash
# Add video to existing playlist
python youtube_video_editor.py playlist --video-id u005EbysPnw \
  --playlist-id "PLxxxxxxxxxxxxx"
```

### 5. View Video Analytics
```bash
# Get video statistics
python youtube_video_editor.py analytics --video-id u005EbysPnw
```

### 6. Show Video Details
```bash
# Display current video information
python youtube_video_editor.py show --video-id u005EbysPnw
```

### 7. List Your Videos
```bash
# Show your recent uploads
python youtube_video_editor.py list
```

## 📋 Common Editing Tasks

### Update Your Podcast Episode
```bash
# Complete metadata update
python youtube_video_editor.py update --video-id u005EbysPnw \
  --title "MLP Week 1: Introduction to Machine Learning - Complete Guide" \
  --description "
🎧 Machine Learning Podcast - Week 1

In this episode, we cover:
• Introduction to Machine Learning concepts
• Types of learning algorithms
• Real-world applications
• Getting started with ML

🔗 Resources mentioned:
- Link 1
- Link 2

📱 Follow us for more episodes!
  " \
  --tags "machine learning" "ML" "artificial intelligence" "AI" "data science" "podcast" "education" "beginner" "tutorial" "algorithms"
```

### Make Video Public (when ready)
```bash
python youtube_video_editor.py privacy --video-id u005EbysPnw --privacy public
```

### Check Performance
```bash
python youtube_video_editor.py analytics --video-id u005EbysPnw
```

## 🎯 YouTube Categories

Common category IDs:
- **22** - People & Blogs (default for podcasts)
- **27** - Education
- **28** - Science & Technology
- **24** - Entertainment
- **25** - News & Politics

```bash
# Change to Education category
python youtube_video_editor.py update --video-id u005EbysPnw --category 27
```

## 🌐 Language Settings

```bash
# Set default language
python youtube_video_editor.py update --video-id u005EbysPnw --language en
```

## 📊 What You Can Edit

### ✅ Editable After Upload:
- Title
- Description  
- Tags
- Thumbnail
- Privacy status
- Category
- Language
- Add to playlists
- Captions/subtitles

### ❌ Not Editable After Upload:
- Video file itself
- Video length
- Original upload date
- Video ID
- Audio track (need to re-upload)

## 🚀 Quick Examples

### For Your Current Video (u005EbysPnw):

```bash
# Check current details
python youtube_video_editor.py show --video-id u005EbysPnw

# Update description with timestamps
python youtube_video_editor.py update --video-id u005EbysPnw \
  --description "
🎧 MLP Week 1 - Machine Learning Fundamentals

📚 Topics Covered:
00:00 Introduction
05:30 What is Machine Learning?
15:20 Types of ML Algorithms
25:45 Supervised Learning
35:10 Unsupervised Learning
45:30 Applications & Examples

🔗 Resources: [Add your links here]
📱 Subscribe for more ML content!
  "

# Make it public when ready
python youtube_video_editor.py privacy --video-id u005EbysPnw --privacy public
```

All changes are applied immediately through the YouTube Data API!