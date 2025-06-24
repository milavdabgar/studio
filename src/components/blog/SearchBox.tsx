// src/components/blog/SearchBox.tsx
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { PostPreview } from '@/lib/types';
import { PostCard } from './PostCard';
import { Card, CardContent } from '@/components/ui/card';

interface SearchBoxProps {
  language: string;
  onResults?: (results: PostPreview[]) => void;
  showResults?: boolean;
  placeholder?: string;
}

export function SearchBox({ language, onResults, showResults = true, placeholder }: SearchBoxProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PostPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      onResults?.([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}&lang=${language}`);
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      const searchResults: PostPreview[] = await response.json();
      setResults(searchResults);
      onResults?.(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      onResults?.([]);
    } finally {
      setIsLoading(false);
    }
  }, [language, onResults]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    onResults?.([]);
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder || t('search_placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results */}
      {showResults && query.trim() && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {t('search_results_for')}: &quot;{query}&quot;
            </h3>
            <span className="text-sm text-muted-foreground">
              {isLoading ? t('loading') : `${results.length} results`}
            </span>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">{t('loading')}</p>
              </CardContent>
            </Card>
          ) : results.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">{t('no_results')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {results.map((post) => (
                <PostCard key={`${post.lang}-${post.id}`} post={post} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
