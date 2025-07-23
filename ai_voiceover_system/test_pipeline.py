#!/usr/bin/env python3
"""
Test Pipeline
=============

Simple test of the video creation pipeline components.
"""

import os
import sys
from pathlib import Path

# Set environment
os.environ['COQUI_TOS_AGREED'] = '1'
os.environ['COQUI_TTS_AGREED'] = '1'

def test_tts():
    """Test TTS voice cloning"""
    print("🎤 Testing TTS voice cloning...")
    
    try:
        from TTS.api import TTS
        
        # Load model
        tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
        
        # Test text
        test_text = "This is a test of the AI voice cloning system. The technology can create realistic speech from your voice sample."
        
        # Generate audio
        voice_sample = "milav_voice_sample.wav"
        output_file = "test_tts_output.wav"
        
        if os.path.exists(voice_sample):
            tts.tts_to_file(
                text=test_text,
                speaker_wav=voice_sample,
                language="en",
                file_path=output_file
            )
            
            if os.path.exists(output_file):
                print(f"✅ TTS test successful: {output_file}")
                return True
            else:
                print("❌ TTS output file not created")
                return False
        else:
            print(f"❌ Voice sample not found: {voice_sample}")
            return False
            
    except Exception as e:
        print(f"❌ TTS test failed: {e}")
        return False

def test_image_creation():
    """Test slide image creation"""
    print("📸 Testing slide image creation...")
    
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Create test image
        img = Image.new('RGB', (1920, 1080), (255, 255, 255))
        draw = ImageDraw.Draw(img)
        
        # Add text
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 64)
        except:
            font = ImageFont.load_default()
        
        draw.text((100, 100), "Test Slide", fill=(0, 0, 0), font=font)
        draw.text((100, 200), "This is a test slide image", fill=(64, 64, 64), font=font)
        
        # Save image
        output_file = "test_slide.png"
        img.save(output_file)
        
        print(f"✅ Image creation test successful: {output_file}")
        return True
        
    except Exception as e:
        print(f"❌ Image creation test failed: {e}")
        return False

def test_video_creation():
    """Test basic video creation"""
    print("🎬 Testing video creation...")
    
    try:
        from moviepy import ImageClip, AudioFileClip, concatenate_videoclips
        
        # Check if test files exist
        if not os.path.exists("test_slide.png"):
            print("❌ Test slide image not found")
            return False
        
        if not os.path.exists("test_tts_output.wav"):
            print("❌ Test audio not found")
            return False
        
        # Create video clip
        audio_clip = AudioFileClip("test_tts_output.wav")
        image_clip = ImageClip("test_slide.png").with_duration(audio_clip.duration)
        video_clip = image_clip.with_audio(audio_clip)
        
        # Export video
        output_file = "test_video.mp4"
        video_clip.write_videofile(
            output_file,
            fps=30,
            codec='libx264',
            audio_codec='aac'
        )
        
        # Clean up
        video_clip.close()
        audio_clip.close()
        image_clip.close()
        
        if os.path.exists(output_file):
            print(f"✅ Video creation test successful: {output_file}")
            return True
        else:
            print("❌ Video file not created")
            return False
        
    except Exception as e:
        print(f"❌ Video creation test failed: {e}")
        return False

def create_sample_slide_file():
    """Create a simple sample slide file"""
    content = """---
title: Voice Cloning Test
---

# Introduction to AI Voice Cloning

Welcome to this demonstration of AI voice cloning technology.

This system can create realistic speech using your voice sample.

---

# Key Features

The voice cloning system includes:

- High-quality voice synthesis
- Natural speech patterns  
- Professional audio output
- Fast processing speed

This technology enables personalized educational content.

---

# Thank You

This concludes our voice cloning demonstration.

The system successfully created this presentation with your authentic voice.
"""
    
    with open("test_slides.md", "w") as f:
        f.write(content)
    
    print("📝 Created test slides: test_slides.md")
    return "test_slides.md"

def main():
    """Run pipeline tests"""
    print("🧪 Video Pipeline Component Tests")
    print("=" * 50)
    
    # Test components individually
    results = {
        'tts': test_tts(),
        'image': test_image_creation(),
        'video': test_video_creation()
    }
    
    # Summary
    print("\n📊 Test Results:")
    print("-" * 30)
    
    for test_name, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_name:>10}: {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All tests passed! Pipeline components are working.")
        
        # Create sample slides for further testing
        slide_file = create_sample_slide_file()
        print(f"\n🚀 Ready for full pipeline test with: {slide_file}")
        
    else:
        print("\n❌ Some tests failed. Check dependencies and setup.")
    
    return all_passed

if __name__ == "__main__":
    main()