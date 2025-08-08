# 🎯 Slidev AI Voiceover System

**Cross-platform automated video generation system for Slidev presentations with intelligent TTS providers, auto-venv management, and click-level synchronization.**

[![Status](https://img.shields.io/badge/Status-Production%20Ready-green)](https://github.com/your-repo)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://python.org)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey)](https://github.com/your-repo)
[![TTS](https://img.shields.io/badge/TTS-Multi--Provider-orange)](https://github.com/your-repo)

## 🚀 Quick Start (Zero Configuration!)

```bash
# Single command - creates venv, installs deps, generates video automatically!
python ai_voiceover_system/slidev_unified_processor.py your-slides.md

# Process first 5 slides with ElevenLabs (requires API key)
python ai_voiceover_system/slidev_unified_processor.py your-slides.md 5 --tts=elevenlabs

# Alternative: Use the bash wrapper (same functionality)
./ai_voiceover_system/create_video.sh your-slides.md 3 --tts=gtts
```

### 🎯 What Happens Automatically:
1. **🔧 Virtual Environment**: Auto-creates Python 3.11 venv if missing
2. **📦 Dependencies**: Installs all required packages (moviepy, gtts, etc.)
3. **🎬 Video Generation**: Complete slide export → TTS → video assembly
4. **🧹 Cleanup**: Removes all temporary files, keeps only final MP4

## 🎬 What This System Does

**Input**: Slidev markdown files with presenter notes  
**Output**: Professional MP4 videos with perfect audio-visual synchronization  
**Magic**: Automatically detects click animations and synchronizes narration timing

### 🎯 Key Features

- ✅ **Smart Processing**: Auto-detects click vs slide-based content
- ✅ **Multi-TTS Support**: Google TTS, ElevenLabs, Coqui neural models
- ✅ **Perfect Synchronization**: Click-level narration timing
- ✅ **Professional Output**: Real Slidev exports with animations preserved
- ✅ **Zero Configuration**: Works with any properly formatted Slidev file

## 📦 Installation & Setup

### 🎯 Zero-Configuration Setup (Recommended)

**Just run the script!** No manual installation needed:

```bash
# The script will automatically:
# 1. Detect or install Python 3.11
# 2. Create virtual environment 
# 3. Install all dependencies
# 4. Generate your video

python ai_voiceover_system/slidev_unified_processor.py your-slides.md
```

### 📋 System Requirements

**Automatically Handled:**
- ✅ **Python 3.11**: Auto-detected or installed via Homebrew (macOS)
- ✅ **Virtual Environment**: Auto-created in `venv/`  
- ✅ **Python Packages**: Auto-installed from `requirements.txt`
- ✅ **Slidev CLI**: Auto-detected or shows installation instructions

**Manual Installation (Optional):**

```bash
# If you want to pre-install Slidev globally (recommended)
npm install -g @slidev/cli

# If you want to manually manage Python dependencies
pip install moviepy gtts requests
# TTS (Coqui) auto-installs if Python 3.11 detected
```

### 🎤 Optional: ElevenLabs Setup

```bash
# For premium voice cloning support
export ELEVENLABS_API_KEY="your-api-key-here"
```

### 🖥️ Cross-Platform Support

**macOS:**
- ✅ Homebrew Python 3.11 auto-detection
- ✅ Native Slidev CLI support
- ✅ Optimized M1/Intel compatibility

**Linux:**
- ✅ System Python 3.11 preference
- ✅ Venv isolation for package conflicts
- ✅ Comprehensive error handling

**Windows:**
- ✅ Cross-platform path handling
- ✅ PowerShell activation support
- ✅ Windows-specific optimizations

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
python ai_voiceover_system/slidev_unified_processor.py slides.md --tts=gtts

# ElevenLabs voice cloning (premium quality)
python ai_voiceover_system/slidev_unified_processor.py slides.md --tts=elevenlabs

# Coqui neural models (offline, high quality - auto-installs with Python 3.11)
python ai_voiceover_system/slidev_unified_processor.py slides.md --tts=coqui

# Automatic fallback (tries GTTS → ElevenLabs → Coqui)
python ai_voiceover_system/slidev_unified_processor.py slides.md --tts=auto
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
# Basic usage - AUTO-VENV MANAGEMENT
python ai_voiceover_system/slidev_unified_processor.py <slidev-file> [max-slides] [--tts=provider]

# Examples (all auto-manage venv and dependencies)
python ai_voiceover_system/slidev_unified_processor.py lecture.md                    # Process all slides, GTTS
python ai_voiceover_system/slidev_unified_processor.py lecture.md 5                  # First 5 slides, GTTS
python ai_voiceover_system/slidev_unified_processor.py lecture.md 10 --tts=elevenlabs # First 10, ElevenLabs
python ai_voiceover_system/slidev_unified_processor.py lecture.md --tts=auto         # All slides, auto fallback

# Alternative: Bash wrapper (same auto-venv functionality)
./ai_voiceover_system/create_video.sh lecture.md 5 --tts=gtts
```

### 🔧 Auto-Environment Management

**What happens on first run:**
1. **🔍 Environment Check**: Detects Python version and venv status
2. **🐍 Python 3.11 Preference**: Auto-finds or suggests installation
3. **📦 Virtual Environment**: Creates `venv/` in project root
4. **⬇️ Dependencies**: Installs from `requirements.txt`
5. **🔄 Restart**: Switches to venv Python automatically
6. **🎬 Process**: Continues with video generation

**Subsequent runs:** Uses existing venv, no setup delay!

### Output Files

The system generates professional videos with clean, descriptive names:

```
your-presentation-ElevenLabs.mp4  # ElevenLabs processing
your-presentation-GTTS.mp4        # Google TTS processing  
your-presentation-AUTO.mp4        # Auto provider processing
your-presentation-COQUI.mp4       # Coqui neural processing
```

### 🧹 Automatic Cleanup

**Temporary files are automatically cleaned up:**
- ✅ All `.mp3` TTS audio files removed  
- ✅ All PNG slide exports removed (`temp_unified_slides/`)
- ✅ Only final MP4 video remains
- ✅ Virtual environment preserved for future runs

**ElevenLabs Audio Preservation (Optional):**
```bash
# To keep TTS audio files for review, modify cleanup behavior in script
temp_unified_slide_1_click_0.mp3  # First slide, initial segment
temp_unified_slide_1_click_1.mp3  # First slide, first click
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

**❌ "Virtual environment setup failed"**
- **Solution**: Ensure Python 3.11 is available
- **macOS**: `brew install python@3.11`
- **Linux**: `sudo apt install python3.11` or equivalent

**❌ "Slidev not found"**
```bash
# The system will show this message and continue
npm install -g @slidev/cli
```

**❌ "Dependencies installation failed"**
- **Auto-retry**: System attempts automatic fixes
- **Manual**: Delete `venv/` folder and re-run script
- **Check**: Ensure internet connectivity for package downloads

**❌ "No click markers detected"**
- ✅ **Auto-handled**: System falls back to slide-level processing
- Add `[click]` markers in HTML comments for click-sync mode

**❌ "ElevenLabs API error"**
```bash
export ELEVENLABS_API_KEY="your-key-here"
# Or system falls back to GTTS automatically
```

**❌ "Permission denied"**
- **macOS/Linux**: Ensure script is executable
- **Windows**: Run from elevated command prompt if needed

### Debug Mode

```bash
# Test with minimal slides for troubleshooting
python ai_voiceover_system/slidev_unified_processor.py slides.md 1 --tts=gtts

# Environment diagnostics (shows Python version, venv status, dependencies)
python ai_voiceover_system/slidev_unified_processor.py slides.md --help
```

## 📊 System Comparison

| Feature | Legacy Processors | Unified Processor |
|---------|------------------|-------------------|
| **Environment Setup** | Manual | Auto-venv management |
| **Cross-Platform** | Limited | macOS/Linux/Windows |
| **Python Version** | Any | Python 3.11 preferred |
| **TTS Providers** | Single | Multiple with fallback |
| **Mode Detection** | Manual | Automatic |
| **Click Support** | Limited | Full `[click]` support |
| **Error Handling** | Basic | Comprehensive with retries |
| **Cleanup** | Manual | Automatic |
| **Dependencies** | Manual install | Auto-install from requirements.txt |

## 🚀 Advanced Features

### ElevenLabs Integration

- **Voice Cloning**: Uses your "Milav English" voice
- **Optimal Settings**: Stability 0.5, Similarity 0.8, Style 0.0
- **Model**: Eleven Multilingual v2
- **Audio Preservation**: Files kept for review

### Intelligent Fallbacks

- **Environment Fallback**: Python 3.11 → Python 3.10+ → Current Python
- **TTS Fallback**: GTTS → ElevenLabs → Coqui → Error  
- **Mode Fallback**: Click-based → Slide-based
- **Export Fallback**: With-clicks → Standard export
- **Dependency Fallback**: Auto-install → Manual instructions

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

## 🎉 Production Features

✅ **Zero Configuration**: Single command creates entire environment  
✅ **Cross-Platform**: Identical experience on macOS, Linux, Windows  
✅ **Auto-Environment**: Python 3.11 venv with all dependencies  
✅ **Perfect Synchronization**: Frame-accurate click timing  
✅ **Smart Cleanup**: Only final video remains  
✅ **Intelligent Fallbacks**: Handles missing dependencies gracefully  
✅ **Professional Quality**: Real Slidev exports preserved  

## 🎯 Real-World Usage Example

```bash
# Complete workflow from zero to video:
cd your-project/
python ai_voiceover_system/slidev_unified_processor.py presentation.md 5 --tts=gtts

# What happens:
# 🔧 Creates Python 3.11 venv automatically
# 📦 Installs moviepy, gtts, requests, TTS
# 🎬 Exports 5 slides with click states
# 🎤 Generates TTS for each click segment  
# 📹 Assembles final MP4 video
# 🧹 Cleans up all temporary files
# ✅ Result: presentation-GTTS.mp4 ready!
```

---

## 📞 Support

**Quick Diagnostic:**
```bash
python ai_voiceover_system/slidev_unified_processor.py your-slides.md 1 --tts=gtts
```

**Common Solutions:**
1. **Environment Issues**: Delete `venv/` folder and re-run
2. **Missing Slidev**: `npm install -g @slidev/cli` 
3. **Python Version**: Install Python 3.11 via Homebrew/package manager
4. **Permission Issues**: Use `chmod +x` for scripts on Unix systems

**Status**: 🟢 **Production Ready** - Auto-venv system fully operational!

---

*Last Updated: August 2024 - Auto-venv Unified Processor v2.0*