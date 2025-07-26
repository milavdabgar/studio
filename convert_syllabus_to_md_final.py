#!/usr/bin/env python3
"""
Final optimized script to convert all syllabus PDF files to Markdown format.
This version provides the most accurate and complete conversion.
"""

import os
import re
import subprocess
import sys
from pathlib import Path
from typing import List, Tuple


def find_syllabus_pdfs(study_materials_dir: str) -> List[str]:
    """Find all syllabus PDF files matching the pattern."""
    pdf_files = []
    
    # Pattern for subject codes: 7-digit numbers or DI followed by 8 digits or 7-digit starting with 1
    patterns = [
        r'/\d{7}\.pdf$',           # 7-digit codes like 4300001.pdf
        r'/DI\d{8}\.pdf$',         # DI codes like DI01000021.pdf
        r'/1\d{6}\.pdf$'           # 7-digit codes starting with 1 like 1333201.pdf
    ]
    
    for root, dirs, files in os.walk(study_materials_dir):
        for file in files:
            if file.endswith('.pdf'):
                full_path = os.path.join(root, file)
                # Check if the file matches any of our patterns
                for pattern in patterns:
                    if re.search(pattern, full_path):
                        pdf_files.append(full_path)
                        break
    
    return sorted(pdf_files)


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF using pdftotext."""
    try:
        result = subprocess.run(
            ['pdftotext', '-layout', pdf_path, '-'],
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        
        if result.returncode == 0:
            return result.stdout
        else:
            print(f"Error extracting text from {pdf_path}: {result.stderr}")
            return ""
    except Exception as e:
        print(f"Exception extracting text from {pdf_path}: {str(e)}")
        return ""


def clean_and_format_text(text: str, subject_code: str) -> str:
    """Clean and format the extracted text into Markdown with optimal preservation."""
    if not text.strip():
        return f"# {subject_code} - Syllabus\n\n*Error: Could not extract content from PDF*\n"
    
    lines = text.split('\n')
    formatted_lines = []
    
    # Extract course information more accurately
    course_title = ""
    course_code = ""
    
    # Look for course title and code in first 20 lines
    for i, line in enumerate(lines[:20]):
        line_clean = line.strip()
        if 'Course Code:' in line:
            match = re.search(r'Course Code:\s*(\w+)', line)
            if match:
                course_code = match.group(1)
        elif 'Course Title:' in line:
            course_title = line.replace('Course Title:', '').strip()
        elif line_clean and not any(skip in line.upper() for skip in [
            'GUJARAT TECHNOLOGICAL UNIVERSITY', 'COMPETENCY-FOCUSED', 'COGC-2021', 
            'SEMESTER', 'COURSE CODE:'
        ]) and len(line_clean) > 10 and i < 8:
            if not course_title:
                course_title = line_clean
    
    # Build header
    if course_title and course_code:
        formatted_lines.append(f"# {course_title}")
        formatted_lines.append(f"**Course Code:** {course_code}")
    elif course_title:
        formatted_lines.append(f"# {course_title}")
    else:
        formatted_lines.append(f"# {subject_code} - Syllabus")
    
    formatted_lines.extend(["", "---", ""])
    
    # Process content with enhanced section detection
    i = 0
    while i < len(lines):
        line = lines[i]
        original_line = line
        line_stripped = line.strip()
        
        # Skip very short lines but preserve some structure
        if len(line_stripped) < 2:
            if formatted_lines and formatted_lines[-1] != "":
                formatted_lines.append("")
            i += 1
            continue
        
        # Skip obvious headers/footers
        if any(skip in line_stripped.upper() for skip in [
            'GTU - COGC-2021 CURRICULUM'
        ]) or re.match(r'^Page \d+ of \d+$', line_stripped):
            i += 1
            continue
        
        # Enhanced section detection - handle various formats
        # Format: "1. RATIONALE" or "3.      COURSE OUTCOMES (COs)"
        section_match = re.match(r'^(\d+)\.\s*([A-Z][A-Z\s&()]+)$', line_stripped)
        if section_match:
            section_number = section_match.group(1)
            section_title = section_match.group(2).strip()
            formatted_lines.append(f"## {section_number}. {section_title.title()}")
            formatted_lines.append("")
            i += 1
            continue
        
        # Handle bullet points with various symbols
        if line_stripped.startswith(('●', '•', '-', '○')):
            formatted_lines.append(f"- {line_stripped[1:].strip()}")
            i += 1
            continue
        
        # Handle lettered subsections a) b) c) etc.
        letter_match = re.match(r'^([a-z])\)\s+(.+)$', line_stripped)
        if letter_match:
            formatted_lines.append(f"{letter_match.group(1)}. {letter_match.group(2)}")
            i += 1
            continue
        
        # Handle numbered items with better detection
        num_match = re.match(r'^(\d+)\.\s+(.+)$', line_stripped)
        if num_match and len(num_match.group(2)) > 15:  # Avoid section headers
            formatted_lines.append(f"{num_match.group(1)}. {num_match.group(2)}")
            i += 1
            continue
        
        # Enhanced table detection and preservation
        is_table_line = any(keyword in line for keyword in [
            'Teaching Scheme', 'Examination Scheme', 'Theory Marks', 'Practical Marks',
            'Total Credits', 'Unit', 'Approx. Hrs', 'S.', 'L       T     P', 'CA       ESE'
        ])
        
        if is_table_line:
            # Collect the entire table
            table_lines = []
            table_start = i
            
            # Look ahead to collect table content
            while i < len(lines):
                current_line = lines[i]
                current_stripped = current_line.strip()
                
                # Stop at clear section breaks
                if (re.match(r'^\d+\.\s*[A-Z]', current_stripped) and i > table_start + 3):
                    break
                # Stop at notes or legends
                if (current_stripped.startswith('(*):') or 
                    current_stripped.startswith('Legends:') or
                    'practical outcomes' in current_stripped.lower()):
                    # Include the note line and stop
                    table_lines.append(current_line)
                    i += 1
                    break
                
                table_lines.append(current_line)
                i += 1
                
                # Safety break
                if i - table_start > 25:
                    break
            
            # Format the table
            if table_lines:
                formatted_lines.append("### Teaching and Examination Scheme")
                formatted_lines.append("")
                formatted_lines.append("```")
                for table_line in table_lines:
                    formatted_lines.append(table_line.rstrip())
                formatted_lines.append("```")
                formatted_lines.append("")
            continue
        
        # Handle special notes
        if line_stripped.startswith(('(*):',  'Legends:', 'Note:')):
            formatted_lines.append(f"*{line_stripped}*")
            formatted_lines.append("")
            i += 1
            continue
        
        # Handle practical outcomes and other structured content
        if any(keyword in line_stripped.lower() for keyword in [
            'practical outcomes', 'pros marked', 'precision level'
        ]):
            # This is the start of a structured section
            formatted_lines.append("## Practical Outcomes")
            formatted_lines.append("")
            formatted_lines.append(line_stripped)
            i += 1
            continue
        
        # Handle table headers and structured data
        if re.match(r'^\s*S\.\s*$', line_stripped) or 'Practical Outcomes (PrOs)' in line:
            formatted_lines.append("### Practical Outcomes Table")
            formatted_lines.append("")
            formatted_lines.append("```")
            formatted_lines.append(original_line.rstrip())
            i += 1
            
            # Collect the table
            while i < len(lines) and i < len(lines) - 1:
                next_line = lines[i]
                if re.match(r'^\d+\.\s*[A-Z]', next_line.strip()) and 'EQUIPMENT' in next_line.upper():
                    break
                formatted_lines.append(next_line.rstrip())
                i += 1
            
            formatted_lines.append("```")
            formatted_lines.append("")
            continue
        
        # Regular content - be more inclusive
        if len(line_stripped) > 3:
            formatted_lines.append(line_stripped)
        
        i += 1
    
    # Clean up excessive empty lines while preserving structure
    result = []
    empty_count = 0
    for line in formatted_lines:
        if line == "":
            empty_count += 1
            if empty_count <= 2:
                result.append(line)
        else:
            empty_count = 0
            result.append(line)
    
    return '\n'.join(result)


def convert_pdf_to_markdown(pdf_path: str) -> Tuple[str, bool]:
    """Convert a single PDF to Markdown and return the content and success status."""
    # Extract subject code from filename
    filename = os.path.basename(pdf_path)
    subject_code = os.path.splitext(filename)[0]
    
    print(f"Processing {subject_code}...")
    
    # Extract text from PDF
    raw_text = extract_text_from_pdf(pdf_path)
    
    # Format as Markdown
    markdown_content = clean_and_format_text(raw_text, subject_code)
    
    # Create output path
    md_filename = f"{subject_code}.md"
    md_path = os.path.join(os.path.dirname(pdf_path), md_filename)
    
    try:
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        print(f"✓ Created {md_path}")
        return md_path, True
    except Exception as e:
        print(f"✗ Error writing {md_path}: {str(e)}")
        return md_path, False


def main():
    """Main function to process all syllabus PDFs."""
    if len(sys.argv) > 1:
        study_materials_dir = sys.argv[1]
    else:
        study_materials_dir = "/Users/milav/Code/gpp/studio/content/resources/study-materials"
    
    if not os.path.exists(study_materials_dir):
        print(f"Error: Directory {study_materials_dir} does not exist")
        return 1
    
    print(f"Searching for syllabus PDFs in {study_materials_dir}...")
    
    # Find all syllabus PDFs
    pdf_files = find_syllabus_pdfs(study_materials_dir)
    
    if not pdf_files:
        print("No syllabus PDF files found!")
        return 1
    
    print(f"Found {len(pdf_files)} syllabus PDF files to convert")
    print()
    
    # Convert each PDF
    success_count = 0
    total_count = len(pdf_files)
    
    for pdf_path in pdf_files:
        _, success = convert_pdf_to_markdown(pdf_path)
        if success:
            success_count += 1
    
    print()
    print(f"Conversion complete: {success_count}/{total_count} files converted successfully")
    
    if success_count < total_count:
        print(f"Failed to convert {total_count - success_count} files")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
