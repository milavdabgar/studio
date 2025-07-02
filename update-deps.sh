#!/bin/bash

# Update deprecated packages script
echo "Updating deprecated packages..."

# Remove @types/handlebars as it's now bundled with handlebars
npm uninstall @types/handlebars

# Replace deprecated glob with newer version
npm uninstall glob
npm install glob@^10.3.10 --save-dev

# Replace deprecated rimraf with newer version
npm uninstall rimraf
npm install rimraf@^5.0.5 --save-dev

# Optional: remove deprecated utility lodash packages
npm uninstall lodash.get lodash.isequal
npm install lodash@^4.17.21 --save-dev

# Remove deprecated abab and use native atob/btoa
npm uninstall abab

# Update inflight package
npm uninstall inflight
npm install lru-cache@^10.2.0 --save-dev

# Update domexception packages
npm uninstall domexception node-domexception

# Remove deprecated fstream
npm uninstall fstream

# Run audit fix to address any remaining issues
npm audit fix

echo "Dependency updates complete!"
