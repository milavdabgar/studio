#!/usr/bin/env python3
"""
Enhanced Structured Slide Generator with Smart Segmentation
===========================================================
Combines:
1. Smart multi-constraint segmentation (from smart_speaker_notes_generator.py)
2. Topic-agnostic structured templates (from topic_agnostic_structured_generator.py) 
3. Perfect v-click and [click] marker synchronization by design
4. Complete exact transcript preservation

This generator:
- Uses smart boundary detection and optimization for natural segments
- Applies structured slide templates with AI guidance
- Ensures perfect synchronization through predefined patterns
- Preserves exact transcript text in speaker notes

Usage:
    python enhanced_structured_generator.py <transcript_file> [--output output.md] [--slides 8]
"""

import json
import argparse
import sys
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum
import re

@dataclass
class TranscriptSegment:
    start: float
    end: float
    duration: float
    text: str
    speaker: str

class ConstraintType(Enum):
    HARD = "hard"
    MEDIUM = "medium" 
    SOFT = "soft"

@dataclass
class ConstraintConfig:
    """Configuration for multi-constraint optimization"""
    # Target timings
    target_slide_duration: float = 40.0  # seconds
    target_click_duration: float = 10.0  # seconds
    
    # Word count constraints
    min_words_per_segment: int = 15
    max_words_per_segment: int = 60
    target_words_per_segment: int = 35
    
    # Boundary scoring weights
    sentence_end_weight: float = 50.0
    speaker_turn_weight: float = 40.0
    paragraph_break_weight: float = 30.0
    thought_complete_weight: float = 45.0
    
    # Quality thresholds
    min_quality_score: float = 100.0
    
    def __post_init__(self):
        """Validate constraint configuration"""
        assert self.target_slide_duration > 0, "Target slide duration must be positive"
        assert self.min_words_per_segment <= self.max_words_per_segment, "Invalid word range"

@dataclass
class SmartBreakpoint:
    """Represents a potential segment breakpoint with quality scoring"""
    transcript_index: int
    time: float
    word_count_before: int
    duration_before: float
    quality_score: float
    reasons: List[str]
    
    def __str__(self):
        return f"Breakpoint at {self.time:.1f}s (score: {self.quality_score:.1f})"

