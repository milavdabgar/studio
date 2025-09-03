#!/usr/bin/env python3
"""
Batch process syllabus PDFs with docling.

This script:
1. Finds all syllabus PDF files in the study-materials folder structure
2. Converts them to Markdown using docling
3. Places output files in the same directory as the source PDFs

Usage:
    python batch_process_syllabus.py --dry-run    # List files that would be processed
    python batch_process_syllabus.py              # Process all syllabus PDFs
    python batch_process_syllabus.py --folder "content/resources/study-materials/11-ec"  # Process specific folder
"""

import logging
import subprocess
import sys
import argparse
import re
from pathlib import Path
from typing import List, Tuple

_log = logging.getLogger(__name__)

def is_syllabus_pdf(file_path: Path) -> bool:
    """
    Check if a PDF file is a syllabus based on filename patterns.
    
    Syllabus patterns:
    - New format: DI01000061.pdf, DI03000121.pdf (DI + 8 digits)
    - Old format: 4353201.pdf, 4321102.pdf (7 digits)
    """
    filename = file_path.stem
    
    # New format: DI followed by 8 digits
    if re.match(r'^DI\d{8}$', filename):
        return True
    
    # Old format: 7 digits
    if re.match(r'^\d{7}$', filename):
        return True
    
    return False

def find_syllabus_pdfs(base_folder: Path) -> List[Path]:
    """Find all syllabus PDF files in the folder structure."""
    syllabus_pdfs = []
    
    # Recursively find all PDF files
    for pdf_file in base_folder.rglob("*.pdf"):
        if is_syllabus_pdf(pdf_file):
            syllabus_pdfs.append(pdf_file)
    
    return sorted(syllabus_pdfs)

def check_docling_available() -> bool:
    """Check if docling command is available."""
    try:
        result = subprocess.run(['docling', '--version'], 
                              capture_output=True, text=True, timeout=10)
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False

def convert_pdf_to_markdown(pdf_path: Path) -> Tuple[bool, str]:
    """
    Convert a single PDF to markdown using docling.
    Returns (success, message).
    """
    # Expected output path in the same directory as the PDF
    md_path = pdf_path.with_suffix('.md')
    
    # Output path in current working directory (where docling creates it)
    cwd_md_path = Path.cwd() / (pdf_path.stem + '.md')
    
    # Remove existing output files
    for existing_file in [md_path, cwd_md_path]:
        if existing_file.exists():
            existing_file.unlink()
    
    # Build docling command
    cmd = [
        'docling',
        str(pdf_path),
        '--image-export-mode', 'placeholder',
        '--table-mode', 'accurate',
        '--to', 'md'
    ]
    
    try:
        _log.info(f"Converting: {pdf_path.name}")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            error_msg = f"Docling failed for {pdf_path.name}: {result.stderr}"
            _log.error(error_msg)
            return False, error_msg
        
        # Check if output was created in current working directory
        if not cwd_md_path.exists():
            error_msg = f"Output file not found: {cwd_md_path}"
            _log.error(error_msg)
            return False, error_msg
        
        # Move the output file to the same directory as the PDF
        cwd_md_path.rename(md_path)
        success_msg = f"✅ Created: {md_path}"
        _log.info(success_msg)
        return True, success_msg
        
    except subprocess.TimeoutExpired:
        error_msg = f"Timeout processing {pdf_path.name}"
        _log.error(error_msg)
        return False, error_msg
    except Exception as e:
        error_msg = f"Error processing {pdf_path.name}: {str(e)}"
        _log.error(error_msg)
        return False, error_msg

