// src/components/shortcodes/TwitterEmbed.tsx
"use client";

import { useState } from 'react';
import { ExternalLink, Twitter } from 'lucide-react';

interface TwitterEmbedProps {
  user: string;
  id: string;
  theme?: 'light' | 'dark';
  lang?: string;
  width?: number;
  height?: number;
  cards?: 'hidden' | 'visible';
  conversation?: 'none' | 'all';
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function TwitterEmbed({
  user,
  id,
  theme = 'light',
  lang = 'en',
  width = 550,
  height,
  cards = 'visible',
  conversation = 'all',
  align = 'center',
  className = ''
}: TwitterEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const tweetUrl = `https://twitter.com/${user}/status/${id}`;
  
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto'
  }[align];

  // Build embed parameters
  const params = new URLSearchParams({
    url: tweetUrl,
    theme,
    lang,
    width: width.toString(),
    ...(height && { height: height.toString() }),
    hide_media: cards === 'hidden' ? 'true' : 'false',
    conversation: conversation,
    chrome: 'nofooter',
    dnt: 'true' // Do not track
  });

  const embedUrl = `https://platform.twitter.com/embed/Tweet.html?${params}`;

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  if (hasError) {
    return (
      <div className={`border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-800 ${alignmentClass} ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <Twitter className="h-12 w-12 text-blue-400" />
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Unable to load tweet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This tweet might be deleted, private, or there might be a network issue.
            </p>
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              View on Twitter
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${alignmentClass} ${className}`}>
      <div className="relative">
        {!isLoaded && (
          <div 
            className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border"
            style={{ width, height: height || 400 }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Loading tweet...</span>
            </div>
          </div>
        )}
        
        <iframe
          src={embedUrl}
          width={width}
          height={height || 400}
          className={`border-0 rounded-lg ${!isLoaded ? 'absolute opacity-0' : ''}`}
          scrolling="no"
          allowTransparency
          onLoad={handleLoad}
          onError={handleError}
          title={`Tweet by @${user}`}
        />
      </div>
      
      {/* Fallback link */}
      <div className="mt-2 text-center">
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          View original tweet
        </a>
      </div>
    </div>
  );
}

export default TwitterEmbed;
