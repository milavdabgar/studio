// src/app/categories/[lang]/[category]/page.tsx

import { getPostsByCategory, getAllCategories } from '@/lib/markdown';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { PostCard } from '@/components/blog/PostCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Folder } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { languages } from '@/lib/config';

interface CategoryPageProps {
  params: Promise<{ lang: string; category: string }>;
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

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { lang, category } = await params;
  const decodedCategory = decodeURIComponent(category);
  const posts = await getPostsByCategory(decodedCategory, lang);
  
  if (posts.length === 0) {
    notFound();
  }
  
  const pageTitle = `${lang === 'gu' ? 'શ્રેણી' : 'Category'}: ${decodedCategory}`;
  const backText = lang === 'gu' ? 'બધી શ્રેણીઓ પર પાછા જાઓ' : 'Back to all categories';
  const noPostsText = lang === 'gu' ? 'આ શ્રેણી માટે કોઈ પોસ્ટ્સ મળ્યા નથી' : 'No posts found for this category';

  return (
    <BlogLayout currentLang={lang}>
      <div className="container mx-auto px-4 py-8">
        <Link href={`/categories/${lang}`} className="mb-6 inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> {backText}
          </Button>
        </Link>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 flex items-center gap-3">
            <Folder className="h-8 w-8" />
            {decodedCategory}
          </h1>
          <p className="text-muted-foreground">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} {lang === 'gu' ? 'મળ્યા' : 'found'}
          </p>
        </div>

        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">{noPostsText}</p>
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
