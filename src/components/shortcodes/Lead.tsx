// src/components/shortcodes/Lead.tsx
// Hugo Blowfish Lead shortcode - for emphasized introductory paragraphs
"use client";

import React from 'react';

interface LeadProps {
  children?: React.ReactNode;
  className?: string;
}

export default function Lead({ children, className = '' }: LeadProps) {
  const leadClasses = [
    'lead',
    'text-neutral-500',
    'dark:text-neutral-400',
    '!mb-9',
    'text-xl',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={leadClasses}>
      {children}
    </div>
  );
}

// Named export for compatibility
export { Lead };
