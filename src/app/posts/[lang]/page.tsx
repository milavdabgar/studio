
// src/app/posts/[lang]/page.tsx

import Link from 'next/link';
import { getSortedPostsData, availableLanguages, type PostPreview } from '@/lib/markdown';
import { format, parseISO, isValid } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper } from 'lucide-react';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return availableLanguages.map((lang) => ({
    lang: lang,
  }));
}

interface PageParams {
  lang: string;
}

export default async function BlogIndexPage(
  { params }: { params: PageParams }
) {
  // In Next.js 15, we must await the params object
  const validatedParams = await Promise.resolve(params);
  const language = validatedParams.lang;

  // Validate the language parameter
  if (!language || !availableLanguages.includes(language)) {
    notFound();
  }
  


  const allPostsData: PostPreview[] = await getSortedPostsData(language);
  const pageTitle = language === 'gu' ? 'બ્લોગ / લેખો' : 'Blog / Articles';
  const pageDescription = language === 'gu' ? 'પોલીમેનેજર તરફથી નવીનતમ લેખો અને અપડેટ્સ વાંચો.' : 'Read the latest articles and updates from PolyManager.';
  const noPostsMessage = language === 'gu' ? 'કોઈ પોસ્ટ મળી નથી.' : 'No posts found.';
  const readMoreText = language === 'gu' ? 'વધુ વાંચો →' : 'Read more →';

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
            <Newspaper className="h-7 w-7" />
            {pageTitle}
          </CardTitle>
          <CardDescription>
            {pageDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allPostsData.length === 0 ? (
            <p className="text-muted-foreground">{noPostsMessage}</p>
          ) : (
            <ul className="space-y-6">
              {allPostsData.map(({ id, date, title, excerpt }) => (
                <li key={id}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <Link href={`/posts/${language}/${id}`} legacyBehavior>
                        <a className="text-2xl font-semibold text-primary hover:underline">
                          {title}
                        </a>
                      </Link>
                      <CardDescription className="text-sm text-muted-foreground">
                        {date && isValid(parseISO(date)) ? format(parseISO(date), 'LLLL d, yyyy') : 'Date not available'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground line-clamp-3">
                        {excerpt || (language === 'gu' ? 'વધુ વાંચો...' : 'Read more...')}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/posts/${language}/${id}`} passHref>
                        <Button variant="link" className="p-0">{readMoreText}</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
