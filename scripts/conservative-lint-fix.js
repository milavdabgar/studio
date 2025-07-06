#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Safe unused imports that can be removed
const SAFE_UNUSED_IMPORTS = [
  // Safe icon imports
  'Download', 'UploadCloud', 'FileSpreadsheet', 'Search', 'Filter', 'ArrowUpDown',
  'ChevronsLeft', 'ChevronLeft', 'ChevronRight', 'ChevronsRight', 'ExternalLink',
  'PlusCircle', 'Edit', 'Trash2', 'Info', 'CheckCircle', 'AlertTriangle',
  'Clock', 'Calendar', 'MapPin', 'Phone', 'Mail', 'TrendingUp', 'TrendingDown',
  'BarChart3', 'Award', 'Target', 'Zap', 'Globe', 'ArrowRight', 'DollarSign',
  'Star', 'Briefcase', 'GraduationCap', 'Activity', 'ListChecks', 'BookOpenCheck',
  'FilePieChart', 'Upload', 'Paperclip', 'CheckSquare', 'Bell', 'NotebookPen',
  'Edit2', 'Home', 'Rocket', 'Lightbulb', 'University', 'UsersRound', 'CalendarDays',
  'FileText', 'ResultIcon', 'BookUser', 'CalendarIcon', 'Plane', 'BotMessageSquare',
  'UserIcon', 'Landmark', 'Loader2', 'Users', 'BookOpen',
  
  // Safe UI component imports
  'CardFooter', 'CardDescription', 'CardHeader', 'CardTitle', 'DialogDescription',
  'DialogTrigger', 'DialogClose', 'DialogFooter', 'Button', 'Input', 'Label',
  'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue',
  'Table', 'TableBody', 'TableCell', 'TableHead', 'TableHeader', 'TableRow',
  'Textarea', 'Popover', 'PopoverContent', 'PopoverTrigger', 'Calendar',
  'Tooltip', 'TooltipContent', 'TooltipProvider', 'TooltipTrigger', 'Checkbox',
  'Badge', 'Alert', 'AlertDescription', 'Switch',
  
  // Safe React/utility imports
  'useState', 'useEffect', 'useMemo', 'FormEvent', 'ChangeEvent',
  'format', 'parseISO', 'isValid', 'setHours', 'setMinutes', 'setSeconds', 
  'setMilliseconds', 'eachDayOfInterval'
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

function removeUnusedImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;
    
    // Only remove imports that are clearly safe and unused
    const importRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"][^'"]+['"];?\s*\n?/g;
    
    content = content.replace(importRegex, (match, imports) => {
      const importList = imports.split(',').map(imp => imp.trim());
      const usedImports = [];
      
      importList.forEach(imp => {
        const cleanImport = imp.trim();
        
        // Only remove if it's in our safe list AND not used in the file
        if (SAFE_UNUSED_IMPORTS.includes(cleanImport)) {
          // Check if used anywhere after the import statement
          const afterImport = content.split(match)[1] || '';
          const isUsed = afterImport.includes(cleanImport);
          
          if (!isUsed) {
            modified = true;
            console.log(`Removing unused import: ${cleanImport} from ${filePath}`);
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
    
    // Remove some common unused default imports
    const unusedDefaults = ['Link', 'Image'];
    unusedDefaults.forEach(importName => {
      const pattern = new RegExp(`import\\s+${importName}\\s+from\\s+['"][^'"]+['"];?\\s*\\n?`, 'g');
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const afterMatch = content.split(match)[1] || '';
          if (!afterMatch.includes(importName)) {
            content = content.replace(match, '');
            modified = true;
            console.log(`Removing unused default import: ${importName} from ${filePath}`);
          }
        });
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
  
  return false;
}

function fixUnescapedEntities(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Only fix obvious unescaped entities in JSX
    const fixes = [
      { pattern: />(.*)'(.*)</g, replacement: '>$1&apos;$2<' },
      { pattern: />(.*)"(.*)</g, replacement: '>$1&quot;$2<' }
    ];
    
    fixes.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed unescaped entities in ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`Error fixing entities in ${filePath}:`, error.message);
  }
  
  return false;
}

function main() {
  console.log('Starting conservative lint fixes...');
  
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = getAllTsFiles(srcDir);
  
  let totalModified = 0;
  
  console.log(`Found ${tsFiles.length} TypeScript files to process`);
  
  // Process each file conservatively
  tsFiles.forEach(filePath => {
    let fileModified = false;
    
    // Remove unused imports
    if (removeUnusedImports(filePath)) {
      fileModified = true;
    }
    
    // Fix unescaped entities
    if (fixUnescapedEntities(filePath)) {
      fileModified = true;
    }
    
    if (fileModified) {
      totalModified++;
    }
  });
  
  console.log(`\nFixed ${totalModified} files`);
  
  // Run ESLint auto-fix
  console.log('\nRunning ESLint auto-fix...');
  try {
    execSync('npm run lint -- --fix', { stdio: 'pipe' });
    console.log('ESLint auto-fix completed');
  } catch (error) {
    console.log('ESLint auto-fix completed with some remaining issues');
  }
  
  console.log('\nConservative lint fixes completed!');
}

if (require.main === module) {
  main();
}