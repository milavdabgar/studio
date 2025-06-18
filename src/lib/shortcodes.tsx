// src/lib/shortcodes.tsx
// Hugo Shortcode Parser for React/Next.js

import React from 'react';
import { YouTube, Figure, ImageGallery, TwitterEmbed, Instagram, QRCode, CodeBlock } from '@/components/shortcodes';

// Type for shortcode components
type ShortcodeComponent = React.ComponentType<any>;

// Shortcode registry mapping
const shortcodeRegistry: Record<string, ShortcodeComponent> = {
  // Video embeds
  youtube: YouTube,
  YouTube: YouTube,
  
  // Social media
  x: TwitterEmbed,
  X: TwitterEmbed,
  twitter: TwitterEmbed,
  Twitter: TwitterEmbed,
  instagram: Instagram,
  Instagram: Instagram,
  
  // Images and galleries
  figure: Figure,
  Figure: Figure,
  gallery: ImageGallery,
  'image-gallery': ImageGallery,
  ImageGallery: ImageGallery,
  
  // Utilities
  qr: QRCode,
  QRCode: QRCode,
  code: CodeBlock,
  CodeBlock: CodeBlock,
};

// Parse shortcode parameters from Hugo-style syntax
function parseShortcodeParams(paramString: string): Record<string, any> {
  const params: Record<string, any> = {};
  
  // Handle both named and positional parameters
  // Examples: 
  // {{< youtube "dQw4w9WgXcQ" >}}
  // {{< figure src="/image.jpg" alt="Description" width=800 >}}
  // {{< gallery images="img1.jpg,img2.jpg" >}}
  
  const paramRegex = /(\w+)=(?:"([^"]*)"|'([^']*)'|([^\s]+))|(?:"([^"]*)"|'([^']*)'|([^\s]+))/g;
  let match;
  let positionalIndex = 0;
  
  while ((match = paramRegex.exec(paramString)) !== null) {
    if (match[1]) {
      // Named parameter: key="value" or key=value
      const key = match[1];
      const value = match[2] || match[3] || match[4];
      params[key] = parseValue(value);
    } else {
      // Positional parameter: "value" or value
      const value = match[5] || match[6] || match[7];
      
      // Map positional parameters to expected prop names based on shortcode type
      if (positionalIndex === 0) {
        params.id = parseValue(value); // For youtube, instagram, twitter
        params.src = parseValue(value); // For figure
        params.text = parseValue(value); // For qr
        params.images = parseValue(value); // For gallery
      }
      positionalIndex++;
    }
  }
  
  return params;
}

// Parse string values to appropriate types
function parseValue(value: string): any {
  if (!value) return value;
  
  // Boolean values
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Number values
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
  
  // String value
  return value;
}

// Convert Hugo shortcode syntax to React components
export function parseShortcodes(content: string): string {
  // Match Hugo shortcode syntax: {{< shortcode params >}}
  const shortcodeRegex = /\{\{<\s*(\w+(?:-\w+)*)\s+([^>]*?)\s*>\}\}/g;
  
  return content.replace(shortcodeRegex, (match, shortcodeName, paramString) => {
    // Find the corresponding React component
    const Component = shortcodeRegistry[shortcodeName];
    
    if (!Component) {
      console.warn(`Unknown shortcode: ${shortcodeName}`);
      return match; // Return original if shortcode not found
    }
    
    try {
      // Parse parameters
      const params = parseShortcodeParams(paramString.trim());
      
      // Generate a unique key for the component
      const key = `shortcode-${shortcodeName}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create placeholder that will be replaced in PostRenderer
      return `<div data-shortcode="${shortcodeName}" data-params="${encodeURIComponent(JSON.stringify(params))}" data-key="${key}"></div>`;
    } catch (error) {
      console.error(`Error parsing shortcode ${shortcodeName}:`, error);
      return match; // Return original on error
    }
  });
}

// Render shortcodes in React components
export function renderShortcode(shortcodeName: string, params: Record<string, any>, key: string): React.ReactElement | null {
  const Component = shortcodeRegistry[shortcodeName];
  
  if (!Component) {
    console.warn(`Unknown shortcode: ${shortcodeName}`);
    return null;
  }
  
  try {
    return React.createElement(Component as React.ComponentType<any>, { ...params, key });
  } catch (error) {
    console.error(`Error rendering shortcode ${shortcodeName}:`, error);
    return null;
  }
}

// Enhanced markdown processing with shortcode support
export function processMarkdownWithShortcodes(markdown: string): string {
  // First process shortcodes
  return parseShortcodes(markdown);
}

// React hook for processing shortcodes in rendered content
export function useShortcodeProcessor() {
  const processShortcodes = React.useCallback((containerRef: React.RefObject<HTMLElement>) => {
    if (!containerRef.current) return;
    
    // Find all shortcode placeholders
    const shortcodePlaceholders = containerRef.current.querySelectorAll('[data-shortcode]');
    
    shortcodePlaceholders.forEach((placeholder) => {
      const shortcodeName = placeholder.getAttribute('data-shortcode');
      const paramsString = placeholder.getAttribute('data-params');
      const key = placeholder.getAttribute('data-key');
      
      if (!shortcodeName || !paramsString || !key) return;
      
      try {
        const params = JSON.parse(decodeURIComponent(paramsString));
        const component = renderShortcode(shortcodeName, params, key);
        
        if (component) {
          // Create a temporary container to render the React component
          const tempContainer = document.createElement('div');
          
          // Use ReactDOM.render or createRoot to render the component
          // Note: This is a simplified approach. In production, you might want to use
          // a more sophisticated method like React portals or a custom renderer
          
          // For now, we'll replace with a simpler HTML representation
          placeholder.innerHTML = `
            <div class="shortcode-placeholder bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-4">
              <div class="text-sm text-blue-600 dark:text-blue-400 font-medium">
                📝 ${shortcodeName.toUpperCase()} Shortcode
              </div>
              <div class="text-xs text-blue-500 dark:text-blue-500 mt-1">
                ${JSON.stringify(params, null, 2)}
              </div>
              <div class="text-xs text-gray-500 mt-2">
                This will be rendered as an interactive component in the final version.
              </div>
            </div>
          `;
        }
      } catch (error) {
        console.error('Error processing shortcode placeholder:', error);
      }
    });
  }, []);
  
  return { processShortcodes };
}
