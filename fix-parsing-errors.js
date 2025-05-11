#!/usr/bin/env node

/**
 * Script to fix parsing errors introduced by the entity escaping
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

// Function to fix parsing errors from entity escaping
function fixParsingErrors(filePath) {
  try {
    // Skip non-component files
    if (!filePath.includes('/components/') && !filePath.includes('/app/') && !filePath.includes('/hooks/')) {
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix incorrect entity replacements in JSX
    // These patterns match entities that were incorrectly placed in code
    const patterns = [
      { regex: /(\w+)&apos;(\w+)/g, replacement: "$1'$2" },
      { regex: /(\w+)&quot;(\w+)/g, replacement: '$1"$2' },
      { regex: /(\{[^}]*?)&apos;([^{]*?\})/g, replacement: "$1'$2" },
      { regex: /(\{[^}]*?)&quot;([^{]*?\})/g, replacement: '$1"$2' },
      { regex: /(=\s*)&quot;([^"]*?)&quot;/g, replacement: '$1"$2"' },
      { regex: /(=\s*)&apos;([^']*?)&apos;/g, replacement: "$1'$2'" },
      { regex: /import\s+\{\s*([^}]*?)&apos;([^}]*?)\}/g, replacement: "import { $1'$2}" },
      { regex: /import\s+\{\s*([^}]*?)&quot;([^}]*?)\}/g, replacement: 'import { $1"$2}' },
      { regex: /from\s+&apos;([^']*?)&apos;/g, replacement: "from '$1'" },
      { regex: /from\s+&quot;([^"]*?)&quot;/g, replacement: 'from "$1"' }
    ];
    
    for (const pattern of patterns) {
      const newContent = content.replace(pattern.regex, pattern.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
    
    // Fix CommitteeIcon import and usage
    if (filePath.includes('committee') && content.includes('CommitteeIcon')) {
      if (!content.includes('import { Users2 as CommitteeIcon }')) {
        const importStatement = `import { Users2 as CommitteeIcon } from "lucide-react";\n`;
        
        // Add import if it doesn't exist
        if (!content.includes(importStatement)) {
          // Find the last import statement
          const lastImportIndex = content.lastIndexOf('import');
          if (lastImportIndex !== -1) {
            const endOfImportIndex = content.indexOf('\n', lastImportIndex) + 1;
            content = content.slice(0, endOfImportIndex) + importStatement + content.slice(endOfImportIndex);
            modified = true;
            console.log(`Added CommitteeIcon import to ${filePath}`);
          }
        }
      }
    }
    
    // Fix CalendarIcon import and usage
    if ((filePath.includes('faculty/page.tsx') || filePath.includes('students/page.tsx')) && content.includes('CalendarIcon')) {
      if (!content.includes('import { Calendar as CalendarIcon }')) {
        const importStatement = `import { Calendar as CalendarIcon } from "lucide-react";\n`;
        
        // Add import if it doesn't exist
        if (!content.includes(importStatement)) {
          // Find the last import statement
          const lastImportIndex = content.lastIndexOf('import');
          if (lastImportIndex !== -1) {
            const endOfImportIndex = content.indexOf('\n', lastImportIndex) + 1;
            content = content.slice(0, endOfImportIndex) + importStatement + content.slice(endOfImportIndex);
            modified = true;
            console.log(`Added CalendarIcon import to ${filePath}`);
          }
        }
      }
    }
    
    // Fix AssessmentIcon import and usage
    if (filePath.includes('results/import/page.tsx') && content.includes('AssessmentIcon')) {
      if (!content.includes('import { ClipboardCheck as AssessmentIcon }')) {
        const importStatement = `import { ClipboardCheck as AssessmentIcon } from "lucide-react";\n`;
        
        // Add import if it doesn't exist
        if (!content.includes(importStatement)) {
          // Find the last import statement
          const lastImportIndex = content.lastIndexOf('import');
          if (lastImportIndex !== -1) {
            const endOfImportIndex = content.indexOf('\n', lastImportIndex) + 1;
            content = content.slice(0, endOfImportIndex) + importStatement + content.slice(endOfImportIndex);
            modified = true;
            console.log(`Added AssessmentIcon import to ${filePath}`);
          }
        }
      }
    }
    
    // Fix Button import and usage
    if (filePath.includes('materials/page.tsx') && content.includes('<Button')) {
      if (!content.includes('import { Button }')) {
        const importStatement = `import { Button } from "@/components/ui/button";\n`;
        
        // Add import if it doesn't exist
        if (!content.includes(importStatement)) {
          // Find the last import statement
          const lastImportIndex = content.lastIndexOf('import');
          if (lastImportIndex !== -1) {
            const endOfImportIndex = content.indexOf('\n', lastImportIndex) + 1;
            content = content.slice(0, endOfImportIndex) + importStatement + content.slice(endOfImportIndex);
            modified = true;
            console.log(`Added Button import to ${filePath}`);
          }
        }
      }
    }
    
    // Fix JSX attribute quotes
    const jsxAttributeRegex = /(\s+\w+)=&quot;([^"]*?)&quot;/g;
    const fixedJsxAttributes = content.replace(jsxAttributeRegex, '$1="$2"');
    if (fixedJsxAttributes !== content) {
      content = fixedJsxAttributes;
      modified = true;
    }
    
    // Fix JSX text content quotes
    const jsxTextRegex = />([^<]*?)&quot;([^<]*?)&quot;([^<]*?)</g;
    const fixedJsxText = content.replace(jsxTextRegex, '>$1"$2"$3<');
    if (fixedJsxText !== content) {
      content = fixedJsxText;
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed parsing errors in ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing parsing errors in ${filePath}:`, error);
    return false;
  }
}

// Function to add missing imports for icons
function addMissingImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check for specific files with missing imports
    if (filePath.includes('dashboard/committee/page.tsx')) {
      if (!content.includes('import { Users2 as CommitteeIcon }')) {
        // Add import for CommitteeIcon
        const importStatement = `import { Users2 as CommitteeIcon } from "lucide-react";\n`;
        
        // Find a good place to add the import
        const lastImportIndex = content.lastIndexOf('import');
        if (lastImportIndex !== -1) {
          const endOfImportIndex = content.indexOf('\n', lastImportIndex) + 1;
          content = content.slice(0, endOfImportIndex) + importStatement + content.slice(endOfImportIndex);
          modified = true;
          console.log(`Added CommitteeIcon import to ${filePath}`);
        }
      }
    }
    
    if (filePath.includes('admin/faculty/page.tsx') || filePath.includes('admin/students/page.tsx')) {
      if (!content.includes('import { Calendar as CalendarIcon }')) {
        // Add import for CalendarIcon
        const importStatement = `import { Calendar as CalendarIcon } from "lucide-react";\n`;
        
        // Find a good place to add the import
        const lastImportIndex = content.lastIndexOf('import');
        if (lastImportIndex !== -1) {
          const endOfImportIndex = content.indexOf('\n', lastImportIndex) + 1;
          content = content.slice(0, endOfImportIndex) + importStatement + content.slice(endOfImportIndex);
          modified = true;
          console.log(`Added CalendarIcon import to ${filePath}`);
        }
      }
    }
    
    if (filePath.includes('admin/results/import/page.tsx')) {
      if (!content.includes('import { ClipboardCheck as AssessmentIcon }')) {
        // Add import for AssessmentIcon
        const importStatement = `import { ClipboardCheck as AssessmentIcon } from "lucide-react";\n`;
        
        // Find a good place to add the import
        const lastImportIndex = content.lastIndexOf('import');
        if (lastImportIndex !== -1) {
          const endOfImportIndex = content.indexOf('\n', lastImportIndex) + 1;
          content = content.slice(0, endOfImportIndex) + importStatement + content.slice(endOfImportIndex);
          modified = true;
          console.log(`Added AssessmentIcon import to ${filePath}`);
        }
      }
    }
    
    if (filePath.includes('student/materials/page.tsx')) {
      if (!content.includes('import { Button }')) {
        // Add import for Button
        const importStatement = `import { Button } from "@/components/ui/button";\n`;
        
        // Find a good place to add the import
        const lastImportIndex = content.lastIndexOf('import');
        if (lastImportIndex !== -1) {
          const endOfImportIndex = content.indexOf('\n', lastImportIndex) + 1;
          content = content.slice(0, endOfImportIndex) + importStatement + content.slice(endOfImportIndex);
          modified = true;
          console.log(`Added Button import to ${filePath}`);
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error adding missing imports in ${filePath}:`, error);
    return false;
  }
}

// Main function
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = findTsFiles(srcDir);
  
  console.log(`Found ${tsFiles.length} TypeScript files to process`);
  
  let fixedFiles = 0;
  
  // First, add missing imports
  for (const file of tsFiles) {
    if (addMissingImports(file)) {
      fixedFiles++;
    }
  }
  
  // Then fix parsing errors
  for (const file of tsFiles) {
    if (fixParsingErrors(file)) {
      fixedFiles++;
    }
  }
  
  console.log(`Fixed parsing errors in ${fixedFiles} files`);
  console.log('Parsing error fixing process completed!');
}

main();
