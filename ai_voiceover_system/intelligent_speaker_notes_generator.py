#!/usr/bin/env python3
"""
Intelligent Speaker Notes Generator
===================================
Advanced speaker notes generation with content-aware segmentation:

1. Detects teaching patterns (definitions, examples, mnemonics, lists)
2. Creates logical content boundaries aligned with educational flow
3. Optimizes [click] marker placement for natural learning progression
4. Preserves exact transcript text while organizing for better slide content

Key improvements over basic segmentation:
- Mnemonic detection and individual letter breakdown
- Definition-example pattern recognition  
- Question-answer flow optimization
- Educational concept boundary detection

Usage:
    python intelligent_speaker_notes_generator.py <transcript_file> [--slides 8]
"""

import json
import argparse
import sys
import re
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

@dataclass
class TranscriptSegment:
    start: float
    end: float
    duration: float
    text: str
    speaker: str

@dataclass
class ContentPattern:
    """Detected educational content pattern"""
    pattern_type: str  # "mnemonic", "definition", "example", "list", "qa"
    start_index: int
    end_index: int
    elements: List[str]
    confidence: float
    natural_breaks: List[int]  # Suggested [click] positions

class IntelligentSpeakerNotesGenerator:
    """Advanced generator with educational content awareness"""
    
    def __init__(self):
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
        
        self.example_markers = [
            r'for example',
            r'like (?:a |an )?(.*?)(?:\.|,)',
            r'think about (.*?)(?:\.|,)',
            r'such as (.*?)(?:\.|,)'
        ]
        
        self.list_markers = [
            r'first.*?second.*?(?:third|last)',
            r'one.*?two.*?(?:three|another)',
            r'(?:A|1).*?(?:B|2).*?(?:C|3)'
        ]
    
    def load_transcript(self, file_path: Path) -> List[TranscriptSegment]:
        """Load transcript from JSON file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            segments = []
            
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
    
    def detect_mnemonic_patterns(self, text: str, start_idx: int) -> Optional[ContentPattern]:
        """Detect mnemonic patterns like CERVC, PDRSC"""
        for pattern in self.mnemonic_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                mnemonic_letters = ''.join(match.groups()).replace(' ', '')
                
                # Look for individual letter explanations
                letter_positions = []
                for i, letter in enumerate(mnemonic_letters):
                    letter_pattern = rf'{letter}\s+is\s+(?:for\s+)?(.*?)(?:\.|,|$)'
                    if re.search(letter_pattern, text, re.IGNORECASE):
                        letter_positions.append(start_idx + i + 1)  # +1 for initial explanation
                
                if len(letter_positions) >= 2:  # At least 2 letters explained
                    return ContentPattern(
                        pattern_type="mnemonic",
                        start_index=start_idx,
                        end_index=start_idx + len(mnemonic_letters) + 1,
                        elements=list(mnemonic_letters),
                        confidence=0.9,
                        natural_breaks=letter_positions
                    )
        return None
    
    def detect_definition_example_pattern(self, segments: List[TranscriptSegment], start_idx: int) -> Optional[ContentPattern]:
        """Detect definition followed by examples pattern"""
        if start_idx + 2 >= len(segments):
            return None
        
        current_text = segments[start_idx].text.lower()
        next_text = segments[start_idx + 1].text.lower() if start_idx + 1 < len(segments) else ""
        
        # Check for definition markers
        has_definition = any(re.search(pattern, current_text) for pattern in self.definition_markers)
        
        # Check for example markers in following text
        has_example = any(re.search(pattern, next_text) for pattern in self.example_markers)
        
        if has_definition and has_example:
            return ContentPattern(
                pattern_type="definition_example",
                start_index=start_idx,
                end_index=start_idx + 2,
                elements=["definition", "example"],
                confidence=0.8,
                natural_breaks=[start_idx + 1, start_idx + 2]  # Definition, then example
            )
        
        return None
    
    def detect_question_answer_pattern(self, segments: List[TranscriptSegment], start_idx: int) -> Optional[ContentPattern]:
        """Detect question-answer educational flow"""
        if start_idx + 1 >= len(segments):
            return None
        
        current_segment = segments[start_idx]
        next_segment = segments[start_idx + 1]
        
        # Check for question pattern
        is_question = (
            current_segment.text.strip().endswith('?') or
            current_segment.text.lower().startswith(('what', 'how', 'why', 'when', 'where'))
        )
        
        # Check for answer pattern (different speaker or continuation)
        is_answer = (
            next_segment.speaker != current_segment.speaker or
            next_segment.text.lower().startswith(('well', 'yes', 'no', 'right', 'exactly', 'that\'s'))
        )
        
        if is_question and is_answer:
            return ContentPattern(
                pattern_type="question_answer",
                start_index=start_idx,
                end_index=start_idx + 2,
                elements=["question", "answer"],
                confidence=0.7,
                natural_breaks=[start_idx + 1]  # Break after question
            )
        
        return None
    
    def detect_list_pattern(self, text: str, start_idx: int) -> Optional[ContentPattern]:
        """Detect enumerated lists or sequences"""
        for pattern in self.list_markers:
            if re.search(pattern, text, re.IGNORECASE):
                # Count list items
                list_items = []
                
                # Look for numbered items
                numbered_items = re.findall(r'(?:^|\s)([1-9])[.,]\s*(.*?)(?=\s[1-9][.,]|$)', text)
                if numbered_items:
                    list_items = [item[1] for item in numbered_items]
                
                # Look for lettered items  
                if not list_items:
                    lettered_items = re.findall(r'(?:^|\s)([A-Z])[.,]\s*(.*?)(?=\s[A-Z][.,]|$)', text)
                    if lettered_items:
                        list_items = [item[1] for item in lettered_items]
                
                if len(list_items) >= 2:
                    breaks = [start_idx + i + 1 for i in range(len(list_items))]
                    return ContentPattern(
                        pattern_type="list",
                        start_index=start_idx,
                        end_index=start_idx + len(list_items),
                        elements=list_items,
                        confidence=0.8,
                        natural_breaks=breaks
                    )
        
        return None
    
    def analyze_content_patterns(self, segments: List[TranscriptSegment]) -> List[ContentPattern]:
        """Analyze transcript for educational content patterns"""
        patterns = []
        i = 0
        
        while i < len(segments):
            segment_text = segments[i].text
            combined_text = ' '.join(seg.text for seg in segments[i:min(i+5, len(segments))])
            
            # Try different pattern detections
            pattern = None
            
            # Check for mnemonics first (highest priority)
            pattern = self.detect_mnemonic_patterns(combined_text, i)
            if pattern:
                patterns.append(pattern)
                i = pattern.end_index
                continue
            
            # Check for definition-example patterns
            pattern = self.detect_definition_example_pattern(segments, i)
            if pattern:
                patterns.append(pattern)
                i = pattern.end_index
                continue
            
            # Check for question-answer patterns
            pattern = self.detect_question_answer_pattern(segments, i)
            if pattern:
                patterns.append(pattern)
                i = pattern.end_index
                continue
            
            # Check for lists
            pattern = self.detect_list_pattern(combined_text, i)
            if pattern:
                patterns.append(pattern)
                i = pattern.end_index
                continue
            
            i += 1
        
        return patterns
    
    def optimize_speaker_notes_with_patterns(self, segments: List[TranscriptSegment], 
                                           patterns: List[ContentPattern],
                                           template_v_clicks: int) -> str:
        """Generate optimized speaker notes using detected patterns"""
        
        if not segments:
            return "<!--\n<!-- No transcript segments for this slide -->\n-->"
        
        # Group consecutive segments by speaker
        speaker_groups = []
        current_speaker = None
        current_text_parts = []
        
        for segment in segments:
            if segment.speaker != current_speaker:
                if current_speaker and current_text_parts:
                    combined_text = ' '.join(current_text_parts).strip()
                    speaker_groups.append((current_speaker, combined_text))
                
                current_speaker = segment.speaker
                current_text_parts = [segment.text.strip()]
            else:
                current_text_parts.append(segment.text.strip())
        
        if current_speaker and current_text_parts:
            combined_text = ' '.join(current_text_parts).strip()
            speaker_groups.append((current_speaker, combined_text))
        
        # Build speaker notes with pattern-aware [click] placement
        notes_lines = []
        
        if template_v_clicks == 0 or len(speaker_groups) == 0:
            for speaker, text in speaker_groups:
                notes_lines.append(f"{speaker}: {text}")
                notes_lines.append("")
        elif len(speaker_groups) == 1:
            speaker, text = speaker_groups[0]
            notes_lines.append(f"{speaker}: {text}")
            notes_lines.append("")
        else:
            # Use intelligent click placement based on patterns
            click_positions = set()
            
            # Find applicable patterns for this slide's content
            slide_text = ' '.join(text for _, text in speaker_groups).lower()
            applicable_patterns = []
            
            for pattern in patterns:
                if any(element.lower() in slide_text for element in pattern.elements):
                    applicable_patterns.append(pattern)
            
            if applicable_patterns and template_v_clicks > 0:
                # Use pattern-suggested breaks
                main_pattern = max(applicable_patterns, key=lambda p: p.confidence)
                suggested_breaks = main_pattern.natural_breaks
                
                # Adapt to available positions and template requirements
                available_positions = len(speaker_groups) - 1  # Exclude first
                markers_needed = min(template_v_clicks, available_positions)
                
                if len(suggested_breaks) >= markers_needed:
                    # Use pattern suggestions
                    for i in range(markers_needed):
                        if i < len(suggested_breaks):
                            pos = min(suggested_breaks[i], len(speaker_groups))
                            if pos > 1:  # Never first position
                                click_positions.add(pos)
                else:
                    # Fall back to even distribution
                    step = available_positions / markers_needed if markers_needed > 0 else 1
                    for i in range(markers_needed):
                        position = 2 + int(i * step)
                        position = min(position, len(speaker_groups))
                        click_positions.add(position)
            else:
                # Standard even distribution
                available_positions = len(speaker_groups) - 1
                markers_needed = min(template_v_clicks, available_positions)
                
                if markers_needed > 0:
                    step = available_positions / markers_needed
                    for i in range(markers_needed):
                        position = 2 + int(i * step)
                        position = min(position, len(speaker_groups))
                        click_positions.add(position)
            
            # Generate notes with optimized [click] markers
            for i, (speaker, text) in enumerate(speaker_groups, 1):
                if i == 1:
                    notes_lines.append(f"{speaker}: {text}")
                elif i in click_positions:
                    notes_lines.append(f"[click] {speaker}: {text}")
                else:
                    notes_lines.append(f"{speaker}: {text}")
                notes_lines.append("")
        
        notes_content = '\n'.join(notes_lines).rstrip()
        return f"<!--\n{notes_content}\n-->"
    
    def generate_intelligent_slides(self, transcript: List[TranscriptSegment], 
                                   num_slides: int, title: str) -> str:
        """Generate slides with intelligent speaker notes"""
        
        # Analyze content patterns across entire transcript
        all_patterns = self.analyze_content_patterns(transcript)
        
        print(f"🧠 Detected {len(all_patterns)} educational content patterns:")
        for pattern in all_patterns:
            print(f"   - {pattern.pattern_type}: {len(pattern.elements)} elements (confidence: {pattern.confidence:.1f})")
        
        # Simple time-based segmentation for slides
        total_duration = sum(s.duration for s in transcript)
        target_duration_per_slide = total_duration / num_slides
        
        slide_segments = []
        current_segment = []
        current_duration = 0
        
        for segment in transcript:
            current_segment.append(segment)
            current_duration += segment.duration
            
            if current_duration >= target_duration_per_slide and len(slide_segments) < num_slides - 1:
                slide_segments.append(current_segment[:])
                current_segment = []
                current_duration = 0
        
        if current_segment:
            if slide_segments:
                slide_segments[-1].extend(current_segment)
            else:
                slide_segments.append(current_segment)
        
        # Ensure we have exactly num_slides
        while len(slide_segments) < num_slides:
            if slide_segments:
                longest_idx = max(range(len(slide_segments)), key=lambda i: len(slide_segments[i]))
                longest = slide_segments[longest_idx]
                if len(longest) >= 2:
                    mid = len(longest) // 2
                    first_half = longest[:mid]
                    second_half = longest[mid:]
                    slide_segments[longest_idx] = first_half
                    slide_segments.insert(longest_idx + 1, second_half)
                else:
                    break
            else:
                slide_segments = [[]]
        
        # Generate presentation with intelligent speaker notes
        lines = [
            "---",
            "theme: default", 
            f"title: {title}",
            "info: |",
            f"  ## {title}",
            "  Generated with intelligent content pattern detection",
            "  and optimized speaker notes organization.",
            "class: text-center",
            "highlighter: shiki", 
            "transition: slide-left",
            "mdc: true",
            "---", 
            ""
        ]
        
        # Template structures (simplified for this demo)
        templates = [
            {"v_clicks": 3, "type": "title"},
            {"v_clicks": 3, "type": "two_section"}, 
            {"v_clicks": 4, "type": "three_section"},
            {"v_clicks": 3, "type": "comparison"}
        ]
        
        for slide_num in range(num_slides):
            segments = slide_segments[slide_num] if slide_num < len(slide_segments) else []
            template = templates[slide_num % len(templates)]
            
            if slide_num > 0:
                lines.extend(["---", "layout: default", "---", ""])
            
            # Add basic slide content (placeholder)
            lines.append(f"# Slide {slide_num + 1}")
            lines.append("")
            lines.append("<!-- Slide content placeholder -->")
            lines.append("")
            
            # Generate intelligent speaker notes
            relevant_patterns = [p for p in all_patterns 
                               if p.start_index < len(segments) and p.end_index >= 0]
            
            speaker_notes = self.optimize_speaker_notes_with_patterns(
                segments, relevant_patterns, template["v_clicks"]
            )
            lines.append(speaker_notes)
            lines.append("")
        
        return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(description="Generate intelligent speaker notes with content pattern detection")
    parser.add_argument("transcript_file", help="Path to transcript JSON file")
    parser.add_argument("--slides", "-s", type=int, default=8, help="Number of slides")
    parser.add_argument("--output", "-o", help="Output file path")
    
    args = parser.parse_args()
    
    transcript_file = Path(args.transcript_file)
    if not transcript_file.exists():
        print(f"❌ File not found: {transcript_file}")
        sys.exit(1)
    
    generator = IntelligentSpeakerNotesGenerator()
    transcript = generator.load_transcript(transcript_file)
    
    title = args.transcript_file.split('/')[-1].replace('.json', '').replace('-', ' ').title()
    
    print(f"📁 Analyzing {len(transcript)} transcript segments...")
    presentation = generator.generate_intelligent_slides(transcript, args.slides, title)
    
    output_file = Path(args.output) if args.output else transcript_file.parent / f"{transcript_file.stem}-intelligent.md"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(presentation)
    
    print(f"✅ Generated intelligent presentation: {output_file}")

if __name__ == "__main__":
    main()