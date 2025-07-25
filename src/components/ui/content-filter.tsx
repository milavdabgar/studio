// src/components/ui/content-filter.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Filter, Search, FileText, Image, File } from 'lucide-react';

interface FilterOptions {
  tags: { name: string; count: number }[];
  categories: { name: string; count: number }[];
  fileTypes: string[];
}

interface ActiveFilters {
  type: string;
  fileType?: string;
  tags: string[];
  categories: string[];
  author?: string;
  sortBy: string;
  sortOrder: string;
}

interface ContentFilterProps {
  lang: string;
  onFilterChange: (filters: ActiveFilters) => void;
  availableFilters?: FilterOptions;
  showFileTypeFilter?: boolean;
  className?: string;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  'pdf': <FileText className="h-4 w-4 text-red-500" />,
  'docx': <FileText className="h-4 w-4 text-blue-500" />,
  'pptx': <FileText className="h-4 w-4 text-orange-500" />,
  'xlsx': <FileText className="h-4 w-4 text-green-500" />,
  'image': <Image className="h-4 w-4 text-purple-500" />,
  'default': <File className="h-4 w-4 text-gray-500" />,
};

export function ContentFilter({ 
  lang, 
  onFilterChange, 
  availableFilters,
  showFileTypeFilter = true,
  className = ''
}: ContentFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<ActiveFilters>({
    type: 'all',
    tags: [],
    categories: [],
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const [searchAuthor, setSearchAuthor] = useState('');

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleTypeChange = (type: string) => {
    setFilters(prev => ({ ...prev, type }));
  };

  const handleFileTypeChange = (fileType: string) => {
    setFilters(prev => ({ 
      ...prev, 
      fileType: fileType === 'all' ? undefined : fileType 
    }));
  };

  const handleTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({ ...prev, sortBy }));
  };

  const handleSortOrderChange = (sortOrder: string) => {
    setFilters(prev => ({ ...prev, sortOrder }));
  };

  const handleAuthorSearch = () => {
    setFilters(prev => ({ 
      ...prev, 
      author: searchAuthor.trim() || undefined 
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      tags: [],
      categories: [],
      sortBy: 'date',
      sortOrder: 'desc',
    });
    setSearchAuthor('');
  };

  const activeFilterCount = 
    (filters.fileType ? 1 : 0) +
    filters.tags.length +
    filters.categories.length +
    (filters.author ? 1 : 0) +
    (filters.type !== 'all' ? 1 : 0);

  return (
    <Card className={`mb-6 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {lang === 'gu' ? 'ફિલ્ટર' : 'Filters'}
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                {lang === 'gu' ? 'સાફ કરો' : 'Clear All'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Less' : 'More'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Basic Filters - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Content Type Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {lang === 'gu' ? 'પ્રકાર' : 'Content Type'}
            </label>
            <Select value={filters.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'gu' ? 'બધું' : 'All'}</SelectItem>
                <SelectItem value="posts">{lang === 'gu' ? 'પોસ્ટ્સ' : 'Posts'}</SelectItem>
                <SelectItem value="files">{lang === 'gu' ? 'ફાઇલો' : 'Files'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Type Filter */}
          {showFileTypeFilter && (filters.type === 'files' || filters.type === 'all') && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                {lang === 'gu' ? 'ફાઇલ પ્રકાર' : 'File Type'}
              </label>
              <Select 
                value={filters.fileType || 'all'} 
                onValueChange={handleFileTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{lang === 'gu' ? 'બધા' : 'All Files'}</SelectItem>
                  {availableFilters?.fileTypes.map(fileType => (
                    <SelectItem key={fileType} value={fileType}>
                      <div className="flex items-center gap-2">
                        {fileTypeIcons[fileType] || fileTypeIcons.default}
                        {fileType.toUpperCase()}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sort Options */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {lang === 'gu' ? 'ક્રમ' : 'Sort By'}
            </label>
            <div className="flex gap-2">
              <Select value={filters.sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">{lang === 'gu' ? 'તારીખ' : 'Date'}</SelectItem>
                  <SelectItem value="title">{lang === 'gu' ? 'શીર્ષક' : 'Title'}</SelectItem>
                  <SelectItem value="author">{lang === 'gu' ? 'લેખક' : 'Author'}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.sortOrder} onValueChange={handleSortOrderChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">↓</SelectItem>
                  <SelectItem value="asc">↑</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Advanced Filters - Expandable */}
        {isExpanded && (
          <div className="border-t pt-4 space-y-4">
            {/* Author Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {lang === 'gu' ? 'લેખક શોધો' : 'Search Author'}
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder={lang === 'gu' ? 'લેખકનું નામ લખો' : 'Enter author name'}
                  value={searchAuthor}
                  onChange={(e) => setSearchAuthor(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAuthorSearch()}
                />
                <Button onClick={handleAuthorSearch} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tags Filter */}
            {availableFilters?.tags && availableFilters.tags.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {lang === 'gu' ? 'ટેગ્સ' : 'Tags'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableFilters.tags.slice(0, 15).map(tag => (
                    <Button
                      key={tag.name}
                      variant={filters.tags.includes(tag.name) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTagToggle(tag.name)}
                      className="text-xs"
                    >
                      {tag.name}
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {tag.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Filter */}
            {availableFilters?.categories && availableFilters.categories.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {lang === 'gu' ? 'શ્રેણીઓ' : 'Categories'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableFilters.categories.slice(0, 10).map(category => (
                    <Button
                      key={category.name}
                      variant={filters.categories.includes(category.name) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCategoryToggle(category.name)}
                      className="text-xs"
                    >
                      {category.name}
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {category.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex flex-wrap gap-2">
              {filters.type !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Type: {filters.type}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleTypeChange('all')}
                  />
                </Badge>
              )}
              {filters.fileType && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  File: {filters.fileType}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFileTypeChange('all')}
                  />
                </Badge>
              )}
              {filters.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  Tag: {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleTagToggle(tag)}
                  />
                </Badge>
              ))}
              {filters.categories.map(category => (
                <Badge key={category} variant="secondary" className="flex items-center gap-1">
                  Category: {category}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleCategoryToggle(category)}
                  />
                </Badge>
              ))}
              {filters.author && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Author: {filters.author}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters(prev => ({ ...prev, author: undefined }))}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}