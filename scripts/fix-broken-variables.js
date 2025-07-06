#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getAllTsFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (!['node_modules', '.next', 'coverage', '.git', 'dist', 'build'].includes(file)) {
          getAllTsFiles(filePath, fileList);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        fileList.push(filePath);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return fileList;
}

function fixBrokenVariables(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix broken variable references where error was renamed to _error but still used as error
    const brokenErrorRefs = [
      // Pattern: } catch (_error) { ... (error as Error).message ...
      { pattern: /catch\s*\(\s*_error\s*\)\s*\{[^}]*\(error\s+as\s+Error\)/g, replacement: (match) => match.replace(/\(error\s+as\s+Error\)/g, '(_error as Error)') },
      // Pattern: } catch (_error) { ... error.message ...
      { pattern: /catch\s*\(\s*_error\s*\)\s*\{[^}]*error\./g, replacement: (match) => match.replace(/error\./g, '_error.') },
      // Pattern: Cannot find name 'error'. Did you mean '_error'?
      { pattern: /(\w+)\.message\s+\|\|\s+\"[^"]*\"\s*\}\);?\s*\}\s*catch\s*\(\s*_error\s*\)/g, replacement: (match) => {
        // This is complex - need to find the error reference in the try block
        return match;
      }}
    ];
    
    // Simple fixes for obvious broken references
    const simpleFixes = [
      // When we have } catch (_error) but later use (error as Error)
      { pattern: /\(error as Error\)\.message/g, replacement: '(_error as Error).message' },
      { pattern: /\(error as Error\)\.toString/g, replacement: '(_error as Error).toString' },
      { pattern: /error\.message/g, replacement: '_error.message' },
      { pattern: /error\.toString/g, replacement: '_error.toString' },
      { pattern: /error\.stack/g, replacement: '_error.stack' },
      // Fix shorthand property issues
      { pattern: /{ error }/g, replacement: '{ error: _error }' },
    ];
    
    // Apply simple fixes
    simpleFixes.forEach(({ pattern, replacement }) => {
      // Only apply if we have _error in catch block
      if (content.includes('catch (_error)') || content.includes('catch(_error)')) {
        const newContent = content.replace(pattern, replacement);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    });
    
    // Fix specific patterns where error variable is undefined
    const fixes = [
      // Fix: Cannot find name 'error' - replace with _error
      { pattern: /description:\s*error\s+instanceof\s+Error\s*\?\s*error\.message/g, replacement: 'description: _error instanceof Error ? _error.message' },
      { pattern: /description:\s*\(error\s+as\s+Error\)\.message/g, replacement: 'description: (_error as Error).message' },
      // Fix error shorthand in object literals
      { pattern: /,\s*error\s*}/g, replacement: ', error: _error }' },
      { pattern: /{\s*error\s*}/g, replacement: '{ error: _error }' },
    ];
    
    fixes.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed broken variables in ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
  
  return false;
}

function main() {
  console.log('Fixing broken variable references...');
  
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = getAllTsFiles(srcDir);
  
  let totalModified = 0;
  
  console.log(`Found ${tsFiles.length} TypeScript files to process`);
  
  // Process each file
  tsFiles.forEach(filePath => {
    if (fixBrokenVariables(filePath)) {
      totalModified++;
    }
  });
  
  console.log(`\nFixed broken variables in ${totalModified} files`);
  
  console.log('\nVariable fixes completed!');
  
  // Verify TypeScript compilation
  console.log('\nVerifying TypeScript compilation...');
  try {
    execSync('npm run typecheck', { stdio: 'pipe' });
    console.log('✅ TypeScript compilation successful');
  } catch (error) {
    console.log('⚠️  TypeScript compilation still has errors - may need manual review');
  }
}

if (require.main === module) {
  main();
}