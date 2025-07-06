"use client";

// src/components/shortcodes/Gist.tsx
// Blowfish Gist shortcode - Embed GitHub Gists

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface GistProps {
  // Positional parameters: username, gistId, filename
  children?: React.ReactNode;
  '0'?: string; // username
  '1'?: string; // gist ID
  '2'?: string; // filename (optional)
  // Named parameters (alternative)
  username?: string;
  gistId?: string;
  filename?: string;
}

interface GistData {
  files: { [key: string]: { content: string; language: string; filename: string } };
  description: string;
  html_url: string;
  owner: { login: string; avatar_url: string };
  created_at: string;
}

const Gist: React.FC<GistProps> = (props) => {
  // Extract parameters (support both positional and named)
  const username = props['0'] || props.username || '';
  const gistId = props['1'] || props.gistId || '';
  const filename = props['2'] || props.filename || '';
  
  const [gistData, setGistData] = useState<GistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGist = async () => {
      if (!username || !gistId) {
        setError('Username and Gist ID are required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`https://api.github.com/gists/${gistId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch gist: ${response.status} ${response.statusText}`);
        }

        const data: GistData = await response.json();
        setGistData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch gist');
      } finally {
        setLoading(false);
      }
    };

    fetchGist();
  }, [username, gistId]);

  if (loading) {
    return (
      <div className="my-6 p-6 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-neutral-300 dark:bg-neutral-600 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-32"></div>
            <div className="h-3 bg-neutral-300 dark:bg-neutral-600 rounded w-48"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-full"></div>
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-3/4"></div>
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !gistData) {
    return (
      <div className="my-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg dark:border-gray-700">
        <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Gist Error</span>
        </div>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error || 'Failed to load gist'}
        </p>
        <p className="mt-1 text-xs text-red-500 dark:text-red-500 font-mono">
          {username}/{gistId}{filename ? `#${filename}` : ''}
        </p>
      </div>
    );
  }

  // Filter files if filename is specified
  const filesToShow = filename 
    ? Object.values(gistData.files).filter(file => file.filename === filename)
    : Object.values(gistData.files);

  if (filesToShow.length === 0) {
    return (
      <div className="my-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg dark:border-gray-700">
        <div className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">File Not Found</span>
        </div>
        <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
          The file &quot;{filename}&quot; was not found in this gist.
        </p>
      </div>
    );
  }

  return (
    <div className="my-6 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden dark:border-gray-700">
      {/* Gist header */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Image 
            src={gistData.owner.avatar_url} 
            alt={gistData.owner.login}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {gistData.owner.login}
              </span>
              <span className="text-neutral-500 dark:text-neutral-400">/</span>
              <span className="font-mono text-sm text-primary-600 dark:text-primary-400">
                {gistId}
              </span>
            </div>
            {gistData.description && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {gistData.description}
              </p>
            )}
          </div>
        </div>
        <a
          href={gistData.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary dark:hover:text-primary-700 dark:hover:text-primary dark:hover:text-primary-300 transition-colors duration-200"
        >
          View on GitHub
        </a>
      </div>

      {/* Files */}
      <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
        {filesToShow.map((file) => (
          <div key={file.filename}>
            {/* File header */}
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 dark:bg-neutral-800">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-neutral-500 dark:text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span className="font-mono text-sm text-neutral-700 dark:text-neutral-300">
                  {file.filename}
                </span>
              </div>
              {file.language && (
                <span className="px-2 py-1 text-xs font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded">
                  {file.language}
                </span>
              )}
            </div>
            
            {/* File content */}
            <div className="relative">
              <pre className="overflow-x-auto bg-white dark:bg-neutral-900 p-4 text-sm dark:bg-gray-900">
                <code className={`language-${file.language?.toLowerCase() || 'text'}`}>
                  {file.content}
                </code>
              </pre>
              
              {/* Copy button */}
              <button
                onClick={() => navigator.clipboard?.writeText(file.content)}
                className="absolute top-2 right-2 p-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded text-neutral-600 dark:text-neutral-400 transition-colors duration-200"
                title="Copy code"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gist;
