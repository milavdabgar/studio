#!/bin/bash
# Build script for Slidev presentations
# This script automatically builds all Slidev presentations

echo "🚀 Building Slidev presentations..."

# Create slidev builds directory
mkdir -p public/slidev-builds

# Find all Slidev markdown files
find content -name "*.md" -path "*/slidev/*" | while read file; do
    # Extract presentation name from path
    presentation_name=$(basename "$file" .md)
    presentation_dir=$(dirname "$file")
    
    echo "📦 Building presentation: $presentation_name"
    
    # Create temp directory for this presentation
    temp_dir="/tmp/slidev-build-$presentation_name"
    mkdir -p "$temp_dir"
    
    # Copy presentation file
    cp "$file" "$temp_dir/slides.md"
    
    # Copy any assets (images, etc.)
    if [ -d "$presentation_dir/assets" ]; then
        cp -r "$presentation_dir/assets" "$temp_dir/"
    fi
    
    # Build presentation
    cd "$temp_dir"
    npx slidev build slides.md --base "/slidev-builds/$presentation_name/" --out "dist"
    
    # Copy built presentation to public directory
    cp -r dist "../../../public/slidev-builds/$presentation_name"
    
    # Cleanup
    cd - > /dev/null
    rm -rf "$temp_dir"
    
    echo "✅ Built: $presentation_name"
done

echo "🎉 All Slidev presentations built successfully!"
echo "📁 Available at: /slidev-builds/*/"
