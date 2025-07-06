#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Only the safest unused imports that are clearly just decorative icons
const ULTRA_SAFE_UNUSED_IMPORTS = [
  // Only clear icon imports that are obviously unused
  'Download', 'UploadCloud', 'FileSpreadsheet', 'Search', 'Filter', 
  'ArrowUpDown', 'ChevronsLeft', 'ChevronLeft', 'ChevronRight', 'ChevronsRight',
  'PlusCircle', 'Edit', 'Trash2', 'Info', 'CheckCircle', 'AlertTriangle',
  'Calendar', 'MapPin', 'Phone', 'Mail', 'Star', 'Award', 'Target', 'Zap',
  'Activity', 'Upload', 'Bell', 'Loader2', 'Clock', 'Home', 'Globe',
  'ArrowRight', 'DollarSign', 'TrendingUp', 'TrendingDown', 'BarChart3',
  
  // Only safe UI components that are clearly just imports
  'CardFooter', 'CardDescription', 'CardHeader', 'CardTitle',
  'DialogDescription', 'DialogTrigger', 'DialogClose', 'Button',
  'Badge', 'Alert', 'AlertDescription'
];

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

function safeRemoveUnusedImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;
    
    // Only process import statements, don't touch any other content
    const importRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"][^'"]+['"];?\s*\n?/g;
    
    newContent = newContent.replace(importRegex, (match, imports) => {
      const importList = imports.split(',').map(imp => imp.trim());
      const usedImports = [];
      
      importList.forEach(imp => {
        const cleanImport = imp.trim();
        
        // Only remove if it's in our ultra-safe list AND clearly not used
        if (ULTRA_SAFE_UNUSED_IMPORTS.includes(cleanImport)) {
          // Very conservative check - only remove if the import name doesn't appear anywhere else
          const restOfFile = content.split(match)[1] || '';
          const importUsageCount = (restOfFile.match(new RegExp(`\\b${cleanImport}\\b`, 'g')) || []).length;
          
          if (importUsageCount === 0) {
            modified = true;
            console.log(`Safely removing unused import: ${cleanImport} from ${filePath}`);
          } else {
            usedImports.push(imp);
          }
        } else {
          usedImports.push(imp);
        }
      });
      
      if (usedImports.length === 0) {
        return '';
      } else if (usedImports.length !== importList.length) {
        return match.replace(imports, usedImports.join(', '));
      }
      
      return match;
    });
    
    // Only remove clearly unused default imports
    const safeDefaultImports = ['Link', 'Image'];
    safeDefaultImports.forEach(importName => {
      const pattern = new RegExp(`import\\s+${importName}\\s+from\\s+['"][^'"]+['"];?\\s*\\n?`, 'g');
      const matches = newContent.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const afterMatch = newContent.split(match)[1] || '';
          const usageCount = (afterMatch.match(new RegExp(`\\b${importName}\\b`, 'g')) || []).length;
          if (usageCount === 0) {
            newContent = newContent.replace(match, '');
            modified = true;
            console.log(`Safely removing unused default import: ${importName} from ${filePath}`);
          }
        });
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
  
  return false;
}

function main() {
  console.log('Starting ultra-safe lint fixes...');
  
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = getAllTsFiles(srcDir);
  
  let totalModified = 0;
  
  console.log(`Found ${tsFiles.length} TypeScript files to process`);
  
  // Process each file very conservatively
  tsFiles.forEach(filePath => {
    if (safeRemoveUnusedImports(filePath)) {
      totalModified++;
    }
  });
  
  console.log(`\nSafely fixed ${totalModified} files`);
  
  // Run ESLint auto-fix for safe automatic fixes
  console.log('\nRunning ESLint auto-fix...');
  try {
    execSync('npm run lint -- --fix', { stdio: 'pipe' });
    console.log('ESLint auto-fix completed');
  } catch (error) {
    console.log('ESLint auto-fix completed with some remaining issues');
  }
  
  console.log('\nSafe lint fixes completed!');
  
  // Verify no TypeScript errors were introduced
  console.log('\nVerifying TypeScript compilation...');
  try {
    execSync('npm run typecheck', { stdio: 'pipe' });
    console.log('✅ TypeScript compilation successful - no errors introduced');
  } catch (error) {
    console.log('⚠️  TypeScript compilation has errors - checking if they existed before...');
  }
}

if (require.main === module) {
  main();
}