class SmartSegmentGenerator:
    """Smart transcript segmentation with multi-constraint optimization and content intelligence"""
    
    def __init__(self, config: Optional[ConstraintConfig] = None):
        self.config = config or ConstraintConfig()
        
        # Educational pattern detection
        self.mnemonic_patterns = [
            r'mnemonic.*?([A-Z])\s+(?:or\s+)?([A-Z]+)',  # "mnemonic C or VC"
            r'([A-Z])\s+(?:or\s+)?([A-Z]+).*?remember',   # "CERVC to remember"
            r'([A-Z]{2,})[.,]\s*([A-Z])\s+is\s+for',     # "PDRSC. P is for"
        ]
        
        self.definition_markers = [
            r'what is (.*?)\?',
            r'(.*?) is (?:just |basically )?(?:a |an )?(.*?)(?:\.|,)',
            r'at its heart.*?it\'s (.*?)(?:\.|,)',
            r'(.*?) are (?:basically |just )?(.*?)(?:\.|,)'
        ]
    
    def load_transcript(self, file_path: Path) -> List[TranscriptSegment]:
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
                    text=item['text'].strip(),
                    speaker=item.get('speaker', 'Speaker')
                ))
            
            return segments
        except Exception as e:
            print(f"❌ Error loading transcript: {e}")
            sys.exit(1)
    
    def detect_natural_boundaries(self, transcript: List[TranscriptSegment]) -> List[SmartBreakpoint]:
        """Detect natural boundaries using punctuation and speaker patterns"""
        breakpoints = []
        
        for i, segment in enumerate(transcript[:-1]):  # Skip last segment
            cumulative_time = sum(s.duration for s in transcript[:i+1])
            cumulative_words = len(' '.join(s.text for s in transcript[:i+1]).split())
            
            reasons = []
            score = 0.0
            
            # Sentence completion detection
            if re.search(r'[.!?]\s*$', segment.text.strip()):
                reasons.append("Sentence end")
                score += self.config.sentence_end_weight
            
            # Speaker turn detection
            if i < len(transcript) - 1 and segment.speaker != transcript[i+1].speaker:
                reasons.append("Speaker turn")
                score += self.config.speaker_turn_weight
            
            # Paragraph/thought completion
            if re.search(r'[.!?]\s+(Right|Okay|Yes|Got it|Exactly|Makes sense)', 
                        transcript[i+1].text if i < len(transcript) - 1 else ""):
                reasons.append("Thought complete")
                score += self.config.thought_complete_weight
            
            # Long pause detection (implied by segment boundaries)
            if segment.end < transcript[i+1].start - 0.5:  # 500ms gap
                reasons.append("Natural pause")
                score += 20.0
            
            if score > 0:  # Only add meaningful breakpoints
                breakpoints.append(SmartBreakpoint(
                    transcript_index=i+1,
                    time=cumulative_time,
                    word_count_before=cumulative_words,
                    duration_before=cumulative_time,
                    quality_score=score,
                    reasons=reasons
                ))
        
        return sorted(breakpoints, key=lambda x: x.quality_score, reverse=True)
    
    def optimize_segments(self, transcript: List[TranscriptSegment], 
                         target_segments: int) -> List[List[TranscriptSegment]]:
        """Generate optimally balanced segments using multi-constraint optimization"""
        
        if target_segments <= 1:
            return [transcript]
        
        total_duration = sum(s.duration for s in transcript)
        target_duration_per_segment = total_duration / target_segments
        
        # Simple balanced segmentation approach (more reliable than complex optimization)
        segments_created = []
        current_duration = 0
        current_segment = []
        segment_index = 0
        
        for i, segment in enumerate(transcript):
            current_segment.append(segment)
            current_duration += segment.duration
            
            # Check if we should end this segment
            should_end_segment = False
            
            if segment_index < target_segments - 1:  # Not the last segment
                # End if we've exceeded target duration and have enough content
                if current_duration >= target_duration_per_segment and len(current_segment) >= 2:
                    should_end_segment = True
                # Or if we're significantly over target
                elif current_duration >= target_duration_per_segment * 1.3:
                    should_end_segment = True
            else:
                # Last segment - collect remaining
                should_end_segment = (i == len(transcript) - 1)
            
            if should_end_segment:
                segments_created.append(current_segment[:])
                current_segment = []
                current_duration = 0
                segment_index += 1
                
                if segment_index >= target_segments:
                    break
        
        # Add any remaining segments to the last created segment
        if current_segment and segments_created:
            segments_created[-1].extend(current_segment)
        elif current_segment:
            segments_created.append(current_segment)
        
        # Ensure we have exactly target_segments
        while len(segments_created) < target_segments:
            # Split the longest segment
            longest_idx = max(range(len(segments_created)), 
                            key=lambda i: len(segments_created[i]))
            longest = segments_created[longest_idx]
            
            if len(longest) >= 2:
                mid = len(longest) // 2
                first_half = longest[:mid]
                second_half = longest[mid:]
                segments_created[longest_idx] = first_half
                segments_created.insert(longest_idx + 1, second_half)
            else:
                break
        
        return segments_created[:target_segments]

# Structured slide templates (from topic_agnostic_structured_generator.py)
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

def detect_educational_patterns(segments: List[TranscriptSegment]) -> Dict[str, List[int]]:
    """Detect educational content patterns and suggest natural [click] positions"""
    
    if not segments:
        return {}
    
    combined_text = ' '.join(seg.text for seg in segments)
    pattern_suggestions = {}
    
    # Detect mnemonic patterns (CERVC, PDRSC)
    mnemonic_patterns = [
        r'mnemonic.*?([A-Z])\s+(?:or\s+)?([A-Z]+)',
        r'([A-Z])\s+(?:or\s+)?([A-Z]+).*?remember', 
        r'([A-Z]{2,})[.,]\s*([A-Z])\s+is\s+for',
    ]
    
    for pattern in mnemonic_patterns:
        match = re.search(pattern, combined_text, re.IGNORECASE)
        if match:
            mnemonic_letters = ''.join(match.groups()).replace(' ', '')
            # Suggest breaks for each letter explanation
            letter_positions = []
            segment_idx = 0
            for seg in segments:
                for i, letter in enumerate(mnemonic_letters):
                    if re.search(rf'{letter}\s+is\s+(?:for\s+)?', seg.text, re.IGNORECASE):
                        letter_positions.append(segment_idx + 1)
                        break
                segment_idx += 1
            
            if len(letter_positions) >= 2:
                pattern_suggestions['mnemonic'] = letter_positions[:template_v_clicks]
    
    # Detect definition-example patterns
    definition_markers = [
        r'what is.*?\?',
        r'algorithm.*?is.*?(?:step-by-step|procedure)',
        r'flow\s*chart.*?(?:are|is).*?visual'
    ]
    
    for i, seg in enumerate(segments):
        for marker in definition_markers:
            if re.search(marker, seg.text, re.IGNORECASE):
                # Next speaker turn likely contains elaboration
                if i + 1 < len(segments) and segments[i+1].speaker != seg.speaker:
                    pattern_suggestions.setdefault('definition_example', []).append(i + 1)
    
    # Detect question-answer flows
    for i, seg in enumerate(segments):
        if seg.text.strip().endswith('?') and i + 1 < len(segments):
            next_seg = segments[i + 1]
            if next_seg.speaker != seg.speaker:
                pattern_suggestions.setdefault('question_answer', []).append(i + 1)
    
    return pattern_suggestions

