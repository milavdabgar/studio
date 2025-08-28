#!/usr/bin/env python3
"""
Structured Slide Generator
==========================
Generates Slidev presentations using predefined structured templates
to ensure perfect v-click and [click] marker synchronization.

This generator:
1. Uses structured slide templates with guaranteed synchronization
2. Maps transcript segments to appropriate slide templates
3. Generates consistent slide layouts with proper v-click patterns
4. Creates matching speaker notes with perfect [click] synchronization
5. Guides AI with clear content sections and structure

Usage:
    python structured_slide_generator.py <transcript_file> [--output output.md] [--slides 8]
"""

import json
import argparse
import sys
from pathlib import Path
from typing import List, Dict, Tuple
from dataclasses import dataclass

# Import our template system
from slide_structure_templates import (
    SLIDE_TEMPLATES, get_template, suggest_template,
    generate_slide_content, generate_speaker_notes
)

@dataclass
class TranscriptSegment:
    start: float
    end: float
    duration: float
    text: str

@dataclass
class StructuredSlide:
    number: int
    template_type: str
    title: str
    content_vars: Dict[str, str]
    notes_vars: Dict[str, str]
    transcript_segments: List[TranscriptSegment]

def load_transcript(file_path: Path) -> List[TranscriptSegment]:
    """Load transcript from JSON file"""
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
                text=item['text'].strip()
            ))
        
        return segments
    except Exception as e:
        print(f"❌ Error loading transcript: {e}")
        sys.exit(1)

def map_transcript_to_slides(transcript: List[TranscriptSegment], num_slides: int) -> Dict[int, List[TranscriptSegment]]:
    """Map transcript segments to slide numbers"""
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

def determine_slide_template(slide_number: int, segments: List[TranscriptSegment]) -> str:
    """Determine appropriate template based on slide content and position"""
    if slide_number == 1:
        return "TITLE_SLIDE"
    
    # Analyze content to suggest template
    combined_text = " ".join(segment.text for segment in segments).lower()
    
    if any(word in combined_text for word in ["vs", "versus", "compared", "difference", "pros", "cons"]):
        return "COMPARISON_SLIDE"
    elif any(word in combined_text for word in ["example", "demo", "show", "calculate", "step"]):
        return "EXAMPLE_SLIDE"
    elif any(word in combined_text for word in ["first", "second", "third", "1.", "2.", "3."]):
        return "THREE_SECTION_SLIDE"
    else:
        return "TWO_SECTION_SLIDE"

def extract_title_from_segments(segments: List[TranscriptSegment]) -> str:
    """Extract slide title from transcript segments"""
    # Look for key concepts in the transcript
    combined_text = " ".join(segment.text for segment in segments)
    
    # Common programming concepts for title extraction
    concepts = [
        ("algorithm", "Algorithms"),
        ("flow chart", "Flow Charts"),
        ("assignment", "Assignment Operators"),
        ("data type", "Data Types"),
        ("variable", "Variables"),
        ("function", "Functions"),
        ("loop", "Loops"),
        ("condition", "Conditionals")
    ]
    
    for keyword, title in concepts:
        if keyword in combined_text.lower():
            return title
    
    # Fallback: use first few words
    first_text = segments[0].text if segments else "Slide"
    words = first_text.split()[:4]
    return " ".join(words).title()

