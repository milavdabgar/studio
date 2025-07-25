// src/components/blog/PostRenderer.tsx
"use client";

import React, { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { createRoot } from 'react-dom/client';
import CodeBlock from '../ui/code-block';
import { useShortcodeProcessor } from '@/lib/shortcodes';
import { SlidevEmbedded } from '../slidev/SlidevEmbedded';
import type { ContentType } from '@/lib/content-types-client';
import { requiresDownload } from '@/lib/content-types-client';

interface PostRendererProps {
  contentHtml: string;
  contentType?: ContentType;
  rawContent?: string;
  slugParts?: string[];
}

const PostRenderer: React.FC<PostRendererProps> = ({ 
  contentHtml, 
  contentType = 'markdown',
  rawContent,
  slugParts
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();
  const { processShortcodes: processShortcodeElements } = useShortcodeProcessor();

  // Call all hooks unconditionally
  useEffect(() => {
    // Skip effect for Slidev content
    if (contentType === 'slidev') return;
    
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
            className="my-4 rounded-lg border overflow-hidden dark:border-gray-700"
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

    // Inline SVG images to make text selectable
    const inlineSvgImages = async () => {
      const images = containerRef.current?.querySelectorAll('img[src$=".svg"]');
      const inlinePromises = Array.from(images || []).map(async (img) => {
        try {
          const src = img.getAttribute('src');
          if (!src) return;
          
          // Build the API URL if it's a relative path
          let svgUrl = src;
          if (!src.startsWith('http') && !src.startsWith('/api/')) {
            const currentPath = window.location.pathname;
            if (src.startsWith('/')) {
              svgUrl = `/api/content-images${src}`;
            } else {
              const contentMatch = currentPath.match(/^\/posts\/[^\/]+\/(.+)$/);
              if (contentMatch) {
                const contentPath = contentMatch[1];
                const contentDir = contentPath.split('/').slice(0, -1).join('/');
                svgUrl = `/api/content-images/${contentDir}/${src}`;
              } else {
                svgUrl = `/api/content-images/${src}`;
              }
            }
          }
          
          console.log('PostRenderer: Fetching SVG for inlining:', svgUrl);
          
          // Fetch the SVG content
          const response = await fetch(svgUrl);
          if (!response.ok) {
            console.warn('PostRenderer: Failed to fetch SVG:', svgUrl, response.status);
            return;
          }
          
          const svgContent = await response.text();
          
          // Create a container div with the same attributes as the original img
          const container = document.createElement('div');
          container.className = 'inline-svg-container';
          
          // Copy img attributes to the container
          const alt = img.getAttribute('alt');
          const title = img.getAttribute('title');
          const className = img.getAttribute('class');
          
          if (className) container.className += ` ${className}`;
          if (title) container.setAttribute('title', title);
          
          // Parse SVG and ensure it has proper styling
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
          const svgElement = svgDoc.querySelector('svg');
          
          if (svgElement) {
            // Ensure SVG is responsive and properly styled
            svgElement.setAttribute('class', 'inline-svg max-w-full h-auto');
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            
            // Add the SVG to the container
            container.innerHTML = svgElement.outerHTML;
            
            // Add caption if alt text exists
            if (alt) {
              const caption = document.createElement('figcaption');
              caption.className = 'image-caption text-sm text-muted-foreground mt-2 text-center';
              caption.textContent = alt;
              container.appendChild(caption);
            }
            
            // Replace the img element with the container
            img.parentNode?.replaceChild(container, img);
            
            console.log('PostRenderer: Successfully inlined SVG:', src);
          }
        } catch (error) {
          console.error('PostRenderer: Error inlining SVG:', error);
        }
      });
      
      await Promise.all(inlinePromises);
    };

    // Enhance remaining non-SVG images with lazy loading, captions, and fix relative paths
    const enhanceImages = () => {
      const images = containerRef.current?.querySelectorAll('img:not([src$=".svg"])');
      images?.forEach((img) => {
        img.setAttribute('loading', 'lazy');
        
        // Fix relative image paths to use content-images API
        const src = img.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('/api/')) {
          // Get the current page path to determine relative path context
          const currentPath = window.location.pathname;
          let newSrc;
          
          if (src.startsWith('/')) {
            // Absolute path within content, use as-is with content-images API
            newSrc = `/api/content-images${src}`;
          } else {
            // Relative path, need to resolve based on current page location
            // Extract content path from current URL
            const contentMatch = currentPath.match(/^\/posts\/[^\/]+\/(.+)$/);
            if (contentMatch) {
              const contentPath = contentMatch[1];
              const contentDir = contentPath.split('/').slice(0, -1).join('/');
              newSrc = `/api/content-images/${contentDir}/${src}`;
            } else {
              // Fallback for other page structures
              newSrc = `/api/content-images/${src}`;
            }
          }
          
          console.log('PostRenderer: Converting image src:', src, '→', newSrc);
          img.setAttribute('src', newSrc);
        }
        
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
      
      // Use the shortcode processor hook to render actual React components
      processShortcodeElements(containerRef);
    };
    
    const initializeContent = async () => {
      generateHeadingIds();
      enhanceCodeBlocks();
      enhanceLinks();
      enhanceTables();
      await inlineSvgImages(); // Inline SVGs first to make text selectable
      enhanceImages(); // Then enhance remaining non-SVG images
      processShortcodesInContent();
    };
    
    initializeContent();

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

  }, [contentHtml, theme, resolvedTheme, processShortcodeElements]);

  // If this is Slidev content, render the embedded native Slidev
  if (contentType === 'slidev' && slugParts) {
    // Extract just the filename from the slug parts (last part is the markdown filename)
    const filename = slugParts[slugParts.length - 1];
    
    return (
      <div className="slidev-wrapper">
        <SlidevEmbedded presentationPath={filename} title={`Slidev Presentation`} />
      </div>
    );
  }

  // If this is PDF content, render the embedded PDF viewer
  if (contentType === 'pdf' && slugParts) {
    const pdfFilename = slugParts[slugParts.length - 1];
    const pdfPath = `/api/content/pdfs/${slugParts.join('/')}`;
    
    return (
      <div className="pdf-wrapper w-full">
        <div className="pdf-viewer-container bg-gray-50 rounded-lg border">
          <div className="pdf-header bg-gray-100 px-4 py-3 border-b">
            <h3 className="text-lg font-semibold text-gray-800">PDF Document</h3>
            <p className="text-sm text-gray-600">
              {pdfFilename?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'PDF Document'}
            </p>
          </div>
          <div className="pdf-content" style={{ height: '80vh' }}>
            <iframe
              src={pdfPath}
              className="w-full h-full border-0"
              title={`PDF: ${pdfFilename}`}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    );
  }

  // Handle other file types (images, documents, etc.)
  if (contentType && contentType !== 'markdown' && contentType !== 'slidev' && contentType !== 'pdf' && slugParts) {
    const filename = slugParts[slugParts.length - 1];
    const filePath = `/api/content/files/${slugParts.join('/')}`;
    const shouldDownload = requiresDownload(contentType);
    
    // Create display name from filename
    const displayName = filename?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'File';
    
    // Get file icon based on content type
    const getFileIcon = (type: ContentType) => {
      switch (type) {
        case 'docx':
          return '📄';
        case 'pptx':
          return '📊';
        case 'xlsx':
          return '📈';
        case 'image':
          return '🖼️';
        case 'text':
          return '📝';
        default:
          return '📁';
      }
    };
    
    return (
      <div className="file-wrapper w-full">
        <div className="file-viewer-container bg-gray-50 rounded-lg border p-8 text-center">
          <div className="file-icon text-6xl mb-4">
            {getFileIcon(contentType)}
          </div>
          <div className="file-info mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{displayName}</h3>
            <p className="text-sm text-gray-600 uppercase tracking-wide">
              {contentType} File
            </p>
          </div>
          <div className="file-actions space-x-4">
            {shouldDownload ? (
              <a
                href={filePath}
                download
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download {contentType.toUpperCase()}
              </a>
            ) : (
              <a
                href={filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in New Tab
              </a>
            )}
            <a
              href={filePath}
              download
              className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Log the contentHtml to see if Gallery shortcodes are present
  console.log('PostRenderer: contentHtml includes gallery:', contentHtml.includes('gallery'));
  console.log('PostRenderer: contentHtml includes data-shortcode:', contentHtml.includes('data-shortcode'));
  
  if (contentHtml.includes('gallery')) {
    console.log('PostRenderer: Gallery-related content found in HTML');
    // Extract gallery-related content for debugging
    const galleryMatches = contentHtml.match(/data-shortcode="gallery"[^>]*>/g);
    if (galleryMatches) {
      console.log('PostRenderer: Gallery shortcode placeholders found:', galleryMatches);
    }
  }

  return (
    <div 
      ref={containerRef}
      className="prose prose-lg dark:prose-invert max-w-none markdown-content"
      dangerouslySetInnerHTML={{ __html: contentHtml }} 
    />
  );
};

export default PostRenderer;