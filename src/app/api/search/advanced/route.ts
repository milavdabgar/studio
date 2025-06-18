// src/app/api/search/advanced/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSortedPostsData, getAllTags, getAllCategories, getAllAuthors } from '@/lib/markdown';
import { PostPreview } from '@/lib/types';

interface SearchFilters {
  query: string;
  category: string;
  tag: string;
  author: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResults {
  posts: PostPreview[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  filters: {
    categories: string[];
    tags: string[];
    authors: string[];
  };
}

function parseDate(dateString: string): Date {
  return new Date(dateString);
}

function isWithinDateRange(postDate: string, dateRange: string): boolean {
  if (!dateRange) return true;
  
  const now = new Date();
  const postDateObj = parseDate(postDate);
  
  switch (dateRange) {
    case 'last-week':
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return postDateObj >= oneWeekAgo;
    case 'last-month':
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      return postDateObj >= oneMonthAgo;
    case 'last-year':
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      return postDateObj >= oneYearAgo;
    default:
      return true;
  }
}

function calculateRelevanceScore(post: PostPreview, query: string): number {
  if (!query) return 0;
  
  const lowerQuery = query.toLowerCase();
  let score = 0;
  
  // Title match (highest weight)
  if (post.title.toLowerCase().includes(lowerQuery)) {
    score += 10;
    if (post.title.toLowerCase().startsWith(lowerQuery)) {
      score += 5; // Bonus for title starting with query
    }
  }
  
  // Exact title match
  if (post.title.toLowerCase() === lowerQuery) {
    score += 20;
  }
  
  // Excerpt match
  if (post.excerpt?.toLowerCase().includes(lowerQuery)) {
    score += 5;
  }
  
  // Tags match
  if (post.tags) {
    for (const tag of post.tags) {
      if (tag.toLowerCase().includes(lowerQuery)) {
        score += 3;
      }
    }
  }
  
  // Categories match
  if (post.categories) {
    for (const category of post.categories) {
      if (category.toLowerCase().includes(lowerQuery)) {
        score += 3;
      }
    }
  }
  
  // Author match
  if (post.author && post.author.toLowerCase().includes(lowerQuery)) {
    score += 2;
  }
  
  return score;
}

function filterPosts(posts: PostPreview[], filters: SearchFilters): PostPreview[] {
  return posts.filter(post => {
    // Query filter
    if (filters.query) {
      const searchableContent = [
        post.title,
        post.excerpt || '',
        ...(post.tags || []),
        ...(post.categories || []),
        post.author || ''
      ].join(' ').toLowerCase();
      
      if (!searchableContent.includes(filters.query.toLowerCase())) {
        return false;
      }
    }
    
    // Category filter
    if (filters.category) {
      if (!post.categories || !post.categories.includes(filters.category)) {
        return false;
      }
    }
    
    // Tag filter
    if (filters.tag) {
      if (!post.tags || !post.tags.includes(filters.tag)) {
        return false;
      }
    }
    
    // Author filter
    if (filters.author) {
      const authors = Array.isArray(post.author) ? post.author : [post.author];
      if (!authors.includes(filters.author)) {
        return false;
      }
    }
    
    // Date range filter
    if (filters.dateRange && !isWithinDateRange(post.date, filters.dateRange)) {
      return false;
    }
    
    return true;
  });
}

function sortPosts(posts: PostPreview[], sortBy: string, sortOrder: 'asc' | 'desc', query?: string): PostPreview[] {
  return posts.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'relevance':
        if (query) {
          const scoreA = calculateRelevanceScore(a, query);
          const scoreB = calculateRelevanceScore(b, query);
          comparison = scoreB - scoreA; // Higher score first
        } else {
          comparison = new Date(b.date).getTime() - new Date(a.date).getTime(); // Default to date
        }
        break;
      default:
        comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: SearchFilters = {
      query: searchParams.get('query') || '',
      category: searchParams.get('category') || '',
      tag: searchParams.get('tag') || '',
      author: searchParams.get('author') || '',
      dateRange: searchParams.get('dateRange') || '',
      sortBy: searchParams.get('sortBy') || 'date',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    };
    
    const lang = searchParams.get('lang') || 'en';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Get all posts for the language
    const allPosts = await getSortedPostsData(lang);
    
    // Get filter options
    const [allTags, allCategories, allAuthors] = await Promise.all([
      getAllTags(lang),
      getAllCategories(lang),
      getAllAuthors(lang)
    ]);
    
    // Filter posts
    const filteredPosts = filterPosts(allPosts, filters);
    
    // Sort posts
    const sortedPosts = sortPosts(filteredPosts, filters.sortBy, filters.sortOrder, filters.query);
    
    // Paginate results
    const totalResults = sortedPosts.length;
    const totalPages = Math.ceil(totalResults / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = sortedPosts.slice(startIndex, endIndex);
    
    const response: SearchResults = {
      posts: paginatedPosts,
      totalResults,
      currentPage: page,
      totalPages,
      filters: {
        categories: allCategories.map(cat => cat.name),
        tags: allTags.map(tag => tag.name),
        authors: allAuthors.map(author => author.name)
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Advanced search API error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed',
        posts: [],
        totalResults: 0,
        currentPage: 1,
        totalPages: 0,
        filters: { categories: [], tags: [], authors: [] }
      },
      { status: 500 }
    );
  }
}
