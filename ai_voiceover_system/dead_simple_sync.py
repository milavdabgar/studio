#!/usr/bin/env python3
"""
Dead Simple Slide Sync
======================
Match slide speaker notes to audio. Display each slide when its speaker notes are mentioned.
No complexity, no hardcoding, just direct matching.
"""

import json
from pathlib import Path
from typing import List, Dict, Tuple
from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips

def load_audio_segments(transcript_file: Path) -> List[Dict]:
    """Load audio segments from transcript"""
    with open(transcript_file, 'r') as f:
        data = json.load(f)
    return data.get('segments', [])

def extract_speaker_notes(slide_content: str) -> str:
    """Extract speaker notes from slide"""
    if '<!--' not in slide_content or '-->' not in slide_content:
        return ""
    
    start = slide_content.find('<!--')
    end = slide_content.find('-->') + 3
    notes = slide_content[start:end]
    
    # Clean up
    notes = notes.replace('<!--', '').replace('-->', '').strip()
    return notes

def parse_slides(slides_file: Path) -> List[Dict]:
    """Parse slides and extract speaker notes"""
    with open(slides_file, 'r') as f:
        content = f.read()
    
    slides = []
    slide_parts = content.split('---\n')[1:]  # Skip header
    
    for i, part in enumerate(slide_parts, 1):
        if part.strip():
            notes = extract_speaker_notes(part)
            slides.append({
                'number': i,
                'notes': notes
            })
    
    return slides

def find_when_notes_are_spoken(notes: str, audio_segments: List[Dict]) -> float:
    """Find when these speaker notes are mentioned in audio"""
    if not notes:
        return 0
    
    # Take first meaningful sentence from notes
    sentences = [s.strip() for s in notes.split('.') if len(s.strip()) > 10]
    if not sentences:
        return 0
    
    first_sentence = sentences[0].lower()
    words = first_sentence.split()[:8]  # First 8 words
    
    # Find best matching audio segment
    best_time = 0
    best_score = 0
    
    for segment in audio_segments:
        audio_text = segment.get('text', '').lower()
        
        # Count word matches
        matches = sum(1 for word in words if word in audio_text and len(word) > 2)
        
        if matches > best_score:
            best_score = matches
            best_time = segment.get('start', 0)
    
    return best_time

def create_slide_timeline(slides: List[Dict], audio_segments: List[Dict]) -> List[Tuple[int, float, float]]:
    """Create timeline: (slide_number, start_time, duration)"""
    timeline = []
    
    print("🎯 Creating slide timeline...")
    
    for slide in slides:
        start_time = find_when_notes_are_spoken(slide['notes'], audio_segments)
        
        if start_time > 0 or slide['number'] == 1:  # Always include first slide
            timeline.append({
                'slide': slide['number'],
                'start': start_time,
                'notes_preview': slide['notes'][:80] + "..." if len(slide['notes']) > 80 else slide['notes']
            })
            print(f"   📍 Slide {slide['number']}: {start_time:.1f}s")
    
    # Sort by start time
    timeline.sort(key=lambda x: x['start'])
    
    # Calculate durations
    for i in range(len(timeline)):
        if i < len(timeline) - 1:
            duration = timeline[i + 1]['start'] - timeline[i]['start']
            timeline[i]['duration'] = max(5.0, duration)
        else:
            timeline[i]['duration'] = 10.0
    
    return timeline

def create_synced_video(timeline: List[Dict], audio_file: Path, image_dir: Path) -> Path:
    """Create synced video from timeline"""
    print("🎥 Creating synced video...")
    
    # Load audio
    audio = AudioFileClip(str(audio_file))
    
    # Get available slide images
    png_files = sorted(image_dir.glob("*.png"))
    
    video_clips = []
    
    for entry in timeline:
        slide_num = entry['slide']
        duration = entry['duration']
        
        # Find matching image - try different formats
        image_file = None
        for png in png_files:
            # Check if filename starts with slide number
            if png.name.startswith(f"{slide_num:03d}-") or png.name.startswith(f"{slide_num:02d}-"):
                image_file = png
                break
        
        if not image_file and png_files:
            # Use sequential fallback
            idx = min(len(png_files) - 1, slide_num - 1)
            image_file = png_files[idx]
        
        if image_file:
            clip = ImageClip(str(image_file), duration=duration)
            video_clips.append(clip)
            print(f"   🎬 {image_file.name}: {entry['start']:.1f}s ({duration:.1f}s)")
    
    if not video_clips:
        print("❌ No video clips created")
        return None
    
    # Create final video
    video = concatenate_videoclips(video_clips)
    
    # Match audio length
    if video.duration > audio.duration:
        video = video.subclip(0, audio.duration)
    elif video.duration < audio.duration:
        # Extend last clip to match audio
        if video_clips:
            last_clip = video_clips[-1]
            extension = audio.duration - video.duration
            extended_clip = last_clip.set_duration(last_clip.duration + extension)
            video_clips[-1] = extended_clip
            video = concatenate_videoclips(video_clips)
    
    final_video = video.set_audio(audio)
    
    # Save with audio codec specified
    output_file = audio_file.parent / f"{audio_file.stem}_dead_simple.mp4"
    final_video.write_videofile(
        str(output_file), 
        fps=24, 
        codec='libx264',
        audio_codec='aac',
        verbose=False, 
        logger=None
    )
    
    # Cleanup
    audio.close()
    video.close()
    final_video.close()
    
    return output_file

def main():
    # File paths
    audio_file = Path("ai_voiceover_system/podcasts/1323203-summer-2023-solution-5min-test.m4a")
    slides_file = Path("slidev/python-programming-fundamentals-conversational.md")
    transcript_file = Path("audio_scripts/1323203-summer-2023-solution-5min-test-timestamped.json")
    image_dir = Path("enhanced_podcast_output")
    
    print("🎯 Dead Simple Slide Sync")
    print(f"   🎵 {audio_file.name}")
    print(f"   📊 {slides_file.name}")
    print(f"   📝 {transcript_file.name}")
    
    # Load data
    audio_segments = load_audio_segments(transcript_file)
    slides = parse_slides(slides_file)
    
    print(f"📊 {len(slides)} slides, {len(audio_segments)} audio segments")
    
    # Create timeline
    timeline = create_slide_timeline(slides, audio_segments)
    
    # Create video
    video_file = create_synced_video(timeline, audio_file, image_dir)
    
    if video_file:
        print(f"🎉 SUCCESS: {video_file}")
    else:
        print("❌ Failed")

if __name__ == "__main__":
    main()