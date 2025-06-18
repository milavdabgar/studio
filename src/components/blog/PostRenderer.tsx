// src/components/blog/PostRenderer.tsx
"use client";

import React, { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { createRoot } from 'react-dom/client';
import CodeBlock from '../ui/code-block';
import { useShortcodeProcessor } from '@/lib/shortcodes';

interface PostRendererProps {
  contentHtml: string;
}

const PostRenderer: React.FC<PostRendererProps> = ({ contentHtml }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();
  const { processShortcodes: processShortcodeElements } = useShortcodeProcessor();

  useEffect(() => {
    if (!containerRef.current) return;

    // Generate IDs for headings to enable TOC functionality
    const generateHeadingIds = () => {
      const headings = containerRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings?.forEach((heading) => {
        if (!heading.id) {
          const text = heading.textContent || '';
          const id = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .trim();
          heading.id = id;
        }
      });
    };

    // Enhanced code block styling with syntax highlighting
    const enhanceCodeBlocks = () => {
      const codeBlocks = containerRef.current?.querySelectorAll('pre code');
      
      codeBlocks?.forEach((codeBlock) => {
        const pre = codeBlock.parentElement;
        if (!pre || pre.classList.contains('enhanced')) return;

        // Extract language from class name
        const className = codeBlock.className;
        const languageMatch = className.match(/language-(\w+)/);
        const language = languageMatch ? languageMatch[1] : 'text';
        
        // Skip mermaid blocks - they should be handled by the mermaid library
        if (language === 'mermaid') {
          // Mark the pre element for mermaid processing
          pre.classList.add('mermaid-source');
          return;
        }

        // Get the code content
        const code = codeBlock.textContent || '';
        
        // Create a wrapper for the enhanced code block
        const wrapper = document.createElement('div');
        wrapper.className = 'enhanced-code-block not-prose';
        
        // Mark as enhanced to avoid double processing
        pre.classList.add('enhanced');
        
        // Replace the pre element with our enhanced version
        pre.parentNode?.insertBefore(wrapper, pre);
        pre.remove();
        
        // Create React component using createRoot
        const root = createRoot(wrapper);
        root.render(
          <CodeBlock 
            code={code} 
            language={language}
            className="my-4 rounded-lg border overflow-hidden"
          />
        );
      });
    };

    // Enhance links to open external ones in new tab
    const enhanceLinks = () => {
      const links = containerRef.current?.querySelectorAll('a');
      links?.forEach((link) => {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('http') && !href.includes(window.location.hostname)) {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        }
      });
    };

    // Add table wrappers for responsive tables
    const enhanceTables = () => {
      const tables = containerRef.current?.querySelectorAll('table');
      tables?.forEach((table) => {
        if (table.parentElement?.classList.contains('table-wrapper')) return;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        table.parentNode?.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      });
    };

    // Enhance images with lazy loading and captions
    const enhanceImages = () => {
      const images = containerRef.current?.querySelectorAll('img');
      images?.forEach((img) => {
        img.setAttribute('loading', 'lazy');
        const alt = img.getAttribute('alt');
        if (alt && !img.nextElementSibling?.classList.contains('image-caption')) {
          const caption = document.createElement('figcaption');
          caption.className = 'image-caption';
          caption.textContent = alt;
          img.parentNode?.insertBefore(caption, img.nextSibling);
        }
      });
    };

    // Process shortcodes in the content
    const processShortcodesInContent = () => {
      if (!containerRef.current) return;
      
      // Find shortcode placeholders and replace with actual components
      const shortcodePlaceholders = containerRef.current.querySelectorAll('[data-shortcode]');
      
      shortcodePlaceholders.forEach((placeholder) => {
        const shortcodeName = placeholder.getAttribute('data-shortcode');
        const paramsString = placeholder.getAttribute('data-params');
        
        if (!shortcodeName || !paramsString) return;
        
        try {
          const params = JSON.parse(decodeURIComponent(paramsString));
          
          // Create enhanced placeholder with better styling
          const enhancedPlaceholder = document.createElement('div');
          enhancedPlaceholder.className = 'shortcode-component my-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm';
          
          enhancedPlaceholder.innerHTML = `
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100">${shortcodeName.toUpperCase()} Component</h3>
                <p class="text-sm text-blue-600 dark:text-blue-300">Interactive ${shortcodeName} shortcode</p>
              </div>
            </div>
            
            ${renderShortcodePreview(shortcodeName, params)}
            
            <div class="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
              <details class="text-sm">
                <summary class="cursor-pointer text-blue-600 dark:text-blue-400 font-medium">View Parameters</summary>
                <pre class="mt-2 p-3 bg-blue-100 dark:bg-blue-900/30 rounded text-xs overflow-auto">${JSON.stringify(params, null, 2)}</pre>
              </details>
            </div>
          `;
          
          placeholder.parentNode?.replaceChild(enhancedPlaceholder, placeholder);
        } catch (error) {
          console.error('Error processing shortcode placeholder:', error);
        }
      });
    };
    
    // Helper function to render shortcode previews
    const renderShortcodePreview = (shortcodeName: string, params: any): string => {
      switch (shortcodeName.toLowerCase()) {
        case 'youtube':
          return `
            <div class="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
              <div class="text-center text-white">
                <svg class="w-16 h-16 mx-auto mb-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path>
                </svg>
                <p class="font-medium">YouTube Video</p>
                <p class="text-sm text-gray-300">ID: ${params.id || 'N/A'}</p>
              </div>
            </div>
          `;
        
        case 'figure':
          return `
            <div class="text-center">
              <div class="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3">
                <svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">${params.alt || params.caption || 'Figure Image'}</p>
            </div>
          `;
        
        case 'gallery':
        case 'image-gallery':
          const imageCount = params.images ? (Array.isArray(params.images) ? params.images.length : params.images.split(',').length) : 0;
          return `
            <div class="grid grid-cols-3 gap-2">
              ${Array.from({length: Math.min(imageCount, 3)}, (_, i) => `
                <div class="aspect-square bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              `).join('')}
            </div>
            <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">${imageCount} images in gallery</p>
          `;
        
        case 'qr':
        case 'qrcode':
          return `
            <div class="text-center">
              <div class="w-32 h-32 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center mx-auto mb-3">
                <div class="grid grid-cols-8 gap-px">
                  ${Array.from({length: 64}, (_, i) => `
                    <div class="w-1 h-1 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}"></div>
                  `).join('')}
                </div>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">QR Code: ${params.text?.substring(0, 30) || 'N/A'}...</p>
            </div>
          `;
        
        case 'x':
        case 'twitter':
          return `
            <div class="max-w-sm mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="font-medium text-gray-900 dark:text-gray-100">@${params.user || 'username'}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Twitter/X Post Preview</p>
                </div>
              </div>
            </div>
          `;
        
        case 'instagram':
          return `
            <div class="max-w-sm mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div class="aspect-square bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
                <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div class="p-3">
                <p class="text-sm text-gray-600 dark:text-gray-400">Instagram Post: ${params.id || 'N/A'}</p>
              </div>
            </div>
          `;
        
        default:
          return `
            <div class="text-center py-8">
              <svg class="w-12 h-12 mx-auto text-gray-400 mb-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
              </svg>
              <p class="text-gray-600 dark:text-gray-400">Custom Component Preview</p>
            </div>
          `;
      }
    };

    generateHeadingIds();
    enhanceCodeBlocks();
    enhanceLinks();
    enhanceTables();
    enhanceImages();
    processShortcodesInContent();

    // Initialize Mermaid for diagrams
    import('mermaid').then((mermaid) => {
      try {
        const currentTheme = resolvedTheme || theme || 'light';
        // Check if the page body has dark mode classes as fallback
        const bodyHasDark = document.body.classList.contains('dark') || document.documentElement.classList.contains('dark');
        const isDarkMode = currentTheme === 'dark' || bodyHasDark;
        
        const mermaidConfig = {
          startOnLoad: false,
          securityLevel: 'loose' as const,
          theme: (isDarkMode ? 'dark' : 'default') as 'dark' | 'default',
          themeVariables: isDarkMode ? {
            // Dark theme customization for better readability
            darkMode: true,
            background: '#1e293b', // slate-800
            primaryColor: '#3b82f6', // blue-500
            primaryTextColor: '#f1f5f9', // slate-100
            primaryBorderColor: '#475569', // slate-600
            lineColor: '#64748b', // slate-500
            secondaryColor: '#374151', // gray-700
            tertiaryColor: '#1f2937', // gray-800
            
            // Flowchart specific
            mainBkg: '#374151', // gray-700
            secondBkg: '#4b5563', // gray-600
            tertiaryBkg: '#6b7280', // gray-500
            
            // Text colors
            textColor: '#f1f5f9', // slate-100
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            fontSize: '14px',
            
            // Node colors
            nodeBkg: '#374151', // gray-700
            nodeBorder: '#6b7280', // gray-500
            clusterBkg: '#1f2937', // gray-800
            clusterBorder: '#4b5563', // gray-600
            
            // Edge colors
            edgeLabelBackground: '#1e293b', // slate-800
            activeTaskBkgColor: '#3b82f6', // blue-500
            activeTaskBorderColor: '#1d4ed8', // blue-700
            
            // Sequence diagram
            actorBkg: '#374151', // gray-700
            actorBorder: '#6b7280', // gray-500
            actorTextColor: '#f1f5f9', // slate-100
            actorLineColor: '#64748b', // slate-500
            signalColor: '#f1f5f9', // slate-100
            signalTextColor: '#f1f5f9', // slate-100
            labelBoxBkgColor: '#374151', // gray-700
            labelBoxBorderColor: '#6b7280', // gray-500
            labelTextColor: '#f1f5f9', // slate-100
            loopTextColor: '#f1f5f9', // slate-100
            noteBkgColor: '#1f2937', // gray-800
            noteBorderColor: '#4b5563', // gray-600
            noteTextColor: '#f1f5f9', // slate-100
            
            // Class diagram specific
            classText: '#f1f5f9', // slate-100
            classTitleColor: '#f1f5f9', // slate-100
            c4PersonBkg: '#374151', // gray-700
            c4PersonBorder: '#6b7280', // gray-500
            
            // State diagram
            labelColor: '#f1f5f9', // slate-100
            
            // Git diagram
            git0: '#ef4444', // red-500
            git1: '#f97316', // orange-500
            git2: '#eab308', // yellow-500
            git3: '#22c55e', // green-500
            git4: '#06b6d4', // cyan-500
            git5: '#3b82f6', // blue-500
            git6: '#8b5cf6', // violet-500
            git7: '#ec4899', // pink-500
            gitBranchLabel0: '#f1f5f9',
            gitBranchLabel1: '#f1f5f9',
            gitBranchLabel2: '#f1f5f9',
            gitBranchLabel3: '#f1f5f9',
            gitBranchLabel4: '#f1f5f9',
            gitBranchLabel5: '#f1f5f9',
            gitBranchLabel6: '#f1f5f9',
            gitBranchLabel7: '#f1f5f9',
          } : {}
        };
        
        console.log('Mermaid config:', mermaidConfig);
        console.log('Current theme:', theme, 'Resolved theme:', resolvedTheme, 'Using:', currentTheme);
        
        // Force re-initialize mermaid
        mermaid.default.initialize(mermaidConfig);
        
        // Find all mermaid elements with comprehensive selectors
        const mermaidSelectors = [
          'pre.mermaid',
          'pre.mermaid-source',
          'code.language-mermaid', 
          'div.mermaid',
          'pre > code.language-mermaid',
          'pre[class*="language-mermaid"]',
          'code[class*="language-mermaid"]'
        ];
        
        let elementsToRender: HTMLElement[] = [];
        
        mermaidSelectors.forEach(selector => {
          const found = Array.from(containerRef.current?.querySelectorAll(selector) || []);
          elementsToRender = [...elementsToRender, ...found] as HTMLElement[];
        });
        
        // Convert mermaid-source pre elements to proper mermaid elements
        const mermaidSources = Array.from(containerRef.current?.querySelectorAll('pre.mermaid-source') || []);
        mermaidSources.forEach((pre) => {
          try {
            const codeBlock = pre.querySelector('code.language-mermaid');
            if (codeBlock && codeBlock.textContent) {
              // Create a new div for mermaid content
              const mermaidDiv = document.createElement('div');
              mermaidDiv.className = 'mermaid';
              // Clean the text content to remove any HTML tags
              const cleanContent = codeBlock.textContent.trim();
              mermaidDiv.textContent = cleanContent;
              
              console.log('Converting mermaid source:', {
                original: codeBlock.innerHTML.substring(0, 100),
                cleaned: cleanContent.substring(0, 100)
              });
              
              // Replace the pre element
              if (pre.parentNode) {
                pre.parentNode.replaceChild(mermaidDiv, pre);
                elementsToRender.push(mermaidDiv);
              }
            }
          } catch (e) {
            console.error('Error converting mermaid-source to mermaid div:', e);
          }
        });
        
        // Remove duplicates
        elementsToRender = elementsToRender.filter((element, index, self) => 
          self.indexOf(element) === index
        );
        
        // Filter out elements that don't contain valid Mermaid syntax
        const validMermaidElements = elementsToRender.filter((element) => {
          const content = element.textContent?.trim() || '';
          const innerHTML = element.innerHTML || '';
          
          // Check if content looks like Mermaid (starts with diagram type keywords)
          const mermaidKeywords = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'pie', 'gitgraph'];
          const hasValidSyntax = mermaidKeywords.some(keyword => content.includes(keyword));
          const hasHTMLTags = content.includes('<') && content.includes('>');
          const hasCodeTags = innerHTML.includes('<code') || innerHTML.includes('</code>');
          
          if (hasHTMLTags || hasCodeTags) {
            console.warn('Skipping element with HTML/code tags:', {
              textContent: content.substring(0, 100),
              innerHTML: innerHTML.substring(0, 100),
              hasValidSyntax,
              hasHTMLTags,
              hasCodeTags
            });
            return false;
          }
          
          if (!hasValidSyntax) {
            console.warn('Skipping element without valid Mermaid keywords:', content.substring(0, 100));
            return false;
          }
          
          return true;
        });
        
        console.log('Found Mermaid elements:', elementsToRender.length, 'Valid:', validMermaidElements.length);
        console.log('Valid Mermaid elements:', validMermaidElements.map(el => ({
          tagName: el.tagName,
          className: el.className,
          content: el.textContent?.substring(0, 50)
        })));
        
        elementsToRender = validMermaidElements;
        
        if (elementsToRender.length > 0) {
          try {
            // Clear any existing SVG content to force re-render
            elementsToRender.forEach((element) => {
              const svg = element.querySelector('svg');
              if (svg) {
                svg.remove();
              }
            });
            
            // Enhanced DOM readiness check with multiple fallbacks
            const renderMermaidDiagrams = () => {
              try {
                // Verify all elements are still in DOM and have dimensions
                const validElements = elementsToRender.filter(element => {
                  if (!element.isConnected) return false;
                  try {
                    const rect = element.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0;
                  } catch {
                    return true; // If getBoundingClientRect fails, still try to render
                  }
                });
                
                if (validElements.length === 0) {
                  console.log('No valid Mermaid elements found for rendering');
                  return;
                }
                
                console.log(`Rendering ${validElements.length} valid Mermaid elements`);
                
                // Use run without nodes parameter for better compatibility
                mermaid.default.run()
                  .then(() => {
                    console.log('Mermaid diagrams rendered successfully');
                  })
                  .catch((error) => {
                    if (error && Object.keys(error).length > 0) {
                      console.error('Mermaid render error:', error);
                    } else {
                      console.log('Mermaid render completed with empty error (likely success)');
                    }
                  });
                  
              } catch (syncError) {
                console.error('Mermaid sync render error:', syncError);
              }
            };
            
            // Multiple attempts with increasing delays
            setTimeout(renderMermaidDiagrams, 50);
            setTimeout(() => {
              if (elementsToRender.some(el => !el.querySelector('svg'))) {
                console.log('Retrying Mermaid render for missing diagrams');
                renderMermaidDiagrams();
              }
            }, 200);
          } catch (renderError) {
            console.error('Error preparing Mermaid diagrams:', renderError);
          }
        }
      } catch (e) {
          console.error("Mermaid initialization or run error:", e);
      }
    }).catch(e => console.error("Failed to load Mermaid library:", e));

  }, [contentHtml, theme, resolvedTheme]);

  return (
    <div 
      ref={containerRef}
      className="prose prose-lg dark:prose-invert max-w-none markdown-content"
      dangerouslySetInnerHTML={{ __html: contentHtml }} 
    />
  );
};

export default PostRenderer;