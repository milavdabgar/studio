// src/app/api/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { searchPosts, getSortedPostsData } from '@/lib/markdown';

interface SearchResult {
  type: 'post' | 'category' | 'tag';
  title: string;
  slug: string;
  excerpt?: string;
  tags?: string[];
  category?: string;
  date?: string;
  lang: string;
  score: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lang = searchParams.get('lang') || 'en';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        query: query || '',
        results: [],
        total: 0,
        error: 'Query too short'
      });
    }

    // Get search results
    const posts = await searchPosts(query, lang);
    const allPosts = await getSortedPostsData(lang);
    
    // Convert posts to search results format
    const results: SearchResult[] = posts.slice(0, limit).map(post => ({
      type: 'post' as const,
      title: post.title,
      slug: post.slugParts.join('/'),
      excerpt: post.excerpt || '',
      tags: post.tags || [],
      category: post.categories?.[0] || 'Uncategorized',
      date: post.date,
      lang: lang,
      score: 100 // Base score, could be enhanced later
    }));

    // Add category and tag results
    const queryLower = query.toLowerCase();
    const categories = new Set<string>();
    const tags = new Set<string>();
    
    allPosts.forEach(post => {
      post.categories?.forEach(cat => {
        if (cat.toLowerCase().includes(queryLower)) {
          categories.add(cat);
        }
      });
      post.tags?.forEach(tag => {
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
        lang: lang,
        score: 30
      });
    });

    // Sort by score and limit
    const finalResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return NextResponse.json({
      query,
      results: finalResults,
      total: finalResults.length
    });
  } catch (error) {
    console.error('Search API error:', error);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    return NextResponse.json({
      query: query || '',
      results: [],
      total: 0,
      error: 'Search failed'
    }, { status: 500 });
  }
}
