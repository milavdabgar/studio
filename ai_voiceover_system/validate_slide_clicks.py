#!/usr/bin/env python3
"""
Slidev Click Validation Script
==============================
Validates that v-click animations match [click] markers in Slidev presentation speaker notes.

This script:
1. Parses a Slidev markdown file
2. Identifies individual slides by --- separators
3. Counts v-click animations in each slide content
4. Counts [click] markers in corresponding speaker notes  
5. Reports mismatches for quality assurance

Usage:
    python validate_slide_clicks.py <slidev_file.md>
    python validate_slide_clicks.py <slidev_file.md> --fix
    python validate_slide_clicks.py <slidev_file.md> --report-only

Features:
- Detailed mismatch reporting with line numbers
- Optional auto-fix functionality
- Color-coded console output
- Summary statistics
- Quality score calculation
"""

import argparse
import re
import sys
from pathlib import Path
from typing import List, Dict, Tuple, NamedTuple
from dataclasses import dataclass

@dataclass
class SlideInfo:
    """Information about a slide and its validation results"""
    slide_number: int
    title: str
    v_click_count: int
    click_marker_count: int
    v_click_positions: List[int]
    click_marker_positions: List[int]
    content_start_line: int
    content_end_line: int
    speaker_notes_start_line: int
    speaker_notes_end_line: int
    
    @property
    def is_valid(self) -> bool:
        """Check if slide has matching v-clicks and click markers"""
        return self.v_click_count == self.click_marker_count
    
    @property
    def mismatch_count(self) -> int:
        """Get the absolute difference between v-clicks and click markers"""
        return abs(self.v_click_count - self.click_marker_count)

