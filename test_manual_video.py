#!/usr/bin/env python3
"""
Manual Video Test - Bypass Slidev Export
========================================

Test video generation using existing slide images to bypass slidev export issues.
"""

import sys
import os
from pathlib import Path

# Add current directory to path
sys.path.append('ai_voiceover_system')

def test_manual_video_generation():
    """Test video generation using existing slide images"""
    
    # Import after path setup
    from slidev_comprehensive_processor import SlidevComprehensiveProcessor
    
    print("🧪 Manual Video Generation Test")
    print("=" * 50)
    
    # Use existing slide images
    slide_images_dir = "ai_voiceover_system/slide_images"
    
    # Get first 3 slide images
    slide_files = list(Path(slide_images_dir).glob("*.png"))
    slide_files.sort()
    
    if len(slide_files) < 3:
        print(f"❌ Need at least 3 slide images, found {len(slide_files)}")
        return
    
    print(f"📊 Found {len(slide_files)} slide images")
    
    # Create test slide data
    test_slides = [
        {
            'number': 1,
            'title': 'Welcome to Test',
            'speaker_notes': 'Dr. James: Welcome to our comprehensive test of the video processor. Sarah: Hi everyone! This is our first test slide.'
        },
        {
            'number': 2,
            'title': 'Features Overview',
            'speaker_notes': 'This slide demonstrates the main features of our comprehensive processor including multi-speaker support and various TTS providers.'
        },
        {
            'number': 3,
            'title': 'Thank You',
            'speaker_notes': 'Dr. James: Thank you for watching our test. Sarah: We hope this demonstrates our capabilities!'
        }
    ]
    
    # Test different TTS providers
    providers = ['gtts', 'gcloud']
    
    for provider in providers:
        print(f"\n🎤 Testing with {provider.upper()} provider")
        print("-" * 30)
        
        try:
            # Create processor instance
            processor = SlidevComprehensiveProcessor("test", provider)
            
            # Manually set the slides directory to use existing images
            processor.slides_dir = slide_images_dir
            
            # Test video generation with manual slide processing
            video_clips = []
            total_duration = 0
            
            for i, slide_data in enumerate(test_slides):
                if i >= len(slide_files):
                    break
                
                slide_file = slide_files[i]
                slide_num = slide_data['number']
                narration = slide_data['speaker_notes']
                
                print(f"   🎞️ Processing slide {slide_num}: {slide_data['title']}")
                print(f"   📝 Narration: {narration[:60]}...")
                
                # Generate audio
                audio_file = f"test_manual_{provider}_slide_{slide_num}.mp3"
                processor.temp_audio_files.append(audio_file)
                
                if processor.generate_audio(narration, audio_file):
                    try:
                        from moviepy.editor import ImageClip, AudioFileClip
                        
                        audio_clip = AudioFileClip(audio_file)
                        duration = audio_clip.duration
                        total_duration += duration
                        
                        image_clip = ImageClip(str(slide_file), duration=duration)
                        video_clip = image_clip.set_audio(audio_clip)
                        video_clips.append(video_clip)
                        
                        print(f"   ✅ Generated ({duration:.1f}s)")
                    except Exception as e:
                        print(f"   ❌ Video clip error: {str(e)[:50]}...")
                        continue
                else:
                    print(f"   ❌ Audio generation failed")
            
            # Create final video
            if video_clips:
                from moviepy.editor import concatenate_videoclips
                
                print(f"\n📹 Creating final video...")
                print(f"   📊 Clips: {len(video_clips)}")
                print(f"   ⏱️ Duration: {total_duration:.1f}s")
                
                final_video = concatenate_videoclips(video_clips)
                output_file = f"test_manual_{provider}_video.mp4"
                
                final_video.write_videofile(
                    output_file,
                    fps=30,
                    codec='libx264',
                    audio_codec='aac',
                    bitrate="4000k"
                )
                
                # Cleanup
                for clip in video_clips:
                    clip.close()
                final_video.close()
                
                file_size = os.path.getsize(output_file) / (1024 * 1024)
                print(f"   ✅ Video created: {output_file} ({file_size:.1f}MB)")
            
            # Cleanup temp files
            processor.cleanup_temp_files()
            
        except Exception as e:
            print(f"❌ Error with {provider}: {str(e)}")
    
    print(f"\n🎉 Manual video generation test complete!")

if __name__ == "__main__":
    # Change to studio directory
    os.chdir('/Users/milav/Code/studio')
    test_manual_video_generation()