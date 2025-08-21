#!/usr/bin/env python3
"""
Convert audio to YouTube-compatible format
"""
import sys
from moviepy.editor import AudioFileClip
import os

def convert_audio_for_youtube(input_file, output_file=None):
    """Convert audio to MP3 format for YouTube compatibility."""
    if not os.path.exists(input_file):
        print(f"❌ Error: Input file '{input_file}' not found!")
        return None
    
    if output_file is None:
        # Create output filename
        base_name = os.path.splitext(input_file)[0]
        output_file = f"{base_name}_youtube.mp3"
    
    try:
        print(f"🔄 Converting '{input_file}' to YouTube-compatible MP3...")
        
        # Load audio file
        audio = AudioFileClip(input_file)
        
        # Export as MP3 with good quality
        audio.write_audiofile(
            output_file,
            codec='mp3',
            bitrate='192k',
            verbose=False,
            logger=None
        )
        
        # Clean up
        audio.close()
        
        print(f"✅ Converted successfully: {output_file}")
        return output_file
        
    except Exception as e:
        print(f"❌ Conversion failed: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python convert_audio.py <input_audio_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    result = convert_audio_for_youtube(input_file)
    
    if result:
        print(f"\n🎵 Ready for YouTube upload: {result}")
    else:
        print("\n❌ Conversion failed")
        sys.exit(1)