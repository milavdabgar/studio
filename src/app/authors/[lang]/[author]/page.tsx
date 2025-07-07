// src/app/authors/[lang]/[author]/page.tsx

import { getPaginatedPostsByAuthor, getAllAuthors } from '@/lib/markdown';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { PostCard } from '@/components/blog/PostCard';
import { Pagination, PaginationInfo } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { languages } from '@/lib/config';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface AuthorPageProps {
  params: Promise<{ lang: string; author: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateStaticParams() {
  const staticParams: { lang: string; author: string }[] = [];
  
  for (const lang of Object.keys(languages)) {
    const authors = await getAllAuthors(lang);
    for (const { name: author } of authors) {
      staticParams.push({
        lang,
        author: encodeURIComponent(author),
      });
    }
  }
  
  return staticParams;
}

// Function to get author bio from content/authors directory
async function getAuthorInfo(authorName: string, lang: string) {
  try {
    const authorDir = path.join(process.cwd(), 'content', 'authors', authorName.toLowerCase());
    const authorFileName = lang === 'en' ? '_index.md' : `_index.${lang}.md`;
    const authorFilePath = path.join(authorDir, authorFileName);
    
    // Fallback to English if language-specific file doesn't exist
    const fallbackPath = path.join(authorDir, '_index.md');
    const finalPath = fs.existsSync(authorFilePath) ? authorFilePath : fallbackPath;
    
    if (fs.existsSync(finalPath)) {
      const fileContents = fs.readFileSync(finalPath, 'utf8');
      const { data, content } = matter(fileContents);
      return {
        title: data.title || authorName,
        description: data.description || '',
        content: content || ''
      };
    }
  } catch (error) {
    console.warn(`Could not load author info for ${authorName}:`, error);
  }
  
  return {
    title: authorName,
    description: '',
    content: ''
  };
}

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const { lang, author } = await params;
  const searchParamsData = await searchParams;
  const decodedAuthor = decodeURIComponent(author);
  
  // Handle pagination
  const currentPage = parseInt((searchParamsData.page as string) || '1', 10);
  const paginatedData = await getPaginatedPostsByAuthor(decodedAuthor, lang, currentPage, 10);
  const { posts, pagination } = paginatedData;
  
  if (pagination.totalItems === 0) {
    notFound();
  }

  const authorInfo = await getAuthorInfo(decodedAuthor, lang);
  
  const backText = lang === 'gu' ? 'બધા લેખકો પર પાછા જાઓ' : 'Back to all authors';
  const postsCountText = lang === 'gu' ? 'પોસ્ટ્સ' : 'posts';

  return (
    <BlogLayout currentLang={lang}>
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" className="mb-6 inline-block" asChild>
          <Link href={`/authors/${lang}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backText}
          </Link>
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">{authorInfo.title}</h1>
          </div>
          
          {authorInfo.description && (
            <p className="text-lg text-muted-foreground mb-4">
              {authorInfo.description}
            </p>
          )}
          
          <p className="text-sm text-muted-foreground">
            {pagination.totalItems} {postsCountText}
          </p>
        </div>

        {authorInfo.content && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {authorInfo.content.split('\n').map((line, index) => (
                  <p key={index} className="mb-2">{line}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination Info */}
        <div className="mb-6 flex justify-between items-center">
          <PaginationInfo
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            itemsPerPage={pagination.itemsPerPage}
            totalItems={pagination.totalItems}
          />
        </div>

        {/* Posts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {posts.map((post) => (
            <PostCard key={`${post.lang}-${post.id}`} post={post} />
          ))}
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          baseUrl={`/authors/${lang}/${encodeURIComponent(decodedAuthor)}`}
          className="mt-8"
        />
      </div>
    </BlogLayout>
  );
}
