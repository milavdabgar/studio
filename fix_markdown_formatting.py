#!/usr/bin/env python3
"""
Auto-fix script to clean up the converted Markdown files.
This fixes common formatting issues without adding new content.
"""

import os
import re
import sys
from pathlib import Path
from typing import List


def find_markdown_files(study_materials_dir: str) -> List[str]:
    """Find all syllabus MD files."""
    md_files = []
    
    patterns = [
        r'/\d{7}\.md$',           # 7-digit codes like 4300001.md
        r'/DI\d{8}\.md$',         # DI codes like DI01000021.md
        r'/1\d{6}\.md$'           # 7-digit codes starting with 1 like 1333201.md
    ]
    
    for root, dirs, files in os.walk(study_materials_dir):
        for file in files:
            if file.endswith('.md'):
                full_path = os.path.join(root, file)
                for pattern in patterns:
                    if re.search(pattern, full_path):
                        md_files.append(full_path)
                        break
    
    return sorted(md_files)


def fix_markdown_formatting(content: str) -> str:
    """Fix common formatting issues in the markdown content."""
    lines = content.split('\n')
    fixed_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i].rstrip()
        
        # Fix section headers that weren't detected properly
        # Pattern: "3. COURSE OUTCOMES (COs)" or "3.      COURSE OUTCOMES"
        line_stripped = line.strip()
        section_match = re.match(r'^(\d+)\.\s*([A-Z][A-Z\s&()]+)$', line_stripped)
        if section_match and not line.startswith('##'):
            section_number = section_match.group(1)
            section_title = section_match.group(2).strip()
            fixed_lines.append(f"## {section_number}. {section_title.title()}")
            i += 1
            continue
        
        # Fix Unicode bullet points that got converted incorrectly
        # Only convert lines that actually start with Unicode bullets followed by reasonable content
        if (line_stripped.startswith('') or line_stripped.startswith('')) and len(line_stripped) > 3:
            # Remove Unicode bullet and replace with markdown bullet
            clean_text = line_stripped[1:].strip()  # Remove first character (Unicode bullet)
            # Only convert if it looks like actual bullet content (starts with uppercase or number)
            if clean_text and (clean_text[0].isupper() or clean_text[0].isdigit()):
                fixed_lines.append(f"- {clean_text}")
                i += 1
                continue
        
        # Fix bullet points that lost their formatting
        line_stripped = line.strip()
        if re.match(r'^[a-z]\.\s+', line_stripped) and not line_stripped.startswith('-'):
            # Convert "a. text" to proper list item
            fixed_lines.append(f"- {line_stripped[3:]}")
            i += 1
            continue
        
        # Fix numbered lists that should be bullet points in outcomes
        if re.match(r'^[a-z]\)\s+', line_stripped):
            # Convert "a) text" to proper list item  
            fixed_lines.append(f"- {line_stripped[3:]}")
            i += 1
            continue
        
        # Fix indented bullet points that start with spaces
        if re.match(r'^\s+[A-Z].*', line) and len(line.strip()) > 20:
            # This looks like a bullet point that lost its bullet
            # Check if previous line was a header or intro text
            if (fixed_lines and 
                ('following' in fixed_lines[-1].lower() or 
                 'COs:' in fixed_lines[-1] or
                 fixed_lines[-1].strip().endswith(':'))):
                fixed_lines.append(f"- {line_stripped}")
                i += 1
                continue
        
        # Remove duplicate headers (course title repeated)
        if (line.strip() and 
            i > 5 and  # Not in the header section
            any(line.strip().lower() in prev_line.lower() for prev_line in fixed_lines[-5:] if prev_line.strip())):
            # Skip duplicate content
            i += 1
            continue
        
        # Clean up excessive headers/footers
        if any(skip in line.upper() for skip in [
            'NITTTR BHOPAL', 'GTU - COGC-2021 CURRICULUM', 'PAGE \\d+ OF \\d+'
        ]):
            i += 1
            continue
        
        # Fix table formatting - convert repeated "## Practical Outcomes" to proper structure
        if line.strip() == "## Practical Outcomes" and i > 0:
            # Check if we already have this header recently
            recent_headers = [l for l in fixed_lines[-10:] if l.startswith('##')]
            if any('Practical Outcomes' in h for h in recent_headers):
                # Skip duplicate header, but keep the content
                i += 1
                continue
        
        # Keep the line as is
        fixed_lines.append(line)
        i += 1
    
    # Clean up excessive empty lines
    result = []
    empty_count = 0
    for line in fixed_lines:
        if line == "":
            empty_count += 1
            if empty_count <= 2:
                result.append(line)
        else:
            empty_count = 0
            result.append(line)
    
    return '\n'.join(result)


def fix_file(file_path: str) -> bool:
    """Fix formatting issues in a single markdown file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        fixed_content = fix_markdown_formatting(content)
        
        # Only write if content changed
        if fixed_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            return True
        
        return False
    except Exception as e:
        print(f"Error fixing {file_path}: {str(e)}")
        return False


def main():
    """Main function to fix all markdown files."""
    if len(sys.argv) > 1:
        study_materials_dir = sys.argv[1]
    else:
        study_materials_dir = "/Users/milav/Code/gpp/studio/content/resources/study-materials"
    
    if not os.path.exists(study_materials_dir):
        print(f"Error: Directory {study_materials_dir} does not exist")
        return 1
    
    print(f"Searching for markdown files in {study_materials_dir}...")
    
    md_files = find_markdown_files(study_materials_dir)
    
    if not md_files:
        print("No markdown files found!")
        return 1
    
    print(f"Found {len(md_files)} markdown files to fix")
    print()
    
    fixed_count = 0
    for file_path in md_files:
        filename = os.path.basename(file_path)
        subject_code = os.path.splitext(filename)[0]
        
        print(f"Fixing {subject_code}...", end=' ')
        
        if fix_file(file_path):
            print("✓ Fixed")
            fixed_count += 1
        else:
            print("- No changes needed")
    
    print()
    print(f"Fix complete: {fixed_count}/{len(md_files)} files were updated")
    
    return 0


if __name__ == "__main__":
    exit(main())
