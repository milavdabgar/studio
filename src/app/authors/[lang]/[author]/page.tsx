// src/app/authors/[lang]/[author]/page.tsx

import { getPostsByAuthor, getAllAuthors, getPostData } from '@/lib/markdown';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { PostCard } from '@/components/blog/PostCard';
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

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { lang, author } = await params;
  const decodedAuthor = decodeURIComponent(author);
  const posts = await getPostsByAuthor(decodedAuthor, lang);
  
  if (posts.length === 0) {
    notFound();
  }

  const authorInfo = await getAuthorInfo(decodedAuthor, lang);
  
  const pageTitle = `${lang === 'gu' ? 'લેખક' : 'Author'}: ${authorInfo.title}`;
  const backText = lang === 'gu' ? 'બધા લેખકો પર પાછા જાઓ' : 'Back to all authors';
  const noPostsText = lang === 'gu' ? 'આ લેખક માટે કોઈ પોસ્ટ્સ મળ્યા નથી' : 'No posts found for this author';
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
            {posts.length} {postsCountText}
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

        {posts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">{noPostsText}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={`${post.lang}-${post.id}`} post={post} />
            ))}
          </div>
        )}
      </div>
    </BlogLayout>
  );
}
