# Legacy Processors

This directory contains the original individual processors that were combined into the unified system.

## Files

- **`slidev_click_processor.py`** - Original click-synchronized processor with GTTS
- **`slidev_click_processor_elevenlabs.py`** - ElevenLabs-specific click processor  
- **`slidev_slide_processor.py`** - Original slide-level processor with voice hierarchy

## Status

⚠️ **DEPRECATED** - These processors have been superseded by `slidev_unified_processor.py`

The unified processor combines all functionality from these individual scripts with:
- Automatic mode detection
- Multi-TTS provider support  
- Better error handling
- Consistent output naming

## Migration

Instead of:
```bash
python slidev_click_processor_elevenlabs.py slides.md
```

Use:
```bash
python slidev_unified_processor.py slides.md --tts=elevenlabs
```

These files are kept for reference and debugging purposes only.