// src/components/blog/PostRenderer.tsx
"use client";

import React, { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { createRoot } from 'react-dom/client';
import CodeBlock from '../ui/code-block';

interface PostRendererProps {
  contentHtml: string;
}

const PostRenderer: React.FC<PostRendererProps> = ({ contentHtml }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

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

    enhanceCodeBlocks();
    enhanceLinks();
    enhanceTables();
    enhanceImages();

    // Initialize Mermaid for diagrams
    import('mermaid').then(mermaid => {
      try {
        mermaid.default.initialize({ 
          startOnLoad: false, 
          theme: theme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose',
        });
        const elementsToRender = Array.from(
          containerRef.current?.querySelectorAll('pre.mermaid, code.language-mermaid, div.mermaid') || []
        );
        if (elementsToRender.length > 0) {
           mermaid.default.run({
              nodes: elementsToRender as HTMLElement[],
            });
        }
      } catch (e) {
          console.error("Mermaid initialization or run error:", e);
      }
    }).catch(e => console.error("Failed to load Mermaid library:", e));

  }, [contentHtml, theme]);

  return (
    <div 
      ref={containerRef}
      className="prose prose-lg dark:prose-invert max-w-none markdown-content"
      dangerouslySetInnerHTML={{ __html: contentHtml }} 
    />
  );
};

export default PostRenderer;