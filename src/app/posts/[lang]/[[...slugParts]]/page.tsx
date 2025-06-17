
// src/app/posts/[lang]/[[...slugParts]]/page.tsx

import { getPostData, type PostData } from '@/lib/markdown'; 
import { format, parseISO, isValid } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import 'katex/dist/katex.min.css';
import PostRenderer from '@/components/blog/PostRenderer';
import { notFound } from 'next/navigation';

interface PostPageParams {
  lang: string;
  slugParts?: string[];
}

interface PostPageProps {
  params: PostPageParams;
}

export async function generateStaticParams() {
  console.log("[PostPage generateStaticParams] Starting...");
  // Dynamically import to ensure it's treated as a module that can be re-evaluated if changed.
  const { getAllPostSlugsForStaticParams } = await import('@/lib/markdown');
  let paramsList: Array<{ lang: string; slugParts?: string[] | undefined }> = [];
  try {
    const rawSlugs = getAllPostSlugsForStaticParams();
    paramsList = rawSlugs.map(s => ({
      lang: s.lang,
      slugParts: s.slugParts && s.slugParts.length > 0 ? s.slugParts : undefined
    }));
    console.log(`[PostPage generateStaticParams] Successfully generated ${paramsList.length} static params. Sample (first 3):`, paramsList.slice(0, 3));
  } catch (e: any) {
    console.error("[PostPage generateStaticParams] CRITICAL ERROR:", e.message, e.stack);
    // Provide a minimal fallback if slug generation fails, to allow build to proceed for other pages.
    paramsList = [{ lang: 'en', slugParts: undefined }, { lang: 'gu', slugParts: undefined }];
  }
  return paramsList;
}

export default async function PostPage({ params: pageParams }: PostPageProps) {
  // Log the raw params received by the page component.
  // Avoid directly interpolating pageParams.lang or pageParams.slugParts here if it causes issues.
  console.log(`[PostPage Rendering] Received raw pageParams: ${JSON.stringify(pageParams)}`);

  const postData = await getPostData({ 
    lang: pageParams.lang, // Access directly here for the call
    slugParts: pageParams.slugParts // Pass directly, getPostData will default if undefined
  });

  if (!postData) {
    console.log(`[PostPage Rendering] Post data is null. Lang from params: "${pageParams.lang}", slugParts from params: ${JSON.stringify(pageParams.slugParts)}. Triggering notFound().`);
    notFound();
  }
  
  console.log(`[PostPage Rendering] Successfully fetched post data for "${postData.title}". Actual Lang: ${postData.lang}, Actual SlugParts: ${JSON.stringify(postData.slugParts)}`);
  
  // Derive lang and slugParts for links FROM postData, as it might be a fallback
  const langForLinks = postData.lang;
  const slugPartsFromPostData = postData.slugParts || [];

  const backLinkText = langForLinks === 'gu' ? 'બધા લેખો પર પાછા જાઓ' : 'Back to all articles';
  
  let backLinkHref = `/posts/${langForLinks}`;
  if (slugPartsFromPostData.length > 1) { 
      backLinkHref = `/posts/${langForLinks}/${slugPartsFromPostData.slice(0, -1).join('/')}`;
  }
  // Ensure no trailing slash for consistency, unless it's just /posts/[lang]
  if (backLinkHref !== `/posts/${langForLinks}`) {
    backLinkHref = backLinkHref.replace(/\/$/, '');
  }
  console.log(`[PostPage Rendering] Back link href generated: ${backLinkHref}`);

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
            {/* Ensure PostRenderer can handle potentially complex HTML */}
            <PostRenderer contentHtml={postData.contentHtml} />
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
