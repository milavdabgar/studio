#!/usr/bin/env python3
"""
Two-pass matching system: First clear segments, then assign ambiguous ones based on neighbors
"""
import json
import sys
from pathlib import Path
from typing import List, Dict, Optional, Tuple

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

from positional_matching_sync import (
    load_transcript, parse_all_slides_with_notes, 
    fuzzy_match_in_text, find_in_slide_notes_with_clicks,
    create_positional_video
)
from moviepy.editor import AudioFileClip

# Global args variable
args = None

def find_segment_in_slides_simple(segment_text: str, slides: List[Dict]) -> List[Tuple[int, int, int]]:
    """Find all possible matches for a segment without position constraints"""
    matches = []
    
    for slide in slides:
        slide_num = slide['number']
        notes = slide.get('notes', '')
        
        if not notes:
            continue
            
        # Try to find in notes with click tracking
        result = find_in_slide_notes_with_clicks(segment_text, notes, slide_num)
        if result:
            position, click_num, is_slide_start = result
            matches.append((slide_num, click_num, position))
    
    return matches

def process_transcript_two_pass(segments: List[Dict], slides: List[Dict]) -> List[Dict]:
    """Two-pass matching: first clear segments, then assign ambiguous ones based on neighbors"""
    print("🎯 Two-pass matching: Clear segments first, then assign ambiguous ones...")
    
    # Identify ambiguous segments (short, common words that cause jumps)
    ambiguous_words = {"right", "okay", "exactly", "yes", "no", "yeah", "ah", "oh", "well", "so", "and", "got", "makes"}
    
    clear_segments = []
    ambiguous_segments = []
    
    for i, segment in enumerate(segments):
        text_clean = segment['text'].lower().strip(' .,!?')
        words = text_clean.split()
        
        # Consider segment ambiguous if it's a single common word or very short
        is_ambiguous = (
            (len(words) == 1 and words[0] in ambiguous_words) or 
            len(text_clean) <= 3 or
            text_clean in ambiguous_words
        )
        
        if is_ambiguous:
            ambiguous_segments.append((i, segment))
        else:
            clear_segments.append((i, segment))
    
    print(f"📊 Pass 1: {len(clear_segments)} clear segments, {len(ambiguous_segments)} ambiguous segments")
    
    # PASS 1: Match clear segments with position tracking
    timeline = {}  # indexed by original segment position
    last_position = 0
    
    print("🔍 PASS 1: Matching clear segments...")
    for orig_idx, segment in clear_segments:
        segment_text = segment['text']
        start_time = segment['start']
        speaker = segment['speaker']
        
        if args.debug:
            print(f"\n📍 {start_time:.2f}s - {speaker}: \"{segment_text}\"")
        
        # Find all possible matches
        matches = find_segment_in_slides_simple(segment_text, slides)
        
        if matches:
            # Filter matches to only those that progress forward
            valid_matches = [(s, c, p) for s, c, p in matches if p >= last_position]
            
            if valid_matches:
                # Choose the earliest valid match (closest to current position)
                slide_num, click_num, position = min(valid_matches, key=lambda x: x[2])
                last_position = position
                
                timeline[orig_idx] = {
                    'original_index': orig_idx,
                    'start': start_time,
                    'end': segment['end'],
                    'speaker': speaker,
                    'text': segment_text,
                    'slide': slide_num,
                    'click': click_num,
                    'position': position
                }
                
                if args.debug:
                    if click_num == 1:
                        print(f"   ✅ NEW SLIDE: {slide_num}-{click_num}")
                    else:
                        print(f"   ✅ CLICK {click_num}: {slide_num}-{click_num}")
            else:
                if args.debug:
                    print(f"   ❌ No forward-progressing matches found")
        else:
            if args.debug:
                print(f"   ❌ No matches found")
    
    # PASS 2: Assign ambiguous segments based on neighbors
    print(f"\n🔍 PASS 2: Assigning {len(ambiguous_segments)} ambiguous segments based on neighbors...")
    
    for orig_idx, segment in ambiguous_segments:
        segment_text = segment['text']
        start_time = segment['start']
        speaker = segment['speaker']
        
        if args.debug:
            print(f"\n📍 {start_time:.2f}s - {speaker}: \"{segment_text}\" [AMBIGUOUS]")
        
        # Find nearest matched neighbors
        prev_match = None
        next_match = None
        
        # Look for previous match
        for i in range(orig_idx - 1, -1, -1):
            if i in timeline:
                prev_match = timeline[i]
                break
        
        # Look for next match  
        for i in range(orig_idx + 1, len(segments)):
            if i in timeline:
                next_match = timeline[i]
                break
        
        assigned_slide = None
        assigned_click = None
        assigned_position = None
        
        if prev_match and next_match:
            # Between two matches - check if they're on the same slide
            if prev_match['slide'] == next_match['slide']:
                # Same slide - use the slide
                assigned_slide = prev_match['slide']
                assigned_click = prev_match['click']
                assigned_position = prev_match['position']
                if args.debug:
                    print(f"   ✅ ASSIGNED to same slide: {assigned_slide}-{assigned_click}")
            else:
                # Different slides - prefer the temporally closer one
                time_to_prev = start_time - prev_match['end']
                time_to_next = next_match['start'] - segment['end']
                
                if time_to_prev <= time_to_next:
                    assigned_slide = prev_match['slide']
                    assigned_click = prev_match['click']
                    assigned_position = prev_match['position']
                    if args.debug:
                        print(f"   ✅ ASSIGNED to previous: {assigned_slide}-{assigned_click} (closer by {time_to_next-time_to_prev:.1f}s)")
                else:
                    assigned_slide = next_match['slide']
                    assigned_click = next_match['click']
                    assigned_position = next_match['position']
                    if args.debug:
                        print(f"   ✅ ASSIGNED to next: {assigned_slide}-{assigned_click} (closer by {time_to_prev-time_to_next:.1f}s)")
        
        elif prev_match:
            # Only previous match available
            assigned_slide = prev_match['slide']
            assigned_click = prev_match['click']
            assigned_position = prev_match['position']
            if args.debug:
                print(f"   ✅ ASSIGNED to previous: {assigned_slide}-{assigned_click}")
        
        elif next_match:
            # Only next match available
            assigned_slide = next_match['slide']
            assigned_click = next_match['click']
            assigned_position = next_match['position']
            if args.debug:
                print(f"   ✅ ASSIGNED to next: {assigned_slide}-{assigned_click}")
        
        else:
            # No neighbors - try to find any match and use first slide as fallback
            matches = find_segment_in_slides_simple(segment_text, slides)
            if matches:
                slide_num, click_num, position = matches[0]  # Take first match
                assigned_slide = slide_num
                assigned_click = click_num
                assigned_position = position
                if args.debug:
                    print(f"   ✅ FALLBACK MATCH: {assigned_slide}-{assigned_click}")
            else:
                # Ultimate fallback - assign to slide 1
                assigned_slide = 1
                assigned_click = 1
                assigned_position = 0
                if args.debug:
                    print(f"   ⚠️  ULTIMATE FALLBACK: slide 1-1")
        
        # Add to timeline
        if assigned_slide is not None:
            timeline[orig_idx] = {
                'original_index': orig_idx,
                'start': start_time,
                'end': segment['end'],
                'speaker': speaker,
                'text': segment_text,
                'slide': assigned_slide,
                'click': assigned_click,
                'position': assigned_position
            }
    
    # Convert timeline dict back to chronological list
    result_timeline = []
    for i in range(len(segments)):
        if i in timeline:
            result_timeline.append(timeline[i])
    
    print(f"\n✅ Two-pass matching complete: {len(result_timeline)}/{len(segments)} segments matched ({len(result_timeline)/len(segments)*100:.1f}%)")
    
    return result_timeline

