// src/components/shortcodes/Mermaid.tsx
"use client";

import React, { useEffect, useRef } from 'react';

interface MermaidProps {
  children?: string;
}

export function Mermaid({ children }: MermaidProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMermaid = async () => {
      try {
        // Dynamically import mermaid to avoid SSR issues
        const mermaid = (await import('mermaid')).default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
        });

        if (!children || !children.trim()) {
          // Provide fallback diagram when no content is provided
          // Provide a default diagram if no content is provided
          const defaultDiagram = `graph LR;
    A[Start] --> B[Process];
    B --> C[End];`;
          
          if (elementRef.current) {
            elementRef.current.innerHTML = '';
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            const { svg } = await mermaid.render(id, defaultDiagram);
            elementRef.current.innerHTML = svg;
          }
          return;
        }
        
        if (elementRef.current) {
          // Clear previous content
          elementRef.current.innerHTML = '';
          
          // Generate unique ID
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          
          // Render mermaid diagram
          const { svg } = await mermaid.render(id, children.trim());
          elementRef.current.innerHTML = svg;
        }
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
        if (elementRef.current) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          elementRef.current.innerHTML = `<div class="text-red-500 p-4 border border-red-200 rounded">Error rendering Mermaid diagram: ${errorMessage}</div>`;
        }
      }
    };

    loadMermaid();
  }, [children]);

  return (
    <div 
      ref={elementRef}
      className="flex justify-center my-4"
    />
  );
}

export default Mermaid;