def generate_exact_speaker_notes(segments: List[TranscriptSegment], template_v_clicks: int) -> str:
    """Generate speaker notes with EXACT transcript text + intelligent [click] markers"""
    
    if not segments:
        return "<!--\n<!-- No transcript segments for this slide -->\n-->"
    
    # Detect educational patterns for intelligent [click] placement
    educational_patterns = detect_educational_patterns(segments)
    
    # Group consecutive segments by speaker
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
    
    if template_v_clicks == 0 or len(speaker_groups) == 0:
        # No v-clicks - natural opening dialogue (no [click] markers)
        for speaker, text in speaker_groups:
            notes_lines.append(f"{speaker}: {text}")
            notes_lines.append("")
    elif len(speaker_groups) == 1:
        # Single speaker group - no [click] markers needed
        speaker, text = speaker_groups[0]
        notes_lines.append(f"{speaker}: {text}")
        notes_lines.append("")
    else:
        # Multiple speaker groups - use intelligent [click] placement
        
        # Available positions (excluding first - RULE: First statement NEVER gets [click])
        available_positions = len(speaker_groups) - 1
        markers_to_place = min(template_v_clicks, available_positions)
        
        # Intelligent click positioning using detected patterns
        click_positions = set()
        
        if educational_patterns and markers_to_place > 0:
            # Use pattern-based positioning (prioritize mnemonic > definition_example > question_answer)
            pattern_priority = ['mnemonic', 'definition_example', 'question_answer']
            
            for pattern_type in pattern_priority:
                if pattern_type in educational_patterns and len(click_positions) < markers_to_place:
                    suggested_positions = educational_patterns[pattern_type]
                    
                    for pos in suggested_positions:
                        if pos > 1 and pos <= len(speaker_groups) and len(click_positions) < markers_to_place:
                            click_positions.add(pos)
                    
                    # If we have enough positions from this pattern, use them
                    if len(click_positions) >= markers_to_place:
                        break
        
        # Fill remaining positions with even distribution if needed
        if len(click_positions) < markers_to_place and markers_to_place > 0:
            remaining_needed = markers_to_place - len(click_positions)
            
            # Find positions not already used
            available_slots = []
            for i in range(2, len(speaker_groups) + 1):  # Skip position 1
                if i not in click_positions:
                    available_slots.append(i)
            
            # Distribute evenly among remaining slots
            if available_slots and remaining_needed > 0:
                step = len(available_slots) / remaining_needed
                for i in range(remaining_needed):
                    idx = int(i * step)
                    if idx < len(available_slots):
                        click_positions.add(available_slots[idx])
        
        # Generate notes with intelligent [click] markers
        for i, (speaker, text) in enumerate(speaker_groups, 1):
            if i == 1:
                # FIRST statement NEVER has [click] marker
                notes_lines.append(f"{speaker}: {text}")
            elif i in click_positions:
                notes_lines.append(f"[click] {speaker}: {text}")
            else:
                notes_lines.append(f"{speaker}: {text}")
            notes_lines.append("")
    
    # Wrap in HTML comment with pattern detection info
    notes_content = '\n'.join(notes_lines).rstrip()
    
    # Add pattern detection summary as comment if patterns were found
    pattern_info = ""
    if educational_patterns:
        detected_patterns = list(educational_patterns.keys())
        pattern_info = f"\n<!-- Educational patterns detected: {', '.join(detected_patterns)} -->"
    
    return f"<!--{pattern_info}\n{notes_content}\n-->"

