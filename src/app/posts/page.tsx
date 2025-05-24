
import Link from 'next/link';
import { getSortedPostsData } from '@/lib/markdown';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Newspaper } from 'lucide-react';

export default function BlogIndexPage() {
  const allPostsData = getSortedPostsData();

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
            <Newspaper className="h-7 w-7" />
            Blog / Articles
          </CardTitle>
          <CardDescription>
            Read the latest articles and updates from PolyManager.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allPostsData.length === 0 ? (
            <p className="text-muted-foreground">No posts found.</p>
          ) : (
            <ul className="space-y-6">
              {allPostsData.map(({ id, date, title, excerpt }) => (
                <li key={id}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <Link href={`/posts/${id}`} legacyBehavior>
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
                        {excerpt || 'Read more...'}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/posts/${id}`} passHref>
                        <Button variant="link" className="p-0">Read more &rarr;</Button>
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
