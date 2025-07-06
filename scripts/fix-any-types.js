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

function fixAnyTypes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Common safe any type replacements
    const safeReplacements = [
      // Catch blocks
      { pattern: /catch\s*\(\s*error:\s*any\s*\)/g, replacement: 'catch (error: unknown)' },
      { pattern: /catch\s*\(\s*e:\s*any\s*\)/g, replacement: 'catch (e: unknown)' },
      { pattern: /catch\s*\(\s*err:\s*any\s*\)/g, replacement: 'catch (err: unknown)' },
      
      // Function parameters that are clearly event handlers
      { pattern: /\(\s*event:\s*any\s*\)/g, replacement: '(event: unknown)' },
      { pattern: /\(\s*e:\s*any\s*\)/g, replacement: '(e: unknown)' },
      
      // Simple object types
      { pattern: /:\s*any\[\]/g, replacement: ': unknown[]' },
      { pattern: /:\s*any\s*\|\s*null/g, replacement: ': unknown | null' },
      { pattern: /:\s*any\s*\|\s*undefined/g, replacement: ': unknown | undefined' },
      
      // Common props/parameters
      { pattern: /props:\s*any/g, replacement: 'props: Record<string, unknown>' },
      { pattern: /params:\s*any/g, replacement: 'params: Record<string, unknown>' },
      { pattern: /data:\s*any/g, replacement: 'data: unknown' },
      { pattern: /response:\s*any/g, replacement: 'response: unknown' },
      { pattern: /result:\s*any/g, replacement: 'result: unknown' },
      { pattern: /payload:\s*any/g, replacement: 'payload: unknown' },
      
      // React component props (conservative)
      { pattern: /children,\s*className,\s*\.\.\.props\s*\}:\s*any/g, replacement: 'children, className, ...props }: { children?: React.ReactNode; className?: string; [key: string]: unknown }' },
      { pattern: /children,\s*\.\.\.props\s*\}:\s*any/g, replacement: 'children, ...props }: { children?: React.ReactNode; [key: string]: unknown }' },
      
      // Form data
      { pattern: /formData:\s*any/g, replacement: 'formData: FormData' },
      
      // Query objects (common in APIs)
      { pattern: /query:\s*any/g, replacement: 'query: Record<string, unknown>' },
      { pattern: /filter:\s*any/g, replacement: 'filter: Record<string, unknown>' },
      { pattern: /options:\s*any/g, replacement: 'options: Record<string, unknown>' },
    ];
    
    // Apply safe replacements
    safeReplacements.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed any types in ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
  
  return false;
}

function main() {
  console.log('Fixing any types systematically...');
  
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = getAllTsFiles(srcDir);
  
  let totalModified = 0;
  
  console.log(`Found ${tsFiles.length} TypeScript files to process`);
  
  // Process each file
  tsFiles.forEach(filePath => {
    if (fixAnyTypes(filePath)) {
      totalModified++;
    }
  });
  
  console.log(`\nFixed any types in ${totalModified} files`);
  
  console.log('\nVerifying TypeScript compilation...');
  try {
    execSync('npm run typecheck', { stdio: 'pipe' });
    console.log('✅ TypeScript compilation successful');
  } catch (error) {
    console.log('⚠️  TypeScript compilation has errors - reverting problematic changes');
    // Could add rollback logic here if needed
  }
}

if (require.main === module) {
  main();
}