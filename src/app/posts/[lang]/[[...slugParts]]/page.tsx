// src/app/posts/[lang]/[[...slugParts]]/page.tsx

import { getPostData, getSortedPostsData, getSubPostsForDirectory, type PostData, type PostPreview } from '@/lib/markdown'; 
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


export default async function PostPage({ params }: PostPageProps) {
  // Await params to comply with Next.js 15 requirements
  const pageParams = await params;
  
  // If no slugParts provided, show posts listing
  if (!pageParams.slugParts || pageParams.slugParts.length === 0) {
    const posts = await getSortedPostsData(pageParams.lang);
    
    const pageTitle = pageParams.lang === 'gu' ? 'બ્લોગ પોસ્ટ્સ' : 'Blog Posts';
    const backText = pageParams.lang === 'gu' ? 'હોમ પર પાછા જાઓ' : 'Back to Home';
    
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="mb-6 inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> {backText}
          </Button>
        </Link>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">{pageTitle}</h1>
          <p className="text-muted-foreground">
            {pageParams.lang === 'gu' 
              ? 'અમારા બ્લોગ પોસ્ટ્સ અને લેખો શોધો' 
              : 'Discover our blog posts and articles'
            }
          </p>
        </div>

        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {pageParams.lang === 'gu' 
                  ? 'કોઈ પોસ્ટ્સ મળ્યા નથી' 
                  : 'No posts found'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <Card key={`${post.lang}-${post.id}`} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl">
                    <Link 
                      href={post.href} 
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      {post.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="flex flex-col gap-1">
                    <span>
                      {post.date && typeof post.date === 'string' && isValid(parseISO(post.date)) 
                        ? format(parseISO(post.date), 'LLLL d, yyyy') 
                        : 'Date not available'
                      }
                      {post.author && ` by ${post.author}`}
                    </span>
                    {post.lang && (
                      <span className="text-xs">
                        Language: {post.lang === 'gu' ? 'ગુજરાતી' : 'English'}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                {post.excerpt && (
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {post.excerpt}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

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

  // Check if this is a directory with sub-posts that should show a hybrid view
  const subPosts = pageParams.slugParts ? await getSubPostsForDirectory(pageParams.slugParts, pageParams.lang) : [];
  const showHybridView = subPosts.length > 0;
  
  // Now that postData is confirmed, use its properties for links and display
  const langForLinks = postData.lang;
  const slugPartsForLinks = postData.slugParts || [];

  const backLinkText = langForLinks === 'gu' ? 'બધા લેખો પર પાછા જાઓ' : 'Back to all articles';
  
  // For now, always link back to the language root posts page
  // This ensures the back button always works and doesn't lead to 404s
  const backLinkHref = `/posts/${langForLinks}`;


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
            {postData.date && typeof postData.date === 'string' && isValid(parseISO(postData.date)) ? format(parseISO(postData.date), 'LLLL d, yyyy') : 'Date not available'}
            {postData.author && ` by ${postData.author}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <PostRenderer contentHtml={postData.contentHtml} />
          </article>
        </CardContent>
      </Card>

      {/* Show sub-posts if this is a directory with children */}
      {showHybridView && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-primary mb-6">
            {pageParams.lang === 'gu' ? 'સંબંધિત પોસ્ટ્સ' : 'Related Posts'}
          </h2>
          <div className="grid gap-6">
            {subPosts.map((post) => (
              <Card key={`${post.lang}-${post.id}`} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">
                    <Link 
                      href={post.href} 
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      {post.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="flex flex-col gap-1">
                    <span>
                      {post.date && typeof post.date === 'string' && isValid(parseISO(post.date)) 
                        ? format(parseISO(post.date), 'LLLL d, yyyy') 
                        : 'Date not available'
                      }
                      {post.author && ` by ${post.author}`}
                    </span>
                    {post.lang && (
                      <span className="text-xs text-muted-foreground">
                        {post.lang === 'gu' ? 'ગુજરાતી' : 'English'}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                {post.excerpt && (
                  <CardContent>
                    <p className="text-muted-foreground">
                      {post.excerpt}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
