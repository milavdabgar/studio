// src/components/slidev/SlidevSlide.tsx
"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { processSlidevMarkdown, getLayoutInfo, type SlidevSlide as SlidevSlideType } from '@/lib/slidev-parser';

interface SlidevSlideProps {
  slide: SlidevSlideType;
  slideNumber: number;
  totalSlides: number;
  theme: string;
}

export function SlidevSlide({ slide, slideNumber, totalSlides, theme }: SlidevSlideProps) {
  const layoutInfo = getLayoutInfo(slide.layout);
  
  // Process Slidev-specific markdown syntax
  const processedContent = processSlidevMarkdown(slide.content);

  // Generate slide styles
  const slideStyles: React.CSSProperties = {
    background: slide.background || undefined,
    backgroundImage: slide.background?.startsWith('url') || slide.background?.startsWith('http') 
      ? `url(${slide.background})` 
      : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  return (
    <div 
      className={`
        slidev-slide 
        ${layoutInfo.class} 
        ${slide.class || ''} 
        theme-${theme}
      `.trim()}
      style={slideStyles}
    >
      {/* Slide content area */}
      <div className="slidev-slide-content">
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          components={{
            // Custom heading components
            h1: ({ children, ...props }: any) => (
              <h1 className="slidev-h1" {...props}>{children}</h1>
            ),
            h2: ({ children, ...props }: any) => (
              <h2 className="slidev-h2" {...props}>{children}</h2>
            ),
            h3: ({ children, ...props }: any) => (
              <h3 className="slidev-h3" {...props}>{children}</h3>
            ),
            
            // Custom paragraph component
            p: ({ children, ...props }: any) => (
              <p className="slidev-p" {...props}>{children}</p>
            ),
            
            // Custom list components
            ul: ({ children, ...props }: any) => (
              <ul className="slidev-ul" {...props}>{children}</ul>
            ),
            ol: ({ children, ...props }: any) => (
              <ol className="slidev-ol" {...props}>{children}</ol>
            ),
            li: ({ children, ...props }: any) => (
              <li className="slidev-li" {...props}>{children}</li>
            ),
            
            // Custom code components
            code: ({ children, className, ...props }: any) => {
              const isInline = !className;
              return (
                <code 
                  className={`${isInline ? 'slidev-inline-code' : 'slidev-code-block'} ${className || ''}`}
                  {...props}
                >
                  {children}
                </code>
              );
            },
            
            // Custom blockquote
            blockquote: ({ children, ...props }: any) => (
              <blockquote className="slidev-blockquote" {...props}>{children}</blockquote>
            ),
            
            // Custom image handling
            img: ({ src, alt, title, ...props }: any) => (
              <img 
                src={src} 
                alt={alt} 
                title={title}
                className="slidev-img"
                {...props}
              />
            ),
            
            // Custom link handling
            a: ({ href, children, ...props }: any) => (
              <a 
                href={href} 
                className="slidev-link"
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                {...props}
              >
                {children}
              </a>
            ),
            
            // Custom table components
            table: ({ children, ...props }: any) => (
              <div className="slidev-table-wrapper">
                <table className="slidev-table" {...props}>{children}</table>
              </div>
            ),
            
            // Custom div to handle Slidev-specific containers
            div: ({ children, className, ...props }: any) => (
              <div className={`${className || ''}`} {...props}>{children}</div>
            )
          } as Components}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
      
      {/* Slide footer with number */}
      <div className="slidev-slide-footer">
        <div className="slidev-slide-number">
          {slideNumber} / {totalSlides}
        </div>
      </div>
      
      {/* Layout-specific decorations */}
      {slide.layout === 'cover' && (
        <div className="slidev-cover-decoration">
          <div className="slidev-cover-pattern"></div>
        </div>
      )}
    </div>
  );
}
