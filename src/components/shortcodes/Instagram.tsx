// src/components/shortcodes/Instagram.tsx
"use client";

import { useState } from 'react';
import { ExternalLink, Instagram as InstagramIcon } from 'lucide-react';

interface InstagramProps {
  id: string;
  caption?: boolean;
  hidecaption?: boolean;
  width?: number;
  className?: string;
}

export function Instagram({
  id,
  caption = true,
  hidecaption = false,
  width = 540,
  className = ''
}: InstagramProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const instagramUrl = `https://www.instagram.com/p/${id}/`;
  const embedUrl = `${instagramUrl}embed/captioned/`;

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  if (hasError) {
    return (
      <div className={`border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-800 text-center mx-auto ${className}`} style={{ maxWidth: width }}>
        <div className="flex flex-col items-center gap-4">
          <InstagramIcon className="h-12 w-12 text-pink-500" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 dark:text-white">
              Unable to load Instagram post
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 dark:text-gray-400">
              This post might be private, deleted, or there might be a network issue.
            </p>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-pink-600 dark:text-pink-400 hover:underline text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              View on Instagram
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-center mx-auto ${className}`} style={{ maxWidth: width }}>
      <div className="relative">
        {!isLoaded && (
          <div 
            className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
            style={{ width, height: 600 }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 dark:border-gray-700"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Loading Instagram post...</span>
            </div>
          </div>
        )}
        
        <iframe
          src={hidecaption ? instagramUrl + 'embed/' : embedUrl}
          width={width}
          height={caption && !hidecaption ? 840 : 600}
          className={`border-0 rounded-lg ${!isLoaded ? 'absolute opacity-0' : ''}`}
          scrolling="no"
          onLoad={handleLoad}
          onError={handleError}
          title={`Instagram post ${id}`}
        />
      </div>
      
      {/* Fallback link */}
      <div className="mt-2">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-pink-600 dark:hover:text-pink-400 inline-flex items-center gap-1 dark:text-gray-400"
        >
          <ExternalLink className="h-3 w-3" />
          View on Instagram
        </a>
      </div>
    </div>
  );
}

export default Instagram;
