
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
  console.log("[PostPage] Generating static params...");
  try {
    const params = getAllPostSlugsForStaticParams();
    console.log(`[PostPage] Generated ${params.length} static params.`);
    return params;
  } catch (e) {
    console.error("[PostPage] Error in generateStaticParams:", e);
    return [];
  }
}

async function getPost(lang: string, slugParts: string[]): Promise<PostData | null> {
  try {
    // console.log(`[PostPage getPost] Attempting to get post data for lang: ${lang}, slugParts: ${slugParts.join('/')}`);
    const data = await getPostData(lang, slugParts);
    // if (!data) {
    //   console.warn(`[PostPage getPost] getPostData returned null for lang: ${lang}, slugParts: ${slugParts.join('/')}`);
    // }
    return data;
  } catch (e) {
    console.error(`[PostPage getPost] Error fetching post data for lang: ${lang}, slugParts: ${slugParts.join('/')}:`, e);
    return null;
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { lang, slugParts } = params;
  // console.log(`[PostPage Rendering] lang: ${lang}, slugParts: ${JSON.stringify(slugParts)}`);

  if (!slugParts || slugParts.length === 0) {
    console.warn(`[PostPage Rendering] Invalid slugParts. lang: ${lang}, slugParts: ${JSON.stringify(slugParts)}. Triggering notFound().`);
    notFound();
  }

  const postData = await getPost(lang, slugParts);

  if (!postData) {
    console.warn(`[PostPage Rendering] Post data is null. lang: ${lang}, slugParts: ${slugParts.join('/')}. Triggering notFound().`);
    notFound();
  }
  
  // console.log(`[PostPage Rendering] Successfully fetched post: ${postData.title}. Ready to render.`);
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
