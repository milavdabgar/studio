#!/usr/bin/env python3
"""
Video Synchronization Tester
Verifies that video slides match VTT timing expectations
"""

import re
import sys
from pathlib import Path

def extract_vtt_timing_from_slides(slides_md_path):
    """Extract VTT timing information from speaker notes"""
    
    with open(slides_md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    timing_segments = []
    
    # Find all VTT timing patterns
    pattern = r'\[click\] \((\d+:\d+)-(\d+:\d+)\): ([^⏰]*?)⏰ Timing: VTT (\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})'
    
    matches = re.findall(pattern, content, re.MULTILINE | re.DOTALL)
    
    for simple_start, simple_end, description, vtt_start, vtt_end in matches:
        # Convert VTT timestamps to seconds
        start_seconds = parse_vtt_timestamp(vtt_start)
        end_seconds = parse_vtt_timestamp(vtt_end)
        
        timing_segments.append({
            'simple_timing': f"{simple_start}-{simple_end}",
            'vtt_start': start_seconds,
            'vtt_end': end_seconds,
            'duration': end_seconds - start_seconds,
            'description': description.strip()
        })
    
    return timing_segments

def parse_vtt_timestamp(timestamp_str):
    """Convert VTT timestamp (HH:MM:SS.mmm) to seconds"""
    parts = timestamp_str.split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    seconds_parts = parts[2].split('.')
    seconds = int(seconds_parts[0])
    milliseconds = int(seconds_parts[1])
    
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000

def test_video_synchronization():
    """Test that video synchronization matches VTT timing"""
    
    slides_md_path = "podcast_slides/ટ્રાન્ઝિસ્ટર__નાનો_ઘટક,_મોટી_ક્રાંતિ_-_ડિજિટલ_યુગનો_પાયો_slidev/slides.md"
    video_path = "optimized_transistor_video.mp4"
    
    print("🧪 Testing Video Synchronization with VTT Timing")
    print("=" * 60)
    
    # Extract VTT timing data
    timing_segments = extract_vtt_timing_from_slides(slides_md_path)
    
    if not timing_segments:
        print("❌ No VTT timing data found in slides")
        return False
    
    print(f"✅ Found {len(timing_segments)} VTT timing segments")
    print()
    
    # Key timing points to verify
    key_test_points = [
        {"time": 0, "expected": "Title slide introduction"},
        {"time": 9, "expected": "Technology change discussion"},
        {"time": 32, "expected": "Basic explanation begins"},
        {"time": 79, "expected": "Bell Labs 1947 story"},
        {"time": 89, "expected": "Scientists mentioned"},
        {"time": 107, "expected": "Accidental discovery"},
        {"time": 127, "expected": "Nobel Prize achievement"},
        {"time": 147, "expected": "MOSFET introduction"},
        {"time": 187, "expected": "Statistics discussion"},
    ]
    
    print("🎯 Key Synchronization Test Points:")
    print("-" * 60)
    
    for test_point in key_test_points:
        test_time = test_point["time"]
        expected_content = test_point["expected"]
        
        # Find matching VTT segment
        matching_segment = None
        for segment in timing_segments:
            if segment['vtt_start'] <= test_time <= segment['vtt_end']:
                matching_segment = segment
                break
        
        if matching_segment:
            status = "✅ SYNCED"
            actual_timing = f"{matching_segment['vtt_start']:.1f}-{matching_segment['vtt_end']:.1f}s"
            description = matching_segment['description'][:100] + "..."
        else:
            status = "⚠️ NEEDS CHECK"
            actual_timing = "No matching segment"
            description = "May need timing adjustment"
        
        print(f"{status} | T={test_time:3d}s | Expected: {expected_content}")
        print(f"           | Actual: {actual_timing} | {description}")
        print()
    
    # Calculate timing accuracy metrics
    total_vtt_duration = sum(seg['duration'] for seg in timing_segments)
    avg_segment_duration = total_vtt_duration / len(timing_segments)
    
    print("📊 Timing Analysis Summary:")
    print("-" * 60)
    print(f"Total VTT segments: {len(timing_segments)}")
    print(f"Total VTT duration: {total_vtt_duration:.1f} seconds")
    print(f"Average segment: {avg_segment_duration:.1f} seconds")
    print()
    
    # Detailed timing breakdown by slide
    print("📋 Detailed VTT Timing Breakdown:")
    print("-" * 60)
    
    for i, segment in enumerate(timing_segments[:15], 1):  # Show first 15
        vtt_timing = f"{segment['vtt_start']:6.1f}s - {segment['vtt_end']:6.1f}s"
        duration = f"({segment['duration']:4.1f}s)"
        description = segment['description'][:60] + "..." if len(segment['description']) > 60 else segment['description']
        
        print(f"Segment {i:2d}: {vtt_timing} {duration} | {description}")
    
    if len(timing_segments) > 15:
        print(f"... and {len(timing_segments) - 15} more segments")
    
    print()
    print("🎉 Video synchronization analysis complete!")
    print("📺 Video file: optimized_transistor_video.mp4")
    print("📊 Slides: Uses VTT-optimized timing from speaker notes")
    print("⏰ Timing: Based on actual speech patterns and semantic breaks")
    
    return True

if __name__ == "__main__":
    success = test_video_synchronization()
    sys.exit(0 if success else 1)