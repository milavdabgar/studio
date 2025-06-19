// src/lib/shortcodes.tsx
// Hugo Shortcode Parser for React/Next.js

import React from 'react';
import { 
  YouTube, 
  Figure, 
  ImageGallery, 
  TwitterEmbed, 
  Instagram, 
  QRCode, 
  CodeBlock, 
  Carousel 
} from '@/components/shortcodes';

// Import Blowfish shortcodes
import Alert from '@/components/shortcodes/Alert';
import Badge from '@/components/shortcodes/Badge';
import Button from '@/components/shortcodes/Button';
import Timeline from '@/components/shortcodes/Timeline';
import TimelineItem from '@/components/shortcodes/TimelineItem';
import GitHub from '@/components/shortcodes/GitHub';
import Mermaid from '@/components/shortcodes/Mermaid';
import Icon from '@/components/shortcodes/Icon';
import Lead from '@/components/shortcodes/Lead';
import Keyword from '@/components/shortcodes/Keyword';
import KeywordList from '@/components/shortcodes/KeywordList';
import TypeIt from '@/components/shortcodes/TypeIt';
import Swatches from '@/components/shortcodes/Swatches';
import YouTubeLite from '@/components/shortcodes/YouTubeLite';
import Article from '@/components/shortcodes/Article';
import { Chart } from '@/components/shortcodes/Chart';

// Import new Blowfish shortcodes
import BlowfishCarousel from '@/components/shortcodes/BlowfishCarousel';
import CodeImporter from '@/components/shortcodes/CodeImporter';
import Codeberg from '@/components/shortcodes/Codeberg';
import Forgejo from '@/components/shortcodes/Forgejo';
import Gist from '@/components/shortcodes/Gist';
import Gitea from '@/components/shortcodes/Gitea';
import GitLab from '@/components/shortcodes/GitLab';
import KaTeX from '@/components/shortcodes/KaTeX';
import List from '@/components/shortcodes/List';
import Gallery from '@/components/shortcodes/Gallery';
import LTR from '@/components/shortcodes/LTR';
import RTL from '@/components/shortcodes/RTL';
import MDImporter from '@/components/shortcodes/MDImporter';
import Ref from '@/components/shortcodes/Ref';

// Type for shortcode components
type ShortcodeComponent = React.ComponentType<any>;

