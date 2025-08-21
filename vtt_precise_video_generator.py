#!/usr/bin/env python3
"""
VTT-Precise Video Generator
Uses the VTT-synchronized timing from speaker notes to create perfectly timed videos
"""

import re
import os
import sys
import subprocess
from pathlib import Path
from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips
import json

def parse_vtt_timing_from_slides(slides_md_path):
    """Extract VTT timing information from the speaker notes in slides.md"""
    
    with open(slides_md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    timing_data = []
    
    # Find all VTT timing patterns in speaker notes
    vtt_patterns = re.findall(r'\[click\] \((\d+:\d+)-(\d+:\d+)\).*?⏰ Timing: VTT (\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})', content, re.MULTILINE | re.DOTALL)
    
    for start_simple, end_simple, vtt_start, vtt_end in vtt_patterns:
        # Convert VTT timestamps to seconds
        start_seconds = parse_vtt_timestamp(vtt_start)
        end_seconds = parse_vtt_timestamp(vtt_end)
        
        timing_data.append({
            'start': start_seconds,
            'end': end_seconds,
            'duration': end_seconds - start_seconds
        })
    
    print(f"✅ Extracted {len(timing_data)} VTT-precise timing segments")
    return timing_data

def parse_vtt_timestamp(timestamp_str):
    """Convert VTT timestamp (HH:MM:SS.mmm) to seconds"""
    parts = timestamp_str.split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    seconds_parts = parts[2].split('.')
    seconds = int(seconds_parts[0])
    milliseconds = int(seconds_parts[1])
    
    total_seconds = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000
    return total_seconds

def get_slide_images_in_order(slide_images_dir):
    """Get slide images in proper click order"""
    image_files = []
    
    # Pattern: 001-01.png, 001-02.png, etc.
    for img_file in sorted(Path(slide_images_dir).glob("*.png")):
        image_files.append(str(img_file))
    
    return image_files

def create_vtt_precise_video(audio_path, slides_md_path, output_path):
    """Create video with VTT-precise timing"""
    
    print("🎯 Creating VTT-Precise Time-Synced Video")
    print(f"   🎵 Audio: {Path(audio_path).name}")
    print(f"   📊 Slides: {Path(slides_md_path).name}")
    print(f"   🎬 Output: {output_path}")
    
    # Parse VTT timing data from slides
    timing_data = parse_vtt_timing_from_slides(slides_md_path)
    
    if not timing_data:
        print("❌ No VTT timing data found in speaker notes")
        return False
    
    # Export slides first
    slides_dir = Path(slides_md_path).parent
    slide_images_dir = slides_dir / "vtt_slide_images"
    
    print("🖼️  Exporting Slidev slides...")
    export_cmd = [
        "npx", "slidev", "export", "slides.md",
        "--output", str(slide_images_dir),
        "--format", "png",
        "--with-clicks",
        "--timeout", "90000"
    ]
    
    subprocess.run(export_cmd, cwd=slides_dir, check=True)
    
    # Get slide images
    image_files = get_slide_images_in_order(slide_images_dir)
    
    if not image_files:
        print("❌ No slide images found")
        return False
        
    print(f"✅ Found {len(image_files)} slide images")
    
    # Load audio
    audio = AudioFileClip(audio_path)
    total_duration = audio.duration
    
    # Create video clips with VTT timing
    video_clips = []
    current_image_idx = 0
    
    for i, timing in enumerate(timing_data):
        if current_image_idx >= len(image_files):
            break
            
        # Use actual VTT timing
        start_time = timing['start']
        duration = timing['duration']
        
        # Make sure we don't exceed audio duration
        if start_time >= total_duration:
            break
            
        if start_time + duration > total_duration:
            duration = total_duration - start_time
        
        print(f"   Image {i+1:2d}: {start_time:6.1f}s-{start_time+duration:6.1f}s ({duration:4.1f}s) - {Path(image_files[current_image_idx]).name}")
        
        # Create image clip with precise timing
        img_clip = ImageClip(image_files[current_image_idx]).set_duration(duration)
        video_clips.append(img_clip)
        
        current_image_idx += 1
    
    # Handle any remaining duration with last image
    if video_clips:
        last_timing_end = sum(clip.duration for clip in video_clips)
        if last_timing_end < total_duration:
            remaining_duration = total_duration - last_timing_end
            print(f"   Image {len(video_clips)+1:2d}: {last_timing_end:6.1f}s-{total_duration:6.1f}s ({remaining_duration:4.1f}s) - {Path(image_files[-1]).name} (final)")
            
            final_clip = ImageClip(image_files[-1]).set_duration(remaining_duration)
            video_clips.append(final_clip)
    
    print(f"✅ Created {len(video_clips)} precisely timed video segments")
    
    # Concatenate video clips
    print("🎬 Assembling video with VTT-precise timing...")
    final_video = concatenate_videoclips(video_clips)
    final_video = final_video.set_audio(audio)
    
    # Write video
    print(f"🎥 Rendering VTT-precise video: {output_path}")
    final_video.write_videofile(output_path, fps=24, codec='libx264', audio_codec='aac')
    
    # Cleanup
    print("🧹 Cleaning up slide images...")
    for img_file in image_files:
        os.remove(img_file)
    slide_images_dir.rmdir()
    
    print(f"✅ VTT-Precise video created: {output_path}")
    return True

def main():
    if len(sys.argv) != 4:
        print("Usage: python vtt_precise_video_generator.py <audio.m4a> <slides.md> <output.mp4>")
        sys.exit(1)
    
    audio_path = sys.argv[1]
    slides_md_path = sys.argv[2]
    output_path = sys.argv[3]
    
    # Validate files exist
    if not Path(audio_path).exists():
        print(f"❌ Audio file not found: {audio_path}")
        sys.exit(1)
        
    if not Path(slides_md_path).exists():
        print(f"❌ Slides file not found: {slides_md_path}")
        sys.exit(1)
    
    success = create_vtt_precise_video(audio_path, slides_md_path, output_path)
    
    if success:
        print("🎉 VTT-Precise video generation completed successfully!")
        sys.exit(0)
    else:
        print("❌ Video generation failed")
        sys.exit(1)

if __name__ == "__main__":
    main()