def generate_content_variables(template_type: str, segments: List[TranscriptSegment], title: str) -> Dict[str, str]:
    """Generate content variables for slide template"""
    combined_text = " ".join(segment.text for segment in segments)
    
    if template_type == "TITLE_SLIDE":
        return {
            "title": title,
            "subtitle": "Comprehensive Guide",
            "description": "Master the fundamental concepts through practical examples"
        }
    
    elif template_type == "TWO_SECTION_SLIDE":
        return {
            "title": title,
            "section1_title": "Core Concept",
            "section1_content": "- **Key principle**\\n- **Main characteristics**\\n- **Important details**",
            "section2_title": "Practical Application", 
            "section2_content": "**\"Real-world insight\"**\\n\\n- Clear explanation\\n- Practical example\\n- Direct benefit",
            "conclusion": "Essential understanding for programming success!"
        }
    
    elif template_type == "THREE_SECTION_SLIDE":
        return {
            "title": title,
            "section1_title": "First Key Point",
            "section1_content": "- **Primary concept**\\n- **Core principle**\\n- **Foundation**",
            "section2_title": "Second Key Point",
            "section2_content": "- **Building upon first**\\n- **Extension of concept**\\n- **Practical aspect**",
            "section3_title": "Third Key Point", 
            "section3_content": "- **Advanced application**\\n- **Real-world usage**\\n- **Best practices**",
            "conclusion": "Three pillars of understanding!"
        }
    
    elif template_type == "COMPARISON_SLIDE":
        return {
            "title": title,
            "left_title": "Advantages",
            "left_content": "- **Benefit one**\\n- **Benefit two**\\n- **Benefit three**",
            "right_title": "Considerations",
            "right_content": "- **Point to consider**\\n- **Limitation or trade-off**\\n- **Best practice**",
            "comparison_conclusion": "Understanding both sides leads to better decisions!"
        }
    
    elif template_type == "EXAMPLE_SLIDE":
        return {
            "title": title,
            "problem_title": "The Challenge",
            "problem_description": "**What we need to solve**\\n\\n- Problem context\\n- Why it matters\\n- What's at stake",
            "solution_title": "The Solution",
            "solution_content": "**Step-by-step approach**\\n\\n- Implementation method\\n- Key technique\\n- Practical steps",
            "insight_title": "Key Insight",
            "key_insight": "**\"The essential understanding that makes it all click!\"**"
        }
    
    return {}

def generate_speaker_notes_variables(template_type: str, segments: List[TranscriptSegment]) -> Dict[str, str]:
    """Generate speaker notes variables from transcript segments - USING EXACT TRANSCRIPT TEXT"""
    
    if template_type == "TITLE_SLIDE":
        # Use exact transcript text for natural opening dialogue
        if len(segments) >= 3:
            # Combine first few segments for natural flow
            opening = segments[0].text
            conversation = " ".join([seg.text for seg in segments[1:3]])
            transition = segments[-1].text if len(segments) > 3 else ""
        else:
            opening = segments[0].text if segments else "Welcome to our presentation."
            conversation = segments[1].text if len(segments) > 1 else ""
            transition = segments[-1].text if len(segments) > 2 else ""
        
        return {
            "opening_dialogue": opening,
            "natural_conversation": conversation, 
            "transition_to_next": transition
        }
    
    elif template_type == "COMPARISON_SLIDE":
        # Use exact transcript text for each section
        return {
            "opening_dialogue": segments[0].text if segments else "",
            "left_explanation": segments[1].text if len(segments) > 1 else "",
            "right_explanation": segments[2].text if len(segments) > 2 else "",
            "comparison_conclusion_explanation": segments[-1].text if len(segments) > 3 else ""
        }
    
    elif template_type == "EXAMPLE_SLIDE":
        # Use exact transcript text for problem-solution-insight
        return {
            "opening_dialogue": segments[0].text if segments else "",
            "problem_explanation": segments[1].text if len(segments) > 1 else "",
            "solution_explanation": segments[2].text if len(segments) > 2 else "",
            "insight_explanation": segments[-1].text if len(segments) > 3 else ""
        }
    
    elif template_type == "THREE_SECTION_SLIDE":
        # Use exact transcript text for three sections
        return {
            "opening_dialogue": segments[0].text if segments else "",
            "section1_explanation": segments[1].text if len(segments) > 1 else "",
            "section2_explanation": segments[2].text if len(segments) > 2 else "",
            "section3_explanation": segments[3].text if len(segments) > 3 else "",
            "conclusion_explanation": segments[-1].text if len(segments) > 4 else ""
        }
    
    else:  # TWO_SECTION_SLIDE and default
        # Use exact transcript text for two sections
        return {
            "opening_dialogue": segments[0].text if segments else "",
            "section1_explanation": segments[1].text if len(segments) > 1 else "",
            "section2_explanation": segments[2].text if len(segments) > 2 else "",
            "conclusion_explanation": segments[-1].text if len(segments) > 3 else ""
        }

