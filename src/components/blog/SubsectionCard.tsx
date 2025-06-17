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
    <Card className="hover:shadow-lg transition-shadow group">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <Folder className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">
              <Link 
                href={`/posts/${lang}/${slug}`}
                className="text-primary hover:text-primary/80 transition-colors block"
              >
                {displayName}
              </Link>
            </CardTitle>
            <CardDescription className="mt-1">
              {description || itemText}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            {itemText}
          </Badge>
          <Link 
            href={`/posts/${lang}/${slug}`}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {lang === 'gu' ? 'જુઓ →' : 'View →'}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
