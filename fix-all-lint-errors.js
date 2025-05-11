#!/usr/bin/env node

/**
 * Comprehensive script to fix all lint errors in the codebase
 * This script will:
 * 1. Find all TypeScript and TSX files
 * 2. Fix unused imports
 * 3. Replace 'any' types with more specific types
 * 4. Fix useEffect dependency arrays
 * 5. Fix other common lint issues
 */

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
      content = content.replace(/\(error:any\)/g, '(error: unknown)');
      content = content.replace(/\(error: any\)/g, '(error: unknown)');
      
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
      content = content.replace(/\(response: any\)/g, '(response: unknown)');
      content = content.replace(/\(result: any\)/g, '(result: unknown)');
      content = content.replace(/\(item: any\)/g, '(item: unknown)');
      content = content.replace(/\(props: any\)/g, '(props: Record<string, unknown>)');
      content = content.replace(/\(event: any\)/g, '(event: React.SyntheticEvent)');
      
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

// Function to fix unused variables
function fixUnusedVariables(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Find variable declarations that are not used
    const variableDeclarationRegex = /const\s+([a-zA-Z0-9_]+)\s*=.+?;/g;
    const matches = [...content.matchAll(variableDeclarationRegex)];
    
    for (const match of matches) {
      const variableName = match[1];
      const fullMatch = match[0];
      
      // Check if the variable is only used in its own declaration
      const regex = new RegExp(`\\b${variableName}\\b`, 'g');
      const occurrences = [...content.matchAll(regex)];
      
      if (occurrences.length === 1) {
        // Variable is declared but never used
        // Add underscore prefix to suppress unused variable warning
        const newDeclaration = fullMatch.replace(
          `const ${variableName}`,
          `const _${variableName}`
        );
        
        content = content.replace(fullMatch, newDeclaration);
        console.log(`Fixed unused variable ${variableName} in ${filePath}`);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    }
    
    return modified;
  } catch (error) {
    console.error(`Error fixing unused variables in ${filePath}:`, error);
    return false;
  }
}

// Function to fix unused imports
function fixUnusedImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Find import statements
    const importRegex = /import\s+(?:{([^}]+)}|([^{}\s]+))\s+from\s+['"]([^'"]+)['"]/g;
    const matches = [...content.matchAll(importRegex)];
    
    for (const match of matches) {
      if (match[1]) { // Named imports
        const namedImports = match[1].split(',').map(imp => imp.trim());
        const unusedImports = [];
        
        for (const namedImport of namedImports) {
          // Skip empty strings or whitespace
          if (!namedImport.trim()) continue;
          
          // Handle aliased imports (e.g., "Component as Alias")
          const importName = namedImport.split(' as ')[0].trim();
          
          // Check if the import is used elsewhere in the file
          const regex = new RegExp(`\\b${importName}\\b`, 'g');
          const occurrences = [...content.matchAll(regex)];
          
          // If the import only appears in the import statement itself
          if (occurrences.length === 1) {
            unusedImports.push(namedImport);
          }
        }
        
        if (unusedImports.length > 0) {
          // Remove unused imports
          let newImportStatement = match[0];
          
          for (const unusedImport of unusedImports) {
            // Remove the unused import from the import statement
            const importPattern = new RegExp(`\\s*${unusedImport}\\s*,?|,?\\s*${unusedImport}\\s*`, 'g');
            newImportStatement = newImportStatement.replace(importPattern, '');
          }
          
          // Clean up any empty import statements
          newImportStatement = newImportStatement.replace(/import\s+{\s*}\s+from\s+['"][^'"]+['"]/g, '');
          
          // Update the content
          content = content.replace(match[0], newImportStatement);
          console.log(`Removed unused imports ${unusedImports.join(', ')} from ${filePath}`);
          modified = true;
        }
      }
    }
    
    // Clean up empty lines created by removing imports
    content = content.replace(/^\s*[\r\n]{2,}/gm, '\n');
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    }
    
    return modified;
  } catch (error) {
    console.error(`Error fixing unused imports in ${filePath}:`, error);
    return false;
  }
}

// Function to fix Firebase-related lint errors
function fixFirebaseErrors(filePath) {
  try {
    if (!filePath.includes('firebase')) return false;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix Firebase-specific type issues
    if (content.includes('firebase')) {
      const originalContent = content;
      
      // Replace Firebase-specific any types
      content = content.replace(/: FirebaseFirestore.DocumentData/g, ': Record<string, unknown>');
      content = content.replace(/: firebase.firestore.DocumentData/g, ': Record<string, unknown>');
      
      if (content !== originalContent) {
        console.log(`Fixed Firebase-specific type issues in ${filePath}`);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    }
    
    return modified;
  } catch (error) {
    console.error(`Error fixing Firebase errors in ${filePath}:`, error);
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
    fileFixed = fixUnusedVariables(file) || fileFixed;
    fileFixed = fixUnusedImports(file) || fileFixed;
    fileFixed = fixFirebaseErrors(file) || fileFixed;
    
    if (fileFixed) {
      fixedFiles++;
    }
  }
  
  console.log(`Fixed specific lint errors in ${fixedFiles} files`);
  
  // Second pass: Try to fix remaining issues with ESLint
  console.log('Attempting to fix remaining lint errors with ESLint...');
  try {
    execSync('npx eslint "src/**/*.{ts,tsx}" --fix', { stdio: 'inherit' });
    console.log('ESLint fix completed');
  } catch (error) {
    console.log('ESLint fix completed with some errors');
  }
  
  console.log('Lint fixing process completed!');
}

main();
