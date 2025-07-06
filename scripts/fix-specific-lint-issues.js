#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common 'any' type fixes
const TYPE_FIXES = {
  // Common patterns for API responses and data
  'Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any': {
    // API response patterns
    '(\\w+)\\s*:\\s*any': '$1: unknown',
    'data\\s*:\\s*any': 'data: unknown',
    'response\\s*:\\s*any': 'response: unknown',
    'error\\s*:\\s*any': 'error: unknown',
    'result\\s*:\\s*any': 'result: unknown',
    'params\\s*:\\s*any': 'params: Record<string, unknown>',
    'options\\s*:\\s*any': 'options: Record<string, unknown>',
    'config\\s*:\\s*any': 'config: Record<string, unknown>',
    'body\\s*:\\s*any': 'body: unknown',
    'item\\s*:\\s*any': 'item: unknown',
    'value\\s*:\\s*any': 'value: unknown',
    'payload\\s*:\\s*any': 'payload: unknown',
  }
};

// Function to find all TypeScript files
function getAllTsFiles(dir, fileList = []) {
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
  
  return fileList;
}

// Fix unused variables by prefixing with underscore
function fixUnusedVariables(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Pattern for unused variables in different contexts
    const patterns = [
      // Simple unused const declarations
      {
        pattern: /const\s+([a-zA-Z_]\w*)\s*=/g,
        check: (match, varName, content, afterIndex) => {
          const afterContent = content.substring(afterIndex);
          // Check if variable is used after declaration
          const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
          const usages = afterContent.match(usageRegex) || [];
          return usages.length <= 1; // Only the declaration itself
        },
        replace: (match, varName) => `const _${varName} =`
      },
      
      // Function parameters
      {
        pattern: /\(\s*([a-zA-Z_]\w*)\s*[:)]/g,
        check: (match, paramName, content) => {
          // Don't prefix very common parameter names
          if (['req', 'res', 'next', 'event', 'data'].includes(paramName)) {
            return false;
          }
          const usageRegex = new RegExp(`\\b${paramName}\\b`, 'g');
          const usages = content.match(usageRegex) || [];
          return usages.length <= 1;
        },
        replace: (match, paramName) => match.replace(paramName, `_${paramName}`)
      },
      
      // Arrow function parameters
      {
        pattern: /=>\s*\{[^}]*\}/g,
        check: () => false, // Skip for now as it's more complex
        replace: match => match
      }
    ];
    
    patterns.forEach(({ pattern, check, replace }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const varName = match[1];
        if (varName && !varName.startsWith('_') && check(match[0], varName, content, match.index + match[0].length)) {
          const newContent = replace(match[0], varName);
          content = content.replace(match[0], newContent);
          modified = true;
          console.log(`Fixed unused variable: ${varName} in ${filePath}`);
          // Reset regex to avoid infinite loops
          pattern.lastIndex = 0;
        }
      }
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

// Fix specific ESLint issues
function fixSpecificIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix 'prefer-const' issues
    const letRegex = /let\s+(\w+)\s*=\s*([^;]+);/g;
    content = content.replace(letRegex, (match, varName, value) => {
      // Check if variable is reassigned later
      const reassignRegex = new RegExp(`\\b${varName}\\s*=`, 'g');
      const afterDeclaration = content.split(match)[1] || '';
      const reassignments = afterDeclaration.match(reassignRegex) || [];
      
      if (reassignments.length === 0) {
        modified = true;
        console.log(`Fixed prefer-const: ${varName} in ${filePath}`);
        return `const ${varName} = ${value};`;
      }
      return match;
    });
    
    // Fix no-var issues
    content = content.replace(/\bvar\s+/g, () => {
      modified = true;
      return 'let ';
    });
    
    // Fix some common React hook dependency issues
    const hookDepPatterns = [
      // useEffect with missing dependencies - add empty dependency array if none exists
      {
        pattern: /useEffect\(\s*\(\)\s*=>\s*\{[^}]+\}\s*\);/g,
        replacement: match => {
          if (!match.includes(', [')) {
            return match.replace(');', ', []);');
          }
          return match;
        }
      }
    ];
    
    hookDepPatterns.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
  } catch (error) {
    console.error(`Error fixing specific issues in ${filePath}:`, error.message);
  }
  
  return false;
}

// Fix common Next.js issues
function fixNextJsIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix <img> to Image component (but only if next/image is available)
    if (content.includes('from "next/image"') || content.includes("from 'next/image'")) {
      const imgRegex = /<img\s+([^>]+)>/g;
      content = content.replace(imgRegex, (match, attrs) => {
        if (!attrs.includes('alt=')) {
          // Add alt attribute if missing
          attrs += ' alt=""';
        }
        modified = true;
        console.log(`Fixed img tag in ${filePath}`);
        return `<Image ${attrs} />`;
      });
    }
    
    // Fix <a> to Link component for internal links
    if (content.includes('from "next/link"') || content.includes("from 'next/link'")) {
      const aRegex = /<a\s+href=["']([^"']+)["'][^>]*>/g;
      content = content.replace(aRegex, (match, href) => {
        // Only fix internal links
        if (href.startsWith('/') && !href.startsWith('//')) {
          modified = true;
          console.log(`Fixed internal link in ${filePath}`);
          return `<Link href="${href}">`;
        }
        return match;
      });
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
  } catch (error) {
    console.error(`Error fixing Next.js issues in ${filePath}:`, error.message);
  }
  
  return false;
}

// Fix React unescaped entities
function fixUnescapedEntities(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Common entity fixes
    const entityFixes = {
      "'": '&apos;',
      '"': '&quot;',
    };
    
    // Look for JSX content between > and <
    const jsxContentRegex = />([^<]+)</g;
    content = content.replace(jsxContentRegex, (match, textContent) => {
      let newTextContent = textContent;
      Object.entries(entityFixes).forEach(([char, entity]) => {
        if (newTextContent.includes(char)) {
          newTextContent = newTextContent.replace(new RegExp(char, 'g'), entity);
          modified = true;
        }
      });
      
      if (modified) {
        console.log(`Fixed unescaped entities in ${filePath}`);
        return `>${newTextContent}<`;
      }
      return match;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
  } catch (error) {
    console.error(`Error fixing unescaped entities in ${filePath}:`, error.message);
  }
  
  return false;
}

// Main function
function main() {
  console.log('Starting specific lint fixes...');
  
  const srcDir = path.join(process.cwd(), 'src');
  const tsFiles = getAllTsFiles(srcDir);
  
  let totalModified = 0;
  
  console.log(`Found ${tsFiles.length} TypeScript files to process`);
  
  // Process each file
  tsFiles.forEach(filePath => {
    let fileModified = false;
    
    // Fix unused variables
    if (fixUnusedVariables(filePath)) {
      fileModified = true;
    }
    
    // Fix specific ESLint issues
    if (fixSpecificIssues(filePath)) {
      fileModified = true;
    }
    
    // Fix Next.js specific issues
    if (fixNextJsIssues(filePath)) {
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
  console.log('Specific lint fixes completed!');
}

if (require.main === module) {
  main();
}

module.exports = { fixUnusedVariables, fixSpecificIssues, fixNextJsIssues, fixUnescapedEntities };