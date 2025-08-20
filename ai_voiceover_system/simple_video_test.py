#!/usr/bin/env python3
"""
Simple test to create a working educational video
"""

from moviepy.editor import AudioFileClip, ColorClip, TextClip, CompositeVideoClip

def create_simple_educational_video():
    # Load audio (first 30 seconds only)
    audio_file = "ai_voiceover_system/podcasts/ટ્રાન્ઝિસ્ટર__નાનો_ઘટક,_મોટી_ક્રાંતિ_-_ડિજિટલ_યુગનો_પાયો.m4a"
    audio = AudioFileClip(audio_file).subclip(0, 30)  # 30 seconds only
    
    # Create background
    bg = ColorClip(size=(1920, 1080), color=(26, 26, 46), duration=30)
    
    # Create title slide (first 15 seconds)
    title = TextClip(
        "Transistor: Digital Revolution",
        fontsize=80,
        color='white',
        method='caption',
        size=(1600, None)
    ).set_position('center').set_duration(15)
    
    # Create content slide (last 15 seconds)  
    content = TextClip(
        "• Small component, big revolution\\n• Foundation of digital age\\n• From NotebookLM AI Podcast",
        fontsize=50,
        color='white',
        method='caption',
        size=(1600, None)
    ).set_position('center').set_duration(15).set_start(15)
    
    # Combine elements
    video = CompositeVideoClip([bg, title, content])
    video = video.set_audio(audio)
    
    # Render with high compatibility
    output_path = "podcast_videos/Transistor_Test_30sec.mp4"
    print(f"Creating 30-second test video: {output_path}")
    
    video.write_videofile(
        output_path,
        fps=30,
        codec='libx264',
        audio_codec='aac',
        preset='medium',
        bitrate='2M',
        temp_audiofile='temp_audio.m4a',
        remove_temp=True,
        write_logfile=False,
        verbose=True
    )
    
    # Cleanup
    audio.close()
    video.close()
    
    print(f"✅ Test video created: {output_path}")
    return output_path

if __name__ == "__main__":
    create_simple_educational_video()