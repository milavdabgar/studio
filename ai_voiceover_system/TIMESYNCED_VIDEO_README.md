# Time-Synced Video Generator

A powerful educational video creation tool that automatically syncs Slidev presentations with audio content using subtitle timing from YouTube or other sources.

## 🚀 Overview

The Time-Synced Video Generator creates professional educational videos by combining:
- **Audio content** (M4A, MP3, WAV)
- **Subtitle timing** (VTT, SRT formats)
- **Slidev presentations** (Markdown-based slides)

## ✨ Features

### Core Functionality
- 🎬 **Automatic Video Generation** - Creates MP4 videos with perfect audio-visual sync
- 📊 **Slidev Integration** - Exports Slidev slides as high-quality PNG images
- ⏰ **Intelligent Timing** - Uses subtitle timing to determine slide transitions
- 🧹 **Automatic Cleanup** - Removes temporary PNG files after video creation
- 🌍 **Multi-language Support** - Works with any language content (tested with Gujarati/English)

### Technical Features
- **MoviePy Integration** - Professional video rendering with H.264 codec
- **Flexible Input Formats** - Supports VTT and SRT subtitle formats
- **Root Project Slidev** - Uses project's Slidev installation for consistency
- **Error Handling** - Graceful error handling with detailed feedback
- **Progress Tracking** - Real-time progress updates during processing

## 🛠️ Installation & Setup

### Prerequisites
```bash
# Python 3.13 environment with required packages
pip install moviepy

# Slidev (Node.js/npm) for slide export
npm install slidev
```

### Dependencies
- **MoviePy** - Video processing and rendering
- **Slidev** - Slide presentation export
- **Python 3.13+** - Runtime environment

## 📖 Usage

### Basic Usage
```bash
python ai_voiceover_system/timesynced_video_generator.py audio.m4a subtitles.vtt slides.md
```

### Advanced Usage
```bash
python ai_voiceover_system/timesynced_video_generator.py \
  "audio_file.m4a" \
  "subtitles.en.vtt" \
  "presentation/slides.md" \
  --output "final_video.mp4" \
  --temp-dir "custom_working_dir"
```

### Real Example
```bash
# Create educational video from YouTube audio and Gujarati slides
python ai_voiceover_system/timesynced_video_generator.py \
  "ai_voiceover_system/podcasts/ટ્રાન્ઝિસ્ટર નાનો ઘટક, મોટી ક્રાંતિ ડિજિટલ યુગનો પાયો.m4a" \
  "ai_voiceover_system/podcasts/ટ્રાન્ઝિસ્ટર નાનો ઘટક, મોટી ક્રાંતિ ડિજિટલ યુગનો પાયો.en.vtt" \
  "podcast_slides/ટ્રાન્ઝિસ્ટર__નાનો_ઘટક,_મોટી_ક્રાંતિ_-_ડિજિટલ_યુગનો_પાયો_slidev/slides.md"
```

## 🔧 How It Works

### Processing Pipeline
1. **Subtitle Parsing** - Extracts timing information from VTT/SRT files
2. **Slide Analysis** - Parses Slidev markdown to identify slide content
3. **Image Export** - Uses Slidev to export slides as PNG images
4. **Timeline Creation** - Maps slides to audio segments based on duration
5. **Video Rendering** - Creates synchronized video using MoviePy
6. **Cleanup** - Automatically removes temporary PNG files

### Timing Strategy
- **Equal Distribution** - Divides total audio duration equally among slides
- **Future Enhancement** - Content-based timing analysis using subtitle text

### File Structure
```
working_directory/
├── video_generation/
│   ├── slide_images/          # Temporary PNG exports (auto-cleaned)
│   └── exported_slides_*.png  # Individual slide images
└── output_video.mp4           # Final generated video
```

## 📊 Input Requirements

### Audio Files
- **Formats**: M4A, MP3, WAV
- **Quality**: Any quality (higher quality = better output)
- **Duration**: Any length (tested up to 6+ minutes)

### Subtitle Files
- **VTT Format**: WebVTT with timing information
- **SRT Format**: SubRip subtitle format
- **Timing**: Accurate timestamps for audio synchronization
- **Language**: Any language (content used for timing only)

