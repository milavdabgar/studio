#!/bin/bash

# Setup script for YouTube Audio Script Generator
# Installs all required dependencies for audio-based transcription

set -e

echo "🚀 Setting up YouTube Audio Script Generator"
echo "============================================"

# Check if we're in a virtual environment
if [[ "$VIRTUAL_ENV" != "" ]]; then
    echo "✅ Using virtual environment: $VIRTUAL_ENV"
else
    echo "⚠️  Recommend using a virtual environment"
    echo "   Run: python -m venv .venv && source .venv/bin/activate"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📦 Installing core dependencies..."
pip install --upgrade pip

# Core dependencies
echo "Installing yt-dlp..."
pip install yt-dlp

echo "Installing whisper-timestamped (enhanced Whisper with word timestamps)..."
pip install whisper-timestamped

echo "Installing PyTorch (required for Whisper)..."
pip install torch torchvision torchaudio

# Optional but recommended for better speaker diarization
echo "Installing pyannote.audio for speaker diarization..."
pip install pyannote.audio

# Audio processing
echo "Installing additional audio utilities..."
pip install librosa soundfile

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 What was installed:"
echo "   ✅ yt-dlp - YouTube video/audio downloading"
echo "   ✅ whisper-timestamped - State-of-the-art speech recognition"
echo "   ✅ torch - PyTorch for AI models"
echo "   ✅ pyannote.audio - Speaker diarization (who speaks when)"
echo "   ✅ librosa/soundfile - Audio processing utilities"
echo ""
echo "🚀 Ready to use!"
echo "   python youtube-to-audio-script.py 'https://youtube.com/watch?v=...' "
echo ""
echo "🔑 For BEST speaker detection, set up HuggingFace authentication:"
echo "   1. Visit: https://huggingface.co/settings/tokens"
echo "   2. Create a 'Read' token (free)"
echo "   3. Accept terms at: https://huggingface.co/pyannote/speaker-diarization-3.1"
echo "   4. Set environment variable:"
echo "      export HUGGINGFACE_HUB_TOKEN='your_token_here'"
echo ""
echo "💡 First run will download models (~1.5GB) - this is normal"
echo "   Subsequent runs will be much faster"