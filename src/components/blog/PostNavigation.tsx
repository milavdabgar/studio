// src/components/blog/PostNavigation.tsx

import { PostPreview } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PostNavigationProps {
  previousPost: PostPreview | null;
  nextPost: PostPreview | null;
  lang: string;
}

export function PostNavigation({ previousPost, nextPost, lang }: PostNavigationProps) {
  if (!previousPost && !nextPost) {
    return null;
  }

  const previousText = lang === 'gu' ? 'પાછલી પોસ્ટ' : 'Previous Post';
  const nextText = lang === 'gu' ? 'આગળની પોસ્ટ' : 'Next Post';

  return (
    <nav className="mt-12">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Previous Post */}
        <div className="md:justify-self-start">
          {previousPost ? (
            <Link href={previousPost.href}>
              <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/20 h-full dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <ArrowLeft className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted-foreground mb-1">{previousText}</p>
                      <h3 className="font-semibold line-clamp-2 hover:text-primary dark:hover:text-primary transition-colors">
                        {previousPost.title}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <div /> // Empty div to maintain grid layout
          )}
        </div>

        {/* Next Post */}
        <div className="md:justify-self-end">
          {nextPost ? (
            <Link href={nextPost.href}>
              <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/20 h-full dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1 text-right">
                      <p className="text-sm text-muted-foreground mb-1">{nextText}</p>
                      <h3 className="font-semibold line-clamp-2 hover:text-primary dark:hover:text-primary transition-colors">
                        {nextPost.title}
                      </h3>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <div /> // Empty div to maintain grid layout
          )}
        </div>
      </div>
    </nav>
  );
}
