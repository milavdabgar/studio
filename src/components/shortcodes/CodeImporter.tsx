"use client";

// src/components/shortcodes/CodeImporter.tsx
// Blowfish CodeImporter shortcode - Import code from external URLs

import React, { useState, useEffect } from 'react';

interface CodeImporterProps {
  url: string;
  type?: string;
  startLine?: number | string;
  endLine?: number | string;
  children?: React.ReactNode;
}

const CodeImporter: React.FC<CodeImporterProps> = ({
  url,
  type = 'text',
  startLine,
  endLine
}) => {
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCode = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch code: ${response.status} ${response.statusText}`);
        }

        let content = await response.text();

        // Apply line filtering if specified
        if (startLine !== undefined || endLine !== undefined) {
          const lines = content.split('\n');
          const start = startLine ? (typeof startLine === 'string' ? parseInt(startLine) : startLine) - 1 : 0;
          const end = endLine ? (typeof endLine === 'string' ? parseInt(endLine) : endLine) : lines.length;
          
          content = lines.slice(start, end).join('\n');
        }

        setCode(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch code');
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchCode();
    }
  }, [url, startLine, endLine]);

  if (loading) {
    return (
      <div className="my-6 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-3 h-3 bg-neutral-300 dark:bg-neutral-600 rounded-full"></div>
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-48"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-full"></div>
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-3/4"></div>
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-1/2"></div>
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
          <span className="font-medium">Code Import Error</span>
        </div>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        <p className="mt-1 text-xs text-red-500 dark:text-red-500 font-mono break-all">{url}</p>
      </div>
    );
  }

  // Get language class for syntax highlighting
  const getLanguageClass = () => {
    if (!type) return '';
    return `language-${type}`;
  };

  return (
    <div className="my-6">
      {/* URL header */}
      <div className="flex items-center justify-between p-3 bg-neutral-100 dark:bg-neutral-800 rounded-t-lg border-b border-neutral-200 dark:border-neutral-700 dark:border-gray-700">
        <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="font-mono text-xs break-all">{url}</span>
        </div>
        {type && (
          <span className="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
            {type}
          </span>
        )}
      </div>

      {/* Code content */}
      <div className="relative">
        <pre className="!mt-0 !rounded-t-none overflow-x-auto bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-b-lg dark:border-gray-700">
          <code className={`${getLanguageClass()} block p-4 text-sm`}>
            {code}
          </code>
        </pre>
        
        {/* Copy button */}
        <button
          onClick={() => navigator.clipboard?.writeText(code)}
          className="absolute top-2 right-2 p-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded text-neutral-600 dark:text-neutral-400 transition-colors duration-200"
          title="Copy code"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CodeImporter;
