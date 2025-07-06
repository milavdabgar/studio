#!/usr/bin/env node

/**
 * Script to download all newsletter images from ec.gppalanpur.in and store them locally
 * Updates the newsletter data files to use local paths instead of external URLs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const DOWNLOAD_DIR = path.join(__dirname, '..', 'public', 'newsletters');
const NEWSLETTER_DATA_DIR = path.join(__dirname, '..', 'src', 'lib', 'newsletter-data');
const BASE_URL = 'https://ec.gppalanpur.in';

// Create directories if they don't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Download image from URL
function downloadImage(url, destinationPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    console.log(`Downloading: ${url}`);
    
    const file = fs.createWriteStream(destinationPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded: ${path.basename(destinationPath)}`);
          resolve(destinationPath);
        });
      } else {
        file.close();
        fs.unlink(destinationPath, () => {}); // Delete the file on error
        reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(destinationPath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Extract filename from URL with better sanitization
function getFilenameFromUrl(url) {
  const urlPath = new URL(url).pathname;
  let filename = path.basename(urlPath);
  
  // Remove any query parameters
  filename = filename.split('?')[0];
  
  // If no extension, try to detect from URL
  if (!filename.includes('.')) {
    if (url.includes('.jpg')) filename += '.jpg';
    else if (url.includes('.jpeg')) filename += '.jpeg';
    else if (url.includes('.png')) filename += '.png';
    else if (url.includes('.gif')) filename += '.gif';
    else filename += '.jpg'; // default
  }
  
  // Sanitize filename - keep alphanumeric, dots, and hyphens
  filename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  
  // Ensure we don't have multiple extensions
  const parts = filename.split('.');
  if (parts.length > 2) {
    const ext = parts.pop();
    filename = parts.join('_') + '.' + ext;
  }
  
  return filename;
}

// Get year folder from URL or default
function getYearFromUrl(url) {
  // Try to extract year from URL path
  const match = url.match(/\/(\d{4})/);
  if (match) {
    return match[1];
  }
  
  // Default fallback
  return '2023-24';
}

// Read and parse newsletter data files
function getNewsletterDataFiles() {
  if (!fs.existsSync(NEWSLETTER_DATA_DIR)) {
    console.error(`Newsletter data directory not found: ${NEWSLETTER_DATA_DIR}`);
    return [];
  }
  
  const files = fs.readdirSync(NEWSLETTER_DATA_DIR)
    .filter(file => file.endsWith('.ts'))
    .map(file => path.join(NEWSLETTER_DATA_DIR, file));
  
  return files;
}

// Extract image URLs from newsletter content
function extractImageUrls(content) {
  const urls = new Set();
  
  // Match various image URL patterns
  const patterns = [
    /src:\s*['"`]([^'"`]*ec\.gppalanpur\.in[^'"`]*?)['"`]/g,
    /https?:\/\/ec\.gppalanpur\.in[^\s'"`,)]+/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const url = match[1] || match[0];
      if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif')) {
        urls.add(url);
      }
    }
  });
  
  return Array.from(urls);
}

// Update newsletter data file with local paths
function updateNewsletterFile(filePath, urlMappings) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  for (const [originalUrl, localPath] of urlMappings) {
    const relativePath = localPath.replace(path.join(__dirname, '..', 'public'), '');
    const newContent = content.replace(new RegExp(escapeRegExp(originalUrl), 'g'), relativePath);
    
    if (newContent !== content) {
      content = newContent;
      updated = true;
    }
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated: ${path.basename(filePath)}`);
  }
  
  return updated;
}

// Escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Sleep function for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main execution function
async function main() {
  console.log('🚀 Starting newsletter images download...\n');
  
  try {
    // Get all newsletter data files
    const dataFiles = getNewsletterDataFiles();
    console.log(`Found ${dataFiles.length} newsletter data files\n`);
    
    // Extract all image URLs
    const allUrls = new Set();
    const fileUrlMappings = new Map();
    
    for (const file of dataFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const urls = extractImageUrls(content);
      
      fileUrlMappings.set(file, urls);
      urls.forEach(url => allUrls.add(url));
      
      console.log(`${path.basename(file)}: Found ${urls.length} image URLs`);
    }
    
    console.log(`\n📊 Total unique image URLs found: ${allUrls.size}\n`);
    
    if (allUrls.size === 0) {
      console.log('No image URLs found to download.');
      return;
    }
    
    // Create download directories
    ensureDirectoryExists(DOWNLOAD_DIR);
    ensureDirectoryExists(path.join(DOWNLOAD_DIR, '2023-24'));
    ensureDirectoryExists(path.join(DOWNLOAD_DIR, '2024-25'));
    ensureDirectoryExists(path.join(DOWNLOAD_DIR, 'imgs'));
    
    // Download images
    const urlMappings = new Map();
    let successCount = 0;
    let errorCount = 0;
    
    for (const url of allUrls) {
      try {
        const filename = getFilenameFromUrl(url);
        const year = getYearFromUrl(url);
        
        // Determine subdirectory based on content or year
        let subDir = 'imgs'; // default
        if (year === '2023' || url.includes('2023')) {
          subDir = '2023-24';
        } else if (year === '2024' || url.includes('2024')) {
          subDir = '2024-25';
        }
        
        const destinationPath = path.join(DOWNLOAD_DIR, subDir, filename);
        
        // Skip if file already exists
        if (fs.existsSync(destinationPath)) {
          console.log(`⏭️  Skipping (already exists): ${filename}`);
          urlMappings.set(url, destinationPath);
          continue;
        }
        
        await downloadImage(url, destinationPath);
        urlMappings.set(url, destinationPath);
        successCount++;
        
        // Rate limiting - wait 100ms between downloads
        await sleep(100);
        
      } catch (error) {
        console.error(`❌ Failed to download ${url}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📥 Download Summary:`);
    console.log(`✓ Successfully downloaded: ${successCount} images`);
    console.log(`❌ Failed: ${errorCount} images\n`);
    
    // Update newsletter data files
    console.log('📝 Updating newsletter data files...\n');
    
    let updatedFiles = 0;
    for (const file of dataFiles) {
      const updated = updateNewsletterFile(file, urlMappings);
      if (updated) {
        updatedFiles++;
      }
    }
    
    console.log(`\n✅ Process completed!`);
    console.log(`📁 Images stored in: ${DOWNLOAD_DIR}`);
    console.log(`📝 Updated ${updatedFiles} newsletter data files`);
    console.log(`\nYour newsletter images are now stored locally and independent of ec.gppalanpur.in! 🎉`);
    
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
