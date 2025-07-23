// src/components/blog/PostCard.tsx
"use client";

import { PostPreview } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Tag as TagIcon, FileText, BookOpen, Presentation } from 'lucide-react';
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
  
  // Content type styling configuration
  const getContentTypeStyle = (contentType: string) => {
    switch (contentType) {
      case 'pdf':
        return {
          colors: 'border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900',
          icon: FileText,
          iconColor: 'text-red-600 dark:text-red-400',
          badgeColor: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700',
          label: 'PDF'
        };
      case 'slidev':
        return {
          colors: 'border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900',
          icon: Presentation,
          iconColor: 'text-green-600 dark:text-green-400',
          badgeColor: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700',
          label: 'SLIDES'
        };
      default: // markdown
        return {
          colors: 'border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900',
          icon: BookOpen,
          iconColor: 'text-blue-600 dark:text-blue-400',
          badgeColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700',
          label: 'ARTICLE'
        };
    }
  };

  const contentType = (post as any).contentType || 'markdown';
  const typeStyle = getContentTypeStyle(contentType);
  const TypeIcon = typeStyle.icon;

  const formatDate = (dateInput: string | Date | undefined) => {
    try {
      if (!dateInput) {
        return t('date_not_available') || 'Date not available';
      }
      
      if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
        return format(dateInput, 'LLLL d, yyyy');
      }
      
      const dateString = String(dateInput);
      
      if (dateString && dateString.length > 0 && dateString !== 'undefined' && dateString !== 'null') {
        const parsedDate = parseISO(dateString);
        if (isValid(parsedDate)) {
          return format(parsedDate, 'LLLL d, yyyy');
        }
        
        const fallbackDate = new Date(dateString);
        if (isValid(fallbackDate) && !isNaN(fallbackDate.getTime())) {
          return format(fallbackDate, 'LLLL d, yyyy');
        }
      }
      
      return t('date_not_available') || 'Date not available';
    } catch (error) {
      console.warn('Date formatting error:', error, 'for date:', dateInput);
      return t('date_not_available') || 'Date not available';
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow h-full flex flex-col border ${typeStyle.colors}`}>
      <CardHeader className="flex-shrink-0">
        {/* Content Type Badge */}
        <div className="mb-3">
          <Badge className={`text-xs font-semibold px-2 py-1 ${typeStyle.badgeColor} border`}>
            <TypeIcon className={`h-3 w-3 mr-1 ${typeStyle.iconColor}`} />
            {typeStyle.label}
          </Badge>
        </div>
        
        <CardTitle className="text-lg leading-tight mb-2">
          <Link
            href={post.href}
            className="text-primary hover:text-primary dark:hover:text-primary/80 transition-colors block"
            title={post.title}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
              hyphens: 'auto'
            }}
          >
            {post.title}
          </Link>
        </CardTitle>
        
        <CardDescription className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(post.date)}</span>
          </div>
          
          
          {showAuthor && post.author && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{post.author}</span>
            </div>
          )}
          
          {showReadingTime && post.readingTime && (post as any).contentType !== 'pdf' && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{post.readingTime} {t('minutes')}</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {showExcerpt && post.excerpt && (
          <p 
            className="text-muted-foreground mb-4"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {post.excerpt}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {showCategories && post.categories && post.categories.length > 0 && (
            <>
              {post.categories.slice(0, 2).map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
              {post.categories.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{post.categories.length - 2}
                </Badge>
              )}
            </>
          )}

          {showTags && post.tags && post.tags.length > 0 && (
            <>
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <TagIcon className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{post.tags.length - 3}
                </Badge>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between items-center mt-auto">
          <Link
            href={post.href}
            className="text-sm text-primary hover:text-primary dark:hover:text-primary/80 transition-colors"
          >
            {t('read_more') || 'Read more'} →
          </Link>
          
          {post.wordCount && (
            <span className="text-xs text-muted-foreground">
              {post.wordCount} {t('word_count') || 'words'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
