"use client";

// src/components/shortcodes/MDImporter.tsx
// Blowfish MDImporter shortcode - Import markdown from external URLs

import React, { useState, useEffect } from 'react';
// Import processMarkdownWithShortcodes from utils to avoid circular dependency
import { processMarkdownWithShortcodes } from '@/lib/utils/markdown-processor';

interface MDImporterProps {
  url: string;
  children?: React.ReactNode;
}

const MDImporter: React.FC<MDImporterProps> = ({ url }) => {
  const [content, setContent] = useState<React.ReactNode>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch markdown: ${response.status} ${response.statusText}`);
        }

        const markdownText = await response.text();
        
        // Process the markdown content with shortcodes
        const parsedContent = await processMarkdownWithShortcodes(markdownText);
        setContent(parsedContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch markdown');
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchMarkdown();
    }
  }, [url]);

  if (loading) {
    return (
      <div className="my-6 p-6 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-5 h-5 bg-neutral-300 dark:bg-neutral-600 rounded"></div>
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-48"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-full"></div>
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-3/4"></div>
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-1/2"></div>
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg dark:border-gray-700">
        <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Markdown Import Error</span>
        </div>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        <p className="mt-1 text-xs text-red-500 dark:text-red-500 font-mono break-all">{url}</p>
      </div>
    );
  }

  return (
    <div className="my-6">
      {/* Source indicator */}
      <div className="flex items-center space-x-2 mb-4 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm text-neutral-600 dark:text-neutral-400">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        <span>Imported from:</span>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-mono text-xs text-primary-600 dark:text-primary-400 hover:text-primary dark:hover:text-primary-700 dark:hover:text-primary dark:hover:text-primary-300 transition-colors duration-200 break-all"
        >
          {url}
        </a>
      </div>

      {/* Imported markdown content */}
      <div className="imported-markdown border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-900 dark:bg-gray-900 dark:border-gray-700">
        {content}
      </div>
    </div>
  );
};

export default MDImporter;
