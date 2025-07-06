#!/usr/bin/env node

/**
 * Script to organize newsletter images by year
 * Moves images from imgs/ folder to appropriate year folders based on filename patterns
 * Updates newsletter data files to reflect new paths
 */

const fs = require('fs');
const path = require('path');

// Configuration
const NEWSLETTERS_DIR = path.join(__dirname, '..', 'public', 'newsletters');
const IMGS_DIR = path.join(NEWSLETTERS_DIR, 'imgs');
const NEWSLETTER_DATA_DIR = path.join(__dirname, '..', 'src', 'lib', 'newsletter-data');

// Year mapping based on filename patterns
const YEAR_PATTERNS = {
  '2021-22': [
    /2021/i,
    /2022/i
  ],
  '2022-23': [
    /2022-23/i
  ],
  '2023-24': [
    /2023/i,
    /2023-24/i
  ],
  '2024-25': [
    /2024/i,
    /2025/i,  // 2025 events belong to 2024-25 academic year
    /2024-25/i
  ],
  'imgs': [
    /gpp-logo/i,
    /ec-logo/i,
    /logo/i
  ]
};

// Function to determine year folder for an image
function getYearFolder(filename) {
  for (const [yearFolder, patterns] of Object.entries(YEAR_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(filename)) {
        return yearFolder;
      }
    }
  }
  
  // Default to imgs if no pattern matches
  return 'imgs';
}

// Function to ensure directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Function to move image file
function moveImageFile(oldPath, newPath) {
  try {
    // Ensure destination directory exists
    ensureDirectoryExists(path.dirname(newPath));
    
    // Move the file
    fs.renameSync(oldPath, newPath);
    console.log(`✅ Moved: ${path.basename(oldPath)} → ${path.relative(NEWSLETTERS_DIR, newPath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to move ${oldPath}: ${error.message}`);
    return false;
  }
}

// Function to update newsletter data files
function updateNewsletterDataFiles(imageMoves) {
  const dataFiles = fs.readdirSync(NEWSLETTER_DATA_DIR)
    .filter(file => file.endsWith('.ts'))
    .map(file => path.join(NEWSLETTER_DATA_DIR, file));

  let totalUpdates = 0;

  for (const dataFile of dataFiles) {
    let content = fs.readFileSync(dataFile, 'utf8');
    let fileUpdated = false;

    for (const [oldPath, newPath] of imageMoves) {
      const oldRelativePath = oldPath.replace(path.join(__dirname, '..', 'public'), '');
      const newRelativePath = newPath.replace(path.join(__dirname, '..', 'public'), '');
      
      // Escape special regex characters
      const escapedOldPath = oldRelativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedOldPath, 'g');
      
      if (regex.test(content)) {
        content = content.replace(regex, newRelativePath);
        fileUpdated = true;
        totalUpdates++;
      }
    }

    if (fileUpdated) {
      fs.writeFileSync(dataFile, content, 'utf8');
      console.log(`📝 Updated: ${path.basename(dataFile)}`);
    }
  }

  return totalUpdates;
}

// Function to analyze current organization
function analyzeCurrentOrganization() {
  console.log('🔍 Analyzing current image organization...\n');
  
  const stats = {
    '2021-22': 0,
    '2023-24': 0,
    '2024-25': 0,
    'imgs': 0,
    'total': 0
  };

  // Count images in each folder
  for (const folder of Object.keys(stats)) {
    if (folder === 'total') continue;
    
    const folderPath = path.join(NEWSLETTERS_DIR, folder);
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath).filter(file => 
        file.match(/\.(jpg|jpeg|png|gif)$/i)
      );
      stats[folder] = files.length;
      stats.total += files.length;
    }
  }

  console.log('📊 Current Organization:');
  console.log(`   2021-22/: ${stats['2021-22']} images`);
  console.log(`   2023-24/: ${stats['2023-24']} images`);
  console.log(`   2024-25/: ${stats['2024-25']} images`);
  console.log(`   imgs/: ${stats.imgs} images`);
  console.log(`   Total: ${stats.total} images\n`);

  return stats;
}

// Function to find misplaced images
function findMisplacedImages() {
  const misplacedImages = [];
  
  if (!fs.existsSync(IMGS_DIR)) {
    return misplacedImages;
  }

  const imgsFiles = fs.readdirSync(IMGS_DIR).filter(file => 
    file.match(/\.(jpg|jpeg|png|gif)$/i)
  );

  for (const filename of imgsFiles) {
    const targetFolder = getYearFolder(filename);
    
    // If target folder is not 'imgs', it's misplaced
    if (targetFolder !== 'imgs') {
      misplacedImages.push({
        filename,
        currentPath: path.join(IMGS_DIR, filename),
        targetFolder,
        targetPath: path.join(NEWSLETTERS_DIR, targetFolder, filename)
      });
    }
  }

  return misplacedImages;
}

// Main execution function
async function main() {
  console.log('🗂️  Starting newsletter images organization by year...\n');

  try {
    // Analyze current organization
    const beforeStats = analyzeCurrentOrganization();

    // Find misplaced images
    const misplacedImages = findMisplacedImages();
    
    if (misplacedImages.length === 0) {
      console.log('✅ All images are already properly organized by year!');
      return;
    }

    console.log(`🔄 Found ${misplacedImages.length} images to reorganize:\n`);

    // Group by target folder for better output
    const groupedMoves = {};
    misplacedImages.forEach(img => {
      if (!groupedMoves[img.targetFolder]) {
        groupedMoves[img.targetFolder] = [];
      }
      groupedMoves[img.targetFolder].push(img);
    });

    // Show planned moves
    for (const [targetFolder, images] of Object.entries(groupedMoves)) {
      console.log(`📁 Moving to ${targetFolder}/:`);
      images.forEach(img => {
        console.log(`   ${img.filename}`);
      });
      console.log('');
    }

    // Ask for confirmation (in a real scenario, you might want to add this)
    console.log('🚀 Proceeding with reorganization...\n');

    // Track successful moves for updating data files
    const successfulMoves = [];

    // Move images
    let successCount = 0;
    let errorCount = 0;

    for (const img of misplacedImages) {
      const success = moveImageFile(img.currentPath, img.targetPath);
      if (success) {
        successfulMoves.push([img.currentPath, img.targetPath]);
        successCount++;
      } else {
        errorCount++;
      }
    }

    console.log(`\n📊 Move Summary:`);
    console.log(`✅ Successfully moved: ${successCount} images`);
    console.log(`❌ Failed: ${errorCount} images\n`);

    // Update newsletter data files
    if (successfulMoves.length > 0) {
      console.log('📝 Updating newsletter data files...\n');
      const updatesCount = updateNewsletterDataFiles(successfulMoves);
      console.log(`✅ Updated ${updatesCount} references in newsletter data files\n`);
    }

    // Show final organization
    console.log('📊 Final Organization:');
    analyzeCurrentOrganization();

    console.log('🎉 Newsletter images successfully organized by year!');
    console.log('🔍 Run verification script to confirm all references are working.');

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
