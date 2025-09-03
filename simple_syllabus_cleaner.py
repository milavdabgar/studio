#!/usr/bin/env python3
"""
Simple and Accurate Syllabus Cleaner - Just remove headers and page footers, 
keep orphaned table rows in place with clear separation
"""

import re
import sys
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
_log = logging.getLogger(__name__)

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

def remove_page_footers(content: str) -> str:
    """Remove page footers like 'P a g e X of Y'"""
    lines = content.split('\n')
    lines_to_remove = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        # Match patterns like "P a g e 9 of 10", "Page 1 of 2", etc.
        if re.match(r'^P\s*a\s*g\s*e\s+\d+\s+of\s+\d+$', stripped, re.IGNORECASE):
            lines_to_remove.append(i)
            _log.info(f"Removing page footer at line {i+1}: '{stripped}'")
    
    cleaned_lines = [line for i, line in enumerate(lines) if i not in lines_to_remove]
    _log.info(f"Removed {len(lines_to_remove)} page footers")
    return '\n'.join(cleaned_lines)

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

def basic_cleanup(content: str) -> str:
    """Basic cleanup - remove excessive blank lines"""
    # Replace multiple consecutive blank lines with single blank line
    content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
    return content.strip()

def process_markdown_file(input_file: str) -> str:
    """Process the markdown file with simple and accurate cleaning"""
    output_file = input_file.replace('.md', '.simple.md')
    
    _log.info(f"Processing: {input_file}")
    
    # Read input
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_lines = len(content.split('\n'))
    _log.info(f"Original: {original_lines} lines")
    
    # Step 1: Remove repeated headers only (keep orphaned table rows in place)
    _log.info("Step 1: Removing repeated headers only...")
    content = remove_repeated_headers_simple(content)
    
    # Step 2: Merge adjacent table fragments  
    _log.info("Step 2: Merging fragmented tables...")
    content = merge_adjacent_tables(content)
    
    # Step 3: Remove page footers
    _log.info("Step 3: Removing page footers...")
    content = remove_page_footers(content)
    
    # Step 4: Basic cleanup
    _log.info("Step 4: Basic cleanup...")
    content = basic_cleanup(content)
    
    final_lines = len(content.split('\n'))
    _log.info(f"Final: {final_lines} lines (removed {original_lines - final_lines} lines)")
    
    # Write output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    _log.info(f"Saved to: {output_file}")
    
    # Show preview
    preview_lines = content.split('\n')[:30]
    _log.info(f"\nPreview of cleaned content:")
    _log.info("=" * 50)
    for i, line in enumerate(preview_lines, 1):
        _log.info(f"{i:2}: {line}")
    if len(content.split('\n')) > 30:
        _log.info(f"... and {len(content.split('\n')) - 30} more lines")
    
    return output_file

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python simple_syllabus_cleaner.py <input.md>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    try:
        output_file = process_markdown_file(input_file)
        print(f"Successfully processed {input_file} -> {output_file}")
    except Exception as e:
        _log.error(f"Error processing file: {e}")
        sys.exit(1)
