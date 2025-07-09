// src/components/shortcodes/ShortcodeRenderer.tsx
"use client";

import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { YouTube, Figure, ImageGallery, TwitterEmbed, Instagram, QRCode, CodeBlock } from './index';

interface ShortcodeRendererProps {
  contentHtml: string;
}

const shortcodeComponents = {
  youtube: YouTube,
  YouTube: YouTube,
  x: TwitterEmbed,
  X: TwitterEmbed,
  twitter: TwitterEmbed,
  Twitter: TwitterEmbed,
  instagram: Instagram,
  Instagram: Instagram,
  figure: Figure,
  Figure: Figure,
  gallery: ImageGallery,
  'image-gallery': ImageGallery,
  ImageGallery: ImageGallery,
  qr: QRCode,
  QRCode: QRCode,
  code: CodeBlock,
  CodeBlock: CodeBlock,
};

export function ShortcodeRenderer({ contentHtml }: ShortcodeRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Set the HTML content
    containerRef.current.innerHTML = contentHtml;

    // Find and render shortcode placeholders
    const shortcodePlaceholders = containerRef.current.querySelectorAll('[data-shortcode]');
    
    shortcodePlaceholders.forEach((placeholder) => {
      const shortcodeName = placeholder.getAttribute('data-shortcode');
      const paramsString = placeholder.getAttribute('data-params');
      
      if (!shortcodeName || !paramsString) return;
      
      try {
        const params = JSON.parse(decodeURIComponent(paramsString));
        const Component = shortcodeComponents[shortcodeName as keyof typeof shortcodeComponents];
        
        if (Component) {
          // Create a new container for the React component
          const componentContainer = document.createElement('div');
          placeholder.parentNode?.replaceChild(componentContainer, placeholder);
          
          // Render the React component
          const root = createRoot(componentContainer);
          root.render(React.createElement(Component as React.ComponentType<unknown>, params));
        }
      } catch (error) {
        console.error('Error rendering shortcode:', shortcodeName, error);
        // Keep the placeholder as fallback
      }
    });
  }, [contentHtml]);

  return <div ref={containerRef} className="prose prose-lg dark:prose-invert max-w-none" />;
}

export default ShortcodeRenderer;