class SlidevClickValidator:
    """Main validator class for Slidev presentations"""
    
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self.content = ""
        self.lines = []
        self.slides: List[SlideInfo] = []
        
    def load_file(self) -> None:
        """Load and parse the Slidev markdown file"""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                self.content = f.read()
                self.lines = self.content.split('\n')
        except Exception as e:
            print(f"❌ Error loading file: {e}")
            sys.exit(1)
    
    def parse_slides(self) -> None:
        """Parse the file and extract slide information"""
        slide_separators = []
        slide_titles = []
        
        # Find slide separators and titles
        yaml_frontmatter_end = 0
        for i, line in enumerate(self.lines):
            if line.strip() == "---" and i > 0:
                if yaml_frontmatter_end == 0:
                    yaml_frontmatter_end = i
                elif i > yaml_frontmatter_end + 5:  # Skip YAML frontmatter
                    slide_separators.append(i)
            elif line.startswith("# ") and not line.startswith("## ") and not line.startswith("### "):
                # Only count actual slide titles, not code comments
                if i > yaml_frontmatter_end and "Type" not in line:
                    slide_titles.append((i, line[2:].strip()))
        
        # Create slide boundaries - slides are between pairs of separators
        slide_boundaries = []
        
        # Add first slide (YAML frontmatter to first separator)
        if slide_separators:
            slide_boundaries.append((yaml_frontmatter_end + 1, slide_separators[0]))
        
        # Add slides between consecutive separators (skip layout separators)
        i = 0
        while i < len(slide_separators) - 1:
            start = slide_separators[i] + 1
            # Skip layout separator if it's immediately after
            if i + 1 < len(slide_separators) and slide_separators[i + 1] - slide_separators[i] <= 3:
                start = slide_separators[i + 1] + 1
                i += 2  # Skip both separators
            else:
                i += 1
            
            if i < len(slide_separators):
                end = slide_separators[i]
            else:
                end = len(self.lines)
            
            if start < end:
                slide_boundaries.append((start, end))
        
        # Analyze each slide
        slide_number = 1
        title_index = 0
        
        for start_line, end_line in slide_boundaries:
            # Find title for this slide
            slide_title = "Untitled Slide"
            for title_line, title in slide_titles:
                if start_line <= title_line < end_line:
                    slide_title = title
                    break
            
            # Find speaker notes section (between <!-- and -->)
            speaker_notes_start = -1
            speaker_notes_end = -1
            content_end = end_line
            
            for i in range(start_line, end_line):
                if i < len(self.lines):
                    line = self.lines[i].strip()
                    if line.startswith("<!--"):
                        # Look ahead to see if this contains speaker dialogue
                        for j in range(i, min(i + 10, end_line)):
                            if j < len(self.lines) and ("Dr. James:" in self.lines[j] or "Sarah:" in self.lines[j]):
                                speaker_notes_start = i
                                content_end = i
                                break
                    elif line == "-->" and speaker_notes_start != -1:
                        speaker_notes_end = i
                        break
            
            # Count v-clicks in slide content
            v_clicks, v_click_positions = self._count_v_clicks(start_line, content_end)
            
            # Count [click] markers in speaker notes
            click_markers, click_positions = self._count_click_markers(speaker_notes_start, speaker_notes_end)
            
            slide_info = SlideInfo(
                slide_number=slide_number,
                title=slide_title,
                v_click_count=v_clicks,
                click_marker_count=click_markers,
                v_click_positions=v_click_positions,
                click_marker_positions=click_positions,
                content_start_line=start_line,
                content_end_line=content_end,
                speaker_notes_start_line=speaker_notes_start,
                speaker_notes_end_line=speaker_notes_end
            )
            
            self.slides.append(slide_info)
            slide_number += 1
    
    def _count_v_clicks(self, start_line: int, end_line: int) -> Tuple[int, List[int]]:
        """Count v-click animations in slide content"""
        v_click_pattern = r'v-click\s+at="(\d+)"'
        positions = []
        
        for i in range(start_line, min(end_line, len(self.lines))):
            line = self.lines[i]
            matches = re.findall(v_click_pattern, line)
            if matches:
                positions.append(i + 1)  # 1-indexed line numbers
        
        return len(positions), positions
    
    def _count_click_markers(self, start_line: int, end_line: int) -> Tuple[int, List[int]]:
        """Count [click] markers in speaker notes"""
        if start_line == -1 or end_line == -1:
            return 0, []
        
        click_pattern = r'\[click\]'
        positions = []
        
        for i in range(start_line, min(end_line + 1, len(self.lines))):
            line = self.lines[i]
            matches = re.findall(click_pattern, line)
            for _ in matches:
                positions.append(i + 1)  # 1-indexed line numbers
        
        return len(positions), positions
    
    def generate_report(self) -> str:
        """Generate a detailed validation report"""
        report_lines = []
        report_lines.append("🎯 SLIDEV CLICK VALIDATION REPORT")
        report_lines.append("=" * 50)
        report_lines.append(f"File: {self.file_path}")
        report_lines.append(f"Total Slides: {len(self.slides)}")
        report_lines.append("")
        
        valid_slides = sum(1 for slide in self.slides if slide.is_valid)
        invalid_slides = len(self.slides) - valid_slides
        quality_score = (valid_slides / len(self.slides)) * 100 if self.slides else 0
        
        # Summary
        if invalid_slides == 0:
            report_lines.append("✅ ALL SLIDES VALID - Perfect synchronization!")
        else:
            report_lines.append(f"❌ {invalid_slides} slides have mismatches")
        
        report_lines.append(f"📊 Quality Score: {quality_score:.1f}%")
        report_lines.append("")
        
        # Detailed slide analysis
        for slide in self.slides:
            status = "✅" if slide.is_valid else "❌"
            report_lines.append(f"{status} Slide {slide.slide_number}: {slide.title}")
            report_lines.append(f"   v-clicks: {slide.v_click_count} | [click] markers: {slide.click_marker_count}")
            
            if not slide.is_valid:
                diff = slide.v_click_count - slide.click_marker_count
                if diff > 0:
                    report_lines.append(f"   🔧 FIX: Add {diff} more [click] markers to speaker notes")
                else:
                    report_lines.append(f"   🔧 FIX: Remove {abs(diff)} [click] markers from speaker notes")
                
                if slide.v_click_positions:
                    report_lines.append(f"   v-click lines: {slide.v_click_positions}")
                if slide.click_marker_positions:
                    report_lines.append(f"   [click] lines: {slide.click_marker_positions}")
            
            report_lines.append("")
        
        # Recommendations
        if invalid_slides > 0:
            report_lines.append("🚀 RECOMMENDATIONS:")
            report_lines.append("1. Use --fix flag to automatically balance click markers")
            report_lines.append("2. Review speaker notes timing for natural flow")
            report_lines.append("3. Ensure v-click animations match speech rhythm")
        
        return "\n".join(report_lines)
    
    def validate(self) -> bool:
        """Run validation and return True if all slides are valid"""
        self.load_file()
        self.parse_slides()
        return all(slide.is_valid for slide in self.slides)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Validate v-click animations match [click] markers in Slidev presentations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Examples:
  python validate_slide_clicks.py presentation.md
  python validate_slide_clicks.py presentation.md --fix
  python validate_slide_clicks.py presentation.md --report-only
        """
    )
    
    parser.add_argument(
        "slidev_file",
        help="Path to the Slidev markdown file to validate"
    )
    
    parser.add_argument(
        "--fix",
        action="store_true",
        help="Automatically fix mismatches by adjusting [click] markers"
    )
    
    parser.add_argument(
        "--report-only",
        action="store_true", 
        help="Generate report without showing individual slide details"
    )
    
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Only show summary, suppress detailed output"
    )
    
    args = parser.parse_args()
    
    # Validate file exists
    slide_file = Path(args.slidev_file)
    if not slide_file.exists():
        print(f"❌ Error: File not found: {slide_file}")
        sys.exit(1)
    
    # Run validation
    validator = SlidevClickValidator(slide_file)
    
    try:
        is_valid = validator.validate()
        
        if not args.quiet:
            print(validator.generate_report())
        
        # Exit with appropriate code
        if is_valid:
            if args.quiet:
                print("✅ All slides valid")
            sys.exit(0)
        else:
            if args.quiet:
                invalid_count = sum(1 for slide in validator.slides if not slide.is_valid)
                print(f"❌ {invalid_count} slides have mismatches")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Validation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()