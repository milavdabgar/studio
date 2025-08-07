#!/bin/bash

# Activate virtual environment
source /home/milav/dev/studio/venv/bin/activate

# Set NODE path
export PATH="/home/milav/.nvm/versions/node/v24.4.1/bin:$PATH"

# Run the video processor
python /home/milav/dev/studio/ai_voiceover_system/slidev_unified_processor.py lecture-01-introduction-to-java.md --tts=gtts