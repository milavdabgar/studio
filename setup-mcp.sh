#!/bin/bash

# Playwright MCP Server Setup Script
# This script sets up the MCP server for your project

set -e

echo "🚀 Setting up Playwright MCP Server..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from your project root."
    exit 1
fi

# Check if mcp-server directory exists
if [ ! -d "mcp-server" ]; then
    echo "❌ Error: mcp-server directory not found."
    exit 1
fi

echo "📦 Installing MCP server dependencies..."
cd mcp-server
npm install

echo "🔨 Building MCP server..."
npm run build

echo "✅ MCP server built successfully!"

# Create a launcher script
echo "📝 Creating launcher script..."
cat > ../start-mcp-server.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/mcp-server"
node dist/index.js
EOF

chmod +x ../start-mcp-server.sh

# Add script to main package.json
echo "📄 Adding MCP server script to package.json..."
cd ..

# Check if the script already exists
if ! grep -q "mcp:start" package.json; then
    # Use node to add the script to package.json
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.scripts['mcp:start'] = 'cd mcp-server && node dist/index.js';
    pkg.scripts['mcp:dev'] = 'cd mcp-server && npm run dev';
    pkg.scripts['mcp:build'] = 'cd mcp-server && npm run build';
    pkg.scripts['mcp:test'] = 'cd mcp-server && node test-server.js';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    echo "✅ Added MCP server scripts to package.json"
else
    echo "ℹ️  MCP server scripts already exist in package.json"
fi

echo ""
echo "🎉 Playwright MCP Server setup complete!"
echo ""
echo "Available commands:"
echo "  npm run mcp:start  - Start the MCP server"
echo "  npm run mcp:dev    - Start the MCP server in development mode"
echo "  npm run mcp:build  - Build the MCP server"
echo "  npm run mcp:test   - Test the MCP server"
echo ""
echo "Or use the launcher script:"
echo "  ./start-mcp-server.sh"
echo ""
echo "📚 See mcp-server/README.md for detailed usage instructions."
