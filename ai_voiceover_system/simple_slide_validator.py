#!/usr/bin/env python3
"""
Simple Slidev Click Validation
============================
A straightforward validator that checks overall v-click and [click] marker balance.

This simplified approach:
1. Counts total v-clicks in the presentation
2. Counts total [click] markers in speaker notes
3. Reports if they match for perfect synchronization
4. Provides detailed breakdown when needed

Usage:
    python simple_slide_validator.py <slidev_file.md>
"""

import argparse
import re
import sys
from pathlib import Path

def validate_slide_synchronization(file_path: Path) -> bool:
    """Validate that v-clicks match [click] markers in a Slidev presentation"""
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False
    
    # Count v-clicks using simpler pattern that matches actual usage
    v_click_pattern = r'v-click\s+at='
    v_click_matches = re.findall(v_click_pattern, content, re.IGNORECASE)
    total_v_clicks = len(v_click_matches)
    
    # Count [click] markers in speaker notes (exclude instructions)
    click_pattern = r'\[click\](?!\s*markers|\s*marker)'
    click_matches = re.findall(click_pattern, content)
    click_count = len(click_matches)
    
    # Report results
    print("🎯 SLIDEV SYNCHRONIZATION VALIDATION")
    print("=" * 40)
    print(f"File: {file_path.name}")
    print()
    print(f"📊 v-click animations: {total_v_clicks}")
    print(f"📊 [click] markers: {click_count}")
    print()
    
    if total_v_clicks == click_count:
        print("✅ PERFECT SYNCHRONIZATION!")
        print("🎉 All v-click animations have matching [click] markers")
        print("🚀 Ready for flawless video generation")
        return True
    else:
        difference = abs(total_v_clicks - click_count)
        if total_v_clicks > click_count:
            print(f"❌ MISMATCH: Need {difference} more [click] markers")
            print("🔧 Add [click] markers to speaker notes")
        else:
            print(f"❌ MISMATCH: Need {difference} fewer [click] markers")
            print("🔧 Remove excess [click] markers from speaker notes")
        
        print()
        print("💡 RECOMMENDATION:")
        print("   Ensure every v-click animation has a corresponding [click] marker")
        print("   in the speaker notes for perfect audio-visual synchronization")
        return False

def main():
    parser = argparse.ArgumentParser(
        description="Simple validation for Slidev v-click and [click] marker synchronization"
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
    
    is_synchronized = validate_slide_synchronization(file_path)
    sys.exit(0 if is_synchronized else 1)

if __name__ == "__main__":
    main()