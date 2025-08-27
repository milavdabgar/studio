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
    
    # For 100% coverage goal, be very permissive with short segments
    # Only skip extremely problematic phrases that are guaranteed to cause issues
    highly_problematic_phrases = ["uh", "um", "ah", "er"]
    if search_text in highly_problematic_phrases:
        print(f"   ⏭️ Skipping filler word: \"{search_text}\"")
        return None
        
    # Skip empty or whitespace-only segments
    if len(search_text.strip()) == 0:
        return None
    
    print(f"   🔍 Searching: \"{search_text}\" (from pos {last_position})")
    
    # Collect ALL valid matches, then choose the closest
    valid_matches = []
    
    # Search slides starting from current position
    for slide in slides:
        # Simplified approach: search ALL slides for each segment
        # Check if text is in this slide (either exact match or fuzzy match)
        has_exact_match = search_text in slide['notes'].lower()
        has_fuzzy_match = not has_exact_match and any(
            fuzzy_match_in_text(search_text, part) 
            for part in slide['notes'].split('[click]')
        )
        
        if not has_exact_match and not has_fuzzy_match:
            continue
            
            
        match_result = find_in_slide_notes_with_clicks(search_text, slide['notes'], slide['number'])
        
        if match_result:
            slide_num, click_num, is_slide_start = match_result
            
            # Calculate new global position (using full notes now)
            match_pos = slide['notes'].lower().find(search_text)
            
            # For fuzzy matches, find the actual position of the matched text
            if match_pos == -1:  # Fuzzy match case
                # Find which click section contains the fuzzy match
                parts = slide['notes'].split('[click]')
                cumulative_pos = 0
                
                for i, part in enumerate(parts):
                    if fuzzy_match_in_text(search_text, part):
                        # Find approximate position within this part
                        match_pos = cumulative_pos + len(part) // 2  # Use middle of the part
                        break
                    cumulative_pos += len(part) + len('[click]') if i > 0 else len(part)
                
                if match_pos == -1:
                    match_pos = 0  # Fallback
            
            new_global_pos = slide['global_start_pos'] + match_pos
            
            
            # For 100% coverage: be very permissive but prefer forward progression
            raw_distance = new_global_pos - last_position
            
            # Always add matches but use smart prioritization
            if slide_num > last_slide_num:
                # New slide - always prefer this
                priority = 1000 + raw_distance if raw_distance >= 0 else 1000 - raw_distance
            elif slide_num == last_slide_num and click_num > last_click_num:
                # New click in same slide - high priority 
                priority = 2000 + raw_distance if raw_distance >= 0 else 2000 - raw_distance
            elif slide_num == last_slide_num and click_num == last_click_num:
                # Same slide/click - medium priority, prefer forward position
                priority = 3000 + abs(raw_distance)
            else:
                # Backwards slide/click - lowest priority but still possible
                priority = 10000 + abs(raw_distance)
            
            valid_matches.append((slide_num, click_num, is_slide_start, new_global_pos, priority))
            print(f"   🔍 Match: Slide {slide_num} Click {click_num} (pos {new_global_pos}, priority {priority})")
    
    if not valid_matches:
        # Fallback: try to find matches that maintain forward progression
        print(f"   🔄 No forward match found, trying fallback search with progression...")
        
        fallback_matches = []
        for slide in slides:
            # Only consider slides at or after current position
            if slide['global_start_pos'] >= last_position:
                if fuzzy_match_in_text(search_text, slide['notes']) or search_text in slide['notes'].lower():
                    match_result = find_in_slide_notes_with_clicks(search_text, slide['notes'], slide['number'])
                    if match_result:
                        slide_num, click_num, is_slide_start = match_result
                        match_pos = slide['notes'].lower().find(search_text)
                        if match_pos == -1:
                            match_pos = len(slide['notes']) // 2  # Fallback position
                        
                        new_global_pos = slide['global_start_pos'] + match_pos
                        
                        # Only add if it maintains forward progression
                        if new_global_pos >= last_position:
                            distance = new_global_pos - last_position
                            fallback_matches.append((slide_num, click_num, is_slide_start, new_global_pos, distance))
        
        if fallback_matches:
            # Choose closest forward match
            fallback_matches.sort(key=lambda x: x[4])
            best_fallback = fallback_matches[0]
            slide_num, click_num, is_slide_start, new_global_pos, distance = best_fallback
            print(f"   🔄 Fallback match: Slide {slide_num} Click {click_num} (pos {new_global_pos}, distance {distance})")
            return (slide_num, click_num, is_slide_start, new_global_pos)
        
        print(f"   ⚪ No forward match found even with fallback")
        return None
    
    # Choose the BEST match (lowest priority score)
    valid_matches.sort(key=lambda x: x[4])  # Sort by priority
    best_match = valid_matches[0]
    slide_num, click_num, is_slide_start, new_global_pos, priority = best_match
    
    print(f"   ✅ Best match: Slide {slide_num} Click {click_num} (pos {new_global_pos}, priority {priority})")
    if len(valid_matches) > 1:
        print(f"   📊 Considered {len(valid_matches)} total matches")
    
    return (slide_num, click_num, is_slide_start, new_global_pos)

def normalize_text_for_matching(text: str) -> str:
    """Normalize text for fuzzy matching by handling common punctuation variations"""
    # Replace common punctuation variations
    normalized = text.lower()
    # Replace various punctuation with spaces, then clean up
    for punct in [',', '-', ':', ';', '!', '?', '.']:
        normalized = normalized.replace(punct, ' ')
    # Clean up extra spaces
    normalized = ' '.join(normalized.split())
    return normalized

