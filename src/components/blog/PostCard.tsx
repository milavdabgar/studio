// src/components/blog/PostCard.tsx
"use client";

import { PostPreview } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Tag as TagIcon } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, isValid } from 'date-fns';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getHeroImageUrl, hasHeroImage } from '@/lib/hero-images';
import { HeroImage } from '@/components/ui/hero-image';

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
  const heroImageUrl = getHeroImageUrl(post);
  const showHeroImage = hasHeroImage(post);

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
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      {/* Hero Image */}
      {showHeroImage && heroImageUrl && (
        <HeroImage
          src={heroImageUrl}
          alt={post.title}
          containerClassName="relative h-48 w-full"
          className="w-full h-full object-cover"
        />
      )}
      
      <CardHeader>
        <CardTitle className="text-xl">
          <Link
            href={post.href}
            className="text-primary hover:text-primary dark:hover:text-primary/80 transition-colors"
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
          
          {showReadingTime && post.readingTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{post.readingTime} {t('minutes')}</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showExcerpt && post.excerpt && (
          <p className="text-muted-foreground mb-4 line-clamp-3">
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

        <div className="flex justify-between items-center">
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
