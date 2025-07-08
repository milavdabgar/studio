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
  showDesktopSidebar?: boolean;
  showMobileToggle?: boolean;
}

export function TableOfContents({ 
  content, 
  className,
  showDesktopSidebar = true,
  showMobileToggle = true 
}: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Wait for DOM to be ready and PostRenderer to have added IDs
    const extractTocItems = () => {
      const headings = document.querySelectorAll('.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6');
      const items: TocItem[] = [];
      
      headings.forEach((heading) => {
        const level = parseInt(heading.tagName.charAt(1));
        const text = heading.textContent || '';
        let id = heading.id;
        
        // If no ID exists, generate one (as fallback)
        if (!id && text) {
          id = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
          
          // Ensure uniqueness by checking if ID already exists
          let counter = 1;
          let uniqueId = id;
          while (document.getElementById(uniqueId)) {
            uniqueId = `${id}-${counter}`;
            counter++;
          }
          
          heading.id = uniqueId;
          id = uniqueId;
        }
        
        if (id && level <= 4) { // Only include h1-h4 in TOC
          items.push({ id, text, level });
        }
      });
      
      console.log('TableOfContents: extracted items:', items.length, items);
      setTocItems(items);
    };

    // Use multiple timing strategies to ensure we catch the content
    const timeouts = [100, 300, 500, 1000, 2000]; // Try at different intervals
    
    timeouts.forEach((delay) => {
      setTimeout(extractTocItems, delay);
    });

    // Also try on content change
    extractTocItems();
    
    // Debug logging
    console.log('TableOfContents: content length:', content.length);
    setTimeout(() => {
      console.log('TableOfContents: found headings in prose:', document.querySelectorAll('.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6').length);
    }, 1000);
  }, [content]);

  useEffect(() => {
    if (typeof window === 'undefined' || tocItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log('TableOfContents: Setting active:', entry.target.id);
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
      }
    );

    // Wait a bit for DOM to settle, then observe headings
    setTimeout(() => {
      tocItems.forEach((item) => {
        const element = document.getElementById(item.id);
        if (element) {
          console.log('TableOfContents: Observing element:', item.id, element);
          observer.observe(element);
        } else {
          console.log('TableOfContents: Could not find element to observe:', item.id);
        }
      });
    }, 100);

    return () => {
      console.log('TableOfContents: Disconnecting observer');
      observer.disconnect();
    };
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    console.log('TableOfContents: Attempting to scroll to:', id);
    const element = document.getElementById(id);
    if (element) {
      console.log('TableOfContents: Found element, scrolling to:', element);
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsOpen(false); // Close mobile TOC after clicking
      
      // Update active state manually for immediate feedback
      setActiveId(id);
    } else {
      console.log('TableOfContents: Element not found for id:', id);
      // Fallback: try to find by text content
      const headings = document.querySelectorAll('.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6');
      const targetItem = tocItems.find(item => item.id === id);
      if (targetItem) {
        const matchingHeading = Array.from(headings).find(h => h.textContent?.trim() === targetItem.text);
        if (matchingHeading) {
          console.log('TableOfContents: Found by text content, scrolling to:', matchingHeading);
          matchingHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setIsOpen(false);
          setActiveId(id);
        }
      }
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile TOC Toggle Button */}
      {showMobileToggle && (
        <div className="fixed bottom-4 right-4 z-50 lg:hidden">
          <Button
            onClick={() => setIsOpen(true)}
            size="icon"
            className="rounded-full shadow-lg bg-primary hover:bg-primary/90"
            aria-label="Open table of contents"
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Mobile TOC Overlay */}
      {showMobileToggle && isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-x-4 top-4 bottom-4 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between shrink-0">
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
              <CardContent className="flex-1 overflow-y-auto">
                <nav className="space-y-2">
                  {tocItems.map((item, index) => (
                    <button
                      key={`mobile-toc-${item.id}-${index}`}
                      onClick={() => scrollToHeading(item.id)}
                      className={cn(
                        'block w-full text-left text-sm hover:text-primary dark:hover:text-primary transition-colors py-2 px-2 rounded-md',
                        activeId === item.id ? 'text-primary font-medium bg-primary/10' : 'text-muted-foreground',
                        item.level === 1 && 'font-semibold',
                        item.level === 2 && 'pl-6',
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
      {showDesktopSidebar && (
        <Card className={cn('hidden lg:block sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto', className)}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <List className="h-4 w-4" />
              Table of Contents
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <nav className="space-y-1">
              {tocItems.map((item, index) => (
                <button
                  key={`desktop-toc-${item.id}-${index}`}
                  onClick={() => scrollToHeading(item.id)}
                  className={cn(
                    'group flex items-start w-full text-left text-sm hover:text-primary dark:hover:text-primary transition-colors py-1.5 px-2 rounded-md leading-tight',
                    activeId === item.id ? 'text-primary font-medium bg-primary/10' : 'text-muted-foreground',
                    item.level === 1 && 'font-semibold',
                    item.level === 2 && 'pl-6',
                    item.level === 3 && 'pl-10',
                    item.level === 4 && 'pl-14'
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
      )}
    </>
  );
}
