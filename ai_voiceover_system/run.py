#!/usr/bin/env python3
"""
AI Voiceover System Runner
==========================

This script automatically activates the project's virtual environment 
and runs the unified slidev processor with multi-TTS support.
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    """Main runner that handles venv activation and script execution"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    venv_path = project_root / "venv"
    processor_script = script_dir / "slidev_unified_processor.py"
    
    print("🎤 AI Voiceover System Runner")
    print("=" * 50)
    
    # Check if venv exists
    if not venv_path.exists():
        print("❌ Virtual environment not found!")
        print("💡 Create one with:")
        print(f"   cd {project_root}")
        print("   python3 -m venv venv")
        print("   source venv/bin/activate")
        print("   pip install gtts moviepy")
        return 1
    
    # Get venv python path
    venv_python = venv_path / "bin" / "python"
    if not venv_python.exists():
        print("❌ Virtual environment python not found!")
        return 1
    
    print(f"✅ Using virtual environment: {venv_path}")
    print(f"✅ Running processor: {processor_script}")
    print()
    
    # Run the processor with venv python
    cmd = [str(venv_python), str(processor_script)] + sys.argv[1:]
    try:
        result = subprocess.run(cmd, cwd=project_root)
        return result.returncode
    except KeyboardInterrupt:
        print("\n⚠️ Process interrupted by user")
        return 1
    except Exception as e:
        print(f"❌ Error running processor: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())