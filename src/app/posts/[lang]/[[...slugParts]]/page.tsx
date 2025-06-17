// src/app/posts/[lang]/[[...slugParts]]/page.tsx

import { getPostData, type PostData } from '@/lib/markdown'; 
import { format, parseISO, isValid } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import 'katex/dist/katex.min.css'; // Ensure KaTeX CSS is imported
import PostRenderer from '@/components/blog/PostRenderer';
import { notFound } from 'next/navigation';
// import path from 'path'; // Not strictly needed here anymore

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
    const rawSlugs = getAllPostSlugsForStaticParams(); // This is synchronous
    paramsList = rawSlugs.map(s => ({
      lang: s.lang,
      slugParts: s.slugParts && s.slugParts.length > 0 ? s.slugParts : undefined, // Pass undefined if slugParts is empty
    }));
    console.log(`[PostPage generateStaticParams] Successfully generated ${paramsList.length} static params. Sample:`, paramsList.slice(0, 2));
  } catch (e: any) {
    console.error("[PostPage generateStaticParams] CRITICAL ERROR:", e.message);
    // Provide a minimal fallback if slug generation fails.
    paramsList = [{ lang: 'en', slugParts: undefined }, { lang: 'gu', slugParts: undefined }];
  }
  return paramsList;
}


export default async function PostPage({ params: pageParams }: PostPageProps) {
  // console.log(`[PostPage Rendering] Received raw pageParams in component: ${JSON.stringify(pageParams)}`);

  const postData = await getPostData({
    lang: pageParams.lang, // Access lang directly here
    slugParts: pageParams.slugParts, // Pass slugParts directly, getPostData will handle if undefined
  });

  if (!postData) {
    // Logging here is fine because getPostData has completed (or returned null)
    console.log(`[PostPage Rendering] Post data is null for lang: "${pageParams.lang}", slugParts: ${JSON.stringify(pageParams.slugParts || [])}. Triggering notFound().`);
    notFound();
  }
  
  // Now that postData is confirmed, use its properties for links and display
  const langForLinks = postData.lang;
  const slugPartsForLinks = postData.slugParts || [];

  const backLinkText = langForLinks === 'gu' ? 'બધા લેખો પર પાછા જાઓ' : 'Back to all articles';
  
  let backLinkHref = `/posts/${langForLinks}`;
  if (slugPartsForLinks.length > 0) {
    // Check if the current post is an index page for its directory
    // This heuristic assumes _index.md or index.md implies it's a section page
    const isIndexPage = postData.id.endsWith('_index') || postData.id.endsWith('/index') || (slugPartsForLinks.length > 0 && (slugPartsForLinks[slugPartsForLinks.length - 1] === '_index' || slugPartsForLinks[slugPartsForLinks.length - 1] === 'index'));

    if (isIndexPage) {
      // If it's an index page (e.g., /posts/en/blog from content/blog/_index.md), link to parent of the directory
      const parentDirParts = slugPartsForLinks.slice(0, -1);
      if (parentDirParts.length > 0) {
        backLinkHref = `/posts/${langForLinks}/${parentDirParts.join('/')}`;
      }
      // If parentDirParts is empty, it means this index is at the language root (e.g. /posts/en from content/_index.en.md), so backLinkHref remains /posts/en (which is not quite right for a "back" button, but correct as a section root)
      // A better approach for a "back" button from a root index might be to go to `/posts` or a higher level page if applicable.
      // For simplicity, if it's a root language index, the "back" button might just point to itself or a predefined higher level.
      // Let's refine this: if it's a root index page, the "back" link will just go to the /posts/[lang] root.
    } else {
      // If it's a regular post (e.g., /posts/en/blog/mypost), link to its parent directory
      const parentSlugParts = slugPartsForLinks.slice(0, -1);
       if (parentSlugParts.length > 0) {
        backLinkHref = `/posts/${langForLinks}/${parentSlugParts.join('/')}`;
      }
      // If parentSlugParts is empty (e.g. /posts/en/mypost from content/mypost.md), backLinkHref remains /posts/en
    }
  }
  
  // Normalize trailing slashes
  if (backLinkHref !== `/posts/${langForLinks}`) {
    backLinkHref = backLinkHref.replace(/\/$/, '');
  }
   if (backLinkHref === `/posts/${langForLinks}/`) { 
      backLinkHref = `/posts/${langForLinks}`;
  }


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
