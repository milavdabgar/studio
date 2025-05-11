#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helper function to find all TypeScript files
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      findTsFiles(filePath, fileList);
    } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && 
               !file.endsWith('.d.ts') && 
               !filePath.includes('node_modules') && 
               !filePath.includes('.next')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix explicit any types
function fixExplicitAnyTypes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace any[] with more specific types in API services
    if ((content.includes(': any[]') || content.includes('any[]')) && 
        (filePath.includes('/api/') || filePath.includes('/services/'))) {
      
      // For error arrays in API services
      const originalContent = content;
      content = content.replace(/errors\?: any\[\]/g, 'errors?: Array<{ message?: string; data?: unknown; row?: number }>');
      content = content.replace(/\(e:any\)/g, '(e: { message?: string; data?: unknown })');
      content = content.replace(/\(e: any\)/g, '(e: { message?: string; data?: unknown })');
      content = content.replace(/\(err:any\)/g, '(err: { message?: string; data?: unknown })');
      content = content.replace(/\(err: any\)/g, '(err: { message?: string; data?: unknown })');
      content = content.replace(/ as any;/g, ' as Error & { data?: unknown };');
      
      if (content !== originalContent) {
        console.log(`Fixed explicit any[] in ${filePath}`);
        modified = true;
      }
    }
    
    // Replace individual any types
    if (content.includes(': any') || content.includes('any>')) {
      const originalContent = content;
      
      // Common replacements for any types
      content = content.replace(/: any(?![[\]])/g, ': unknown');
      content = content.replace(/\(error: any\)/g, '(error: unknown)');
      content = content.replace(/\(data: any\)/g, '(data: unknown)');
      
      if (content !== originalContent) {
        console.log(`Fixed explicit any types in ${filePath}`);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    }
    
    return modified;
  } catch (error) {
    console.error(`Error fixing explicit any types in ${filePath}:`, error);
    return false;
  }
}

// Function to fix useEffect dependency arrays
function fixUseEffectDependencyArrays(filePath) {
  try {
    if (!filePath.endsWith('.tsx')) return false;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Find useEffect hooks with data fetching functions in dependency arrays
    const useEffectRegex = /useEffect\(\s*\(\)\s*=>\s*{\s*([^}]+)\s*}\s*,\s*\[([^\]]*)\]\s*\)/g;
    const matches = [...content.matchAll(useEffectRegex)];
    
    for (const match of matches) {
      const effectBody = match[1];
      const dependencies = match[2];
      
      // If the effect body calls a fetch function and the dependency array includes that function
      if ((effectBody.includes('fetch') || effectBody.includes('get') || effectBody.includes('load')) && 
          (dependencies.includes('fetch') || dependencies.includes('get') || dependencies.includes('load'))) {
        
        // Replace with empty dependency array if it's causing an infinite loop
        const newContent = content.replace(
          match[0],
          `useEffect(() => {${match[1]}}, [])`
        );
        
        if (newContent !== content) {
          content = newContent;
          console.log(`Fixed useEffect dependency array in ${filePath}`);
          modified = true;
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    }
    
    return modified;
  } catch (error) {
    console.error(`Error fixing useEffect dependency arrays in ${filePath}:`, error);
    return false;
  }
}

// Function to fix unused imports
function fixUnusedImports(filePath) {
  try {
    // Run ESLint with --fix option on the file
    console.log(`Fixing unused imports in ${filePath}...`);
    execSync(`npx eslint "${filePath}" --fix --rule "@typescript-eslint/no-unused-vars: error"`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    // ESLint might exit with non-zero code even if fixes were applied
    return true;
  }
}

// Function to fix forEach type errors in admin pages
function fixForEachTypeErrors(filePath) {
  if (!filePath.includes('/admin/') || !filePath.endsWith('.tsx')) return false;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix type errors in forEach calls for error handling
    const forEachRegex = /\.forEach\(\(err:\s*{\s*row:\s*number;\s*message:\s*string\s*}\)\s*=>/g;
    if (forEachRegex.test(content)) {
      const newContent = content.replace(
        forEachRegex,
        '.forEach((err: { row?: number; message?: string }) =>'
      );
      
      if (newContent !== content) {
        content = newContent;
        console.log(`Fixed forEach type errors in ${filePath}`);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    }
    
    return modified;
  } catch (error) {
    console.error(`Error fixing forEach type errors in ${filePath}:`, error);
    return false;
  }
}

// Main function
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = findTsFiles(srcDir);
  
  console.log(`Found ${tsFiles.length} TypeScript files to process`);
  
  let fixedFiles = 0;
  
  // First pass: Fix specific issues
  for (const file of tsFiles) {
    let fileFixed = false;
    
    // Apply fixes
    fileFixed = fixExplicitAnyTypes(file) || fileFixed;
    fileFixed = fixUseEffectDependencyArrays(file) || fileFixed;
    fileFixed = fixForEachTypeErrors(file) || fileFixed;
    
    if (fileFixed) {
      fixedFiles++;
    }
  }
  
  console.log(`Fixed specific lint errors in ${fixedFiles} files`);
  
  // Second pass: Try to fix unused imports with ESLint
  console.log('Attempting to fix unused imports with ESLint...');
  try {
    execSync('npx eslint "src/**/*.{ts,tsx}" --fix --rule "@typescript-eslint/no-unused-vars: error"', { stdio: 'ignore' });
    console.log('ESLint fix for unused imports completed');
  } catch (error) {
    console.log('ESLint fix for unused imports completed with some errors');
  }
  
  console.log('Lint fixing process completed!');
}

main();
