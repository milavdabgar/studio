// src/components/blog/SubsectionCard.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Folder, FileText } from 'lucide-react';
import Link from 'next/link';

interface SubsectionCardProps {
  name: string;
  slug: string;
  postCount: number;
  lang: string;
  description?: string;
}

export function SubsectionCard({ name, slug, postCount, lang, description }: SubsectionCardProps) {
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
    <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80 hover:scale-[1.02] dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary group-hover:from-primary group-hover:to-secondary group-hover:text-white transition-all duration-300 shadow-sm">
            <Folder className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-semibold">
              <Link
                href={`/posts/${lang}/${slug}`}
                className="text-primary hover:text-secondary transition-colors block group-hover:text-primary dark:hover:text-primary"
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
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs font-medium bg-gradient-to-r from-secondary/10 to-accent/10 text-secondary-foreground border-0 dark:border-gray-700">
            <FileText className="h-3 w-3 mr-1.5" />
            {itemText}
          </Badge>
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
