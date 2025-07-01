// src/app/blog-dashboard/[lang]/page.tsx

import { getSortedPostsData, getAllTags, getAllCategories, getAllAuthors } from '@/lib/markdown';
import { BlogLayout } from '@/components/blog/BlogLayout';
import { BlogStats } from '@/components/blog/BlogStats';
import { AdvancedSearch } from '@/components/blog/AdvancedSearch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart3, Search, Tag, Folder, Users, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { languages } from '@/lib/config';

interface DashboardPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateStaticParams() {
  return Object.keys(languages).map((lang) => ({
    lang,
  }));
}

export default async function BlogDashboard({ params }: DashboardPageProps) {
  const { lang } = await params;
  
  // Fetch all data
  const [posts, tags, categories, authors] = await Promise.all([
    getSortedPostsData(lang),
    getAllTags(lang),
    getAllCategories(lang),
    getAllAuthors(lang)
  ]);

  const getText = (key: string) => {
    const texts = {
      en: {
        blogDashboard: 'Blog Dashboard',
        backToBlog: 'Back to Blog',
        overview: 'Overview',
        analytics: 'Analytics',
        search: 'Search',
        manage: 'Manage',
        quickStats: 'Quick Stats',
        totalPosts: 'Total Posts',
        totalTags: 'Total Tags',
        totalCategories: 'Total Categories',
        totalAuthors: 'Total Authors',
        recentPosts: 'Recent Posts',
        viewAll: 'View All',
        createNew: 'Create New Post',
        manageTags: 'Manage Tags',
        manageCategories: 'Manage Categories',
        manageAuthors: 'Manage Authors',
        searchDescription: 'Search and filter through all blog posts with advanced options',
        analyticsDescription: 'View detailed statistics and insights about your blog content',
        manageDescription: 'Manage tags, categories, authors, and other blog content'
      },
      gu: {
        blogDashboard: 'બ્લોગ ડેશબોર્ડ',
        backToBlog: 'બ્લોગ પર પાછા જાઓ',
        overview: 'વિહંગાવલોકન',
        analytics: 'આંકડા',
        search: 'શોધ',
        manage: 'વ્યવસ્થાપન',
        quickStats: 'ઝડપી આંકડા',
        totalPosts: 'કુલ પોસ્ટ્સ',
        totalTags: 'કુલ ટેગ્સ',
        totalCategories: 'કુલ શ્રેણીઓ',
        totalAuthors: 'કુલ લેખકો',
        recentPosts: 'તાજેતરની પોસ્ટ્સ',
        viewAll: 'બધા જુઓ',
        createNew: 'નવી પોસ્ટ બનાવો',
        manageTags: 'ટેગ્સ વ્યવસ્થાપન',
        manageCategories: 'શ્રેણીઓ વ્યવસ્થાપન',
        manageAuthors: 'લેખકો વ્યવસ્થાપન',
        searchDescription: 'વિગતવાર વિકલ્પો સાથે બધી બ્લોગ પોસ્ટ્સ શોધો અને ફિલ્ટર કરો',
        analyticsDescription: 'તમારી બ્લોગ સામગ્રી વિશે વિગતવાર આંકડા અને આંતરદૃષ્ટિ જુઓ',
        manageDescription: 'ટેગ્સ, શ્રેણીઓ, લેખકો અને અન્ય બ્લોગ સામગ્રીનું વ્યવસ્થાપન કરો'
      }
    };
    return texts[lang as keyof typeof texts]?.[key as keyof typeof texts.en] || texts.en[key as keyof typeof texts.en];
  };

  const recentPosts = posts.slice(0, 5);

  return (
    <BlogLayout currentLang={lang}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="outline" className="mb-6 inline-block" asChild>
            <Link href={`/posts/${lang}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {getText('backToBlog')}
            </Link>
          </Button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-primary flex items-center gap-3">
              <BarChart3 className="h-8 w-8" />
              {getText('blogDashboard')}
            </h1>
            
            <Button asChild>
              <Link href={`/posts/${lang}/new`}>
                <Plus className="mr-2 h-4 w-4" />
                {getText('createNew')}
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {getText('overview')}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {getText('analytics')}
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {getText('search')}
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {getText('manage')}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>{getText('quickStats')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-3xl font-bold">{posts.length}</div>
                    <div className="text-muted-foreground">{getText('totalPosts')}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Tag className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold">{tags.length}</div>
                    <div className="text-muted-foreground">{getText('totalTags')}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Folder className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold">{categories.length}</div>
                    <div className="text-muted-foreground">{getText('totalCategories')}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="h-8 w-8 text-purple-500" />
                    </div>
                    <div className="text-3xl font-bold">{authors.length}</div>
                    <div className="text-muted-foreground">{getText('totalAuthors')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Posts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{getText('recentPosts')}</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/posts/${lang}`}>
                    {getText('viewAll')}
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <div key={`${post.lang}-${post.id}`} className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                      <div className="flex-1">
                        <h4 className="font-medium">
                          <Link href={post.href} className="hover:text-primary dark:hover:text-primary">
                            {post.title}
                          </Link>
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {post.excerpt && post.excerpt.length > 100 
                            ? `${post.excerpt.substring(0, 100)}...` 
                            : post.excerpt}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {post.tags?.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground ml-4">
                        {new Date(post.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>{getText('analytics')}</CardTitle>
                <p className="text-muted-foreground">{getText('analyticsDescription')}</p>
              </CardHeader>
              <CardContent>
                <BlogStats posts={posts} lang={lang} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>{getText('search')}</CardTitle>
                <p className="text-muted-foreground">{getText('searchDescription')}</p>
              </CardHeader>
              <CardContent>
                <AdvancedSearch language={lang} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Tags Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    {getText('manageTags')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-2xl font-bold">{tags.length}</div>
                    <p className="text-sm text-muted-foreground">
                      {getText('totalTags')}
                    </p>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                      {tags.slice(0, 10).map((tag) => (
                        <Badge key={tag.name} variant="secondary" className="text-xs">
                          {tag.name} ({tag.count})
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/tags/${lang}`}>
                        {getText('viewAll')}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Categories Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    {getText('manageCategories')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-2xl font-bold">{categories.length}</div>
                    <p className="text-sm text-muted-foreground">
                      {getText('totalCategories')}
                    </p>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                      {categories.slice(0, 10).map((category) => (
                        <Badge key={category.name} variant="outline" className="text-xs">
                          {category.name} ({category.count})
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/categories/${lang}`}>
                        {getText('viewAll')}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Authors Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {getText('manageAuthors')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-2xl font-bold">{authors.length}</div>
                    <p className="text-sm text-muted-foreground">
                      {getText('totalAuthors')}
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {authors.slice(0, 5).map((author) => (
                        <div key={author.name} className="flex items-center justify-between text-sm">
                          <span>{author.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {author.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/authors/${lang}`}>
                        {getText('viewAll')}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </BlogLayout>
  );
}
