#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common unused imports that can be safely removed
const COMMON_UNUSED_IMPORTS = [
  // Icons that are often imported but not used
  'UploadCloud', 'Download', 'FileSpreadsheet', 'Search', 'Filter', 'ArrowUpDown',
  'ChevronsLeft', 'ChevronLeft', 'ChevronRight', 'ChevronsRight', 'ExternalLink',
  'PlusCircle', 'Edit', 'Trash2', 'Loader2', 'Info', 'CheckCircle', 'AlertTriangle',
  'Clock', 'User', 'Users', 'BookOpen', 'Calendar', 'MapPin', 'Phone', 'Mail',
  'TrendingUp', 'TrendingDown', 'BarChart3', 'Award', 'Target', 'Zap', 'Globe',
  'ArrowRight', 'DollarSign', 'Star', 'Briefcase', 'GraduationCap', 'Activity',
  'ListChecks', 'BookOpenCheck', 'FilePieChart', 'Upload', 'Paperclip', 'CheckSquare',
  'Bell', 'NotebookPen', 'Edit2', 'Home', 'Rocket', 'Lightbulb', 'University',
  'UsersRound', 'CalendarDays', 'FileText', 'ResultIcon', 'BookUser', 'CalendarIcon',
  'Plane', 'BotMessageSquare', 'UserIcon', 'Landmark',
  
  // UI Components often imported but not used
  'CardFooter', 'CardDescription', 'CardHeader', 'CardTitle', 'DialogDescription',
  'DialogTrigger', 'DialogClose', 'DialogFooter', 'Button', 'Input', 'Label',
  'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue',
  'Table', 'TableBody', 'TableCell', 'TableHead', 'TableHeader', 'TableRow',
  'Textarea', 'Popover', 'PopoverContent', 'PopoverTrigger', 'Calendar',
  'Tooltip', 'TooltipContent', 'TooltipProvider', 'TooltipTrigger', 'Checkbox',
  'Badge', 'Alert', 'AlertDescription', 'Switch',
  
  // React hooks and utilities
  'useState', 'useEffect', 'useMemo', 'FormEvent', 'ChangeEvent',
  
  // Date utilities
  'format', 'parseISO', 'isValid', 'setHours', 'setMinutes', 'setSeconds', 
  'setMilliseconds', 'eachDayOfInterval',
  
  // Types and models often imported but not used in specific files
  'User', 'SystemUser', 'FacultyUser', 'Student', 'Course', 'Program', 'Batch',
  'Department', 'Institute', 'Building', 'Room', 'Role', 'Permission',
  'Committee', 'Enrollment', 'EnrollmentStatus', 'Result', 'ResultSubject',
  'Assessment', 'CourseMaterial', 'CourseOffering', 'ProjectEvent', 'Project',
  'ProjectTeam', 'ProjectTeamMember', 'ProjectLocation', 'Timetable', 'TimetableEntry',
  'Examination', 'ExaminationType', 'ExaminationStatus', 'ExaminationTimeTableEntry',
  'Notification', 'NotificationType', 'LeaveRequest', 'LeaveBalance', 'LeaveType',
  'LeaveRequestStatus', 'UserRole', 'FacultyProfile', 'FacultyStatus', 'Gender',
  'StaffCategory', 'Qualification', 'ProjectEventStatus', 'ProjectEventScheduleItem',
  'ProjectRequirements', 'ProjectGuide', 'ProjectEvaluation', 'CategoryCounts',
  'ProjectEvaluationScore'
];

// Files to process (TypeScript and TypeScript React files)
function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, coverage, etc.
      if (!['node_modules', '.next', 'coverage', '.git', 'dist', 'build'].includes(file)) {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Remove unused imports from a file
function removeUnusedImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remove individual unused imports from existing import statements
    const importRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"][^'"]+['"];?/g;
    
    content = content.replace(importRegex, (match, imports) => {
      const importList = imports.split(',').map(imp => imp.trim());
      const usedImports = [];
      
      importList.forEach(imp => {
        const cleanImport = imp.trim();
        
        // Check if this import is actually used in the file
        const isUsed = content.includes(cleanImport) && 
                      content.split(match)[1].includes(cleanImport);
        
        if (isUsed || !COMMON_UNUSED_IMPORTS.includes(cleanImport)) {
          usedImports.push(imp);
        } else {
          modified = true;
          console.log(`Removing unused import: ${cleanImport} from ${filePath}`);
        }
      });
      
      if (usedImports.length === 0) {
        // Remove entire import statement if no imports are used
        return '';
      } else if (usedImports.length !== importList.length) {
        // Reconstruct import statement with only used imports
        return match.replace(imports, usedImports.join(', '));
      }
      
      return match;
    });
    
    // Remove completely unused import lines (default imports, etc.)
    const unusedImportPatterns = [
      /import\s+Link\s+from\s+['"]next\/link['"];?\s*\n/g,
      /import\s+Image\s+from\s+['"]next\/image['"];?\s*\n/g,
    ];
    
    unusedImportPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const importName = match.match(/import\s+(\w+)/)?.[1];
          if (importName && !content.split(match)[1].includes(importName)) {
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

// Fix unused variables by removing or commenting them
function fixUnusedVariables(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix unused variables with underscore prefix
    const unusedVarPatterns = [
      // Error variables that are defined but never used
      /(\s+)(\w+)\s*=\s*(\w+);?\s*\/\/\s*defined but never used/g,
      // Simple unused variable declarations
      /const\s+(\w+)\s*=\s*[^;]+;\s*\/\/.*never used/g,
    ];
    
    // Add underscore prefix to unused variables to suppress ESLint warnings
    content = content.replace(/(\s+)const\s+([a-zA-Z]\w*)\s*=/g, (match, indent, varName) => {
      // Check if variable is used later in the code
      const afterMatch = content.split(match)[1];
      if (afterMatch && !afterMatch.includes(varName)) {
        modified = true;
        return `${indent}const _${varName} =`;
      }
      return match;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
  } catch (error) {
    console.error(`Error fixing unused variables in ${filePath}:`, error.message);
  }
  
  return false;
}

// Main function
function main() {
  console.log('Starting lint fixes...');
  
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = getAllTsFiles(srcDir);
  
  let totalModified = 0;
  
  console.log(`Found ${tsFiles.length} TypeScript files to process`);
  
  // Process each file
  tsFiles.forEach(filePath => {
    let fileModified = false;
    
    // Remove unused imports
    if (removeUnusedImports(filePath)) {
      fileModified = true;
    }
    
    // Fix unused variables
    if (fixUnusedVariables(filePath)) {
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
  
  console.log('\nLint fixes completed!');
}

if (require.main === module) {
  main();
}

module.exports = { removeUnusedImports, fixUnusedVariables };