def calculate_durations(timeline: List[Dict], audio_duration: float) -> List[Dict]:
    """Calculate durations for each timeline entry"""
    for i, entry in enumerate(timeline):
        if i < len(timeline) - 1:
            entry['duration'] = timeline[i + 1]['start'] - entry['start']
        else:
            entry['duration'] = audio_duration - entry['start']
    
    return timeline

def analyze_slide_progression(timeline: List[Dict]):
    """Analyze the slide progression for jumps"""
    print(f"\n📈 SLIDE PROGRESSION ANALYSIS:")
    
    jumps = []
    prev_slide = None
    
    for i, entry in enumerate(timeline):
        current_slide = entry['slide']
        
        if prev_slide is not None:
            slide_diff = current_slide - prev_slide
            
            if slide_diff > 1:
                jumps.append(f"⚠️  Forward jump at {entry['start']:.1f}s: {prev_slide} → {current_slide} (Δ+{slide_diff-1})")
            elif slide_diff < 0:
                jumps.append(f"🔴 Backward jump at {entry['start']:.1f}s: {prev_slide} → {current_slide} (Δ{slide_diff})")
        
        prev_slide = current_slide
    
    if jumps:
        print(f"❌ Found {len(jumps)} sudden jumps:")
        for jump in jumps[:10]:  # Show first 10
            print(f"   {jump}")
        if len(jumps) > 10:
            print(f"   ... and {len(jumps) - 10} more")
    else:
        print("✅ Perfect slide progression - no sudden jumps!")

def main():
    print("🎯 Two-Pass Positional Matching - No Jumps!")
    print("Objective: 100% segment coverage with natural slide progression")
    
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
    
    # Process with two-pass matching
    timeline = process_transcript_two_pass(segments, slides)
    
    if not timeline:
        print("❌ No matches found")
        return
    
    # Analyze progression
    analyze_slide_progression(timeline)
    
    # Calculate durations
    timeline = calculate_durations(timeline, audio_duration)
    
    print(f"\n✅ Created {len(timeline)} matches")
    
    # Create video - convert timeline format to match expected format
    video_timeline = []
    prev_slide = None
    for entry in timeline:
        is_slide_start = prev_slide is None or entry['slide'] != prev_slide
        video_timeline.append({
            'start_time': entry['start'],
            'slide_number': entry['slide'],
            'click_number': entry['click'],
            'duration': entry['duration'],
            'is_slide_start': is_slide_start,
            'image_name': f"{entry['slide']:03d}-{entry['click']:02d}.png"
        })
        prev_slide = entry['slide']
    
    video_file = create_positional_video(video_timeline, audio_file, image_dir)
    
    if video_file:
        print(f"\n🎉 Two-pass video: {video_file}")
        if len(timeline) == len(segments):
            print("🎯 PERFECT: 100% segment matching achieved with natural progression!")
        else:
            print(f"🎯 Coverage: {len(timeline)}/{len(segments)} segments ({len(timeline)/len(segments)*100:.1f}%)")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--debug', action='store_true', help='Enable debug output')
    args = parser.parse_args()
    main()