# Two-Speaker Transcript Generation System

This repository provides two complementary approaches for generating clean, two-speaker conversational transcripts from YouTube videos and audio files. Both methods are designed to produce TTS-ready scripts with proper speaker diarization.

## 🎯 Overview

### Method 1: Audio-Based Processing (`youtube-to-audio-script.py`)
**Professional speaker diarization using Whisper + pyannote.audio**

- **Best for**: Highest accuracy, professional results, any audio source
- **Technology**: Direct audio processing with Whisper large-v2 + pyannote.audio 3.1
- **Authentication**: Requires HuggingFace token for pyannote models
- **Speed**: Slower (processes full audio) but superior accuracy
- **Output**: Professional-grade speaker separation with sentence-boundary detection

### Method 2: Caption-Based Processing (`youtube-to-clean-script.py`)
**Pattern-based analysis of YouTube captions**

- **Best for**: Quick processing, YouTube videos with good captions
- **Technology**: VTT caption analysis with advanced speaker detection patterns
- **Authentication**: None required
- **Speed**: Faster (uses pre-existing captions)
- **Output**: Good quality with intelligent conversation flow analysis

## 🚀 Quick Start

### Audio-Based Method (Recommended for Best Quality)

```bash
# Setup HuggingFace token (one-time setup)
export HUGGINGFACE_HUB_TOKEN="your_token_here"
# Or add to .env.local: HUGGINGFACE_HUB_TOKEN=your_token_here

# From YouTube URL
python youtube-to-audio-script.py "https://www.youtube.com/watch?v=abc123"

# From local audio file
python youtube-to-audio-script.py "podcast.m4a" --speakers "Dr. Smith,Alice"

# Custom speakers
python youtube-to-audio-script.py "audio.wav" --speakers "Host,Expert"
```

### Caption-Based Method (Faster)

```bash
# Basic usage
python youtube-to-clean-script.py "https://www.youtube.com/watch?v=abc123"

# Custom speakers
python youtube-to-clean-script.py "https://www.youtube.com/watch?v=abc123" --speakers "Dr. Smith,Alice"

# Different language
python youtube-to-clean-script.py "https://www.youtube.com/watch?v=abc123" --language es
```

## 📊 Comparison

| Feature | Audio-Based | Caption-Based |
|---------|-------------|---------------|
| **Accuracy** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Speed** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Setup** | HuggingFace token | None |
| **Audio Sources** | Any (MP3, M4A, WAV, etc.) | YouTube only |
| **Dependencies** | whisper-timestamped, pyannote.audio | yt-dlp only |
| **Timing Precision** | Word-level timestamps | Segment-level |
| **Speaker Detection** | ML-based (pyannote 3.1) | Pattern-based |
| **Processing Time** | 5-10 minutes for 1 hour | 1-2 minutes |

## 🔧 Installation

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# or .venv\Scripts\activate  # Windows

# For Audio-Based Method
pip install whisper-timestamped pyannote.audio torch yt-dlp

# For Caption-Based Method (lighter)
pip install yt-dlp

# Both methods
pip install whisper-timestamped pyannote.audio torch yt-dlp
```

## 🎭 Key Features

### Audio-Based Processing
- **Professional Speaker Diarization**: Uses pyannote.audio 3.1 models
- **Word-Level Timestamps**: Precise timing from Whisper
- **Gender Mapping**: Correctly maps SPEAKER_00/01 to Male/Female
- **Sentence-Boundary Changes**: No mid-sentence speaker switches
- **Speaker Grouping**: Consecutive same-speaker segments grouped for TTS
- **Multi-Format Support**: Handles M4A, MP3, WAV, FLAC, AAC, etc.
- **Fallback Detection**: Pattern-based fallback if pyannote unavailable

### Caption-Based Processing  
- **VTT Parsing**: Extracts incremental text from YouTube captions
- **Duplicate Removal**: Eliminates YouTube caption repetition artifacts
- **Context-Aware Detection**: Uses conversation flow for speaker assignment
- **Natural Splitting**: Intelligent paragraph creation with length management
- **Pattern Recognition**: Advanced regex patterns for host/expert identification
- **Transition Smoothing**: Corrects erratic speaker changes

## 🎯 Output Format

Both methods produce clean, TTS-ready scripts in this format:

```
<!--
Female: Welcome to the Deep Dive. We're here to pull out the key info you need from different sources. That's right. And today we're looking at a summer 2023 exam solution guide.

