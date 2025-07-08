#!/bin/bash

# LLM CLI automation - pipes prompt to specified LLM
# Usage: ./llm-pipe.sh "provider" "your prompt"

PROVIDER="$1"
PROMPT="$2"

if [ -z "$PROVIDER" ] || [ -z "$PROMPT" ]; then
    echo "Usage: $0 <provider> \"your prompt\""
    echo "Providers: claude, gemini"
    exit 1
fi

case "$PROVIDER" in
    claude)
        echo "🤖 Sending prompt to Claude..."
        echo "📝 Prompt: ${PROMPT:0:100}..."
        echo "$PROMPT" | claude
        ;;
    gemini)
        echo "🔮 Sending prompt to Gemini..."
        echo "📝 Prompt: ${PROMPT:0:100}..."
        echo "$PROMPT" | gemini
        ;;
    *)
        echo "❌ Unknown provider: $PROVIDER"
        echo "Available providers: claude, gemini"
        exit 1
        ;;
esac

echo "✅ Done"