// Shortcode registry mapping with exact Blowfish API compatibility
const shortcodeRegistry: Record<string, ShortcodeComponent> = {
  // Blowfish shortcodes (exact API compatibility)
  alert: Alert,
  Alert: Alert,
  badge: Badge,
  Badge: Badge,
  button: Button,
  Button: Button,
  timeline: Timeline,
  Timeline: Timeline,
  timelineItem: TimelineItem,
  TimelineItem: TimelineItem,
  github: GitHub,
  GitHub: GitHub,
  mermaid: Mermaid,
  Mermaid: Mermaid,
  icon: Icon,
  Icon: Icon,
  lead: Lead,
  Lead: Lead,
  keyword: Keyword,
  Keyword: Keyword,
  keywordList: KeywordList,
  KeywordList: KeywordList,
  typeit: TypeIt,
  TypeIt: TypeIt,
  swatches: Swatches,
  Swatches: Swatches,
  youtubeLite: YouTubeLite,
  YouTubeLite: YouTubeLite,
  article: Article,
  Article: Article,
  chart: Chart,
  Chart: Chart,
  
  // New Blowfish shortcodes
  carousel: BlowfishCarousel,
  Carousel: BlowfishCarousel,
  codeimporter: CodeImporter,
  CodeImporter: CodeImporter,
  codeberg: Codeberg,
  Codeberg: Codeberg,
  forgejo: Forgejo,
  Forgejo: Forgejo,
  gist: Gist,
  Gist: Gist,
  gitea: Gitea,
  Gitea: Gitea,
  gitlab: GitLab,
  GitLab: GitLab,
  katex: KaTeX,
  KaTeX: KaTeX,
  list: List,
  List: List,
  gallery: Gallery,
  Gallery: Gallery,
  ltr: LTR,
  LTR: LTR,
  rtl: RTL,
  RTL: RTL,
  mdimporter: MDImporter,
  MDImporter: MDImporter,
  ref: Ref,
  Ref: Ref,
  
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
        params.name = parseValue(value); // For icon
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
  console.log('parseShortcodes called with content (first 500 chars):', content.substring(0, 500));
  console.log('parseShortcodes called with content (around chart - chars 15000-16000):', content.substring(15000, 16000));
  console.log('parseShortcodes called with content (around mermaid - chars 25000-26000):', content.substring(25000, 26000));
  
  // Let's check specifically for mermaid content
  const mermaidTest = content.includes('mermaid');
  console.log('Content contains mermaid:', mermaidTest);
  if (mermaidTest) {
    const mermaidMatches = content.match(/\{\{<\s*mermaid[\s\S]*?\/mermaid\s*>\}\}/g);
    console.log('Mermaid matches found:', mermaidMatches?.length || 0);
    if (mermaidMatches) {
      mermaidMatches.forEach((match, i) => {
        console.log(`Mermaid match ${i}:`, match.substring(0, 200));
      });
    }
  }
  
  // First handle self-closing shortcodes: {{< shortcode params >}}
  const selfClosingShortcodeRegex = /\{\{<\s*(\w+(?:-\w+)*)\s+([^>]*?)\s*>\}\}/g;
  
  let result = content.replace(selfClosingShortcodeRegex, (match, shortcodeName, paramString) => {
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

  // Then handle paired shortcodes: {{< shortcode params >}}content{{< /shortcode >}}
  // Use a more flexible regex to handle whitespace and newlines better
  const pairedShortcodeRegex = /\{\{<\s*(\w+(?:-\w+)*)\s*([^>]*?)\s*>\}\}([\s\S]*?)\{\{<\s*\/\1\s*>\}\}/g;
  
  console.log('About to process paired shortcodes. Looking for pattern in content...');
  console.log('Testing for chart pattern specifically...');
  const chartPattern = /\{\{<\s*(chart|Chart)\s*([^>]*?)\s*>\}\}([\s\S]*?)\{\{<\s*\/(chart|Chart)\s*>\}\}/g;
  const chartMatches = content.match(chartPattern);
  console.log('Chart matches found:', chartMatches?.length || 0);
  
  console.log('Testing for mermaid pattern specifically...');
  const mermaidPattern = /\{\{<\s*(mermaid|Mermaid)\s*([^>]*?)\s*>\}\}([\s\S]*?)\{\{<\s*\/(mermaid|Mermaid)\s*>\}\}/g;
  const mermaidMatches = content.match(mermaidPattern);
  console.log('Mermaid matches found:', mermaidMatches?.length || 0);
  
  let foundPaired = false;
  
  result = result.replace(pairedShortcodeRegex, (match, shortcodeName, paramString, innerContent) => {
    foundPaired = true;
    console.log(`Found paired shortcode: ${shortcodeName} with content: ${innerContent.substring(0, 100)}`);
    
    // Find the corresponding React component
    const Component = shortcodeRegistry[shortcodeName];
    
    if (!Component) {
      console.warn(`Unknown paired shortcode: ${shortcodeName}`);
      return match; // Return original if shortcode not found
    }
    
    try {
      // Parse parameters
      const params = parseShortcodeParams(paramString.trim());
      
      // Special handling for components that need raw content
      if (shortcodeName === 'mermaid' || shortcodeName === 'Mermaid') {
        // For Mermaid, pass raw content as children
        params.children = innerContent.trim();
        console.log(`Mermaid content captured: "${innerContent.trim()}"`);
      } else if (shortcodeName === 'chart' || shortcodeName === 'Chart') {
        // For Chart, pass raw content as children  
        params.children = innerContent.trim();
        console.log(`Chart content captured: "${innerContent.trim()}"`);
      } else if (shortcodeName === 'timeline' || shortcodeName === 'Timeline') {
        // For Timeline, we need to process nested shortcodes and pass as React children
        // We'll handle this specially in the Timeline component itself
        params.children = innerContent.trim();
      } else {
        // For other components, recursively process shortcodes in the inner content
        const processedInnerContent = parseShortcodes(innerContent.trim());
        params.children = processedInnerContent;
      }
      
      // Generate a unique key for the component
      const key = `shortcode-${shortcodeName}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create placeholder that will be replaced in PostRenderer
      return `<div data-shortcode="${shortcodeName}" data-params="${encodeURIComponent(JSON.stringify(params))}" data-key="${key}"></div>`;
    } catch (error) {
      console.error(`Error parsing paired shortcode ${shortcodeName}:`, error);
      return match; // Return original on error
    }
  });
  
  console.log(`Paired shortcode processing complete. Found: ${foundPaired}`);
  console.log('Final result (first 500 chars):', result.substring(0, 500));
  
  return result;
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
          // Create a wrapper div for the React component
          const wrapper = document.createElement('div');
          wrapper.className = 'shortcode-wrapper not-prose max-w-3xl mx-auto overflow-hidden';
          wrapper.style.cssText = 'margin: 16px auto !important; padding: 0 !important;';
          
          // Replace the placeholder with the wrapper
          placeholder.parentNode?.replaceChild(wrapper, placeholder);
          
          // Use dynamic import to load createRoot only on client side
          import('react-dom/client').then(({ createRoot }) => {
            try {
              const root = createRoot(wrapper);
              root.render(component);
            } catch (error) {
              console.error('Error creating React root:', error);
              // Fallback to a simple error message
              wrapper.innerHTML = `<div class="p-4 bg-red-50 border border-red-200 rounded">Error loading ${shortcodeName} component</div>`;
            }
          }).catch((error) => {
            console.error('Error loading React DOM client:', error);
            wrapper.innerHTML = `<div class="p-4 bg-red-50 border border-red-200 rounded">Error loading ${shortcodeName} component</div>`;
          });
        }
      } catch (error) {
        console.error('Error processing shortcode placeholder:', error);
      }
    });
  }, []);
  
  return { processShortcodes };
}
