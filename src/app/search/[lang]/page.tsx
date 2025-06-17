// src/app/search/[lang]/page.tsx

import { SearchBox } from '@/components/blog/SearchBox';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
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
  const backText = lang === 'gu' ? 'બ્લોગ પર પાછા જાઓ' : 'Back to Blog';

  return (
    <BlogLayout currentLang={lang}>
      <div className="container mx-auto px-4 py-8">
        <Link href={`/posts/${lang}`} className="mb-6 inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> {backText}
          </Button>
        </Link>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">{pageTitle}</h1>
          <p className="text-muted-foreground">
            {lang === 'gu' 
              ? 'બ્લોગ પોસ્ટ્સ, ટેગ્સ અને શ્રેણીઓ શોધો' 
              : 'Search blog posts, tags, and categories'
            }
          </p>
        </div>

        <SearchBox language={lang} />
      </div>
    </BlogLayout>
  );
}
