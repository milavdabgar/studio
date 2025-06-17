
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
  const { getAllPostSlugsForStaticParams } = await import('@/lib/markdown');
  let paramsList: Array<{ lang: string; slugParts?: string[] | undefined }> = [];
  try {
    const rawSlugs = getAllPostSlugsForStaticParams();
    paramsList = rawSlugs.map(s => ({
      lang: s.lang,
      slugParts: s.slugParts && s.slugParts.length > 0 ? s.slugParts : undefined
    }));
    console.log(`[PostPage generateStaticParams] Successfully generated ${paramsList.length} static params. Sample:`, paramsList.slice(0, 3));
  } catch (e: any) {
    console.error("[PostPage generateStaticParams] CRITICAL ERROR:", e);
  }
  return paramsList;
}

// Wrapper function to call getPostData and handle parameter extraction
async function getPost(pageParams: PostPageParams): Promise<PostData | null> {
  const lang = pageParams.lang;
  // Ensure slugParts passed to getPostData is always an array
  const slugPartsForGetData = pageParams.slugParts || []; 
  
  console.log(`[PostPage getPost wrapper] ENTER. Lang: "${lang}", slugParts for getPostData: ${JSON.stringify(slugPartsForGetData)}`);
  
  const post = await getPostData({ lang, slugParts: slugPartsForGetData });
  
  if (!post) {
    console.warn(`[PostPage getPost wrapper] getPostData returned null. Lang: "${lang}", slugParts: ${JSON.stringify(slugPartsForGetData)}`);
  } else {
    console.log(`[PostPage getPost wrapper] getPostData returned post: "${post.title}"`);
  }
  return post;
}


export default async function PostPage({ params: pageParams }: PostPageProps) {
  // Log received params immediately. This is where the error seems to happen.
  // The error "params should be awaited" is tricky because `pageParams` itself is not a promise.
  // This log itself, if it tries to access pageParams.lang or pageParams.slugParts too early, might be an issue for Turbopack.
  // We will defer actual usage of pageParams.lang and pageParams.slugParts as much as possible.
  console.log(`[PostPage Rendering] Received raw pageParams: ${JSON.stringify(pageParams)}`);
  
  const postData = await getPost(pageParams);

  if (!postData) {
    // If getPost returns null (which happens if getPostData returns null), call notFound.
    // The logging for this case is now inside the getPost wrapper and getPostData.
    notFound();
  }
  
  console.log(`[PostPage Rendering] Successfully fetched post data for "${postData.title}".`);
  
  // Use postData.lang and postData.slugParts for consistency if available, fallback to pageParams
  const langForLinks = postData.lang || pageParams.lang;
  const slugPartsForLinks = postData.slugParts || pageParams.slugParts || [];

  const backLinkText = langForLinks === 'gu' ? 'બધા લેખો પર પાછા જાઓ' : 'Back to all articles';
  
  let backLinkHref = `/posts/${langForLinks}`;
  if (slugPartsForLinks.length > 0) { 
    if (slugPartsForLinks.length > 1) { 
        backLinkHref = `/posts/${langForLinks}/${slugPartsForLinks.slice(0, -1).join('/')}`;
    }
    // If slugPartsForLinks.length is 1, backLinkHref remains /posts/[lang] (correct for parent section)
  }
  backLinkHref = backLinkHref.replace(/\/$/, ''); 
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

    