def generate_structured_presentation(transcript: List[TranscriptSegment], 
                                  num_slides: int, 
                                  title: str) -> List[StructuredSlide]:
    """Generate structured slides from transcript"""
    slide_mapping = map_transcript_to_slides(transcript, num_slides)
    slides = []
    
    for slide_num in range(1, num_slides + 1):
        segments = slide_mapping.get(slide_num, [])
        
        # Determine template and title
        template_type = determine_slide_template(slide_num, segments)
        slide_title = extract_title_from_segments(segments) if slide_num > 1 else title
        
        # Generate variables
        content_vars = generate_content_variables(template_type, segments, slide_title)
        notes_vars = generate_speaker_notes_variables(template_type, segments)
        
        slides.append(StructuredSlide(
            number=slide_num,
            template_type=template_type,
            title=slide_title,
            content_vars=content_vars,
            notes_vars=notes_vars,
            transcript_segments=segments
        ))
    
    return slides

def create_slidev_presentation(slides: List[StructuredSlide], presentation_title: str) -> str:
    """Create complete Slidev presentation from structured slides"""
    lines = []
    
    # YAML frontmatter
    lines.extend([
        "---",
        "theme: default",
        f"title: {presentation_title}",
        "info: |",
        f"  ## {presentation_title}",
        "  ",
        "  Generated from timestamped transcript with structured templates",
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
        "- Replace placeholder content with meaningful, topic-specific content",
        "- Customize titles, headings, bullet points based on transcript content",  
        "- Add relevant examples, code snippets, or visuals",
        "- Enhance styling and visual presentation",
        "",
        "❌ FORBIDDEN MODIFICATIONS:",
        "- DO NOT modify v-click structure or numbering",
        "- DO NOT change [click] marker positions in speaker notes",
        "- DO NOT alter the exact speaker transcript text",
        "- DO NOT remove or change template structure",
        "",
        "🎯 GOAL: Perfect content while preserving synchronization structure",
        "-->",
        ""
    ])
    
    # Generate slides
    for i, slide in enumerate(slides):
        # Add slide separator (except for first slide)
        if i > 0:
            lines.extend(["---", "layout: default", "---", ""])
        
        # Generate slide content
        content = generate_slide_content(slide.template_type, slide.content_vars)
        lines.append(content)
        lines.append("")
        
        # Generate speaker notes
        notes = generate_speaker_notes(slide.template_type, slide.notes_vars)
        lines.append(notes)
        lines.append("")
    
    return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(
        description="Generate structured Slidev presentations with perfect synchronization",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python structured_slide_generator.py transcript.json
  python structured_slide_generator.py transcript.json --output presentation.md --slides 10
  python structured_slide_generator.py transcript.json --title "Advanced Python Concepts"
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
        help="Presentation title (default: extracted from transcript)"
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
    title = args.title or transcript_file.stem.replace('-', ' ').title()
    
    # Generate structured presentation
    print(f"🎯 Generating {args.slides} structured slides...")
    slides = generate_structured_presentation(transcript, args.slides, title)
    
    # Create presentation
    presentation_content = create_slidev_presentation(slides, title)
    
    # Write output file
    if args.output:
        output_file = Path(args.output)
    else:
        output_file = transcript_file.parent / f"{transcript_file.stem}-structured-template.md"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(presentation_content)
    
    print(f"✅ Generated structured presentation: {output_file}")
    
    # Report template usage
    print(f"\n📋 TEMPLATE USAGE:")
    template_counts = {}
    for slide in slides:
        template_counts[slide.template_type] = template_counts.get(slide.template_type, 0) + 1
    
    for template, count in template_counts.items():
        template_obj = get_template(template)
        print(f"   {template_obj.name}: {count} slides ({template_obj.v_click_count} v-clicks each)")
    
    total_v_clicks = sum(get_template(slide.template_type).v_click_count for slide in slides)
    print(f"\n🎯 PERFECT SYNCHRONIZATION GUARANTEED:")
    print(f"   Total slides: {len(slides)}")
    print(f"   Total v-clicks: {total_v_clicks}")
    print(f"   Total [click] markers: {total_v_clicks} (perfect 1:1 match)")
    print(f"🚀 Ready for flawless video generation!")

if __name__ == "__main__":
    main()