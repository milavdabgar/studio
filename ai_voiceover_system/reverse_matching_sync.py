#!/usr/bin/env python3
"""
Reverse Matching Sync
=====================
Process transcript segments one by one and find matches in slide speaker notes.
This eliminates random slides and provides precise timing.

Approach:
1. Process each audio segment individually
2. Search segment text in ALL slide speaker notes
3. If found at start of notes = new slide (xyz-01.png)
4. If found after [click] = next animation (xyz-02.png, xyz-03.png, etc.)
5. No fuzzy matching - only exact text matches
"""

import json
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips

def load_transcript(file_path: Path) -> List[Dict]:
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data.get('segments', [])

def parse_all_slides_with_notes(file_path: Path) -> List[Dict]:
    """Parse all slides and keep their speaker notes intact"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    parts = content.split('---')
    slides = []
    slide_number = 0
    
    for i, part in enumerate(parts):
        part = part.strip()
        if not part or i <= 1:
            continue
            
        # Skip YAML-only sections
        lines = part.split('\n')
        has_content = any(line.strip() and not (':' in line and not line.startswith('#') and not line.startswith('<!--')) 
                         for line in lines)
        
        if has_content and len(part) > 20:
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
            
            if notes:  # Only slides with speaker notes
                slides.append({
                    'number': slide_number,
                    'title': title,
                    'notes': notes
                })
    
    return slides

def find_segment_in_slide_notes(segment_text: str, slide_notes: str) -> Optional[Tuple[bool, int]]:
    """
    Find if segment text exists in slide notes.
    Returns: (is_slide_start, click_number) or None if not found
    
    is_slide_start: True if this starts a new slide, False if it's a click within slide
    click_number: 1 for slide start, 2+ for subsequent clicks
    """
    
    # Clean the segment text for searching
    search_text = segment_text.lower().strip(' .,!?')
    
    # Split slide notes by [click] markers
    parts = slide_notes.split('[click]')
    
    # Check if segment matches start of slide (before any [click])
    if parts[0]:
        initial_text = parts[0].lower().strip()
        
        # Look for the segment text in the initial part
        if search_text in initial_text:
            return (True, 1)  # This starts a new slide
    
    # Check if segment matches any [click] sections
    for i, part in enumerate(parts[1:], 2):  # Start from click 2
        if part:
            click_text = part.lower().strip()
            
            if search_text in click_text:
                return (False, i)  # This is a click within the slide
    
    return None

def process_transcript_segments(segments: List[Dict], slides: List[Dict]) -> List[Dict]:
    """Process each transcript segment and find matching slides"""
    print("🎯 Processing transcript segments for reverse matching...")
    
    timeline = []
    
    for segment in segments:
        segment_text = segment.get('text', '')
        start_time = segment.get('start', 0)
        speaker = segment.get('speaker', '')
        
        print(f"\n📍 {start_time:.2f}s - {speaker}: \"{segment_text}\"")
        
        # Search this segment in all slide notes
        found_match = False
        
        for slide in slides:
            match_result = find_segment_in_slide_notes(segment_text, slide['notes'])
            
            if match_result:
                is_slide_start, click_number = match_result
                
                timeline.append({
                    'start_time': start_time,
                    'slide_number': slide['number'],
                    'click_number': click_number,
                    'is_slide_start': is_slide_start,
                    'segment_text': segment_text,
                    'slide_title': slide['title'],
                    'image_name': f"{slide['number']:03d}-{click_number:02d}.png"
                })
                
                action = "NEW SLIDE" if is_slide_start else f"CLICK {click_number}"
                print(f"   ✅ {action}: Slide {slide['number']} - {slide['title']}")
                found_match = True
                break  # Stop after first match
        
        if not found_match:
            print(f"   ⚪ No match found")
    
    # Sort by time
    timeline.sort(key=lambda x: x['start_time'])
    
    return timeline

def calculate_durations(timeline: List[Dict], audio_duration: float) -> List[Dict]:
    """Calculate how long each slide should be displayed"""
    
    for i, entry in enumerate(timeline):
        if i < len(timeline) - 1:
            next_start = timeline[i + 1]['start_time']
            duration = next_start - entry['start_time']
            entry['duration'] = max(1.0, duration)  # Minimum 1 second
        else:
            # Last entry
            remaining = audio_duration - entry['start_time']
            entry['duration'] = max(3.0, remaining)
    
    return timeline

def create_reverse_matched_video(timeline: List[Dict], audio_file: Path, image_dir: Path) -> Path:
    """Create video using reverse-matched timeline"""
    print(f"\n🎥 Creating video with {len(timeline)} reverse-matched segments...")
    
    # Load audio
    audio = AudioFileClip(str(audio_file))
    
    # Get available images
    image_files = {img.name: img for img in image_dir.glob("*.png")}
    print(f"   📁 Available images: {len(image_files)}")
    
    clips = []
    total_duration = 0
    
    for i, entry in enumerate(timeline):
        image_name = entry['image_name']
        duration = entry['duration']
        start_time = entry['start_time']
        
        # Skip if this would exceed audio duration
        if total_duration >= audio.duration:
            break
            
        # Adjust duration if it would exceed audio
        if total_duration + duration > audio.duration:
            duration = audio.duration - total_duration
            if duration < 0.5:
                break
        
        if image_name in image_files:
            image_file = image_files[image_name]
            clip = ImageClip(str(image_file), duration=duration)
            clips.append(clip)
            total_duration += duration
            
            action = "NEW" if entry['is_slide_start'] else "CLICK"
            print(f"   🎬 {action} {image_name}: {start_time:.2f}s ({duration:.1f}s)")
        else:
            print(f"   ❌ Missing: {image_name}")
            # Try fallback to -01.png
            fallback = f"{entry['slide_number']:03d}-01.png"
            if fallback in image_files and fallback != image_name:
                image_file = image_files[fallback]
                clip = ImageClip(str(image_file), duration=duration)
                clips.append(clip)
                total_duration += duration
                print(f"   🔄 Fallback: {fallback}")
    
    if not clips:
        print("❌ No clips created")
        return None
    
    # Create video
    video = concatenate_videoclips(clips)
    final_video = video.set_audio(audio)
    
    # Save
    output_file = audio_file.parent / f"{audio_file.stem}_REVERSE_matched.mp4"
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
    print("🎯 Reverse Matching Sync - Transcript → Slides!")
    print("Eliminates random slides by processing segments individually")
    
    # File paths
    audio_file = Path("ai_voiceover_system/podcasts/1323203-summer-2023-solution-5min-test.m4a")
    slides_file = Path("slidev/python-programming-fundamentals-conversational.md")
    transcript_file = Path("audio_scripts/1323203-summer-2023-solution-5min-test-timestamped.json")
    image_dir = Path("enhanced_podcast_output")
    
    # Load data
    segments = load_transcript(transcript_file)
    slides = parse_all_slides_with_notes(slides_file)
    
    # Get audio duration
    audio = AudioFileClip(str(audio_file))
    audio_duration = audio.duration
    audio.close()
    
    print(f"📊 {len(segments)} audio segments, {len(slides)} slides with notes")
    print(f"📊 Audio duration: {audio_duration:.1f}s")
    
    # Process segments and find matches
    timeline = process_transcript_segments(segments, slides)
    
    if not timeline:
        print("❌ No matches found")
        return
    
    # Calculate durations
    timeline = calculate_durations(timeline, audio_duration)
    
    print(f"\n✅ Found {len(timeline)} segment→slide matches")
    
    # Create video
    video_file = create_reverse_matched_video(timeline, audio_file, image_dir)
    
    if video_file:
        print(f"\n🎉 Reverse-matched video: {video_file}")
        print("✅ No random slides - only exact segment matches!")
        print("✅ Precise timing based on individual audio segments!")
    else:
        print("❌ Failed to create video")

if __name__ == "__main__":
    main()