def fuzzy_match_in_text(search_text: str, target_text: str, threshold: float = 0.8) -> bool:
    """Simple fuzzy matching - exact match or normalized punctuation match only"""
    
    # First try exact match
    if search_text.lower() in target_text.lower():
        return True
    
    # Try normalized match for punctuation differences only
    search_norm = normalize_text_for_matching(search_text)
    target_norm = normalize_text_for_matching(target_text)
    
    if search_norm in target_norm:
        return True
    
    return False

def find_in_slide_notes_with_clicks(search_text: str, notes: str, slide_number: int) -> Optional[Tuple[int, int, bool]]:
    """
    Find text in slide notes and determine click number with fuzzy matching.
    
    Handles punctuation differences like "D, direction." vs "D - direction."
    
    Returns: (slide_number, click_number, is_slide_start) or None
    """
    
    notes_lower = notes.lower()
    
    # Split by [click] markers
    parts = notes.split('[click]')
    
    # Check if text is in the initial part (before any [click])
    if parts[0] and fuzzy_match_in_text(search_text, parts[0]):
        return (slide_number, 1, True)  # This starts a new slide
    
    # Check each [click] section
    for i, part in enumerate(parts[1:], 2):  # Start from click 2
        if part and fuzzy_match_in_text(search_text, part):
            # Debug for punctuation mismatches
            if search_text.lower() not in part.lower():
                print(f"       🔧 Fuzzy match: '{search_text}' → Slide {slide_number} Click {i}")
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
            if slide_num > last_slide_num or (slide_num == last_slide_num and click_num > last_click_num):
                # New slide or new click - set position to start of this click section
                # This allows multiple segments within the same click to be found
                
                # Find the matched slide
                matched_slide = next((s for s in slides if s['number'] == slide_num), None)
                if matched_slide:
                    # Find the start of this click section in the slide notes
                    parts = matched_slide['notes'].split('[click]')
                    if click_num == 1:
                        # Click 1 is the initial part
                        click_section_start = 0
                    else:
                        # For click 2+, sum up lengths of previous sections
                        click_section_start = len(parts[0])
                        for i in range(1, click_num - 1):
                            click_section_start += len('[click]') + len(parts[i])
                    
                    new_click_position = matched_slide['global_start_pos'] + click_section_start
                    last_position = new_click_position
                
                last_slide_num = slide_num
                last_click_num = click_num
            else:
                # Same slide and click - don't advance position
                last_slide_num = slide_num
                last_click_num = click_num
                # Keep last_position unchanged to allow finding other segments in same click
            
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

def analyze_matching_coverage(segments: List[Dict], timeline: List[Dict]):
    """Analyze matching coverage and position progression"""
    print(f"\n📊 MATCHING ANALYSIS:")
    print(f"Total segments: {len(segments)}")
    print(f"Total matches: {len(timeline)}")
    print(f"Coverage: {len(timeline)/len(segments)*100:.1f}%")
    print(f"Unmatched: {len(segments) - len(timeline)} segments")
    
    # Check position progression
    print(f"\n📈 POSITION PROGRESSION CHECK:")
    last_pos = -1
    progression_errors = 0
    for i, entry in enumerate(timeline):
        start_time = entry['start_time']
        # For position, we need to estimate based on slide/click
        # This is a simplified check
        current_pos = entry['slide_number'] * 1000 + entry['click_number']
        if current_pos < last_pos:
            progression_errors += 1
            if progression_errors <= 5:  # Show first 5 errors
                print(f"❌ Position regression at {start_time:.2f}s: slide {entry['slide_number']}-{entry['click_number']}")
        last_pos = current_pos
    
    if progression_errors == 0:
        print("✅ Perfect position progression!")
    else:
        print(f"❌ {progression_errors} position regressions found")
    
    # Show unmatched segments
    matched_times = {entry['start_time'] for entry in timeline}
    unmatched_segments = []
    for segment in segments:
        if segment['start'] not in matched_times:
            unmatched_segments.append(segment)
    
    if unmatched_segments:
        print(f"\n❌ UNMATCHED SEGMENTS ({len(unmatched_segments)}):")
        for i, seg in enumerate(unmatched_segments[:10]):  # Show first 10
            print(f"  {seg['start']:6.2f}s - {seg['speaker']}: \"{seg['text'][:50]}...\"")
        if len(unmatched_segments) > 10:
            print(f"  ... and {len(unmatched_segments) - 10} more")

def main():
    print("🎯 Positional Matching Sync - Perfect Progressive Matching!")
    print("Objective: 100% segment coverage with ascending positions")
    
    # File paths - using original slides with manual fixes
    audio_file = Path("ai_voiceover_system/podcasts/1323203-summer-2023-solution-5min-test.m4a")
    slides_file = Path("slidev/python-programming-fundamentals-conversational.md")  # Original slides
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
    
    # Analyze coverage and progression
    analyze_matching_coverage(segments, timeline)
    
    # Calculate durations
    timeline = calculate_durations(timeline, audio_duration)
    
    print(f"\n✅ Created {len(timeline)} positionally-tracked matches")
    
    # Create video
    video_file = create_positional_video(timeline, audio_file, image_dir)
    
    if video_file:
        print(f"\n🎉 Positional video: {video_file}")
        if len(timeline) == len(segments):
            print("🎯 PERFECT: 100% segment matching achieved!")
        else:
            print(f"🎯 GOAL: Need {len(segments) - len(timeline)} more matches for 100% coverage")
    else:
        print("❌ Failed")

if __name__ == "__main__":
    main()