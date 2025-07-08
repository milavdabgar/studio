#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

class RealSVGVisualFixer {
  constructor() {
    this.diagramsPath = '/Users/milav/Code/studio/diagrams';
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('🔧 Starting REAL Visual SVG Improvements...\n');
    
    this.browser = await puppeteer.launch({
      headless: false, // Show browser so we can see what's happening
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1400, height: 1000 });
  }

  async analyzeRealVisualIssues(svgFile) {
    const filePath = path.join(this.diagramsPath, svgFile);
    const fileUrl = `file://${filePath}`;
    
    console.log(`🔍 Analyzing real visual issues in: ${svgFile}`);
    
    try {
      await this.page.goto(fileUrl, { waitUntil: 'networkidle0' });
      
      // Real visual analysis using computed styles and actual rendering
      const analysis = await this.page.evaluate(() => {
        const svg = document.querySelector('svg');
        if (!svg) return { error: 'No SVG found' };

        const issues = [];
        const improvements = [];
        
        // Get the actual rendered bounding box
        const svgRect = svg.getBoundingClientRect();
        
        // Find text elements that are actually cut off or poorly positioned
        const textElements = Array.from(svg.querySelectorAll('text'));
        
        textElements.forEach((text, index) => {
          const textRect = text.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(text);
          
          // Check if text is actually clipped (not just theoretically outside viewBox)
          const isClipped = (
            textRect.right > svgRect.right || 
            textRect.left < svgRect.left ||
            textRect.bottom > svgRect.bottom ||
            textRect.top < svgRect.top
          );
          
          if (isClipped) {
            issues.push(`Text "${text.textContent}" is actually clipped/cut off`);
            improvements.push(`Adjust position or expand canvas for text: "${text.textContent}"`);
          }
          
          // Check for invisible or zero-size text
          if (textRect.width === 0 || textRect.height === 0) {
            issues.push(`Text "${text.textContent}" has zero dimensions`);
            improvements.push(`Fix styling for invisible text: "${text.textContent}"`);
          }
          
          // Check for poor contrast (text same color as background)
          const textColor = computedStyle.fill || computedStyle.color;
          if (textColor === 'rgb(255, 255, 255)' || textColor === '#ffffff') {
            const parent = text.closest('rect, circle, ellipse, polygon');
            if (parent) {
              const parentStyle = window.getComputedStyle(parent);
              const parentFill = parentStyle.fill;
              if (parentFill === 'rgb(255, 255, 255)' || parentFill === '#ffffff') {
                issues.push(`White text on white background: "${text.textContent}"`);
                improvements.push(`Change text or background color for: "${text.textContent}"`);
              }
            }
          }
        });
        
        // Check for overlapping visual elements (using actual rendered positions)
        const allElements = Array.from(svg.querySelectorAll('rect, circle, ellipse, text, path'));
        const overlaps = [];
        
        for (let i = 0; i < allElements.length; i++) {
          for (let j = i + 1; j < allElements.length; j++) {
            const rect1 = allElements[i].getBoundingClientRect();
            const rect2 = allElements[j].getBoundingClientRect();
            
            // Check for significant overlap (more than 50% of smaller element)
            const overlapX = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
            const overlapY = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
            const overlapArea = overlapX * overlapY;
            
            const area1 = rect1.width * rect1.height;
            const area2 = rect2.width * rect2.height;
            const smallerArea = Math.min(area1, area2);
            
            if (overlapArea > smallerArea * 0.5) { // More than 50% overlap
              overlaps.push({
                element1: allElements[i].tagName + (allElements[i].textContent ? ` ("${allElements[i].textContent.substring(0, 20)}")` : ''),
                element2: allElements[j].tagName + (allElements[j].textContent ? ` ("${allElements[j].textContent.substring(0, 20)}")` : ''),
                overlapPercentage: Math.round((overlapArea / smallerArea) * 100)
              });
            }
          }
        }
        
        // Check for elements that are too small to read
        textElements.forEach(text => {
          const rect = text.getBoundingClientRect();
          const fontSize = parseInt(window.getComputedStyle(text).fontSize) || 0;
          
          if (fontSize < 10 || rect.height < 8) {
            issues.push(`Text too small to read: "${text.textContent}"`);
            improvements.push(`Increase font size for: "${text.textContent}"`);
          }
        });
        
        return {
          realIssues: issues,
          suggestedImprovements: improvements,
          significantOverlaps: overlaps,
          svgDimensions: {
            width: svgRect.width,
            height: svgRect.height
          },
          elementCounts: {
            texts: textElements.length,
            shapes: allElements.length - textElements.length
          }
        };
      });

      return {
        file: svgFile,
        analysis,
        status: 'success'
      };

    } catch (error) {
      console.error(`❌ Error analyzing ${svgFile}:`, error.message);
      return {
        file: svgFile,
        error: error.message,
        status: 'error'
      };
    }
  }

