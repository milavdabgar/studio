#!/usr/bin/env python3
"""
Test script for AI-Powered Slide Generator
==========================================

Simple test to verify the AI slide generator is working correctly.
"""

import os
import sys
from pathlib import Path

def test_imports():
    """Test if all required modules can be imported"""
    print("🔧 Testing imports...")
    
    try:
        import requests
        print("✅ requests module available")
    except ImportError:
        print("❌ requests module not found - run: pip install requests")
        return False
    
    try:
        from dotenv import load_dotenv
        print("✅ python-dotenv module available")
    except ImportError:
        print("❌ python-dotenv module not found - run: pip install python-dotenv")
        return False
    
    try:
        from ai_slide_generator import AISlideGenerator, VTTParser, ClaudeAPIClient
        print("✅ AI slide generator modules available")
    except ImportError as e:
        print(f"❌ AI slide generator import failed: {e}")
        return False
    
    return True

def test_api_key():
    """Test if Claude API key is configured"""
    print("\n🔑 Testing API key configuration...")
    
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv('ANTHROPIC_API_KEY') or os.getenv('CLAUDE_API_KEY')
    if api_key:
        print("✅ Claude API key found")
        print(f"   Key preview: {api_key[:8]}...{api_key[-4:]}")
        return True
    else:
        print("❌ Claude API key not found")
        print("   Please add ANTHROPIC_API_KEY to your .env file")
        return False

def test_vtt_parser():
    """Test VTT parsing functionality"""
    print("\n📝 Testing VTT parser...")
    
    # Create a simple test VTT
    test_vtt_content = """WEBVTT

00:00:00.000 --> 00:00:05.000
This is a test of the VTT parsing system.

00:00:05.000 --> 00:00:10.000
We are testing whether the parser can extract text properly.

00:00:10.000 --> 00:00:15.000
This should create multiple segments for analysis.
"""
    
    test_file = Path("test_parse.vtt")
    test_file.write_text(test_vtt_content, encoding='utf-8')
    
    try:
        from ai_slide_generator import VTTParser
        parser = VTTParser()
        segments = parser.parse_vtt_file(test_file)
        
        if segments and len(segments) == 3:
            print(f"✅ VTT parser working - parsed {len(segments)} segments")
            print(f"   First segment: {segments[0].clean_text[:50]}...")
            success = True
        else:
            print(f"❌ VTT parser issue - got {len(segments) if segments else 0} segments")
            success = False
    except Exception as e:
        print(f"❌ VTT parser error: {e}")
        success = False
    finally:
        # Cleanup
        if test_file.exists():
            test_file.unlink()
    
    return success

def test_claude_client():
    """Test Claude API client (without making actual API call)"""
    print("\n🤖 Testing Claude client setup...")
    
    try:
        from ai_slide_generator import ClaudeAPIClient
        client = ClaudeAPIClient()
        
        if client.api_key:
            print("✅ Claude client initialized with API key")
            return True
        else:
            print("❌ Claude client has no API key")
            return False
    except Exception as e:
        print(f"❌ Claude client error: {e}")
        return False

def test_generator_creation():
    """Test AI slide generator creation"""
    print("\n🎯 Testing AI generator creation...")
    
    try:
        from ai_slide_generator import AISlideGenerator
        generator = AISlideGenerator()
        
        print("✅ AI slide generator created successfully")
        print(f"   Output directory: {generator.output_dir}")
        return True
    except Exception as e:
        print(f"❌ AI generator creation failed: {e}")
        return False

def test_integration_availability():
    """Test if enhanced generator can import AI generator"""
    print("\n🔗 Testing integration availability...")
    
    # Test if the enhanced generator can import our AI generator
    try:
        # This simulates what enhanced_timesynced_generator.py does
        from ai_slide_generator import AISlideGenerator
        AI_GENERATOR_AVAILABLE = True
        print("✅ AI generator available for integration")
    except ImportError:
        AI_GENERATOR_AVAILABLE = False
        print("❌ AI generator not available for integration")
    
    # Check if enhanced generator exists
    enhanced_path = Path("enhanced_timesynced_generator.py")
    if enhanced_path.exists():
        print("✅ Enhanced time-synced generator found")
    else:
        print("⚠️ Enhanced time-synced generator not found")
    
    return AI_GENERATOR_AVAILABLE

def run_all_tests():
    """Run all tests and provide summary"""
    print("🧪 AI-Powered Slide Generator Test Suite")
    print("=" * 50)
    
    tests = [
        ("Module Imports", test_imports),
        ("API Key Configuration", test_api_key), 
        ("VTT Parser", test_vtt_parser),
        ("Claude Client", test_claude_client),
        ("Generator Creation", test_generator_creation),
        ("Integration Check", test_integration_availability)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test '{test_name}' crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:8} {test_name}")
        if result:
            passed += 1
    
    print("-" * 50)
    print(f"Total: {passed}/{total} tests passed ({passed/total*100:.0f}%)")
    
    if passed == total:
        print("\n🎉 All tests passed! AI slide generator is ready to use.")
        print("\nNext steps:")
        print("1. python ai_slide_generator.py your_transcript.vtt --slides 6")
        print("2. python enhanced_timesynced_generator.py audio.m4a transcript.vtt --generate-slides --ai")
    elif passed >= total - 1:
        print("\n⚠️ Almost ready! Fix the failing test and you're good to go.")
    else:
        print("\n❌ Multiple issues found. Please fix the failing tests.")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)