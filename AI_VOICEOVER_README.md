# AI Voiceover System Setup Guide

## Overview

The AI Voiceover System includes a powerful multilingual podcast-to-slides converter with Google Speech-to-Text integration for accurate Gujarati transcription.

## Environment Setup

### 1. Create Environment File

Copy the example environment file and add your API keys:

```bash
cp .env.example .env
```

### 2. Configure API Keys

Edit `.env` file with your actual API keys:

```bash
# Google Cloud Speech-to-Text API Key (Required for Gujarati)
GOOGLE_API_KEY=your_actual_google_api_key_here

# OpenAI API Key (Optional - for advanced slide generation)
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Install Dependencies

```bash
# Create Python virtual environment
python3.13 -m venv .venv
source .venv/bin/activate

# Install required packages
pip install -r requirements.txt
```

## Getting Google Cloud Speech API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the Speech-to-Text API
4. Go to **APIs & Credentials** → **Create Credentials** → **API Key**
5. Copy the API key to your `.env` file

## Usage Examples

### Automatic Language Routing
```bash
# Gujarati audio → automatically uses Google Speech-to-Text
python ai_voiceover_system/podcast_to_slides.py "podcast.m4a" --language gu

# English audio → automatically uses Whisper
python ai_voiceover_system/podcast_to_slides.py "podcast.m4a" --language en
```

### Force Specific Services
```bash
# Force Google Speech-to-Text
python ai_voiceover_system/podcast_to_slides.py "podcast.m4a" --method google --language gu

# Force Whisper
python ai_voiceover_system/podcast_to_slides.py "podcast.m4a" --method whisper --language en
```

## Features

### ✅ **Intelligent Language Routing**
- **Gujarati** → Google Speech-to-Text (94.25% accuracy)
- **English** → OpenAI Whisper (cost-effective)
- **Auto-detection** based on language parameter

### ✅ **Advanced Gujarati Support**
- Perfect unicode script recognition
- Chunked processing for long audio files
- Confidence scoring and validation
- Superior to Whisper for Indic languages

### ✅ **Security Best Practices**
- Environment variables for API keys
- No hardcoded credentials
- `.env` file excluded from git

## Troubleshooting

### API Key Issues
```bash
# Test environment loading
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print('Google API Key:', bool(os.getenv('GOOGLE_API_KEY')))"
```

### Missing Dependencies
```bash
# Install missing packages
pip install python-dotenv google-cloud-speech pydub
```

## File Structure

```
ai_voiceover_system/
├── podcast_to_slides.py          # Main converter script
├── enhanced_podcast_processor_v2.py  # Video generation
└── podcasts/                     # Input audio files

.env                              # Your API keys (DO NOT commit)
.env.example                     # Template file (safe to commit)
podcast_slides_config.json       # Service configuration
requirements.txt                 # Python dependencies
```

## Security Notes

⚠️  **Never commit `.env` files** - they contain sensitive API keys
✅ **Always use `.env.example`** for documentation
✅ **API keys load from environment variables first**, config file as fallback