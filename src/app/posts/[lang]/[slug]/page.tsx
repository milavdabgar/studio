
import { getPostData, getAllPostSlugsWithLang, type PostData } from '@/lib/markdown';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';

interface PostPageProps {
  params: {
    lang: string;
    slug: string;
  };
}

export async function generateStaticParams() {
  return getAllPostSlugsWithLang();
}

export default async function PostPage({ params }: PostPageProps) {
  const { lang, slug } = params;
  let postData: PostData;

  try {
    postData = await getPostData(lang, slug);
  } catch (error) {
    console.error(error);
    notFound();
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
            {postData.date && parseISO(postData.date) ? format(parseISO(postData.date), 'LLLL d, yyyy') : 'Date not available'}
            {postData.author && ` by ${postData.author}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: