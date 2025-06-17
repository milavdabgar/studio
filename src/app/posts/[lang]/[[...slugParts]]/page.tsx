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
  let params: Array<{ lang: string; slugParts: string[] }> = [];
  try {
    params = getAllPostSlugsForStaticParams();
    console.log(`[PostPage generateStaticParams] Successfully generated ${params.length} static params. Sample (up to 5):`);
    params.slice(0, 5).forEach((p, i) => console.log(`  Param ${i}: ${JSON.stringify(p)}`));
    if (params.length > 5) console.log(`  ... and ${params.length - 5} more.`);
  } catch (e: any) {
    console.error("[PostPage generateStaticParams] CRITICAL ERROR during static param generation:", e);
  }
  return params;
}

async function getPost(lang: string, slugParts: string[]): Promise<PostData | null> {
  console.log(`[PostPage getPost wrapper] ENTER. Lang: "${lang}", SlugParts: ${JSON.stringify(slugParts)}`);
  try {
    const data = await getPostData(lang, slugParts); // getPostData itself has extensive try-catch
    if (!data) {
      console.warn(`[PostPage getPost wrapper] getPostData returned null. Lang: "${lang}", SlugParts: ${JSON.stringify(slugParts)}`);
    } else {
      // console.log(`[PostPage getPost wrapper] getPostData returned data for title: "${data.title}".`);
    }
    return data;
  } catch (e: any) { // This catch is for errors *in calling* getPostData or if getPostData re-throws an error (which it shouldn't)
    console.error(`[PostPage getPost wrapper] CRITICAL UNEXPECTED ERROR calling getPostData. Lang: "${lang}", SlugParts: ${JSON.stringify(slugParts)}. Error:`, e);
    return null;
  }
}

export default async function PostPage({ params }: PostPageProps) {
  console.log(`[PostPage Rendering] Received params in component: ${JSON.stringify(params)}`);
  const { lang, slugParts } = params;
  
  const effectiveSlugParts = slugParts || []; 
  console.log(`[PostPage Rendering] Effective slugParts for getPost call: ${JSON.stringify(effectiveSlugParts)}`);

  const postData = await getPost(lang, effectiveSlugParts);

  if (!postData) {
    console.warn(`[PostPage Rendering] Post data is null after getPost call. Lang: "${lang}", slugParts: ${JSON.stringify(effectiveSlugParts)}. Triggering notFound().`);
    notFound();
  }
  
  // console.log(`[PostPage Rendering] Successfully fetched post data: "${postData.title}". Ready to render.`);
  
  const backLinkText = lang === 'gu' ? 'બધા લેખો પર પાછા જાઓ' : 'Back to all articles';
  
  let backLinkHref = `/posts/${lang}`;
  if (effectiveSlugParts.length > 1) { 
    // For nested posts like /blog/category/my-post, link to /blog/category (_index.md or index.md there)
    // If no index, this will 404, but that's a content structure issue.
    backLinkHref = `/posts/${lang}/${effectiveSlugParts.slice(0, -1).join('/')}`;
  } else if (effectiveSlugParts.length === 1 && effectiveSlugParts[0] !== '_index' && effectiveSlugParts[0] !== 'index') {
    // For a top-level post like /posts/en/some-topic (not an index), link back to /posts/en
    // If effectiveSlugParts[0] IS an index (e.g., 'blog' for content/blog/_index.md),
    // it would mean the current page is /posts/en/blog, and the backlink should be /posts/en.
    // The current logic already handles this case by falling through to the default /posts/lang.
  }
  // Ensure no trailing slash for root language index (e.g. /posts/en) or section index (e.g. /posts/en/blog)
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

