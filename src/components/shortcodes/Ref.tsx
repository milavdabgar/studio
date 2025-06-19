"use client";

// src/components/shortcodes/Ref.tsx
// Blowfish Ref shortcode - Cross-references to other pages

import React from 'react';
import Link from 'next/link';

interface RefProps {
  // Positional parameter - the reference path
  children?: React.ReactNode;
  '0'?: string; // path as positional parameter
  // Named parameters
  path?: string;
  text?: string;
  title?: string;
}

const Ref: React.FC<RefProps> = (props) => {
  // Extract the path (support both positional and named parameters)
  const path = props['0'] || props.path || '';
  const text = props.text;
  const title = props.title;
  
  if (!path) {
    return (
      <span className="text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-sm">
        [Ref Error: No path provided]
      </span>
    );
  }

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Generate display text
  const displayText = text || title || path;

  return (
    <Link 
      href={normalizedPath}
      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200 underline decoration-primary-600/30 hover:decoration-primary-600/60"
      title={title}
    >
      {displayText}
    </Link>
  );
};

export default Ref;
