// src/app/api/filter/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSortedPostsData, getAllContentFiles, getAllTags, getAllCategories } from '@/lib/markdown';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';
    const type = searchParams.get('type') || 'all'; // 'posts', 'files', 'all'
    const fileType = searchParams.get('fileType'); // 'pdf', 'docx', 'image', etc.
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const author = searchParams.get('author');
    const sortBy = searchParams.get('sortBy') || 'date'; // 'date', 'title', 'author'
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // 'asc', 'desc'
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const results: any[] = [];

    // Filter posts if requested
    if (type === 'posts' || type === 'all') {
      let posts = await getSortedPostsData(lang);
      
      // Apply tag filters
      if (tags.length > 0) {
        posts = posts.filter(post => 
          post.tags && tags.some(tag => post.tags!.includes(tag))
        );
      }

      // Apply category filters
      if (categories.length > 0) {
        posts = posts.filter(post => 
          post.categories && categories.some(category => post.categories!.includes(category))
        );
      }

      // Apply author filter
      if (author) {
        posts = posts.filter(post => 
          post.author && post.author.toLowerCase().includes(author.toLowerCase())
        );
      }

      // Convert to common format
      results.push(...posts.map(post => ({
        type: 'post',
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        href: post.href,
        date: post.date,
        lang: post.lang,
        tags: post.tags,
        categories: post.categories,
        author: post.author,
        contentType: 'markdown',
        featured: post.featured,
      })));
    }

    // Filter files if requested
    if (type === 'files' || type === 'all') {
      let files = await getAllContentFiles(lang);

      // Apply file type filter
      if (fileType) {
        files = files.filter(file => 
          file.contentType.toLowerCase() === fileType.toLowerCase() ||
          file.extension.toLowerCase() === `.${fileType.toLowerCase()}`
        );
      }

      // Convert to common format
      results.push(...files.map(file => ({
        type: 'file',
        id: file.id,
        title: file.filename,
        href: `/api/content/files/${file.relativePath}`,
        contentType: file.contentType,
        extension: file.extension,
        relativePath: file.relativePath,
        isBrowserViewable: file.isBrowserViewable,
        requiresDownload: file.requiresDownload,
        lang: lang,
      })));
    }

    // Sort results
    results.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'author':
          const authorA = a.author || '';
          const authorB = b.author || '';
          comparison = authorA.localeCompare(authorB);
          break;
        case 'date':
        default:
          if (a.date && b.date) {
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          } else if (a.date) {
            comparison = -1;
          } else if (b.date) {
            comparison = 1;
          }
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limit);
    const hasMore = results.length > offset + limit;

    // Get available filter options
    const availableFilters = {
      tags: await getAllTags(lang),
      categories: await getAllCategories(lang),
      fileTypes: [...new Set(
        (await getAllContentFiles(lang)).map(file => file.contentType)
      )].sort(),
    };

    return NextResponse.json({
      success: true,
      results: paginatedResults,
      total: results.length,
      hasMore,
      pagination: {
        limit,
        offset,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(results.length / limit),
      },
      filters: {
        type,
        fileType,
        tags,
        categories,
        author,
        sortBy,
        sortOrder,
        lang,
      },
      availableFilters,
    });

  } catch (error) {
    console.error('Filter API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error during filtering',
      results: [],
      total: 0,
    }, { status: 500 });
  }
}