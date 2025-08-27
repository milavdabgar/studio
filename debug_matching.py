#!/usr/bin/env python3
"""
Debug the exact matching for the remaining segments
"""
import json
from pathlib import Path

def load_transcript(file_path: Path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data.get('segments', [])

def parse_all_slides_with_notes(file_path: Path):
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

def simple_match(search_text: str, target_text: str) -> bool:
    """Simple exact match with basic punctuation normalization"""
    # Remove common punctuation and normalize case
    def normalize(text):
        return text.lower().strip(' .,!?').replace(',', '').replace('.', '')
    
    search_norm = normalize(search_text)
    target_norm = normalize(target_text)
    
    return search_norm in target_norm

# Load data
audio_file = Path("ai_voiceover_system/podcasts/1323203-summer-2023-solution-5min-test.m4a")
slides_file = Path("slidev/python-programming-fundamentals-conversational.md")
transcript_file = Path("audio_scripts/1323203-summer-2023-solution-5min-test-timestamped.json")

segments = load_transcript(transcript_file)
slides = parse_all_slides_with_notes(slides_file)

# Test the problematic segments
problematic_segments = [
    "And there are quite a few types listed.",
    "Int, float, stripe, bool, list, tuple, set, dict.",
    "Even complex and untyped.",
    "It's a good range.",
    "You've got int,"
]

print("🔍 Testing exact matches for problematic segments:")
print()

for segment_text in problematic_segments:
    print(f"Testing: '{segment_text}'")
    found = False
    
    for slide in slides:
        if simple_match(segment_text, slide['notes']):
            print(f"  ✅ Found in Slide {slide['number']} ({slide['title']})")
            # Show a snippet of where it matches
            search_norm = segment_text.lower().strip(' .,!?').replace(',', '').replace('.', '')
            target_norm = slide['notes'].lower()
            start_idx = target_norm.find(search_norm)
            if start_idx != -1:
                snippet_start = max(0, start_idx - 30)
                snippet_end = min(len(slide['notes']), start_idx + len(search_norm) + 30)
                snippet = slide['notes'][snippet_start:snippet_end]
                print(f"    Context: ...{snippet}...")
            found = True
            break
    
    if not found:
        print(f"  ❌ NOT FOUND")
        # Try to find where it should be
        for slide in slides:
            if "data type" in slide['title'].lower() or "type" in slide['title'].lower():
                print(f"    Maybe should be in Slide {slide['number']} ({slide['title']})")
                print(f"    Current notes: {slide['notes'][:100]}...")
                break
    print()