#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class SVGDiagnosticTool {
  constructor() {
    this.diagramsPath = '/Users/milav/Code/studio/diagrams';
  }

  async diagnoseSingleFile(filename) {
    const filePath = path.join(this.diagramsPath, filename);
    const svgContent = fs.readFileSync(filePath, 'utf8');
    
    console.log(`\n🔍 DETAILED DIAGNOSTIC: ${filename}`);
    console.log('='.repeat(60));
    
    try {
      const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
      const document = dom.window.document;
      const svg = document.querySelector('svg');
      
      if (!svg) {
        console.log('❌ No SVG element found');
        return;
      }

      // Basic SVG properties
      const width = svg.getAttribute('width');
      const height = svg.getAttribute('height'); 
      const viewBox = svg.getAttribute('viewBox');
      
      console.log(`📐 SVG Dimensions:`);
      console.log(`   Width: ${width || 'not set'}`);
      console.log(`   Height: ${height || 'not set'}`);
      console.log(`   ViewBox: ${viewBox || 'not set'}`);
      
      if (viewBox) {
        const [vx, vy, vw, vh] = viewBox.split(' ').map(Number);
        console.log(`   Parsed ViewBox: x=${vx}, y=${vy}, width=${vw}, height=${vh}`);
      }

      // Element analysis
      const textElements = Array.from(svg.querySelectorAll('text'));
      const rectElements = Array.from(svg.querySelectorAll('rect'));
      const circleElements = Array.from(svg.querySelectorAll('circle'));
      
      console.log(`\n📊 Element Count:`);
      console.log(`   Text elements: ${textElements.length}`);
      console.log(`   Rectangle elements: ${rectElements.length}`);
      console.log(`   Circle elements: ${circleElements.length}`);

      // Detailed text analysis
      console.log(`\n📝 Text Element Analysis:`);
      if (textElements.length > 0) {
        textElements.slice(0, 10).forEach((text, index) => {
          const x = text.getAttribute('x') || 0;
          const y = text.getAttribute('y') || 0;
          const content = text.textContent?.trim() || '';
          const fontSize = text.getAttribute('font-size') || 'default';
          
          console.log(`   [${index}] Position: (${x}, ${y}), Size: ${fontSize}, Text: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`);
        });
        
        if (textElements.length > 10) {
          console.log(`   ... and ${textElements.length - 10} more text elements`);
        }
      }

      // Check for potential issues
      console.log(`\n⚠️  Potential Issues:`);
      
      // Issue 1: Missing viewBox
      if (!viewBox) {
        console.log(`   • Missing viewBox - this can cause scaling issues`);
        console.log(`     Suggestion: Add viewBox="0 0 ${width || 800} ${height || 600}"`);
      }

      // Issue 2: Text positioning analysis
      if (viewBox && textElements.length > 0) {
        const [vx, vy, vw, vh] = viewBox.split(' ').map(Number);
        let outsideElements = 0;
        
        textElements.forEach((text, index) => {
          const x = parseFloat(text.getAttribute('x') || 0);
          const y = parseFloat(text.getAttribute('y') || 0);
          
          if (x < vx || y < vy || x > vx + vw || y > vy + vh) {
            outsideElements++;
            if (outsideElements <= 3) {
              console.log(`   • Text element [${index}] at (${x}, ${y}) is outside viewBox bounds`);
            }
          }
        });
        
        if (outsideElements > 3) {
          console.log(`   • ... and ${outsideElements - 3} more elements outside viewBox`);
        }
        
        if (outsideElements > 0) {
          console.log(`   Suggestion: Consider expanding viewBox to "0 0 ${Math.max(vw, vw + 100)} ${Math.max(vh, vh + 100)}"`);
        }
      }

      // Issue 3: Overlapping text detection (simplified)
      if (textElements.length > 1) {
        let overlaps = 0;
        for (let i = 0; i < Math.min(textElements.length, 20); i++) {
          for (let j = i + 1; j < Math.min(textElements.length, 20); j++) {
            const x1 = parseFloat(textElements[i].getAttribute('x') || 0);
            const y1 = parseFloat(textElements[i].getAttribute('y') || 0);
            const x2 = parseFloat(textElements[j].getAttribute('x') || 0);
            const y2 = parseFloat(textElements[j].getAttribute('y') || 0);
            
            const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            if (distance < 20) { // Very close elements
              overlaps++;
              if (overlaps <= 3) {
                console.log(`   • Text elements [${i}] and [${j}] are very close (distance: ${distance.toFixed(1)})`);
              }
            }
          }
        }
        
        if (overlaps > 3) {
          console.log(`   • ... and ${overlaps - 3} more potential overlaps detected`);
        }
      }

      // Issue 4: Accessibility
      const title = svg.querySelector('title');
      const desc = svg.querySelector('desc');
      
      if (!title) {
        console.log(`   • Missing <title> element for accessibility`);
        console.log(`     Suggestion: Add <title>${filename.replace('.svg', '').replace(/-/g, ' ')}</title>`);
      }
      
      if (!desc) {
        console.log(`   • Missing <desc> element for detailed description`);
      }

      // Recommendations
      console.log(`\n💡 Recommended Actions:`);
      
      if (!viewBox) {
        console.log(`   1. Add viewBox attribute`);
      }
      
      if (outsideElements > 0) {
        console.log(`   2. Expand viewBox or reposition ${outsideElements} text elements`);
      }
      
      if (overlaps > 0) {
        console.log(`   3. Review and adjust spacing for ${overlaps} potentially overlapping elements`);
      }
      
      if (!title) {
        console.log(`   4. Add accessibility title element`);
      }

      return {
        filename,
        issues: {
          noViewBox: !viewBox,
          outsideElements,
          overlaps,
          noTitle: !title,
          noDesc: !desc
        },
        elementCounts: {
          text: textElements.length,
          rect: rectElements.length,
          circle: circleElements.length
        }
      };

    } catch (error) {
      console.log(`❌ Error analyzing ${filename}: ${error.message}`);
      return null;
    }
  }

  async diagnoseTopProblems() {
    // Focus on the most problematic files
    const problemFiles = [
      'security-services-mechanisms.svg',
      'risk-assessment-process.svg', 
      'multi-factor-authentication.svg',
      'types-of-security-attacks.svg',
      'common-symmetric-encryption-algorithms.svg'
    ];

    console.log('🏥 SVG DIAGNOSTIC TOOL');
    console.log('Focusing on the most problematic files for manual review\n');

    const results = [];
    
    for (const filename of problemFiles) {
      const result = await this.diagnoseSingleFile(filename);
      if (result) {
        results.push(result);
      }
      console.log('\n' + '-'.repeat(60));
    }

    // Summary recommendations
    console.log('\n🎯 SUMMARY RECOMMENDATIONS:');
    console.log('Rather than automated fixes, consider these manual approaches:');
    console.log('1. Open each SVG in a text editor or SVG tool');
    console.log('2. Check the viewBox dimensions against actual content');
    console.log('3. Manually adjust text positioning for better spacing');
    console.log('4. Add proper accessibility elements');
    console.log('5. Test visual appearance in browser after each change');

    return results;
  }
}

// Install jsdom if not available
const checkJSDOM = () => {
  try {
    require('jsdom');
    return true;
  } catch (error) {
    console.log('Installing jsdom dependency...');
    const { execSync } = require('child_process');
    try {
      execSync('npm install jsdom', { stdio: 'inherit' });
      return true;
    } catch (installError) {
      console.log('❌ Failed to install jsdom. Please run: npm install jsdom');
      return false;
    }
  }
};

// Run the diagnostic
if (require.main === module) {
  if (checkJSDOM()) {
    const diagnostic = new SVGDiagnosticTool();
    diagnostic.diagnoseTopProblems();
  }
}

module.exports = { SVGDiagnosticTool };
