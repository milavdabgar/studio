// src/components/shortcodes/Badge.tsx
"use client";

import React from 'react';

interface BadgeProps {
  children?: React.ReactNode;
}

export function Badge({ children }: BadgeProps) {
  // Exact Blowfish badge styling
  return (
    <span className="text-white bg-primary-600 hover:bg-primary-700 inline-block cursor-pointer px-2 py-1 mr-2 text-xs font-normal rounded">
      {children}
    </span>
  );
}

export default Badge;
