// src/components/shortcodes/Figure.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, ZoomIn } from 'lucide-react';
import { useState } from 'react';

interface FigureProps {
  src: string;
  alt?: string;
  caption?: string;
  title?: string;
  link?: string;
  target?: '_blank' | '_self';
  width?: number;
  height?: number;
  align?: 'left' | 'center' | 'right';
  class?: string;
  attr?: string; // Attribution text
  attrlink?: string; // Attribution link
  rel?: string;
  loading?: 'lazy' | 'eager';
  zoom?: boolean; // Enable zoom on click
}

export function Figure({
  src,
  alt = '',
  caption,
  title,
  link,
  target = '_blank',
  width = 400,
  height = 300,
  align = 'center',
  class: className = '',
  attr,
  attrlink,
  rel = 'noopener noreferrer',
  loading = 'lazy',
  zoom = true
}: FigureProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Handle image paths - use content-images API for relative paths
  const fixedSrc = (() => {
    if (!src) return src;
    if (src.startsWith('http')) return src; // External URL
    if (src.startsWith('/api/')) return src; // Already an API route
    if (src.startsWith('/') && src.includes('/content/')) return src; // Already absolute path to content
    
    // For relative paths, use the content-images API
    if (!src.startsWith('/')) {
      return `/api/content-images/development/shortcodes/${src}`;
    }
    
    // For absolute paths that might be in content, use content-images API
    return `/api/content-images${src}`;
  })();

  const alignmentClass = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto'
  }[align];

  const handleImageClick = () => {
    if (zoom && !link) {
      setIsZoomed(true);
    }
  };

  const handleZoomClose = () => {
    setIsZoomed(false);
  };

  const imageElement = (
    <div className="relative group">
      {imageError ? (
        <div 
          className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
          style={{ width, height: height || width * 0.6 }}
        >
          <span className="text-gray-500 text-sm dark:text-gray-400">Image failed to load</span>
        </div>
      ) : (
        <Image
          src={fixedSrc}
          alt={alt}
          title={title}
          width={width}
          height={height}
          className={`rounded-lg transition-transform duration-200 max-w-full ${zoom && !link ? 'cursor-zoom-in hover:scale-105' : ''} ${className}`}
          style={{ height: 'auto' }} // Maintain aspect ratio
          loading={loading}
          onError={() => setImageError(true)}
          onClick={handleImageClick}
        />
      )}
      
      {zoom && !link && !imageError && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black bg-opacity-50 text-white p-1 rounded-full">
            <ZoomIn className="h-4 w-4" />
          </div>
        </div>
      )}
    </div>
  );

  const content = (
    <div className="w-full max-w-lg sm:max-w-xl mx-auto">
      <figure className={`m-0 ${alignmentClass}`}>
        {link ? (
          <Link 
            href={link} 
            target={target}
            rel={target === '_blank' ? rel : undefined}
            className="inline-block relative group"
          >
            {imageElement}
            {target === '_blank' && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black bg-opacity-50 text-white p-1 rounded-full">
                  <ExternalLink className="h-4 w-4" />
                </div>
              </div>
            )}
          </Link>
        ) : (
          imageElement
        )}
        
        {(caption || attr) && (
          <figcaption className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          {caption && <span>{caption}</span>}
          {caption && attr && <span> - </span>}
          {attr && (
            attrlink ? (
              <Link 
                href={attrlink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
                dangerouslySetInnerHTML={{ __html: attr }}
              />
            ) : (
              <span dangerouslySetInnerHTML={{ __html: attr }} />
            )
          )}
        </figcaption>
      )}
      </figure>
    </div>
  );

  return (
    <>
      {content}
      
      {/* Zoom Modal */}
      {isZoomed && !imageError && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={handleZoomClose}
        >
          <div className="relative max-w-full max-h-full">
            <Image
              src={fixedSrc}
              alt={alt}
              width={width * 1.5}
              height={height * 1.5}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={handleZoomClose}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Figure;