def main():
    parser = argparse.ArgumentParser(description='Batch process syllabus PDFs with docling')
    parser.add_argument('--dry-run', action='store_true', 
                       help='List files that would be processed without actually processing them')
    parser.add_argument('--folder', type=str, 
                       default='content/resources/study-materials',
                       help='Base folder to search for syllabus PDFs (default: content/resources/study-materials)')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Enable verbose logging')
    parser.add_argument('--override', action='store_true',
                       help='Override existing markdown files (by default, existing files are skipped)')
    
    args = parser.parse_args()
    
    # Setup logging
    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Check base folder exists
    base_folder = Path(args.folder)
    if not base_folder.exists():
        _log.error(f"Base folder not found: {base_folder}")
        sys.exit(1)
    
    # Find all syllabus PDFs
    _log.info(f"Searching for syllabus PDFs in: {base_folder}")
    syllabus_pdfs = find_syllabus_pdfs(base_folder)
    
    if not syllabus_pdfs:
        _log.info("No syllabus PDF files found.")
        return
    
    _log.info(f"Found {len(syllabus_pdfs)} syllabus PDF files:")
    
    # Group by directory for better display
    by_directory = {}
    for pdf_path in syllabus_pdfs:
        dir_path = pdf_path.parent
        if dir_path not in by_directory:
            by_directory[dir_path] = []
        by_directory[dir_path].append(pdf_path)
    
    # Display found files
    for dir_path, pdfs in sorted(by_directory.items()):
        relative_dir = dir_path.relative_to(base_folder)
        print(f"\n📁 {relative_dir}/")
        for pdf in sorted(pdfs):
            # Check if markdown already exists
            md_exists = pdf.with_suffix('.md').exists()
            if args.override:
                status = "🔄 (will override)" if md_exists else "📄"
            else:
                status = "🔄 (md exists)" if md_exists else "📄"
            print(f"   {status} {pdf.name}")
    
    print(f"\nTotal: {len(syllabus_pdfs)} files")
    
    if args.dry_run:
        _log.info("Dry run completed. Use without --dry-run to process files.")
        return
    
    # Check if docling is available
    if not check_docling_available():
        _log.error("Docling command not found. Please install docling:")
        _log.error("  pip install docling")
        sys.exit(1)
    
    # Ask for confirmation
    if args.override:
        existing_count = sum(1 for pdf in syllabus_pdfs if pdf.with_suffix('.md').exists())
        if existing_count > 0:
            print(f"\nThis will process {len(syllabus_pdfs)} PDF files.")
            print(f"⚠️  WARNING: {existing_count} existing markdown files will be OVERRIDDEN!")
        else:
            print(f"\nThis will process {len(syllabus_pdfs)} PDF files.")
    else:
        print(f"\nThis will process {len(syllabus_pdfs)} PDF files.")
    response = input("Continue? (y/N): ").strip().lower()
    if response not in ['y', 'yes']:
        _log.info("Operation cancelled.")
        return
    
    # Process files
    _log.info("Starting batch processing...")
    
    successful = 0
    failed = 0
    skipped = 0
    
    for i, pdf_path in enumerate(syllabus_pdfs, 1):
        md_path = pdf_path.with_suffix('.md')
        
        print(f"\n[{i}/{len(syllabus_pdfs)}] Processing: {pdf_path.name}")
        
        # Skip if markdown already exists (unless override is enabled)
        if md_path.exists() and not args.override:
            _log.info(f"⏭️  Skipping (markdown exists): {pdf_path.name}")
            skipped += 1
            continue
        
        # Convert PDF to markdown
        success, message = convert_pdf_to_markdown(pdf_path)
        
        if success:
            successful += 1
            print(f"   {message}")
        else:
            failed += 1
            print(f"   ❌ {message}")
    
    # Summary
    print("\n" + "="*60)
    print("BATCH PROCESSING COMPLETE!")
    print(f"✅ Successful: {successful}")
    print(f"⏭️  Skipped: {skipped}")
    print(f"❌ Failed: {failed}")
    print(f"📊 Total: {len(syllabus_pdfs)}")
    print("="*60)
    
    if failed > 0:
        _log.warning(f"{failed} files failed to process. Check the logs above for details.")

if __name__ == "__main__":
    main()
