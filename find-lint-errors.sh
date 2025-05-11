#!/bin/bash

# Find all TypeScript and TSX files
echo "Finding all TypeScript and TSX files..."
TS_FILES=$(find src -type f -name "*.ts" -o -name "*.tsx" | grep -v "node_modules" | grep -v ".next")

# Create a temporary file to store lint errors
TEMP_FILE=$(mktemp)

echo "Checking for lint errors..."
for file in $TS_FILES; do
  echo "Checking $file"
  npx eslint "$file" --format json > "$TEMP_FILE" 2>/dev/null
  
  # Check if there are any errors
  if [ -s "$TEMP_FILE" ]; then
    errors=$(cat "$TEMP_FILE" | grep -c "\"severity\":2")
    warnings=$(cat "$TEMP_FILE" | grep -c "\"severity\":1")
    
    if [ "$errors" -gt 0 ] || [ "$warnings" -gt 0 ]; then
      echo "  - Found $errors errors and $warnings warnings"
      echo "$file: $errors errors, $warnings warnings" >> lint-errors-report.txt
      
      # Extract the error messages
      cat "$TEMP_FILE" | jq -r '.[] | .messages[] | "  - " + .message + " (line " + (.line|tostring) + ")"' >> lint-errors-report.txt
      echo "" >> lint-errors-report.txt
    fi
  fi
done

echo "Lint check completed. Results saved to lint-errors-report.txt"
