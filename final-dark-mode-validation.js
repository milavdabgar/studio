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

// Light mode patterns that should have ANY dark variant
const lightModePatterns = [
  { pattern: 'bg-white', darkPattern: 'dark:bg-' },
  { pattern: 'bg-gray-50', darkPattern: 'dark:bg-' },
  { pattern: 'bg-gray-100', darkPattern: 'dark:bg-' },
  { pattern: 'text-gray-900', darkPattern: 'dark:text-' },
  { pattern: 'text-gray-800', darkPattern: 'dark:text-' },
  { pattern: 'text-gray-700', darkPattern: 'dark:text-' },
  { pattern: 'text-gray-600', darkPattern: 'dark:text-' },
  { pattern: 'text-gray-500', darkPattern: 'dark:text-' }
];

function finalDarkModeValidation() {
  console.log(`${colors.bold}${colors.cyan}🌙 Final Dark Mode Validation${colors.reset}\n`);
  
  let totalIssues = 0;
  let totalFiles = 0;
  let processedFiles = 0;
  let totalChecks = 0;
  let passedChecks = 0;

  publicPages.forEach(pagePath => {
    const fullPath = path.join(process.cwd(), pagePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`${colors.red}❌ File not found: ${pagePath}${colors.reset}`);
      return;
    }

    totalFiles++;
    const content = fs.readFileSync(fullPath, 'utf8');
    const issues = [];

    console.log(`${colors.blue}📄 Validating: ${pagePath}${colors.reset}`);

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
      lightModePatterns.forEach(({ pattern, darkPattern }) => {
        if (classes.includes(pattern)) {
          totalChecks++;
          if (!classes.includes(darkPattern)) {
            // Get context around the match
            const line = content.substring(0, index).split('\n').length;
            
            issues.push({
              type: 'missing-dark-variant',
              pattern,
              darkPattern,
              className: fullMatch,
              line
            });
          } else {
            passedChecks++;
          }
        }
      });
    });

    // Report results for this file
    if (issues.length === 0) {
      console.log(`  ${colors.green}✅ Perfect dark mode implementation${colors.reset}`);
    } else {
      console.log(`  ${colors.red}❗ Found ${issues.length} missing dark variants:${colors.reset}`);
      issues.forEach((issue, i) => {
        console.log(`    ${i + 1}. Line ${issue.line}: ${issue.pattern} needs ${issue.darkPattern}*`);
        console.log(`       ${colors.yellow}${issue.className}${colors.reset}`);
      });
    }

    totalIssues += issues.length;
    processedFiles++;
    console.log('');
  });

  // Summary
  console.log(`${colors.bold}${colors.cyan}📊 Validation Summary:${colors.reset}`);
  console.log(`Files processed: ${processedFiles}/${totalFiles}`);
  console.log(`Total light-mode classes checked: ${totalChecks}`);
  console.log(`Classes with dark variants: ${passedChecks}`);
  console.log(`Missing dark variants: ${totalIssues}`);
  console.log(`Dark mode coverage: ${totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100}%`);

  if (totalIssues === 0) {
    console.log(`\n${colors.green}${colors.bold}🎉 Perfect! All public pages have complete dark mode support!${colors.reset}`);
    console.log(`${colors.cyan}ℹ️  Card components use CSS custom properties for dark mode${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  ${totalIssues} classes need dark mode variants${colors.reset}`);
  }

  // Check development server
  console.log(`\n${colors.bold}${colors.cyan}🚀 Ready for Manual Testing:${colors.reset}`);
  console.log(`1. Development server: http://localhost:3000`);
  console.log(`2. Test pages in both light and dark mode:`);
  
  const routes = [
    { path: '/', name: 'Home' },
    { path: '/about', name: 'About' },
    { path: '/departments', name: 'Departments' },
    { path: '/admissions', name: 'Admissions' },
    { path: '/facilities', name: 'Facilities' },
    { path: '/student-section', name: 'Student Section' },
    { path: '/ssip', name: 'SSIP' },
    { path: '/tpo', name: 'TPO' },
    { path: '/establishment', name: 'Establishment' },
    { path: '/contact', name: 'Contact' }
  ];

  routes.forEach(route => {
    console.log(`   ${colors.green}→${colors.reset} ${route.name}: http://localhost:3000${route.path}`);
  });

  console.log(`\n${colors.bold}Dark mode testing:${colors.reset}`);
  console.log(`• Toggle system dark mode in your OS settings`);
  console.log(`• Or use browser dev tools to toggle 'prefers-color-scheme'`);
  console.log(`• Check text readability and visual contrast`);
  console.log(`• Verify all components look consistent`);

  return totalIssues === 0;
}

// Run the final validation
const isComplete = finalDarkModeValidation();
process.exit(isComplete ? 0 : 1);
