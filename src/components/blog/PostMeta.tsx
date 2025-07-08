// src/components/blog/PostMeta.tsx
"use client";

import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Tag as TagIcon } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import Link from 'next/link';

interface PostMetaProps {
  date?: string | Date;
  author?: string | string[];
  readingTime?: number;
  tags?: string[];
  categories?: string[];
  lang: string;
  showTags?: boolean;
  showCategories?: boolean;
  showReadingTime?: boolean;
  showAuthor?: boolean;
  className?: string;
}

export function PostMeta({ 
  date, 
  author, 
  readingTime, 
  tags = [], 
  categories = [], 
  lang,
  showTags = true,
  showCategories = true,
  showReadingTime = true,
  showAuthor = true,
  className = ''
}: PostMetaProps) {
  const formatDate = (dateInput: string | Date | undefined) => {
    try {
      if (!dateInput) {
        return lang === 'gu' ? 'તારીખ ઉપલબ્ધ નથી' : 'Date not available';
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
      
      return lang === 'gu' ? 'તારીખ ઉપલબ્ધ નથી' : 'Date not available';
    } catch (error) {
      console.warn('Date formatting error:', error, 'for date:', dateInput);
      return lang === 'gu' ? 'તારીખ ઉપલબ્ધ નથી' : 'Date not available';
    }
  };

  const formatAuthors = (authorInput: string | string[]) => {
    if (Array.isArray(authorInput)) {
      return authorInput.join(', ');
    }
    return authorInput;
  };

  return (
    <div className={`flex flex-wrap items-center gap-4 text-sm text-muted-foreground ${className}`}>
      {/* Date */}
      {date && (
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(date)}</span>
        </div>
      )}

      {/* Author */}
      {showAuthor && author && (
        <div className="flex items-center gap-1">
          <User className="h-4 w-4" />
          <Link 
            href={`/authors/${lang}/${encodeURIComponent(Array.isArray(author) ? author[0] : author)}`}
            className="hover:text-foreground transition-colors hover:underline"
          >
            {formatAuthors(author)}
          </Link>
        </div>
      )}

      {/* Reading Time */}
      {showReadingTime && readingTime && (
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>
            {readingTime} {lang === 'gu' ? 'મિનિટ' : 'min'} {lang === 'gu' ? 'વાંચવાનો સમય' : 'read'}
          </span>
        </div>
      )}

      {/* Categories */}
      {showCategories && categories.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{lang === 'gu' ? 'શ્રેણીઓ:' : 'Categories:'}</span>
          <div className="flex flex-wrap gap-1">
            {categories.slice(0, 3).map((category) => (
              <Link key={category} href={`/categories/${lang}/${encodeURIComponent(category)}`}>
                <Badge variant="secondary" className="text-xs hover:bg-secondary/80 transition-colors">
                  {category}
                </Badge>
              </Link>
            ))}
            {categories.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{categories.length - 3}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {showTags && tags.length > 0 && (
        <div className="flex items-center gap-2">
          <TagIcon className="h-4 w-4" />
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 5).map((tag) => (
              <Link key={tag} href={`/tags/${lang}/${encodeURIComponent(tag)}`}>
                <Badge variant="outline" className="text-xs hover:bg-accent transition-colors">
                  {tag}
                </Badge>
              </Link>
            ))}
            {tags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 5}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
