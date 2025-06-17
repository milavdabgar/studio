// src/components/blog/PostCard.tsx
"use client";

import { PostPreview } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Tag as TagIcon } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, isValid } from 'date-fns';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface PostCardProps {
  post: PostPreview;
  showExcerpt?: boolean;
  showTags?: boolean;
  showCategories?: boolean;
  showReadingTime?: boolean;
  showAuthor?: boolean;
}

export function PostCard({ 
  post, 
  showExcerpt = true, 
  showTags = true, 
  showCategories = true,
  showReadingTime = true,
  showAuthor = true 
}: PostCardProps) {
  const { t } = useLanguage();

  const formatDate = (dateInput: any) => {
    try {
      // Handle different date formats
      if (!dateInput) {
        return t('date_not_available' as any) || 'Date not available';
      }
      
      // If it's already a Date object
      if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
        return format(dateInput, 'LLLL d, yyyy');
      }
      
      // Convert to string first to avoid parseISO errors
      let dateString = String(dateInput);
      
      // Handle common date formats
      if (dateString && dateString.length > 0 && dateString !== 'undefined' && dateString !== 'null') {
        // Try parsing as ISO string
        const parsedDate = parseISO(dateString);
        if (isValid(parsedDate)) {
          return format(parsedDate, 'LLLL d, yyyy');
        }
        
        // Try creating new Date
        const fallbackDate = new Date(dateString);
        if (isValid(fallbackDate) && !isNaN(fallbackDate.getTime())) {
          return format(fallbackDate, 'LLLL d, yyyy');
        }
      }
      
      return t('date_not_available' as any) || 'Date not available';
    } catch (error) {
      console.warn('Date formatting error:', error, 'for date:', dateInput);
      return t('date_not_available' as any) || 'Date not available';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl">
          <Link 
            href={post.href} 
            className="text-primary hover:text-primary/80 transition-colors"
          >
            {post.title}
          </Link>
        </CardTitle>
        
        <CardDescription className="flex flex-wrap items-center gap-4 text-sm">
          {/* Date */}
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(post.date)}</span>
          </div>
          
          {/* Author */}
          {showAuthor && post.author && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{post.author}</span>
            </div>
          )}
          
          {/* Reading time */}
          {showReadingTime && post.readingTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{post.readingTime} {t('minutes')}</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Excerpt */}
        {showExcerpt && post.excerpt && (
          <p className="text-muted-foreground leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Tags and Categories */}
        <div className="flex flex-wrap gap-2">
          {showCategories && post.categories && post.categories.length > 0 && (
            <>
              {post.categories.map(category => (
                <Link key={category} href={`/categories/${post.lang}/${category}`}>
                  <Badge variant="secondary" className="hover:bg-secondary/80">
                    {category}
                  </Badge>
                </Link>
              ))}
            </>
          )}
          
          {showTags && post.tags && post.tags.length > 0 && (
            <>
              {post.tags.map(tag => (
                <Link key={tag} href={`/tags/${post.lang}/${tag}`}>
                  <Badge variant="outline" className="hover:bg-accent">
                    <TagIcon className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                </Link>
              ))}
            </>
          )}
        </div>

        {/* Draft indicator */}
        {post.draft && (
          <Badge variant="destructive" className="w-fit">
            {t('draft')}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
