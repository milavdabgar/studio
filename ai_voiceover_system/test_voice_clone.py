#!/usr/bin/env python3
"""
Test Voice Cloning Setup
========================

Simple test to verify voice cloning is working with downloaded voice sample.
"""

import os
import sys

def test_voice_cloning():
    """Test voice cloning setup"""
    try:
        # Set environment variables
        os.environ['COQUI_TOS_AGREED'] = '1'
        
        # Import TTS
        from TTS.api import TTS
        
        # Initialize XTTS v2 model
        print("Loading XTTS v2 model...")
        tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
        
        # Check if voice sample exists
        voice_sample = "milav_voice_sample.wav"
        if not os.path.exists(voice_sample):
            print(f"Error: Voice sample not found at {voice_sample}")
            return False
        
        # Test text
        test_text = "Hello! This is a test of voice cloning using your authentic voice sample from the YouTube video."
        
        # Generate audio
        print("Generating test audio...")
        tts.tts_to_file(
            text=test_text,
            speaker_wav=voice_sample,
            language="en",
            file_path="test_voice_clone_output.wav"
        )
        
        print("✅ Voice cloning test successful!")
        print("Output saved as: test_voice_clone_output.wav")
        return True
        
    except Exception as e:
        print(f"❌ Voice cloning test failed: {e}")
        return False

if __name__ == "__main__":
    test_voice_cloning()