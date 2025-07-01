#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Public pages to check
const publicPages = [
  'src/app/about/page.tsx',
  'src/app/departments/page.tsx', 
  'src/app/admissions/page.tsx',
  'src/app/facilities/page.tsx',
  'src/app/student-section/page.tsx',
  'src/app/ssip/page.tsx',
  'src/app/tpo/page.tsx',
  'src/app/establishment/page.tsx',
  'src/app/contact/page.tsx'
];

// Pattern to find className attributes that might need dark mode
const classNamePattern = /className="([^"]*)"/g;

// Patterns that should have dark mode variants
const lightModePatterns = [
  { pattern: 'bg-white', darkVariant: 'dark:bg-gray-900' },
  { pattern: 'bg-gray-50', darkVariant: 'dark:bg-gray-800' },
  { pattern: 'bg-gray-100', darkVariant: 'dark:bg-gray-800' },
  { pattern: 'text-gray-900', darkVariant: 'dark:text-white' },
  { pattern: 'text-gray-800', darkVariant: 'dark:text-white' },
  { pattern: 'text-gray-700', darkVariant: 'dark:text-gray-300' },
  { pattern: 'text-gray-600', darkVariant: 'dark:text-gray-300' },
  { pattern: 'text-gray-500', darkVariant: 'dark:text-gray-400' }
];

function analyzeRealDarkModeIssues() {
  console.log(`${colors.bold}${colors.cyan}🌙 Real Dark Mode Issues Analysis${colors.reset}\n`);
  
  let totalIssues = 0;
  let totalFiles = 0;
  let processedFiles = 0;

  publicPages.forEach(pagePath => {
    const fullPath = path.join(process.cwd(), pagePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`${colors.red}❌ File not found: ${pagePath}${colors.reset}`);
      return;
    }

    totalFiles++;
    const content = fs.readFileSync(fullPath, 'utf8');
    const issues = [];

    console.log(`${colors.blue}📄 Analyzing: ${pagePath}${colors.reset}`);

    // Find all className attributes
    let match;
    const classNames = [];
    while ((match = classNamePattern.exec(content)) !== null) {
      classNames.push({
        fullMatch: match[0],
        classes: match[1],
        index: match.index
      });
    }

    // Check each className for missing dark variants
    classNames.forEach(({ fullMatch, classes, index }) => {
      lightModePatterns.forEach(({ pattern, darkVariant }) => {
        if (classes.includes(pattern) && !classes.includes(darkVariant)) {
          // Get context around the match
          const contextStart = Math.max(0, index - 100);
          const contextEnd = Math.min(content.length, index + fullMatch.length + 100);
          const context = content.substring(contextStart, contextEnd);
          
          issues.push({
            type: 'missing-dark-variant',
            pattern,
            darkVariant,
            className: fullMatch,
            context: context.trim(),
            line: content.substring(0, index).split('\n').length
          });
        }
      });
    });

    // Report results for this file
    if (issues.length === 0) {
      console.log(`  ${colors.green}✅ No dark mode issues found${colors.reset}`);
    } else {
      console.log(`  ${colors.red}❗ Found ${issues.length} real dark mode issues:${colors.reset}`);
      issues.forEach((issue, i) => {
        console.log(`    ${i + 1}. Line ${issue.line}: ${issue.pattern} missing ${issue.darkVariant}`);
        console.log(`       ${colors.yellow}${issue.className}${colors.reset}`);
        console.log(`       Context: ${issue.context.substring(0, 150)}...`);
        console.log('');
      });
    }

    totalIssues += issues.length;
    processedFiles++;
    console.log('');
  });

  // Summary
  console.log(`${colors.bold}${colors.cyan}📊 Summary:${colors.reset}`);
  console.log(`Files processed: ${processedFiles}/${totalFiles}`);
  console.log(`Total real dark mode issues: ${totalIssues}`);

  if (totalIssues === 0) {
    console.log(`${colors.green}${colors.bold}🎉 All public pages have proper dark mode support!${colors.reset}`);
    console.log(`${colors.cyan}ℹ️  Card components use CSS custom properties (--card, --card-foreground) for dark mode${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  Found ${totalIssues} real dark mode issues that need fixing${colors.reset}`);
  }

  // Manual testing instructions
  console.log(`\n${colors.bold}${colors.cyan}🧪 Manual Testing Instructions:${colors.reset}`);
  console.log(`1. Ensure development server is running: ${colors.green}npm run dev${colors.reset}`);
  console.log(`2. Open each page in browser:`);
  publicPages.forEach(page => {
    const route = page.replace('src/app', '').replace('/page.tsx', '') || '/';
    console.log(`   - http://localhost:3000${route}`);
  });
  console.log(`3. Toggle dark mode using system preferences or browser developer tools`);
  console.log(`4. Check for visual consistency and readability in both modes`);
  console.log(`5. Verify that all text is readable and backgrounds are appropriate`);

  process.exit(totalIssues);
}

// Run the analysis
analyzeRealDarkModeIssues();
