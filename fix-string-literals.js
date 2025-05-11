#!/usr/bin/env node

/**
 * Script to fix unterminated string literals in TSX files
 */

const fs = require('fs');
const path = require('path');

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

// Function to fix unterminated string literals
function fixUnterminatedStringLiterals(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Find lines with potential unterminated string literals
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Count occurrences of single and double quotes
      const singleQuotes = (line.match(/'/g) || []).length;
      const doubleQuotes = (line.match(/"/g) || []).length;
      
      // Check for odd number of quotes (potential unterminated string)
      if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) {
        // Replace &quot; and &apos; with actual quotes
        let newLine = line.replace(/&quot;/g, '"').replace(/&apos;/g, "'");
        
        // Fix JSX attributes with quotes
        newLine = newLine.replace(/=(['"])(.*?)(['"])/g, '=$1$2$3');
        
        // If still has odd quotes, try to fix by adding missing quote
        const newSingleQuotes = (newLine.match(/'/g) || []).length;
        const newDoubleQuotes = (newLine.match(/"/g) || []).length;
        
        if (newSingleQuotes % 2 !== 0) {
          newLine = newLine + "'";
        }
        
        if (newDoubleQuotes % 2 !== 0) {
          newLine = newLine + '"';
        }
        
        if (newLine !== line) {
          lines[i] = newLine;
          modified = true;
          console.log(`Fixed unterminated string literal on line ${i+1} in ${filePath}`);
        }
      }
    }
    
    // Fix specific syntax errors
    for (let i = 0; i < lines.length; i++) {
      // Fix missing semicolons after import statements
      if (lines[i].includes('import') && !lines[i].endsWith(';') && !lines[i].endsWith('}')) {
        lines[i] = lines[i] + ';';
        modified = true;
        console.log(`Added missing semicolon on line ${i+1} in ${filePath}`);
      }
      
      // Fix missing commas in object literals
      if (lines[i].match(/\w+\s*:\s*["'][^"']*["']\s*$/)) {
        const nextLine = i < lines.length - 1 ? lines[i+1] : '';
        if (nextLine.trim().match(/^\w+\s*:/)) {
          lines[i] = lines[i] + ',';
          modified = true;
          console.log(`Added missing comma on line ${i+1} in ${filePath}`);
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing unterminated string literals in ${filePath}:`, error);
    return false;
  }
}

// Function to manually fix specific files with known issues
function fixSpecificFiles(filePath) {
  // List of files with known parsing errors
  const specificFixes = [
    {
      path: 'src/app/dashboard/page.tsx',
      fix: (content) => {
        // Fix unterminated string literal
        return content.replace(/className="([^"]*)/g, 'className="$1"');
      }
    },
    {
      path: 'src/app/faculty/timetable/page.tsx',
      fix: (content) => {
        // Fix expression expected error
        return content.replace(/import\s+\{\s*([^}]*)\s*\}\s+from\s+["']([^"']*)/g, 'import { $1 } from "$2"');
      }
    },
    {
      path: 'src/components/ui/checkbox.tsx',
      fix: (content) => {
        // Fix expression expected error
        return content.replace(/import\s+\{\s*([^}]*)\s*\}\s+from\s+["']([^"']*)/g, 'import { $1 } from "$2"');
      }
    },
    {
      path: 'src/components/ui/tooltip.tsx',
      fix: (content) => {
        // Fix expression expected error
        return content.replace(/import\s+\{\s*([^}]*)\s*\}\s+from\s+["']([^"']*)/g, 'import { $1 } from "$2"');
      }
    },
    {
      path: 'src/app/login/page.tsx',
      fix: (content) => {
        // Fix missing semicolon
        return content.replace(/import\s+\{\s*([^}]*)\s*\}\s+from\s+["']([^"']*)["']/g, 'import { $1 } from "$2";');
      }
    },
    {
      path: 'src/app/student/assignments/page.tsx',
      fix: (content) => {
        // Fix missing semicolon
        return content.replace(/import\s+\{\s*([^}]*)\s*\}\s+from\s+["']([^"']*)["']/g, 'import { $1 } from "$2";');
      }
    },
    {
      path: 'src/app/student/materials/page.tsx',
      fix: (content) => {
        // Fix missing semicolon
        return content.replace(/import\s+\{\s*([^}]*)\s*\}\s+from\s+["']([^"']*)["']/g, 'import { $1 } from "$2";');
      }
    },
    {
      path: 'src/components/ui/separator.tsx',
      fix: (content) => {
        // Fix missing comma
        return content.replace(/(\w+)\s*:\s*["'][^"']*["']\s*\n\s*(\w+)\s*:/g, '$1: "$2",\n  $2:');
      }
    }
  ];
  
  // Check if this file is in our specific fixes list
  const relativeFilePath = filePath.replace(process.cwd() + '/', '');
  const specificFix = specificFixes.find(fix => relativeFilePath.endsWith(fix.path));
  
  if (specificFix) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fixedContent = specificFix.fix(content);
      
      if (fixedContent !== content) {
        fs.writeFileSync(filePath, fixedContent);
        console.log(`Applied specific fix to ${filePath}`);
        return true;
      }
    } catch (error) {
      console.error(`Error applying specific fix to ${filePath}:`, error);
    }
  }
  
  return false;
}

// Main function
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = findTsFiles(srcDir);
  
  console.log(`Found ${tsFiles.length} TypeScript files to process`);
  
  let fixedFiles = 0;
  
  // First apply specific fixes to known problematic files
  for (const file of tsFiles) {
    if (fixSpecificFiles(file)) {
      fixedFiles++;
    }
  }
  
  // Then apply general fixes for unterminated string literals
  for (const file of tsFiles) {
    if (fixUnterminatedStringLiterals(file)) {
      fixedFiles++;
    }
  }
  
  console.log(`Fixed string literal issues in ${fixedFiles} files`);
  console.log('String literal fixing process completed!');
}

main();