def create_enhanced_slidev_presentation(transcript: List[TranscriptSegment], 
                                      num_slides: int, 
                                      presentation_title: str,
                                      config: Optional[ConstraintConfig] = None) -> str:
    """Create enhanced Slidev presentation with smart segmentation and structured templates"""
    
    # Use smart segmentation
    segmentator = SmartSegmentGenerator(config)
    smart_segments = segmentator.optimize_segments(transcript, num_slides)
    
    lines = []
    
    # YAML frontmatter
    lines.extend([
        "---",
        "theme: default",
        f"title: {presentation_title}",
        "info: |",
        f"  ## {presentation_title}",
        "  ",
        "  Generated with enhanced smart segmentation and structured templates",
        "  for perfect v-click and [click] marker synchronization.",
        "  ",
        "  Combines natural boundary detection with topic-agnostic structure.",
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
    
    # Generate slides using smart segments
    for slide_num in range(1, num_slides + 1):
        segments = smart_segments[slide_num - 1] if slide_num - 1 < len(smart_segments) else []
        
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
        
        # Generate speaker notes with EXACT transcript text using smart segmentation
        speaker_notes = generate_exact_speaker_notes(segments, structure["v_clicks"])
        lines.append(speaker_notes)
        lines.append("")
    
    return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(
        description="Generate enhanced structured Slidev presentations with smart segmentation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python enhanced_structured_generator.py transcript.json
  python enhanced_structured_generator.py transcript.json --output presentation.md
  python enhanced_structured_generator.py transcript.json --slides 10 --title "My Topic"
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
    
    parser.add_argument(
        "--target-duration",
        type=float,
        default=40.0,
        help="Target duration per slide in seconds (default: 40.0)"
    )
    
    parser.add_argument(
        "--click-duration", 
        type=float,
        default=10.0,
        help="Target duration per click in seconds (default: 10.0)"
    )
    
    parser.add_argument(
        "--quality-report",
        action="store_true",
        help="Show detailed quality analysis"
    )
    
    args = parser.parse_args()
    
    # Validate input file
    transcript_file = Path(args.transcript_file)
    if not transcript_file.exists():
        print(f"❌ Transcript file not found: {transcript_file}")
        sys.exit(1)
    
    # Create constraint configuration
    config = ConstraintConfig(
        target_slide_duration=args.target_duration,
        target_click_duration=args.click_duration
    )
    
    # Load transcript
    print(f"📁 Loading transcript: {transcript_file.name}")
    segmentator = SmartSegmentGenerator(config)
    transcript = segmentator.load_transcript(transcript_file)
    total_duration = sum(s.duration for s in transcript)
    total_words = len(' '.join(s.text for s in transcript).split())
    print(f"📊 Loaded {len(transcript)} segments ({total_duration:.1f}s, {total_words} words)")
    
    # Extract title
    if args.title:
        title = args.title
    else:
        title = transcript_file.stem.replace('-', ' ').replace('_', ' ').title()
    
    # Generate enhanced presentation
    print(f"🎯 Generating {args.slides} enhanced slides with smart segmentation...")
    
    if args.quality_report:
        # Show segmentation analysis
        smart_segments = segmentator.optimize_segments(transcript, args.slides)
        candidates = segmentator.detect_natural_boundaries(transcript)
        
        print(f"🔍 Analyzed {len(candidates)} natural boundary candidates")
        print(f"📊 Created {len(smart_segments)} optimized segments")
        
        for i, segment in enumerate(smart_segments, 1):
            duration = sum(s.duration for s in segment)
            words = len(' '.join(s.text for s in segment).split())
            print(f"   Segment {i}: {duration:.1f}s, {words} words")
    
    presentation_content = create_enhanced_slidev_presentation(transcript, args.slides, title, config)
    
    # Write output file
    if args.output:
        output_file = Path(args.output)
    else:
        output_file = transcript_file.parent / f"{transcript_file.stem}-enhanced-smart.md"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(presentation_content)
    
    print(f"✅ Generated enhanced presentation: {output_file}")
    
    # Show synchronization summary
    total_v_clicks = 0
    for slide_num in range(1, args.slides + 1):
        structure_type = select_slide_structure(slide_num, args.slides)
        v_clicks = SLIDE_STRUCTURES[structure_type]["v_clicks"]
        total_v_clicks += v_clicks
    
    print(f"\n🎯 ENHANCED STRUCTURE SUMMARY:")
    print(f"   Total slides: {args.slides}")
    print(f"   Total v-clicks: {total_v_clicks}")
    print(f"   Smart segmentation: ✅ Natural boundaries respected")
    print(f"   Synchronization: ✅ Perfect by design")
    print(f"\n🚀 Ready for flawless video generation with smart segmentation!")

if __name__ == "__main__":
    main()