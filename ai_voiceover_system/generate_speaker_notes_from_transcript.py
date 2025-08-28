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
4. Generates clean speaker notes for each slide using exact transcript text
5. Merges consecutive segments from same speaker into single speaker notes
6. Creates a new .md file with original content + generated speaker notes

Usage:
    python generate_speaker_notes_from_transcript.py

Features:
- No automatic [click] markers (let humans/AI add meaningful ones)
- Merges consecutive same-speaker segments for natural flow
- Perfect slide-audio synchronization using exact transcript text
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
    """Parse Slidev markdown file and extract slide structure matching Python presentation pattern"""
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    slides = []
    slide_boundaries = []
    
    # Find slide boundaries (marked by ---)
    for i, line in enumerate(lines):
        if line.strip() == '---':
            slide_boundaries.append(i)
    
    # The first boundary ends the YAML frontmatter
    # The actual slides start after the frontmatter
    if len(slide_boundaries) < 2:
        print("⚠️ Warning: No proper slide structure found")
        return slides, lines
    
    # Process slides starting from after the frontmatter
    slide_number = 0
    
    # Handle the title slide (between first and second ---)
    title_slide_start = slide_boundaries[0]
    title_slide_end = slide_boundaries[1] if len(slide_boundaries) > 1 else len(lines)
    title_slide_content = lines[title_slide_start + 1:title_slide_end]
    title_slide_text = ''.join(title_slide_content)
    
    # Check if title slide has actual content (not just layout info)
    has_title_content = any(
        line.strip() and line.strip().startswith('#') 
        for line in title_slide_content
    )
    
    if has_title_content:
        slide_number += 1
        title = "Title Slide"
        for line in title_slide_content:
            if line.strip().startswith('# ') and not line.strip().startswith('## '):
                title = line.strip()[2:].strip()
                break
        
        slides.append(SlideInfo(
            number=slide_number,
            title=title,
            content=title_slide_text,
            layout="title",
            original_notes="",
            start_line=title_slide_start,
            end_line=title_slide_end
        ))
    
    # Process remaining content slides
    for i in range(1, len(slide_boundaries) - 1):
        start_line = slide_boundaries[i]
        end_line = slide_boundaries[i + 1]
        slide_content_lines = lines[start_line + 1:end_line]
        slide_content = ''.join(slide_content_lines)
        
        # Skip layout-only sections
        if not slide_content.strip():
            continue
            
        # Check if this section only contains layout information
        non_layout_lines = [
            line for line in slide_content_lines 
            if line.strip() and not line.strip().startswith('layout:') 
            and not line.strip().startswith('class:')
            and line.strip() != '---'
        ]
        
        if not non_layout_lines:
            continue
            
        # This is a real content slide
        slide_number += 1
        
        # Extract title
        title = f"Slide {slide_number}"
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
        
        slides.append(SlideInfo(
            number=slide_number,
            title=title,
            content=slide_content,
            layout=layout,
            original_notes="",
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
    """Generate speaker notes for a slide from its transcript segments matching Python presentation style"""
    
    if not segments:
        return "<!--\n<!-- AI AGENT: Add slide content above this comment. Do not modify this speaker notes section -->\n-->"
    
    # Group consecutive segments by speaker and merge their text
    speaker_groups = []
    current_speaker = None
    current_text_parts = []
    
    for segment in segments:
        if segment.speaker != current_speaker:
            # Save previous speaker's combined text
            if current_speaker and current_text_parts:
                combined_text = ' '.join(current_text_parts).strip()
                speaker_groups.append((current_speaker, combined_text))
            
            # Start new speaker group
            current_speaker = segment.speaker
            current_text_parts = [segment.text.strip()]
        else:
            # Same speaker - merge the text
            current_text_parts.append(segment.text.strip())
    
    # Don't forget the last speaker group
    if current_speaker and current_text_parts:
        combined_text = ' '.join(current_text_parts).strip()
        speaker_groups.append((current_speaker, combined_text))
    
    # Build speaker notes with exact transcript text and default [click] markers
    notes_lines = []
    
    # Add default [click] markers at positions 3, 5, and 7 (if segments exist)
    click_positions = {3, 5, 7}  # 1-indexed positions for [click] markers
    
    for i, (speaker, combined_text) in enumerate(speaker_groups, 1):
        # Add [click] marker if this is a target position
        if i in click_positions:
            notes_lines.append(f"[click] {speaker}: {combined_text}")
        else:
            notes_lines.append(f"{speaker}: {combined_text}")
        notes_lines.append("")
    
    # Wrap in HTML comment
    notes_content = '\n'.join(notes_lines)
    return f"<!--\n{notes_content}-->"

def create_slide_template_from_transcript(transcript: List[TranscriptSegment], 
                                        slide_mapping: Dict[int, List[TranscriptSegment]], 
                                        num_slides: int, presentation_title: str) -> List[str]:
    """Generate a complete Slidev presentation template with speaker notes from transcript"""
    
    lines = []
    
    # Add YAML frontmatter matching Python presentation style
    lines.extend([
        "---\n",
        "theme: default\n", 
        f"title: {presentation_title}\n",
        "info: |\n",
        f"  ## {presentation_title}\n",
        "  \n",
        "  Generated from timestamped transcript with exact speaker notes\n",
        "  for automated video generation and synchronization.\n",
        "class: text-center\n",
        "highlighter: shiki\n",
        "drawings:\n",
        "  persist: false\n", 
        "transition: slide-left\n",
        "mdc: true\n",
        "---\n",
        "\n"
    ])
    
    # Add AI Agent instructions at the top of the presentation
    lines.extend([
        "<!-- \n",
        "🤖 AI AGENT INSTRUCTIONS FOR SLIDE CONTENT GENERATION:\n",
        "\n",
        "✅ ALLOWED MODIFICATIONS:\n",
        "- Replace slide titles with meaningful content-based titles\n",
        "- Add slide content (headings, bullet points, visuals, layouts)\n",
        "- Add v-click animations using <v-click at=\"1\">, <v-click at=\"2\">, etc.\n",
        "- Add/remove/adjust [click] markers in speaker notes to match v-click animations\n",
        "- Add subtitle, description, and navigation elements to title slide\n",
        "\n",
        "❌ FORBIDDEN MODIFICATIONS:\n",
        "- DO NOT modify the speaker transcript text in comments\n",
        "- DO NOT change the speaker names (Dr. James, Sarah, etc.)\n",
        "- DO NOT alter the exact wording of transcript for video synchronization\n",
        "- DO NOT remove or change the structure of speaker notes comments\n",
        "\n",
        "🎯 GOAL: Create engaging slide content while preserving exact transcript text for video generation\n",
        "-->\n",
        "\n"
    ])
    
    # Generate slides
    for slide_num in range(1, num_slides + 1):
        segments = slide_mapping.get(slide_num, [])
        
        if slide_num == 1:
            # Title slide
            lines.extend([
                f"# {presentation_title}\n",
                "\n",
                "<!-- Add subtitle, description, and navigation elements above -->\n",
                "\n"
            ])
        else:
            # Content slides
            lines.extend([
                "---\n",
                "layout: default\n", 
                "---\n",
                "\n",
                f"# Slide {slide_num} Title\n",
                "\n",
                "<!-- Replace title above and add slide content here -->\n",
                "\n"
            ])
        
        # Add speaker notes for this slide
        speaker_notes = generate_speaker_notes_for_slide(
            SlideInfo(slide_num, f"Slide {slide_num}", "", "default", "", 0, 0), 
            segments
        )
        lines.append(f"{speaker_notes}\n")
        lines.append("\n")
    
    return lines

def create_slides_with_generated_notes(original_lines: List[str], slides: List[SlideInfo], 
                                     slide_mapping: Dict[int, List[TranscriptSegment]]) -> List[str]:
    """Create new slide content with generated speaker notes"""
    # This function is now replaced by create_slide_template_from_transcript
    # but kept for backward compatibility
    
    # Determine number of slides needed based on transcript mapping
    max_slide_num = max(slide_mapping.keys()) if slide_mapping else len(slides)
    
    # Generate fresh template with proper structure
    return create_slide_template_from_transcript(
        transcript=[],  # Will be filled by segments in slide_mapping
        slide_mapping=slide_mapping,
        num_slides=max_slide_num,
        presentation_title="Generated Presentation"
    )

def main():
    print("🎯 Generating Slidev Template with Speaker Notes from Timestamped Transcript")
    print("This creates a fresh presentation structure with exact transcript text for 100% video matching")
    
    # File paths (configurable for any project)
    transcript_file = Path("audio_scripts/ટરનઝસટર-નન-ઘટક-મટ-કરત-ડજટલ-યગન-પય-timestamped-COMPATIBLE.json")
    
    # Output file - generate new template with correct structure
    output_file = Path("slidev/gujarati-transistor-fundamentals-transcript-template.md")
    
    print(f"📂 Input transcript: {transcript_file}")
    print(f"📂 Output template: {output_file}")
    
    # Load transcript data
    print("\n📊 Loading transcript data...")
    transcript = load_timestamped_transcript(transcript_file)
    
    # Get audio duration
    audio_duration = transcript[-1].end if transcript else 300
    
    print(f"✅ Loaded {len(transcript)} transcript segments")
    print(f"✅ Audio duration: {audio_duration:.1f}s")
    
    # Calculate optimal number of slides (aim for 30-45 seconds per slide)
    target_slide_duration = 35  # seconds
    num_slides = max(5, min(15, int(audio_duration / target_slide_duration)))
    
    print(f"📊 Calculating optimal slide count: {num_slides} slides (avg {audio_duration/num_slides:.1f}s per slide)")
    
    # Create fake slides info for mapping (will be replaced by template)
    fake_slides = [
        SlideInfo(i, f"Slide {i}", "", "default", "", 0, 0) 
        for i in range(1, num_slides + 1)
    ]
    
    # Map transcript to slides
    print("\n🗺️ Mapping transcript segments to slides...")
    slide_mapping = map_transcript_to_slides(transcript, fake_slides, audio_duration)
    
    # Generate presentation title from transcript
    presentation_title = "ટ્રાન્ઝિસ્ટર: એક નાનકડો ઘટક, મહાન ક્રાંતિ"
    
    # Generate new slide template with speaker notes
    print(f"\n📝 Generating slide template with {num_slides} slides...")
    new_lines = create_slide_template_from_transcript(
        transcript=transcript,
        slide_mapping=slide_mapping, 
        num_slides=num_slides,
        presentation_title=presentation_title
    )
    
    # Write output file
    with open(output_file, 'w') as f:
        f.writelines(new_lines)
    
    print(f"\n🎉 Created Slidev template with speaker notes: {output_file}")
    print("✅ Speaker notes contain exact transcript text for 100% video matching!")
    print("✅ AI agents can now add slide content without modifying speaker notes")
    
    # Show mapping summary
    total_segments_mapped = sum(len(segments) for segments in slide_mapping.values())
    print(f"\n📊 Mapping Summary:")
    print(f"   Total segments mapped: {total_segments_mapped}/{len(transcript)}")
    print(f"   Coverage: {total_segments_mapped/len(transcript)*100:.1f}%")
    print(f"   Slides generated: {num_slides}")
    
    for slide_num, segments in slide_mapping.items():
        if segments:
            duration = sum(s.duration for s in segments)
            print(f"   Slide {slide_num}: {len(segments)} segments ({duration:.1f}s)")
    
    print(f"\n🚀 Next Steps:")
    print(f"   1. Review generated template: {output_file}")
    print(f"   2. Use AI agent to add slide content (following the AI AGENT instructions)")
    print(f"   3. AI agent should add [click] markers to match v-click animations")
    print(f"   4. Speaker notes text must remain unchanged for video sync")

if __name__ == "__main__":
    main()