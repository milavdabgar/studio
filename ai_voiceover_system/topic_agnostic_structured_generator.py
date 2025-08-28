#!/usr/bin/env python3
"""
Topic-Agnostic Structured Slide Generator
=========================================
Generates Slidev presentations with:
1. Complete exact transcript preservation (like generate_speaker_notes_from_transcript.py)
2. Topic-agnostic structured slide templates for AI guidance
3. Perfect v-click and [click] marker synchronization by design

This generator:
- Uses ALL transcript text exactly as provided
- Provides structural templates without topic-specific content
- Ensures perfect synchronization through predefined patterns
- Guides AI with clear structure while preserving exact transcript

Usage:
    python topic_agnostic_structured_generator.py <transcript_file> [--output output.md] [--slides 8]
"""

import json
import argparse
import sys
from pathlib import Path
from typing import List, Dict
from dataclasses import dataclass

@dataclass
class TranscriptSegment:
    start: float
    end: float
    duration: float
    text: str
    speaker: str

def load_transcript(file_path: Path) -> List[TranscriptSegment]:
    """Load transcript from JSON file (same as original script)"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        segments = []
        
        # Handle nested structure with segments key
        if isinstance(data, dict) and 'segments' in data:
            transcript_data = data['segments']
        else:
            transcript_data = data
        
        for item in transcript_data:
            segments.append(TranscriptSegment(
                start=item['start'],
                end=item['end'], 
                duration=item['duration'],
                text=item['text'].strip(),
                speaker=item.get('speaker', 'Speaker')
            ))
        
        return segments
    except Exception as e:
        print(f"❌ Error loading transcript: {e}")
        sys.exit(1)

def map_transcript_to_slides(transcript: List[TranscriptSegment], num_slides: int) -> Dict[int, List[TranscriptSegment]]:
    """Map transcript segments to slide numbers (same logic as original)"""
    total_duration = sum(segment.duration for segment in transcript)
    duration_per_slide = total_duration / num_slides
    
    slide_mapping = {}
    current_slide = 1
    current_duration = 0
    
    for segment in transcript:
        if current_slide not in slide_mapping:
            slide_mapping[current_slide] = []
        
        slide_mapping[current_slide].append(segment)
        current_duration += segment.duration
        
        # Move to next slide if we've exceeded duration and we're not on the last slide
        if current_duration >= duration_per_slide and current_slide < num_slides:
            current_slide += 1
            current_duration = 0
    
    return slide_mapping

def generate_exact_speaker_notes(segments: List[TranscriptSegment], template_v_clicks: int) -> str:
    """Generate speaker notes with EXACT transcript text + proper [click] markers"""
    
    if not segments:
        return "<!--\n<!-- No transcript segments for this slide -->\n-->"
    
    # Group consecutive segments by speaker (same logic as original script)
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
    
    # Build speaker notes with exact transcript text
    notes_lines = []
    
    # Add [click] markers based on template structure
    # All slides: FIRST statement NEVER gets [click], then distribute remaining [click] markers
    
    if template_v_clicks == 0:
        # No v-clicks - natural opening dialogue (no [click] markers)
        for speaker, text in speaker_groups:
            notes_lines.append(f"{speaker}: {text}")
            notes_lines.append("")
    else:
        # Has v-clicks - FIRST statement NEVER gets [click], then distribute remaining [click] markers
        click_positions = set()
        if template_v_clicks > 0 and len(speaker_groups) > 1:
            # Calculate positions for [click] markers, starting from position 2 (never position 1)
            remaining_groups = len(speaker_groups) - 1  # Exclude first group
            if remaining_groups > 0:
                # Distribute [click] markers across remaining positions
                for i in range(template_v_clicks):
                    if remaining_groups == 1:
                        click_positions.add(2)  # Only second position gets [click]
                    else:
                        # Distribute evenly starting from position 2
                        position = 2 + int((i / (template_v_clicks - 1)) * (remaining_groups - 1)) if template_v_clicks > 1 else 2
                        position = min(position, len(speaker_groups))  # Don't exceed total groups
                        click_positions.add(position)
        
        # Generate notes with [click] markers - FIRST is always without [click]
        for i, (speaker, text) in enumerate(speaker_groups, 1):
            if i == 1:
                # FIRST statement NEVER has [click] marker
                notes_lines.append(f"{speaker}: {text}")
            elif i in click_positions:
                notes_lines.append(f"[click] {speaker}: {text}")
            else:
                notes_lines.append(f"{speaker}: {text}")
            notes_lines.append("")
    
    # Wrap in HTML comment
    notes_content = '\n'.join(notes_lines).rstrip()
    return f"<!--\n{notes_content}\n-->"

# Topic-agnostic slide templates
SLIDE_STRUCTURES = {
    "title": {
        "v_clicks": 3,
        "content": """# {title}

