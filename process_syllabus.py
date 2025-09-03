#!/usr/bin/env python3
"""
Complete workflow script for processing syllabus PDFs with docling and fixing common issues.

This script:
1. Converts PDF to Markdown using docling
2. Removes repeated headers (keeps only first occurrence)
3. Merges fragmented tables across pages
4. Cleans up formatting

Usage:
    python process_syllabus.py DI01000051.pdf
    
This will create:
    - DI01000051.md (raw docling output)
    - DI01000051.fixed.md (processed output)
"""

import logging
import subprocess
import sys
import re
from pathlib import Path
import shutil

_log = logging.getLogger(__name__)

def check_docling_available():
    """Check if docling command is available"""
    try:
        result = subprocess.run(['docling', '--version'], 
                              capture_output=True, text=True, timeout=10)
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False

def run_docling_conversion(pdf_path: Path) -> Path:
    """Run docling conversion on the PDF file"""
    # Docling outputs to current directory with the same base name
    output_md = Path(pdf_path.stem + '.md')
    
    # Remove existing output if it exists
    if output_md.exists():
        output_md.unlink()
        _log.info(f"Removed existing output: {output_md}")
    
    cmd = [
        'docling', 
        str(pdf_path),
        '--image-export-mode', 'placeholder',
        '--table-mode', 'accurate',
        '--to', 'md'
    ]
    
    _log.info(f"Running docling conversion: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            _log.error(f"Docling conversion failed:")
            _log.error(f"STDOUT: {result.stdout}")
            _log.error(f"STDERR: {result.stderr}")
            raise RuntimeError(f"Docling conversion failed with code {result.returncode}")
        
        _log.info("Docling conversion completed successfully")
        _log.info(f"Output: {result.stdout}")
        
        if not output_md.exists():
            raise RuntimeError(f"Expected output file not found: {output_md}")
        
        return output_md
        
    except subprocess.TimeoutExpired:
        raise RuntimeError("Docling conversion timed out after 5 minutes")

def remove_page_footers(content: str) -> str:
    """Remove page footers like 'P a g e X of Y'."""
    lines = content.split('\n')
    
    # Remove lines that match page footer patterns
    cleaned_lines = []
    removed_count = 0
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        
        # Check for page footer patterns
        if re.match(r'^P\s*a\s*g\s*e\s+\d+\s+of\s+\d+\s*$', line_stripped, re.IGNORECASE):
            _log.info(f"Removing page footer at line {i+1}: '{line_stripped}'")
            removed_count += 1
            continue
        
        cleaned_lines.append(line)
    
    _log.info(f"Removed {removed_count} page footers")
    return '\n'.join(cleaned_lines)

def process_markdown_file(raw_md_path: Path) -> Path:
    """Process the raw markdown file to fix issues."""
    _log.info(f"Processing markdown file: {raw_md_path}")
    
    # Create output path
    output_path = raw_md_path.with_stem(raw_md_path.stem + '.final')
    
    # Read content
    with open(raw_md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_lines = len(content.splitlines())
    _log.info(f"Original: {original_lines} lines")
    
    # Step 1: Remove repeated headers only (preserve orphaned table rows in place)
    _log.info("Step 1: Removing repeated headers only...")
    content = remove_repeated_headers_simple(content)
    
    # Step 2: Merge fragmented tables  
    _log.info("Step 2: Merging fragmented tables...")
    content = merge_adjacent_tables(content)
    
    # Step 3: Remove page footers
    _log.info("Step 3: Removing page footers...")
    content = remove_page_footers(content)
    
    # Step 4: Basic cleanup
    _log.info("Step 4: Basic cleanup...")
    content = basic_cleanup(content)
    
    # Save result
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    final_lines = len(content.splitlines())
    _log.info(f"Final: {final_lines} lines (removed {original_lines - final_lines} lines)")
    _log.info(f"Saved clean markdown to: {output_path}")
    
    return output_path

def is_table_separator(line: str) -> bool:
    """Check if a line is a table separator row (contains only |, -, and spaces)"""
    stripped = line.strip()
    if not stripped.startswith('|') or not stripped.endswith('|'):
        return False
    
    # Check if line contains only |, -, and spaces
    for char in stripped:
        if char not in '|- ':
            return False
    
    return True

def merge_adjacent_tables(content: str) -> str:
    """Merge tables that are adjacent and have the same structure"""
    lines = content.split('\n')
    
    # Find table blocks
    i = 0
    merged_lines = []
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Check if this is a table row
        if line.startswith('|') and line.endswith('|') and line.count('|') >= 2:
            # Start of a table - collect all consecutive table rows
            table_start = i
            table_rows = []
            table_separator_row = None
            
            # Collect this table
            while i < len(lines):
                current_line = lines[i].strip()
                if current_line.startswith('|') and current_line.endswith('|') and current_line.count('|') >= 2:
                    # Check if this is a separator row
                    if is_table_separator(current_line):
                        if table_separator_row is None:
                            table_separator_row = lines[i]  # Keep the first separator
                        # Skip any additional separator rows
                    else:
                        table_rows.append(lines[i])
                    i += 1
                elif current_line == '':
                    # Empty line - might be gap between table fragments
                    gap_start = i
                    # Look ahead to see if there's another table
                    while i < len(lines) and lines[i].strip() == '':
                        i += 1
                    
                    # If we found another table row, it might be a continuation
                    if i < len(lines):
                        next_line = lines[i].strip()
                        if next_line.startswith('|') and next_line.endswith('|') and next_line.count('|') >= 2:
                            # Check if it has the same number of columns
                            if len(table_rows) > 0:
                                first_table_cols = table_rows[0].count('|')
                                next_table_cols = next_line.count('|')
                                
                                if first_table_cols == next_table_cols:
                                    _log.info(f"Merging fragmented table at line {i+1}")
                                    # This looks like a continuation - skip the gap and continue collecting
                                    continue
                    
                    # Not a table continuation - add the gap back and break
                    for gap_line in range(gap_start, i):
                        merged_lines.append(lines[gap_line])
                    break
                else:
                    # Not a table row - end of table
                    merged_lines.append(lines[i])
                    i += 1
                    break
            
            # Add the collected table with proper separator placement
            if table_rows:
                # Add header row first
                merged_lines.append(table_rows[0])
                
                # Add separator row if we have one
                if table_separator_row:
                    merged_lines.append(table_separator_row)
                
                # Add remaining rows
                merged_lines.extend(table_rows[1:])
            
        else:
            # Not a table row - just add it
            merged_lines.append(lines[i])
            i += 1
    
    return '\n'.join(merged_lines)

def remove_repeated_headers_simple(content: str) -> str:
    """Simple approach: Remove repeated headers but preserve orphaned table rows in place"""
    lines = content.split('\n')
    
    # Find all GTU header instances
    gtu_lines = []
    for i, line in enumerate(lines):
        if 'GUJARAT TECHNOLOGICAL UNIVERSITY' in line:
            gtu_lines.append(i)
    
    _log.info(f"Found GTU headers at lines: {gtu_lines}")
    
    if len(gtu_lines) <= 1:
        _log.info("Only one or no GTU header found, nothing to remove")
        return content
    
    # Keep track of lines to remove
    lines_to_remove = set()
    
    # Remove all except the first occurrence
    for header_line in gtu_lines[1:]:
        # Find the full header block around this GTU line
        start = header_line
        
        # Look backwards for image placeholder or empty lines
        while start > 0:
            prev_line = lines[start - 1].strip()
            if prev_line == '<!-- image -->' or prev_line == '':
                start -= 1
            else:
                break
        
        # Look forwards for the end of the header block
        end = header_line
        for j in range(header_line + 1, min(header_line + 20, len(lines))):
            line = lines[j].strip()
            
            # Header content patterns - stop when we hit table rows or meaningful content
            if any(pattern in line.lower() for pattern in [
                'program name:', 'branch:', 'course', 'subject', 'electronics'
            ]):
                end = j
            # Stop at section headers, tables, or meaningful content
            elif line.startswith('#') or (line.startswith('|') and line.count('|') >= 2) or (line and not line.startswith('<!--')):
                break
        
        # Mark header block for removal (but NOT any table rows that follow)
        for k in range(start, end + 1):
            lines_to_remove.add(k)
        
        _log.info(f"Removing header block: lines {start}-{end}")
    
    # Filter out only the header lines, keep everything else including orphaned table rows
    cleaned_lines = [line for i, line in enumerate(lines) if i not in lines_to_remove]
    
    _log.info(f"Removed {len(lines_to_remove)} header lines")
    return '\n'.join(cleaned_lines)

def basic_cleanup(content: str) -> str:
    """Basic cleanup - remove excessive blank lines"""
    # Replace multiple consecutive blank lines with single blank line
    content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
    return content.strip()

def clean_formatting(content: str) -> str:
    """Basic cleanup of excessive whitespace."""
    # Remove excessive blank lines (more than 2 consecutive)
    content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
    return content

def main():
    # Setup logging
    logging.basicConfig(
        level=logging.INFO, 
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    if len(sys.argv) != 2:
        print("Usage: python process_syllabus.py <pdf_file>")
        print("")
        print("This script will:")
        print("1. Convert PDF to Markdown using docling")
        print("2. Fix repeated headers and fragmented tables")
        print("3. Generate a cleaned markdown file")
        sys.exit(1)
    
    pdf_file = Path(sys.argv[1])
    if not pdf_file.exists():
        _log.error(f"PDF file not found: {pdf_file}")
        sys.exit(1)
    
    if pdf_file.suffix.lower() != '.pdf':
        _log.error(f"Input file must be a PDF: {pdf_file}")
        sys.exit(1)
    
    try:
        # Check if docling is available
        if not check_docling_available():
            _log.error("Docling command not found. Please install docling:")
            _log.error("  pip install docling")
            sys.exit(1)
        
        _log.info(f"Starting processing of: {pdf_file}")
        
        # Step 1: Convert PDF with docling
        _log.info("Phase 1: Converting PDF to Markdown with docling...")
        md_file = run_docling_conversion(pdf_file)
        
        # Step 2: Process the markdown to fix issues
        _log.info("Phase 2: Processing markdown to fix issues...")
        fixed_md_file = process_markdown_file(md_file)
        
        _log.info("="*60)
        _log.info("PROCESSING COMPLETE!")
        _log.info(f"Original PDF: {pdf_file}")
        _log.info(f"Raw markdown: {md_file}")
        _log.info(f"Fixed markdown: {fixed_md_file}")
        _log.info("="*60)
        
        # Display some content preview
        with fixed_md_file.open('r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
            
        _log.info("Preview of fixed content (first 20 lines):")
        _log.info("-" * 40)
        for i, line in enumerate(lines[:20], 1):
            print(f"{i:2d}: {line}")
        if len(lines) > 20:
            print(f"... and {len(lines) - 20} more lines")
        
    except Exception as e:
        _log.error(f"Error processing file: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
