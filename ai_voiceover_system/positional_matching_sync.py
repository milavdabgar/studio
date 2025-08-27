#!/usr/bin/env python3
"""
Positional Matching Sync
========================
Tracks position in speaker notes to ensure forward progression.
Prevents short segments like "Right." from matching backwards in slides.

Key improvements:
- Track last matched position in speaker notes
- Search forward from last position to maintain progression
- Validate slide/click number increments (no backwards jumps)
- Eliminate random slide appearances from short segment matches
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
    """Parse all slides and keep their speaker notes intact with position tracking"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    parts = content.split('---')
    slides = []
    slide_number = 0
    global_position = 0  # Track position across all slides
    
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
                    'notes': notes,
                    'global_start_pos': global_position,
                    'global_end_pos': global_position + len(notes)
                })
                global_position += len(notes) + 1  # +1 for separator
    
    return slides

def find_segment_with_position_tracking(segment_text: str, slides: List[Dict], 
                                      last_slide_num: int, last_click_num: int, 
                                      last_position: int) -> Optional[Tuple[int, int, bool, int]]:
    """
    Find segment in slides starting from last position to maintain forward progression.
    Finds ALL valid matches and chooses the CLOSEST one to prevent huge jumps.
    
    Returns: (slide_number, click_number, is_slide_start, new_position) or None
    """
    
    # Clean the segment text for searching
    search_text = segment_text.lower().strip(' .,!?')
    
    # Skip very short segments that are likely to cause false matches
    if len(search_text) <= 3:
        print(f"   ⏭️ Skipping short segment: \"{search_text}\"")
        return None
    
    # Skip common short phrases that cause huge jumps
    common_short_phrases = ["makes sense", "that's right", "exactly", "okay", "right", "yes", "no"]
    if search_text in common_short_phrases and len(search_text) <= 11:
        print(f"   ⏭️ Skipping common phrase that causes jumps: \"{search_text}\"")
        return None
    
    print(f"   🔍 Searching: \"{search_text}\" (from pos {last_position})")
    
    # Collect ALL valid matches, then choose the closest
    valid_matches = []
    
    # Search slides starting from current position
    for slide in slides:
        # Skip slides that are before our current progression
        if slide['number'] < last_slide_num:
            continue
        
        # For the current slide, start from last position
        if slide['number'] == last_slide_num:
            search_start_pos = max(0, last_position - slide['global_start_pos'])
        else:
            search_start_pos = 0
        
        # Search in this slide's notes
        notes = slide['notes'][search_start_pos:] if search_start_pos < len(slide['notes']) else ""
        
        # Skip if no content to search
        if not notes.strip():
            continue
            
            
        match_result = find_in_slide_notes_with_clicks(search_text, notes, slide['number'])
        
        if match_result:
            slide_num, click_num, is_slide_start = match_result
            
            # Calculate new global position
            match_pos = notes.lower().find(search_text)
            new_global_pos = slide['global_start_pos'] + search_start_pos + match_pos
            
            
            # Validate progression - allow same slide/click if position moves forward OR higher slide/click
            position_moves_forward = new_global_pos > last_position
            slide_progression = slide_num > last_slide_num or (slide_num == last_slide_num and click_num >= last_click_num)
            
            if position_moves_forward and slide_progression:
                # Calculate distance from current position
                distance = new_global_pos - last_position
                valid_matches.append((slide_num, click_num, is_slide_start, new_global_pos, distance))
                print(f"   🔍 Found match: Slide {slide_num} Click {click_num} (pos {new_global_pos}, distance {distance})")
    
    if not valid_matches:
        print(f"   ⚪ No valid forward match")
        return None
    
    # Choose the CLOSEST match (smallest distance from current position)
    valid_matches.sort(key=lambda x: x[4])  # Sort by distance
    best_match = valid_matches[0]
    slide_num, click_num, is_slide_start, new_global_pos, distance = best_match
    
    print(f"   ✅ Closest match: Slide {slide_num} Click {click_num} (pos {new_global_pos}, distance {distance})")
    if len(valid_matches) > 1:
        print(f"   📊 Skipped {len(valid_matches)-1} farther matches to prevent huge jumps")
    
    return (slide_num, click_num, is_slide_start, new_global_pos)

