// src/app/posts/[lang]/[[...slugParts]]/page.tsx

// Force dynamic rendering for this page due to searchParams usage
export const dynamic = 'force-dynamic';

import { getPostData, getPaginatedPosts, getSubPostsForDirectory, getDirectSubsections, getRelatedPosts, getAdjacentPosts } from '@/lib/markdown'; 
import { Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import 'katex/dist/katex.min.css'; // Ensure KaTeX CSS is imported
import PostRenderer from '@/components/blog/PostRenderer';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { PostCard } from '@/components/blog/PostCard';
import { SubsectionCard } from '@/components/blog/SubsectionCard';
import { Breadcrumbs } from '@/components/blog/Breadcrumbs';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { PostMeta } from '@/components/blog/PostMeta';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { PostNavigation } from '@/components/blog/PostNavigation';
import { PostFooter } from '@/components/blog/PostFooter';
import { PdfDownloadButton } from '@/components/pdf-download-button';
import { Pagination, PaginationInfo } from '@/components/ui/pagination';
import { StructuredData } from '@/components/seo/StructuredData';
import { generateSEOMetadata, generateArticleJsonLD, generateBreadcrumbJsonLD } from '@/components/seo/SEOMetaTags';
import { calculateReadingTime } from '@/lib/markdown';
import { notFound } from 'next/navigation';
// import path from 'path'; // Not strictly needed here anymore

interface PostPageParams {
  lang: string;
  slugParts?: string[];
}

interface PostPageProps {
  params: Promise<PostPageParams>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
  } catch (e: unknown) {
    console.error("[PostPage generateStaticParams] CRITICAL ERROR:", e instanceof Error ? e.message : String(e));
    // Provide a minimal fallback if slug generation fails.
    paramsList = [{ lang: 'en', slugParts: undefined }, { lang: 'gu', slugParts: undefined }];
  }
  return paramsList;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<PostPageParams> }) {
  const pageParams = await params;
  const slugPartsArray = Array.isArray(pageParams.slugParts) ? pageParams.slugParts : [];
  
  try {
    const postData = await getPostData({
      lang: pageParams.lang,
      slugParts: slugPartsArray,
    });

    if (!postData) {
      return generateSEOMetadata({
        title: '404 - Page Not Found',
        description: 'The requested page could not be found.',
        lang: pageParams.lang,
        path: `/posts/${pageParams.lang}/${slugPartsArray.join('/')}`,
      });
    }

    const isDirectory = slugPartsArray.length === 0 || !postData.contentHtml;
    const path = `/posts/${pageParams.lang}/${slugPartsArray.join('/')}`;
    
    if (isDirectory) {
      const title = pageParams.lang === 'gu' ? 'બ્લોગ પોસ્ટ્સ' : 'Blog Posts';
      const description = pageParams.lang === 'gu' 
        ? 'ઇલેક્ટ્રોનિક્સ, ડેટા સાયન્સ અને ટેકનોલોજી વિશેના બ્લોગ પોસ્ટ્સ'
        : 'Blog posts about Electronics, Data Science, and Technology';

      return generateSEOMetadata({
        title,
        description,
        lang: pageParams.lang,
        path,
      });
    } else {
      return generateSEOMetadata({
        title: postData.title,
        description: postData.excerpt || `Read ${postData.title} - ${postData.title}`,
        lang: pageParams.lang,
        path,
        post: postData,
        type: 'article',
      });
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
    return generateSEOMetadata({
      title: 'Blog',
      description: 'Blog posts and articles',
      lang: pageParams.lang,
      path: `/posts/${pageParams.lang}`,
    });
  }
}

export default async function PostPage({ params, searchParams }: PostPageProps) {
  // Await params to comply with Next.js 15 requirements
  const pageParams = await params;
  const searchParamsData = await searchParams;
  
  // If no slugParts provided, show posts listing
  if (!pageParams.slugParts || pageParams.slugParts.length === 0) {
    // Handle pagination from search params
    const currentPage = parseInt((searchParamsData.page as string) || '1', 10);
    
    const paginatedData = await getPaginatedPosts(pageParams.lang, currentPage, 10);
    const { posts, pagination } = paginatedData;
    
    const pageTitle = pageParams.lang === 'gu' ? 'બ્લોગ પોસ્ટ્સ' : 'Blog Posts';
    
    // Breadcrumb for main blog listing - just shows current page
    const breadcrumbItems = [{
      label: pageTitle,
      href: ''
    }];
    
    return (
      <BlogLayout currentLang={pageParams.lang}>
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} currentLang={pageParams.lang} />
          
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">{pageTitle}</h1>
            <p className="text-muted-foreground">
              {pageParams.lang === 'gu' 
                ? 'અમારા બ્લોગ પોસ્ટ્સ અને લેખો શોધો' 
                : 'Discover our blog posts and articles'
              }
            </p>
          </div>

          {pagination.totalItems === 0 ? (
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
            <>
              {/* Pagination Info */}
              <div className="mb-6 flex justify-between items-center">
                <PaginationInfo
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  itemsPerPage={pagination.itemsPerPage}
                  totalItems={pagination.totalItems}
                />
              </div>

              {/* Posts Grid */}
              <div className="grid gap-6 mb-8">
                {posts.map((post) => (
                  <PostCard key={`${post.lang}-${post.id}`} post={post} />
                ))}
              </div>

              {/* Pagination Controls */}
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                baseUrl={`/posts/${pageParams.lang}`}
                className="mt-8"
              />
            </>
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

      // If there's also an index file, show its content at the top
      const sectionContent = postData?.contentHtml;

      // Generate breadcrumb items for subsection view
      const breadcrumbItems = [];
      let currentPath = `/posts/${pageParams.lang}`;
      
      for (let i = 0; i < pageParams.slugParts.length; i++) {
        currentPath += `/${pageParams.slugParts[i]}`;
        breadcrumbItems.push({
          label: pageParams.slugParts[i],
          href: i === pageParams.slugParts.length - 1 ? '' : currentPath
        });
      }

      return (
        <BlogLayout currentLang={pageParams.lang}>
          <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
              {/* Header Section */}
              <div className="mb-8">
                {/* Breadcrumbs */}
                <Breadcrumbs items={breadcrumbItems} currentLang={pageParams.lang} />
                
                <div className="mb-8 text-center">
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
                    {postData?.title || pageTitle}
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {pageParams.lang === 'gu' 
                      ? 'આ વિભાગમાં ઉપલબ્ધ પેટા-વિભાગો' 
                      : 'Available subsections in this section'
                    }
                  </p>
                </div>
              </div>

              {/* Section content if it exists */}
              {sectionContent && (
                <div className="mb-12">
                  <Card className="shadow-lg border-0 bg-gradient-to-r from-card to-card/80 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-xl text-primary">
                        {pageParams.lang === 'gu' ? 'વિભાગ માહિતી' : 'Section Information'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
                        <PostRenderer contentHtml={sectionContent} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Subsections grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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



  // Check if this is a directory listing (Hugo-style _index.md behavior)
  if (showHybridView) {
    // Generate breadcrumb items for directory view
    const breadcrumbItems = [];
    let currentPath = `/posts/${langForLinks}`;
    
    for (let i = 0; i < slugPartsForLinks.length; i++) {
      currentPath += `/${slugPartsForLinks[i]}`;
      breadcrumbItems.push({
        label: slugPartsForLinks[i],
        href: i === slugPartsForLinks.length - 1 ? '' : currentPath
      });
    }

    // Calculate reading time for directory content if it exists
    const readingTime = postData.contentHtml ? calculateReadingTime(postData.contentHtml.replace(/<[^>]*>/g, '')) : 0;

    return (
      <BlogLayout currentLang={langForLinks}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Breadcrumbs */}
            <Breadcrumbs items={breadcrumbItems} currentLang={langForLinks} />
            
            {/* Directory header with _index.md content */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
                {postData.title}
              </h1>
              
              {/* Directory Post Meta Information */}
              {(postData.date || postData.author || readingTime > 0) && (
                <div className="mb-6">
                  <PostMeta
                    date={postData.date}
                    author={postData.author}
                    readingTime={readingTime}
                    tags={postData.tags}
                    categories={postData.categories}
                    lang={langForLinks}
                    className="justify-center"
                  />
                </div>
              )}
              
              {postData.contentHtml && postData.contentHtml.trim() && (
                <Card className="shadow-lg border-0 bg-gradient-to-r from-card to-card/80 mb-8 dark:border-gray-700">
                  <CardContent className="p-8">
                    <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
                      <PostRenderer contentHtml={postData.contentHtml} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Directory listing - main content */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <span>{pageParams.lang === 'gu' ? 'પોસ્ટ્સ' : 'Posts'}</span>
                <Badge variant="outline" className="text-xs">
                  {subPosts.length}
                </Badge>
              </h2>
              
              {subPosts.length === 0 ? (
                <Card className="shadow-lg border-0 dark:border-gray-700">
                  <CardContent className="py-12 text-center">
                    <div className="mb-4 opacity-50">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                    </div>
                    <p className="text-lg text-muted-foreground">
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
        </div>
      </BlogLayout>
    );
  }

  // Single post view (non-directory)
  // Generate breadcrumb items
  const breadcrumbItems = [];
  let currentPath = `/posts/${langForLinks}`;
  
  for (let i = 0; i < slugPartsForLinks.length - 1; i++) {
    currentPath += `/${slugPartsForLinks[i]}`;
    breadcrumbItems.push({
      label: slugPartsForLinks[i],
      href: currentPath
    });
  }
  
  // Add current post (will be styled differently as last item)
  breadcrumbItems.push({
    label: postData.title,
    href: '' // Current page, no link needed
  });

  // Calculate reading time from content
  const readingTime = postData.contentHtml ? calculateReadingTime(postData.contentHtml.replace(/<[^>]*>/g, '')) : 0;

  // Get related posts and navigation
  const relatedPosts = await getRelatedPosts(postData, langForLinks);
  const { previousPost, nextPost } = await getAdjacentPosts(postData, langForLinks);

  // Generate structured data
  const currentUrl = `https://polymanager.app/posts/${langForLinks}/${slugPartsForLinks.join('/')}`;
  const articleJsonLD = generateArticleJsonLD(postData, langForLinks, currentUrl);
  const breadcrumbJsonLD = generateBreadcrumbJsonLD(breadcrumbItems, 'https://polymanager.app');

  return (
    <BlogLayout currentLang={langForLinks}>
      {/* Structured Data */}
      <StructuredData data={articleJsonLD} />
      <StructuredData data={breadcrumbJsonLD} />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} currentLang={langForLinks} />
          
          <div className="flex gap-8">
            {/* Main content */}
            <div className="flex-1">
              <article>
                <Card className="shadow-xl border-0 bg-gradient-to-br from-card to-card/90 overflow-hidden dark:border-gray-700">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/50 dark:border-gray-700">
                    <div className="space-y-4">
                      <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
                        {postData.title}
                      </CardTitle>
                      
                      {/* Post Meta Information */}
                      <PostMeta
                        date={postData.date}
                        author={postData.author}
                        readingTime={readingTime}
                        tags={postData.tags}
                        categories={postData.categories}
                        lang={langForLinks}
                        className="justify-center md:justify-start"
                      />
                      
                      {/* PDF Download Button */}
                      <div className="flex justify-center md:justify-start">
                        <PdfDownloadButton 
                          slug={slugPartsForLinks.join('/')}
                          lang={langForLinks}
                          title={postData.title}
                          variant="outline"
                          size="default"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
                      <PostRenderer contentHtml={postData.contentHtml} />
                    </div>
                  </CardContent>
                </Card>
              </article>

              {/* Post Navigation */}
              <PostNavigation 
                previousPost={previousPost}
                nextPost={nextPost}
                lang={langForLinks}
              />

              {/* Related Posts */}
              <RelatedPosts 
                posts={relatedPosts}
                lang={langForLinks}
              />

              {/* Footer */}
              <PostFooter lang={langForLinks} />
            </div>
            
            {/* Desktop Table of Contents Sidebar */}
            {postData.contentHtml && (
              <div className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-8">
                  <TableOfContents 
                    content={postData.contentHtml} 
                    showDesktopSidebar={true}
                    showMobileToggle={false}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile TableOfContents (only shows toggle button and overlay) */}
          {postData.contentHtml && (
            <TableOfContents 
              content={postData.contentHtml} 
              showDesktopSidebar={false}
              showMobileToggle={true}
            />
          )}
        </div>
      </div>
    </BlogLayout>
  );
}