  async fixRealIssues(svgFile, analysis) {
    if (!analysis.realIssues || analysis.realIssues.length === 0) {
      console.log(`✅ ${svgFile} - No real visual issues to fix`);
      return false;
    }

    console.log(`🔧 Fixing real issues in ${svgFile}:`);
    analysis.realIssues.forEach(issue => console.log(`  - ${issue}`));

    const filePath = path.join(this.diagramsPath, svgFile);
    let svgContent = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix 1: Expand canvas if elements are actually clipped
    if (analysis.realIssues.some(issue => issue.includes('clipped'))) {
      const currentViewBox = svgContent.match(/viewBox="([^"]+)"/);
      if (currentViewBox) {
        const [x, y, width, height] = currentViewBox[1].split(' ').map(Number);
        const newWidth = Math.max(width, analysis.svgDimensions.width + 100);
        const newHeight = Math.max(height, analysis.svgDimensions.height + 100);
        
        svgContent = svgContent.replace(
          /viewBox="[^"]+"/,
          `viewBox="${x} ${y} ${newWidth} ${newHeight}"`
        );
        modified = true;
        console.log(`  ✓ Expanded viewBox to ${newWidth}x${newHeight}`);
      }
    }

    // Fix 2: Increase font size for tiny text
    if (analysis.realIssues.some(issue => issue.includes('too small'))) {
      svgContent = svgContent.replace(/font-size:\s*([0-9]+)px/g, (match, size) => {
        const currentSize = parseInt(size);
        if (currentSize < 12) {
          modified = true;
          return `font-size: 12px`;
        }
        return match;
      });
      
      svgContent = svgContent.replace(/font-size="([0-9]+)"/g, (match, size) => {
        const currentSize = parseInt(size);
        if (currentSize < 12) {
          modified = true;
          return `font-size="12"`;
        }
        return match;
      });
      
      if (modified) {
        console.log(`  ✓ Increased minimum font size to 12px`);
      }
    }

    // Fix 3: Add titles if missing
    if (!svgContent.includes('<title>')) {
      const titleText = svgFile.replace('.svg', '').replace(/-/g, ' ');
      svgContent = svgContent.replace(
        /(<svg[^>]*>)/,
        `$1\n  <title>${titleText}</title>`
      );
      modified = true;
      console.log(`  ✓ Added accessibility title`);
    }

    if (modified) {
      fs.writeFileSync(filePath, svgContent);
      console.log(`✅ Fixed real issues in ${svgFile}`);
      return true;
    }

    return false;
  }

  async run() {
    try {
      await this.initialize();
      
      const svgFiles = fs.readdirSync(this.diagramsPath)
        .filter(file => file.endsWith('.svg'))
        .sort(); // Process all files
      
      console.log(`🎯 Analyzing ${svgFiles.length} SVG files for REAL visual issues...\n`);
      
      const results = [];
      let fixedCount = 0;
      
      for (const svgFile of svgFiles) {
        const analysis = await this.analyzeRealVisualIssues(svgFile);
        results.push(analysis);
        
        if (analysis.status === 'success' && analysis.analysis.realIssues.length > 0) {
          const wasFixed = await this.fixRealIssues(svgFile, analysis.analysis);
          if (wasFixed) fixedCount++;
        }
        
        // Small delay between files
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`\n🎉 Real Visual Improvements Complete!`);
      console.log(`📊 Files analyzed: ${results.length}`);
      console.log(`🔧 Files with real fixes applied: ${fixedCount}`);
      
      // Summary of real issues found
      const allIssues = results
        .filter(r => r.status === 'success')
        .flatMap(r => r.analysis.realIssues);
      
      if (allIssues.length > 0) {
        console.log(`\n🚨 Real issues found:`);
        allIssues.forEach(issue => console.log(`  - ${issue}`));
      } else {
        console.log(`\n✅ Great news! No real visual issues detected in the analyzed files.`);
      }
      
    } catch (error) {
      console.error('💥 Fatal error:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the real visual fixer
const fixer = new RealSVGVisualFixer();
fixer.run();