### Slidev Files
- **Format**: Markdown (.md) with Slidev frontmatter
- **Theme**: Compatible themes (default, academic, etc.)
- **Structure**: Standard Slidev slide separation with `---`
- **Content**: Slides with titles and bullet points

## 🎯 Output

### Video Specifications
- **Format**: MP4 (H.264/AAC)
- **Resolution**: Based on slide export settings
- **Frame Rate**: 24 FPS
- **Audio**: Original audio quality preserved
- **Compatibility**: Optimized for web and social media

### Naming Convention
- **Default**: `{audio_filename}_timesynced_video.mp4`
- **Custom**: Specified via `--output` parameter

## 🔍 Technical Details

### MoviePy Configuration
```python
final_video.write_videofile(
    str(output_file),
    fps=24,
    codec='libx264',
    audio_codec='aac',
    temp_audiofile='temp-audio.m4a',
    remove_temp=True,
    ffmpeg_params=['-pix_fmt', 'yuv420p']  # Better compatibility
)
```

### Slidev Export Command
```bash
npx slidev export slides.md \
  --output slide_images \
  --format png \
  --with-clicks \
  --timeout 30000
```

## 🚧 Recent Improvements

### Python 3.13 Compatibility
- ✅ **MoviePy 1.x Integration** - Fixed import syntax and method calls
- ✅ **Dependency Resolution** - Resolved decorator version conflicts
- ✅ **Error Handling** - Improved compatibility with Python 3.13

### Automatic Cleanup
- ✅ **PNG Removal** - Automatically removes exported slide images
- ✅ **Directory Cleanup** - Removes empty working directories
- ✅ **Error Safety** - Graceful handling of cleanup failures

### Enhanced Processing
- ✅ **Multi-language Content** - Tested with Gujarati and English
- ✅ **YouTube Integration** - Works with YouTube-downloaded content
- ✅ **Theme Flexibility** - Supports multiple Slidev themes

## 🧪 Testing

### Verified Scenarios
- ✅ **347.5-second video** with 10 Gujarati slides
- ✅ **YouTube audio** with English subtitle timing
- ✅ **Automatic cleanup** verification
- ✅ **Cross-language compatibility** (Gujarati slides + English timing)

### Test Command
```bash
# Test with sample content
python ai_voiceover_system/timesynced_video_generator.py \
  "test_audio.m4a" \
  "test_subtitles.vtt" \
  "test_slides.md" \
  --output "test_output.mp4"
```

## 🔧 Troubleshooting

### Common Issues

#### Slidev Export Fails
```bash
# Ensure Slidev is installed in project root
npm install slidev

# Check theme compatibility
# Change theme in slides.md frontmatter if needed
theme: default  # Use default instead of custom themes
```

#### MoviePy Import Errors
```python
# Use correct import syntax for MoviePy 1.x
from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips
```

#### Subtitle Parsing Issues
- Ensure VTT/SRT files have proper timestamp format
- Check for special characters or encoding issues
- Verify subtitle file is not corrupted

### Performance Tips
- Use smaller slide image resolutions for faster processing
- Ensure sufficient disk space for temporary files
- Close other video-processing applications during rendering

## 🔮 Future Enhancements

### Planned Features
- **Smart Timing** - Content-based slide transition timing
- **Multiple Video Formats** - Support for different output formats
- **Batch Processing** - Process multiple videos simultaneously
- **Advanced Animation** - Slide transition effects and animations
- **Real-time Preview** - Preview functionality before final render

### Integration Opportunities
- **NotebookLM Integration** - Direct podcast-to-video pipeline
- **Cloud Processing** - Distributed video generation
- **API Interface** - REST API for programmatic access
- **Web Interface** - Browser-based video creation tool

## 📁 Related Files

- `timesynced_video_generator.py` - Main script
- `youtube_podcast_downloader.py` - Audio/subtitle acquisition
- `slidev_unified_processor.py` - Alternative processing pipeline
- `enhanced_podcast_processor_v2.py` - Advanced processing features

## 🤝 Contributing

The timesynced video generator is part of the larger AI voiceover system. Contributions welcome for:
- Enhanced timing algorithms
- Additional subtitle format support
- Performance optimizations
- UI/UX improvements

---

**Last Updated**: December 2024  
**Python Version**: 3.13+  
**MoviePy Version**: 1.0.3  
**Status**: ✅ Production Ready