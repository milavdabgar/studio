// src/components/blog/SubsectionCard.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Folder, FileText, BookOpen, Presentation } from 'lucide-react';
import Link from 'next/link';

interface SubsectionCardProps {
  name: string;
  slug: string;
  postCount: number;
  lang: string;
  description?: string;
  contentType?: 'markdown' | 'pdf' | 'slidev' | 'mixed';
  typeDescription?: string;
}

export function SubsectionCard({ name, slug, postCount, lang, description, contentType = 'markdown', typeDescription }: SubsectionCardProps) {
  // Content type styling configuration
  const getContentTypeStyle = (type: string, customLabel?: string) => {
    switch (type) {
      case 'pdf':
        return {
          colors: 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800',
          folderBg: 'from-red-100 to-red-200 dark:from-red-800 dark:to-red-700',
          icon: FileText,
          iconColor: 'text-red-600 dark:text-red-400',
          badgeColor: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
          label: customLabel || 'PDF Collection'
        };
      case 'slidev':
        return {
          colors: 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800',
          folderBg: 'from-green-100 to-green-200 dark:from-green-800 dark:to-green-700',
          icon: Presentation,
          iconColor: 'text-green-600 dark:text-green-400',
          badgeColor: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
          label: customLabel || 'Slide Presentations'
        };
      case 'mixed':
        return {
          colors: 'from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800',
          folderBg: 'from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-700',
          icon: Folder,
          iconColor: 'text-purple-600 dark:text-purple-400',
          badgeColor: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
          label: customLabel || 'Mixed Content'
        };
      default: // markdown
        return {
          colors: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800',
          folderBg: 'from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700',
          icon: BookOpen,
          iconColor: 'text-blue-600 dark:text-blue-400',
          badgeColor: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
          label: customLabel || 'Articles'
        };
    }
  };

  const typeStyle = getContentTypeStyle(contentType, typeDescription);
  const ContentIcon = typeStyle.icon;

  // Format the display name
  const displayName = name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/\bSem\b/g, 'Semester')
    .replace(/\bIct\b/g, 'ICT');

  const itemText = lang === 'gu' 
    ? `${postCount} આઇટમ${postCount !== 1 ? 'સ' : ''}` 
    : `${postCount} item${postCount !== 1 ? 's' : ''}`;

  return (
    <Card className={`group overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${typeStyle.colors} hover:scale-[1.02] h-full flex flex-col border`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${typeStyle.folderBg} group-hover:scale-110 transition-all duration-300 shadow-sm`}>
            <ContentIcon className={`h-6 w-6 ${typeStyle.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold leading-tight">
              <Link
                href={`/posts/${lang}/${slug}`}
                className="text-primary hover:text-secondary transition-colors block group-hover:text-primary dark:hover:text-primary"
                title={displayName}
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                  hyphens: 'auto'
                }}
              >
                {displayName}
              </Link>
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed">
              {description || itemText}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={`text-xs font-medium ${typeStyle.badgeColor} border-0`}>
              <ContentIcon className={`h-3 w-3 mr-1 ${typeStyle.iconColor}`} />
              {typeStyle.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {itemText}
            </Badge>
          </div>
          <Link
            href={`/posts/${lang}/${slug}`}
            className="text-sm font-medium text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1 group/link"
          >
            {lang === 'gu' ? 'જુઓ' : 'View'}
            <span className="transition-transform group-hover/link:translate-x-1">→</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
