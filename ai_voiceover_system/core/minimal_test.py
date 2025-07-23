#!/usr/bin/env python3
"""
Minimal Test - Just Check What's Happening
==========================================

Let's see exactly what the TTS library is doing.
"""

import os
import sys

# Set all possible environment variables
os.environ['COQUI_TOS_AGREED'] = '1'
os.environ['TTS_CACHE_DIR'] = '/Users/milav/Library/Application Support/tts'

print("🔍 Minimal TTS Test")
print("=" * 30)

print("Environment variables:")
print(f"COQUI_TOS_AGREED: {os.environ.get('COQUI_TOS_AGREED')}")
print(f"TTS_CACHE_DIR: {os.environ.get('TTS_CACHE_DIR')}")

print("\nTrying to import TTS...")
try:
    from TTS.api import TTS
    print("✅ TTS imported successfully")
    
    print("\nChecking model availability...")
    
    # Try to create TTS instance but don't let it download
    print("Creating TTS instance...")
    
    # Let's see what happens
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", progress_bar=True)
    
    print("✅ TTS instance created!")
    print("🎉 SUCCESS - Model is ready!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print(f"Error type: {type(e)}")