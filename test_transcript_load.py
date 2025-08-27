#!/usr/bin/env python3
"""
Test script to isolate transcript loading without any audio processing
"""

import json
from pathlib import Path

def test_load_transcript():
    """Test loading existing timestamped transcript"""
    transcript_file = Path("audio_scripts/1323203-summer-2023-solution-5min-test-timestamped.json")
    
    print(f"📋 Testing transcript load: {transcript_file.name}")
    
    if not transcript_file.exists():
        print("❌ Transcript file not found")
        return None
    
    try:
        with open(transcript_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"✅ Loaded {len(data['segments'])} segments successfully")
        print(f"📊 Metadata: {data['metadata']}")
        print(f"🔤 First segment: {data['segments'][0] if data['segments'] else 'None'}")
        
        return data
        
    except Exception as e:
        print(f"❌ Error loading transcript: {e}")
        return None

if __name__ == "__main__":
    test_load_transcript()