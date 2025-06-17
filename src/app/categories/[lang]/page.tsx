// src/app/categories/[lang]/page.tsx

import { getAllCategories } from '@/lib/markdown';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Folder } from 'lucide-react';
import Link from 'next/link';
import { languages } from '@/lib/config';

interface CategoriesPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateStaticParams() {
  return Object.keys(languages).map((lang) => ({
    lang,
  }));
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { lang } = await params;
  const categories = await getAllCategories(lang);
  
  const pageTitle = lang === 'gu' ? 'શ્રેણીઓ' : 'Categories';
  const backText = lang === 'gu' ? 'બ્લોગ પર પાછા જાઓ' : 'Back to Blog';
  const noCategoriesText = lang === 'gu' ? 'કોઈ શ્રેણીઓ મળી નથી' : 'No categories found';

  return (
    <BlogLayout currentLang={lang}>
      <div className="container mx-auto px-4 py-8">
        <Link href={`/posts/${lang}`} className="mb-6 inline-block" legacyBehavior>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> {backText}
          </Button>
        </Link>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">{pageTitle}</h1>
          <p className="text-muted-foreground">
            {lang === 'gu' 
              ? 'બ્લોગ પોસ્ટ્સની શ્રેણીઓ અને વિભાગો શોધો' 
              : 'Explore blog post categories and sections'
            }
          </p>
        </div>

        {categories.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">{noCategoriesText}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map(({ name, count }) => (
              <Card key={name} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Folder className="h-5 w-5 text-primary" />
                    <Link
                      href={`/categories/${lang}/${encodeURIComponent(name)}`}
                      className="text-primary hover:text-primary/80 transition-colors"
                      legacyBehavior>
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
