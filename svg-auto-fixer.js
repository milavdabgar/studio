#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class SVGAutoFixer {
  constructor() {
    this.diagramsDir = '/Users/milav/Code/studio/diagrams';
    this.reportPath = '/Users/milav/Code/studio/svg-inspection-results/inspection-report.json';
    this.backupDir = '/Users/milav/Code/studio/svg-backup';
    this.fixedCount = 0;
    this.errorCount = 0;
  }

  async initialize() {
    console.log('🔧 Initializing SVG Auto-Fixer...\n');
    
    // Create backup directory
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`📁 Created backup directory: ${this.backupDir}`);
    }

    // Load inspection report
    if (!fs.existsSync(this.reportPath)) {
      throw new Error('Inspection report not found. Please run svg-visual-inspector.js first.');
    }

    this.report = JSON.parse(fs.readFileSync(this.reportPath, 'utf8'));
    console.log(`📊 Loaded inspection report with ${this.report.totalFiles} files\n`);
  }

  createBackup(svgFile) {
    const sourcePath = path.join(this.diagramsDir, svgFile);
    const backupPath = path.join(this.backupDir, svgFile);
    fs.copyFileSync(sourcePath, backupPath);
  }

  fixSVGFile(svgFile, issues) {
    console.log(`🔨 Fixing: ${svgFile}`);
    
    try {
      const svgPath = path.join(this.diagramsDir, svgFile);
      const svgContent = fs.readFileSync(svgPath, 'utf8');
      
      // Create backup
      this.createBackup(svgFile);
      
      // Parse SVG
      const dom = new JSDOM(`<!DOCTYPE html><html><body>${svgContent}</body></html>`);
      const document = dom.window.document;
      const svg = document.querySelector('svg');
      
      if (!svg) {
        console.log(`  ❌ No SVG element found in ${svgFile}`);
        this.errorCount++;
        return false;
      }

      let changesMade = false;

      // Fix 1: Add title and description for accessibility
      if (!svg.querySelector('title')) {
        const title = document.createElement('title');
        title.textContent = this.generateTitle(svgFile);
        svg.insertBefore(title, svg.firstChild);
        changesMade = true;
        console.log(`  ✅ Added title element`);
      }

      if (!svg.querySelector('desc')) {
        const desc = document.createElement('desc');
        desc.textContent = this.generateDescription(svgFile);
        svg.insertBefore(desc, svg.querySelector('title')?.nextSibling || svg.firstChild);
        changesMade = true;
        console.log(`  ✅ Added description element`);
      }

      // Fix 2: Expand viewBox for elements outside bounds
      const outsideViewBoxCount = issues.filter(issue => issue.includes('outside viewBox')).length;
      if (outsideViewBoxCount > 0) {
        const fixed = this.fixViewBox(svg, document);
        if (fixed) {
          changesMade = true;
          console.log(`  ✅ Expanded viewBox to accommodate ${outsideViewBoxCount} elements`);
        }
      }

      // Fix 3: Adjust overlapping text elements
      const overlapCount = issues.filter(issue => issue.includes('overlapping')).length;
      if (overlapCount > 0) {
        const fixed = this.fixTextOverlaps(svg, document);
        if (fixed) {
          changesMade = true;
          console.log(`  ✅ Adjusted positioning for ${overlapCount} overlapping text elements`);
        }
      }

      // Fix 4: Standardize dimensions
      this.standardizeDimensions(svg);
      changesMade = true;

      if (changesMade) {
        // Write back the fixed SVG
        const fixedSVG = svg.outerHTML;
        fs.writeFileSync(svgPath, fixedSVG);
        this.fixedCount++;
        console.log(`  🎉 Successfully fixed ${svgFile}\n`);
        return true;
      } else {
        console.log(`  ℹ️  No changes needed for ${svgFile}\n`);
        return false;
      }

    } catch (error) {
      console.error(`  ❌ Error fixing ${svgFile}:`, error.message);
      this.errorCount++;
      return false;
    }
  }

  fixViewBox(svg, document) {
    try {
      const currentViewBox = svg.getAttribute('viewBox');
      const width = svg.getAttribute('width');
      const height = svg.getAttribute('height');

      // Calculate actual content bounds
      const allElements = svg.querySelectorAll('*');
      let minX = 0, minY = 0, maxX = 0, maxY = 0;
      let hasValidBounds = false;

      // Simulate getBBox calculation for text and shape elements
      allElements.forEach(element => {
        // For text elements, estimate bounds based on position and content
        if (element.tagName === 'text') {
          const x = parseFloat(element.getAttribute('x') || 0);
          const y = parseFloat(element.getAttribute('y') || 0);
          const textLength = (element.textContent || '').length;
          const estimatedWidth = textLength * 8; // Rough estimate: 8px per character
          const estimatedHeight = 16; // Rough estimate for text height
          
          minX = Math.min(minX, x);
          minY = Math.min(minY, y - estimatedHeight);
          maxX = Math.max(maxX, x + estimatedWidth);
          maxY = Math.max(maxY, y);
          hasValidBounds = true;
        }
        
        // For rect elements
        if (element.tagName === 'rect') {
          const x = parseFloat(element.getAttribute('x') || 0);
          const y = parseFloat(element.getAttribute('y') || 0);
          const w = parseFloat(element.getAttribute('width') || 0);
          const h = parseFloat(element.getAttribute('height') || 0);
          
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + w);
          maxY = Math.max(maxY, y + h);
          hasValidBounds = true;
        }

        // For circle elements
        if (element.tagName === 'circle') {
          const cx = parseFloat(element.getAttribute('cx') || 0);
          const cy = parseFloat(element.getAttribute('cy') || 0);
          const r = parseFloat(element.getAttribute('r') || 0);
          
          minX = Math.min(minX, cx - r);
          minY = Math.min(minY, cy - r);
          maxX = Math.max(maxX, cx + r);
          maxY = Math.max(maxY, cy + r);
          hasValidBounds = true;
        }
      });

      if (hasValidBounds) {
        // Add padding around content
        const padding = 50;
        const newX = minX - padding;
        const newY = minY - padding;
        const newWidth = (maxX - minX) + (2 * padding);
        const newHeight = (maxY - minY) + (2 * padding);

        // Ensure minimum dimensions
        const finalWidth = Math.max(newWidth, 800);
        const finalHeight = Math.max(newHeight, 600);

        svg.setAttribute('viewBox', `${newX} ${newY} ${finalWidth} ${finalHeight}`);
        svg.setAttribute('width', finalWidth.toString());
        svg.setAttribute('height', finalHeight.toString());

        return true;
      }
    } catch (error) {
      console.log(`    ⚠️  Could not fix viewBox: ${error.message}`);
    }
    return false;
  }

  fixTextOverlaps(svg, document) {
    try {
      const textElements = Array.from(svg.querySelectorAll('text'));
      let adjustmentsMade = false;

      // Simple overlap resolution: adjust y-position of overlapping texts
      for (let i = 0; i < textElements.length; i++) {
        for (let j = i + 1; j < textElements.length; j++) {
          const text1 = textElements[i];
          const text2 = textElements[j];

          const x1 = parseFloat(text1.getAttribute('x') || 0);
          const y1 = parseFloat(text1.getAttribute('y') || 0);
          const x2 = parseFloat(text2.getAttribute('x') || 0);
          const y2 = parseFloat(text2.getAttribute('y') || 0);

          // Estimate text dimensions
          const width1 = (text1.textContent || '').length * 8;
          const width2 = (text2.textContent || '').length * 8;
          const height = 16;

          // Check for overlap
          if (x1 < x2 + width2 && x1 + width1 > x2 && 
              Math.abs(y1 - y2) < height) {
            // Adjust the second text element's position
            const newY = y2 + (y2 > y1 ? 25 : -25);
            text2.setAttribute('y', newY.toString());
            adjustmentsMade = true;
          }
        }
      }

      return adjustmentsMade;
    } catch (error) {
      console.log(`    ⚠️  Could not fix text overlaps: ${error.message}`);
      return false;
    }
  }

  standardizeDimensions(svg) {
    // Ensure SVG has proper xmlns
    if (!svg.getAttribute('xmlns')) {
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }

    // Add version if missing
    if (!svg.getAttribute('version')) {
      svg.setAttribute('version', '1.1');
    }
  }

  generateTitle(filename) {
    const name = path.basename(filename, '.svg');
    return name.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  generateDescription(filename) {
    const name = path.basename(filename, '.svg');
    const topics = {
      'authentication': 'Authentication methods and verification processes',
      'encryption': 'Encryption algorithms and cryptographic techniques',
      'security': 'Security frameworks and protection mechanisms',
      'network': 'Network security and communication protocols',
      'cipher': 'Cipher techniques and cryptographic algorithms',
      'firewall': 'Firewall architectures and network protection',
      'vpn': 'Virtual Private Network technologies and implementations',
      'cia': 'Confidentiality, Integrity, and Availability security principles',
      'ssl': 'Secure Sockets Layer and encryption protocols',
      'ssh': 'Secure Shell protocol and remote access'
    };

    for (const [key, description] of Object.entries(topics)) {
      if (name.includes(key)) {
        return `Diagram illustrating ${description}`;
      }
    }

    return `Technical diagram showing ${this.generateTitle(filename).toLowerCase()}`;
  }

  async fixCriticalFiles() {
    const criticalFiles = this.report.details
      .filter(detail => detail.issues && detail.issues.length >= 10)
      .sort((a, b) => b.issues.length - a.issues.length);

    console.log(`🚨 Fixing ${criticalFiles.length} critical files with 10+ issues...\n`);

    for (const fileDetail of criticalFiles) {
      await this.fixSVGFile(fileDetail.file, fileDetail.issues);
    }
  }

  async fixAllFiles() {
    const allFilesWithIssues = this.report.details
      .filter(detail => detail.issues && detail.issues.length > 0)
      .sort((a, b) => b.issues.length - a.issues.length);

    console.log(`🔧 Fixing ${allFilesWithIssues.length} files with issues...\n`);

    for (const fileDetail of allFilesWithIssues) {
      await this.fixSVGFile(fileDetail.file, fileDetail.issues);
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async run(mode = 'critical') {
    try {
      await this.initialize();

      if (mode === 'all') {
        await this.fixAllFiles();
      } else {
        await this.fixCriticalFiles();
      }

      console.log('\n🎉 SVG Auto-Fixer Complete!');
      console.log(`✅ Files fixed: ${this.fixedCount}`);
      console.log(`❌ Errors: ${this.errorCount}`);
      console.log(`📁 Backups saved to: ${this.backupDir}`);

      if (this.fixedCount > 0) {
        console.log('\n🔄 Run svg-visual-inspector.js again to verify fixes!');
      }

    } catch (error) {
      console.error('💥 Fatal error:', error.message);
      process.exit(1);
    }
  }
}

// Run the fixer
const mode = process.argv[2] || 'critical'; // 'critical' or 'all'
const fixer = new SVGAutoFixer();
fixer.run(mode);
