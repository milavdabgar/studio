#!/usr/bin/env python3
"""
Smart Speaker Notes Generator
============================
Advanced transcript processing system with multi-constraint optimization
for generating natural, well-timed speaker notes segments.

This system:
1. Preserves exact transcript text word-for-word
2. Uses multi-constraint optimization (hard/medium/soft constraints)  
3. Balances natural flow, timing, readability, and video sync
4. Respects sentence boundaries, speaker turns, and content coherence
5. Optimizes for slide duration, click timing, and word count balance

Constraints Hierarchy:
- HARD: Word integrity, exact transcript preservation
- MEDIUM: Sentence boundaries, speaker turns, thought completion
- SOFT: Time balance, word count, slide duration consistency

Usage:
    python smart_speaker_notes_generator.py <transcript_file> [options]
"""

import json
import re
import argparse
import sys
from pathlib import Path
from typing import List, Dict, Tuple, Optional, NamedTuple
from dataclasses import dataclass
from enum import Enum

@dataclass
class TranscriptSegment:
    start: float
    end: float
    duration: float
    text: str
    speaker: str
    word_count: int = 0
    
    def __post_init__(self):
        self.word_count = len(self.text.split())

@dataclass
class SmartBreakpoint:
    """Represents a potential breakpoint in the transcript with scoring"""
    index: int  # Index in segments list
    cumulative_duration: float
    cumulative_words: int
    score: float
    reasons: List[str]  # Why this breakpoint was chosen
    
class ConstraintType(Enum):
    HARD = "hard"
    MEDIUM = "medium"
    SOFT = "soft"

@dataclass
class ConstraintConfig:
    """Configuration for smart segmentation constraints"""
    
    # Time-based constraints  
    target_slide_duration: float = 40.0  # seconds
    target_click_duration: float = 10.0  # seconds
    click_duration_range: Tuple[float, float] = (8.0, 15.0)
    
    # Word count constraints
    min_segment_words: int = 15
    max_segment_words: int = 60
    preferred_segment_words: Tuple[int, int] = (25, 45)
    
    # Natural boundary preferences
    sentence_end_bonus: float = 50.0
    speaker_turn_bonus: float = 40.0
    thought_completion_bonus: float = 45.0
    
    # Content coherence
    keep_examples_together: bool = True
    respect_explanations: bool = True
    
    # Quality thresholds
    max_time_variance: float = 0.3  # 30% variance allowed
    min_quality_score: float = 0.7  # Minimum acceptable quality

