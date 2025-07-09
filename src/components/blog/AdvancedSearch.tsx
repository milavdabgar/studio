// src/components/blog/AdvancedSearch.tsx
"use client";

import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Search, X, Filter, Calendar, User, Tag, Folder } from 'lucide-react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { PostPreview } from '@/lib/types';
import { PostCard } from './PostCard';
import { Pagination, PaginationInfo } from '@/components/ui/pagination';

interface AdvancedSearchProps {
  language: string;
  placeholder?: string;
  showResults?: boolean;
  initialQuery?: string;
}

interface SearchFilters {
  query: string;
  category: string;
  tag: string;
  author: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResults {
  posts: PostPreview[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  filters: {
    categories: string[];
    tags: string[];
    authors: string[];
  };
}

export function AdvancedSearch({ 
  language, 
  placeholder, 
  showResults = true, 
  initialQuery = '' 
}: AdvancedSearchProps) {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<SearchFilters>({
    query: initialQuery,
    category: '',
    tag: '',
    author: '',
    dateRange: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  const [results, setResults] = useState<SearchResults>({
    posts: [],
    totalResults: 0,
    currentPage: 1,
    totalPages: 0,
    filters: {
      categories: [],
      tags: [],
      authors: []
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const performSearch = useCallback(async (searchFilters: SearchFilters, page: number = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        ...searchFilters,
        lang: language,
        page: page.toString(),
        limit: '10'
      });

      const response = await fetch(`/api/search/advanced?${params}`);
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      
      const searchResults: SearchResults = await response.json();
      setResults(searchResults);
    } catch (error) {
      console.error('Advanced search error:', error);
      setResults({
        posts: [],
        totalResults: 0,
        currentPage: 1,
        totalPages: 0,
        filters: {
          categories: [],
          tags: [],
          authors: []
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    if (filters.query.trim() || filters.category || filters.tag || filters.author) {
      const timeoutId = setTimeout(() => {
        performSearch(filters);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setResults(prev => ({ ...prev, posts: [], totalResults: 0 }));
    }
  }, [filters, performSearch]);

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      tag: '',
      author: '',
      dateRange: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'sortBy' && key !== 'sortOrder' && value
  );


  return (
    <div className="w-full space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder || t('search_placeholder')}
          value={filters.query}
          onChange={(e) => updateFilter('query', e.target.value)}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-accent' : ''}
          >
            <Filter className="h-4 w-4" />
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {language === 'gu' ? 'વિગતવાર શોધ' : 'Advanced Filters'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  {language === 'gu' ? 'શ્રેણી' : 'Category'}
                </label>
                <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'gu' ? 'શ્રેણી પસંદ કરો' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{language === 'gu' ? 'બધી શ્રેણીઓ' : 'All categories'}</SelectItem>
                    {results.filters.categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tag Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {language === 'gu' ? 'ટેગ' : 'Tag'}
                </label>
                <Select value={filters.tag} onValueChange={(value) => updateFilter('tag', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'gu' ? 'ટેગ પસંદ કરો' : 'Select tag'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{language === 'gu' ? 'બધા ટેગ્સ' : 'All tags'}</SelectItem>
                    {results.filters.tags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Author Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {language === 'gu' ? 'લેખક' : 'Author'}
                </label>
                <Select value={filters.author} onValueChange={(value) => updateFilter('author', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'gu' ? 'લેખક પસંદ કરો' : 'Select author'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{language === 'gu' ? 'બધા લેખકો' : 'All authors'}</SelectItem>
                    {results.filters.authors.map((author) => (
                      <SelectItem key={author} value={author}>
                        {author}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {language === 'gu' ? 'તારીખ' : 'Date Range'}
                </label>
                <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'gu' ? 'તારીખ પસંદ કરો' : 'Select date range'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{language === 'gu' ? 'કોઈ પણ સમય' : 'Any time'}</SelectItem>
                    <SelectItem value="last-week">{language === 'gu' ? 'છેલ્લા અઠવાડિયે' : 'Last week'}</SelectItem>
                    <SelectItem value="last-month">{language === 'gu' ? 'છેલ્લા મહિને' : 'Last month'}</SelectItem>
                    <SelectItem value="last-year">{language === 'gu' ? 'છેલ્લા વર્ષે' : 'Last year'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === 'gu' ? 'ક્રમાંકન' : 'Sort by'}
                </label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">{language === 'gu' ? 'તારીખ' : 'Date'}</SelectItem>
                    <SelectItem value="title">{language === 'gu' ? 'શીર્ષક' : 'Title'}</SelectItem>
                    <SelectItem value="relevance">{language === 'gu' ? 'સંબંધિતતા' : 'Relevance'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === 'gu' ? 'ક્રમ' : 'Order'}
                </label>
                <Select value={filters.sortOrder} onValueChange={(value: 'asc' | 'desc') => updateFilter('sortOrder', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">{language === 'gu' ? 'ઉતરતા ક્રમમાં' : 'Descending'}</SelectItem>
                    <SelectItem value="asc">{language === 'gu' ? 'ચડતા ક્રમમાં' : 'Ascending'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="space-y-2">
                <Separator />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {language === 'gu' ? 'સક્રિય ફિલ્ટર્સ:' : 'Active filters:'}
                  </span>
                  {filters.category && (
                    <Badge variant="secondary" className="gap-1">
                      {language === 'gu' ? 'શ્રેણી' : 'Category'}: {filters.category}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updateFilter('category', '')} 
                      />
                    </Badge>
                  )}
                  {filters.tag && (
                    <Badge variant="secondary" className="gap-1">
                      {language === 'gu' ? 'ટેગ' : 'Tag'}: {filters.tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updateFilter('tag', '')} 
                      />
                    </Badge>
                  )}
                  {filters.author && (
                    <Badge variant="secondary" className="gap-1">
                      {language === 'gu' ? 'લેખક' : 'Author'}: {filters.author}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updateFilter('author', '')} 
                      />
                    </Badge>
                  )}
                  {filters.dateRange && (
                    <Badge variant="secondary" className="gap-1">
                      {language === 'gu' ? 'તારીખ' : 'Date'}: {filters.dateRange}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => updateFilter('dateRange', '')} 
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {showResults && (filters.query.trim() || hasActiveFilters) && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {language === 'gu' ? 'શોધ પરિણામો' : 'Search Results'}
            </h3>
            <span className="text-sm text-muted-foreground">
              {isLoading ? (language === 'gu' ? 'લોડ થઈ રહ્યું છે...' : 'Loading...') : 
               `${results.totalResults} ${language === 'gu' ? 'પરિણામો' : 'results'}`}
            </span>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {language === 'gu' ? 'લોડ થઈ રહ્યું છે...' : 'Loading...'}
                </p>
              </CardContent>
            </Card>
          ) : results.totalResults === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {language === 'gu' ? 'કોઈ પરિણામો મળ્યા નથી' : 'No results found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Pagination Info */}
              <PaginationInfo
                currentPage={results.currentPage}
                totalPages={results.totalPages}
                itemsPerPage={10}
                totalItems={results.totalResults}
              />

              {/* Results Grid */}
              <div className="grid gap-6">
                {results.posts.map((post) => (
                  <PostCard key={`${post.lang}-${post.id}`} post={post} />
                ))}
              </div>

              {/* Pagination Controls */}
              {results.totalPages > 1 && (
                <Pagination
                  currentPage={results.currentPage}
                  totalPages={results.totalPages}
                  baseUrl={`/search/${language}`}
                  className="mt-8"
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
