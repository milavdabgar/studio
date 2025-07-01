// src/components/shortcodes/Swatches.tsx
// Hugo Blowfish Swatches shortcode - for displaying color palettes
"use client";

import React from 'react';

interface SwatchesProps {
  colors?: string; // Comma-separated list of colors
  names?: string; // Comma-separated list of color names
  className?: string;
}

export default function Swatches({ 
  colors = '', 
  names = '',
  className = '' 
}: SwatchesProps) {
  const colorList = colors.split(',').map(c => c.trim()).filter(Boolean);
  const nameList = names.split(',').map(n => n.trim()).filter(Boolean);

  if (colorList.length === 0) {
    return null;
  }

  const containerClasses = [
    'swatches',
    'flex',
    'flex-wrap',
    'gap-4',
    'my-4',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {colorList.map((color, index) => {
        const name = nameList[index] || color;
        
        return (
          <div key={index} className="swatch-item flex flex-col items-center">
            <div 
              className="swatch-color w-16 h-16 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 shadow-sm dark:border-gray-700"
              style={{ backgroundColor: color }}
              title={`${name}: ${color}`}
            />
            <div className="swatch-info text-center mt-2">
              <div className="swatch-name text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {name}
              </div>
              <div className="swatch-value text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                {color.toUpperCase()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Named export for compatibility
export { Swatches };
