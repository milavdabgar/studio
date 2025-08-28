#!/usr/bin/env python3
"""
Enhanced Slide Quality Validator
===============================
Comprehensive validation system for enhanced structured slides with smart segmentation.

Validates:
1. V-click and [click] marker synchronization per slide
2. Speaker notes quality and transcript preservation 
3. Smart segmentation balance (duration, word count)
4. Template structure compliance
5. Natural boundary utilization

Usage:
    python enhanced_slide_validator.py <slidev_file> [--detailed] [--json]
"""

import re
import argparse
import json
import sys
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

class ValidationLevel(Enum):
    ERROR = "error"
    WARNING = "warning" 
    INFO = "info"
    SUCCESS = "success"

@dataclass
class ValidationIssue:
    level: ValidationLevel
    slide_number: int
    category: str
    message: str
    details: Optional[str] = None

@dataclass
class SlideAnalysis:
    slide_number: int
    v_clicks: List[int]
    click_markers: int
    speaker_notes_lines: int
    word_count: int
    duration_estimate: float
    structure_type: str
    synchronization_perfect: bool
    issues: List[ValidationIssue]

@dataclass
class ValidationReport:
    total_slides: int
    perfect_sync_slides: int
    total_v_clicks: int
    total_click_markers: int
    overall_sync_rate: float
    avg_words_per_slide: float
    avg_duration_per_slide: float
    slides: List[SlideAnalysis]
    global_issues: List[ValidationIssue]
    
    def to_dict(self):
        return asdict(self)

