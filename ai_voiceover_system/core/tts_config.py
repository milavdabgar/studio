#!/usr/bin/env python3
"""
TTS Configuration System
========================

Centralized configuration for all TTS providers:
- XTTS-v2 (Voice Cloning)
- F5-TTS (Premium Voice Cloning) 
- Google TTS (Standard Voices)
- Edge TTS (Microsoft Voices)

Author: AI Assistant
Date: 2024-07-23
"""

import os
from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Optional

class TTSProvider(Enum):
    """Available TTS providers"""
    XTTS_V2 = "xtts_v2"           # Coqui TTS voice cloning
    F5_TTS = "f5_tts"             # F5-TTS premium cloning
    GOOGLE_TTS = "google_tts"     # Google Text-to-Speech
    EDGE_TTS = "edge_tts"         # Microsoft Edge TTS
    
class VoiceMode(Enum):
    """Voice generation modes"""
    CLONED = "cloned"             # Use custom cloned voice
    STANDARD = "standard"         # Use provider's standard voices

@dataclass
class TTSConfig:
    """TTS system configuration"""
    
    # Primary provider selection
    provider: TTSProvider = TTSProvider.XTTS_V2
    voice_mode: VoiceMode = VoiceMode.CLONED
    
    # Voice cloning settings
    voice_sample_path: str = "milav_voice_sample.wav"
    
    # XTTS-v2 settings
    xtts_quality_mode: str = "high"  # high, natural, balanced
    xtts_temperature: float = 0.75
    xtts_repetition_penalty: float = 5.0
    xtts_speed: float = 1.0
    
    # F5-TTS settings  
    f5_reference_duration: int = 15  # seconds
    f5_target_rms: float = 0.1
    f5_speed: float = 1.0
    
    # Google TTS settings
    google_voice_name: str = "en-US-Neural2-D"  # Male voice
    google_speaking_rate: float = 1.0
    google_pitch: float = 0.0
    
    # Edge TTS settings
    edge_voice_name: str = "en-US-AriaNeural"  # Female voice
    edge_rate: str = "+0%"
    edge_pitch: str = "+0Hz"
    
    # Output settings
    output_format: str = "wav"
    sample_rate: int = 22050
    
    # License acceptance
    coqui_tos_agreed: bool = True

# Default configuration instance
DEFAULT_CONFIG = TTSConfig()

# Available voice options for each provider
AVAILABLE_VOICES = {
    TTSProvider.GOOGLE_TTS: [
        "en-US-Neural2-A",  # Female
        "en-US-Neural2-C",  # Female  
        "en-US-Neural2-D",  # Male
        "en-US-Neural2-F",  # Female
        "en-US-Neural2-G",  # Female
        "en-US-Neural2-H",  # Female
        "en-US-Neural2-I",  # Male
        "en-US-Neural2-J",  # Male
    ],
    
    TTSProvider.EDGE_TTS: [
        "en-US-AriaNeural",      # Female
        "en-US-GuyNeural",       # Male
        "en-US-JennyNeural",     # Female
        "en-US-ChristopherNeural", # Male
        "en-US-ElizabethNeural",   # Female
        "en-US-EricNeural",        # Male
        "en-US-MichelleNeural",    # Female
        "en-US-RogerNeural",       # Male
    ]
}

def get_config() -> TTSConfig:
    """Get current TTS configuration"""
    return DEFAULT_CONFIG

def set_provider(provider: TTSProvider):
    """Set the TTS provider"""
    DEFAULT_CONFIG.provider = provider

def set_voice_mode(mode: VoiceMode):
    """Set voice mode (cloned vs standard)"""
    DEFAULT_CONFIG.voice_mode = mode

def get_available_voices(provider: TTSProvider) -> List[str]:
    """Get available voices for a provider"""
    return AVAILABLE_VOICES.get(provider, [])

def update_config(**kwargs):
    """Update configuration parameters"""
    for key, value in kwargs.items():
        if hasattr(DEFAULT_CONFIG, key):
            setattr(DEFAULT_CONFIG, key, value)
        else:
            print(f"Warning: Unknown config parameter: {key}")

# Environment setup
def setup_environment():
    """Set up environment variables"""
    if DEFAULT_CONFIG.coqui_tos_agreed:
        os.environ['COQUI_TOS_AGREED'] = '1'
        os.environ['COQUI_TTS_AGREED'] = '1'