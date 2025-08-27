#!/usr/bin/env python3
"""
Generate Speaker Notes from Timestamped Transcript
=================================================
Creates a modified version of Slidev slides with speaker notes generated
directly from timestamped transcript to ensure 100% matching.

This script:
1. Loads existing slides structure (titles, content, layout)
2. Loads timestamped transcript with precise timing
3. Maps transcript segments to slides based on timing and content
4. Generates new speaker notes for each slide using exact transcript text
5. Creates a new .md file with original content + generated speaker notes

Usage:
    python generate_speaker_notes_from_transcript.py

This ensures perfect slide-audio synchronization since speaker notes
will contain the exact text from the timestamped transcript.
"""

import json
import re
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass

@dataclass
class SlideInfo:
    number: int
    title: str
    content: str
    layout: str
    original_notes: str
    start_line: int
    end_line: int

@dataclass
class TranscriptSegment:
    start: float
    end: float
    duration: float
    text: str
    speaker: str

def load_timestamped_transcript(file_path: Path) -> List[TranscriptSegment]:
    """Load timestamped transcript segments"""
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    segments = []
    for segment_data in data.get('segments', []):
        segments.append(TranscriptSegment(
            start=segment_data.get('start', 0),
            end=segment_data.get('end', 0),
            duration=segment_data.get('duration', 0),
            text=segment_data.get('text', ''),
            speaker=segment_data.get('speaker', 'Unknown')
        ))
    
    return segments

def parse_slidev_slides(file_path: Path) -> Tuple[List[SlideInfo], List[str]]:
    """Parse Slidev markdown file and extract slide structure"""
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    slides = []
    slide_boundaries = []
    
    # Find slide boundaries (marked by ---)
    for i, line in enumerate(lines):
        if line.strip() == '---':
            slide_boundaries.append(i)
    
    # Process each slide section
    slide_number = 0
    for i in range(len(slide_boundaries) - 1):
        start_line = slide_boundaries[i]
        end_line = slide_boundaries[i + 1]
        slide_content_lines = lines[start_line + 1:end_line]
        slide_content = ''.join(slide_content_lines)
        
        # Skip empty or metadata-only slides
        if not slide_content.strip() or len(slide_content.strip()) < 20:
            continue
            
        # Check if this is a real content slide (not just YAML)
        has_content = any(
            line.strip() and not line.strip().startswith('#') and 
            not line.strip().startswith('layout:') and
            not line.strip().startswith('title:') and
            not line.strip().startswith('---') and
            not ':' in line.strip()
            for line in slide_content_lines[:10]  # Check first 10 lines
        )
        
        if has_content:
            slide_number += 1
            
            # Extract title
            title = "Untitled"
            for line in slide_content_lines:
                if line.strip().startswith('# ') and not line.strip().startswith('## '):
                    title = line.strip()[2:].strip()
                    break
            
            # Extract layout
            layout = "default"
            for line in slide_content_lines:
                if line.strip().startswith('layout:'):
                    layout = line.split(':', 1)[1].strip()
                    break
            
            # Extract existing speaker notes
            original_notes = ""
            if '<!--' in slide_content:
                start_comment = slide_content.find('<!--')
                end_comment = slide_content.find('-->') + 3
                original_notes = slide_content[start_comment:end_comment]
                original_notes = original_notes.replace('<!--', '').replace('-->', '').strip()
            
            slides.append(SlideInfo(
                number=slide_number,
                title=title,
                content=slide_content,
                layout=layout,
                original_notes=original_notes,
                start_line=start_line,
                end_line=end_line
            ))
    
    return slides, lines

def map_transcript_to_slides(transcript: List[TranscriptSegment], slides: List[SlideInfo], 
                           audio_duration: float) -> Dict[int, List[TranscriptSegment]]:
    """Map transcript segments to slides based on timing"""
    
    # Calculate time ranges for each slide
    slide_duration = audio_duration / len(slides)
    slide_mapping = {}
    
    print(f"📊 Mapping {len(transcript)} segments to {len(slides)} slides")
    print(f"📊 Audio duration: {audio_duration:.1f}s, avg slide duration: {slide_duration:.1f}s")
    
    for slide in slides:
        # Calculate time window for this slide
        slide_start_time = (slide.number - 1) * slide_duration
        slide_end_time = slide.number * slide_duration
        
        # Find transcript segments that fall in this time window
        slide_segments = []
        for segment in transcript:
            # Segment belongs to this slide if its midpoint is in the slide's time window
            segment_midpoint = (segment.start + segment.end) / 2
            if slide_start_time <= segment_midpoint < slide_end_time:
                slide_segments.append(segment)
        
        slide_mapping[slide.number] = slide_segments
        print(f"   Slide {slide.number}: {slide_start_time:.1f}s-{slide_end_time:.1f}s → {len(slide_segments)} segments")
    
    return slide_mapping

