"use client";

// src/components/shortcodes/Gallery.tsx
// Blowfish Gallery shortcode - Responsive image gallery with grid layouts

import React from 'react';

interface GalleryProps {
  children?: React.ReactNode;
}

const Gallery: React.FC<GalleryProps> = ({ children }) => {
  if (!children) {
    return (
      <div className="my-6 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center text-neutral-500 dark:text-neutral-400">
        No images provided for gallery
      </div>
    );
  }

  return (
    <div className="my-6">
      <div 
        className="gallery-grid grid gap-2"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.5rem'
        }}
      >
        {children}
      </div>
      
      <style jsx global>{`
        /* Grid width classes for responsive layouts */
        .gallery-grid img {
          width: 100%;
          height: auto;
          object-fit: cover;
          border-radius: 0.375rem;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          cursor: pointer;
        }
        
        .gallery-grid img:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        /* Grid width classes */
        @media (min-width: 768px) {
          .gallery-grid {
            grid-template-columns: repeat(12, 1fr) !important;
          }
          
          .gallery-grid .grid-w33 { grid-column: span 4; }
          .gallery-grid .grid-w50 { grid-column: span 6; }
          .gallery-grid .grid-w66 { grid-column: span 8; }
          .gallery-grid .grid-w25 { grid-column: span 3; }
          .gallery-grid .grid-w75 { grid-column: span 9; }
          .gallery-grid .grid-w100 { grid-column: span 12; }
        }
        
        @media (min-width: 1024px) {
          .gallery-grid {
            grid-template-columns: repeat(20, 1fr) !important;
          }
          
          .gallery-grid .grid-w10 { grid-column: span 2; }
          .gallery-grid .grid-w20 { grid-column: span 4; }
          .gallery-grid .grid-w25 { grid-column: span 5; }
          .gallery-grid .grid-w33 { grid-column: span 7; }
          .gallery-grid .grid-w50 { grid-column: span 10; }
          .gallery-grid .grid-w66 { grid-column: span 13; }
          .gallery-grid .grid-w75 { grid-column: span 15; }
          .gallery-grid .grid-w100 { grid-column: span 20; }
        }
      `}</style>
    </div>
  );
};

export default Gallery;
