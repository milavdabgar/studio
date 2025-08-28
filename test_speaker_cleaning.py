#!/usr/bin/env python3
"""
Test Speaker Name Cleaning Functionality
========================================

Demonstrate the speaker name cleaning feature in the comprehensive processor.
"""

import sys
sys.path.append('ai_voiceover_system')

from slidev_comprehensive_processor import SlidevComprehensiveProcessor

def test_speaker_cleaning():
    """Test speaker name cleaning functionality"""
    
    processor = SlidevComprehensiveProcessor("test", "gtts")
    
    print("🧪 Speaker Name Cleaning Test")
    print("=" * 50)
    
    # Test cases
    test_cases = [
        {
            "name": "Multi-speaker dialogue",
            "input": """Dr. James: Welcome to our test of the multi-speaker functionality.

Sarah: Hi everyone! This demonstrates our advanced TTS capabilities.

Dr. James: The system should automatically detect this as multi-speaker content.""",
            "expected_cleaned": "Welcome to our test of the multi-speaker functionality. Hi everyone! This demonstrates our advanced TTS capabilities. The system should automatically detect this as multi-speaker content."
        },
        {
            "name": "SSML format",
            "input": """<speak>
<voice name="en-US-Chirp3-HD-Algieba">Hello, this is the first speaker using SSML markup.</voice>
<voice name="en-US-Chirp3-HD-Achernar">And this is the second speaker with a different voice.</voice>
</speak>""",
            "expected_cleaned": "Hello, this is the first speaker using SSML markup. And this is the second speaker with a different voice."
        },
        {
            "name": "Mixed content with colon (not speaker)",
            "input": "Time: 3:30 PM. The meeting will discuss the following: agenda items and next steps.",
            "expected_cleaned": "Time: 3:30 PM. The meeting will discuss the following: agenda items and next steps."
        },
        {
            "name": "Single speaker (no cleaning needed)",
            "input": "This is regular single speaker content without any speaker names.",
            "expected_cleaned": "This is regular single speaker content without any speaker names."
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🔍 Test {i}: {test_case['name']}")
        print(f"📝 Input: {test_case['input'][:100]}{'...' if len(test_case['input']) > 100 else ''}")
        
        cleaned = processor.clean_speaker_names_from_text(test_case['input'])
        print(f"🧹 Cleaned: {cleaned}")
        
        # Check if cleaning worked as expected
        success = cleaned.strip() == test_case['expected_cleaned'].strip()
        print(f"✅ Result: {'PASS' if success else 'FAIL'}")
        
        if not success:
            print(f"❌ Expected: {test_case['expected_cleaned']}")

if __name__ == "__main__":
    test_speaker_cleaning()