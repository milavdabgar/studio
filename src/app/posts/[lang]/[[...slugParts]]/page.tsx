// src/app/posts/[lang]/[[...slugParts]]/page.tsx

import { getPostData, getSortedPostsData, getSubPostsForDirectory, getDirectSubsections, type PostData, type PostPreview } from '@/lib/markdown'; 
import { format, parseISO, isValid } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import 'katex/dist/katex.min.css'; // Ensure KaTeX CSS is imported
import PostRenderer from '@/components/blog/PostRenderer';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { PostCard } from '@/components/blog/PostCard';
import { SubsectionCard } from '@/components/blog/SubsectionCard';
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
      <BlogLayout currentLang={pageParams.lang}>
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
                <PostCard key={`${post.lang}-${post.id}`} post={post} />
              ))}
            </div>
          )}
        </div>
      </BlogLayout>
    );
  }

  // console.log(`[PostPage Rendering] Received raw pageParams in component: ${JSON.stringify(pageParams)}`);

  const postData = await getPostData({
    lang: pageParams.lang, // Access lang directly here
    slugParts: pageParams.slugParts, // Pass slugParts directly, getPostData will handle if undefined
  });

  // Check if this is a directory with subsections that should show Hugo-like section listing
  if (pageParams.slugParts && pageParams.slugParts.length > 0) {
    const subsections = await getDirectSubsections(pageParams.slugParts, pageParams.lang);
    
    if (subsections.length > 0) {
      // Show subsection listing (Hugo-like behavior) instead of individual posts
      const sectionTitle = pageParams.slugParts[pageParams.slugParts.length - 1];
      const pageTitle = pageParams.lang === 'gu' ? `વિભાગ: ${sectionTitle}` : `Section: ${sectionTitle}`;
      const backText = pageParams.lang === 'gu' ? 'પાછળ જાઓ' : 'Go Back';
      
      const parentPath = pageParams.slugParts.length > 1 
        ? `/posts/${pageParams.lang}/${pageParams.slugParts.slice(0, -1).join('/')}`
        : `/posts/${pageParams.lang}`;

      // If there's also an index file, show its content at the top
      const sectionContent = postData?.contentHtml;

      return (
        <BlogLayout currentLang={pageParams.lang}>
          <div className="container mx-auto px-4 py-8">
            <Link href={parentPath} className="mb-6 inline-block">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> {backText}
              </Button>
            </Link>
            
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-primary mb-2">
                {postData?.title || pageTitle}
              </h1>
              <p className="text-muted-foreground">
                {pageParams.lang === 'gu' 
                  ? 'આ વિભાગમાં ઉપલબ્ધ પેટા-વિભાગો' 
                  : 'Available subsections in this section'
                }
              </p>
            </div>

            {/* Section content if it exists */}
            {sectionContent && (
              <div className="prose prose-lg dark:prose-invert max-w-none mb-8 border-b pb-6">
                <PostRenderer contentHtml={sectionContent} />
              </div>
            )}

            {/* Subsections grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {subsections.map((subsection) => (
                <SubsectionCard
                  key={subsection.slug}
                  name={subsection.name}
                  slug={subsection.slug}
                  postCount={subsection.posts.length}
                  lang={pageParams.lang}
                  description={subsection.description}
                />
              ))}
            </div>
          </div>
        </BlogLayout>
      );
    }
  }

  if (!postData) {
    // If no subsections found, show 404
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


  // Check if this is a directory listing (Hugo-style _index.md behavior)
  if (showHybridView) {
    return (
      <BlogLayout currentLang={langForLinks}>
        <div className="container mx-auto px-4 py-8">
          <Link href={backLinkHref} passHref className="mb-6 inline-block">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> {backLinkText}
            </Button>
          </Link>
          
          {/* Directory header with _index.md content */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">{postData.title}</h1>
            {postData.date && (
              <p className="text-sm text-muted-foreground mb-4">
                {(() => {
                  try {
                    const dateValue = postData.date as any;
                    if (dateValue instanceof Date) {
                      return format(dateValue, 'LLLL d, yyyy');
                    }
                    if (typeof dateValue === 'string' && isValid(parseISO(dateValue))) {
                      return format(parseISO(dateValue), 'LLLL d, yyyy');
                    }
                    return 'Date not available';
                  } catch (e) {
                    return 'Date not available';
                  }
                })()}
                {postData.author && ` by ${postData.author}`}
              </p>
            )}
            {postData.contentHtml && postData.contentHtml.trim() && (
              <div className="prose prose-lg dark:prose-invert max-w-none mb-8 border-b pb-6">
                <PostRenderer contentHtml={postData.contentHtml} />
              </div>
            )}
          </div>

          {/* Directory listing - main content */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              {pageParams.lang === 'gu' ? 'પોસ્ટ્સ' : 'Posts'}
            </h2>
            
            {subPosts.length === 0 ? (
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
                {subPosts.map((post) => (
                  <PostCard key={`${post.lang}-${post.id}`} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>
      </BlogLayout>
    );
  }

  // Single post view (non-directory)
  return (
    <BlogLayout currentLang={langForLinks}>
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
              {(() => {
                try {
                  const dateValue = postData.date as any;
                  if (dateValue instanceof Date) {
                    return format(dateValue, 'LLLL d, yyyy');
                  }
                  if (typeof dateValue === 'string' && isValid(parseISO(dateValue))) {
                    return format(parseISO(dateValue), 'LLLL d, yyyy');
                  }
                  return 'Date not available';
                } catch (e) {
                  return 'Date not available';
                }
              })()}
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
    </BlogLayout>
  );
}
