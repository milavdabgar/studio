// src/app/tags/[lang]/[tag]/page.tsx

import { getPostsByTag, getAllTags } from '@/lib/markdown';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { PostCard } from '@/components/blog/PostCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Tag } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { languages } from '@/lib/config';

interface TagPageProps {
  params: Promise<{ lang: string; tag: string }>;
}

export async function generateStaticParams() {
  const staticParams: { lang: string; tag: string }[] = [];
  
  for (const lang of Object.keys(languages)) {
    const tags = await getAllTags(lang);
    for (const { name: tag } of tags) {
      staticParams.push({
        lang,
        tag: encodeURIComponent(tag),
      });
    }
  }
  
  return staticParams;
}

export default async function TagPage({ params }: TagPageProps) {
  const { lang, tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = await getPostsByTag(decodedTag, lang);
  
  if (posts.length === 0) {
    notFound();
  }
  
  const pageTitle = `${lang === 'gu' ? 'ટેગ' : 'Tag'}: ${decodedTag}`;
  const backText = lang === 'gu' ? 'બધા ટેગ્સ પર પાછા જાઓ' : 'Back to all tags';
  const noPostsText = lang === 'gu' ? 'આ ટેગ માટે કોઈ પોસ્ટ્સ મળ્યા નથી' : 'No posts found for this tag';

  return (
    <BlogLayout currentLang={lang}>
      <div className="container mx-auto px-4 py-8">
        <Link href={`/tags/${lang}`} className="mb-6 inline-block" legacyBehavior>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> {backText}
          </Button>
        </Link>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 flex items-center gap-3">
            <Tag className="h-8 w-8" />
            {decodedTag}
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
