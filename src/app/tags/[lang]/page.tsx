// src/app/tags/[lang]/page.tsx

import { getAllTags } from '@/lib/markdown';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { Breadcrumbs } from '@/components/blog/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';
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
  const noTagsText = lang === 'gu' ? 'કોઈ ટેગ્સ મળ્યા નથી' : 'No tags found';

  // Breadcrumb for tags page
  const breadcrumbItems = [{
    label: pageTitle,
    href: ''
  }];

  return (
    <BlogLayout currentLang={lang}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} currentLang={lang} />
          
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              {pageTitle}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {lang === 'gu' 
                ? 'બ્લોગ પોસ્ટ્સના ટેગ્સ અને વિષયો શોધો' 
                : 'Explore blog post tags and topics'
              }
            </p>
          </div>

          {tags.length === 0 ? (
            <Card className="shadow-lg border-0 bg-gradient-to-r from-card to-card/80">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">{noTagsText}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tags.map(({ name, count }) => (
                <Card key={name} className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 bg-gradient-to-br from-card to-card/90">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Tag className="h-5 w-5 text-primary" />
                      <Link
                        href={`/tags/${lang}/${encodeURIComponent(name)}`}
                        className="text-primary hover:text-primary/80 transition-colors flex-1 truncate"
                        title={name}
                      >
                        {name}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="w-full justify-center">
                      {count} {count === 1 ? 'post' : 'posts'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </BlogLayout>
  );
}
