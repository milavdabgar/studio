# AI Voiceover System

**Professional Educational Video Generation with Voice Cloning**

Transform your Slidev presentations into professional videos with your authentic voice cloned from any language to English.

---

## 🎯 **Quick Start**

### Prerequisites
```bash
npm install -g @slidev/cli
pip install coqui-tts librosa soundfile moviepy pillow gtts
```

### One-Time Setup
```bash
# Accept Coqui TTS license (type 'y' when prompted)
python -c "from TTS.api import TTS; TTS('tts_models/multilingual/multi-dataset/xtts_v2')"
```

### Generate Video
```bash
# 1. Export clean slides
npx slidev export presentation.md --format png --output slides_clean

# 2. Generate voice audio
python core/generate_all_authentic_voice.py

# 3. Create final video
python core/video_production_system.py
```

---

## 📁 **Directory Structure**

```
ai_voiceover_system/
├── core/                    # Main system components
│   ├── final_demo.py       # Base TTS functionality
│   ├── voice_clone_with_license.py  # Voice cloning
│   ├── generate_all_authentic_voice.py  # Complete generation
│   └── video_production_system.py  # Video creation
├── setup/                   # Setup and configuration
│   ├── interactive_voice_setup.py  # Setup guide
│   └── quick_voice_clone.py # Quick testing
└── deprecated/              # Legacy files (reference only)
```

---

## 🎭 **System Features**

### ✅ **Voice Cloning**
- **Authentic Voice**: Your actual voice cloned to English
- **High Quality**: Coqui XTTS v2 technology
- **Multi-language**: Any source language → English
- **Professional**: Broadcast-quality audio

### ✅ **Professional Slides**
- **Clean Export**: Direct Slidev PNG generation
- **No Artifacts**: Syntax-free slide images
- **HD Quality**: 1920x1080 resolution
- **Perfect Sync**: Audio-video alignment

### ✅ **Complete Pipeline**
- **Automated**: End-to-end video generation
- **Scalable**: Apply to any Slidev presentation
- **YouTube Ready**: MP4 format with metadata
- **Consistent**: Professional quality every time

---

## 📊 **Proven Results**

**Computer Security Fundamentals Project**:
- ✅ 43 slides processed with 100% success
- ✅ 15.9 minutes of authentic voice audio
- ✅ 9-minute professional HD video
- ✅ Your Gujarati voice → English narration
- ✅ Perfect synchronization and quality

---

## 🚀 **Usage**

1. **Prepare**: Place your Slidev `.md` file and voice sample
2. **Setup**: Run license agreement (one-time)
3. **Generate**: Execute the three-command workflow
4. **Result**: Professional video with YOUR voice

---

## 💡 **Best Practices**

- **Voice Sample**: 30+ minutes, clear recording
- **Slides**: Use standard Slidev syntax
- **Quality**: HD output for professional results
- **Testing**: Run demo first to verify setup

---

**See `../AI_VOICEOVER_WORKFLOW.md` for complete documentation**