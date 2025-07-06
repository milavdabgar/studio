#!/usr/bin/env node

/**
 * Script to rename newsletter images with descriptive names based on their context
 * This makes images easier to manage and understand in the future
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DOWNLOAD_DIR = path.join(__dirname, '..', 'public', 'newsletters');
const NEWSLETTER_DATA_DIR = path.join(__dirname, '..', 'src', 'lib', 'newsletter-data');

// Helper function to create safe filename
function createSafeFilename(eventTitle, eventDate, imageIndex, originalExtension, imageCaption = '') {
  // Extract year from date
  const year = eventDate ? eventDate.match(/\d{4}/)?.[0] || '' : '';
  
  // Clean and format title
  let safeName = eventTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 40); // Limit length
  
  // Add specific context from caption if available
  if (imageCaption) {
    const captionContext = imageCaption
      .toLowerCase()
      .replace(/[^a-z0-9\s\-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 20);
    
    if (captionContext && !safeName.includes(captionContext)) {
      safeName += `-${captionContext}`;
    }
  }
  
  // Format: event-name-YYYY-image-N.ext
  const imageNumber = String(imageIndex + 1).padStart(2, '0');
  return `${safeName}-${year}-image-${imageNumber}${originalExtension}`;
}

// Extract image context from newsletter data
function extractImageContexts() {
  const imageContexts = new Map();
  
  const dataFiles = fs.readdirSync(NEWSLETTER_DATA_DIR)
    .filter(file => file.endsWith('.ts'))
    .map(file => path.join(NEWSLETTER_DATA_DIR, file));
  
  for (const file of dataFiles) {
    console.log(`📖 Analyzing ${path.basename(file)}...`);
    
    const content = fs.readFileSync(file, 'utf8');
    const academicYear = path.basename(file, '.ts');
    
    // Extract events/activities with their images
    try {
      // Use regex to find event objects with images
      const eventPattern = /{[^}]*title:\s*['"`]([^'"`]+)['"`][^}]*date:\s*['"`]([^'"`]+)['"`][^}]*images:\s*\[[^\]]*\]/g;
      let eventMatch;
      
      while ((eventMatch = eventPattern.exec(content)) !== null) {
        const eventTitle = eventMatch[1];
        const eventDate = eventMatch[2];
        
        // Find images within this event
        const imagePattern = /src:\s*['"`]([^'"`]+)['"`][^}]*alt:\s*['"`]([^'"`]*)['"`][^}]*caption:\s*['"`]([^'"`]*)['"`]/g;
        const eventSection = eventMatch[0];
        
        let imageMatch;
        let imageIndex = 0;
        
        while ((imageMatch = imagePattern.exec(eventSection)) !== null) {
          const imagePath = imageMatch[1];
          const imageAlt = imageMatch[2] || '';
          const imageCaption = imageMatch[3] || '';
          
          if (imagePath.startsWith('/newsletters/')) {
            const fullPath = path.join(__dirname, '..', 'public', imagePath);
            
            if (fs.existsSync(fullPath)) {
              const extension = path.extname(imagePath);
              const newName = createSafeFilename(eventTitle, eventDate, imageIndex, extension, imageCaption);
              
              imageContexts.set(imagePath, {
                currentPath: fullPath,
                newName: newName,
                eventTitle: eventTitle,
                eventDate: eventDate,
                imageAlt: imageAlt,
                imageCaption: imageCaption,
                academicYear: academicYear,
                imageIndex: imageIndex
              });
              
              imageIndex++;
            }
          }
        }
      }
      
      // Also handle logos and standalone images
      const logoPattern = /src:\s*['"`]([^'"`]*\/newsletters\/[^'"`]+)['"`]/g;
      let logoMatch;
      
      while ((logoMatch = logoPattern.exec(content)) !== null) {
        const imagePath = logoMatch[1];
        const fullPath = path.join(__dirname, '..', 'public', imagePath);
        
        if (fs.existsSync(fullPath) && !imageContexts.has(imagePath)) {
          const filename = path.basename(imagePath);
          const extension = path.extname(imagePath);
          
          // Keep logos and special images with their original names
          if (filename.includes('logo') || filename.includes('gpp') || filename.includes('ec')) {
            imageContexts.set(imagePath, {
              currentPath: fullPath,
              newName: filename, // Keep original name for logos
              eventTitle: 'Logo/Branding',
              eventDate: '',
              imageAlt: 'Logo',
              imageCaption: 'Logo',
              academicYear: academicYear,
              imageIndex: 0
            });
          }
        }
      }
      
    } catch (error) {
      console.warn(`⚠️  Could not parse ${file}: ${error.message}`);
    }
  }
  
  return imageContexts;
}

// Create new directory structure with renamed images
function renameImages(imageContexts) {
  const renamedMappings = new Map();
  const conflicts = new Map();
  
  console.log('\n📝 Planning image renames...\n');
  
  // Check for naming conflicts and resolve them
  const nameCounter = new Map();
  
  for (const [originalPath, context] of imageContexts) {
    let finalName = context.newName;
    
    // Handle naming conflicts
    if (nameCounter.has(finalName)) {
      const count = nameCounter.get(finalName) + 1;
      nameCounter.set(finalName, count);
      
      const extension = path.extname(finalName);
      const baseName = path.basename(finalName, extension);
      finalName = `${baseName}-${count}${extension}`;
    } else {
      nameCounter.set(finalName, 1);
    }
    
    const directory = path.dirname(context.currentPath);
    const newPath = path.join(directory, finalName);
    
    renamedMappings.set(originalPath, {
      ...context,
      newPath: newPath,
      newName: finalName,
      relativePath: originalPath.replace(path.join(__dirname, '..', 'public'), ''),
      newRelativePath: newPath.replace(path.join(__dirname, '..', 'public'), '')
    });
    
    console.log(`📸 ${path.basename(originalPath)} → ${finalName}`);
    console.log(`   📅 ${context.eventDate} | 🎯 ${context.eventTitle}`);
    console.log('');
  }
  
  return renamedMappings;
}

// Update newsletter data files with new image names
function updateNewsletterFiles(renamedMappings) {
  console.log('📝 Updating newsletter data files...\n');
  
  const dataFiles = fs.readdirSync(NEWSLETTER_DATA_DIR)
    .filter(file => file.endsWith('.ts'))
    .map(file => path.join(NEWSLETTER_DATA_DIR, file));
  
  let totalUpdates = 0;
  
  for (const file of dataFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let fileUpdated = false;
    
    for (const [originalPath, mapping] of renamedMappings) {
      const oldRelativePath = mapping.relativePath;
      const newRelativePath = mapping.newRelativePath;
      
      if (content.includes(oldRelativePath)) {
        content = content.replace(new RegExp(escapeRegExp(oldRelativePath), 'g'), newRelativePath);
        fileUpdated = true;
        totalUpdates++;
      }
    }
    
    if (fileUpdated) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Updated ${path.basename(file)}`);
    }
  }
  
  console.log(`\n📊 Updated ${totalUpdates} image references across newsletter files`);
}

// Escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Perform the actual file renames
function performRenames(renamedMappings) {
  console.log('\n🔄 Performing file renames...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [originalPath, mapping] of renamedMappings) {
    try {
      if (fs.existsSync(mapping.currentPath)) {
        fs.renameSync(mapping.currentPath, mapping.newPath);
        console.log(`✅ Renamed: ${path.basename(mapping.currentPath)} → ${mapping.newName}`);
        successCount++;
      } else {
        console.log(`⚠️  File not found: ${mapping.currentPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to rename ${mapping.currentPath}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📈 Rename Summary:`);
  console.log(`✅ Successfully renamed: ${successCount} files`);
  console.log(`❌ Failed: ${errorCount} files`);
}

// Generate a report of the renaming operation
function generateReport(renamedMappings) {
  const reportPath = path.join(__dirname, '..', 'IMAGE_RENAME_REPORT.md');
  
  let report = `# Newsletter Images Rename Report\n\n`;
  report += `**Generated**: ${new Date().toLocaleString()}\n`;
  report += `**Total Images Processed**: ${renamedMappings.size}\n\n`;
  
  // Group by academic year
  const byYear = new Map();
  
  for (const [originalPath, mapping] of renamedMappings) {
    if (!byYear.has(mapping.academicYear)) {
      byYear.set(mapping.academicYear, []);
    }
    byYear.get(mapping.academicYear).push(mapping);
  }
  
  for (const [year, mappings] of byYear) {
    report += `## ${year}\n\n`;
    report += `| Original Name | New Name | Event | Date |\n`;
    report += `|---------------|----------|-------|------|\n`;
    
    mappings.forEach(mapping => {
      const originalName = path.basename(mapping.currentPath);
      const eventTitle = mapping.eventTitle.substring(0, 30) + (mapping.eventTitle.length > 30 ? '...' : '');
      report += `| ${originalName} | ${mapping.newName} | ${eventTitle} | ${mapping.eventDate} |\n`;
    });
    
    report += '\n';
  }
  
  report += `## Naming Convention\n\n`;
  report += `Images are renamed using the pattern: \`event-name-YYYY-image-NN.ext\`\n\n`;
  report += `- **event-name**: Simplified event title (lowercase, no special chars)\n`;
  report += `- **YYYY**: Year from event date\n`;
  report += `- **image-NN**: Sequential image number (01, 02, etc.)\n`;
  report += `- **ext**: Original file extension\n\n`;
  
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`📋 Generated rename report: ${reportPath}`);
}

// Main function
async function main() {
  console.log('🏷️  Starting newsletter image renaming...\n');
  
  try {
    // Extract context for all images
    const imageContexts = extractImageContexts();
    console.log(`\n🔍 Found ${imageContexts.size} images to process\n`);
    
    if (imageContexts.size === 0) {
      console.log('No images found to rename.');
      return;
    }
    
    // Plan the renames
    const renamedMappings = renameImages(imageContexts);
    
    // Ask for confirmation (in a real scenario)
    console.log(`\n❓ Ready to rename ${renamedMappings.size} images. Proceeding...\n`);
    
    // Update newsletter data files FIRST (before actual renames)
    updateNewsletterFiles(renamedMappings);
    
    // Perform the actual file renames
    performRenames(renamedMappings);
    
    // Generate report
    generateReport(renamedMappings);
    
    console.log('\n🎉 Newsletter image renaming completed successfully!');
    console.log('✨ Images now have descriptive names based on their content and events');
    
  } catch (error) {
    console.error('❌ Renaming process failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
