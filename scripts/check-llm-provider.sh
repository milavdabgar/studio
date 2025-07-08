#!/bin/bash

# Check if LLM provider is available
# Usage: ./check-llm-provider.sh <provider>

PROVIDER="$1"

if [ -z "$PROVIDER" ]; then
    echo "Usage: $0 <provider>"
    exit 1
fi

case "$PROVIDER" in
    claude)
        if command -v claude &> /dev/null; then
            echo "✅ Claude CLI is available"
            exit 0
        else
            echo "❌ Claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code"
            exit 1
        fi
        ;;
    gemini)
        if command -v gemini &> /dev/null; then
            echo "✅ Gemini CLI is available"
            exit 0
        else
            echo "❌ Gemini CLI not found. Install with: npm install -g @google-ai/generativelanguage"
            echo "   Or check: https://github.com/google/generative-ai-cli"
            exit 1
        fi
        ;;
    *)
        echo "❌ Unknown provider: $PROVIDER"
        echo "Available providers: claude, gemini"
        exit 1
        ;;
esac