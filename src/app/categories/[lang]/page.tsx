// src/app/categories/[lang]/page.tsx

import { getAllCategories } from '@/lib/markdown';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { Breadcrumbs } from '@/components/blog/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Folder } from 'lucide-react';
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
  const noCategoriesText = lang === 'gu' ? 'કોઈ શ્રેણીઓ મળી નથી' : 'No categories found';

  // Breadcrumb for categories page
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
                ? 'બ્લોગ પોસ્ટ્સની શ્રેણીઓ અને વિભાગો શોધો' 
                : 'Explore blog post categories and sections'
              }
            </p>
          </div>

          {categories.length === 0 ? (
            <Card className="shadow-lg border-0 bg-gradient-to-r from-card to-card/80">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">{noCategoriesText}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map(({ name, count }) => (
                <Card key={name} className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 bg-gradient-to-br from-card to-card/90">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Folder className="h-5 w-5 text-primary" />
                      <Link
                        href={`/categories/${lang}/${encodeURIComponent(name)}`}
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
