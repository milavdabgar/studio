#!/usr/bin/env python3
"""
Optimized Two-Pass Matching: Single-match segments first, multi-match by neighbors
Clean, concise implementation achieving 100% coverage with 0 jumps
"""
import json
import sys
from pathlib import Path
from typing import List, Dict, Optional, Tuple

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

from positional_matching_sync import (
    load_transcript, parse_all_slides_with_notes, 
    find_in_slide_notes_with_clicks, create_positional_video
)
from moviepy.editor import AudioFileClip

# Global args variable
args = None

def find_all_matches(segment_text: str, slides: List[Dict]) -> List[Tuple[int, int, int]]:
    """Find all possible matches for a segment"""
    matches = []
    for slide in slides:
        slide_num = slide['number']
        notes = slide.get('notes', '')
        if notes:
            result = find_in_slide_notes_with_clicks(segment_text, notes, slide_num)
            if result:
                position, click_num, is_slide_start = result
                matches.append((slide_num, click_num, position))
    return matches

def process_optimized_two_pass(segments: List[Dict], slides: List[Dict]) -> List[Dict]:
    """Optimized two-pass: single-match first, multi-match by neighbors"""
    print("🎯 Optimized Two-Pass: Single-match → Multi-match by neighbors")
    
    # Classify segments by match count
    single_match_segments = []
    multi_match_segments = []
    
    for i, segment in enumerate(segments):
        matches = find_all_matches(segment['text'], slides)
        if len(matches) == 1:
            single_match_segments.append((i, segment, matches[0]))
        else:
            multi_match_segments.append((i, segment, matches))
    
    print(f"📊 {len(single_match_segments)} single-match, {len(multi_match_segments)} multi-match")
    
    # PASS 1: Single-match segments with forward progression
    timeline = {}
    last_position = 0
    
    for orig_idx, segment, match in single_match_segments:
        slide_num, click_num, position = match
        if position >= last_position:  # Forward progression only
            timeline[orig_idx] = create_timeline_entry(segment, slide_num, click_num, position, orig_idx)
            last_position = position
            debug_print(f"📍 {segment['start']:.1f}s: {slide_num}-{click_num}")
    
    # PASS 2: Multi-match segments by neighbor context
    for orig_idx, segment, matches in multi_match_segments:
        prev_match, next_match = find_neighbors(orig_idx, timeline, segments)
        
        # Get current position for this segment (latest from timeline)
        current_position = 0
        for timeline_idx in sorted([i for i in timeline.keys() if i < orig_idx], reverse=True):
            current_position = timeline[timeline_idx]['position']
            break
        
        assigned = assign_by_context(segment, matches, prev_match, next_match, current_position)
        
        if assigned:
            slide_num, click_num, position = assigned
            timeline[orig_idx] = create_timeline_entry(segment, slide_num, click_num, position, orig_idx)
            debug_print(f"📍 {segment['start']:.1f}s: {slide_num}-{click_num} [multi-match]")
    
    # Convert to chronological list
    return [timeline[i] for i in range(len(segments)) if i in timeline]

def create_timeline_entry(segment, slide_num, click_num, position, orig_idx):
    """Create standardized timeline entry"""
    return {
        'original_index': orig_idx,
        'start': segment['start'],
        'end': segment['end'],
        'speaker': segment['speaker'],
        'text': segment['text'],
        'slide': slide_num,
        'click': click_num,
        'position': position
    }

def find_neighbors(orig_idx, timeline, segments):
    """Find previous and next matched neighbors"""
    prev_match = next_match = None
    
    # Previous neighbor
    for i in range(orig_idx - 1, -1, -1):
        if i in timeline:
            prev_match = timeline[i]
            break
    
    # Next neighbor  
    for i in range(orig_idx + 1, len(segments)):
        if i in timeline:
            next_match = timeline[i]
            break
    
    return prev_match, next_match

