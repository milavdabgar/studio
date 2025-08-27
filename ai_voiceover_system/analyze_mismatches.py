#!/usr/bin/env python3
"""
Analyze Transcript vs Speaker Notes Mismatches
==============================================
Identifies segments that don't match and suggests exact fixes for speaker notes.
"""

import json
from pathlib import Path
from typing import List, Dict

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
                    'notes': notes,
                    'original_part': part
                })
    
    return slides

def simple_match(search_text: str, target_text: str) -> bool:
    """Simple exact match with basic punctuation normalization"""
    # Remove common punctuation and normalize case
    def normalize(text):
        return text.lower().strip(' .,!?').replace(',', '').replace('.', '')
    
    search_norm = normalize(search_text)
    target_norm = normalize(target_text)
    
    return search_norm in target_norm

def find_matches_in_slides(segment_text: str, slides: List[Dict]) -> List[Dict]:
    """Find all slides that contain the segment text"""
    matches = []
    
    for slide in slides:
        if simple_match(segment_text, slide['notes']):
            matches.append({
                'slide_number': slide['number'],
                'slide_title': slide['title'],
                'notes': slide['notes']
            })
    
    return matches

def main():
    print("🔍 Analyzing Transcript vs Speaker Notes Mismatches")
    
    # File paths
    audio_file = Path("ai_voiceover_system/podcasts/1323203-summer-2023-solution-5min-test.m4a")
    slides_file = Path("slidev/python-programming-fundamentals-conversational.md")
    transcript_file = Path("audio_scripts/1323203-summer-2023-solution-5min-test-timestamped.json")
    
    # Load data
    segments = load_transcript(transcript_file)
    slides = parse_all_slides_with_notes(slides_file)
    
    print(f"📊 {len(segments)} transcript segments")
    print(f"📊 {len(slides)} slides with speaker notes")
    print()
    
    # Analyze each segment
    unmatched_segments = []
    matched_segments = []
    
    for i, segment in enumerate(segments):
        segment_text = segment.get('text', '')
        start_time = segment.get('start', 0)
        speaker = segment.get('speaker', '')
        
        matches = find_matches_in_slides(segment_text, slides)
        
        if matches:
            matched_segments.append({
                'segment': segment,
                'matches': matches
            })
        else:
            unmatched_segments.append({
                'index': i,
                'segment': segment,
                'text': segment_text,
                'start_time': start_time,
                'speaker': speaker
            })
    
    print(f"✅ Matched segments: {len(matched_segments)}")
    print(f"❌ Unmatched segments: {len(unmatched_segments)}")
    print(f"📈 Coverage: {len(matched_segments)/len(segments)*100:.1f}%")
    print()
    
    # Show first 20 unmatched segments for analysis
    print("❌ UNMATCHED SEGMENTS (first 20):")
    print("=" * 80)
    for i, unmatch in enumerate(unmatched_segments[:20]):
        print(f"{i+1:2d}. {unmatch['start_time']:6.2f}s - {unmatch['speaker']}: \"{unmatch['text']}\"")
    
    if len(unmatched_segments) > 20:
        print(f"... and {len(unmatched_segments) - 20} more unmatched segments")
    
    print()
    print("🔧 RECOMMENDED FIXES:")
    print("=" * 80)
    print("To achieve 100% matching, add these transcript segments to the appropriate speaker notes:")
    print()
    
    # Group consecutive unmatched segments for better speaker note placement suggestions
    for i, unmatch in enumerate(unmatched_segments[:10]):
        text = unmatch['text']
        speaker = unmatch['speaker']
        time = unmatch['start_time']
        
        print(f"Around {time:.1f}s - Add to speaker notes: \"{text}\"")
        
        # Try to find the closest matched segment to suggest where to add this
        closest_before = None
        for j in range(unmatch['index'] - 1, -1, -1):
            if j < len(segments):
                before_text = segments[j]['text']
                before_matches = find_matches_in_slides(before_text, slides)
                if before_matches:
                    closest_before = before_matches[0]
                    break
        
        if closest_before:
            print(f"   → Suggested location: After \"{segments[j]['text'][:50]}...\" in Slide {closest_before['slide_number']}")
        print()

if __name__ == "__main__":
    main()