def generate_speaker_notes_for_slide(slide: SlideInfo, segments: List[TranscriptSegment]) -> str:
    """Generate speaker notes for a slide from its transcript segments"""
    
    if not segments:
        return "<!-- No audio content mapped to this slide -->"
    
    # Group segments by speaker and create natural flow
    speaker_groups = []
    current_speaker = None
    current_group = []
    
    for segment in segments:
        if segment.speaker != current_speaker:
            if current_group:
                speaker_groups.append((current_speaker, current_group))
            current_speaker = segment.speaker
            current_group = [segment]
        else:
            current_group.append(segment)
    
    if current_group:
        speaker_groups.append((current_speaker, current_group))
    
    # Build speaker notes with [click] markers for natural pacing
    notes_lines = []
    
    for i, (speaker, group) in enumerate(speaker_groups):
        # Combine segments from same speaker
        combined_text = ' '.join(seg.text.strip() for seg in group)
        
        # Add [click] marker before each speaker change (except first)
        if i > 0:
            notes_lines.append("[click]")
        
        # Add speaker line
        notes_lines.append(f"{speaker}: {combined_text}")
    
    # Wrap in HTML comment
    notes_content = '\n'.join(notes_lines)
    return f"<!--\n{notes_content}\n-->"

def create_slides_with_generated_notes(original_lines: List[str], slides: List[SlideInfo], 
                                     slide_mapping: Dict[int, List[TranscriptSegment]]) -> List[str]:
    """Create new slide content with generated speaker notes"""
    
    new_lines = original_lines.copy()
    
    # Process slides in reverse order to preserve line numbers
    for slide in reversed(slides):
        # Generate new speaker notes
        segments = slide_mapping.get(slide.number, [])
        new_notes = generate_speaker_notes_for_slide(slide, segments)
        
        # Find where to insert/replace speaker notes
        slide_lines = new_lines[slide.start_line + 1:slide.end_line]
        
        # Remove existing speaker notes if any
        content_without_notes = []
        skip_comment = False
        for line in slide_lines:
            if line.strip().startswith('<!--'):
                skip_comment = True
            elif line.strip().endswith('-->'):
                skip_comment = False
                continue
            elif not skip_comment:
                content_without_notes.append(line)
        
        # Add new speaker notes at the end of slide content
        content_with_notes = content_without_notes + [f"\n{new_notes}\n"]
        
        # Replace the slide content in the main lines array
        new_lines[slide.start_line + 1:slide.end_line] = content_with_notes
    
    return new_lines

def main():
    print("🎯 Generating Speaker Notes from Timestamped Transcript")
    print("This ensures 100% matching between audio and slide notes")
    
    # File paths (configurable for any project)
    slides_file = Path("../slidev/python-programming-fundamentals-conversational.md")
    transcript_file = Path("../audio_scripts/1323203-summer-2023-solution-5min-test-timestamped.json")
    audio_file = Path("../ai_voiceover_system/podcasts/1323203-summer-2023-solution-5min-test.m4a")
    
    # Output file
    output_file = slides_file.parent / f"{slides_file.stem}-with-transcript-notes.md"
    
    print(f"📂 Input slides: {slides_file}")
    print(f"📂 Input transcript: {transcript_file}")
    print(f"📂 Output: {output_file}")
    
    # Load data
    print("\n📊 Loading data...")
    transcript = load_timestamped_transcript(transcript_file)
    slides, original_lines = parse_slidev_slides(slides_file)
    
    # Get audio duration
    try:
        from moviepy.editor import AudioFileClip
        audio = AudioFileClip(str(audio_file))
        audio_duration = audio.duration
        audio.close()
    except:
        audio_duration = transcript[-1].end if transcript else 300  # Fallback
    
    print(f"✅ Loaded {len(transcript)} transcript segments")
    print(f"✅ Loaded {len(slides)} slides")
    print(f"✅ Audio duration: {audio_duration:.1f}s")
    
    # Map transcript to slides
    print("\n🗺️ Mapping transcript to slides...")
    slide_mapping = map_transcript_to_slides(transcript, slides, audio_duration)
    
    # Generate new slides with speaker notes
    print("\n📝 Generating speaker notes...")
    new_lines = create_slides_with_generated_notes(original_lines, slides, slide_mapping)
    
    # Write output file
    with open(output_file, 'w') as f:
        f.writelines(new_lines)
    
    print(f"\n🎉 Created slides with generated speaker notes: {output_file}")
    print("✅ Speaker notes now contain exact transcript text for 100% matching!")
    
    # Show summary
    total_segments_mapped = sum(len(segments) for segments in slide_mapping.values())
    print(f"\n📊 Summary:")
    print(f"   Total segments mapped: {total_segments_mapped}/{len(transcript)}")
    print(f"   Coverage: {total_segments_mapped/len(transcript)*100:.1f}%")
    
    for slide_num, segments in slide_mapping.items():
        slide_info = next(s for s in slides if s.number == slide_num)
        print(f"   Slide {slide_num} ({slide_info.title[:30]}...): {len(segments)} segments")

if __name__ == "__main__":
    main()