class EnhancedSlideValidator:
    """Comprehensive validation for enhanced structured slides"""
    
    def __init__(self):
        # Expected v-click counts for each structure type
        self.structure_v_clicks = {
            "title": 3,
            "two_section": 3, 
            "three_section": 4,
            "comparison": 3
        }
        
        # Quality thresholds
        self.min_words_per_slide = 15
        self.max_words_per_slide = 200
        self.target_duration_per_slide = 40.0
        self.max_duration_deviation = 20.0
    
    def extract_slides_from_file(self, file_path: Path) -> List[Dict]:
        """Parse Slidev file and extract slide data"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            raise ValueError(f"Error reading file: {e}")
        
        # Split into slides using slide separators
        slide_parts = re.split(r'\n---\n', content)
        
        slides = []
        slide_number = 1
        
        for part in slide_parts:
            part = part.strip()
            if not part or part.startswith('theme:') or part.startswith('layout:'):
                continue
            
            # Extract slide content and speaker notes
            speaker_notes_match = re.search(r'<!--\n(.*?)\n-->', part, re.DOTALL)
            speaker_notes = speaker_notes_match.group(1) if speaker_notes_match else ""
            
            # Remove speaker notes to get pure slide content
            slide_content = re.sub(r'<!--.*?-->', '', part, flags=re.DOTALL).strip()
            
            slides.append({
                'number': slide_number,
                'content': slide_content,
                'speaker_notes': speaker_notes,
                'raw_content': part
            })
            slide_number += 1
        
        return slides
    
    def analyze_v_clicks(self, slide_content: str) -> List[int]:
        """Extract and analyze v-click numbers from slide content"""
        v_click_numbers = []
        
        # Find all v-click patterns
        patterns = [
            r'<v-click\s+at="(\d+)"',  # <v-click at="1">
            r'<div\s+v-click="(\d+)"',  # <div v-click="2">
            r'<div\s+v-click\s*=\s*"(\d+)"',  # Variations with spacing
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, slide_content)
            v_click_numbers.extend([int(match) for match in matches])
        
        # Return unique sorted numbers
        return sorted(list(set(v_click_numbers)))
    
    def count_click_markers(self, speaker_notes: str) -> int:
        """Count [click] markers in speaker notes"""
        if not speaker_notes.strip():
            return 0
        
        # Count [click] markers (case insensitive)
        click_markers = len(re.findall(r'\[click\]', speaker_notes, re.IGNORECASE))
        return click_markers
    
    def estimate_slide_duration(self, speaker_notes: str, words_per_minute: int = 150) -> float:
        """Estimate slide duration based on speaker notes word count"""
        if not speaker_notes.strip():
            return 10.0  # Default for slides without notes
        
        # Count words in speaker notes
        word_count = len(speaker_notes.split())
        duration = (word_count / words_per_minute) * 60  # Convert to seconds
        
        return max(duration, 5.0)  # Minimum 5 seconds per slide
    
    def detect_structure_type(self, slide_content: str, slide_number: int, total_slides: int) -> str:
        """Detect slide structure type based on content patterns"""
        content_lower = slide_content.lower()
        
        # Title slide detection
        if slide_number == 1 or "press space for next slide" in content_lower:
            return "title"
        
        # Three section detection
        if "grid-cols-3" in slide_content or content_lower.count("**point") >= 2:
            return "three_section"
        
        # Comparison detection  
        if "aspect a" in content_lower and "aspect b" in content_lower:
            return "comparison"
        
        # Default to two section
        return "two_section"
    
    def validate_slide(self, slide: Dict) -> SlideAnalysis:
        """Perform comprehensive validation of a single slide"""
        slide_number = slide['number']
        content = slide['content']
        speaker_notes = slide['speaker_notes']
        
        issues = []
        
        # Analyze v-clicks
        v_clicks = self.analyze_v_clicks(content)
        max_v_click = max(v_clicks) if v_clicks else 0
        
        # Count click markers
        click_markers = self.count_click_markers(speaker_notes)
        
        # Check synchronization
        synchronization_perfect = max_v_click == click_markers
        if not synchronization_perfect:
            issues.append(ValidationIssue(
                level=ValidationLevel.ERROR,
                slide_number=slide_number,
                category="synchronization",
                message=f"V-click/[click] mismatch: {max_v_click} v-clicks vs {click_markers} [click] markers",
                details=f"V-clicks found: {v_clicks}"
            ))
        
        # Detect structure type
        structure_type = self.detect_structure_type(content, slide_number, 10)  # Assume max 10 slides
        expected_v_clicks = self.structure_v_clicks.get(structure_type, 3)
        
        # Validate structure compliance
        if max_v_click != expected_v_clicks:
            issues.append(ValidationIssue(
                level=ValidationLevel.WARNING,
                slide_number=slide_number,
                category="structure",
                message=f"Structure mismatch: Expected {expected_v_clicks} v-clicks for {structure_type}, found {max_v_click}",
                details=f"Structure type detected: {structure_type}"
            ))
        
        # Word count analysis
        speaker_word_count = len(speaker_notes.split()) if speaker_notes else 0
        if speaker_word_count < self.min_words_per_slide:
            issues.append(ValidationIssue(
                level=ValidationLevel.WARNING,
                slide_number=slide_number,
                category="content",
                message=f"Low word count: {speaker_word_count} words (minimum: {self.min_words_per_slide})"
            ))
        elif speaker_word_count > self.max_words_per_slide:
            issues.append(ValidationIssue(
                level=ValidationLevel.WARNING,
                slide_number=slide_number,
                category="content",
                message=f"High word count: {speaker_word_count} words (maximum: {self.max_words_per_slide})"
            ))
        
        # Duration analysis
        estimated_duration = self.estimate_slide_duration(speaker_notes)
        duration_deviation = abs(estimated_duration - self.target_duration_per_slide)
        if duration_deviation > self.max_duration_deviation:
            issues.append(ValidationIssue(
                level=ValidationLevel.INFO,
                slide_number=slide_number,
                category="timing",
                message=f"Duration deviation: {estimated_duration:.1f}s (target: {self.target_duration_per_slide:.1f}s)"
            ))
        
        # Check for first statement [click] marker violation
        if speaker_notes and "[click]" in speaker_notes.split('\n')[0]:
            issues.append(ValidationIssue(
                level=ValidationLevel.ERROR,
                slide_number=slide_number,
                category="speaker_notes",
                message="First statement has [click] marker - violates immediate visibility rule"
            ))
        
        return SlideAnalysis(
            slide_number=slide_number,
            v_clicks=v_clicks,
            click_markers=click_markers,
            speaker_notes_lines=len(speaker_notes.split('\n')) if speaker_notes else 0,
            word_count=speaker_word_count,
            duration_estimate=estimated_duration,
            structure_type=structure_type,
            synchronization_perfect=synchronization_perfect,
            issues=issues
        )
    
    def validate_presentation(self, file_path: Path) -> ValidationReport:
        """Validate entire presentation and generate comprehensive report"""
        
        # Extract slides
        slides_data = self.extract_slides_from_file(file_path)
        
        if not slides_data:
            raise ValueError("No slides found in the file")
        
        # Analyze each slide
        slide_analyses = []
        global_issues = []
        
        for slide_data in slides_data:
            analysis = self.validate_slide(slide_data)
            slide_analyses.append(analysis)
        
        # Calculate global statistics
        total_slides = len(slide_analyses)
        perfect_sync_slides = sum(1 for slide in slide_analyses if slide.synchronization_perfect)
        total_v_clicks = sum(max(slide.v_clicks) if slide.v_clicks else 0 for slide in slide_analyses)
        total_click_markers = sum(slide.click_markers for slide in slide_analyses)
        overall_sync_rate = (perfect_sync_slides / total_slides) * 100 if total_slides > 0 else 0
        
        avg_words = sum(slide.word_count for slide in slide_analyses) / total_slides if total_slides > 0 else 0
        avg_duration = sum(slide.duration_estimate for slide in slide_analyses) / total_slides if total_slides > 0 else 0
        
        # Global synchronization check
        if total_v_clicks != total_click_markers:
            global_issues.append(ValidationIssue(
                level=ValidationLevel.ERROR,
                slide_number=0,
                category="global_sync",
                message=f"Global synchronization mismatch: {total_v_clicks} total v-clicks vs {total_click_markers} total [click] markers"
            ))
        
        return ValidationReport(
            total_slides=total_slides,
            perfect_sync_slides=perfect_sync_slides,
            total_v_clicks=total_v_clicks,
            total_click_markers=total_click_markers,
            overall_sync_rate=overall_sync_rate,
            avg_words_per_slide=avg_words,
            avg_duration_per_slide=avg_duration,
            slides=slide_analyses,
            global_issues=global_issues
        )
    
    def print_report(self, report: ValidationReport, detailed: bool = False):
        """Print human-readable validation report"""
        
        print("🎯 ENHANCED SLIDE VALIDATION REPORT")
        print("=" * 50)
        
        # Global statistics
        print(f"\n📊 PRESENTATION OVERVIEW:")
        print(f"   Total slides: {report.total_slides}")
        print(f"   Perfect synchronization: {report.perfect_sync_slides}/{report.total_slides} ({report.overall_sync_rate:.1f}%)")
        print(f"   Total v-clicks: {report.total_v_clicks}")
        print(f"   Total [click] markers: {report.total_click_markers}")
        print(f"   Average words per slide: {report.avg_words_per_slide:.1f}")
        print(f"   Average duration per slide: {report.avg_duration_per_slide:.1f}s")
        
        # Global issues
        if report.global_issues:
            print(f"\n🚨 GLOBAL ISSUES:")
            for issue in report.global_issues:
                level_emoji = {"error": "❌", "warning": "⚠️", "info": "ℹ️", "success": "✅"}
                print(f"   {level_emoji.get(issue.level.value, '•')} {issue.message}")
        
        # Per-slide analysis
        if detailed:
            print(f"\n📋 DETAILED SLIDE ANALYSIS:")
            for slide in report.slides:
                sync_status = "✅" if slide.synchronization_perfect else "❌"
                print(f"\n   Slide {slide.slide_number}: {sync_status} {slide.structure_type}")
                print(f"      V-clicks: {slide.v_clicks} (max: {max(slide.v_clicks) if slide.v_clicks else 0})")
                print(f"      [click] markers: {slide.click_markers}")
                print(f"      Words: {slide.word_count}, Duration: {slide.duration_estimate:.1f}s")
                
                if slide.issues:
                    for issue in slide.issues:
                        level_emoji = {"error": "❌", "warning": "⚠️", "info": "ℹ️", "success": "✅"}
                        print(f"         {level_emoji.get(issue.level.value, '•')} {issue.message}")
        
        # Summary
        if report.overall_sync_rate == 100:
            print(f"\n🚀 RESULT: Perfect synchronization! Ready for video generation.")
        elif report.overall_sync_rate >= 90:
            print(f"\n✅ RESULT: Excellent quality ({report.overall_sync_rate:.1f}% sync). Minor tweaks recommended.")
        elif report.overall_sync_rate >= 70:
            print(f"\n⚠️ RESULT: Good quality ({report.overall_sync_rate:.1f}% sync). Some improvements needed.")
        else:
            print(f"\n❌ RESULT: Poor quality ({report.overall_sync_rate:.1f}% sync). Significant fixes required.")

def main():
    parser = argparse.ArgumentParser(
        description="Validate enhanced structured Slidev presentations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python enhanced_slide_validator.py presentation.md
  python enhanced_slide_validator.py presentation.md --detailed
  python enhanced_slide_validator.py presentation.md --json > report.json
        """
    )
    
    parser.add_argument(
        "slidev_file",
        help="Path to Slidev markdown file to validate"
    )
    
    parser.add_argument(
        "--detailed", "-d",
        action="store_true",
        help="Show detailed per-slide analysis"
    )
    
    parser.add_argument(
        "--json", "-j",
        action="store_true", 
        help="Output report in JSON format"
    )
    
    args = parser.parse_args()
    
    # Validate input file
    slidev_file = Path(args.slidev_file)
    if not slidev_file.exists():
        print(f"❌ Slidev file not found: {slidev_file}")
        sys.exit(1)
    
    # Create validator and run analysis
    validator = EnhancedSlideValidator()
    
    try:
        report = validator.validate_presentation(slidev_file)
        
        if args.json:
            print(json.dumps(report.to_dict(), indent=2))
        else:
            validator.print_report(report, detailed=args.detailed)
        
        # Exit with appropriate code
        sys.exit(0 if report.overall_sync_rate == 100 else 1)
        
    except Exception as e:
        print(f"❌ Validation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()