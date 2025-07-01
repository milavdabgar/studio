// src/app/authors/[lang]/page.tsx

import { getAllAuthors } from '@/lib/markdown';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, User } from 'lucide-react';
import Link from 'next/link';
import { languages } from '@/lib/config';

interface AuthorsPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateStaticParams() {
  return Object.keys(languages).map((lang) => ({
    lang,
  }));
}

export default async function AuthorsPage({ params }: AuthorsPageProps) {
  const { lang } = await params;
  const authors = await getAllAuthors(lang);
  
  const pageTitle = lang === 'gu' ? 'બધા લેખકો' : 'All Authors';
  const backText = lang === 'gu' ? 'બ્લોગ પર પાછા જાઓ' : 'Back to Blog';
  const noAuthorsText = lang === 'gu' ? 'કોઈ લેખકો મળ્યા નથી' : 'No authors found';
  const postsText = lang === 'gu' ? 'પોસ્ટ્સ' : 'posts';

  return (
    <BlogLayout currentLang={lang}>
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" className="mb-6 inline-block" asChild>
          <Link href={`/posts/${lang}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backText}
          </Link>
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">{pageTitle}</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            {lang === 'gu' 
              ? 'અમારા બ્લોગના બધા લેખકો શોધો' 
              : 'Discover all the authors on our blog'
            }
          </p>
        </div>

        {authors.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">{noAuthorsText}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {authors.map((author) => (
              <Link key={author.name} href={`/authors/${lang}/${encodeURIComponent(author.name)}`}>
                <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/20 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {author.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {author.count} {postsText}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </BlogLayout>
  );
}
