#!/usr/bin/env python3
"""
Debug slide parsing to see which slide contains what
"""
from pathlib import Path

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
                    'notes': notes[:200] + "..." if len(notes) > 200 else notes
                })
            else:
                print(f"Slide {slide_number}: {title} - NO SPEAKER NOTES")
    
    return slides

slides_file = Path("slidev/python-programming-fundamentals-conversational.md")
slides = parse_all_slides_with_notes(slides_file)

print("📊 All slides with speaker notes:")
for slide in slides:
    print(f"Slide {slide['number']}: {slide['title']}")
    print(f"  Notes: {slide['notes']}")
    print()

# Look for data type related slides
print("🔍 Looking for data type related slides:")
for slide in slides:
    if "data" in slide['title'].lower() or "type" in slide['title'].lower():
        print(f"Found: Slide {slide['number']} - {slide['title']}")
        print(f"Notes: {slide['notes']}")
        print()