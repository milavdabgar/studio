#!/bin/bash

# Simple Claude CLI automation - pipes prompt to Claude
# Usage: ./claude-pipe.sh "your prompt"

PROMPT="$1"

if [ -z "$PROMPT" ]; then
    echo "Usage: $0 \"your prompt\""
    exit 1
fi

echo "🤖 Sending prompt to Claude..."
echo "📝 Prompt: ${PROMPT:0:100}..."

# Simply echo the prompt to Claude
echo "$PROMPT" | claude

echo "✅ Done"