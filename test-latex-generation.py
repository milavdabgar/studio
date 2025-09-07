#!/usr/bin/env python3
"""
Test script to generate LaTeX samples from JSON syllabi
"""

import json
import sys
from pathlib import Path

# Import the generator class directly
exec(open('scripts/json-to-latex.py').read())

def main():
    """Generate sample LaTeX files for visual verification"""
    
    generator = SyllabusLatexGenerator()
    
    # Test files representing different formats
    test_files = [
        {
            "name": "Python Programming (New Format - Practical)",
            "path": "content/resources/study-materials/16-it/sem-1/DI01016011-python/DI01016011.json"
        },
        {
            "name": "Mathematics-I (New Format - Theory Only)",  
            "path": "content/resources/study-materials/00-general/sem-1/DI01000021-maths1/DI01000021.json"
        },
        {
            "name": "Java Programming (Old Format - Complex)",
            "path": "content/resources/study-materials/32-ict/sem-4/4343203-java/4343203.json"
        }
    ]
    
    # Create output directory
    output_dir = Path("samples/latex-verification")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print("🚀 Generating LaTeX samples for visual verification...\n")
    
    generated_count = 0
    
    for test_file in test_files:
        json_path = Path(test_file["path"])
        
        if not json_path.exists():
            print(f"⚠️  File not found: {test_file['name']}")
            continue
            
        try:
            print(f"🔄 Processing: {test_file['name']}")
            print(f"   Source: {json_path.name}")
            
            # Generate LaTeX
            latex_file = generator.convert_json_to_latex(str(json_path), str(output_dir))
            latex_path = Path(latex_file)
            
            # Check file size and content preview
            size = latex_path.stat().st_size
            print(f"   ✅ Generated: {latex_path.name} ({size:,} bytes)")
            
            # Preview first few lines
            with open(latex_path, 'r') as f:
                lines = f.readlines()[:10]
                print(f"   📄 Preview (first 5 lines):")
                for i, line in enumerate(lines[:5]):
                    print(f"      {i+1:2}: {line.strip()}")
            
            generated_count += 1
            print()
            
        except Exception as e:
            print(f"   ❌ Error: {e}\n")
    
    print(f"✅ Successfully generated {generated_count} LaTeX files")
    print(f"📁 Output directory: {output_dir}")
    
    # Show all generated files
    if output_dir.exists():
        print(f"\n📄 Generated files:")
        for file in sorted(output_dir.glob("*.tex")):
            size = file.stat().st_size
            print(f"   • {file.name} ({size:,} bytes)")
    
    print(f"\n💡 To compile LaTeX to PDF:")
    print(f"   cd {output_dir}")  
    print(f"   pdflatex filename.tex")

if __name__ == "__main__":
    main()