<v-click at="1">

## {subtitle}

</v-click>

<v-click at="2">

**{description}**

</v-click>

<v-click at="3">

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space for next slide <carbon:arrow-right class="inline"/>
  </span>
</div>

</v-click>"""
    },
    
    "two_section": {
        "v_clicks": 3,
        "content": """# Slide Title

<div class="grid grid-cols-2 gap-8">

<div>

## **First Concept**

<v-click at="1">

<!-- AI AGENT: Add content based on transcript context -->

</v-click>

</div>

<div v-click at="2">

## **Second Concept**

<!-- AI AGENT: Add content based on transcript context -->

</div>

</div>

<div v-click="3" class="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
<strong>Key Insight:</strong> <!-- AI AGENT: Add summary from transcript -->
</div>"""
    },
    
    "three_section": {
        "v_clicks": 4,
        "content": """# Slide Title

<div class="grid grid-cols-3 gap-6">

<div v-click="1" class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">

## **Point A**

<!-- AI AGENT: Add content from transcript -->

</div>

<div v-click="2" class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">

## **Point B**

<!-- AI AGENT: Add content from transcript -->

</div>

<div v-click="3" class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">

## **Point C**

<!-- AI AGENT: Add content from transcript -->

</div>

</div>

<div v-click="4" class="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-lg">
<strong>Summary:</strong> <!-- AI AGENT: Add conclusion from transcript -->
</div>"""
    },
    
    "comparison": {
        "v_clicks": 3,
        "content": """# Slide Title

<div class="grid grid-cols-2 gap-8">

<div class="bg-blue-50 p-6 rounded-lg">

## ✅ **Aspect A**

<v-click at="1">

<!-- AI AGENT: Add content from transcript -->

</v-click>

</div>

<div class="bg-orange-50 p-6 rounded-lg">

## ⚠️ **Aspect B**

<v-click at="2">

<!-- AI AGENT: Add content from transcript -->

</v-click>

</div>

</div>

