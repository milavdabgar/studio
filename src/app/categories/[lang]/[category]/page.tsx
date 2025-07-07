// src/app/categories/[lang]/[category]/page.tsx

import { getPaginatedPostsByCategory, getAllCategories } from '@/lib/markdown';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { PostCard } from '@/components/blog/PostCard';
import { Pagination, PaginationInfo } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Folder } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { languages } from '@/lib/config';

interface CategoryPageProps {
  params: Promise<{ lang: string; category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateStaticParams() {
  const staticParams: { lang: string; category: string }[] = [];
  
  for (const lang of Object.keys(languages)) {
    const categories = await getAllCategories(lang);
    for (const { name: category } of categories) {
      staticParams.push({
        lang,
        category: encodeURIComponent(category),
      });
    }
  }
  
  return staticParams;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { lang, category } = await params;
  const searchParamsData = await searchParams;
  const decodedCategory = decodeURIComponent(category);
  
  // Handle pagination
  const currentPage = parseInt((searchParamsData.page as string) || '1', 10);
  const paginatedData = await getPaginatedPostsByCategory(decodedCategory, lang, currentPage, 10);
  const { posts, pagination } = paginatedData;
  
  if (pagination.totalItems === 0) {
    notFound();
  }
  
  const backText = lang === 'gu' ? 'બધી શ્રેણીઓ પર પાછા જાઓ' : 'Back to all categories';

  return (
    <BlogLayout currentLang={lang}>
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" className="mb-6 inline-block" asChild>
          <Link href={`/categories/${lang}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {backText}
          </Link>
        </Button>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 flex items-center gap-3">
            <Folder className="h-8 w-8" />
            {decodedCategory}
          </h1>
          <p className="text-muted-foreground">
            {pagination.totalItems} {pagination.totalItems === 1 ? 'post' : 'posts'} {lang === 'gu' ? 'મળ્યા' : 'found'}
          </p>
        </div>

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
          baseUrl={`/categories/${lang}/${encodeURIComponent(decodedCategory)}`}
          className="mt-8"
        />
      </div>
    </BlogLayout>
  );
}
