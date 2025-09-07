#!/usr/bin/env python3
"""
Generate sample LaTeX and PDF files for visual verification of syllabus conversion
"""

import sys
import os
from pathlib import Path

# Add current directory to path to import json-to-latex
sys.path.append(str(Path(__file__).parent))

from typing import List

def find_json_files() -> List[Path]:
    """Find all JSON syllabus files"""
    content_dir = Path("content/resources/study-materials")
    json_files = []
    
    for json_file in content_dir.rglob("*.json"):
        # Skip non-syllabus JSON files (solutions, etc.)
        if not any(x in json_file.name for x in ['-solution', '-winter', '-summer']):
            json_files.append(json_file)
    
    return json_files

def generate_samples():
    """Generate LaTeX and PDF samples for different syllabus types"""
    
    # Import the generator
    try:
        from json_to_latex import SyllabusLatexGenerator
    except ImportError:
        # Try importing with underscores
        import json_to_latex as jtl
        SyllabusLatexGenerator = jtl.SyllabusLatexGenerator
    
    generator = SyllabusLatexGenerator()
    
    # Test files - different formats and subjects
    test_files = [
        "content/resources/study-materials/16-it/sem-1/DI01016011-python/DI01016011.json",  # New format - practical
        "content/resources/study-materials/00-general/sem-1/DI01000021-maths1/DI01000021.json",  # New format - theory
        "content/resources/study-materials/32-ict/sem-4/4343203-java/4343203.json"  # Old format - complex
    ]
    
    output_dir = Path("samples/latex-output")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    generated_files = []
    
    for json_file in test_files:
        json_path = Path(json_file)
        
        if not json_path.exists():
            print(f"⚠️  JSON file not found: {json_file}")
            continue
        
        try:
            print(f"🔄 Processing: {json_path.name}")
            
            # Generate LaTeX
            latex_file = generator.convert_json_to_latex(str(json_path), str(output_dir))
            generated_files.append(latex_file)
            
            # Try to compile to PDF
            pdf_file = generator.compile_to_pdf(latex_file)
            if pdf_file:
                print(f"✅ Generated PDF: {Path(pdf_file).name}")
            else:
                print(f"⚠️  PDF compilation failed for {json_path.name}")
            
        except Exception as e:
            print(f"❌ Error processing {json_path.name}: {e}")
    
    print(f"\n📄 Generated {len(generated_files)} LaTeX files in {output_dir}")
    
    # Show directory contents
    if output_dir.exists():
        print(f"\n📁 Output directory contents:")
        for file in sorted(output_dir.iterdir()):
            size = file.stat().st_size
            print(f"   {file.name} ({size:,} bytes)")
    
    return generated_files

if __name__ == "__main__":
    print("🚀 Generating LaTeX syllabus samples...")
    generated_files = generate_samples()
    print("✨ Done!")