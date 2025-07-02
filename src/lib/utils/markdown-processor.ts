// Markdown processing utilities separated to avoid circular dependencies
// This file contains markdown processing functions that don't depend on shortcode components

// Simple markdown processing without shortcode registry to avoid circular dependency
export function processMarkdownWithShortcodes(markdown: string): string {
  // For now, just return the markdown as-is to break the circular dependency
  // The shortcode processing will happen elsewhere in the render pipeline
  console.log('processMarkdownWithShortcodes: Processing content, length:', markdown.length);
  console.log('processMarkdownWithShortcodes: Content includes gallery:', markdown.includes('gallery'));
  console.log('processMarkdownWithShortcodes: First 200 chars:', markdown.substring(0, 200));
  
  // Return unchanged to avoid circular dependency issues
  const result = markdown;
  
  console.log('processMarkdownWithShortcodes: Result length:', result.length);
  console.log('processMarkdownWithShortcodes: Result different from input:', result !== markdown);
  
  return result;
}