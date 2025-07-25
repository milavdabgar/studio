// src/components/ui/filtered-content-display.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/blog/PostCard';
import { FileText, Download, ExternalLink, File, Image, FileSpreadsheet, Presentation, Loader2 } from 'lucide-react';

interface FilteredResult {
  type: 'post' | 'file';
  id: string;
  title: string;
  excerpt?: string;
  href: string;
  date?: string;
  lang: string;
  tags?: string[];
  categories?: string[];
  author?: string;
  contentType?: string;
  extension?: string;
  relativePath?: string;
  isBrowserViewable?: boolean;
  requiresDownload?: boolean;
  featured?: boolean | string;
}

interface FilteredContentDisplayProps {
  filters: any;
  lang: string;
  className?: string;
}

// File card component for displaying individual files
function FileCard({ file, lang }: { file: FilteredResult; lang: string }) {
  const displayName = file.title.replace(/\.(en|gu)\./, '.').replace(/-/g, ' ');
  
  const getFileIcon = (contentType: string) => {
    switch (contentType?.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'pptx':
        return <Presentation className="h-8 w-8 text-orange-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
      case 'image':
        return <Image className="h-8 w-8 text-purple-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };
  
  const getContentTypeLabel = (contentType: string) => {
    switch (contentType?.toLowerCase()) {
      case 'pdf':
        return 'PDF';
      case 'docx':
        return lang === 'gu' ? 'વર્ડ ડોક્યુમેન્ટ' : 'Word Document';
      case 'pptx':
        return lang === 'gu' ? 'પ્રેઝન્ટેશન' : 'Presentation';
      case 'xlsx':
        return lang === 'gu' ? 'સ્પ્રેડશીટ' : 'Spreadsheet';
      case 'image':
        return lang === 'gu' ? 'છબી' : 'Image';
      default:
        return lang === 'gu' ? 'ફાઇલ' : 'File';
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-3">
          {getFileIcon(file.contentType || '')}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {displayName}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {getContentTypeLabel(file.contentType || '')}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          {file.requiresDownload ? (
            <a
              href={file.href}
              download
              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Download className="h-3 w-3 mr-1" />
              {lang === 'gu' ? 'ડાઉનલોડ' : 'Download'}
            </a>
          ) : (
            <a
              href={file.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {lang === 'gu' ? 'જુઓ' : 'View'}
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function FilteredContentDisplay({ filters, lang, className = '' }: FilteredContentDisplayProps) {
  const [results, setResults] = useState<FilteredResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasMore: false,
  });

  const fetchResults = useCallback(async (loadMore = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        lang,
        type: filters.type || 'all',
        sortBy: filters.sortBy || 'date',
        sortOrder: filters.sortOrder || 'desc',
        limit: '20',
        offset: loadMore ? (pagination.currentPage * 20).toString() : '0',
      });

      if (filters.fileType) params.append('fileType', filters.fileType);
      if (filters.tags?.length > 0) params.append('tags', filters.tags.join(','));
      if (filters.categories?.length > 0) params.append('categories', filters.categories.join(','));
      if (filters.author) params.append('author', filters.author);

      const response = await fetch(`/api/filter?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch filtered content');
      }

      if (loadMore) {
        setResults(prev => [...prev, ...data.results]);
      } else {
        setResults(data.results);
      }

      setPagination({
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        total: data.total,
        hasMore: data.hasMore,
      });

    } catch (err) {
      console.error('Error fetching filtered results:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters, lang, pagination.currentPage]);

  useEffect(() => {
    fetchResults();
  }, [filters, lang]); // Don't include fetchResults to avoid infinite loop

  const loadMore = () => {
    fetchResults(true);
  };

  const posts = results.filter(result => result.type === 'post');
  const files = results.filter(result => result.type === 'file');

  if (loading && results.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            {lang === 'gu' ? 'લોડ થઈ રહ્યું છે...' : 'Loading filtered content...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <p className="text-red-500 mb-4">
            {lang === 'gu' ? 'એરર આવ્યો છે' : 'Error loading content'}
          </p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            onClick={() => fetchResults()} 
            className="mt-4"
            variant="outline"
          >
            {lang === 'gu' ? 'ફરી પ્રયાસ કરો' : 'Try Again'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {lang === 'gu' 
              ? 'આ ફિલ્ટર સાથે કોઈ સામગ્રી મળી નથી' 
              : 'No content found with the current filters'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Results Summary */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {lang === 'gu' 
            ? `કુલ ${pagination.total} પરિણામો મળ્યા`
            : `Found ${pagination.total} results`
          }
          {posts.length > 0 && files.length > 0 && (
            <span className="ml-2">
              ({posts.length} {lang === 'gu' ? 'પોસ્ટ્સ' : 'posts'}, {files.length} {lang === 'gu' ? 'ફાઇલો' : 'files'})
            </span>
          )}
        </p>
      </div>

      {/* Posts Section */}
      {posts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {lang === 'gu' ? 'પોસ્ટ્સ' : 'Posts'}
            <Badge variant="secondary">{posts.length}</Badge>
          </h3>
          <div className="grid gap-6">
            {posts.map((post) => (
              <PostCard 
                key={`${post.lang}-${post.id}`} 
                post={post as any} // Type assertion for compatibility
              />
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {lang === 'gu' ? 'ફાઇલો' : 'Files'}
            <Badge variant="secondary">{files.length}</Badge>
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {files.map((file) => (
              <FileCard key={file.id} file={file} lang={lang} />
            ))}
          </div>
        </div>
      )}

      {/* Load More Button */}
      {pagination.hasMore && (
        <div className="text-center">
          <Button 
            onClick={loadMore} 
            disabled={loading}
            variant="outline"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {lang === 'gu' ? 'લોડ થઈ રહ્યું છે...' : 'Loading...'}
              </>
            ) : (
              lang === 'gu' ? 'વધુ લોડ કરો' : 'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}