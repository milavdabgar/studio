# Syllabus PDF to Markdown Converter

A robust solution for converting academic syllabus PDFs into clean, well-structured markdown documents.

## Features

✅ **Complete PDF to Markdown workflow** using docling  
✅ **Removes repeated headers** (keeps only first occurrence)  
✅ **Fixes fragmented tables** across pages  
✅ **Removes page footers** (e.g., "P a g e 9 of 10")  
✅ **Smart table reconstruction** with proper formatting  
✅ **Clean, readable output** suitable for documentation

## Files

- **`process_syllabus.py`** - Main workflow script (PDF → clean markdown)
- **`simple_syllabus_cleaner.py`** - Standalone cleaner for existing markdown files

## Usage

### Complete Workflow (PDF to Clean Markdown)
```bash
python process_syllabus.py input.pdf
```

This creates:
- `input.md` - Raw docling conversion output
- `input.final.md` - Clean, processed markdown

### Clean Existing Markdown Files
```bash
python simple_syllabus_cleaner.py input.md
```

This creates:
- `input.simple.md` - Cleaned markdown

## Example

**Input**: Academic syllabus PDF with repeated headers and fragmented tables  
**Output**: Clean markdown with:
- Single header block
- Complete, properly formatted tables
- No page footers
- Professional structure

## Requirements

- Python 3.7+
- docling (`pip install docling`)

## Processing Results

Typical processing removes 30-35% of unwanted content while preserving all important information:
- Removes repeated header blocks
- Merges fragmented table parts
- Cleans up formatting inconsistencies
- Maintains document structure and readability
