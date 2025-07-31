// src/app/feed.xml/route.ts

import { getSortedPostsData } from '@/lib/markdown';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'en';
  
  try {
    const posts = await getSortedPostsData(lang);
    const baseUrl = 'https://gppalanpur.ac.in';
    
    const feedTitle = lang === 'gu' ? 'મિલાવ દબગર - બ્લોગ' : 'Milav Dabgar - Blog';
    const feedDescription = lang === 'gu' 
      ? 'ઇલેક્ટ્રોનિક્સ અને કોમ્યુનિકેશન એન્જિનિયરિંગ, ડેટા સાયન્સ અને ટેકનોલોજી વિશેના લેખો'
      : 'Articles about Electronics and Communication Engineering, Data Science, and Technology';

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${feedTitle}</title>
  <description>${feedDescription}</description>
  <link>${baseUrl}/posts/${lang}</link>
  <atom:link href="${baseUrl}/feed.xml?lang=${lang}" rel="self" type="application/rss+xml" />
  <language>${lang}</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <managingEditor>contact@milavdabgar.com (Milav Dabgar)</managingEditor>
  <webMaster>contact@milavdabgar.com (Milav Dabgar)</webMaster>
  <generator>Next.js</generator>
  <image>
    <url>${baseUrl}/favicon.ico</url>
    <title>${feedTitle}</title>
    <link>${baseUrl}</link>
  </image>
  ${posts.slice(0, 20).map(post => {
    const postDate = new Date(post.date || new Date());
    const postUrl = `${baseUrl}${post.href}`;
    
    return `
  <item>
    <title><![CDATA[${post.title}]]></title>
    <description><![CDATA[${post.excerpt || ''}]]></description>
    <link>${postUrl}</link>
    <guid isPermaLink="true">${postUrl}</guid>
    <pubDate>${postDate.toUTCString()}</pubDate>
    ${post.author ? `<author>contact@milavdabgar.com (${Array.isArray(post.author) ? post.author.join(', ') : post.author})</author>` : ''}
    ${post.categories && post.categories.length > 0 ? 
      post.categories.map(cat => `<category><![CDATA[${cat}]]></category>`).join('\n    ') : ''
    }
  </item>`;
  }).join('')}
</channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('RSS Feed generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate RSS feed' },
      { status: 500 }
    );
  }
}