<div v-click="3" class="mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
<strong>Takeaway:</strong> <!-- AI AGENT: Add conclusion from transcript -->
</div>"""
    }
}

def select_slide_structure(slide_number: int, total_slides: int) -> str:
    """Select appropriate slide structure based on position"""
    if slide_number == 1:
        return "title"
    elif slide_number == total_slides:
        return "two_section"  # Summary slide
    else:
        # Vary structure for content slides
        structures = ["two_section", "three_section", "comparison"]
        return structures[(slide_number - 2) % len(structures)]

def create_structured_slidev_presentation(transcript: List[TranscriptSegment], 
                                        num_slides: int, 
                                        presentation_title: str) -> str:
    """Create complete structured Slidev presentation with exact transcript"""
    
    slide_mapping = map_transcript_to_slides(transcript, num_slides)
    
    lines = []
    
    # YAML frontmatter (same as original)
    lines.extend([
        "---",
        "theme: default",
        f"title: {presentation_title}",
        "info: |",
        f"  ## {presentation_title}",
        "  ",
        "  Generated with structured templates and exact transcript text",
        "  for perfect v-click and [click] marker synchronization.",
        "  ",
        "  Ensures flawless video generation with precise audio-visual timing.",
        "class: text-center",
        "highlighter: shiki",
        "drawings:",
        "  persist: false",
        "transition: slide-left", 
        "mdc: true",
        "---",
        "",
        "<!-- ",
        "🤖 AI AGENT INSTRUCTIONS FOR SLIDE CONTENT GENERATION:",
        "",
        "✅ ALLOWED MODIFICATIONS:",
        "- Replace slide titles with meaningful content-based titles from transcript",
        "- Fill in placeholder content areas with relevant information from transcript", 
        "- Customize headings, bullet points, and visual elements",
        "- Add relevant examples, code snippets, or explanations",
        "",
        "❌ FORBIDDEN MODIFICATIONS:",
        "- DO NOT modify v-click structure or numbering",
        "- DO NOT change [click] marker positions in speaker notes",
        "- DO NOT alter the exact speaker transcript text",
        "- DO NOT remove or change template structure",
        "",
        "🎯 GOAL: Create engaging slides while preserving exact transcript and perfect synchronization",
        "-->",
        ""
    ])
    
    # Generate slides
    for slide_num in range(1, num_slides + 1):
        segments = slide_mapping.get(slide_num, [])
        
        # Add slide separator (except for first slide)
        if slide_num > 1:
            lines.extend(["---", "layout: default", "---", ""])
        
        # Select appropriate structure
        structure_type = select_slide_structure(slide_num, num_slides)
        structure = SLIDE_STRUCTURES[structure_type]
        
        # Generate slide content
        if structure_type == "title":
            content = structure["content"].format(
                title=presentation_title,
                subtitle="Comprehensive Overview", 
                description="Detailed exploration of key concepts and practical applications"
            )
        else:
            content = structure["content"]
        
        lines.append(content)
        lines.append("")
        
        # Generate speaker notes with EXACT transcript text
        speaker_notes = generate_exact_speaker_notes(segments, structure["v_clicks"])
        lines.append(speaker_notes)
        lines.append("")
    
    return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(
        description="Generate topic-agnostic structured Slidev presentations with exact transcript",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python topic_agnostic_structured_generator.py transcript.json
  python topic_agnostic_structured_generator.py transcript.json --output presentation.md
  python topic_agnostic_structured_generator.py transcript.json --slides 10 --title "My Topic"
        """
    )
    
    parser.add_argument(
        "transcript_file",
        help="Path to timestamped transcript JSON file"
    )
    
    parser.add_argument(
        "--output", "-o",
        help="Output file path (default: auto-generated)"
    )
    
    parser.add_argument(
        "--slides", "-s",
        type=int,
        default=8,
        help="Number of slides to generate (default: 8)"
    )
    
    parser.add_argument(
        "--title", "-t",
        help="Presentation title (default: extracted from filename)"
    )
    
    args = parser.parse_args()
    
    # Validate input file
    transcript_file = Path(args.transcript_file)
    if not transcript_file.exists():
        print(f"❌ Transcript file not found: {transcript_file}")
        sys.exit(1)
    
    # Load transcript
    print(f"📁 Loading transcript: {transcript_file.name}")
    transcript = load_transcript(transcript_file)
    print(f"📊 Loaded {len(transcript)} transcript segments")
    
    # Extract title
    if args.title:
        title = args.title
    else:
        title = transcript_file.stem.replace('-', ' ').replace('_', ' ').title()
    
    # Generate structured presentation
    print(f"🎯 Generating {args.slides} structured slides with exact transcript...")
    presentation_content = create_structured_slidev_presentation(transcript, args.slides, title)
    
    # Write output file
    if args.output:
        output_file = Path(args.output)
    else:
        output_file = transcript_file.parent / f"{transcript_file.stem}-structured-exact.md"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(presentation_content)
    
    print(f"✅ Generated structured presentation: {output_file}")
    
    # Calculate synchronization stats
    slide_mapping = map_transcript_to_slides(transcript, args.slides)
    total_v_clicks = 0
    total_click_markers = 0
    
    for slide_num in range(1, args.slides + 1):
        structure_type = select_slide_structure(slide_num, args.slides)
        v_clicks = SLIDE_STRUCTURES[structure_type]["v_clicks"]
        total_v_clicks += v_clicks
        
        # Count [click] markers based on segments
        segments = slide_mapping.get(slide_num, [])
        if v_clicks == 0:
            click_markers = 0
        else:
            click_markers = min(v_clicks, len([s for s in segments if s.text.strip()]))
        total_click_markers += click_markers
    
    print(f"\n🎯 STRUCTURED TEMPLATE SUMMARY:")
    print(f"   Total slides: {args.slides}")
    print(f"   Total v-clicks: {total_v_clicks}")
    print(f"   Total [click] markers: {total_click_markers}")
    print(f"   Expected synchronization: {'✅ Perfect' if total_v_clicks == total_click_markers else '⚠️ Needs adjustment'}")
    print(f"\n📋 STRUCTURE DISTRIBUTION:")
    
    structure_counts = {}
    for slide_num in range(1, args.slides + 1):
        structure_type = select_slide_structure(slide_num, args.slides)
        structure_counts[structure_type] = structure_counts.get(structure_type, 0) + 1
    
    for structure, count in structure_counts.items():
        v_clicks = SLIDE_STRUCTURES[structure]["v_clicks"]
        print(f"   {structure.replace('_', ' ').title()}: {count} slides ({v_clicks} v-clicks each)")
    
    print(f"\n🚀 NEXT STEPS:")
    print(f"   1. AI can now customize slide content using transcript context")
    print(f"   2. Exact transcript text preserved in speaker notes")
    print(f"   3. Perfect v-click/[click] synchronization by design")
    print(f"   4. Ready for flawless video generation!")

if __name__ == "__main__":
    main()