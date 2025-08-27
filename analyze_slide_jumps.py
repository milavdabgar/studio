#!/usr/bin/env python3
"""
Analyze sudden slide jumps in the current matching system
"""
import re
import subprocess
from pathlib import Path

def get_matching_results():
    """Run the matching system and capture results"""
    cmd = [
        ".venv/bin/python", 
        "ai_voiceover_system/positional_matching_sync.py",
        "ai_voiceover_system/podcasts/1323203-summer-2023-solution-5min-test.m4a",
        "slidev/python-programming-fundamentals-conversational.md",
        "audio_scripts/1323203-summer-2023-solution-5min-test-timestamped.json",
        "--debug"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout

def parse_slide_progression(output):
    """Parse the slide progression from debug output"""
    matches = []
    
    # Find all segment matches
    segment_pattern = r'📍 ([\d.]+)s - ([^:]+): "([^"]+)"'
    slide_pattern = r'✅ (?:NEW SLIDE|CLICK \d+): (\d+)-(\d+)'
    
    lines = output.split('\n')
    current_segment = None
    
    for line in lines:
        segment_match = re.search(segment_pattern, line)
        if segment_match:
            current_segment = {
                'time': float(segment_match.group(1)),
                'speaker': segment_match.group(2),
                'text': segment_match.group(3)
            }
        
        slide_match = re.search(slide_pattern, line)
        if slide_match and current_segment:
            slide_num = int(slide_match.group(1))
            click_num = int(slide_match.group(2))
            matches.append({
                **current_segment,
                'slide': slide_num,
                'click': click_num
            })
            current_segment = None
    
    return matches

def find_sudden_jumps(matches):
    """Find sudden jumps in slide progression"""
    jumps = []
    
    for i in range(1, len(matches)):
        prev = matches[i-1]
        curr = matches[i]
        
        slide_diff = curr['slide'] - prev['slide']
        
        # Consider it a sudden jump if:
        # 1. Forward jump > 1 slide
        # 2. Any backward jump
        if slide_diff > 1:
            jumps.append({
                'type': 'forward_jump',
                'from_slide': f"{prev['slide']}-{prev['click']}",
                'to_slide': f"{curr['slide']}-{curr['click']}",
                'segment': curr,
                'slide_diff': slide_diff,
                'time': curr['time']
            })
        elif slide_diff < 0:
            jumps.append({
                'type': 'backward_jump', 
                'from_slide': f"{prev['slide']}-{prev['click']}",
                'to_slide': f"{curr['slide']}-{curr['click']}",
                'segment': curr,
                'slide_diff': slide_diff,
                'time': curr['time']
            })
    
    return jumps

# Run analysis
print("🔍 Analyzing slide progression for sudden jumps...")
output = get_matching_results()
matches = parse_slide_progression(output)
jumps = find_sudden_jumps(matches)

print(f"\n📊 Found {len(matches)} total segment matches")
print(f"⚠️  Found {len(jumps)} sudden jumps")

if jumps:
    print("\n🚨 SUDDEN JUMPS DETECTED:")
    print("=" * 80)
    
    for jump in jumps:
        jump_type = "🔴 BACKWARD" if jump['type'] == 'backward_jump' else "🟡 FORWARD"
        print(f"{jump_type} JUMP at {jump['time']:.1f}s:")
        print(f"   From: Slide {jump['from_slide']} → To: Slide {jump['to_slide']} (Δ{jump['slide_diff']:+d})")
        print(f"   Segment: \"{jump['segment']['text']}\"")
        print(f"   Speaker: {jump['segment']['speaker']}")
        print()

# Show slide progression timeline
print("\n📈 SLIDE PROGRESSION TIMELINE:")
print("=" * 50)
prev_slide = None
for match in matches[:20]:  # Show first 20 for overview
    slide_label = f"{match['slide']}-{match['click']}"
    if slide_label != prev_slide:
        marker = "🔥" if prev_slide and match['slide'] < int(prev_slide.split('-')[0]) else "✅"
        print(f"{marker} {match['time']:6.1f}s: Slide {slide_label} - \"{match['text'][:30]}...\"")
        prev_slide = slide_label

print(f"\n... (showing first 20 of {len(matches)} matches)")