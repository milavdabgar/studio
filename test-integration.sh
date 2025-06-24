#!/bin/bash

echo "🚀 Starting Students API Integration Test"
echo "========================================"

# Check if dev server is already running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Dev server is already running at http://localhost:3000"
    echo "🧪 Running integration tests..."
    npm run test:integration
else
    echo "❌ Dev server not running at http://localhost:3000"
    echo ""
    echo "📋 To run integration tests:"
    echo "1. Start the dev server: npm run dev"
    echo "2. In another terminal, run: npm run test:integration"
    echo ""
    echo "Or run this script again once the server is running."
fi
