// src/components/shortcodes/Button.tsx
"use client";

import React from 'react';

interface ButtonProps {
  href?: string;
  target?: string;
  rel?: string;
  children?: React.ReactNode;
}

export function Button({ href, target, rel, children }: ButtonProps) {
  // Exact Blowfish button styling and behavior
  return (
    <a
      className="!rounded-md bg-primary-600 px-4 py-2 !text-neutral !no-underline hover:!bg-primary-500 dark:bg-primary-800 dark:hover:!bg-primary-700"
      href={href}
      target={target}
      rel={rel}
      role="button"
    >
      {children}
    </a>
  );
}

export default Button;
