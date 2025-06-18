// src/components/blog/TableOfContents.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { List, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

export function TableOfContents({ content, className }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Parse headings from content
    const headingRegex = /<h([1-6])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[1-6]>/gi;
    const items: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = parseInt(match[1]);
      const id = match[2];
      const text = match[3].replace(/<[^>]*>/g, ''); // Remove any HTML tags from text
      
      if (level <= 4) { // Only include h1-h4 in TOC
        items.push({ id, text, level });
      }
    }

    setTocItems(items);
  }, [content]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
      }
    );

    // Observe all headings
    tocItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsOpen(false); // Close mobile TOC after clicking
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile TOC Toggle Button */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="rounded-full shadow-lg"
          aria-label="Open table of contents"
        >
          <List className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile TOC Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-x-4 top-4 bottom-4 overflow-auto">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Table of Contents</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close table of contents"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  {tocItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToHeading(item.id)}
                      className={cn(
                        'block w-full text-left text-sm hover:text-primary transition-colors py-1',
                        activeId === item.id ? 'text-primary font-medium' : 'text-muted-foreground',
                        item.level === 1 && 'font-semibold',
                        item.level === 2 && 'pl-4',
                        item.level === 3 && 'pl-8',
                        item.level === 4 && 'pl-12'
                      )}
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Desktop TOC Sidebar */}
      <Card className={cn('hidden md:block sticky top-24 max-h-[calc(100vh-7rem)] overflow-auto', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <List className="h-4 w-4" />
            Table of Contents
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <nav className="space-y-2">
            {tocItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToHeading(item.id)}
                className={cn(
                  'group flex items-start w-full text-left text-sm hover:text-primary transition-colors py-1 leading-tight',
                  activeId === item.id ? 'text-primary font-medium' : 'text-muted-foreground',
                  item.level === 1 && 'font-semibold',
                  item.level === 2 && 'pl-4',
                  item.level === 3 && 'pl-8',
                  item.level === 4 && 'pl-12'
                )}
              >
                <ChevronRight className={cn(
                  'h-3 w-3 mt-0.5 flex-shrink-0 mr-1 transition-transform',
                  activeId === item.id ? 'rotate-90' : 'rotate-0'
                )} />
                <span className="break-words">{item.text}</span>
              </button>
            ))}
          </nav>
        </CardContent>
      </Card>
    </>
  );
}
