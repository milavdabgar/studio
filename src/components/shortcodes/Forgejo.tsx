"use client";

// src/components/shortcodes/Forgejo.tsx
// Blowfish Forgejo shortcode - Display Forgejo repository information

import React, { useState, useEffect } from 'react';

interface ForgejoProps {
  repo: string;
  server: string;
  children?: React.ReactNode;
}

interface ForgejoRepo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stars_count: number;
  forks_count: number;
  language: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

const Forgejo: React.FC<ForgejoProps> = ({ repo, server }) => {
  const [repoData, setRepoData] = useState<ForgejoRepo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepo = async () => {
      if (!repo || !server) {
        setError('Repository name and server URL are required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Forgejo uses Gitea-compatible API
        const apiUrl = `${server.replace(/\/$/, '')}/api/v1/repos/${repo}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch repository: ${response.status} ${response.statusText}`);
        }

        const data: ForgejoRepo = await response.json();
        setRepoData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch repository');
      } finally {
        setLoading(false);
      }
    };

    fetchRepo();
  }, [repo, server]);

  if (loading) {
    return (
      <div className="my-6 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-neutral-300 dark:bg-neutral-600 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-48"></div>
            <div className="h-3 bg-neutral-300 dark:bg-neutral-600 rounded w-32"></div>
          </div>
        </div>
        <div className="flex space-x-4">
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-16"></div>
          <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-16"></div>
        </div>
      </div>
    );
  }

  if (error || !repoData) {
    return (
      <div className="my-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg dark:border-gray-700">
        <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Forgejo Error</span>
        </div>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error || 'Failed to load repository'}
        </p>
        <p className="mt-1 text-xs text-red-500 dark:text-red-500 font-mono">{server}/{repo}</p>
      </div>
    );
  }

  const serverName = server.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div className="my-6">
      <a
        href={repoData.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 transition-colors duration-200 group dark:bg-gray-900 dark:border-gray-700"
      >
        <div className="flex items-start space-x-3">
          {/* Forgejo logo */}
          <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 10 5.16-.261 9-4.45 9-10V7l-10-5z"/>
            </svg>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Repository name */}
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-primary dark:hover:text-primary-600 dark:group-hover:text-primary dark:hover:text-primary-400 transition-colors duration-200">
                {repoData.name}
              </h3>
              <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded dark:bg-orange-900/30">
                Forgejo
              </span>
            </div>
            
            {/* Server and owner */}
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              {repoData.owner.login} • {serverName}
            </p>
            
            {/* Description */}
            {repoData.description && (
              <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-3 line-clamp-2">
                {repoData.description}
              </p>
            )}
            
            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm text-neutral-600 dark:text-neutral-400">
              {/* Stars */}
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{repoData.stars_count}</span>
              </div>
              
              {/* Forks */}
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{repoData.forks_count}</span>
              </div>
              
              {/* Language */}
              {repoData.language && (
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>{repoData.language}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* External link icon */}
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-neutral-400 group-hover:text-primary dark:hover:text-primary-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      </a>
    </div>
  );
};

export default Forgejo;
