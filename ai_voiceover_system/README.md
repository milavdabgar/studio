# AI Voiceover System - Slidev Export Processor

🎉 **WORKING SYSTEM** - Perfect slide-audio synchronization achieved!

## 🎯 What This System Does

Generates professional educational videos with perfect synchronization between slides and narration:

- **Input**: Slidev markdown files with speaker notes
- **Output**: Professional MP4 videos with Google TTS UK English voice
- **Result**: Perfect timing - each slide displays exactly when its notes are being narrated

## 🚀 Quick Start

### Option 1: Auto-Venv Runner (Recommended)
```bash
# Process default file (5 slides)
python ai_voiceover_system/run.py

# Process specific slidev file (5 slides)  
python ai_voiceover_system/run.py /path/to/your/slides.md

# Process specific file with custom slide count
python ai_voiceover_system/run.py /path/to/your/slides.md 10
```

### Option 2: Manual Virtual Environment
```bash
# Activate venv first
source venv/bin/activate

# Then run processor
python ai_voiceover_system/slidev_export_processor.py
python ai_voiceover_system/slidev_export_processor.py /path/to/your/slides.md 10
```

## 📋 Setup (One-time)

```bash
# From project root (studio folder)
python3 -m venv venv
source venv/bin/activate
pip install gtts moviepy
```

## 📁 Files

- **`slidev_export_processor.py`** - Main working script (✅ KEEP)
- **`PROFESSIONAL_[filename]_with_voice_hierarchy.mp4`** - Generated video output

## 🎤 How It Works

1. **Reads Slidev files** with HTML comment speaker notes:
   ```markdown
   # Slide Title
   
   Slide content here...
   
   <!-- Speaker notes for TTS go here -->
   ```

2. **Exports slides** using `slidev export` command to generate PNG images (temporary)

3. **Extracts speaker notes** from HTML comments in markdown

4. **Generates TTS** using Google TTS UK English (temporary WAV files)

5. **Synchronizes** each slide image with its corresponding speaker notes audio

6. **Outputs** professional MP4 video with perfect timing

7. **Cleans up** all temporary PNG and WAV files automatically

## ✅ Voice Hierarchy

1. **Primary**: Google TTS UK English (preferred)
2. **Secondary**: Google TTS Irish English  
3. **Backup**: VITS Neural
4. **Fallback**: Tacotron2 Neural

## 🎯 Key Features

- ✅ Perfect slide-audio synchronization
- ✅ Only speaker notes used for TTS (no content pollution)
- ✅ Professional slidev styling preserved
- ✅ Preferred Google TTS UK English voice
- ✅ Systematic workflow for any slidev presentation

## 📝 Adding Speaker Notes

Add HTML comments at the end of each slide in your slidev markdown:

```markdown
---
# Slide Title

Your slide content...

<!-- Your narration script goes here. This will be read aloud when this slide is displayed. -->

---
```

## 🎉 Success Metrics

- **Perfect synchronization**: ✅ Achieved
- **Voice quality**: ✅ Google TTS UK English
- **Professional output**: ✅ Real slidev exports
- **No content pollution**: ✅ Only speaker notes used for TTS
- **Systematic workflow**: ✅ Repeatable process

---

**Status**: 🟢 **PRODUCTION READY** - System working perfectly!