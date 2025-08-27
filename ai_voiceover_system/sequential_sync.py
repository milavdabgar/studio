#!/usr/bin/env python3
"""
Sequential Slide Sync
=====================
Simple: Use slides in ORDER and find when each slide's content is mentioned in audio.
No random slides, just proper sequence.
"""

import json
from pathlib import Path
from typing import List, Dict
from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips

def load_transcript(file_path: Path) -> List[Dict]:
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data.get('segments', [])

def parse_slides_in_order(file_path: Path) -> List[Dict]:
    """Parse slides maintaining their original order"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    slides = []
    parts = content.split('---\n')[1:]  # Skip header
    
    for i, part in enumerate(parts, 1):
        if part.strip():
            # Extract speaker notes
            notes = ""
            if '<!--' in part:
                start = part.find('<!--')
                end = part.find('-->') + 3
                notes = part[start:end].replace('<!--', '').replace('-->', '').strip()
            
            # Extract title
            lines = part.split('\n')
            title = "Untitled"
            for line in lines:
                line = line.strip()
                if line.startswith('# ') and not line.startswith('## '):
                    title = line[2:].strip()
                    break
            
            slides.append({
                'number': i,
                'title': title,
                'notes': notes,
                'has_notes': len(notes) > 10
            })
    
    return slides

def find_slide_start_time(slide: Dict, transcript: List[Dict]) -> float:
    """Find when this slide should start based on its content"""
    
    if not slide['has_notes']:
        return 0  # No notes = start immediately
    
    # Look for key phrases from speaker notes in transcript
    notes = slide['notes'].lower()
    
    # Extract meaningful phrases (skip [click] markers and speaker names)
    phrases = []
    for line in notes.split('\n'):
        line = line.strip().lower()
        if not line or len(line) < 10:
            continue
        
        # Remove [click] markers
        line = line.replace('[click]', '').strip()
        
        # Remove speaker names
        if 'dr. james:' in line:
            line = line.split('dr. james:', 1)[1].strip()
        elif 'sarah:' in line:
            line = line.split('sarah:', 1)[1].strip()
        
        if line and len(line) > 15:
            phrases.append(line[:50])  # First 50 chars of each phrase
    
    if not phrases:
        return 0
    
    # Find best match in transcript
    best_time = 0
    best_score = 0
    
    for phrase in phrases[:3]:  # Check first 3 phrases
        phrase_words = set(phrase.split())
        
        for segment in transcript:
            segment_text = segment.get('text', '').lower()
            segment_words = set(segment_text.split())
            
            # Count word matches
            matches = len(phrase_words.intersection(segment_words))
            score = matches / len(phrase_words) if phrase_words else 0
            
            if score > best_score and score > 0.3:  # At least 30% word match
                best_score = score
                best_time = segment.get('start', 0)
    
    return best_time

def create_sequential_timeline(slides: List[Dict], transcript: List[Dict]) -> List[Dict]:
    """Create timeline keeping slides in their original order"""
    print("🎯 Creating sequential timeline...")
    
    timeline = []
    current_time = 0
    
    for slide in slides:
        if slide['has_notes']:
            start_time = find_slide_start_time(slide, transcript)
            if start_time > current_time:
                current_time = start_time
        
        timeline.append({
            'slide_number': slide['number'],
            'title': slide['title'],
            'start_time': current_time,
            'duration': 10  # Default duration
        })
        
        print(f"📍 Slide {slide['number']}: {current_time:.1f}s - {slide['title']}")
        
        # Move time forward for next slide
        current_time += 5  # Minimum 5s between slides
    
    # Adjust durations
    for i in range(len(timeline)):
        if i < len(timeline) - 1:
            duration = timeline[i + 1]['start_time'] - timeline[i]['start_time']
            timeline[i]['duration'] = max(3.0, duration)
        else:
            timeline[i]['duration'] = 15.0  # Last slide
    
    return timeline

def create_video_sequential(timeline: List[Dict], audio_file: Path, image_dir: Path) -> Path:
    """Create video using slides in proper sequence"""
    print("🎥 Creating sequential video...")
    
    # Get all slide images in order
    image_files = sorted(image_dir.glob("*.png"))
    print(f"Found {len(image_files)} slide images")
    
    # Load audio
    audio = AudioFileClip(str(audio_file))
    
    clips = []
    
    for entry in timeline:
        slide_num = entry['slide_number']
        duration = entry['duration']
        
        # Find the FIRST image for this slide number
        image_file = None
        for img in image_files:
            if img.name.startswith(f"{slide_num:03d}-01"):  # Always use first click of each slide
                image_file = img
                break
        
        if not image_file:
            # Try 2-digit format
            for img in image_files:
                if img.name.startswith(f"{slide_num:02d}-01"):
                    image_file = img
                    break
        
        if not image_file and slide_num <= len(image_files):
            # Sequential fallback
            image_file = image_files[slide_num - 1]
        
        if image_file:
            clip = ImageClip(str(image_file), duration=duration)
            clips.append(clip)
            print(f"   🎬 Slide {slide_num}: {image_file.name} ({duration:.1f}s)")
        else:
            print(f"   ❌ No image found for slide {slide_num}")
    
    if not clips:
        print("❌ No clips created")
        return None
    
    # Create video
    video = concatenate_videoclips(clips)
    
    # Match audio length
    if video.duration > audio.duration:
        video = video.subclip(0, audio.duration)
    elif video.duration < audio.duration:
        # Extend last clip
        extension = audio.duration - video.duration
        if clips:
            last_clip = clips[-1].set_duration(clips[-1].duration + extension)
            clips[-1] = last_clip
            video = concatenate_videoclips(clips)
    
    # Add audio
    final_video = video.set_audio(audio)
    
    # Save
    output_file = audio_file.parent / f"{audio_file.stem}_sequential.mp4"
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
    print("🎯 Sequential Slide Sync - Proper Order!")
    
    # File paths
    audio_file = Path("ai_voiceover_system/podcasts/1323203-summer-2023-solution-5min-test.m4a")
    slides_file = Path("slidev/python-programming-fundamentals-conversational.md")
    transcript_file = Path("audio_scripts/1323203-summer-2023-solution-5min-test-timestamped.json")
    image_dir = Path("enhanced_podcast_output")
    
    # Load data
    transcript = load_transcript(transcript_file)
    slides = parse_slides_in_order(slides_file)
    
    print(f"📊 {len(slides)} slides in order, {len(transcript)} transcript segments")
    
    # Create timeline maintaining slide order
    timeline = create_sequential_timeline(slides, transcript)
    
    # Create video
    video_file = create_video_sequential(timeline, audio_file, image_dir)
    
    if video_file:
        print(f"🎉 Sequential video: {video_file}")
    else:
        print("❌ Failed to create video")

if __name__ == "__main__":
    main()