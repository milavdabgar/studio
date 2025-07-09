// src/components/blog/RelatedPosts.tsx

import { PostPreview } from '@/lib/types';
import { PostCard } from '@/components/blog/PostCard';
import { BookOpen } from 'lucide-react';

interface RelatedPostsProps {
  posts: PostPreview[];
  lang: string;
}

export function RelatedPosts({ posts, lang }: RelatedPostsProps) {
  if (posts.length === 0) {
    return null;
  }

  const title = lang === 'gu' ? 'સંબંધિત પોસ્ટ્સ' : 'Related Posts';

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard 
            key={`${post.lang}-${post.id}`} 
            post={post}
            showExcerpt={true}
            showTags={true}
            showCategories={false}
            showReadingTime={true}
            showAuthor={false}
          />
        ))}
      </div>
    </section>
  );
}
