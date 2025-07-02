#!/bin/bash

# Comprehensive fix for deprecated packages

echo "Performing comprehensive package updates to address deprecation warnings..."

# Create package.json backup
cp package.json package.json.bak

# Update to more modern glob and rimraf
npm install glob@^10.3.10 rimraf@^5.0.5 --save-dev

# Add resolutions for deep dependencies in package.json
node -e '
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

// Create or update resolutions field
pkg.resolutions = pkg.resolutions || {};

// Add resolutions for commonly deprecated packages
Object.assign(pkg.resolutions, {
  "glob": "^10.3.10",
  "rimraf": "^5.0.5",
  "handlebars": "^4.7.8",
  "abab": "latest",
  "domexception": "latest",
  "inflight": "latest",
  "lodash.get": "latest",
  "lodash.isequal": "latest",
  "fstream": "latest"
});

fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2), "utf8");
console.log("Updated package.json with resolutions for deprecated packages");
'

# Run npm install to apply resolutions
echo "Running npm install to apply resolutions..."
npm install

# Install specific peer dependencies that might be causing issues
npm install -D @types/node@^20.11.0

# Fix remaining packages with force
echo "Cleaning up remaining issues..."
npm install --force

echo "Dependency updates complete! Try running 'npm install' to check for remaining warnings."
