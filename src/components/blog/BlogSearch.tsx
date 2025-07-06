// src/components/blog/BlogSearch.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, FileText, Tag, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface SearchResult {
  type: 'post' | 'category' | 'tag';
  title: string;
  slug: string;
  excerpt?: string;
  tags?: string[];
  category?: string;
  date?: string;
  lang: string;
  score: number;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  error?: string;
}

interface BlogSearchProps {
  currentLang: string;
}

export function BlogSearch({ currentLang }: BlogSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Search function using the API route
  const performSearch = useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
    if (!searchQuery.trim()) return [];
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&lang=${currentLang}&limit=8`);
      const data: SearchResponse = await response.json();
      
      if (data.error) {
        console.error('Search API error:', data.error);
        return [];
      }
      
      return data.results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }, [currentLang]);

  useEffect(() => {
    const handleSearch = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await performSearch(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, performSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      inputRef.current?.focus();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <FileText className="h-4 w-4" />;
      case 'category':
        return <Folder className="h-4 w-4" />;
      case 'tag':
        return <Tag className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getResultUrl = (result: SearchResult) => {
    switch (result.type) {
      case 'post':
        return `/posts/${result.lang}/${result.slug}`;
      case 'category':
        return `/categories/${result.lang}/${result.slug}`;
      case 'tag':
        return `/tags/${result.lang}/${result.slug}`;
      default:
        return `/posts/${result.lang}`;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    router.push(getResultUrl(result));
  };

  return (
    <div className="relative" ref={searchRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Search"
        onClick={() => setIsOpen(!isOpen)}
        className={isOpen ? "bg-accent" : ""}
      >
        <Search className="h-[1.2rem] w-[1.2rem]" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[90vw] z-50">
          <Card className="shadow-lg border dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={currentLang === 'gu' ? 'શોધો...' : 'Search...'}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-0 focus-visible:ring-0 px-0 dark:border-gray-700"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isLoading && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  {currentLang === 'gu' ? 'શોધી રહ્યું છે...' : 'Searching...'}
                </div>
              )}

              {!isLoading && query.length >= 2 && results.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  {currentLang === 'gu' ? 'કોઈ પરિણામ મળ્યું નથી' : 'No results found'}
                </div>
              )}

              {!isLoading && results.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-muted-foreground mt-1">
                          {getResultIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {result.title}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {result.type}
                            </Badge>
                          </div>
                          {result.excerpt && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {result.excerpt}
                            </p>
                          )}
                          {result.tags && result.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {result.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {query.length < 2 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  {currentLang === 'gu' 
                    ? 'શોધવા માટે ઓછામાં ઓછા 2 અક્ષરો લખો'
                    : 'Type at least 2 characters to search'
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
