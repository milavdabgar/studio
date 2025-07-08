#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

class SVGVisualInspector {
  constructor() {
    this.browser = null;
    this.page = null;
    this.issues = [];
    this.diagramsPath = '/Users/milav/Code/studio/diagrams';
    this.outputDir = '/Users/milav/Code/studio/svg-inspection-results';
  }

  async initialize() {
    console.log('🚀 Initializing SVG Visual Inspector...');
    
    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1200, height: 1000 });
  }

  async inspectSVG(svgFile) {
    const filePath = path.join(this.diagramsPath, svgFile);
    const fileUrl = `file://${filePath}`;
    
    console.log(`📊 Inspecting: ${svgFile}`);
    
    try {
      await this.page.goto(fileUrl, { waitUntil: 'networkidle0' });
      
      // Take screenshot
      const screenshotPath = path.join(this.outputDir, `${path.basename(svgFile, '.svg')}.png`);
      await this.page.screenshot({ 
        path: screenshotPath,
        fullPage: true,
        type: 'png'
      });

      // Analyze SVG structure
      const analysis = await this.page.evaluate(() => {
        const svg = document.querySelector('svg');
        if (!svg) return { error: 'No SVG element found' };

        const viewBox = svg.getAttribute('viewBox');
        const width = svg.getAttribute('width');
        const height = svg.getAttribute('height');
        
        // Check for overlapping elements
        const texts = Array.from(document.querySelectorAll('text'));
        const rects = Array.from(document.querySelectorAll('rect'));
        const circles = Array.from(document.querySelectorAll('circle'));
        const ellipses = Array.from(document.querySelectorAll('ellipse'));
        
        // Analyze text positioning issues
        const textIssues = [];
        texts.forEach((text, index) => {
          const bbox = text.getBBox();
          if (bbox.width === 0 || bbox.height === 0) {
            textIssues.push(`Text element ${index} has zero dimensions`);
          }
          
          // Check if text is outside viewBox
          if (viewBox) {
            const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
            if (bbox.x < 0 || bbox.y < 0 || bbox.x + bbox.width > vbWidth || bbox.y + bbox.height > vbHeight) {
              textIssues.push(`Text element ${index} is outside viewBox bounds`);
            }
          }
        });

        // Check for overlapping elements (simplified check)
        const overlaps = [];
        for (let i = 0; i < texts.length; i++) {
          for (let j = i + 1; j < texts.length; j++) {
            const bbox1 = texts[i].getBBox();
            const bbox2 = texts[j].getBBox();
            
            if (bbox1.x < bbox2.x + bbox2.width &&
                bbox1.x + bbox1.width > bbox2.x &&
                bbox1.y < bbox2.y + bbox2.height &&
                bbox1.y + bbox1.height > bbox2.y) {
              overlaps.push(`Text elements ${i} and ${j} may be overlapping`);
            }
          }
        }

        return {
          dimensions: { width, height, viewBox },
          elementCounts: {
            texts: texts.length,
            rectangles: rects.length,
            circles: circles.length,
            ellipses: ellipses.length
          },
          textIssues,
          overlaps: overlaps.slice(0, 5), // Limit to first 5 overlaps
          hasTitle: !!document.querySelector('title'),
          hasDescription: !!document.querySelector('desc')
        };
      });

      return {
        file: svgFile,
        screenshot: screenshotPath,
        analysis,
        status: 'success'
      };

    } catch (error) {
      console.error(`❌ Error inspecting ${svgFile}:`, error.message);
      return {
        file: svgFile,
        error: error.message,
        status: 'error'
      };
    }
  }

  async inspectAllSVGs() {
    const svgFiles = fs.readdirSync(this.diagramsPath)
      .filter(file => file.endsWith('.svg'))
      .sort();

    console.log(`📋 Found ${svgFiles.length} SVG files to inspect`);

    const results = [];
    let processed = 0;

    for (const svgFile of svgFiles) {
      const result = await this.inspectSVG(svgFile);
      results.push(result);
      
      processed++;
      console.log(`✅ Progress: ${processed}/${svgFiles.length} (${Math.round(processed/svgFiles.length*100)}%)`);
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  generateReport(results) {
    console.log('📝 Generating inspection report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: results.length,
      successful: results.filter(r => r.status === 'success').length,
      errors: results.filter(r => r.status === 'error').length,
      summary: {
        filesWithTextIssues: 0,
        filesWithOverlaps: 0,
        filesWithoutTitles: 0,
        totalTextElements: 0,
        totalRectElements: 0
      },
      details: []
    };

    // Process results and update summary
    results.forEach(result => {
      if (result.status === 'success') {
        const analysis = result.analysis;
        
        // Update summary
        if (analysis.textIssues && analysis.textIssues.length > 0) {
          report.summary.filesWithTextIssues++;
        }
        if (analysis.overlaps && analysis.overlaps.length > 0) {
          report.summary.filesWithOverlaps++;
        }
        if (!analysis.hasTitle) {
          report.summary.filesWithoutTitles++;
        }
        
        report.summary.totalTextElements += analysis.elementCounts.texts;
        report.summary.totalRectElements += analysis.elementCounts.rectangles;

        report.details.push({
          file: result.file,
          screenshot: path.basename(result.screenshot),
          dimensions: analysis.dimensions,
          elements: analysis.elementCounts,
          issues: [
            ...analysis.textIssues || [],
            ...analysis.overlaps || []
          ],
          hasTitle: analysis.hasTitle,
          hasDescription: analysis.hasDescription
        });
      } else {
        report.details.push({
          file: result.file,
          error: result.error
        });
      }
    });

    // Save report
    const reportPath = path.join(this.outputDir, 'inspection-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    this.generateHTMLReport(report);

    return report;
  }

  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>SVG Visual Inspection Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .file-result { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .success { border-left: 5px solid #4CAF50; }
        .error { border-left: 5px solid #f44336; }
        .warning { border-left: 5px solid #ff9800; }
        .screenshot { max-width: 300px; margin: 10px 0; }
        .issues { background: #fff3cd; padding: 10px; border-radius: 3px; margin: 10px 0; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .stat-card { background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <h1>SVG Visual Inspection Report</h1>
    <p>Generated: ${report.timestamp}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <div class="stats">
            <div class="stat-card">
                <h3>Files Processed</h3>
                <p>${report.totalFiles} total</p>
                <p>${report.successful} successful</p>
                <p>${report.errors} errors</p>
            </div>
            <div class="stat-card">
                <h3>Issues Found</h3>
                <p>${report.summary.filesWithTextIssues} files with text issues</p>
                <p>${report.summary.filesWithOverlaps} files with overlaps</p>
                <p>${report.summary.filesWithoutTitles} files without titles</p>
            </div>
            <div class="stat-card">
                <h3>Elements</h3>
                <p>${report.summary.totalTextElements} text elements</p>
                <p>${report.summary.totalRectElements} rectangle elements</p>
            </div>
        </div>
    </div>

    <h2>Detailed Results</h2>
    ${report.details.map(detail => {
      if (detail.error) {
        return `
          <div class="file-result error">
              <h3>${detail.file}</h3>
              <p><strong>Error:</strong> ${detail.error}</p>
          </div>
        `;
      } else {
        const hasIssues = detail.issues && detail.issues.length > 0;
        const cssClass = hasIssues ? 'warning' : 'success';
        
        return `
          <div class="file-result ${cssClass}">
              <h3>${detail.file}</h3>
              ${detail.screenshot ? `<img src="${detail.screenshot}" class="screenshot" alt="Screenshot of ${detail.file}">` : ''}
              <p><strong>Dimensions:</strong> ${detail.dimensions.width} x ${detail.dimensions.height}</p>
              <p><strong>ViewBox:</strong> ${detail.dimensions.viewBox || 'Not specified'}</p>
              <p><strong>Elements:</strong> ${detail.elements.texts} texts, ${detail.elements.rectangles} rectangles, ${detail.elements.circles} circles</p>
              <p><strong>Has Title:</strong> ${detail.hasTitle ? 'Yes' : 'No'}</p>
              
              ${hasIssues ? `
                <div class="issues">
                    <h4>Issues Found:</h4>
                    <ul>
                        ${detail.issues.map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                </div>
              ` : '<p style="color: green;">✅ No issues detected</p>'}
          </div>
        `;
      }
    }).join('')}
</body>
</html>
    `;

    const htmlPath = path.join(this.outputDir, 'inspection-report.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`📄 HTML report saved to: ${htmlPath}`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      const results = await this.inspectAllSVGs();
      const report = this.generateReport(results);
      
      console.log('\n🎉 Inspection Complete!');
      console.log(`📊 Processed: ${report.totalFiles} files`);
      console.log(`✅ Successful: ${report.successful}`);
      console.log(`❌ Errors: ${report.errors}`);
      console.log(`⚠️  Files with issues: ${report.summary.filesWithTextIssues + report.summary.filesWithOverlaps}`);
      console.log(`📁 Results saved to: ${this.outputDir}`);
      
    } catch (error) {
      console.error('💥 Fatal error:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the inspector
const inspector = new SVGVisualInspector();
inspector.run();
