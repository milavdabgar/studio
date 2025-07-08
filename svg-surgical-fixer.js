#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class SVGSurgicalFixer {
  constructor() {
    this.diagramsPath = '/Users/milav/Code/studio/diagrams';
  }

  fixSingleFile(filename) {
    const filePath = path.join(this.diagramsPath, filename);
    const originalContent = fs.readFileSync(filePath, 'utf8');
    
    console.log(`🔧 Fixing: ${filename}`);
    
    // Strategy 1: Fix negative Y coordinates by adjusting viewBox
    // Instead of changing all text positions, expand viewBox to include negative space
    
    let fixedContent = originalContent;
    
    // Find current viewBox
    const viewBoxMatch = fixedContent.match(/viewBox="([^"]+)"/);
    if (viewBoxMatch) {
      const [vx, vy, vw, vh] = viewBoxMatch[1].split(' ').map(Number);
      
      // Check if we have negative Y coordinates
      const negativeYMatches = fixedContent.match(/y="-\d+"/g);
      if (negativeYMatches) {
        const minY = Math.min(...negativeYMatches.map(match => {
          const y = parseInt(match.match(/-(\d+)/)[1]);
          return -y;
        }));
        
        console.log(`   Found negative Y coordinates, minimum: ${minY}`);
        
        // Expand viewBox to include negative space
        const newVY = Math.min(vy, minY - 10); // Add 10px padding
        const newVH = vh + (vy - newVY); // Increase height accordingly
        
        const newViewBox = `${vx} ${newVY} ${vw} ${newVH}`;
        fixedContent = fixedContent.replace(
          /viewBox="[^"]+"/,
          `viewBox="${newViewBox}"`
        );
        
        console.log(`   Updated viewBox: "${viewBoxMatch[1]}" → "${newViewBox}"`);
      }
    }
    
    // Strategy 2: Add title element for accessibility
    if (!fixedContent.includes('<title>')) {
      const titleText = filename.replace('.svg', '').replace(/-/g, ' ');
      const titleElement = `  <title>${titleText}</title>\n`;
      
      // Insert after the opening <svg> tag
      fixedContent = fixedContent.replace(
        /(<svg[^>]*>)/,
        `$1\n${titleElement}`
      );
      
      console.log(`   Added title: "${titleText}"`);
    }
    
    // Strategy 3: Fix text elements that are positioned at exactly (0, negative)
    // These are likely meant to be positioned relative to their parent group
    const problematicTextPattern = /(<text x="0" y="-\d+"[^>]*>)/g;
    const problematicTexts = fixedContent.match(problematicTextPattern);
    
    if (problematicTexts) {
      console.log(`   Found ${problematicTexts.length} text elements at (0, negative)`);
      
      // For text at (0, -10), this suggests they should be positioned relative to their container
      // We'll leave them as-is since expanding viewBox should make them visible
    }
    
    // Write the fixed content
    if (fixedContent !== originalContent) {
      fs.writeFileSync(filePath, fixedContent);
      console.log(`   ✅ Fixed and saved`);
      return true;
    } else {
      console.log(`   ⏭️  No changes needed`);
      return false;
    }
  }

  fixCriticalFiles() {
    const criticalFiles = [
      'security-services-mechanisms.svg',
      'risk-assessment-process.svg',
      'multi-factor-authentication.svg',
      'types-of-security-attacks.svg',
      'common-symmetric-encryption-algorithms.svg',
      'common-asymmetric-encryption-algorithms.svg',
      'types-of-security-threats.svg',
      'route-cipher.svg'
    ];

    console.log('🏥 SVG SURGICAL FIXER');
    console.log('Applying targeted fixes to critical files\n');

    let fixedCount = 0;
    
    for (const filename of criticalFiles) {
      const filePath = path.join(this.diagramsPath, filename);
      if (fs.existsSync(filePath)) {
        if (this.fixSingleFile(filename)) {
          fixedCount++;
        }
      } else {
        console.log(`⚠️  File not found: ${filename}`);
      }
      console.log('');
    }

    console.log(`🎉 Surgical fixes completed!`);
    console.log(`📊 Files fixed: ${fixedCount}/${criticalFiles.length}`);
    console.log('\n💡 What was fixed:');
    console.log('• Expanded viewBox to include negative Y coordinates');
    console.log('• Added accessibility title elements');
    console.log('• Preserved original text positioning');
    console.log('\n✅ Changes are minimal and surgical - no layout disruption');
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new SVGSurgicalFixer();
  fixer.fixCriticalFiles();
}

module.exports = { SVGSurgicalFixer };
