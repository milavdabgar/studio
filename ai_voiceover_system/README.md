# AI Voiceover System - Slidev Export Processor

🎉 **WORKING SYSTEM** - Perfect slide-audio synchronization achieved!

## 🎯 What This System Does

Generates professional educational videos with perfect synchronization between slides and narration:

- **Input**: Slidev markdown files with speaker notes
- **Output**: Professional MP4 videos with Google TTS UK English voice
- **Result**: Perfect timing - each slide displays exactly when its notes are being narrated

## 🚀 Quick Start

```bash
python slidev_export_processor.py
```

## 📁 Files

- **`slidev_export_processor.py`** - Main working script (✅ KEEP)
- **`exported_slides/`** - Auto-generated slide images from slidev export
- **`PROFESSIONAL_slidev_export_with_voice_hierarchy.mp4`** - Final working video output

## 🎤 How It Works

1. **Reads Slidev files** with HTML comment speaker notes:
   ```markdown
   # Slide Title
   
   Slide content here...
   
   <!-- Speaker notes for TTS go here -->
   ```

2. **Exports slides** using `slidev export` command to generate PNG images

3. **Extracts speaker notes** from HTML comments in markdown

4. **Generates TTS** using Google TTS UK English (user's preferred voice)

5. **Synchronizes** each slide image with its corresponding speaker notes audio

6. **Outputs** professional MP4 video with perfect timing

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