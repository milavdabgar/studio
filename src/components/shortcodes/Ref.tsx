"use client";

// src/components/shortcodes/Ref.tsx
// Blowfish Ref shortcode - Cross-references to other pages

import React from 'react';
import Link from 'next/link';

interface RefProps {
  // Positional parameter - the reference path
  children?: React.ReactNode;
  '0'?: string; // path as positional parameter
  id?: string; // First positional parameter gets mapped to id
  // Named parameters
  path?: string;
  text?: string;
  title?: string;
}

const Ref: React.FC<RefProps> = (props) => {
  // Extract the path (support both positional and named parameters)
  // For Hugo {{< ref "charts" >}}, the path comes as the first parameter
  // which gets mapped to 'id' by the parser
  const path = props['0'] || props.id || props.path || '';
  const text = props.text;
  const title = props.title;
  
  if (!path) {
    return (
      <span className="text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-sm">
        [Ref Error: No path provided]
      </span>
    );
  }

  // Convert Hugo-style paths to Next.js paths
  let href = '';
  const cleanPath = path.replace(/['"]/g, ''); // Remove quotes
  
  // Handle common patterns
  if (cleanPath === 'charts') {
    href = '/posts/en/samples/charts';
  } else if (cleanPath === 'samples/icons') {
    href = '/posts/en/samples/icons';
  } else if (cleanPath === 'partials#icon' || cleanPath === 'partials') {
    href = '/docs/partials';
  } else if (cleanPath === 'mathematical-notation') {
    href = '/posts/en/samples/mathematical-notation';
  } else if (cleanPath === 'diagrams-flowcharts') {
    href = '/posts/en/samples/diagrams-flowcharts';
  } else {
    // Default behavior: assume it's a relative path under /posts/en/
    href = cleanPath.startsWith('/') ? cleanPath : `/posts/en/${cleanPath}`;
  }
  
  // Generate display text - use the original path if no custom text provided
  const displayText = text || title || href;

  return (
    <Link 
      href={href}
      className="text-primary-600 dark:text-primary-400 hover:text-primary dark:hover:text-primary-700 dark:hover:text-primary dark:hover:text-primary-300 transition-colors duration-200 underline decoration-primary-600/30 hover:decoration-primary-600/60"
      title={title}
    >
      {displayText}
    </Link>
  );
};

export default Ref;
