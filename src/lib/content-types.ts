// src/lib/content-types.ts

import fs from 'fs';
import path from 'path';

export type ContentType = 'markdown' | 'slidev' | 'pdf' | 'html' | 'reveal';

/**
 * Detect the content type based on file extension and content analysis
 */
export function detectContentType(filePath: string): ContentType {
  if (!fs.existsSync(filePath)) {
    return 'markdown';
  }

  const extension = path.extname(filePath).toLowerCase();
  
  // Handle obvious cases first
  if (extension === '.pdf') return 'pdf';
  if (extension === '.html' || extension === '.htm') {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('reveal.js') || content.includes('Reveal.initialize')) {
      return 'reveal';
    }
    return 'html';
  }
  
  // For markdown files, check content for Slidev indicators
  if (extension === '.md') {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for Slidev frontmatter indicators
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        
        // Look for Slidev-specific frontmatter fields
        if (frontmatter.includes('theme:') || 
            frontmatter.includes('background:') ||
            frontmatter.includes('highlighter:') ||
            frontmatter.includes('transition:') ||
            frontmatter.includes('slidev:') ||
            frontmatter.includes('class: text-center') ||
            frontmatter.includes('drawings:') ||
            frontmatter.includes('mdc:')) {
          return 'slidev';
        }
      }
      
      // Also check for Slidev layout indicators in content
      if (content.includes('layout:') && 
          (content.includes('---\nlayout:') || content.includes('layout: default') || 
           content.includes('layout: two-cols') || content.includes('layout: center'))) {
        return 'slidev';
      }
      
      // Check for slide separators
      if (content.includes('\n---\n') && frontmatterMatch) {
        // Count slide separators - if we have frontmatter and multiple --- separators, likely Slidev
        const slideSeparators = (content.match(/\n---\n/g) || []).length;
        if (slideSeparators > 1) {
          return 'slidev';
        }
      }
      
    } catch (error) {
      console.warn(`Error reading file for content type detection: ${filePath}`, error);
    }
  }
  
  return 'markdown';
}

/**
 * Check if a file is a Slidev presentation based on its path pattern
 */
export function isSlidevPath(filePath: string): boolean {
  const pathSegments = filePath.split(path.sep);
  return pathSegments.some(segment => 
    segment.toLowerCase().includes('slidev') || 
    segment.toLowerCase().includes('slides')
  );
}

/**
 * Get content type with additional context information
 */
export function getContentTypeInfo(filePath: string) {
  const contentType = detectContentType(filePath);
  const isSlidevByPath = isSlidevPath(filePath);
  
  return {
    type: contentType,
    isSlidevByPath,
    extension: path.extname(filePath).toLowerCase(),
    filename: path.basename(filePath),
    isSlidePresentation: contentType === 'slidev' || contentType === 'reveal'
  };
}
