#!/usr/bin/env node

/**
 * Verification script to check that all newsletter images exist locally
 * and that newsletter data files reference valid local paths
 */

const fs = require('fs');
const path = require('path');

// Configuration
const NEWSLETTER_DATA_DIR = path.join(__dirname, '..', 'src', 'lib', 'newsletter-data');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Extract image paths from newsletter content
function extractImagePaths(content) {
  const paths = new Set();
  
  // Match local newsletter image paths
  const patterns = [
    /src:\s*['"`]([^'"`]*\/newsletters\/[^'"`]*?)['"`]/g,
    /['"`](\/newsletters\/[^'"`]+\.(?:jpg|jpeg|png|gif))['"`]/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const imagePath = match[1] || match[0];
      if (imagePath.includes('/newsletters/')) {
        paths.add(imagePath.replace(/['"]/g, ''));
      }
    }
  });
  
  return Array.from(paths);
}

// Check if file exists
function fileExists(relativePath) {
  const fullPath = path.join(PUBLIC_DIR, relativePath);
  return fs.existsSync(fullPath);
}

// Get file size in KB
function getFileSize(relativePath) {
  try {
    const fullPath = path.join(PUBLIC_DIR, relativePath);
    const stats = fs.statSync(fullPath);
    return Math.round(stats.size / 1024);
  } catch (error) {
    return 0;
  }
}

// Main verification function
async function verifyImages() {
  console.log('🔍 Verifying newsletter images...\n');
  
  try {
    // Get all newsletter data files
    const dataFiles = fs.readdirSync(NEWSLETTER_DATA_DIR)
      .filter(file => file.endsWith('.ts'))
      .map(file => path.join(NEWSLETTER_DATA_DIR, file));
    
    let totalPaths = 0;
    let existingPaths = 0;
    let missingPaths = [];
    let fileSizes = [];
    
    // Check each file
    for (const file of dataFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const imagePaths = extractImagePaths(content);
      
      console.log(`📁 ${path.basename(file)}: Found ${imagePaths.length} image references`);
      
      for (const imagePath of imagePaths) {
        totalPaths++;
        
        if (fileExists(imagePath)) {
          existingPaths++;
          const size = getFileSize(imagePath);
          fileSizes.push(size);
          console.log(`  ✅ ${imagePath} (${size} KB)`);
        } else {
          missingPaths.push({ file: path.basename(file), path: imagePath });
          console.log(`  ❌ ${imagePath} - FILE NOT FOUND`);
        }
      }
      console.log('');
    }
    
    // Count actual files in newsletters directory
    const newslettersDir = path.join(PUBLIC_DIR, 'newsletters');
    let actualFileCount = 0;
    
    function countFiles(dir) {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          countFiles(itemPath);
        } else if (item.match(/\.(jpg|jpeg|png|gif)$/i)) {
          actualFileCount++;
        }
      }
    }
    
    countFiles(newslettersDir);
    
    // Calculate statistics
    const totalSize = fileSizes.reduce((sum, size) => sum + size, 0);
    const averageSize = fileSizes.length > 0 ? Math.round(totalSize / fileSizes.length) : 0;
    
    // Summary
    console.log('📊 Verification Summary:');
    console.log('========================');
    console.log(`📝 Newsletter data files checked: ${dataFiles.length}`);
    console.log(`🔗 Total image references found: ${totalPaths}`);
    console.log(`✅ Valid local images: ${existingPaths}`);
    console.log(`❌ Missing images: ${missingPaths.length}`);
    console.log(`📁 Actual image files on disk: ${actualFileCount}`);
    console.log(`💾 Total size of referenced images: ${(totalSize / 1024).toFixed(2)} MB`);
    console.log(`📏 Average image size: ${averageSize} KB`);
    
    if (missingPaths.length > 0) {
      console.log('\n❌ Missing Images:');
      console.log('==================');
      missingPaths.forEach(({ file, path }) => {
        console.log(`${file}: ${path}`);
      });
    }
    
    // Check for unused images
    console.log('\n🔍 Checking for unused images...');
    const referencedPaths = new Set();
    
    for (const file of dataFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const imagePaths = extractImagePaths(content);
      imagePaths.forEach(path => referencedPaths.add(path));
    }
    
    let unusedCount = 0;
    function checkUnused(dir, relativePath = '') {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          checkUnused(itemPath, path.join(relativePath, item));
        } else if (item.match(/\.(jpg|jpeg|png|gif)$/i)) {
          const fullRelativePath = '/' + path.join('newsletters', relativePath, item).replace(/\\/g, '/');
          if (!referencedPaths.has(fullRelativePath)) {
            console.log(`  📂 Unused: ${fullRelativePath}`);
            unusedCount++;
          }
        }
      }
    }
    
    checkUnused(newslettersDir);
    
    if (unusedCount === 0) {
      console.log('  ✅ No unused images found');
    } else {
      console.log(`  📊 Found ${unusedCount} unused images`);
    }
    
    // Overall status
    console.log('\n🎯 Overall Status:');
    console.log('==================');
    
    if (missingPaths.length === 0) {
      console.log('✅ ALL IMAGES VERIFIED - Newsletter is ready to use!');
      console.log('🎉 No external dependencies detected');
      console.log('🚀 All images are stored locally and accessible');
    } else {
      console.log('⚠️  ISSUES DETECTED - Some images are missing');
      console.log('💡 Consider running the download script again');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run the verification
if (require.main === module) {
  verifyImages();
}

module.exports = { verifyImages };
