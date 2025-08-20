#!/bin/bash
# Java Slidev Video Generator - Setup Script

echo "🎯 Setting up Java Slidev Video Generator..."
echo "=============================================="

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "✅ Python3 found: $(python3 --version)"
else
    echo "❌ Python3 not found. Please install Python 3.9+ first."
    exit 1
fi

# Check if Node.js is available
if command -v node &> /dev/null; then
    echo "✅ Node.js found: $(node --version)"
else
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if npm is available
if command -v npm &> /dev/null; then
    echo "✅ npm found: $(npm --version)"
else
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

echo ""
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

echo ""
echo "📦 Installing Node.js dependencies..."
npm install -D playwright-chromium

echo ""
echo "🌐 Installing Slidev CLI globally (if not already installed)..."
if ! command -v slidev &> /dev/null; then
    npm install -g @slidev/cli
    echo "✅ Slidev CLI installed"
else
    echo "✅ Slidev CLI already installed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Usage:"
echo "  python slidev_unified_processor.py <slidev_file.md> [max_slides] [--tts=provider]"
echo ""
echo "📋 Example:"
echo "  python slidev_unified_processor.py lecture-01.md 5 --tts=gtts"
echo ""
echo "🎤 Available TTS providers:"
echo "  - gtts (Google TTS UK - default)"
echo "  - elevenlabs (requires ELEVENLABS_API_KEY)"
echo "  - coqui (requires Python <3.12)"
echo "  - auto (fallback hierarchy)"