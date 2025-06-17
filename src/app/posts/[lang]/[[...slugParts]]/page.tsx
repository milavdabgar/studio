
// src/app/posts/[lang]/[[...slugParts]]/page.tsx
// THIS IS NOW A SERVER COMPONENT

import { getPostData, getAllPostSlugsForStaticParams, type PostData } from '@/lib/markdown';
import { format, parseISO, isValid } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import 'katex/dist/katex.min.css';
import PostRenderer from '@/components/blog/PostRenderer';
import { notFound } from 'next/navigation';

interface PostPageProps {
  params: {
    lang: string;
    slugParts?: string[]; // slugParts can be undefined if the route is /posts/[lang]
  };
}

export async function generateStaticParams() {
  return getAllPostSlugsForStaticParams();
}

async function getPost(lang: string, slugParts: string[]): Promise<PostData | null> {
  try {
    const data = await getPostData(lang, slugParts);
    return data;
  } catch (e) {
    console.error("Error fetching post data in page component:", e);
    return null;
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { lang, slugParts } = params;

  if (!slugParts || slugParts.length === 0) {
    // This case should ideally be handled by src/app/posts/[lang]/page.tsx
    // or redirect to the posts index for that language.
    // For now, let's treat it as not found if slugParts are missing for a post page.
    console.warn(`PostPage called without slugParts for lang: ${lang}`);
    notFound();
  }

  const postData = await getPost(lang, slugParts);

  if (!postData) {
    console.warn(`Post data not found for lang: ${lang}, slugParts: ${slugParts.join('/')}`);
    notFound();
  }
  
  const backLinkText = lang === 'gu' ? 'બધા લેખો પર પાછા જાઓ' : 'Back to all articles';

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href={`/posts/${lang}`} passHref className="mb-6 inline-block">
        <Button variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> {backLinkText}
        </Button>
      </Link>
      <Card className="shadow-xl">
        <CardHeader className="border-b">
          <CardTitle className="text-4xl font-bold text-primary leading-tight">
            {postData.title}
          </CardTitle>
          <CardDescription className="text-md text-muted-foreground pt-2">
            {postData.date && isValid(parseISO(postData.date)) ? format(parseISO(postData.date), 'LLLL d, yyyy') : 'Date not available'}
            {postData.author && ` by ${postData.author}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <PostRenderer contentHtml={postData.contentHtml} />
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
