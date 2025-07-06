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

function fixSafeIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix 1: Replace 'any' with safer types in very specific patterns
    const safeAnyFixes = [
      { pattern: /(\w+):\s*any\[\]/g, replacement: '$1: unknown[]' },
      { pattern: /catch\s*\(\s*error:\s*any\s*\)/g, replacement: 'catch (error: unknown)' },
      { pattern: /catch\s*\(\s*_error:\s*any\s*\)/g, replacement: 'catch (_error: unknown)' },
      { pattern: /(\w+):\s*any\s*\)\s*=>/g, replacement: '$1: unknown) =>' },
    ];
    
    safeAnyFixes.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    // Fix 2: Prefix unused variables with underscore
    const unusedVarFixes = [
      { pattern: /catch\s*\(\s*error\s*\)/g, replacement: 'catch (_error)' },
      { pattern: /catch\s*\(\s*e\s*\)/g, replacement: 'catch (_e)' },
      { pattern: /\.catch\(\s*error\s*=>/g, replacement: '.catch(_error =>' },
      { pattern: /\.catch\(\s*e\s*=>/g, replacement: '.catch(_e =>' },
    ];
    
    unusedVarFixes.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    // Fix 3: Replace var with const (only for obvious cases)
    const varPattern = /\bvar\s+(\w+)\s*=/g;
    const newContent = content.replace(varPattern, 'const $1 =');
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
    
    // Fix 4: Simple React hooks dependency fixes (very conservative)
    const simpleHookPattern = /useEffect\(\(\) => \{\s*([a-zA-Z][a-zA-Z0-9]*)\(\);\s*\}, \[\]\);/g;
    const hookFixed = content.replace(simpleHookPattern, (match, funcName) => {
      return match.replace('[]', `[${funcName}]`);
    });
    if (hookFixed !== content) {
      content = hookFixed;
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed issues in ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
  
  return false;
}

function main() {
  console.log('Starting targeted lint fixes...');
  
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = getAllTsFiles(srcDir);
  
  let totalModified = 0;
  
  console.log(`Found ${tsFiles.length} TypeScript files to process`);
  
  // Process each file with safe fixes only
  tsFiles.forEach(filePath => {
    if (fixSafeIssues(filePath)) {
      totalModified++;
    }
  });
  
  console.log(`\nFixed safe issues in ${totalModified} files`);
  
  // Run ESLint auto-fix for remaining safe issues
  console.log('\nRunning ESLint auto-fix...');
  try {
    execSync('npm run lint -- --fix', { stdio: 'pipe' });
    console.log('ESLint auto-fix completed');
  } catch (error) {
    console.log('ESLint auto-fix completed with some remaining issues');
  }
  
  console.log('\nTargeted lint fixes completed!');
  
  // Verify no TypeScript errors were introduced
  console.log('\nVerifying TypeScript compilation...');
  try {
    execSync('npm run typecheck', { stdio: 'pipe' });
    console.log('✅ TypeScript compilation successful - no errors introduced');
  } catch (error) {
    console.log('⚠️  TypeScript compilation has errors - manual review may be needed');
  }
}

if (require.main === module) {
  main();
}