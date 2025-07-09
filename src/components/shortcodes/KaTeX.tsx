"use client";

// src/components/shortcodes/KaTeX.tsx
// Blowfish KaTeX shortcode - Mathematical expressions rendering

import React, { useEffect, useRef } from 'react';

interface KaTeXProps {
  children?: React.ReactNode;
  // KaTeX just needs to be included once per page to activate
}

const KaTeX: React.FC<KaTeXProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  useEffect(() => {
    // Load KaTeX library if not already loaded
    const loadKaTeX = async () => {
      // Check if KaTeX is already loaded
      if (window.katex || document.querySelector('script[src*="katex"]')) {
        setIsLoaded(true);
        return;
      }

      try {
        // Load KaTeX CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        cssLink.integrity = 'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV';
        cssLink.crossOrigin = 'anonymous';
        document.head.appendChild(cssLink);

        // Load KaTeX JS
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        script.integrity = 'sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnGctmUb0ZY0l8';
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          // Load auto-render extension
          const autoRenderScript = document.createElement('script');
          autoRenderScript.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js';
          autoRenderScript.integrity = 'sha384-+VBxd3r6XgURycqtZ117nYw44OOcIax56Z4dCRWbxyPt0Koah1uHoK0o4+/RRE05';
          autoRenderScript.crossOrigin = 'anonymous';
          autoRenderScript.onload = () => {
            setIsLoaded(true);
            renderMath();
          };
          document.head.appendChild(autoRenderScript);
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load KaTeX:', error);
      }
    };

    const renderMath = () => {
      if (window.renderMathInElement && containerRef.current) {
        // Find all elements in the document that might contain math
        const elementsToRender = document.querySelectorAll('.prose, .markdown-content, article, main, .content');
        
        elementsToRender.forEach(element => {
          try {
            window.renderMathInElement(element, {
              delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
              ],
              throwOnError: false,
              errorColor: '#cc0000',
              strict: false,
              trust: false,
              macros: {},
            });
          } catch (error) {
            console.warn('KaTeX rendering error:', error);
          }
        });
      }
    };

    loadKaTeX();

    // Re-render math when content changes
    const observer = new MutationObserver(() => {
      if (isLoaded) {
        setTimeout(renderMath, 100);
      }
    });

    if (containerRef.current) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    return () => {
      observer.disconnect();
    };
  }, [isLoaded]);

  return (
    <div 
      ref={containerRef}
      className="katex-enabler"
      style={{ display: 'none' }}
    >
      {/* This component just enables KaTeX on the page */}
      {children}
    </div>
  );
};

// Declare global types for KaTeX
declare global {
  interface Window {
    katex: unknown;
    renderMathInElement: (element: Element, options?: unknown) => void;
  }
}

export default KaTeX;
