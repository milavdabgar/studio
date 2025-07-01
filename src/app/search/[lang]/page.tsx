// src/app/search/[lang]/page.tsx

import { AdvancedSearch } from '@/components/blog/AdvancedSearch';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { Breadcrumbs } from '@/components/blog/Breadcrumbs';
import { languages } from '@/lib/config';

interface SearchPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateStaticParams() {
  return Object.keys(languages).map((lang) => ({
    lang,
  }));
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { lang } = await params;
  
  const pageTitle = lang === 'gu' ? 'શોધ' : 'Search';

  // Breadcrumb for search page
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
                ? 'બ્લોગ પોસ્ટ્સ, ટેગ્સ અને શ્રેણીઓ શોધો' 
                : 'Search blog posts, tags, and categories'
              }
            </p>
          </div>

          <AdvancedSearch language={lang} />
        </div>
      </div>
    </BlogLayout>
  );
}
