#!/usr/bin/env node

/**
 * Script to fix syntax errors in API service files
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

// Function to fix API service files
function fixApiServiceFiles(filePath) {
  try {
    // Only process API service files
    if (!filePath.includes('/api/') && !filePath.includes('/services/')) {
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix property assignment errors in catch blocks
    const catchBlockRegex = /(catch\s*\([^)]*\)\s*{[^}]*?return\s*{[^}]*?message:)([^,}]*?)([^}]*?})/gs;
    const fixedCatchBlocks = content.replace(catchBlockRegex, '$1 $2,$3');
    
    if (fixedCatchBlocks !== content) {
      content = fixedCatchBlocks;
      modified = true;
      console.log(`Fixed catch block in ${filePath}`);
    }
    
    // Fix missing commas in object literals
    const objectLiteralRegex = /(\s*[a-zA-Z0-9_]+\s*:\s*[^,{}\n]+)(\s*[a-zA-Z0-9_]+\s*:)/g;
    const fixedObjectLiterals = content.replace(objectLiteralRegex, '$1,$2');
    
    if (fixedObjectLiterals !== content) {
      content = fixedObjectLiterals;
      modified = true;
      console.log(`Fixed missing commas in object literals in ${filePath}`);
    }
    
    // Fix missing semicolons
    const missingSemicolonRegex = /(\}\)\s*)(\n\s*[a-zA-Z])/g;
    const fixedSemicolons = content.replace(missingSemicolonRegex, '$1;$2');
    
    if (fixedSemicolons !== content) {
      content = fixedSemicolons;
      modified = true;
      console.log(`Fixed missing semicolons in ${filePath}`);
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing API service file ${filePath}:`, error);
    return false;
  }
}

// Function to fix component files
function fixComponentFiles(filePath) {
  try {
    // Only process component files
    if (!filePath.includes('/components/') && !filePath.includes('/app/')) {
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix import statements
    const importRegex = /import\s+\{([^}]*)\}\s+from\s+["']([^"']*)["']/g;
    const fixedImports = content.replace(importRegex, 'import { $1 } from "$2"');
    
    if (fixedImports !== content) {
      content = fixedImports;
      modified = true;
      console.log(`Fixed import statements in ${filePath}`);
    }
    
    // Fix missing semicolons after import statements
    const missingSemicolonRegex = /(import\s+[^;]*?from\s+["'][^"']*?["'])\s*(?!\s*;)/g;
    const fixedSemicolons = content.replace(missingSemicolonRegex, '$1;');
    
    if (fixedSemicolons !== content) {
      content = fixedSemicolons;
      modified = true;
      console.log(`Fixed missing semicolons after imports in ${filePath}`);
    }
    
    // Fix specific files
    if (filePath.includes('checkbox.tsx')) {
      // Fix checkbox.tsx
      content = `import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };`;
      modified = true;
      console.log(`Fixed checkbox.tsx`);
    }
    
    if (filePath.includes('tooltip.tsx')) {
      // Fix tooltip.tsx
      content = `import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };`;
      modified = true;
      console.log(`Fixed tooltip.tsx`);
    }
    
    if (filePath.includes('faculty/timetable/page.tsx')) {
      // Fix timetable page
      const importRegex = /(import\s+\{[^}]*\}\s+from\s+["'][^"']*["'])\s*(?!\s*;)/g;
      content = content.replace(importRegex, '$1;');
      modified = true;
      console.log(`Fixed faculty timetable page`);
    }
    
    if (filePath.includes('student/timetable/page.tsx')) {
      // Fix student timetable page
      const importRegex = /(import\s+\{[^}]*\}\s+from\s+["'][^"']*["'])\s*(?!\s*;)/g;
      content = content.replace(importRegex, '$1;');
      modified = true;
      console.log(`Fixed student timetable page`);
    }
    
    if (filePath.includes('theme-toggle.tsx')) {
      // Fix theme toggle
      const importRegex = /(import\s+\{[^}]*\}\s+from\s+["'][^"']*["'])\s*(?!\s*;)/g;
      content = content.replace(importRegex, '$1;');
      modified = true;
      console.log(`Fixed theme toggle`);
    }
    
    if (filePath.includes('form.tsx')) {
      // Fix form component
      const importRegex = /(import\s+\{[^}]*\}\s+from\s+["'][^"']*["'])\s*(?!\s*;)/g;
      content = content.replace(importRegex, '$1;');
      modified = true;
      console.log(`Fixed form component`);
    }
    
    if (filePath.includes('sidebar.tsx')) {
      // Fix sidebar component
      const importRegex = /(import\s+\{[^}]*\}\s+from\s+["'][^"']*["'])\s*(?!\s*;)/g;
      content = content.replace(importRegex, '$1;');
      modified = true;
      console.log(`Fixed sidebar component`);
    }
    
    if (filePath.includes('toaster.tsx')) {
      // Fix toaster component
      const importRegex = /(import\s+\{[^}]*\}\s+from\s+["'][^"']*["'])\s*(?!\s*;)/g;
      content = content.replace(importRegex, '$1;');
      modified = true;
      console.log(`Fixed toaster component`);
    }
    
    if (filePath.includes('use-toast.ts')) {
      // Fix use-toast hook
      const importRegex = /(import\s+\{[^}]*\}\s+from\s+["'][^"']*["'])\s*(?!\s*;)/g;
      content = content.replace(importRegex, '$1;');
      modified = true;
      console.log(`Fixed use-toast hook`);
    }
    
    if (filePath.includes('layout.tsx')) {
      // Fix layout component
      const importRegex = /(import\s+\{[^}]*\}\s+from\s+["'][^"']*["'])\s*(?!\s*;)/g;
      content = content.replace(importRegex, '$1;');
      modified = true;
      console.log(`Fixed layout component`);
    }
    
    if (filePath.includes('login/page.tsx')) {
      // Fix login page
      const importRegex = /(import\s+\{[^}]*\}\s+from\s+["'][^"']*["'])\s*(?!\s*;)/g;
      content = content.replace(importRegex, '$1;');
      modified = true;
      console.log(`Fixed login page`);
    }
    
    if (filePath.includes('project-fair/admin/new-event/page.tsx')) {
      // Fix new event page
      const importRegex = /(import\s+\{[^}]*\}\s+from\s+["'][^"']*["'])\s*(?!\s*;)/g;
      content = content.replace(importRegex, '$1;');
      modified = true;
      console.log(`Fixed new event page`);
    }
    
    if (filePath.includes('calendar.tsx')) {
      // Fix calendar component
      const importRegex = /(import\s+\{[^}]*\}\s+from\s+["'][^"']*["'])\s*(?!\s*;)/g;
      content = content.replace(importRegex, '$1;');
      modified = true;
      console.log(`Fixed calendar component`);
    }
    
    if (filePath.includes('chart.tsx')) {
      // Fix chart component
      const importRegex = /(import\s+\{[^}]*\}\s+from\s+["'][^"']*["'])\s*(?!\s*;)/g;
      content = content.replace(importRegex, '$1;');
      modified = true;
      console.log(`Fixed chart component`);
    }
    
    if (filePath.includes('select.tsx')) {
      // Fix select component
      const importRegex = /(import\s+\{[^}]*\}\s+from\s+["'][^"']*["'])\s*(?!\s*;)/g;
      content = content.replace(importRegex, '$1;');
      modified = true;
      console.log(`Fixed select component`);
    }
    
    if (filePath.includes('label.tsx')) {
      // Fix label component
      const importRegex = /(import\s+\{[^}]*\}\s+from\s+["'][^"']*["'])\s*(?!\s*;)/g;
      content = content.replace(importRegex, '$1;');
      modified = true;
      console.log(`Fixed label component`);
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing component file ${filePath}:`, error);
    return false;
  }
}

// Function to fix test files
function fixTestFiles(filePath) {
  try {
    // Only process test files
    if (!filePath.includes('.test.ts')) {
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix property assignment errors in test files
    if (filePath.includes('assessments.test.ts')) {
      content = content.replace(/message: error\.message/g, 'message: error.message,');
      modified = true;
      console.log(`Fixed property assignment in assessments.test.ts`);
    }
    
    if (filePath.includes('batches.test.ts')) {
      content = content.replace(/message: error\.message/g, 'message: error.message,');
      modified = true;
      console.log(`Fixed property assignment in batches.test.ts`);
    }
    
    if (filePath.includes('committees.test.ts')) {
      content = content.replace(/message: error\.message/g, 'message: error.message,');
      modified = true;
      console.log(`Fixed property assignment in committees.test.ts`);
    }
    
    if (filePath.includes('courses.test.ts')) {
      content = content.replace(/message: error\.message/g, 'message: error.message,');
      modified = true;
      console.log(`Fixed property assignment in courses.test.ts`);
    }
    
    if (filePath.includes('curriculum.test.ts')) {
      content = content.replace(/message: error\.message/g, 'message: error.message,');
      modified = true;
      console.log(`Fixed property assignment in curriculum.test.ts`);
    }
    
    if (filePath.includes('departments.test.ts')) {
      content = content.replace(/message: error\.message/g, 'message: error.message,');
      modified = true;
      console.log(`Fixed property assignment in departments.test.ts`);
    }
    
    if (filePath.includes('faculty.test.ts')) {
      content = content.replace(/message: error\.message/g, 'message: error.message,');
      modified = true;
      console.log(`Fixed property assignment in faculty.test.ts`);
    }
    
    if (filePath.includes('institutes.test.ts')) {
      content = content.replace(/message: error\.message/g, 'message: error.message,');
      modified = true;
      console.log(`Fixed property assignment in institutes.test.ts`);
    }
    
    if (filePath.includes('programs.test.ts')) {
      content = content.replace(/message: error\.message/g, 'message: error.message,');
      modified = true;
      console.log(`Fixed property assignment in programs.test.ts`);
    }
    
    if (filePath.includes('roles.test.ts')) {
      content = content.replace(/message: error\.message/g, 'message: error.message,');
      modified = true;
      console.log(`Fixed property assignment in roles.test.ts`);
    }
    
    if (filePath.includes('students.test.ts')) {
      content = content.replace(/message: error\.message/g, 'message: error.message,');
      modified = true;
      console.log(`Fixed property assignment in students.test.ts`);
    }
    
    if (filePath.includes('users.test.ts')) {
      content = content.replace(/message: error\.message/g, 'message: error.message,');
      modified = true;
      console.log(`Fixed property assignment in users.test.ts`);
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing test file ${filePath}:`, error);
    return false;
  }
}

// Main function
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = findTsFiles(srcDir);
  
  console.log(`Found ${tsFiles.length} TypeScript files to process`);
  
  let fixedFiles = 0;
  
  // Fix API service files
  for (const file of tsFiles) {
    if (fixApiServiceFiles(file)) {
      fixedFiles++;
    }
  }
  
  // Fix component files
  for (const file of tsFiles) {
    if (fixComponentFiles(file)) {
      fixedFiles++;
    }
  }
  
  // Fix test files
  for (const file of tsFiles) {
    if (fixTestFiles(file)) {
      fixedFiles++;
    }
  }
  
  console.log(`Fixed syntax errors in ${fixedFiles} files`);
  console.log('Syntax error fixing process completed!');
}

main();
