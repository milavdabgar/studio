#!/usr/bin/env python3
"""
Demo: Unified TTS System
========================

Demonstrates the clean, configurable TTS system with multiple providers.

Usage:
    python demo_unified_tts.py

Author: AI Assistant
Date: 2024-07-23
"""

import os
from unified_tts_system import UnifiedTTS
from tts_config import TTSProvider, VoiceMode

def demo_unified_tts():
    """Demonstrate the unified TTS system"""
    
    print("🎭 Unified TTS System Demo")
    print("=" * 50)
    
    # Initialize TTS system
    tts = UnifiedTTS()
    
    # Demo text
    demo_text = "Computer security is the protection of computer systems from damage to their hardware, software, or electronic data. The three main principles are confidentiality, integrity, and availability."
    
    print(f"📝 Demo text: {demo_text[:60]}...")
    print()
    
    # Test 1: Enhanced XTTS-v2 with voice cloning
    print("🎤 Test 1: Enhanced XTTS-v2 Voice Cloning")
    print("-" * 40)
    tts.set_provider(TTSProvider.XTTS_V2)
    tts.set_voice_mode(VoiceMode.CLONED)
    
    if tts.generate(demo_text, "demo_xtts_cloned.wav"):
        print("✅ XTTS-v2 cloned voice generated!")
        
    print()
    
    # Test 2: F5-TTS Premium (if available)
    print("🎤 Test 2: F5-TTS Premium Voice Cloning")
    print("-" * 40)
    try:
        tts.set_provider(TTSProvider.F5_TTS)
        tts.set_voice_mode(VoiceMode.CLONED)
        
        if tts.generate(demo_text, "demo_f5_premium.wav"):
            print("✅ F5-TTS premium voice generated!")
        else:
            print("⚠️ F5-TTS generation had issues (disk space?)")
    except Exception as e:
        print(f"⚠️ F5-TTS not available: {e}")
    
    print()
    
    # Test 3: Edge TTS (Microsoft)
    print("🎤 Test 3: Edge TTS (Microsoft)")
    print("-" * 40)
    try:
        tts.set_provider(TTSProvider.EDGE_TTS)
        tts.set_voice_mode(VoiceMode.STANDARD)
        
        if tts.generate(demo_text, "demo_edge_tts.wav"):
            print("✅ Edge TTS generated!")
        else:
            print("⚠️ Edge TTS not available (install: pip install edge-tts)")
    except Exception as e:
        print(f"⚠️ Edge TTS error: {e}")
    
    print()
    
    # Show system status
    print("📊 System Status")
    print("-" * 40)
    status = tts.get_status()
    for key, value in status.items():
        print(f"   {key}: {value}")
    
    print()
    
    # Configuration demo
    print("⚙️ Configuration Options")
    print("-" * 40)
    
    available_providers = [provider.value for provider in TTSProvider]
    print(f"   Available providers: {', '.join(available_providers)}")
    
    available_modes = [mode.value for mode in VoiceMode]
    print(f"   Available modes: {', '.join(available_modes)}")
    
    if tts.config.provider in [TTSProvider.GOOGLE_TTS, TTSProvider.EDGE_TTS]:
        voices = tts.list_available_voices()
        print(f"   Available voices for {tts.config.provider.value}: {len(voices)} voices")
    
    print()
    print("🎉 Demo Complete!")
    print()
    print("🚀 Usage Examples:")
    print("   # Quick generation")
    print("   from unified_tts_system import quick_generate")
    print("   quick_generate('Hello world', 'output.wav', 'xtts_v2')")
    print()
    print("   # Full control")
    print("   tts = UnifiedTTS()")
    print("   tts.set_provider('f5_tts')")
    print("   tts.generate('Text here', 'output.wav')")
    print()
    print("📁 Generated Files:")
    generated_files = ["demo_xtts_cloned.wav", "demo_f5_premium.wav", "demo_edge_tts.wav"]
    for file in generated_files:
        if os.path.exists(file):
            size_kb = os.path.getsize(file) / 1024
            print(f"   ✅ {file} ({size_kb:.1f}KB)")
        else:
            print(f"   ❌ {file} (not generated)")

if __name__ == "__main__":
    demo_unified_tts()