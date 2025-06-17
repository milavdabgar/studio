// src/app/posts/[lang]/[[...slugParts]]/page.tsx

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
    slugParts?: string[];
  };
}

export async function generateStaticParams() {
  console.log("[PostPage generateStaticParams] Starting to generate static params...");
  let params: Array<{ lang: string; slugParts?: string[] | undefined }> = []; // Ensure slugParts can be undefined
  try {
    const rawSlugs = getAllPostSlugsForStaticParams();
    params = rawSlugs.map(s => ({
      lang: s.lang,
      // Ensure slugParts is string[] or undefined, not just string[]
      slugParts: s.slugParts && s.slugParts.length > 0 ? s.slugParts : undefined 
    }));
    console.log(`[PostPage generateStaticParams] Successfully generated ${params.length} static params. Sample (up to 5):`);
    params.slice(0, 5).forEach((p, i) => console.log(`  Param ${i}: ${JSON.stringify(p)}`));
    if (params.length > 5) console.log(`  ... and ${params.length - 5} more.`);
  } catch (e: any) {
    console.error("[PostPage generateStaticParams] CRITICAL ERROR during static param generation:", e);
  }
  return params;
}

export default async function PostPage({ params: pageParams }: PostPageProps) {
  console.log(`[PostPage Rendering] Component invoked with pageParams: lang=${pageParams.lang}, slugParts=${JSON.stringify(pageParams.slugParts)}`);

  // Access params directly where needed, reducing top-level destructuring
  const postData = await getPostData({ lang: pageParams.lang, slugParts: pageParams.slugParts || [] });

  if (!postData) {
    console.warn(`[PostPage Rendering] Post data is null for lang: "${pageParams.lang}", slugParts: ${JSON.stringify(pageParams.slugParts || [])}. Triggering notFound().`);
    notFound();
  }
  
  console.log(`[PostPage Rendering] Successfully fetched post data for "${postData.title}".`);
  
  const backLinkText = pageParams.lang === 'gu' ? 'બધા લેખો પર પાછા જાઓ' : 'Back to all articles';
  
  let backLinkHref = `/posts/${pageParams.lang}`;
  // Use pageParams.slugParts directly for this logic
  if (pageParams.slugParts && pageParams.slugParts.length > 0) { 
    if (pageParams.slugParts.length > 1) { // If nested, e.g., blog/post
        backLinkHref = `/posts/${pageParams.lang}/${pageParams.slugParts.slice(0, -1).join('/')}`;
    } else { // If top-level post, e.g., /about (slugParts = ['about']), still links to /posts/lang
        // No change needed, backLinkHref is already /posts/lang
    }
  }
  backLinkHref = backLinkHref.replace(/\/$/, '');


  return (
    <div className="container mx-auto px-4 py-8">
      <Link href={backLinkHref} passHref className="mb-6 inline-block">
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

