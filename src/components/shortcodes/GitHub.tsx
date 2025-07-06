// src/components/shortcodes/GitHub.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Icon } from './Icon';

interface GitHubProps {
  repo: string;
  showThumbnail?: boolean;
}

interface GitHubData {
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  owner: {
    login: string;
  };
}

export function GitHub({ repo, showThumbnail = true }: GitHubProps) {
  const [githubData, setGithubData] = useState<GitHubData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGitHubData = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${repo}`);
        const data = await response.json();
        setGithubData(data);
      } catch (error) {
        console.error('Failed to fetch GitHub data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubData();
  }, [repo]);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-md"></div>;
  }

  if (!githubData) {
    return <div className="text-red-500">Failed to load repository data</div>;
  }

  const githubThumbnailURL = `https://opengraph.githubassets.com/0/${repo}`;
  const languageColor = getLanguageColor(githubData.language);

  return (
    <div className="github-card-wrapper">
      <a target="_blank" href={githubData.html_url} className="cursor-pointer">
        <div className="w-full md:w-auto p-0 m-0 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-2xl dark:border-gray-700">
          {showThumbnail && (
            <div className="w-full nozoom">
              <Image
                src={githubThumbnailURL}
                alt="GitHub Repository Thumbnail"
                width={600}
                height={315}
                className="nozoom mt-0 mb-0 w-full h-full object-cover"
              />
            </div>
          )}

          <div className="w-full md:w-auto pt-3 p-5">
            <div className="flex items-center">
              <span className="text-2xl text-neutral-800 dark:text-neutral margin-right-[10px]">
                <Icon name="github" />
              </span>
              <div className="m-0 font-bold text-xl text-neutral-800 decoration-primary-500 hover:underline hover:underline-offset-2 dark:text-neutral">
                {githubData.full_name}
              </div>
            </div>

            <p className="m-0 mt-2 text-md text-neutral-800 dark:text-neutral">
              {githubData.description}
            </p>

            <div className="m-0 mt-2 flex items-center">
              <span
                className="mr-1 inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: languageColor }}
              ></span>
              <span className="text-md text-neutral-800 dark:text-neutral mr-4">
                {githubData.language}
              </span>
              <span className="text-md text-neutral-800 dark:text-neutral mr-4">
                ⭐ {githubData.stargazers_count}
              </span>
              <span className="text-md text-neutral-800 dark:text-neutral">
                🍴 {githubData.forks_count}
              </span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}

function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    JavaScript: '#f1e05a',
    TypeScript: '#2b7489',
    Python: '#3572A5',
    Java: '#b07219',
    'C++': '#f34b7d',
    'C#': '#239120',
    PHP: '#4F5D95',
    Ruby: '#701516',
    Go: '#00ADD8',
    Rust: '#dea584',
    Swift: '#ffac45',
    Kotlin: '#F18E33',
    Dart: '#00B4AB',
    HTML: '#e34c26',
    CSS: '#1572B6'
  };
  
  return colors[language] || '#6b7280';
}

export default GitHub;
