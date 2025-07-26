#!/usr/bin/env python3
"""
Final cleanup script to fix remaining section headers manually.
This specifically targets numbered sections that should be headers.
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


def fix_section_headers(content: str) -> str:
    """Fix remaining section headers that aren't properly formatted."""
    lines = content.split('\n')
    fixed_lines = []
    
    for line in lines:
        line_stripped = line.strip()
        
        # Fix numbered sections that should be headers
        # Look for patterns like "3. COURSE OUTCOMES" or "5. SUGGESTED PRACTICAL"
        if re.match(r'^\d+\.\s+[A-Z][A-Z\s&()]+$', line_stripped) and not line.startswith('##'):
            # Extract number and title
            parts = line_stripped.split('.', 1)
            if len(parts) == 2:
                number = parts[0].strip()
                title = parts[1].strip()
                fixed_lines.append(f"## {number}. {title.title()}")
                continue
        
        fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)


def fix_file(file_path: str) -> bool:
    """Fix section headers in a single markdown file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        fixed_content = fix_section_headers(content)
        
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
    """Main function to fix section headers in all files."""
    if len(sys.argv) > 1:
        study_materials_dir = sys.argv[1]
    else:
        study_materials_dir = "/Users/milav/Code/gpp/studio/content/resources/study-materials"
    
    if not os.path.exists(study_materials_dir):
        print(f"Error: Directory {study_materials_dir} does not exist")
        return 1
    
    print(f"Fixing section headers in markdown files...")
    
    md_files = find_markdown_files(study_materials_dir)
    
    if not md_files:
        print("No markdown files found!")
        return 1
    
    fixed_count = 0
    for file_path in md_files:
        filename = os.path.basename(file_path)
        subject_code = os.path.splitext(filename)[0]
        
        if fix_file(file_path):
            print(f"✓ Fixed headers in {subject_code}")
            fixed_count += 1
    
    print(f"Section header fix complete: {fixed_count} files updated")
    
    return 0


if __name__ == "__main__":
    exit(main())
