#!/usr/bin/env python3
"""
Simple Local TTS Test
=====================

Quick test of local TTS capabilities without full setup.
Tests multiple engines to find what works on this system.

Author: AI Assistant
Date: 2024-07-23
"""

import os
import sys
import subprocess
from pathlib import Path


def test_coqui_tts():
    """Test Coqui TTS installation and basic functionality"""
    print("🧪 Testing Coqui TTS...")
    
    try:
        # Try installing if not available
        try:
            from TTS.api import TTS
            print("✅ Coqui TTS already installed")
        except ImportError:
            print("📦 Installing Coqui TTS...")
            subprocess.run([sys.executable, "-m", "pip", "install", "TTS"], 
                         check=True, capture_output=True)
            from TTS.api import TTS
            print("✅ Coqui TTS installed successfully")
        
        # Test with a lightweight model first
        print("🔄 Loading lightweight TTS model...")
        
        # Try the fastest model first for testing
        try:
            tts = TTS("tts_models/en/ljspeech/tacotron2-DDC")
            print("✅ Lightweight model loaded")
        except Exception as e:
            print(f"⚠️  Lightweight model failed: {e}")
            print("🔄 Trying default model...")
            tts = TTS("tts_models/en/ljspeech/glow-tts")
            print("✅ Default model loaded")
        
        # Generate test audio
        test_file = Path("test_coqui.wav")
        test_text = "Hello! This is a test of Coqui TTS."
        
        print("🎤 Generating test audio...")
        tts.tts_to_file(text=test_text, file_path=str(test_file))
        
        if test_file.exists() and test_file.stat().st_size > 0:
            file_size = test_file.stat().st_size / 1024
            print(f"✅ Coqui TTS works! Generated {file_size:.1f}KB audio")
            test_file.unlink()  # Clean up
            return True, "Coqui TTS (High Quality)"
        else:
            print("❌ Audio generation failed")
            return False, "Failed"
            
    except Exception as e:
        print(f"❌ Coqui TTS test failed: {e}")
        return False, str(e)


def test_pyttsx3():
    """Test pyttsx3 (system TTS)"""
    print("\n🧪 Testing pyttsx3 (System TTS)...")
    
    try:
        try:
            import pyttsx3
            print("✅ pyttsx3 already installed")
        except ImportError:
            print("📦 Installing pyttsx3...")
            subprocess.run([sys.executable, "-m", "pip", "install", "pyttsx3"], 
                         check=True, capture_output=True)
            import pyttsx3
            print("✅ pyttsx3 installed successfully")
        
        # Initialize engine
        engine = pyttsx3.init()
        
        # List available voices
        voices = engine.getProperty('voices')
        if voices:
            print(f"🎭 Found {len(voices)} system voices")
            
            # Try to find a female voice
            for voice in voices:
                if any(keyword in voice.name.lower() for keyword in ['female', 'woman', 'anna', 'susan']):
                    engine.setProperty('voice', voice.id)
                    print(f"🎯 Selected voice: {voice.name}")
                    break
        
        # Test generation
        test_file = Path("test_pyttsx3.wav")
        test_text = "Hello! This is a test of system text to speech."
        
        print("🎤 Generating test audio...")
        engine.save_to_file(test_text, str(test_file))
        engine.runAndWait()
        
        if test_file.exists() and test_file.stat().st_size > 0:
            file_size = test_file.stat().st_size / 1024
            print(f"✅ pyttsx3 works! Generated {file_size:.1f}KB audio")
            test_file.unlink()  # Clean up
            return True, "System TTS (Basic Quality)"
        else:
            print("❌ Audio generation failed")
            return False, "Failed"
            
    except Exception as e:
        print(f"❌ pyttsx3 test failed: {e}")
        return False, str(e)


def test_gtts():
    """Test Google TTS (requires internet)"""
    print("\n🧪 Testing gTTS (Google TTS)...")
    
    try:
        try:
            from gtts import gTTS
            print("✅ gTTS already installed")
        except ImportError:
            print("📦 Installing gTTS...")
            subprocess.run([sys.executable, "-m", "pip", "install", "gtts"], 
                         check=True, capture_output=True)
            from gtts import gTTS
            print("✅ gTTS installed successfully")
        
        # Test generation
        test_file = Path("test_gtts.mp3")
        test_text = "Hello! This is a test of Google text to speech."
        
        print("🎤 Generating test audio...")
        tts = gTTS(text=test_text, lang='en', slow=False)
        tts.save(str(test_file))
        
        if test_file.exists() and test_file.stat().st_size > 0:
            file_size = test_file.stat().st_size / 1024
            print(f"✅ gTTS works! Generated {file_size:.1f}KB audio")
            test_file.unlink()  # Clean up
            return True, "Google TTS (Good Quality, requires internet)"
        else:
            print("❌ Audio generation failed")
            return False, "Failed"
            
    except Exception as e:
        print(f"❌ gTTS test failed: {e}")
        return False, str(e)


