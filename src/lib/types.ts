// src/lib/types.ts

import type { ContentType } from './content-types';

export interface PostData {
  id: string;
  slugParts: string[];
  lang: string;
  title: string;
  date: string;
  contentHtml: string;
  contentType?: ContentType; // Add content type
  rawContent?: string; // Add raw content for Slidev processing
  excerpt?: string;
  tags?: string[];
  categories?: string[];
  series?: string;
  author?: string;
  draft?: boolean;
  featured?: boolean;
  readingTime?: number;
  wordCount?: number;
  [key: string]: unknown;
}

export interface PostPreview {
  id: string;
  slugParts: string[];
  lang: string;
  title: string;
  date: string;
  excerpt?: string;
  href: string;
  tags?: string[];
  categories?: string[];
  series?: string;
  author?: string;
  draft?: boolean;
  featured?: boolean;
  readingTime?: number;
  wordCount?: number;
  [key: string]: unknown;
}
