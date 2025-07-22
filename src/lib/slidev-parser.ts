// src/lib/slidev-parser.ts

import yaml from 'js-yaml';

export interface SlidevSlide {
  content: string;
  layout?: string;
  background?: string;
  class?: string;
  clicks?: number;
  [key: string]: any; // For other slide-specific properties
}

export interface SlidevPresentation {
  frontmatter: Record<string, any>;
  slides: SlidevSlide[];
  title?: string;
  theme?: string;
  totalSlides: number;
}

/**
 * Parse Slidev markdown content into structured presentation data
 */
export function parseSlidevContent(content: string): SlidevPresentation {
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  let frontmatter: Record<string, any> = {};
  let contentWithoutFrontmatter = content;
  
  if (frontmatterMatch) {
    try {
      frontmatter = yaml.load(frontmatterMatch[1]) as Record<string, any> || {};
      contentWithoutFrontmatter = content.replace(frontmatterMatch[0], '').trim();
    } catch (error) {
      console.warn('Failed to parse Slidev frontmatter:', error);
    }
  }
  
  // Split content by slide separators using a more precise regex
  // Slidev format: ---\n[properties]\n---\n[content]
  const slideBlocks = contentWithoutFrontmatter.split(/\n---\s*\n/);
  
  const slides: SlidevSlide[] = [];
  
  for (let i = 0; i < slideBlocks.length; i++) {
    const block = slideBlocks[i]?.trim();
    if (!block) continue;
    
    // Check if this block contains slide properties (like "layout: two-cols")
    const nextBlock = slideBlocks[i + 1];
    let slideProperties: Record<string, any> = {};
    let slideContent = block;
    
    // If this block looks like slide properties (contains colons, no markdown headers)
    if (block.includes(':') && !block.startsWith('#') && !block.includes('\n#') && block.split('\n').length < 5) {
      // Try to parse as YAML properties
      try {
        slideProperties = yaml.load(block) as Record<string, any> || {};
        // The actual content is in the next block
        slideContent = nextBlock?.trim() || '';
        i++; // Skip the next block since we used it as content
      } catch (error) {
        // If YAML parsing fails, treat as regular content
        slideContent = block;
      }
    }
    
    if (slideContent) {
      slides.push({
        content: slideContent,
        ...slideProperties
      });
    }
  }
  
  // Extract title from frontmatter or first slide
  let title = frontmatter.title || frontmatter.info?.split('\n')[0]?.replace(/#+\s*/, '');
  
  if (!title && slides.length > 0) {
    // Try to extract title from first slide's first heading
    const firstSlideContent = slides[0].content;
    const titleMatch = firstSlideContent.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1];
    }
  }
  
  return {
    frontmatter,
    slides,
    title,
    theme: frontmatter.theme || 'default',
    totalSlides: slides.length
  };
}

/**
 * Generate slide navigation metadata
 */
export function generateSlideNavigation(presentation: SlidevPresentation) {
  return presentation.slides.map((slide, index) => {
    // Extract a preview/title from the slide content
    const content = slide.content;
    let preview = '';
    
    // Try to get heading first
    const headingMatch = content.match(/^#+\s+(.+)$/m);
    if (headingMatch) {
      preview = headingMatch[1];
    } else {
      // Fall back to first line of text content
      const textLines = content
        .replace(/^#+.*$/gm, '') // Remove headings
        .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
        .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
        
      preview = textLines[0]?.substring(0, 50) || `Slide ${index + 1}`;
    }
    
    return {
      index,
      title: preview,
      layout: slide.layout || 'default',
      hasBackground: !!slide.background
    };
  });
}

/**
 * Extract layout information for rendering
 */
export function getLayoutInfo(layout?: string) {
  const layoutMap = {
    'default': { class: 'layout-default', description: 'Default layout' },
    'center': { class: 'layout-center', description: 'Centered content' },
    'cover': { class: 'layout-cover', description: 'Cover slide' },
    'two-cols': { class: 'layout-two-cols', description: 'Two columns' },
    'quote': { class: 'layout-quote', description: 'Quote layout' },
    'section': { class: 'layout-section', description: 'Section divider' },
    'statement': { class: 'layout-statement', description: 'Statement slide' }
  };
  
  return layoutMap[layout as keyof typeof layoutMap] || layoutMap.default;
}

/**
 * Process Slidev-specific markdown syntax
 */
export function processSlidevMarkdown(content: string): string {
  // Handle ::left:: and ::right:: column syntax
  content = content.replace(/::left::\s*\n([\s\S]*?)(?=::right::|$)/g, 
    '<div class="slidev-col-left">$1</div>');
    
  content = content.replace(/::right::\s*\n([\s\S]*?)(?=\n\n|$)/g, 
    '<div class="slidev-col-right">$1</div>');
  
  // Handle clicks and animations (basic support)
  content = content.replace(/\{click\}/g, '<span class="slidev-click">');
  content = content.replace(/\{\/click\}/g, '</span>');
  
  // Handle v-click directives (convert to classes for CSS animations)
  content = content.replace(/v-click/g, 'slidev-v-click');
  
  return content;
}
