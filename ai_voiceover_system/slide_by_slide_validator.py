#!/usr/bin/env python3
"""
Slide-by-slide Click Synchronization Validator
=============================================
Analyzes v-click and [click] marker synchronization on a per-slide basis
to understand the correct synchronization patterns in Slidev presentations.

This validator:
1. Parses each slide individually 
2. Counts unique v-click numbers per slide
3. Counts [click] markers in corresponding speaker notes
4. Reports per-slide synchronization status
5. Identifies the correct synchronization pattern

Usage:
    python slide_by_slide_validator.py <slidev_file.md>
"""

import argparse
import re
import sys
from pathlib import Path
from typing import List, Dict, Tuple
from dataclasses import dataclass

@dataclass
class SlideAnalysis:
    slide_number: int
    title: str
    unique_v_clicks: List[int]
    click_markers: int
    content_start: int
    content_end: int
    speaker_notes_start: int
    speaker_notes_end: int

def parse_slides(lines: List[str]) -> List[SlideAnalysis]:
    """Parse file into individual slides and analyze each one"""
    slides = []
    
    # Find slide boundaries
    slide_starts = []
    for i, line in enumerate(lines):
        if line.strip() == "---" and i > 0:
            # Skip YAML frontmatter
            if i > 10:  # Assume frontmatter is within first 10 lines
                slide_starts.append(i)
    
    # Add file start and end
    slide_starts.insert(0, 0)
    slide_starts.append(len(lines))
    
    # Analyze each slide
    for slide_num, (start, end) in enumerate(zip(slide_starts[:-1], slide_starts[1:]), 1):
        slide_lines = lines[start:end]
        
        # Find slide title
        title = "Untitled"
        for line in slide_lines:
            if line.startswith("# ") and not line.startswith("##"):
                title = line[2:].strip()
                break
        
        # Find speaker notes section
        speaker_start = -1
        speaker_end = -1
        content_end_line = end
        
        for i in range(len(slide_lines)):
            if slide_lines[i].strip().startswith("<!--"):
                speaker_start = start + i
                content_end_line = start + i
            elif slide_lines[i].strip() == "-->" and speaker_start != -1:
                speaker_end = start + i
                break
        
        # Count unique v-clicks in slide content
        unique_v_clicks = set()
        v_click_pattern = r'v-click\s*(?:at=)?"?(\d+)"?'
        
        for i in range(len(slide_lines)):
            line = slide_lines[i]
            if "v-click" in line and start + i < content_end_line:
                matches = re.findall(v_click_pattern, line)
                for match in matches:
                    unique_v_clicks.add(int(match))
                
                # Handle v-click="3" format
                match = re.search(r'v-click="(\d+)"', line)
                if match:
                    unique_v_clicks.add(int(match.group(1)))
        
        # Count [click] markers in speaker notes
        click_markers = 0
        if speaker_start != -1 and speaker_end != -1:
            for i in range(speaker_start, speaker_end + 1):
                if "[click]" in lines[i]:
                    click_markers += 1
        
        slides.append(SlideAnalysis(
            slide_number=slide_num,
            title=title,
            unique_v_clicks=sorted(list(unique_v_clicks)),
            click_markers=click_markers,
            content_start=start,
            content_end=content_end_line,
            speaker_notes_start=speaker_start,
            speaker_notes_end=speaker_end
        ))
    
    return slides

def main():
    parser = argparse.ArgumentParser(
        description="Slide-by-slide validation for Slidev v-click and [click] marker synchronization"
    )
    
    parser.add_argument(
        "slidev_file",
        help="Path to the Slidev markdown file"
    )
    
    args = parser.parse_args()
    
    file_path = Path(args.slidev_file)
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        sys.exit(1)
    
    slides = parse_slides(lines)
    
    print("🎯 SLIDE-BY-SLIDE SYNCHRONIZATION ANALYSIS")
    print("=" * 60)
    print(f"📁 File: {file_path.name}")
    print(f"📊 Total Slides: {len(slides)}")
    print()
    
    perfect_slides = 0
    total_v_clicks = 0
    total_click_markers = 0
    
    for slide in slides:
        status = "✅" if len(slide.unique_v_clicks) == slide.click_markers else "❌"
        if len(slide.unique_v_clicks) == slide.click_markers:
            perfect_slides += 1
        
        total_v_clicks += len(slide.unique_v_clicks)
        total_click_markers += slide.click_markers
        
        print(f"{status} Slide {slide.slide_number}: {slide.title}")
        print(f"   V-clicks: {len(slide.unique_v_clicks)} {slide.unique_v_clicks}")
        print(f"   [Click] markers: {slide.click_markers}")
        
        if len(slide.unique_v_clicks) != slide.click_markers:
            diff = len(slide.unique_v_clicks) - slide.click_markers
            if diff > 0:
                print(f"   🔧 Need {diff} more [click] markers")
            else:
                print(f"   🔧 Need {abs(diff)} fewer [click] markers")
        
        print()
    
    # Summary
    print("📈 SUMMARY:")
    print(f"   Perfect slides: {perfect_slides}/{len(slides)}")
    print(f"   Success rate: {(perfect_slides/len(slides)*100):.1f}%")
    print(f"   Total unique v-clicks: {total_v_clicks}")
    print(f"   Total [click] markers: {total_click_markers}")
    print(f"   Overall difference: {abs(total_v_clicks - total_click_markers)}")
    
    if perfect_slides == len(slides):
        print("\n🎉 PERFECT SLIDE-BY-SLIDE SYNCHRONIZATION!")
        print("🚀 Every slide has perfect v-click to [click] marker balance")
    else:
        print(f"\n⚠️  {len(slides) - perfect_slides} slides need adjustment")
        print("💡 Focus on fixing individual slides for perfect synchronization")

if __name__ == "__main__":
    main()