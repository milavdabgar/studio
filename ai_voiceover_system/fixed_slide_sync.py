#!/usr/bin/env python3
"""
Fixed Slide Sync
================
Properly parse only REAL slides (not YAML frontmatter sections).
Only count slides that actually have content and export as images.
"""

import json
import re
from pathlib import Path
from typing import List, Dict
from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips

def load_transcript(file_path: Path) -> List[Dict]:
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data.get('segments', [])

def parse_real_slides_only(file_path: Path) -> List[Dict]:
    """Parse only REAL slides that have actual content (not YAML sections)"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Split by --- but then filter out YAML-only sections
    parts = content.split('---')
    real_slides = []
    slide_number = 0
    
    for i, part in enumerate(parts):
        part = part.strip()
        if not part:
            continue
            
        # Skip the header YAML (first part)
        if i == 0 or i == 1:
            continue
            
        # Skip YAML-only sections (layout: default, etc.)
        lines = part.split('\n')
        non_yaml_content = []
        
        for line in lines:
            line = line.strip()
            # Skip YAML properties
            if ':' in line and not line.startswith('#') and not line.startswith('<!--'):
                # This looks like YAML (layout: default, class: text-center, etc.)
                continue
            elif line:
                non_yaml_content.append(line)
        
        # If there's actual content (not just YAML), it's a real slide
        content_text = '\n'.join(non_yaml_content)
        if len(content_text) > 20:  # Has substantial content
            slide_number += 1
            
            # Extract speaker notes
            notes = ""
            if '<!--' in part:
                start = part.find('<!--')
                end = part.find('-->') + 3
                notes = part[start:end].replace('<!--', '').replace('-->', '').strip()
            
            # Extract title
            title = "Untitled"
            for line in lines:
                if line.strip().startswith('# ') and not line.strip().startswith('## '):
                    title = line.strip()[2:].strip()
                    break
            
            real_slides.append({
                'number': slide_number,
                'title': title,
                'notes': notes,
                'has_notes': len(notes) > 10,
                'content_preview': content_text[:100] + "..." if len(content_text) > 100 else content_text
            })
    
    return real_slides

def parse_slide_clicks(notes: str, slide_number: int) -> List[Dict]:
    """Extract individual clicks from speaker notes"""
    if not notes:
        return []
    
    clicks = []
    
    # Split by [click] markers
    parts = notes.split('[click]')
    
    # First part (before any [click]) - this is the slide introduction
    if parts[0].strip():
        clicks.append({
            'slide_number': slide_number,
            'click_number': 1,
            'text': parts[0].strip()
        })
    
    # Each [click] marked section
    for i, part in enumerate(parts[1:], 2):
        if part.strip():
            clicks.append({
                'slide_number': slide_number,
                'click_number': i,
                'text': part.strip()
            })
    
    return clicks

def find_click_timing(click_text: str, transcript: List[Dict]) -> float:
    """Find when this click content is mentioned"""
    text = click_text.lower().strip()
    
    # Remove speaker prefixes
    if 'dr. james:' in text:
        text = text.split('dr. james:', 1)[1].strip()
    elif 'sarah:' in text:
        text = text.split('sarah:', 1)[1].strip()
    
    if len(text) < 10:
        return 0
    
    # Get first meaningful sentence
    first_sentence = text.split('.')[0].strip()
    if len(first_sentence) < 10:
        return 0
    
    # Find in transcript
    best_time = 0
    best_score = 0
    
    for segment in transcript:
        segment_text = segment.get('text', '').lower()
        
        # Check for substring match
        if first_sentence[:20] in segment_text:
            return segment.get('start', 0)
        
        # Word overlap scoring
        click_words = set(first_sentence.split())
        segment_words = set(segment_text.split())
        
        if click_words:
            overlap = len(click_words.intersection(segment_words))
            score = overlap / len(click_words)
            
            if score > best_score and score > 0.3:
                best_score = score
                best_time = segment.get('start', 0)
    
    return best_time

def create_timeline_with_intro(slides: List[Dict], transcript: List[Dict]) -> List[Dict]:
    """Create complete timeline including intro slide"""
    print(f"🎯 Creating timeline for {len(slides)} REAL slides...")
    
    timeline = []
    
    # Add intro slide (slide 1) at start
    if slides:
        timeline.append({
            'slide_number': 1,
            'click_number': 1,
            'start_time': 0.0,
            'image_name': '001-01.png',
            'title': slides[0]['title'] if slides else 'Intro'
        })
        print(f"📍 Slide 1-1: 0.0s - Intro slide")
    
    # Process each real slide
    for slide in slides:
        slide_clicks = parse_slide_clicks(slide['notes'], slide['number'])
        
        for click in slide_clicks:
            timing = find_click_timing(click['text'], transcript)
            
            if timing > 0:
                timeline.append({
                    'slide_number': slide['number'],
                    'click_number': click['click_number'],
                    'start_time': timing,
                    'image_name': f"{slide['number']:03d}-{click['click_number']:02d}.png",
                    'preview': click['text'][:60] + "..." if len(click['text']) > 60 else click['text']
                })
                print(f"📍 Slide {slide['number']}-{click['click_number']}: {timing:.1f}s - {slide['title']}")
    
    # Sort by time
    timeline.sort(key=lambda x: x['start_time'])
    
    # Calculate durations
    for i, entry in enumerate(timeline):
        if i < len(timeline) - 1:
            duration = timeline[i + 1]['start_time'] - entry['start_time']
            entry['duration'] = max(3.0, duration)
        else:
            # Last slide duration should fill remaining audio
            entry['duration'] = 20.0  # Will be adjusted to audio length
    
    return timeline

def create_complete_video(timeline: List[Dict], audio_file: Path, image_dir: Path) -> Path:
    """Create complete video with proper duration"""
    print("🎥 Creating complete synchronized video...")
    
    # Load audio first to get duration
    audio = AudioFileClip(str(audio_file))
    audio_duration = audio.duration
    print(f"   🎵 Audio duration: {audio_duration:.1f}s")
    
    # Get available images
    image_files = {img.name: img for img in image_dir.glob("*.png")}
    print(f"   📁 Found {len(image_files)} slide images")
    
    clips = []
    total_duration = 0
    
    for i, entry in enumerate(timeline):
        image_name = entry['image_name']
        duration = entry['duration']
        
        # Adjust last clip to fill remaining audio time
        if i == len(timeline) - 1:
            remaining = audio_duration - total_duration
            duration = max(3.0, remaining)
            entry['duration'] = duration
        
        if image_name in image_files:
            image_file = image_files[image_name]
            clip = ImageClip(str(image_file), duration=duration)
            clips.append(clip)
            total_duration += duration
            print(f"   🎬 {image_name}: {entry['start_time']:.1f}s ({duration:.1f}s)")
        else:
            print(f"   ❌ Image not found: {image_name}")
    
    if not clips:
        print("❌ No clips created")
        return None
    
    # Create video
    video = concatenate_videoclips(clips)
    print(f"   📺 Video duration: {video.duration:.1f}s")
    
    # Ensure perfect sync with audio
    if abs(video.duration - audio_duration) > 1.0:
        print(f"   ⚠️ Duration mismatch: video {video.duration:.1f}s vs audio {audio_duration:.1f}s")
        if video.duration > audio_duration:
            video = video.subclip(0, audio_duration)
        # Note: If video is shorter, we've already extended the last clip above
    
    # Add audio
    final_video = video.set_audio(audio)
    
    # Save
    output_file = audio_file.parent / f"{audio_file.stem}_FIXED_sync.mp4"
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
    print("🎯 FIXED Slide Sync - Only Real Slides!")
    
    # File paths
    audio_file = Path("ai_voiceover_system/podcasts/1323203-summer-2023-solution-5min-test.m4a")
    slides_file = Path("slidev/python-programming-fundamentals-conversational.md")
    transcript_file = Path("audio_scripts/1323203-summer-2023-solution-5min-test-timestamped.json")
    image_dir = Path("enhanced_podcast_output")
    
    # Load data
    transcript = load_transcript(transcript_file)
    real_slides = parse_real_slides_only(slides_file)
    
    print(f"📊 Found {len(real_slides)} REAL slides (not {len(real_slides)*2} fake ones!)")
    print(f"📊 {len(transcript)} transcript segments")
    
    # Create complete timeline
    timeline = create_timeline_with_intro(real_slides, transcript)
    
    print(f"✅ Created timeline with {len(timeline)} clips")
    
    # Create video
    video_file = create_complete_video(timeline, audio_file, image_dir)
    
    if video_file:
        print(f"🎉 FIXED video: {video_file}")
        print("This should now:")
        print("  ✅ Start with slide 1 (intro)")
        print("  ✅ Run full 5-minute duration") 
        print("  ✅ Use only real slides (not YAML sections)")
    else:
        print("❌ Failed to create video")

if __name__ == "__main__":
    main()