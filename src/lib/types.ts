// src/lib/types.ts

export interface PostData {
  id: string;
  slugParts: string[];
  lang: string;
  title: string;
  date: string;
  contentHtml: string;
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