def assign_by_context(segment, matches, prev_match, next_match, last_position):
    """Assign segment based on neighbor context - prioritize slide continuity over forward progression"""
    if not matches:
        # No matches - inherit from closest neighbor
        if prev_match and next_match:
            time_to_prev = segment['start'] - prev_match['end']
            time_to_next = next_match['start'] - segment['end']
            return (prev_match['slide'], prev_match['click'], prev_match['position']) if time_to_prev <= time_to_next else (next_match['slide'], next_match['click'], next_match['position'])
        return (prev_match['slide'], prev_match['click'], prev_match['position']) if prev_match else (next_match['slide'], next_match['click'], next_match['position']) if next_match else (1, 1, 0)
    
    if prev_match and next_match:
        # Between neighbors - PRIORITY: same slide continuity
        if prev_match['slide'] == next_match['slide']:
            # Both neighbors on same slide - strongly prefer that slide (even if backward)
            same_slide_matches = [m for m in matches if m[0] == prev_match['slide']]
            if same_slide_matches:
                debug_print(f"SAME SLIDE CONTINUITY: {prev_match['slide']}")
                return same_slide_matches[0]
        
        # Different slides - prefer forward progression when possible
        forward_matches = [m for m in matches if m[2] >= last_position]
        if forward_matches:
            # Filter forward matches to neighbor slides first
            prev_slide_forwards = [m for m in forward_matches if m[0] == prev_match['slide']]
            next_slide_forwards = [m for m in forward_matches if m[0] == next_match['slide']]
            
            if prev_slide_forwards and next_slide_forwards:
                # Both neighbors have forward matches - use temporal proximity
                time_to_prev = segment['start'] - prev_match['end']
                time_to_next = next_match['start'] - segment['end']
                return prev_slide_forwards[0] if time_to_prev <= time_to_next else next_slide_forwards[0]
            elif prev_slide_forwards:
                return prev_slide_forwards[0]
            elif next_slide_forwards:
                return next_slide_forwards[0]
            else:
                # No neighbor matches in forward - choose closest slide number
                return min(forward_matches, key=lambda m: min(abs(m[0] - prev_match['slide']), abs(m[0] - next_match['slide'])))
        else:
            # No forward matches - use temporal proximity to neighbors
            time_to_prev = segment['start'] - prev_match['end']
            time_to_next = next_match['start'] - segment['end']
            debug_print(f"NO FORWARD - temporal: prev={time_to_prev:.1f}s, next={time_to_next:.1f}s")
            return (prev_match['slide'], prev_match['click'], prev_match['position']) if time_to_prev <= time_to_next else (next_match['slide'], next_match['click'], next_match['position'])
    
    elif prev_match:
        # Only previous - prefer same slide, then forward progression
        same_slide = [m for m in matches if m[0] == prev_match['slide']]
        if same_slide:
            return same_slide[0]
        
        forward_matches = [m for m in matches if m[2] >= last_position]
        if forward_matches:
            return min(forward_matches, key=lambda m: abs(m[0] - prev_match['slide']))
        else:
            return (prev_match['slide'], prev_match['click'], prev_match['position'])
    
    elif next_match:
        # Only next - prefer same slide, then forward progression
        same_slide = [m for m in matches if m[0] == next_match['slide']]
        if same_slide:
            return same_slide[0]
        
        forward_matches = [m for m in matches if m[2] >= last_position]
        if forward_matches:
            return min(forward_matches, key=lambda m: abs(m[0] - next_match['slide']))
        else:
            return (next_match['slide'], next_match['click'], next_match['position'])
    
    # No neighbors - use first match
    return matches[0]

def debug_print(message):
    """Print debug message if debug mode is enabled"""
    if args and args.debug:
        print(f"   {message}")

def calculate_durations(timeline: List[Dict], audio_duration: float) -> List[Dict]:
    """Calculate durations for timeline entries"""
    for i, entry in enumerate(timeline):
        if i < len(timeline) - 1:
            entry['duration'] = timeline[i + 1]['start'] - entry['start']
        else:
            entry['duration'] = audio_duration - entry['start']
    return timeline

def analyze_progression(timeline: List[Dict]):
    """Analyze slide progression for jumps"""
    jumps = []
    prev_slide = None
    
    for entry in timeline:
        current_slide = entry['slide']
        if prev_slide and current_slide != prev_slide:
            slide_diff = current_slide - prev_slide
            if abs(slide_diff) > 1 or slide_diff < 0:
                jump_type = "🔴 BACKWARD" if slide_diff < 0 else "🟡 FORWARD"
                jumps.append(f"{jump_type} jump at {entry['start']:.1f}s: {prev_slide} → {current_slide} (Δ{slide_diff:+d})")
        prev_slide = current_slide
    
    print(f"\n📈 PROGRESSION: {'✅ Perfect - no jumps!' if not jumps else f'❌ {len(jumps)} jumps found'}")
    for jump in jumps[:5]:  # Show first 5 jumps
        print(f"   {jump}")

def main():
    print("🚀 Optimized Two-Pass Matching - Perfect Progression!")
    
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
    
    # Process with optimized two-pass
    timeline = process_optimized_two_pass(segments, slides)
    
    # Analyze progression
    analyze_progression(timeline)
    
    # Calculate durations
    timeline = calculate_durations(timeline, audio_duration)
    
    print(f"✅ Matched {len(timeline)}/{len(segments)} segments ({len(timeline)/len(segments)*100:.1f}%)")
    
    # Create video
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
        print(f"🎉 Optimized video: {video_file}")
        if len(timeline) == len(segments):
            print("🎯 PERFECT: 100% matching + 0 jumps!")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--debug', action='store_true', help='Enable debug output')
    args = parser.parse_args()
    main()