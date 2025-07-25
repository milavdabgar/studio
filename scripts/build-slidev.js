#!/usr/bin/env node

/**
 * Build Slidev presentations script
 * Usage: 
 *   node scripts/build-slidev.js [presentation-name] [--all] [--folder=path] [--retry-failed]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_ROOT = 'content';
const BUILD_OUTPUT_DIR = 'public/slidev-builds';

// Find all slidev directories and get presentations
function getSlidevPresentations() {
  const presentations = new Map(); // Map to store presentation -> directory mapping
  const folderStructure = new Map(); // Map to store folder -> presentations mapping
  
  // Recursively find all 'slidev' directories
  function findSlidevDirectories(dir) {
    const slidevDirs = [];
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
          if (item.name === 'slidev') {
            slidevDirs.push(fullPath);
          } else {
            // Recursively search subdirectories
            slidevDirs.push(...findSlidevDirectories(fullPath));
          }
        }
      }
    } catch (error) {
      // Ignore permission errors and continue
    }
    
    return slidevDirs;
  }
  
  const contentRoot = path.join(process.cwd(), CONTENT_ROOT);
  const slidevDirectories = findSlidevDirectories(contentRoot);
  
  console.log(`Found ${slidevDirectories.length} slidev directories:`);
  slidevDirectories.forEach(dir => {
    console.log(`  ${path.relative(process.cwd(), dir)}`);
  });
  
  // Get all .md files from all slidev directories
  for (const slidevDir of slidevDirectories) {
    try {
      const files = fs.readdirSync(slidevDir)
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace('.md', ''));
      
      // Track folder structure
      const folderKey = path.relative(process.cwd(), slidevDir);
      folderStructure.set(folderKey, files);
      
      for (const presentationName of files) {
        if (presentations.has(presentationName)) {
          console.warn(`⚠️  Duplicate presentation name found: ${presentationName}`);
          console.warn(`    Existing: ${presentations.get(presentationName)}`);
          console.warn(`    New: ${slidevDir}`);
        }
        presentations.set(presentationName, slidevDir);
      }
    } catch (error) {
      console.error(`Error reading slidev directory ${slidevDir}:`, error.message);
    }
  }
  
  return { presentations, folderStructure };
}

// Build a single presentation
function buildPresentation(presentationName, presentations = null) {
  // Get presentations map if not provided
  if (!presentations) {
    const data = getSlidevPresentations();
    presentations = data.presentations;
  }
  
  if (!presentations.has(presentationName)) {
    console.error(`❌ Presentation "${presentationName}" not found.`);
    return false;
  }
  
  const slidevDir = presentations.get(presentationName);
  const slidevFile = path.join(slidevDir, `${presentationName}.md`);
  const basePath = `/slidev-builds/${presentationName}/`;
  const tempBuildDir = `/tmp/slidev-build-${presentationName}`;
  const finalBuildDir = path.join(BUILD_OUTPUT_DIR, presentationName);

  console.log(`🔨 Building ${presentationName}...`);
  console.log(`   Source: ${path.relative(process.cwd(), slidevDir)}`);

  try {
    // Build with correct base path and ensure clean build
    const buildCommand = `cd "${slidevDir}" && npx slidev build "${presentationName}.md" --base "${basePath}" --out "${tempBuildDir}"`;
    
    // Clean temp directory first if it exists
    if (fs.existsSync(tempBuildDir)) {
      fs.rmSync(tempBuildDir, { recursive: true, force: true });
    }
    
    execSync(buildCommand, { stdio: 'inherit' });

    // Remove existing build if it exists
    if (fs.existsSync(finalBuildDir)) {
      fs.rmSync(finalBuildDir, { recursive: true, force: true });
    }

    // Ensure parent directory exists
    fs.mkdirSync(path.dirname(finalBuildDir), { recursive: true });

    // Copy from temp to final location
    fs.cpSync(tempBuildDir, finalBuildDir, { recursive: true });

    // Clean up temp directory
    fs.rmSync(tempBuildDir, { recursive: true, force: true });

    console.log(`✅ Successfully built ${presentationName}`);
    console.log(`   Output: ${path.relative(process.cwd(), finalBuildDir)}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to build ${presentationName}:`, error.message);
    return false;
  }
}

// Build all presentations in a specific folder
function buildFolder(folderPath, presentations, folderStructure) {
  console.log(`🚀 Building all presentations in folder: ${folderPath}`);
  
  if (!folderStructure.has(folderPath)) {
    console.error(`❌ Folder "${folderPath}" not found.`);
    console.log('Available folders:', Array.from(folderStructure.keys()).join(', '));
    return { success: 0, failed: [] };
  }
  
  const presentationsInFolder = folderStructure.get(folderPath);
  let successCount = 0;
  const failedBuilds = [];
  
  for (const presentationName of presentationsInFolder) {
    console.log(`\n📁 Building ${presentationName} from ${folderPath}...`);
    if (buildPresentation(presentationName, presentations)) {
      successCount++;
    } else {
      failedBuilds.push({ name: presentationName, folder: folderPath });
    }
  }
  
  return { success: successCount, failed: failedBuilds, total: presentationsInFolder.length };
}

// Load failed builds log
function loadFailedBuilds() {
  const failedBuildsFile = 'slidev-failed-builds.json';
  try {
    if (fs.existsSync(failedBuildsFile)) {
      return JSON.parse(fs.readFileSync(failedBuildsFile, 'utf8'));
    }
  } catch (error) {
    console.warn('Could not load failed builds log:', error.message);
  }
  return [];
}

// Save failed builds log
function saveFailedBuilds(failedBuilds) {
  const failedBuildsFile = 'slidev-failed-builds.json';
  try {
    fs.writeFileSync(failedBuildsFile, JSON.stringify(failedBuilds, null, 2));
    console.log(`📝 Failed builds logged to ${failedBuildsFile}`);
  } catch (error) {
    console.warn('Could not save failed builds log:', error.message);
  }
}

// Build only failed presentations
function retryFailedBuilds(presentations) {
  const failedBuilds = loadFailedBuilds();
  
  if (failedBuilds.length === 0) {
    console.log('🎉 No failed builds found!');
    return;
  }
  
  console.log(`🔄 Retrying ${failedBuilds.length} failed builds...`);
  let successCount = 0;
  const stillFailedBuilds = [];
  
  for (const failed of failedBuilds) {
    console.log(`\n🔄 Retrying ${failed.name} (from ${failed.folder})...`);
    if (buildPresentation(failed.name, presentations)) {
      successCount++;
    } else {
      stillFailedBuilds.push(failed);
    }
  }
  
  // Update failed builds log
  saveFailedBuilds(stillFailedBuilds);
  
  console.log(`\n📊 Retry Summary: ${successCount}/${failedBuilds.length} previously failed builds now successful`);
  if (stillFailedBuilds.length > 0) {
    console.log(`❌ ${stillFailedBuilds.length} builds still failing:`);
    stillFailedBuilds.forEach(failed => {
      console.log(`   - ${failed.name} (${failed.folder})`);
    });
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const data = getSlidevPresentations();
  const { presentations, folderStructure } = data;
  const presentationNames = Array.from(presentations.keys());

  console.log(`\nFound ${presentationNames.length} Slidev presentations across ${folderStructure.size} folders`);
  console.log('');
  
  // Show folder structure
  console.log('📁 Folder Structure:');
  for (const [folder, presentations] of folderStructure.entries()) {
    console.log(`   ${folder} (${presentations.length} presentations)`);
  }
  console.log('');

  // Check for special flags
  const folderArg = args.find(arg => arg.startsWith('--folder='));
  const retryFailed = args.includes('--retry-failed');
  const buildAll = args.includes('--all');
  
  if (retryFailed) {
    retryFailedBuilds(presentations);
  } else if (folderArg) {
    const folderPath = folderArg.split('=')[1];
    const result = buildFolder(folderPath, presentations, folderStructure);
    
    console.log(`\n📊 Folder Build Summary: ${result.success}/${result.total} presentations built successfully`);
    
    if (result.failed.length > 0) {
      console.log(`❌ ${result.failed.length} builds failed:`);
      result.failed.forEach(failed => {
        console.log(`   - ${failed.name}`);
      });
      
      // Merge with existing failed builds and save
      const existingFailed = loadFailedBuilds();
      const allFailed = [...existingFailed, ...result.failed];
      // Remove duplicates
      const uniqueFailed = allFailed.filter((failed, index) => 
        allFailed.findIndex(f => f.name === failed.name) === index
      );
      saveFailedBuilds(uniqueFailed);
    }
  } else if (buildAll) {
    console.log('🚀 Building all Slidev presentations...');
    let successCount = 0;
    const failedBuilds = [];
    
    for (const presentationName of presentationNames) {
      if (buildPresentation(presentationName, presentations)) {
        successCount++;
      } else {
        const slidevDir = presentations.get(presentationName);
        const folderPath = path.relative(process.cwd(), slidevDir);
        failedBuilds.push({ name: presentationName, folder: folderPath });
      }
      console.log(''); // Add spacing between builds
    }
    
    console.log(`📊 Build Summary: ${successCount}/${presentationNames.length} presentations built successfully`);
    
    if (failedBuilds.length > 0) {
      console.log(`❌ ${failedBuilds.length} builds failed:`);
      failedBuilds.forEach(failed => {
        console.log(`   - ${failed.name} (${failed.folder})`);
      });
      saveFailedBuilds(failedBuilds);
      console.log('\n💡 Use --retry-failed to retry only the failed builds');
    }
  } else if (args.length > 0) {
    const targetPresentation = args[0];
    
    if (!presentations.has(targetPresentation)) {
      console.error(`❌ Presentation "${targetPresentation}" not found.`);
      console.log('Available presentations:', presentationNames.join(', '));
      process.exit(1);
    }
    
    if (buildPresentation(targetPresentation, presentations)) {
      console.log('✅ Build completed successfully');
    } else {
      console.log('❌ Build failed');
      const slidevDir = presentations.get(targetPresentation);
      const folderPath = path.relative(process.cwd(), slidevDir);
      saveFailedBuilds([{ name: targetPresentation, folder: folderPath }]);
    }
  } else {
    console.log('Usage:');
    console.log('  node scripts/build-slidev.js <presentation-name>     # Build specific presentation');
    console.log('  node scripts/build-slidev.js --all                 # Build all presentations');
    console.log('  node scripts/build-slidev.js --folder=<path>       # Build all in specific folder');
    console.log('  node scripts/build-slidev.js --retry-failed        # Retry only failed builds');
    console.log('\nAvailable folders:');
    for (const [folder, presentations] of folderStructure.entries()) {
      console.log(`   ${folder} (${presentations.length} presentations)`);
    }
    console.log('\nExample folder usage:');
    console.log('  npm run slidev:build -- --folder="content/resources/study-materials/32-ict/sem-4/4343203-java/slidev"');
    
    // Show failed builds if any
    const failedBuilds = loadFailedBuilds();
    if (failedBuilds.length > 0) {
      console.log(`\n❌ ${failedBuilds.length} previously failed builds:`);
      failedBuilds.forEach(failed => {
        console.log(`   - ${failed.name} (${failed.folder})`);
      });
      console.log('\n💡 Use --retry-failed to retry only these failed builds');
    }
  }
}

// Run main function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { buildPresentation, getSlidevPresentations };