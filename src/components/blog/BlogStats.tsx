// src/components/blog/BlogStats.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Tag, 
  Folder, 
  User, 
  Calendar, 
  TrendingUp,
  BarChart3,
  Clock
} from 'lucide-react';
import { PostPreview } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface BlogStatsProps {
  posts: PostPreview[];
  lang: string;
  className?: string;
}

interface StatsData {
  totalPosts: number;
  totalTags: number;
  totalCategories: number;
  totalAuthors: number;
  averageReadingTime: number;
  postsThisMonth: number;
  postsThisYear: number;
  mostUsedTags: Array<{ name: string; count: number }>;
  mostUsedCategories: Array<{ name: string; count: number }>;
  postsByMonth: Array<{ month: string; count: number }>;
  authorStats: Array<{ name: string; postCount: number; percentage: number }>;
}

function calculateStats(posts: PostPreview[]): StatsData {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Basic counts
  const totalPosts = posts.length;
  
  // Get unique values
  const allTags = posts.flatMap(post => post.tags || []);
  const allCategories = posts.flatMap(post => post.categories || []);
  const allAuthors = posts.map(post => post.author).filter(Boolean) as string[];
  
  const uniqueTags = [...new Set(allTags)];
  const uniqueCategories = [...new Set(allCategories)];
  const uniqueAuthors = [...new Set(allAuthors)];

  // Reading time calculation (assuming 200 WPM)
  const totalReadingTime = posts.reduce((acc, post) => {
    const wordCount = (post.excerpt || '').split(' ').length;
    return acc + Math.ceil(wordCount / 200);
  }, 0);
  const averageReadingTime = totalPosts > 0 ? Math.round(totalReadingTime / totalPosts) : 0;

  // Posts this month/year
  const postsThisMonth = posts.filter(post => {
    const postDate = parseISO(post.date);
    return postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear;
  }).length;

  const postsThisYear = posts.filter(post => {
    const postDate = parseISO(post.date);
    return postDate.getFullYear() === currentYear;
  }).length;

  // Most used tags
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostUsedTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Most used categories
  const categoryCounts = allCategories.reduce((acc, category) => {
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostUsedCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Posts by month (last 6 months)
  const postsByMonth = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 1);
    const monthPosts = posts.filter(post => {
      const postDate = parseISO(post.date);
      return postDate.getMonth() === date.getMonth() && postDate.getFullYear() === date.getFullYear();
    }).length;

    postsByMonth.push({
      month: format(date, 'MMM yyyy'),
      count: monthPosts
    });
  }

  // Author stats
  const authorCounts = allAuthors.reduce((acc, author) => {
    acc[author] = (acc[author] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const authorStats = Object.entries(authorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, postCount]) => ({
      name,
      postCount,
      percentage: Math.round((postCount / totalPosts) * 100)
    }));

  return {
    totalPosts,
    totalTags: uniqueTags.length,
    totalCategories: uniqueCategories.length,
    totalAuthors: uniqueAuthors.length,
    averageReadingTime,
    postsThisMonth,
    postsThisYear,
    mostUsedTags,
    mostUsedCategories,
    postsByMonth,
    authorStats
  };
}

export function BlogStats({ posts, lang, className }: BlogStatsProps) {
  const stats = calculateStats(posts);

  const getText = (key: string) => {
    const texts = {
      en: {
        blogStats: 'Blog Statistics',
        overview: 'Overview',
        totalPosts: 'Total Posts',
        totalTags: 'Total Tags',
        totalCategories: 'Total Categories',
        totalAuthors: 'Total Authors',
        averageReadingTime: 'Avg. Reading Time',
        thisMonth: 'This Month',
        thisYear: 'This Year',
        minutes: 'min',
        activity: 'Activity',
        popularTags: 'Popular Tags',
        popularCategories: 'Popular Categories',
        monthlyPosts: 'Monthly Posts',
        authorContributions: 'Author Contributions',
        posts: 'posts'
      },
      gu: {
        blogStats: 'બ્લોગ આંકડા',
        overview: 'વિહંગાવલોકન',
        totalPosts: 'કુલ પોસ્ટ્સ',
        totalTags: 'કુલ ટેગ્સ',
        totalCategories: 'કુલ શ્રેણીઓ',
        totalAuthors: 'કુલ લેખકો',
        averageReadingTime: 'સરેરાશ વાંચન સમય',
        thisMonth: 'આ મહિને',
        thisYear: 'આ વર્ષે',
        minutes: 'મિનિટ',
        activity: 'પ્રવૃત્તિ',
        popularTags: 'લોકપ્રિય ટેગ્સ',
        popularCategories: 'લોકપ્રિય શ્રેણીઓ',
        monthlyPosts: 'માસિક પોસ્ટ્સ',
        authorContributions: 'લેખકોનું યોગદાન',
        posts: 'પોસ્ટ્સ'
      }
    };
    return texts[lang as keyof typeof texts]?.[key as keyof typeof texts.en] || texts.en[key as keyof typeof texts.en];
  };

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          {getText('blogStats')}
        </h2>
      </div>

      <div className="grid gap-6">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {getText('overview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="text-2xl font-bold">{stats.totalPosts}</div>
                <div className="text-sm text-muted-foreground">{getText('totalPosts')}</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Tag className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">{stats.totalTags}</div>
                <div className="text-sm text-muted-foreground">{getText('totalTags')}</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Folder className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold">{stats.totalCategories}</div>
                <div className="text-sm text-muted-foreground">{getText('totalCategories')}</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <User className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold">{stats.totalAuthors}</div>
                <div className="text-sm text-muted-foreground">{getText('totalAuthors')}</div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-lg font-semibold">{stats.averageReadingTime} {getText('minutes')}</div>
                <div className="text-sm text-muted-foreground">{getText('averageReadingTime')}</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-lg font-semibold">{stats.postsThisMonth}</div>
                <div className="text-sm text-muted-foreground">{getText('thisMonth')}</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-lg font-semibold">{stats.postsThisYear}</div>
                <div className="text-sm text-muted-foreground">{getText('thisYear')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Popular Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                {getText('popularTags')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.mostUsedTags.map((tag, index) => (
                <div key={tag.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <Badge variant="secondary">{tag.name}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{tag.count} {getText('posts')}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Popular Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                {getText('popularCategories')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.mostUsedCategories.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <Badge variant="outline">{category.name}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{category.count} {getText('posts')}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {getText('monthlyPosts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.postsByMonth.map((month) => (
                <div key={month.month} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium">{month.month}</div>
                  <div className="flex-1">
                    <Progress 
                      value={(month.count / Math.max(...stats.postsByMonth.map(m => m.count))) * 100} 
                      className="h-2"
                    />
                  </div>
                  <div className="w-12 text-sm text-muted-foreground text-right">{month.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Author Contributions */}
        {stats.authorStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {getText('authorContributions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.authorStats.map((author) => (
                <div key={author.name} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{author.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {author.postCount} {getText('posts')} ({author.percentage}%)
                      </span>
                    </div>
                    <Progress value={author.percentage} className="h-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
