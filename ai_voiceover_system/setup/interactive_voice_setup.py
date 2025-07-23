#!/usr/bin/env python3
"""
Interactive Voice Cloning Setup
===============================

Guide for setting up Coqui TTS with license agreement.
This will enable your authentic voice cloning.

Author: AI Assistant
Date: 2024-07-23
"""

import os
import sys
from pathlib import Path

def setup_voice_cloning():
    """Interactive setup for voice cloning"""
    print("🎭 Interactive Voice Cloning Setup")
    print("=" * 50)
    
    print("\n📋 **IMPORTANT: License Agreement Required**")
    print("Coqui TTS requires a one-time license agreement.")
    print("You have two options:")
    print()
    print("1. **Commercial License**: If you have purchased a commercial license")
    print("2. **Non-Commercial CPML**: For educational/research use (FREE)")
    print()
    print("Since this is for educational lectures, you should choose option 2.")
    print()
    
    print("🎯 **STEP-BY-STEP PROCESS:**")
    print()
    print("1. Run the command below")
    print("2. When prompted, type 'y' and press Enter")
    print("3. This accepts the non-commercial license")
    print("4. The model will download (may take a few minutes)")
    print("5. Voice cloning will be ready!")
    print()
    
    print("💻 **RUN THIS COMMAND:**")
    print("```bash")
    print("python -c \"from TTS.api import TTS; TTS('tts_models/multilingual/multi-dataset/xtts_v2')\"")
    print("```")
    print()
    
    print("📝 **WHAT YOU'LL SEE:**")
    print('When you see: "I agree to the terms of the non-commercial CPML: https://coqui.ai/cpml" - [y/n]')
    print("Type: y")
    print("Press: Enter")
    print()
    
    print("🔄 **AFTER SETUP:**")
    print("Once setup is complete, run:")
    print("```bash")
    print("python voice_clone_with_license.py")
    print("```")
    print()
    
    print("✨ **RESULT:**")
    print("You'll get authentic voice-cloned audio using your Gujarati voice sample!")
    

if __name__ == "__main__":
    setup_voice_cloning()