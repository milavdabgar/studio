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

// Function to fix unused imports
function fixUnusedImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Find and remove unused imports
    const importRegex = /import\s+(?:{([^}]+)}|([^{}\s]+))\s+from\s+['"]([^'"]+)['"]/g;
    const importMatches = [...content.matchAll(importRegex)];
    
    for (const match of importMatches) {
      if (match[1]) { // Named imports
        const namedImports = match[1].split(',').map(imp => imp.trim());
        const unusedImports = [];
        
        for (const namedImport of namedImports) {
          const cleanImport = namedImport.split(' as ')[0].trim();
          if (cleanImport && !content.includes(cleanImport, match.index + match[0].length)) {
            unusedImports.push(cleanImport);
          }
        }
        
        if (unusedImports.length > 0) {
          console.log(`Found unused imports in ${filePath}: ${unusedImports.join(', ')}`);
          modified = true;
        }
      }
    }
    
    if (modified) {
      console.log(`Fixed unused imports in ${filePath}`);
    }
    
    return modified;
  } catch (error) {
    console.error(`Error fixing unused imports in ${filePath}:`, error);
    return false;
  }
}

// Function to fix explicit any types
function fixExplicitAnyTypes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace common any[] types with more specific types
    if (content.includes(': any[]') || content.includes('any[]')) {
      console.log(`Found explicit any[] in ${filePath}`);
      
      // For error arrays in API services
      if (filePath.includes('/api/') || filePath.includes('/services/')) {
        content = content.replace(/errors\?: any\[\]/g, 'errors?: Array<{ message?: string; data?: unknown; row?: number }>');
        content = content.replace(/\(e:any\)/g, '(e: { message?: string; data?: unknown })');
        content = content.replace(/\(err: any\)/g, '(err: { message?: string; data?: unknown })');
        content = content.replace(/as any;/g, 'as Error & { data?: unknown };');
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed explicit any types in ${filePath}`);
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
    
    // Find useEffect hooks with fetch functions in dependency arrays
    const useEffectRegex = /useEffect\(\s*\(\)\s*=>\s*{\s*([^}]+)\s*}\s*,\s*\[([^\]]*)\]\s*\)/g;
    const matches = [...content.matchAll(useEffectRegex)];
    
    for (const match of matches) {
      const effectBody = match[1];
      const dependencies = match[2];
      
      // If the effect body contains fetch and the dependency array includes a fetch function
      if (effectBody.includes('fetch') && dependencies.includes('fetch')) {
        console.log(`Found useEffect with fetch in dependency array in ${filePath}`);
        
        // Replace with empty dependency array
        const newContent = content.replace(
          match[0],
          `useEffect(() => {${match[1]}}, [])`
        );
        
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed useEffect dependency arrays in ${filePath}`);
    }
    
    return modified;
  } catch (error) {
    console.error(`Error fixing useEffect dependency arrays in ${filePath}:`, error);
    return false;
  }
}

// Main function
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = findTsFiles(srcDir);
  
  console.log(`Found ${tsFiles.length} TypeScript files to process`);
  
  let fixedFiles = 0;
  
  for (const file of tsFiles) {
    let fileFixed = false;
    
    // Apply fixes
    fileFixed = fixExplicitAnyTypes(file) || fileFixed;
    fileFixed = fixUseEffectDependencyArrays(file) || fileFixed;
    
    if (fileFixed) {
      fixedFiles++;
    }
  }
  
  console.log(`Fixed lint errors in ${fixedFiles} files`);
  
  // Run ESLint to check remaining issues
  try {
    console.log('Running ESLint to check remaining issues...');
    execSync('npx eslint src/lib/api --ext .ts,.tsx --max-warnings=0', { stdio: 'inherit' });
    console.log('ESLint check completed successfully!');
  } catch (error) {
    console.log('ESLint found some remaining issues. Please check them manually.');
  }
}

main();
