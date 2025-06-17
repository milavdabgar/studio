// src/app/api/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { searchPosts } from '@/lib/markdown';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lang = searchParams.get('lang') || 'en';

    if (!query) {
      return NextResponse.json([]);
    }

    const results = await searchPosts(query, lang);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
