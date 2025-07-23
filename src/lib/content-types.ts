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
  
  // For markdown files, check if it's in a Slidev directory first
  if (extension === '.md') {
    // Strong path-based check - if it's in a slidev directory, it's likely Slidev
    if (isSlidevPath(filePath)) {
      return 'slidev';
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // More restrictive Slidev detection - require multiple strong indicators
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        let slidevIndicators = 0;
        
        // Look for very specific Slidev frontmatter combinations
        if (frontmatter.includes('slidev:') || frontmatter.includes('# Slidev')) {
          slidevIndicators += 3; // Strong indicator
        }
        if (frontmatter.includes('highlighter:') && frontmatter.includes('prism')) {
          slidevIndicators += 2; // Slidev-specific syntax highlighting
        }
        if (frontmatter.includes('drawings:') && frontmatter.includes('persist')) {
          slidevIndicators += 2; // Slidev-specific drawing feature
        }
        if (frontmatter.includes('transition:') && (frontmatter.includes('slide-left') || frontmatter.includes('slide-up'))) {
          slidevIndicators += 2; // Slidev-specific transitions
        }
        if (frontmatter.includes('mdc:') && frontmatter.includes('true')) {
          slidevIndicators += 2; // Slidev MDC feature
        }
        
        // Check for Slidev-specific layouts in content
        const slidevLayouts = ['two-cols', 'section', 'quote', 'fact', 'statement'];
        const hasSpecificLayouts = slidevLayouts.some(layout => 
          content.includes(`layout: ${layout}`) || content.includes(`layout: '${layout}'`)
        );
        if (hasSpecificLayouts) {
          slidevIndicators += 2;
        }
        
        // Check for slide separators with specific patterns
        const slideSeparators = (content.match(/\n---\n/g) || []).length;
        if (slideSeparators > 2 && frontmatterMatch) {
          slidevIndicators += 1;
        }
        
        // Only classify as Slidev if we have strong evidence (3+ indicators)
        if (slidevIndicators >= 3) {
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
  const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');
  
  // Check for explicit slidev directories
  return (
    normalizedPath.includes('/slidev/') ||
    normalizedPath.endsWith('/slidev') ||
    normalizedPath.includes('/slides/') ||
    // Match the specific cyber security slidev path pattern
    normalizedPath.includes('/4353204-cyber-security/slidev/')
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
