// src/app/api/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { searchPosts, getSortedPostsData, searchContentFiles } from '@/lib/markdown';

interface SearchResult {
  type: 'post' | 'category' | 'tag' | 'file';
  title: string;
  slug: string;
  excerpt?: string;
  tags?: string[];
  category?: string;
  date?: string;
  lang: string;
  score: number;
  // File-specific properties
  contentType?: string;
  extension?: string;
  href?: string;
  relativePath?: string;
  isBrowserViewable?: boolean;
  requiresDownload?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lang = searchParams.get('lang') || 'en';
    const type = searchParams.get('type') || 'all'; // 'posts', 'files', 'all'
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        query: query || '',
        results: [],
        total: 0,
        type,
        lang,
        error: 'Query too short'
      });
    }

    const results: SearchResult[] = [];

    // Search posts if requested
    if (type === 'posts' || type === 'all') {
      const posts = await searchPosts(query, lang);
      results.push(...posts.slice(0, Math.floor(limit * 0.7)).map(post => ({
        type: 'post' as const,
        title: post.title,
        slug: post.slugParts.join('/'),
        excerpt: post.excerpt || '',
        tags: post.tags || [],
        category: post.categories?.[0] || 'Uncategorized',
        date: post.date,
        lang: lang,
        href: post.href,
        score: 100 // Base score, could be enhanced later
      })));
    }

    // Search files if requested
    if (type === 'files' || type === 'all') {
      const files = await searchContentFiles(query, lang);
      results.push(...files.slice(0, Math.floor(limit * 0.3)).map(file => ({
        type: 'file' as const,
        title: file.filename,
        slug: file.relativePath,
        contentType: file.contentType,
        extension: file.extension,
        href: `/api/content/files/${file.relativePath}`,
        relativePath: file.relativePath,
        isBrowserViewable: file.isBrowserViewable,
        requiresDownload: file.requiresDownload,
        lang: lang,
        score: 80
      })));
    }

    // Get additional metadata for category/tag search (only if searching posts)
    let allPosts: any[] = [];
    if (type === 'posts' || type === 'all') {
      allPosts = await getSortedPostsData(lang);
    }

    // Add category and tag results (only if searching posts)
    if (type === 'posts' || type === 'all') {
      const queryLower = query.toLowerCase();
      const categories = new Set<string>();
      const tags = new Set<string>();
      
      allPosts.forEach(post => {
        post.categories?.forEach((cat: string) => {
          if (cat.toLowerCase().includes(queryLower)) {
            categories.add(cat);
          }
        });
        post.tags?.forEach((tag: string) => {
          if (tag.toLowerCase().includes(queryLower)) {
            tags.add(tag);
          }
        });
      });

      // Add category results
      Array.from(categories).slice(0, 3).forEach(category => {
        results.push({
          type: 'category' as const,
          title: category,
          slug: category.toLowerCase().replace(/\s+/g, '-'),
          href: `/categories/${lang}/${encodeURIComponent(category)}`,
          lang: lang,
          score: 50
        });
      });

      // Add tag results
      Array.from(tags).slice(0, 3).forEach(tag => {
        results.push({
          type: 'tag' as const,
          title: tag,
          slug: tag.toLowerCase().replace(/\s+/g, '-'),
          href: `/tags/${lang}/${encodeURIComponent(tag)}`,
          lang: lang,
          score: 30
        });
      });
    }

    // Sort by score and limit
    const finalResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return NextResponse.json({
      query,
      results: finalResults,
      total: finalResults.length,
      type,
      lang
    });
  } catch (error) {
    console.error('Search API error:', error);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lang = searchParams.get('lang') || 'en';
    const type = searchParams.get('type') || 'all';
    return NextResponse.json({
      query: query || '',
      results: [],
      total: 0,
      type,
      lang,
      error: 'Search failed'
    }, { status: 500 });
  }
}
