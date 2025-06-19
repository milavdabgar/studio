// src/components/shortcodes/KeywordList.tsx
// Hugo Blowfish KeywordList shortcode - for grouping multiple keywords
"use client";

import React from 'react';

interface KeywordListProps {
  children?: React.ReactNode;
  className?: string;
}

export default function KeywordList({ children, className = '' }: KeywordListProps) {
  const keywordListClasses = [
    'flex',
    'flex-row',
    'flex-wrap',
    'items-center',
    'space-x-2',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={keywordListClasses}>
      {children}
    </div>
  );
}

// Named export for compatibility
export { KeywordList };
