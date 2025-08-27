#!/usr/bin/env python3
"""
Click-by-Click Sync
===================
Show each v-click (slide animation) exactly when mentioned in audio.
Uses [click] markers in speaker notes to sync individual slide animations.
"""

import json
import re
from pathlib import Path
from typing import List, Dict, Tuple
from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips

def load_transcript(file_path: Path) -> List[Dict]:
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data.get('segments', [])

def parse_slide_clicks(slide_content: str, slide_number: int) -> List[Dict]:
    """Extract each [click] marker and its associated text"""
    clicks = []
    
    if '<!--' not in slide_content:
        return clicks
    
    start = slide_content.find('<!--')
    end = slide_content.find('-->') + 3
    notes = slide_content[start:end].replace('<!--', '').replace('-->', '').strip()
    
    # Split by [click] markers
    parts = notes.split('[click]')
    
    # First part (before any [click]) - this is click 1
    if len(parts) > 0 and parts[0].strip():
        initial_text = parts[0].strip()
        clicks.append({
            'slide_number': slide_number,
            'click_number': 1,
            'text': initial_text,
            'preview': initial_text[:60] + "..." if len(initial_text) > 60 else initial_text
        })
    
    # Each [click] marked section
    for i, part in enumerate(parts[1:], 2):  # Start from click 2
        if part.strip():
            click_text = part.strip()
            clicks.append({
                'slide_number': slide_number,
                'click_number': i,
                'text': click_text,
                'preview': click_text[:60] + "..." if len(click_text) > 60 else click_text
            })
    
    return clicks

def parse_all_slides_with_clicks(file_path: Path) -> List[Dict]:
    """Parse all slides and extract all their clicks"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    all_clicks = []
    parts = content.split('---\n')[1:]  # Skip header
    
    for i, part in enumerate(parts, 1):
        if part.strip():
            slide_clicks = parse_slide_clicks(part, i)
            all_clicks.extend(slide_clicks)
    
    return all_clicks

def find_click_timing(click_text: str, transcript: List[Dict]) -> float:
    """Find when this specific click content is mentioned in audio"""
    
    # Clean up the click text - remove speaker names and extract key phrases
    text = click_text.lower().strip()
    
    # Remove speaker prefixes
    if 'dr. james:' in text:
        text = text.split('dr. james:', 1)[1].strip()
    elif 'sarah:' in text:
        text = text.split('sarah:', 1)[1].strip()
    
    # Skip very short texts
    if len(text) < 15:
        return 0
    
    # Get key words from the text (skip common words)
    words = text.split()
    key_words = [w for w in words if len(w) > 3 and w not in ['that', 'this', 'with', 'they', 'have', 'will', 'been', 'your', 'from']]
    
    if not key_words:
        return 0
    
    # Find best matching segment
    best_time = 0
    best_score = 0
    
    for segment in transcript:
        segment_text = segment.get('text', '').lower()
        
        # Count key word matches
        matches = sum(1 for word in key_words if word in segment_text)
        score = matches / len(key_words) if key_words else 0
        
        # Bonus for exact phrase matches
        if text[:30] in segment_text:
            score += 0.5
        
        if score > best_score and score > 0.2:  # At least 20% match
            best_score = score
            best_time = segment.get('start', 0)
    
    return best_time

def create_click_timeline(clicks: List[Dict], transcript: List[Dict]) -> List[Dict]:
    """Create timeline for each individual click"""
    print("🎯 Creating click-by-click timeline...")
    
    timeline = []
    
    for click in clicks:
        timing = find_click_timing(click['text'], transcript)
        
        if timing > 0:
            timeline.append({
                'slide_number': click['slide_number'],
                'click_number': click['click_number'],
                'start_time': timing,
                'preview': click['preview']
            })
            print(f"📍 Slide {click['slide_number']}-{click['click_number']}: {timing:.1f}s - {click['preview']}")
    
    # Sort by time
    timeline.sort(key=lambda x: x['start_time'])
    
    # Calculate durations
    for i, entry in enumerate(timeline):
        if i < len(timeline) - 1:
            duration = timeline[i + 1]['start_time'] - entry['start_time']
            entry['duration'] = max(2.0, duration)
        else:
            entry['duration'] = 10.0
    
    return timeline

def create_click_video(timeline: List[Dict], audio_file: Path, image_dir: Path) -> Path:
    """Create video showing each click at the right moment"""
    print("🎥 Creating click-by-click video...")
    
    # Get all slide images
    image_files = sorted(image_dir.glob("*.png"))
    
    # Load audio
    audio = AudioFileClip(str(audio_file))
    
    clips = []
    
    for entry in timeline:
        slide_num = entry['slide_number']
        click_num = entry['click_number']
        duration = entry['duration']
        
        # Find exact matching image
        image_file = None
        
        # Try different filename formats
        possible_names = [
            f"{slide_num:03d}-{click_num:02d}.png",
            f"{slide_num:02d}-{click_num:02d}.png",
            f"{slide_num:d}-{click_num:d}.png"
        ]
        
        for img in image_files:
            if img.name in possible_names:
                image_file = img
                break
        
        if image_file:
            clip = ImageClip(str(image_file), duration=duration)
            clips.append(clip)
            print(f"   🎬 {image_file.name}: {entry['start_time']:.1f}s ({duration:.1f}s)")
        else:
            print(f"   ❌ Image not found for slide {slide_num} click {click_num}")
    
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
    output_file = audio_file.parent / f"{audio_file.stem}_click_by_click.mp4"
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
    print("🎯 Click-by-Click Sync - Every Animation Counts!")
    
    # File paths
    audio_file = Path("ai_voiceover_system/podcasts/1323203-summer-2023-solution-5min-test.m4a")
    slides_file = Path("slidev/python-programming-fundamentals-conversational.md")
    transcript_file = Path("audio_scripts/1323203-summer-2023-solution-5min-test-timestamped.json")
    image_dir = Path("enhanced_podcast_output")
    
    # Load data
    transcript = load_transcript(transcript_file)
    clicks = parse_all_slides_with_clicks(slides_file)
    
    print(f"📊 Found {len(clicks)} individual clicks across all slides")
    print(f"📊 {len(transcript)} transcript segments")
    
    # Create timeline for each click
    timeline = create_click_timeline(clicks, transcript)
    
    if not timeline:
        print("❌ No clicks matched to audio")
        return
    
    print(f"✅ Matched {len(timeline)} clicks to audio timing")
    
    # Create video
    video_file = create_click_video(timeline, audio_file, image_dir)
    
    if video_file:
        print(f"🎉 Click-by-click video: {video_file}")
    else:
        print("❌ Failed to create video")

if __name__ == "__main__":
    main()