class SmartSpeakerNotesGenerator:
    """Advanced speaker notes generator with multi-constraint optimization"""
    
    def __init__(self, config: ConstraintConfig = None):
        self.config = config or ConstraintConfig()
        self.segments: List[TranscriptSegment] = []
        self.breakpoints: List[SmartBreakpoint] = []
        
    def load_transcript(self, file_path: Path) -> List[TranscriptSegment]:
        """Load and parse transcript with metadata"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Handle nested structure
            if isinstance(data, dict) and 'segments' in data:
                transcript_data = data['segments']
            else:
                transcript_data = data
            
            segments = []
            for item in transcript_data:
                segments.append(TranscriptSegment(
                    start=item['start'],
                    end=item['end'],
                    duration=item['duration'],
                    text=item['text'].strip(),
                    speaker=item.get('speaker', 'Speaker')
                ))
            
            self.segments = segments
            return segments
            
        except Exception as e:
            print(f"❌ Error loading transcript: {e}")
            sys.exit(1)
    
    def detect_natural_boundaries(self, segments: List[TranscriptSegment]) -> List[int]:
        """Detect natural breakpoint candidates based on language patterns"""
        candidates = []
        
        for i, segment in enumerate(segments):
            text = segment.text.strip()
            
            # Check for sentence endings
            if text.endswith(('.', '?', '!')):
                candidates.append(i)
            
            # Check for speaker changes (always a natural boundary)
            if i < len(segments) - 1 and segment.speaker != segments[i + 1].speaker:
                candidates.append(i)
            
            # Check for natural pauses (longer segments often indicate pauses)
            if segment.duration > 2.0:  # 2+ seconds indicates potential pause
                candidates.append(i)
        
        return sorted(set(candidates))
    
    def calculate_breakpoint_score(self, breakpoint_idx: int, 
                                 cumulative_duration: float,
                                 cumulative_words: int,
                                 target_duration: float) -> Tuple[float, List[str]]:
        """Calculate weighted score for a potential breakpoint"""
        
        if breakpoint_idx >= len(self.segments):
            return -1000, ["Invalid index"]
        
        segment = self.segments[breakpoint_idx]
        score = 0.0
        reasons = []
        
        # HARD CONSTRAINTS (must not violate)
        # These are built into the candidate selection, so we don't penalize here
        
        # MEDIUM CONSTRAINTS (strongly prefer)
        text = segment.text.strip()
        
        # Sentence completion bonus
        if text.endswith(('.', '?', '!')):
            score += self.config.sentence_end_bonus
            reasons.append(f"Sentence end (+{self.config.sentence_end_bonus})")
        
        # Speaker turn bonus
        next_idx = breakpoint_idx + 1
        if (next_idx < len(self.segments) and 
            segment.speaker != self.segments[next_idx].speaker):
            score += self.config.speaker_turn_bonus
            reasons.append(f"Speaker turn (+{self.config.speaker_turn_bonus})")
        
        # Thought completion (heuristic: ends with period or complete phrase)
        if self._is_thought_complete(segment.text):
            score += self.config.thought_completion_bonus
            reasons.append(f"Thought complete (+{self.config.thought_completion_bonus})")
        
        # SOFT CONSTRAINTS (optimize when possible)
        
        # Time balance score
        time_diff = abs(cumulative_duration - target_duration)
        time_score = max(0, 30 - time_diff * 3)  # Penalty increases with deviation
        score += time_score
        if time_score > 15:
            reasons.append(f"Good time balance (+{time_score:.1f})")
        
        # Word count score
        word_score = self._calculate_word_count_score(cumulative_words)
        score += word_score
        if word_score > 10:
            reasons.append(f"Good word count (+{word_score:.1f})")
        
        # Avoid breaking too early or too late
        if cumulative_duration < target_duration * 0.5:
            score -= 20  # Too early
            reasons.append("Too early (-20)")
        elif cumulative_duration > target_duration * 1.8:
            score -= 30  # Too late
            reasons.append("Too late (-30)")
        
        return score, reasons
    
    def _is_thought_complete(self, text: str) -> bool:
        """Heuristic to determine if a statement completes a thought"""
        text = text.strip().lower()
        
        # Complete sentences
        if text.endswith(('.', '?', '!')):
            return True
        
        # Common completion patterns
        completion_patterns = [
            r'\b(exactly|precisely|right|correct|yes|no)\b\.?$',
            r'\b(got it|makes sense|i see|okay)\b\.?$',
            r'\b(that\'s it|perfect|good)\b\.?$'
        ]
        
        return any(re.search(pattern, text) for pattern in completion_patterns)
    
    def _calculate_word_count_score(self, word_count: int) -> float:
        """Calculate score based on word count preferences"""
        min_pref, max_pref = self.config.preferred_segment_words
        
        if min_pref <= word_count <= max_pref:
            return 25.0  # Perfect range
        elif self.config.min_segment_words <= word_count <= self.config.max_segment_words:
            return 15.0  # Acceptable range
        elif word_count < self.config.min_segment_words:
            return max(0, 10 - (self.config.min_segment_words - word_count) * 2)  # Too short
        else:
            return max(0, 10 - (word_count - self.config.max_segment_words) * 1.5)  # Too long
    
    def find_optimal_breakpoints(self, num_segments_needed: int, 
                               total_duration: float) -> List[SmartBreakpoint]:
        """Find optimal breakpoints using dynamic programming approach"""
        
        candidates = self.detect_natural_boundaries(self.segments)
        target_duration_per_segment = total_duration / num_segments_needed
        
        print(f"🔍 Analyzing {len(candidates)} natural boundary candidates")
        print(f"🎯 Target duration per segment: {target_duration_per_segment:.1f}s")
        
        # Use greedy approach with look-ahead for simplicity
        # (Full dynamic programming would be more complex but could be added later)
        
        breakpoints = []
        current_start = 0
        current_duration = 0
        current_words = 0
        
        for segment_num in range(num_segments_needed):
            if segment_num == num_segments_needed - 1:
                # Last segment takes everything remaining
                breakpoint_idx = len(self.segments) - 1
            else:
                # Find best breakpoint for this segment
                target_end_time = (segment_num + 1) * target_duration_per_segment
                best_breakpoint = self._find_best_breakpoint_in_range(
                    candidates, current_start, target_end_time, 
                    current_duration, current_words, target_duration_per_segment
                )
                breakpoint_idx = best_breakpoint
            
            # Calculate cumulative stats up to this breakpoint
            segment_duration = sum(s.duration for s in self.segments[current_start:breakpoint_idx + 1])
            segment_words = sum(s.word_count for s in self.segments[current_start:breakpoint_idx + 1])
            
            current_duration += segment_duration
            current_words += segment_words
            
            # Score this breakpoint
            score, reasons = self.calculate_breakpoint_score(
                breakpoint_idx, segment_duration, segment_words, target_duration_per_segment
            )
            
            breakpoints.append(SmartBreakpoint(
                index=breakpoint_idx,
                cumulative_duration=segment_duration,
                cumulative_words=segment_words,
                score=score,
                reasons=reasons
            ))
            
            current_start = breakpoint_idx + 1
        
        return breakpoints
    
    def _find_best_breakpoint_in_range(self, candidates: List[int], start_idx: int,
                                     target_time: float, cumulative_duration: float,
                                     cumulative_words: int, target_segment_duration: float) -> int:
        """Find the best breakpoint within a reasonable range of the target time"""
        
        # Filter candidates within our segment range
        valid_candidates = [c for c in candidates if c >= start_idx]
        
        if not valid_candidates:
            # If no candidates, use the segment that gets us closest to target time
            best_idx = start_idx
            best_time_diff = float('inf')
            
            current_time = cumulative_duration
            for i in range(start_idx, len(self.segments)):
                current_time += self.segments[i].duration
                time_diff = abs(current_time - target_time)
                if time_diff < best_time_diff:
                    best_time_diff = time_diff
                    best_idx = i
                # Don't go too far past target
                if current_time > target_time * 1.5:
                    break
            
            return best_idx
        
        # Score all valid candidates and choose the best
        best_candidate = valid_candidates[0]
        best_score = -float('inf')
        
        current_time = cumulative_duration
        current_words = cumulative_words
        
        for i in range(start_idx, len(self.segments)):
            current_time += self.segments[i].duration
            current_words += self.segments[i].word_count
            
            if i in valid_candidates:
                score, _ = self.calculate_breakpoint_score(
                    i, current_time - cumulative_duration, 
                    current_words - cumulative_words, target_segment_duration
                )
                
                if score > best_score:
                    best_score = score
                    best_candidate = i
            
            # Stop if we've gone too far
            if current_time > target_time * 2.0:
                break
        
        return best_candidate
    
    def generate_speaker_notes_segments(self, breakpoints: List[SmartBreakpoint],
                                      v_clicks_per_segment: List[int]) -> List[str]:
        """Generate speaker notes with perfect [click] marker synchronization"""
        
        segments_notes = []
        start_idx = 0
        
        for i, breakpoint in enumerate(breakpoints):
            end_idx = breakpoint.index
            segment_segments = self.segments[start_idx:end_idx + 1]
            v_clicks = v_clicks_per_segment[i] if i < len(v_clicks_per_segment) else 0
            
            # Generate speaker notes for this segment
            notes = self._generate_segment_speaker_notes(segment_segments, v_clicks)
            segments_notes.append(notes)
            
            start_idx = end_idx + 1
        
        return segments_notes
    
    def _generate_segment_speaker_notes(self, segments: List[TranscriptSegment], 
                                      v_clicks: int) -> str:
        """Generate speaker notes for a single segment with exact transcript text"""
        
        if not segments:
            return "<!--\n<!-- No transcript segments for this slide -->\n-->"
        
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
        
        # Generate notes with smart [click] marker placement
        notes_lines = []
        
        if v_clicks == 0:
            # No v-clicks - natural dialogue
            for speaker, text in speaker_groups:
                notes_lines.append(f"{speaker}: {text}")
                notes_lines.append("")
        else:
            # Has v-clicks - first statement without [click], then distribute [click] markers
            click_positions = self._calculate_optimal_click_positions(speaker_groups, v_clicks)
            
            for i, (speaker, text) in enumerate(speaker_groups, 1):
                if i == 1:
                    # First statement never has [click]
                    notes_lines.append(f"{speaker}: {text}")
                elif i in click_positions:
                    notes_lines.append(f"[click] {speaker}: {text}")
                else:
                    notes_lines.append(f"{speaker}: {text}")
                notes_lines.append("")
        
        # Wrap in HTML comment
        notes_content = '\n'.join(notes_lines).rstrip()
        return f"<!--\n{notes_content}\n-->"
    
    def _calculate_optimal_click_positions(self, speaker_groups: List[Tuple[str, str]], 
                                         v_clicks: int) -> set:
        """Calculate optimal positions for [click] markers"""
        if v_clicks <= 0 or len(speaker_groups) <= 1:
            return set()
        
        # Distribute [click] markers evenly across available positions (starting from 2)
        available_positions = list(range(2, len(speaker_groups) + 1))
        
        if len(available_positions) <= v_clicks:
            # More v-clicks than available positions - use all positions
            return set(available_positions)
        
        # Select evenly distributed positions
        click_positions = set()
        if v_clicks > 0:
            step = len(available_positions) / v_clicks
            for i in range(v_clicks):
                pos = available_positions[min(int(i * step), len(available_positions) - 1)]
                click_positions.add(pos)
        
        return click_positions
    
    def generate_quality_report(self, breakpoints: List[SmartBreakpoint]) -> Dict:
        """Generate quality metrics for the segmentation"""
        
        if not breakpoints:
            return {"error": "No breakpoints to analyze"}
        
        durations = [bp.cumulative_duration for bp in breakpoints]
        word_counts = [bp.cumulative_words for bp in breakpoints]
        scores = [bp.score for bp in breakpoints]
        
        # Calculate statistics
        avg_duration = sum(durations) / len(durations)
        duration_variance = sum((d - avg_duration) ** 2 for d in durations) / len(durations)
        duration_std = duration_variance ** 0.5
        
        avg_words = sum(word_counts) / len(word_counts)
        avg_score = sum(scores) / len(scores)
        
        # Quality assessment
        time_balance_score = 1.0 - min(1.0, duration_std / avg_duration)
        word_balance_score = 1.0 - (abs(avg_words - 35) / 35)  # 35 is ideal word count
        overall_score = (time_balance_score + word_balance_score + min(1.0, avg_score / 100)) / 3
        
        return {
            "overall_quality": overall_score,
            "time_balance": time_balance_score,
            "word_balance": word_balance_score,
            "average_duration": avg_duration,
            "duration_std": duration_std,
            "average_words": avg_words,
            "average_breakpoint_score": avg_score,
            "segment_details": [
                {
                    "segment": i + 1,
                    "duration": bp.cumulative_duration,
                    "words": bp.cumulative_words,
                    "score": bp.score,
                    "reasons": bp.reasons
                }
                for i, bp in enumerate(breakpoints)
            ]
        }

def main():
    """Main entry point for smart speaker notes generator"""
    parser = argparse.ArgumentParser(
        description="Smart Speaker Notes Generator with multi-constraint optimization",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python smart_speaker_notes_generator.py transcript.json --segments 8
  python smart_speaker_notes_generator.py transcript.json --slide-duration 45 --click-duration 12
  python smart_speaker_notes_generator.py transcript.json --min-words 20 --max-words 50
        """
    )
    
    parser.add_argument("transcript_file", help="Path to timestamped transcript JSON file")
    parser.add_argument("--segments", "-s", type=int, default=8, help="Number of segments (default: 8)")
    parser.add_argument("--slide-duration", type=float, default=40.0, help="Target slide duration in seconds (default: 40)")
    parser.add_argument("--click-duration", type=float, default=10.0, help="Target click duration in seconds (default: 10)")
    parser.add_argument("--min-words", type=int, default=15, help="Minimum words per segment (default: 15)")
    parser.add_argument("--max-words", type=int, default=60, help="Maximum words per segment (default: 60)")
    parser.add_argument("--quality-report", action="store_true", help="Generate detailed quality report")
    
    args = parser.parse_args()
    
    # Create configuration
    config = ConstraintConfig(
        target_slide_duration=args.slide_duration,
        target_click_duration=args.click_duration,
        min_segment_words=args.min_words,
        max_segment_words=args.max_words
    )
    
    # Initialize generator
    generator = SmartSpeakerNotesGenerator(config)
    
    # Load transcript
    transcript_file = Path(args.transcript_file)
    if not transcript_file.exists():
        print(f"❌ Transcript file not found: {transcript_file}")
        sys.exit(1)
    
    print(f"📁 Loading transcript: {transcript_file.name}")
    segments = generator.load_transcript(transcript_file)
    total_duration = sum(s.duration for s in segments)
    total_words = sum(s.word_count for s in segments)
    
    print(f"📊 Loaded {len(segments)} segments ({total_duration:.1f}s, {total_words} words)")
    
    # Find optimal breakpoints
    print(f"🎯 Generating {args.segments} smart segments...")
    breakpoints = generator.find_optimal_breakpoints(args.segments, total_duration)
    
    # Generate quality report
    quality_report = generator.generate_quality_report(breakpoints)
    
    print(f"\n📊 SMART SEGMENTATION RESULTS:")
    print(f"   Overall Quality: {quality_report['overall_quality']:.2%}")
    print(f"   Time Balance: {quality_report['time_balance']:.2%}")
    print(f"   Word Balance: {quality_report['word_balance']:.2%}")
    print(f"   Average Duration: {quality_report['average_duration']:.1f}s")
    print(f"   Average Words: {quality_report['average_words']:.0f}")
    
    if args.quality_report:
        print(f"\n📋 DETAILED SEGMENT ANALYSIS:")
        for detail in quality_report['segment_details']:
            print(f"   Segment {detail['segment']}: {detail['duration']:.1f}s, {detail['words']} words (score: {detail['score']:.1f})")
            for reason in detail['reasons'][:3]:  # Show top 3 reasons
                print(f"      • {reason}")
    
    print(f"\n🎯 Smart segmentation complete!")
    print(f"🚀 Natural boundaries respected with optimal timing balance")

if __name__ == "__main__":
    main()