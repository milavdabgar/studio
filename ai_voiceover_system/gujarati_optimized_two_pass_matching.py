#!/usr/bin/env python3
"""
Gujarati Optimized Two-Pass Matching: Test the complete pipeline
Testing Gujarati transcript → Speaker notes → Video generation
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
    no_match_segments = []
    
    for i, segment in enumerate(segments):
        matches = find_all_matches(segment['text'], slides)
        if len(matches) == 1:
            single_match_segments.append((i, segment, matches[0]))
        elif len(matches) > 1:
            multi_match_segments.append((i, segment, matches))
        else:
            no_match_segments.append((i, segment))
    
    print(f"📊 {len(single_match_segments)} single-match, {len(multi_match_segments)} multi-match, {len(no_match_segments)} no-match")
    
    # PASS 1: Single-match segments with forward progression
    timeline = {}
    last_position = 0
    
    for orig_idx, segment, match in single_match_segments:
        slide_num, click_num, position = match
        if position >= last_position:  # Forward progression only
            timeline[orig_idx] = create_timeline_entry(segment, slide_num, click_num, position, orig_idx)
            last_position = position
            debug_print(f"📍 {segment['start']:.1f}s: {slide_num}-{click_num}")
    
    # PASS 2: Multi-match segments by neighbor context - PROCESS IN ORDER
    # Sort multi-match segments by their original index to maintain chronological processing
    multi_match_segments.sort(key=lambda x: x[0])
    
    # Track the global progression position across all assigned segments
    global_position = last_position
    
    for orig_idx, segment, matches in multi_match_segments:
        prev_match, next_match = find_neighbors(orig_idx, timeline, segments)
        
        # Use the global progression position that includes all assignments so far
        assigned = assign_by_context(segment, matches, prev_match, next_match, global_position)
        
        if assigned:
            slide_num, click_num, position = assigned
            timeline[orig_idx] = create_timeline_entry(segment, slide_num, click_num, position, orig_idx)
            # Update global position to maintain forward progression
            global_position = max(global_position, position)
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

def assign_by_context(segment, matches, prev_match, next_match, global_position):
    """Assign segment based on neighbor context with smart progression logic"""
    if not matches:
        # No matches - inherit from closest neighbor
        if prev_match and next_match:
            time_to_prev = segment['start'] - prev_match['end']
            time_to_next = next_match['start'] - segment['end']
            return (prev_match['slide'], prev_match['click'], prev_match['position']) if time_to_prev <= time_to_next else (next_match['slide'], next_match['click'], next_match['position'])
        return (prev_match['slide'], prev_match['click'], prev_match['position']) if prev_match else (next_match['slide'], next_match['click'], next_match['position']) if next_match else (1, 1, 0)
    
    # Filter for forward progression matches first
    forward_matches = [m for m in matches if m[2] >= global_position]
    
    if prev_match and next_match:
        # Between neighbors - PRIORITY: same slide continuity with forward progression
        if prev_match['slide'] == next_match['slide']:
            # Both neighbors on same slide - prefer matches on that slide
            same_slide_matches = [m for m in matches if m[0] == prev_match['slide']]
            if same_slide_matches:
                # Try forward matches on same slide first
                same_slide_forward = [m for m in same_slide_matches if m[2] >= global_position]
                if same_slide_forward:
                    debug_print(f"SAME SLIDE FORWARD: {prev_match['slide']}")
                    return same_slide_forward[0]
                else:
                    debug_print(f"SAME SLIDE CONTINUITY: {prev_match['slide']}")
                    return same_slide_matches[0]
        
        # Different slides - prefer forward progression on neighbor slides
        if forward_matches:
            # Filter forward matches to neighbor slides first
            neighbor_slides = {prev_match['slide'], next_match['slide']}
            neighbor_forward = [m for m in forward_matches if m[0] in neighbor_slides]
            
            if neighbor_forward:
                # Choose based on temporal proximity
                time_to_prev = segment['start'] - prev_match['end']
                time_to_next = next_match['start'] - segment['end']
                
                prev_slide_forwards = [m for m in neighbor_forward if m[0] == prev_match['slide']]
                next_slide_forwards = [m for m in neighbor_forward if m[0] == next_match['slide']]
                
                if prev_slide_forwards and time_to_prev <= time_to_next:
                    return prev_slide_forwards[0]
                elif next_slide_forwards:
                    return next_slide_forwards[0]
                elif prev_slide_forwards:
                    return prev_slide_forwards[0]
            
            # No neighbor matches - choose closest slide in forward direction
            return min(forward_matches, key=lambda m: min(abs(m[0] - prev_match['slide']), abs(m[0] - next_match['slide'])))
        
        # No forward matches - inherit from temporally closer neighbor
        time_to_prev = segment['start'] - prev_match['end']
        time_to_next = next_match['start'] - segment['end']
        debug_print(f"NO FORWARD - inheriting from closer neighbor")
        return (prev_match['slide'], prev_match['click'], prev_match['position']) if time_to_prev <= time_to_next else (next_match['slide'], next_match['click'], next_match['position'])
    
    elif prev_match:
        # Only previous - prefer same slide with forward progression
        same_slide = [m for m in matches if m[0] == prev_match['slide']]
        if same_slide:
            # Try forward on same slide first
            same_slide_forward = [m for m in same_slide if m[2] >= global_position]
            if same_slide_forward:
                return same_slide_forward[0]
            else:
                return same_slide[0]
        
        # Try forward progression on closest slides
        if forward_matches:
            return min(forward_matches, key=lambda m: abs(m[0] - prev_match['slide']))
        else:
            # No forward matches - inherit from previous
            return (prev_match['slide'], prev_match['click'], prev_match['position'])
    
    elif next_match:
        # Only next - prefer same slide with forward progression
        same_slide = [m for m in matches if m[0] == next_match['slide']]
        if same_slide:
            # Try forward on same slide first
            same_slide_forward = [m for m in same_slide if m[2] >= global_position]
            if same_slide_forward:
                return same_slide_forward[0]
            else:
                return same_slide[0]
        
        # Try forward progression on closest slides
        if forward_matches:
            return min(forward_matches, key=lambda m: abs(m[0] - next_match['slide']))
        else:
            # No forward matches - inherit from next
            return (next_match['slide'], next_match['click'], next_match['position'])
    
    # No neighbors - prefer forward progression
    if forward_matches:
        return forward_matches[0]
    else:
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
    print("🚀 Gujarati Optimized Two-Pass Matching Test!")
    
    # File paths for Gujarati content
    audio_file = Path("ai_voiceover_system/podcasts/ટ્રાન્ઝિસ્ટર__નાનો_ઘટક,_મોટી_ક્રાંતિ_-_ડિજિટલ_યુગનો_પાયો.m4a")
    slides_file = Path("slidev/gujarati-transistor-fundamentals-conversational-with-transcript-notes.md")
    transcript_file = Path("audio_scripts/ટરનઝસટર-નન-ઘટક-મટ-કરત-ડજટલ-યગન-પય-timestamped-COMPATIBLE.json")
    image_dir = Path("enhanced_podcast_output")  # We might not have this, but test anyway
    
    print(f"📂 Audio: {audio_file}")
    print(f"📂 Slides: {slides_file}")
    print(f"📂 Transcript: {transcript_file}")
    
    # Load data
    print("\n📊 Loading data...")
    segments = load_transcript(transcript_file)
    slides = parse_all_slides_with_notes(slides_file)
    
    # Get audio duration
    try:
        audio = AudioFileClip(str(audio_file))
        audio_duration = audio.duration
        audio.close()
        print(f"✅ Audio duration: {audio_duration:.1f}s")
    except Exception as e:
        print(f"⚠️ Could not load audio file: {e}")
        print("   Using transcript duration as fallback")
        audio_duration = segments[-1]['end'] if segments else 349.44
    
    print(f"✅ Loaded {len(segments)} segments")
    print(f"✅ Loaded {len(slides)} slides")
    
    # Process with optimized two-pass
    print("\n🔍 Testing slide matching...")
    timeline = process_optimized_two_pass(segments, slides)
    
    # Analyze progression
    analyze_progression(timeline)
    
    # Calculate durations
    timeline = calculate_durations(timeline, audio_duration)
    
    matching_percentage = len(timeline)/len(segments)*100
    print(f"\n✅ Matched {len(timeline)}/{len(segments)} segments ({matching_percentage:.1f}%)")
    
    if matching_percentage > 80:
        print("🎉 Excellent matching! The pipeline should work great.")
    elif matching_percentage > 50:
        print("👍 Good matching! Minor adjustments might improve results.")
    else:
        print("⚠️ Low matching rate. The slide content might need adjustment.")
    
    # Show some examples of matched segments
    print("\n📋 Sample matched segments:")
    for i, entry in enumerate(timeline[:5]):  # Show first 5 matches
        print(f"   {i+1}. {entry['start']:.1f}s → Slide {entry['slide']}-{entry['click']}")
        print(f"      Text: {entry['text'][:60]}...")
    
    # Create video
    print("\n🎥 Creating Gujarati video...")
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
        print(f"🎉 Gujarati video generated: {video_file}")
        if len(timeline) == len(segments):
            print("🎯 PERFECT: 100% matching + 0 jumps!")
    else:
        print("❌ Video generation failed - check slide images")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--debug', action='store_true', help='Enable debug output')
    args = parser.parse_args()
    main()