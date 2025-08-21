# 🎯 AI Voiceover System

**Comprehensive educational content creation platform that transforms podcasts, audio content, and presentations into professional educational videos with synchronized visuals.**

[![Status](https://img.shields.io/badge/Status-Production%20Ready-green)](https://github.com/milavdabgar/studio)
[![Python](https://img.shields.io/badge/Python-3.13-blue)](https://python.org)
[![MoviePy](https://img.shields.io/badge/MoviePy-1.0.3-orange)](https://github.com/Zulko/moviepy)
[![Multi-Language](https://img.shields.io/badge/Multi--Language-Gujarati%20%7C%20English-purple)](https://github.com/milavdabgar/studio)

## 🚀 Quick Start

### ⭐ Time-Synced Video Generation (Latest)
```bash
# Create educational video from YouTube audio and slides
python ai_voiceover_system/youtube_podcast_downloader.py "https://youtube.com/watch?v=VIDEO_ID"
python ai_voiceover_system/timesynced_video_generator.py audio.m4a subtitles.vtt slides.md
```

### 🎬 Traditional Slidev Processing
```bash
# Google TTS with automatic click/slide detection
python ai_voiceover_system/slidev_unified_processor.py your-slides.md

# ElevenLabs voice clone (requires API key)
python ai_voiceover_system/slidev_unified_processor.py your-slides.md 5 --tts=elevenlabs

# Auto fallback hierarchy (GTTS → ElevenLabs → Coqui)
python ai_voiceover_system/slidev_unified_processor.py your-slides.md --tts=auto
```

## 🎬 What This System Does

**Primary Pipeline**: Audio/YouTube content + Subtitles + Slidev presentations → Professional educational videos  
**Secondary Pipeline**: Slidev markdown with presenter notes → Synchronized video presentations  
**Magic**: Intelligent timing synchronization, multi-language support, and automatic cleanup

### 🎯 Key Features

#### ⭐ Latest: Time-Synced Video Generation
- ✅ **YouTube Integration**: Download audio and subtitles from YouTube videos
- ✅ **Perfect Timing**: Subtitle-based slide synchronization
- ✅ **Multi-Language**: Tested with Gujarati, English, and other languages
- ✅ **Automatic Cleanup**: Removes temporary files after processing
- ✅ **Python 3.13 Ready**: Latest Python compatibility with MoviePy 1.x

#### 🎬 Traditional Slidev Processing
- ✅ **Smart Processing**: Auto-detects click vs slide-based content
- ✅ **Multi-TTS Support**: Google TTS, ElevenLabs, Coqui neural models
- ✅ **Perfect Synchronization**: Click-level narration timing
- ✅ **Professional Output**: Real Slidev exports with animations preserved
- ✅ **Zero Configuration**: Works with any properly formatted Slidev file

## 📦 Installation & Setup

### Prerequisites

```bash
# Python 3.13 environment (recommended)
python -m venv .venv
source .venv/bin/activate  # On macOS/Linux

# Install Python dependencies
pip install -r requirements.txt

# Node.js dependencies for Slidev
npm install slidev
```

### Core Dependencies
- **Python 3.13+** - Latest Python runtime
- **MoviePy 1.0.3** - Video processing and rendering  
- **Slidev** - Presentation framework
- **Optional**: gTTS, ElevenLabs, OpenAI APIs

### Optional: ElevenLabs Setup

```bash
# For voice cloning support
export ELEVENLABS_API_KEY="your-api-key-here"
```

## 🎤 TTS Providers

| Provider | Quality | Speed | Requirements |
|----------|---------|-------|--------------|
| **GTTS** (default) | High | Fast | None |
| **ElevenLabs** | Premium | Medium | API key |
| **Coqui** | Neural | Slow | Large models |
| **Auto** | Best Available | Variable | Fallback chain |

### Provider Selection

```bash
# Google TTS UK English (default, recommended)
python slidev_unified_processor.py slides.md --tts=gtts

# ElevenLabs voice cloning (premium quality)
python slidev_unified_processor.py slides.md --tts=elevenlabs

# Coqui neural models (offline, high quality)
python slidev_unified_processor.py slides.md --tts=coqui

# Automatic fallback (tries GTTS → ElevenLabs → Coqui)
python slidev_unified_processor.py slides.md --tts=auto
```

## 📝 Content Format

### Automatic Mode Detection

The system automatically detects your content type:

**🖱️ Click-Based Processing** (when `[click]` markers found):
- Uses `--with-clicks` export for frame-perfect timing
- Each click gets individual narration segment
- Perfect synchronization with visual progression

**📄 Slide-Based Processing** (fallback):
- Standard slide export
- One narration segment per slide
- Faster processing for simple presentations

### Click-Synchronized Format (Recommended)

```markdown
---
# Cybersecurity Fundamentals

<div v-click="1">
  ## The CIA Triad
</div>

<div v-click="2">
  - **Confidentiality**: Keeping secrets secret
  - **Integrity**: Maintaining data accuracy
  - **Availability**: Ensuring system access
</div>

<!--
Welcome to today's lecture on Cybersecurity Fundamentals.

[click] Today we'll explore the CIA Triad, which forms the foundation of information security.

[click] The three pillars are Confidentiality for keeping secrets secret, Integrity for maintaining data accuracy, and Availability for ensuring systems remain accessible.
-->
---
```

### Slide-Level Format (Simple)

```markdown
---
# Course Introduction

Welcome to the course! Today we'll cover:
- Course objectives
- Learning outcomes
- Assessment criteria

<!-- This slide introduces the course structure and provides an overview of what students can expect to learn throughout the semester. -->
---
```

## 🔧 Advanced Usage

### Command Line Options

```bash
# Basic usage
python slidev_unified_processor.py <slidev-file> [max-slides] [--tts=provider]

# Examples
python slidev_unified_processor.py lecture.md                    # Process all slides, GTTS
python slidev_unified_processor.py lecture.md 5                  # First 5 slides, GTTS
python slidev_unified_processor.py lecture.md 10 --tts=elevenlabs # First 10 slides, ElevenLabs
python slidev_unified_processor.py lecture.md --tts=auto         # All slides, auto fallback
```

### Output Files

The system generates professional videos with clean, descriptive names:

```
your-presentation-ElevenLabs.mp4  # ElevenLabs processing
your-presentation-GTTS.mp4        # Google TTS processing  
your-presentation-AUTO.mp4        # Auto provider processing
your-presentation-COQUI.mp4       # Coqui neural processing
```

### Preserved Audio Files

When using ElevenLabs, audio files are preserved for review:
```
temp_unified_slide_1_click_0.mp3  # First slide, initial segment
temp_unified_slide_1_click_1.mp3  # First slide, first click
...
```

## 🎨 Processing Modes

### 🖱️ Click-Synchronized Mode

**Triggered by**: Presence of `[click]` markers in presenter notes  
**Export method**: `slidev export --with-clicks`  
**Timing**: Frame-perfect synchronization  
**Best for**: Professional presentations, educational content

#### Features:
- Each `[click]` marker creates a separate video segment
- Visual elements appear exactly when mentioned in narration
- Supports complex click sequences with `[click:3]` syntax
- Ideal for step-by-step explanations

#### Example Output:
```
🎞️ Processing slide 1: Cybersecurity Fundamentals...
   🖱️ Click 0 → 001-01.png: Welcome to today's lecture...
   🖱️ Click 1 → 001-02.png: Today we'll explore the CIA Triad...
   🖱️ Click 2 → 001-03.png: The three fundamental concepts...
```

### 📄 Slide-Level Mode

**Triggered by**: No `[click]` markers found  
**Export method**: `slidev export` (standard)  
**Timing**: One segment per slide  
**Best for**: Simple presentations, quick videos

#### Features:
- Uses speaker notes from HTML comments
- Generates comprehensive narration per slide
- Faster processing and smaller file sizes
- Automatic fallback when click mode unavailable

## 🛠️ System Architecture

```
Slidev Markdown File
        ↓
   [Click Detection]
        ↓
┌─────────────────┬─────────────────┐
│  Click-Based    │   Slide-Based   │
│   Processing    │   Processing    │
└─────────────────┴─────────────────┘
        ↓                 ↓
   Export with        Standard
   --with-clicks       Export
        ↓                 ↓
   TTS Generation    TTS Generation
        ↓                 ↓
   Video Assembly    Video Assembly
        ↓                 ↓
   Professional MP4  Professional MP4
```

## 🎯 Best Practices

### Content Creation

1. **Plan Click Progression**: Each click should reveal meaningful content
2. **Write Targeted Narration**: Tailor narration to visual changes
3. **Test Animations First**: Verify `v-click` works in Slidev preview
4. **Keep Segments Balanced**: Aim for 5-15 seconds per click

### Technical Optimization

1. **Start Small**: Test with 1-3 slides first
2. **Use Relative Paths**: Ensure file accessibility
3. **Check Dependencies**: Verify Slidev CLI installation
4. **Monitor Performance**: Larger presentations take more time

### TTS Provider Selection

1. **GTTS**: Best for most use cases, fast and reliable
2. **ElevenLabs**: When you need voice cloning or premium quality
3. **Coqui**: For offline processing or neural model preference
4. **Auto**: When you want intelligent fallback behavior

## 🔍 Troubleshooting

### Common Issues

**❌ "Slidev not found"**
```bash
npm install -g @slidev/cli
```

**❌ "No click markers detected"**
- Add `[click]` markers in HTML comments
- System will fall back to slide-level processing

**❌ "ElevenLabs API error"**
```bash
export ELEVENLABS_API_KEY="your-key-here"
```

**❌ "Video generation failed"**
- Check file paths are correct
- Verify virtual environment has required packages
- Ensure sufficient disk space for temporary files

### Debug Mode

```bash
# Verbose output for troubleshooting
python slidev_unified_processor.py slides.md 1 --tts=gtts
```

## 📊 System Comparison

| Feature | Legacy Processors | Unified Processor |
|---------|------------------|-------------------|
| **TTS Providers** | Single | Multiple with fallback |
| **Mode Detection** | Manual | Automatic |
| **Click Support** | Limited | Full `[click]` support |
| **Error Handling** | Basic | Comprehensive |
| **Output Naming** | Generic | Descriptive |
| **Audio Preservation** | No | Yes (ElevenLabs) |

## 🚀 Advanced Features

### ElevenLabs Integration

- **Voice Cloning**: Uses your "Milav English" voice
- **Optimal Settings**: Stability 0.5, Similarity 0.8, Style 0.0
- **Model**: Eleven Multilingual v2
- **Audio Preservation**: Files kept for review

### Intelligent Fallbacks

- **TTS Fallback**: GTTS → ElevenLabs → Coqui → Error
- **Mode Fallback**: Click-based → Slide-based
- **Export Fallback**: With-clicks → Standard export

### Professional Output

- **HD Quality**: 1920x1080 resolution maintained
- **High Bitrate**: 8000k for crisp video quality
- **Professional Codecs**: H.264 video, AAC audio
- **Descriptive Naming**: Clear file identification

## 📈 Performance Metrics

**Click-Synchronized Processing:**
- ~2-3 seconds per click segment
- Perfect audio-visual synchronization
- Professional presentation quality

**Slide-Level Processing:**
- ~1-2 seconds per slide
- Comprehensive narration generation
- Faster processing for simple content

## 🏆 Recent Achievements (2024)

### ✅ Python 3.13 Migration & Compatibility (December 2024)
- **Complete system upgrade** to Python 3.13
- **Fixed MoviePy 1.x compatibility** across 7+ files in the codebase
- **Resolved dependency conflicts** (decorator, pydub, audioop deprecation)
- **Tested end-to-end pipeline** with real educational content

### ✅ Time-Synced Video Generation Pipeline (November 2024)
- **Developed timesynced_video_generator.py** - Professional video creation from YouTube/audio + slides
- **YouTube integration** for automatic audio and subtitle download
- **Multi-language testing** with Gujarati educational content (347.5-second video, 10 slides)
- **Automatic cleanup system** - PNG files removed after video completion

### ✅ Enhanced Processing & Quality (October 2024)
- **Multiple TTS engine support** with intelligent fallback (gTTS, ElevenLabs, OpenAI)
- **Progressive click animations** in Slidev presentations
- **Professional video rendering** with H.264/AAC optimization
- **Cross-language compatibility** verified (Gujarati content + English timing)

## 🎉 Success Stories

✅ **Perfect Synchronization**: Frame-accurate click timing and subtitle-based transitions  
✅ **Multi-TTS Support**: Flexible provider options with intelligent fallback  
✅ **Python 3.13 Ready**: Latest Python compatibility with all modern features  
✅ **Multi-Language**: Tested with Gujarati, English, and cross-language scenarios  
✅ **Professional Quality**: Real Slidev exports and YouTube-grade video output  
✅ **Scalable System**: Works with any presentation size and content type  

---

## 📞 Support

For issues, feature requests, or contributions:
1. Check troubleshooting section above
2. Verify dependencies are installed correctly
3. Test with minimal example first
4. Review output logs for specific error messages

**Status**: 🟢 **Production Ready** - Time-synced video generation and unified processing operational!

### 📋 Quick Reference

| Component | File | Purpose |
|-----------|------|---------|
| **⭐ Video Generation** | `timesynced_video_generator.py` | Main time-synced video creation |
| **Content Acquisition** | `youtube_podcast_downloader.py` | Download YouTube audio/subtitles |
| **Slidev Processing** | `slidev_unified_processor.py` | Traditional Slidev presentations |
| **Publishing** | `podcast_publisher.py` | Complete publishing pipeline |

---

*Last Updated: December 2024 - Time-Synced Video Generation v2.0 + Python 3.13 Ready*