#!/usr/bin/env python3
"""
Quick TTS Functionality Test
============================

Test the comprehensive processor's TTS capabilities with different providers.
"""

import os
import sys
sys.path.append('ai_voiceover_system')

from slidev_comprehensive_processor import SlidevComprehensiveProcessor

def test_tts_providers():
    """Test different TTS providers with sample content"""
    
    # Test content samples
    single_speaker_text = "This is a test of single speaker functionality with our comprehensive processor."
    
    multi_speaker_text = """Dr. James: Welcome to our test of the multi-speaker functionality.

Sarah: Hi everyone! This demonstrates our advanced TTS capabilities.

Dr. James: The system should automatically detect this as multi-speaker content."""
    
    ssml_text = """<speak>
<voice name="en-US-Chirp3-HD-Algieba">Hello, this is the first speaker using SSML markup.</voice>
<voice name="en-US-Chirp3-HD-Achernar">And this is the second speaker with a different voice.</voice>
</speak>"""

    providers = ['gtts', 'gcloud', 'auto']
    
    print("🧪 TTS Functionality Test")
    print("=" * 50)
    
    for provider in providers:
        print(f"\n🎤 Testing TTS Provider: {provider.upper()}")
        print("-" * 30)
        
        try:
            # Initialize processor
            processor = SlidevComprehensiveProcessor("test", provider)
            
            # Test 1: Single speaker
            print("📝 Test 1: Single Speaker")
            result = processor.generate_audio(single_speaker_text, f"test_single_{provider}.mp3")
            print(f"   Result: {'✅ Success' if result else '❌ Failed'}")
            
            # Test 2: Multi-speaker detection
            print("🎭 Test 2: Multi-speaker Detection")
            is_multi = processor.detect_multispeaker_content(multi_speaker_text)
            print(f"   Multi-speaker detected: {'✅ Yes' if is_multi else '❌ No'}")
            
            # Test 3: Multi-speaker audio (if supported)
            if is_multi and processor.gcloud_client:
                print("🎬 Test 3: Multi-speaker Audio Generation")
                result = processor.generate_audio(multi_speaker_text, f"test_multi_{provider}.mp3")
                print(f"   Result: {'✅ Success' if result else '❌ Failed'}")
            else:
                print("🎬 Test 3: Multi-speaker Audio (Fallback to single-speaker)")
                result = processor.generate_audio(multi_speaker_text, f"test_multi_fallback_{provider}.mp3")
                print(f"   Result: {'✅ Success' if result else '❌ Failed'}")
            
            # Test 4: SSML detection
            print("🔤 Test 4: SSML Detection")
            is_ssml = processor.detect_multispeaker_content(ssml_text)
            print(f"   SSML detected: {'✅ Yes' if is_ssml else '❌ No'}")
            
        except Exception as e:
            print(f"❌ Error testing {provider}: {str(e)[:100]}...")
        
        print()

if __name__ == "__main__":
    test_tts_providers()