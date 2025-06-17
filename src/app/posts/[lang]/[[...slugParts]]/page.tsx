
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

console.log("[PostPage Module] Loaded.");

export async function generateStaticParams() {
  console.log("[PostPage generateStaticParams] Starting...");
  let params: Array<{ lang: string; slugParts?: string[] | undefined }> = [];
  try {
    const rawSlugs = getAllPostSlugsForStaticParams();
    params = rawSlugs.map(s => ({
      lang: s.lang,
      slugParts: s.slugParts && s.slugParts.length > 0 ? s.slugParts : undefined
    }));
    console.log(`[PostPage generateStaticParams] Successfully generated ${params.length} static params. Sample (first 5):`, params.slice(0, 5));
  } catch (e: any) {
    console.error("[PostPage generateStaticParams] CRITICAL ERROR:", e.message, e.stack);
  }
  return params;
}

async function getPost({ lang, slugParts }: { lang: string; slugParts?: string[] }) {
  console.log(`[PostPage getPost wrapper] ENTER. Lang: "${lang}", SlugParts: ${JSON.stringify(slugParts)}`);
  // Ensure slugParts is an array, even if undefined, before passing to getPostData
  const post = await getPostData({ lang, slugParts: slugParts || [] });
  if (!post) {
    console.warn(`[PostPage getPost wrapper] getPostData returned null. Lang: "${lang}", SlugParts: ${JSON.stringify(slugParts || [])}`);
  } else {
    console.log(`[PostPage getPost wrapper] getPostData returned post: "${post.title}"`);
  }
  return post;
}


export default async function PostPage({ params: pageParams }: PostPageProps) {
  console.log(`[PostPage Rendering] Received params in component: lang=${pageParams.lang}, slugParts=${JSON.stringify(pageParams.slugParts)}`);

  const effectiveSlugParts = pageParams.slugParts || [];
  console.log(`[PostPage Rendering] Effective slugParts for getPost call: ${JSON.stringify(effectiveSlugParts)}`);

  const postData = await getPost({ lang: pageParams.lang, slugParts: effectiveSlugParts });

  if (!postData) {
    console.warn(`[PostPage Rendering] Post data is null after getPost call. Lang: "${pageParams.lang}", slugParts: ${JSON.stringify(effectiveSlugParts)}. Triggering notFound().`);
    notFound();
  }
  
  console.log(`[PostPage Rendering] Successfully fetched post data for "${postData.title}".`);
  
  const backLinkText = pageParams.lang === 'gu' ? 'બધા લેખો પર પાછા જાઓ' : 'Back to all articles';
  
  let backLinkHref = `/posts/${pageParams.lang}`;
  if (effectiveSlugParts.length > 0) { 
    if (effectiveSlugParts.length > 1) { 
        backLinkHref = `/posts/${pageParams.lang}/${effectiveSlugParts.slice(0, -1).join('/')}`;
    }
    // If slugParts.length is 1, backLinkHref remains /posts/[lang], which is correct
    // For /posts/en (slugParts = []), backLinkHref remains /posts/en
  } else {
    // This case handles root _index.md files for a language, e.g. /posts/en
    // No further adjustment to backLinkHref needed, it's already /posts/[lang]
  }
  backLinkHref = backLinkHref.replace(/\/$/, ''); // Remove trailing slash if any

  console.log(`[PostPage Rendering] Back link href: ${backLinkHref}`);


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