Male: Yep, the fundamentals.

Female: So whether this is maybe your first time seeing this stuff or you need a refresher, or maybe you just want things clear before you actually start coding, our aim is to make these technical ideas understandable, maybe even interesting. Hopefully.

Male: And this guide, it hits definitions, rules, code examples, pretty comprehensive for fundamentals.
-->
```

## ⚙️ Configuration

### HuggingFace Setup (Audio-Based Method)

1. Create account at [huggingface.co](https://huggingface.co)
2. Generate token at [Settings > Access Tokens](https://huggingface.co/settings/tokens)
3. Accept terms for [pyannote/speaker-diarization-3.1](https://huggingface.co/pyannote/speaker-diarization-3.1)
4. Set environment variable:
   ```bash
   export HUGGINGFACE_HUB_TOKEN="hf_xxxxxxxxxxxxx"
   # Or add to .env.local
   ```

### Speaker Names

Both methods support custom speaker names:

```bash
# Default: "Dr. James" (host/interviewer) and "Sarah" (expert/guest)
--speakers "Host,Guest"
--speakers "Dr. Smith,Alice"
--speakers "Interviewer,Expert"
```

## 📁 Output Structure

```
audio_scripts/           # Audio-based outputs
├── test-1min-audio-audio-clean.txt
├── test-5min-audio-audio-clean.txt
└── ...

clean_scripts/          # Caption-based outputs  
├── video-title-clean.txt
└── ...
```

## 🛠 Technical Details

### Audio-Based Pipeline
1. **Audio Extraction**: Download/prepare audio in WAV format
2. **Whisper Transcription**: Word-level timestamps with large-v2 model
3. **Speaker Diarization**: pyannote.audio 3.1 with 2-speaker constraint
4. **Alignment**: Match diarization segments with transcribed words
5. **Sentence Grouping**: Group words into sentences at punctuation boundaries
6. **Speaker Grouping**: Consolidate consecutive same-speaker segments
7. **Output**: Clean TTS-ready script

### Caption-Based Pipeline
1. **Subtitle Download**: VTT format from YouTube
2. **Incremental Parsing**: Extract only new words per timestamp
3. **Duplicate Removal**: Eliminate repetition artifacts
4. **Sentence Grouping**: Group segments by punctuation boundaries
5. **Pattern Detection**: Host/expert role detection via regex patterns
6. **Context Analysis**: Conversation flow and speaker transition logic
7. **Output**: Clean conversational script

## 🔍 Use Cases

### Audio-Based Method - Use When:
- **Maximum accuracy required**
- Processing local audio files (podcasts, recordings, etc.)
- Working with multiple audio formats
- Professional transcription needs
- Have HuggingFace access and time for processing

### Caption-Based Method - Use When:
- **Speed is priority**
- Working exclusively with YouTube videos
- Good quality captions are available
- Quick prototyping or batch processing
- No authentication setup desired

## 🐛 Troubleshooting

### Audio-Based Issues
- **"No HuggingFace token"**: Set HUGGINGFACE_HUB_TOKEN environment variable
- **Model download fails**: Check internet connection and HF token permissions
- **FFmpeg errors**: Install FFmpeg for audio conversion
- **Memory issues**: Use shorter audio clips or increase system RAM

### Caption-Based Issues  
- **"No subtitles found"**: Video may lack captions or be private/restricted
- **Poor speaker detection**: Try audio-based method for better accuracy
- **Language issues**: Use `--language` parameter for non-English content

## 📈 Performance Tips

1. **Audio-Based**: Process shorter clips (5-15 minutes) for faster results
2. **Both Methods**: Use SSD storage for temp files
3. **Batch Processing**: Process multiple files sequentially
4. **Memory**: Close other applications during processing
5. **Network**: Stable connection for model downloads (audio-based)

## 🤝 Contributing

Both scripts are actively maintained. Key improvement areas:

- **Audio-Based**: Speaker voice characterization, emotion detection
- **Caption-Based**: Better pattern recognition, multi-language support  
- **Both**: Output format options, integration with other tools

## 📄 License

Open source - see repository license for details.

---

**Choose the method that best fits your needs: Audio-Based for maximum accuracy, Caption-Based for speed!**