def find_in_slide_notes_with_clicks(search_text: str, notes: str, slide_number: int) -> Optional[Tuple[int, int, bool]]:
    """
    Find text in slide notes and determine click number.
    Returns: (slide_number, click_number, is_slide_start) or None
    """
    
    notes_lower = notes.lower()
    
    
    # Split by [click] markers
    parts = notes.split('[click]')
    
    # Check if text is in the initial part (before any [click])
    if parts[0] and search_text in parts[0].lower():
        return (slide_number, 1, True)  # This starts a new slide
    
    # Check each [click] section
    for i, part in enumerate(parts[1:], 2):  # Start from click 2
        if part and search_text in part.lower():
            return (slide_number, i, False)  # This is a click within the slide
    
    return None

def process_transcript_with_position_tracking(segments: List[Dict], slides: List[Dict]) -> List[Dict]:
    """Process segments maintaining positional progression"""
    print("🎯 Processing with positional tracking to prevent backwards jumps...")
    
    timeline = []
    
    # Track progression
    last_slide_num = 0
    last_click_num = 0
    last_position = 0
    
    for segment in segments:
        segment_text = segment.get('text', '')
        start_time = segment.get('start', 0)
        speaker = segment.get('speaker', '')
        
        print(f"\n📍 {start_time:.2f}s - {speaker}: \"{segment_text}\"")
        
        # Find match with position tracking
        match_result = find_segment_with_position_tracking(
            segment_text, slides, last_slide_num, last_click_num, last_position
        )
        
        if match_result:
            slide_num, click_num, is_slide_start, new_position = match_result
            
            timeline.append({
                'start_time': start_time,
                'slide_number': slide_num,
                'click_number': click_num,
                'is_slide_start': is_slide_start,
                'segment_text': segment_text,
                'image_name': f"{slide_num:03d}-{click_num:02d}.png",
                'speaker': speaker
            })
            
            # Update tracking variables
            last_slide_num = slide_num
            last_click_num = click_num
            last_position = new_position
            
            action = "NEW SLIDE" if is_slide_start else f"CLICK {click_num}"
            print(f"   ✅ {action}: {slide_num}-{click_num}")
        else:
            print(f"   ⚪ No valid forward match")
    
    return timeline

def calculate_durations(timeline: List[Dict], audio_duration: float) -> List[Dict]:
    """Calculate display durations"""
    for i, entry in enumerate(timeline):
        if i < len(timeline) - 1:
            next_start = timeline[i + 1]['start_time']
            duration = next_start - entry['start_time']
            entry['duration'] = max(1.0, duration)
        else:
            remaining = audio_duration - entry['start_time']
            entry['duration'] = max(3.0, remaining)
    
    return timeline

def create_positional_video(timeline: List[Dict], audio_file: Path, image_dir: Path) -> Path:
    """Create video with positional tracking"""
    print(f"\n🎥 Creating video with {len(timeline)} positionally-tracked segments...")
    
    # Load audio
    audio = AudioFileClip(str(audio_file))
    
    # Get available images
    image_files = {img.name: img for img in image_dir.glob("*.png")}
    
    clips = []
    
    for entry in timeline:
        image_name = entry['image_name']
        duration = entry['duration']
        start_time = entry['start_time']
        
        if image_name in image_files:
            image_file = image_files[image_name]
            clip = ImageClip(str(image_file), duration=duration)
            clips.append(clip)
            
            action = "NEW" if entry['is_slide_start'] else "CLICK"
            print(f"   🎬 {action} {image_name}: {start_time:.2f}s ({duration:.1f}s)")
        else:
            print(f"   ❌ Missing: {image_name}")
    
    if not clips:
        print("❌ No clips created")
        return None
    
    # Create video
    video = concatenate_videoclips(clips)
    final_video = video.set_audio(audio)
    
    # Save
    output_file = audio_file.parent / f"{audio_file.stem}_POSITIONAL.mp4"
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
    print("🎯 Positional Matching Sync - No Backwards Jumps!")
    print("Tracks position in speaker notes to maintain forward progression")
    
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
    
    print(f"📊 {len(segments)} segments, {len(slides)} slides")
    
    # Process with position tracking
    timeline = process_transcript_with_position_tracking(segments, slides)
    
    if not timeline:
        print("❌ No matches found")
        return
    
    # Calculate durations
    timeline = calculate_durations(timeline, audio_duration)
    
    print(f"\n✅ Created {len(timeline)} positionally-tracked matches")
    
    # Create video
    video_file = create_positional_video(timeline, audio_file, image_dir)
    
    if video_file:
        print(f"\n🎉 Positional video: {video_file}")
        print("✅ No random backwards jumps!")
        print("✅ Forward progression maintained!")
        print("✅ Short segments like 'Right.' handled correctly!")
    else:
        print("❌ Failed")

if __name__ == "__main__":
    main()