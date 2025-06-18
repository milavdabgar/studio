// src/components/blog/Breadcrumbs.tsx
"use client";

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { Fragment } from 'react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  currentLang: string;
}

export function Breadcrumbs({ items, currentLang }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      <Link
        href="/"
        className="flex items-center hover:text-foreground transition-colors"
        title="Home"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>

      <ChevronRight className="h-4 w-4" />

      <Link
        href={`/posts/${currentLang}`}
        className="hover:text-foreground transition-colors"
      >
        {currentLang === 'gu' ? 'બ્લોગ' : 'Blog'}
      </Link>

      {items.map((item, index) => (
        <Fragment key={index}>
          <ChevronRight className="h-4 w-4" />
          {index === items.length - 1 ? (
            <span className="text-foreground font-medium" aria-current="page">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
