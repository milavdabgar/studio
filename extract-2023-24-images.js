#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the 2023-24 WordPress XML file
const xmlPath = path.join(__dirname, 'data/xmls/gppec.WordPress.2023-24.xml');
const xmlContent = fs.readFileSync(xmlPath, 'utf8');

// Function to extract text content from CDATA
function extractCDATA(text) {
  const cdataMatch = text.match(/<!\[CDATA\[(.*?)\]\]>/s);
  return cdataMatch ? cdataMatch[1] : text;
}

// Function to parse date and check if it's within 2023-24 academic year
function parseDate(dateStr) {
  return new Date(dateStr);
}

function isWithinAcademicYear2023_24(dateStr) {
  const date = parseDate(dateStr);
  const startDate = new Date('2023-07-01');
  const endDate = new Date('2024-06-30');
  return date >= startDate && date <= endDate;
}

// Extract all items from XML
const itemMatches = [...xmlContent.matchAll(/<item>(.*?)<\/item>/gs)];

const posts = [];

itemMatches.forEach((match, index) => {
  const itemContent = match[1];
  
  // Extract basic post information
  const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
  const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
  const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
  const contentMatch = itemContent.match(/<content:encoded><!\[CDATA\[(.*?)\]\]><\/content:encoded>/s);
  
  if (!titleMatch || !pubDateMatch) return;
  
  const title = titleMatch[1];
  const link = linkMatch ? linkMatch[1] : '';
  const pubDate = pubDateMatch[1];
  const content = contentMatch ? contentMatch[1] : '';
  
  // Check if within academic year
  if (!isWithinAcademicYear2023_24(pubDate)) return;
  
  // Extract images from content
  const images = [];
  const imgMatches = [...content.matchAll(/src="(https:\/\/ec\.gppalanpur\.in\/wp-content\/uploads\/[^"]+)"/g)];
  
  imgMatches.forEach(imgMatch => {
    const src = imgMatch[1];
    // Create meaningful alt text and caption from filename
    const filename = src.split('/').pop().replace(/\.(jpg|jpeg|png|gif).*$/i, '');
    const cleanTitle = title.replace(/[^\w\s]/g, '').trim();
    
    images.push({
      src: src,
      alt: `${cleanTitle} - ${filename}`,
      caption: `${cleanTitle} - ${filename}`
    });
  });
  
  posts.push({
    title,
    link,
    pubDate,
    parsedDate: parseDate(pubDate),
    content,
    imageCount: images.length,
    images
  });
});

// Sort posts chronologically
posts.sort((a, b) => a.parsedDate - b.parsedDate);

console.log('=== 2023-24 WORDPRESS POSTS WITH IMAGES ===\n');
console.log(`Total posts found: ${posts.length}\n`);

posts.forEach((post, index) => {
  console.log(`${index + 1}. ${post.title}`);
  console.log(`   Date: ${post.parsedDate.toDateString()}`);
  console.log(`   Images: ${post.imageCount}`);
  if (post.imageCount > 0) {
    console.log('   Image URLs:');
    post.images.forEach((img, imgIndex) => {
      console.log(`     ${imgIndex + 1}. ${img.src}`);
    });
  }
  console.log('');
});

// Generate image mapping for existing events
console.log('\n=== IMAGE MAPPING FOR EXISTING EVENTS ===\n');

const eventMappings = [
  { title: 'Visit: PCB Power And MCBS PVT LTD, Gandhinagar', eventTitle: 'Industrial Visit: PCB Power and MCBS Pvt Ltd' },
  { title: 'Workshop: Embedded System', eventTitle: 'Expert Sessions on Embedded Systems & Web Development' },
  { title: 'Workshop: Web Development Technologies', eventTitle: 'Expert Sessions on Embedded Systems & Web Development' },
  { title: 'New Palanpur for New India 2.0', eventTitle: 'New Palanpur for New India 2.0' },
  { title: 'Thalassemia awareness camp', eventTitle: 'Thalassemia Awareness Camp' },
  { title: 'Fire safety training', eventTitle: 'Fire Safety Training' },
  { title: 'Orientation program 2024', eventTitle: 'Orientation Program 2024' },
  { title: 'RTL Design Workshop', eventTitle: 'RTL Design Workshop' },
  { title: 'SEMIX Training at IIT Bombay', eventTitle: 'SEMIX Training at IIT Bombay' },
  { title: 'SEMICON 2023 Exhibition', eventTitle: 'SEMICON 2023 Exhibition' },
  { title: 'IPR Awareness Camp at Vidhyamandir School', eventTitle: 'IPR Awareness Camp at Vidhyamandir School' },
  { title: 'Tree Plantation Drive', eventTitle: 'Tree Plantation Drive' },
  { title: 'Orientation Session 2023', eventTitle: 'Orientation Session 2023' },
  { title: 'Rakhi & Rangoli 2023', eventTitle: 'Rakhi & Rangoli 2023' }
];

// Create mapping output
const imageUpdates = {};

eventMappings.forEach(mapping => {
  const matchingPost = posts.find(post => 
    post.title.toLowerCase().includes(mapping.title.toLowerCase()) ||
    mapping.title.toLowerCase().includes(post.title.toLowerCase())
  );
  
  if (matchingPost && matchingPost.images.length > 0) {
    imageUpdates[mapping.eventTitle] = {
      originalTitle: matchingPost.title,
      date: matchingPost.parsedDate.toDateString(),
      images: matchingPost.images,
      totalImages: matchingPost.images.length
    };
    
    console.log(`EVENT: ${mapping.eventTitle}`);
    console.log(`MATCHED POST: ${matchingPost.title}`);
    console.log(`DATE: ${matchingPost.parsedDate.toDateString()}`);
    console.log(`IMAGES: ${matchingPost.images.length}`);
    matchingPost.images.forEach((img, idx) => {
      console.log(`  ${idx + 1}. ${img.src}`);
    });
    console.log('');
  }
});

// Write the results to a JSON file for processing
fs.writeFileSync('2023-24-wordpress-images.json', JSON.stringify({
  posts,
  imageUpdates,
  summary: {
    totalPosts: posts.length,
    postsWithImages: posts.filter(p => p.imageCount > 0).length,
    totalImages: posts.reduce((sum, p) => sum + p.imageCount, 0)
  }
}, null, 2));

console.log('\nResults saved to: 2023-24-wordpress-images.json');
console.log(`\nSUMMARY:`);
console.log(`Total posts: ${posts.length}`);
console.log(`Posts with images: ${posts.filter(p => p.imageCount > 0).length}`);
console.log(`Total images found: ${posts.reduce((sum, p) => sum + p.imageCount, 0)}`);
