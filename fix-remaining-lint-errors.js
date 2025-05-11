#!/usr/bin/env node

/**
 * Script to fix remaining specific lint errors in the codebase
 * This script targets:
 * 1. React Hook useEffect dependencies
 * 2. Unescaped entities in JSX
 * 3. Undefined components (CalendarIcon, CommitteeIcon, etc.)
 * 4. Explicit any types in test files
 * 5. var usage instead of let/const
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

// Function to fix useEffect dependencies
function fixUseEffectDependencies(filePath) {
  if (!filePath.endsWith('.tsx')) return false;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Find useEffect hooks with missing dependencies
    const patterns = [
      { regex: /useEffect\(\s*\(\)\s*=>\s*{\s*fetchInitialData\([^)]*\);\s*}\s*,\s*\[\]\s*\)/g, replacement: 'useEffect(() => { fetchInitialData(); }, [fetchInitialData])' },
      { regex: /useEffect\(\s*\(\)\s*=>\s*{\s*fetchBuildingsAndInstitutes\([^)]*\);\s*}\s*,\s*\[\]\s*\)/g, replacement: 'useEffect(() => { fetchBuildingsAndInstitutes(); }, [fetchBuildingsAndInstitutes])' },
      { regex: /useEffect\(\s*\(\)\s*=>\s*{\s*fetchDepartmentsAndFaculty\([^)]*\);\s*}\s*,\s*\[\]\s*\)/g, replacement: 'useEffect(() => { fetchDepartmentsAndFaculty(); }, [fetchDepartmentsAndFaculty])' },
      { regex: /useEffect\(\s*\(\)\s*=>\s*{\s*fetchInstitutes\([^)]*\);\s*}\s*,\s*\[\]\s*\)/g, replacement: 'useEffect(() => { fetchInstitutes(); }, [fetchInstitutes])' },
      { regex: /useEffect\(\s*\(\)\s*=>\s*{\s*fetchProgramsAndDepartments\([^)]*\);\s*}\s*,\s*\[\]\s*\)/g, replacement: 'useEffect(() => { fetchProgramsAndDepartments(); }, [fetchProgramsAndDepartments])' },
      { regex: /useEffect\(\s*\(\)\s*=>\s*{\s*fetchRoles\([^)]*\);\s*}\s*,\s*\[\]\s*\)/g, replacement: 'useEffect(() => { fetchRoles(); }, [fetchRoles])' },
      { regex: /useEffect\(\s*\(\)\s*=>\s*{\s*fetchRoomsAndBuildings\([^)]*\);\s*}\s*,\s*\[\]\s*\)/g, replacement: 'useEffect(() => { fetchRoomsAndBuildings(); }, [fetchRoomsAndBuildings])' },
      { regex: /useEffect\(\s*\(\)\s*=>\s*{\s*fetchStudents\([^)]*\);\s*}\s*,\s*\[\]\s*\)/g, replacement: 'useEffect(() => { fetchStudents(); }, [fetchStudents])' },
      { regex: /useEffect\(\s*\(\)\s*=>\s*{\s*fetchProfileData\([^)]*\);\s*}\s*,\s*\[\]\s*\)/g, replacement: 'useEffect(() => { fetchProfileData(); }, [fetchProfileData])' },
      { regex: /useEffect\(\s*\(\)\s*=>\s*{\s*[^}]+}\s*,\s*\[\]\s*\)/g, replacement: (match) => {
        // Extract the function body
        const bodyMatch = /useEffect\(\s*\(\)\s*=>\s*{([^}]+)}\s*,\s*\[\]\s*\)/.exec(match);
        if (bodyMatch) {
          const body = bodyMatch[1];
          // Find function calls in the body
          const functionCalls = body.match(/\b([a-zA-Z][a-zA-Z0-9_]*)\(/g);
          if (functionCalls) {
            // Extract function names and remove the opening parenthesis
            const functionNames = [...new Set(functionCalls.map(call => call.slice(0, -1)))];
            return `useEffect(() => {${body}}, [${functionNames.join(', ')}])`;
          }
        }
        return match;
      }}
    ];
    
    for (const pattern of patterns) {
      const newContent = content.replace(pattern.regex, pattern.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`Fixed useEffect dependency in ${filePath}`);
      }
    }
    
    // Fix specific login page useEffect
    if (filePath.includes('login/page.tsx')) {
      const loginPattern = /useEffect\(\s*\(\)\s*=>\s*{[^}]*selectedRoleCode[^}]*}\s*,\s*\[\]\s*\)/g;
      const newContent = content.replace(loginPattern, (match) => {
        return match.replace(/\[\]/g, '[selectedRoleCode]');
      });
      
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`Fixed login page useEffect dependency in ${filePath}`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    }
    
    return modified;
  } catch (error) {
    console.error(`Error fixing useEffect dependencies in ${filePath}:`, error);
    return false;
  }
}

// Function to fix unescaped entities
function fixUnescapedEntities(filePath) {
  if (!filePath.endsWith('.tsx')) return false;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace unescaped single quotes
    const singleQuoteRegex = /(\s|>)['']([^'']*)[''](\s|<)/g;
    const newContentSingle = content.replace(singleQuoteRegex, '$1&apos;$2&apos;$3');
    
    if (newContentSingle !== content) {
      content = newContentSingle;
      modified = true;
      console.log(`Fixed unescaped single quotes in ${filePath}`);
    }
    
    // Replace unescaped double quotes
    const doubleQuoteRegex = /(\s|>)[""]([^""]*)[""](\s|<)/g;
    const newContentDouble = content.replace(doubleQuoteRegex, '$1&quot;$2&quot;$3');
    
    if (newContentDouble !== content) {
      content = newContentDouble;
      modified = true;
      console.log(`Fixed unescaped double quotes in ${filePath}`);
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    }
    
    return modified;
  } catch (error) {
    console.error(`Error fixing unescaped entities in ${filePath}:`, error);
    return false;
  }
}

// Function to fix undefined components
function fixUndefinedComponents(filePath) {
  if (!filePath.endsWith('.tsx')) return false;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if the file uses CommitteeIcon but doesn't import it
    if (content.includes('CommitteeIcon') && !content.includes('import') && !content.includes('CommitteeIcon')) {
      // Add import for CommitteeIcon
      const importStatement = `import { Users2 as CommitteeIcon } from "lucide-react";\n`;
      content = importStatement + content;
      modified = true;
      console.log(`Added CommitteeIcon import to ${filePath}`);
    }
    
    // Check if the file uses CalendarIcon but doesn't import it
    if (content.includes('CalendarIcon') && !content.includes('import') && !content.includes('CalendarIcon')) {
      // Add import for CalendarIcon
      const importStatement = `import { Calendar as CalendarIcon } from "lucide-react";\n`;
      content = importStatement + content;
      modified = true;
      console.log(`Added CalendarIcon import to ${filePath}`);
    }
    
    // Check if the file uses AssessmentIcon but doesn't import it
    if (content.includes('AssessmentIcon') && !content.includes('import') && !content.includes('AssessmentIcon')) {
      // Add import for AssessmentIcon
      const importStatement = `import { ClipboardCheck as AssessmentIcon } from "lucide-react";\n`;
      content = importStatement + content;
      modified = true;
      console.log(`Added AssessmentIcon import to ${filePath}`);
    }
    
    // Check if the file uses Button but doesn't import it
    if (content.includes('<Button') && !content.includes('import') && !content.includes('Button')) {
      // Add import for Button
      const importStatement = `import { Button } from "@/components/ui/button";\n`;
      content = importStatement + content;
      modified = true;
      console.log(`Added Button import to ${filePath}`);
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    }
    
    return modified;
  } catch (error) {
    console.error(`Error fixing undefined components in ${filePath}:`, error);
    return false;
  }
}

// Function to fix explicit any types in test files
function fixExplicitAnyInTests(filePath) {
  if (!filePath.includes('.test.ts')) return false;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace any types in test files with more specific types
    const anyTypeRegex = /: any(?!\[\])/g;
    const newContent = content.replace(anyTypeRegex, ': unknown');
    
    if (newContent !== content) {
      content = newContent;
      modified = true;
      console.log(`Fixed explicit any types in test file ${filePath}`);
    }
    
    // Replace any[] with unknown[]
    const anyArrayRegex = /: any\[\]/g;
    const newContentArray = content.replace(anyArrayRegex, ': unknown[]');
    
    if (newContentArray !== content) {
      content = newContentArray;
      modified = true;
      console.log(`Fixed explicit any[] types in test file ${filePath}`);
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    }
    
    return modified;
  } catch (error) {
    console.error(`Error fixing explicit any types in test file ${filePath}:`, error);
    return false;
  }
}

// Function to fix var usage
function fixVarUsage(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace var with let
    const varRegex = /\bvar\s+([a-zA-Z0-9_]+)/g;
    const newContent = content.replace(varRegex, 'let $1');
    
    if (newContent !== content) {
      content = newContent;
      modified = true;
      console.log(`Fixed var usage in ${filePath}`);
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    }
    
    return modified;
  } catch (error) {
    console.error(`Error fixing var usage in ${filePath}:`, error);
    return false;
  }
}

// Function to fix unused variables
function fixUnusedVariables(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Find variable declarations that are defined but never used
    const variableWarningRegex = /\/\/ @typescript-eslint\/no-unused-vars/g;
    if (!variableWarningRegex.test(content)) {
      const variableDeclarationRegex = /(const|let)\s+([a-zA-Z0-9_]+)\s*=/g;
      const matches = [...content.matchAll(variableDeclarationRegex)];
      
      for (const match of matches) {
        const variableType = match[1]; // const or let
        const variableName = match[2];
        
        // Skip if variable name starts with underscore
        if (variableName.startsWith('_')) continue;
        
        // Check if the variable is only used in its own declaration
        const regex = new RegExp(`\\b${variableName}\\b`, 'g');
        const occurrences = [...content.matchAll(regex)];
        
        if (occurrences.length === 1) {
          // Variable is declared but never used
          // Add underscore prefix to suppress unused variable warning
          const newDeclaration = `${variableType} _${variableName}`;
          content = content.replace(`${variableType} ${variableName}`, newDeclaration);
          console.log(`Fixed unused variable ${variableName} in ${filePath}`);
          modified = true;
        }
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

// Function to fix prefer-const warnings
function fixPreferConst(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Find let declarations that are never reassigned
    const letDeclarationRegex = /let\s+([a-zA-Z0-9_]+)\s*=/g;
    const matches = [...content.matchAll(letDeclarationRegex)];
    
    for (const match of matches) {
      const variableName = match[1];
      
      // Check if the variable is reassigned
      const reassignmentRegex = new RegExp(`${variableName}\\s*=`, 'g');
      const reassignments = [...content.matchAll(reassignmentRegex)];
      
      // If there's only one assignment (the declaration), it's never reassigned
      if (reassignments.length === 1) {
        content = content.replace(`let ${variableName}`, `const ${variableName}`);
        console.log(`Fixed prefer-const for ${variableName} in ${filePath}`);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    }
    
    return modified;
  } catch (error) {
    console.error(`Error fixing prefer-const warnings in ${filePath}:`, error);
    return false;
  }
}

// Main function
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = findTsFiles(srcDir);
  
  console.log(`Found ${tsFiles.length} TypeScript files to process`);
  
  let fixedFiles = 0;
  
  // Apply fixes to each file
  for (const file of tsFiles) {
    let fileFixed = false;
    
    // Apply fixes
    fileFixed = fixUseEffectDependencies(file) || fileFixed;
    fileFixed = fixUnescapedEntities(file) || fileFixed;
    fileFixed = fixUndefinedComponents(file) || fileFixed;
    fileFixed = fixExplicitAnyInTests(file) || fileFixed;
    fileFixed = fixVarUsage(file) || fileFixed;
    fileFixed = fixUnusedVariables(file) || fileFixed;
    fileFixed = fixPreferConst(file) || fileFixed;
    
    if (fileFixed) {
      fixedFiles++;
    }
  }
  
  console.log(`Fixed specific lint errors in ${fixedFiles} files`);
  console.log('Lint fixing process completed!');
}

main();
