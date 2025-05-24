// src/app/posts/[lang]/[slug]/page.tsx
// THIS IS NOW A SERVER COMPONENT

import { getPostData, getAllPostSlugsWithLang, type PostData } from '@/lib/markdown';
import { format, parseISO, isValid } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import 'katex/dist/katex.min.css'; // KaTeX CSS can be imported in Server Component
import PostRenderer from '@/components/blog/PostRenderer'; // Import the new Client Component

interface PostPageProps {
  params: {
    lang: string;
    slug: string;
  };
}

export async function generateStaticParams() {
  return getAllPostSlugsWithLang();
}

async function getPost(lang: string, slug: string): Promise<PostData | null> {
  try {
    const data = await getPostData(lang, slug);
    return data;
  } catch (e) {
    console.error("Error fetching post data in page component:", e);
    return null;
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { lang, slug } = params;
  const postData = await getPost(lang, slug);

  if (!postData) {
    const backLinkTextOnError = lang === 'gu' ? 'બધા લેખો પર પાછા જાઓ' : 'Back to all articles';
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-destructive text-lg mb-4">Post not found or failed to load.</p>
        <Link href={`/posts/${lang || 'en'}`} passHref className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> {backLinkTextOnError}
          </Button>
        </Link>
      </div>
    );
  }
  
  const backLinkText = lang === 'gu' ? 'બધા લેખો પર પાછા જાઓ' : 'Back to all articles';

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href={`/posts/${lang}`} passHref className="mb-6 inline-block">
        <Button variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> {backLinkText}
        </Button>
      </Link>
      <Card className="shadow-xl">
        <CardHeader className="border-b">
          <CardTitle className="text-4xl font-bold text-primary leading-tight">
            {postData.title}
          </CardTitle>
          <CardDescription className="text-md text-muted-foreground pt-2">
            {postData.date && isValid(parseISO(postData.date)) ? format(parseISO(postData.date), 'LLLL d, yyyy') : 'Date not available'}
            {postData.author && ` by ${postData.author}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <article className="prose prose-lg dark:prose-invert max-w-none">
            {/* Use the Client Component to render content and handle Mermaid */}
            <PostRenderer contentHtml={postData.contentHtml} />
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
