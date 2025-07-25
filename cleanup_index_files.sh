#!/bin/bash

# Script to keep only YAML frontmatter in _index.md and _index.gu.md files
# This script removes all content after the second "---" delimiter

process_file() {
    local file="$1"
    echo "Processing: $file"
    
    # Create a temporary file
    local temp_file=$(mktemp)
    
    # Use awk to extract only the frontmatter (everything up to and including the second ---)
    awk '
    BEGIN { count = 0; in_frontmatter = 0 }
    /^---$/ { 
        count++; 
        print $0; 
        if (count == 1) in_frontmatter = 1;
        if (count == 2) { in_frontmatter = 0; exit }
        next 
    }
    in_frontmatter { print $0 }
    ' "$file" > "$temp_file"
    
    # Replace the original file with the processed content
    mv "$temp_file" "$file"
    echo "✓ Cleaned: $file"
}

# Test mode - process only one file for verification
if [[ "$1" == "--test" ]]; then
    if [[ -n "$2" ]]; then
        process_file "$2"
    else
        echo "Usage: $0 --test <file_path>"
        exit 1
    fi
    exit 0
fi

# Find and process all _index.md and _index.gu.md files
echo "Finding all _index.md and _index.gu.md files in study-materials directory..."

find /Users/milav/Code/gpp/studio/content/resources/study-materials -name "_index.md" -o -name "_index.gu.md" | while read -r file; do
    process_file "$file"
done

echo "All files processed successfully!"