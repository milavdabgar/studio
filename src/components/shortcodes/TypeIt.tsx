// src/components/shortcodes/TypeIt.tsx
// Hugo Blowfish TypeIt shortcode - typewriter effect animations
"use client";

import React, { useEffect, useRef } from 'react';
import TypeItLib from 'typeit';

interface TypeItProps {
  children?: React.ReactNode;
  tag?: string; // HTML tag to use (default: 'span')
  classList?: string; // CSS classes to apply
  initialString?: string; // Initial string that will be replaced
  speed?: number; // Typing speed in milliseconds
  startDelay?: number; // Delay before starting
  breakLines?: boolean; // Whether to break lines
  nextStringDelay?: number; // Delay between strings
  loop?: boolean; // Whether to loop the animation
  className?: string;
}

export default function TypeIt({ 
  children,
  tag = 'span',
  classList = '',
  initialString = '',
  speed = 50,
  startDelay = 0,
  breakLines = false,
  nextStringDelay = 750,
  loop = false,
  className = ''
}: TypeItProps) {
  const elementRef = useRef<HTMLElement>(null);
  const typeItRef = useRef<TypeItLib | null>(null);

  useEffect(() => {
    const loadTypeIt = async () => {
      try {
        if (!elementRef.current) return;

        // Destroy existing instance
        if (typeItRef.current) {
          typeItRef.current.destroy();
        }

        // Get content to type
        const content = children ? String(children) : '';
        
        // Initialize TypeIt
        typeItRef.current = new TypeItLib(elementRef.current, {
          speed: speed,
          startDelay: startDelay,
          breakLines: breakLines,
          nextStringDelay: nextStringDelay,
          loop: loop,
        });

        // Add initial string if provided
        if (initialString) {
          typeItRef.current.type(initialString).delete().pause(500);
        }

        // Add main content
        if (content) {
          typeItRef.current.type(content);
        }

        // Start the animation
        typeItRef.current.go();

      } catch (error) {
        console.warn('TypeIt library not found, falling back to static text:', error);
        // Fallback: just show the text statically
        if (elementRef.current && children) {
          elementRef.current.textContent = String(children);
        }
      }
    };

    loadTypeIt();

    return () => {
      if (typeItRef.current) {
        typeItRef.current.destroy();
      }
    };
  }, [children, speed, startDelay, breakLines, nextStringDelay, loop, initialString]);

  const combinedClasses = [
    'typeit',
    classList,
    className
  ].filter(Boolean).join(' ');

  // Create the element using the specified tag
  const TagName = tag as keyof JSX.IntrinsicElements;

  return React.createElement(
    TagName,
    {
      ref: elementRef,
      className: combinedClasses,
      'aria-label': 'Animated text'
    },
    // Fallback content for SSR
    children
  );
}

// Named export for compatibility
export { TypeIt };
