// src/app/tags/[lang]/page.tsx

import { getAllTags } from '@/lib/markdown';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Tag } from 'lucide-react';
import Link from 'next/link';
import { languages } from '@/lib/config';

interface TagsPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateStaticParams() {
  return Object.keys(languages).map((lang) => ({
    lang,
  }));
}

export default async function TagsPage({ params }: TagsPageProps) {
  const { lang } = await params;
  const tags = await getAllTags(lang);
  
  const pageTitle = lang === 'gu' ? 'ટેગ્સ' : 'Tags';
  const backText = lang === 'gu' ? 'બ્લોગ પર પાછા જાઓ' : 'Back to Blog';
  const noTagsText = lang === 'gu' ? 'કોઈ ટેગ્સ મળ્યા નથી' : 'No tags found';

  return (
    <BlogLayout currentLang={lang}>
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" className="mb-6 inline-block" asChild>
          <Link href={`/posts/${lang}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {backText}
          </Link>
        </Button>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">{pageTitle}</h1>
          <p className="text-muted-foreground">
            {lang === 'gu' 
              ? 'બ્લોગ પોસ્ટ્સના ટેગ્સ અને વિષયો શોધો' 
              : 'Explore blog post tags and topics'
            }
          </p>
        </div>

        {tags.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">{noTagsText}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tags.map(({ name, count }) => (
              <Card key={name} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Tag className="h-5 w-5 text-primary" />
                    <Link
                      href={`/tags/${lang}/${encodeURIComponent(name)}`}
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      {name}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">
                    {count} {count === 1 ? 'post' : 'posts'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </BlogLayout>
  );
}