def test_openai_tts():
    """Test OpenAI TTS if API key available"""
    print("\n🧪 Testing OpenAI TTS...")
    
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        print("⏭️  No OPENAI_API_KEY found, skipping")
        return False, "No API key"
    
    try:
        try:
            import openai
            print("✅ OpenAI library already installed")
        except ImportError:
            print("📦 Installing OpenAI...")
            subprocess.run([sys.executable, "-m", "pip", "install", "openai"], 
                         check=True, capture_output=True)
            import openai
            print("✅ OpenAI installed successfully")
        
        # Test generation
        client = openai.OpenAI()
        test_file = Path("test_openai.wav")
        test_text = "Hello! This is a test of OpenAI text to speech."
        
        print("🎤 Generating test audio...")
        response = client.audio.speech.create(
            model="tts-1",
            voice="nova",
            input=test_text,
            response_format="wav"
        )
        
        response.stream_to_file(test_file)
        
        if test_file.exists() and test_file.stat().st_size > 0:
            file_size = test_file.stat().st_size / 1024
            print(f"✅ OpenAI TTS works! Generated {file_size:.1f}KB audio")
            test_file.unlink()  # Clean up
            return True, "OpenAI TTS (Excellent Quality, requires API key)"
        else:
            print("❌ Audio generation failed")
            return False, "Failed"
            
    except Exception as e:
        print(f"❌ OpenAI TTS test failed: {e}")
        return False, str(e)


def main():
    """Run TTS engine tests"""
    print("🎤 Local TTS Engine Test")
    print("="*40)
    print("Testing available TTS engines on your system...")
    print("="*40)
    
    results = {}
    
    # Test all engines
    engines = [
        ("Coqui TTS", test_coqui_tts),
        ("pyttsx3", test_pyttsx3), 
        ("gTTS", test_gtts),
        ("OpenAI TTS", test_openai_tts)
    ]
    
    for engine_name, test_func in engines:
        try:
            success, details = test_func()
            results[engine_name] = {"success": success, "details": details}
        except Exception as e:
            results[engine_name] = {"success": False, "details": str(e)}
    
    # Display results
    print("\n" + "="*40)
    print("🎯 TTS ENGINE TEST RESULTS")
    print("="*40)
    
    working_engines = []
    
    for engine_name, result in results.items():
        if result["success"]:
            print(f"✅ {engine_name}: {result['details']}")
            working_engines.append(engine_name)
        else:
            print(f"❌ {engine_name}: {result['details']}")
    
    print(f"\n📊 Summary:")
    print(f"   Working Engines: {len(working_engines)}/{len(results)}")
    
    if working_engines:
        print(f"   Available: {', '.join(working_engines)}")
        
        print(f"\n🚀 Recommendations:")
        if "Coqui TTS" in working_engines:
            print(f"   🥇 Best: Coqui TTS (high quality, free, offline)")
        elif "OpenAI TTS" in working_engines:
            print(f"   🥇 Best: OpenAI TTS (excellent quality, requires API key)")
        elif "gTTS" in working_engines:
            print(f"   🥇 Best: gTTS (good quality, free, requires internet)")
        elif "pyttsx3" in working_engines:
            print(f"   🥇 Best: pyttsx3 (basic quality, always available)")
        
        print(f"\n✅ Ready to generate voiceovers!")
        print(f"   Run: python local_tts_generator.py")
        
    else:
        print(f"   ❌ No working TTS engines found")
        print(f"\n🔧 Troubleshooting:")
        print(f"   1. Install system TTS: pip install pyttsx3")
        print(f"   2. For best quality: pip install TTS")
        print(f"   3. Check internet connection for gTTS")
    
    print(f"\n💡 This test validates your TTS setup is working correctly!")


if __name__ == "__main__":
    main()