// src/components/shortcodes/Keyword.tsx
// Hugo Blowfish Keyword shortcode - for highlighting keywords
"use client";

import React from 'react';

interface KeywordProps {
  children?: React.ReactNode;
  className?: string;
  icon?: string;
}

export default function Keyword({ children, className = '', icon }: KeywordProps) {
  const keywordClasses = [
    'rounded-full',
    'bg-primary-500',
    'dark:bg-primary-400',
    'text-neutral-50',
    'dark:text-neutral-800',
    'px-1.5',
    'py-[1px]',
    'text-xs',
    'font-normal',
    'inline-flex',
    'items-center',
    'flex-row',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="flex mt-2">
      <span className={keywordClasses}>
        <span className="flex flex-row items-center">
          {icon && (
            <span className="mr-1">
              {/* Icon would go here - for now just a placeholder */}
              <span className="text-xs">🔧</span>
            </span>
          )}
          <span>{children}</span>
        </span>
      </span>
    </div>
  );
}

// Named export for compatibility
export { Keyword };
