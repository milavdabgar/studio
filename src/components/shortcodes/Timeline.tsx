// src/components/shortcodes/Timeline.tsx
"use client";

import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { TimelineItem } from './TimelineItem';

interface TimelineProps {
  children?: React.ReactNode | string;
}

export function Timeline({ children }: TimelineProps) {
  const containerRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof children !== 'string') return;

    // Set the HTML content first
    containerRef.current.innerHTML = children;

    // Find and render shortcode placeholders within the timeline
    const shortcodePlaceholders = containerRef.current.querySelectorAll('[data-shortcode]');
    
    shortcodePlaceholders.forEach((placeholder) => {
      const shortcodeName = placeholder.getAttribute('data-shortcode');
      const paramsString = placeholder.getAttribute('data-params');
      
      if (!shortcodeName || !paramsString) return;
      
      try {
        const params = JSON.parse(decodeURIComponent(paramsString));
        
        // Only handle TimelineItem shortcodes
        if (shortcodeName === 'timelineItem' || shortcodeName === 'TimelineItem') {
          // Create a new container for the React component
          const componentContainer = document.createElement('div');
          placeholder.parentNode?.replaceChild(componentContainer, placeholder);
          
          // Render the TimelineItem component
          const root = createRoot(componentContainer);
          root.render(React.createElement(TimelineItem, params));
        }
      } catch (error) {
        console.error('Error rendering nested shortcode:', shortcodeName, error);
      }
    });
  }, [children]);

  // If children is React nodes, render normally
  if (typeof children !== 'string') {
    return (
      <ol className="border-l-2 border-primary-500 dark:border-primary-300 list-none dark:border-gray-700">
        {children}
      </ol>
    );
  }

  // If children is a string (with shortcode placeholders), use the ref for processing
  return (
    <ol 
      ref={containerRef}
      className="border-l-2 border-primary-500 dark:border-primary-300 list-none dark:border-gray-700"
    />
  );
}

export default Timeline;
