// src/components/shortcodes/TwitterEmbed.tsx
"use client";

import { useState, useEffect } from 'react';
import { ExternalLink, Twitter } from 'lucide-react';

interface TwitterEmbedProps {
  user: string;
  id: string;
  theme?: 'light' | 'dark';
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function TwitterEmbed({
  user,
  id,
  theme = 'light',
  align = 'center',
  className = ''
}: TwitterEmbedProps) {
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const tweetUrl = `https://twitter.com/${user}/status/${id}`;
  
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto'
  }[align];

  useEffect(() => {
    // Try to load Twitter widgets script
    if (typeof window !== 'undefined' && !document.getElementById('twitter-widgets')) {
      const script = document.createElement('script');
      script.id = 'twitter-widgets';
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.onload = () => {
        // @ts-ignore
        if (window.twttr && window.twttr.widgets) {
          // @ts-ignore
          window.twttr.widgets.load();
          setEmbedLoaded(true);
        } else {
          setShowFallback(true);
        }
      };
      script.onerror = () => {
        setShowFallback(true);
      };
      document.head.appendChild(script);
    } else {
      // Script already loaded
      // @ts-ignore
      if (window.twttr && window.twttr.widgets) {
        // @ts-ignore
        window.twttr.widgets.load();
        setEmbedLoaded(true);
      } else {
        setShowFallback(true);
      }
    }

    // Fallback timeout
    const timer = setTimeout(() => {
      if (!embedLoaded) {
        setShowFallback(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [embedLoaded]);

  return (
    <div className={`max-w-lg mx-auto ${alignmentClass} ${className}`}>
      {!showFallback ? (
        <div className="relative">
          {/* Twitter embed container */}
          <blockquote 
            className="twitter-tweet" 
            data-theme={theme}
            data-dnt="true"
          >
            <p lang="en" dir="ltr">
              Loading tweet...
            </p>
            <a href={tweetUrl}>
              {new Date().toLocaleDateString()}
            </a>
          </blockquote>
          
          {/* Loading state */}
          {!embedLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border dark:bg-gray-800 dark:border-gray-700">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 dark:border-gray-700"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Loading tweet...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Fallback UI
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 max-w-lg dark:border-gray-700 dark:border-gray-600">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Twitter className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg dark:text-white">
                  Twitter/X Post
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm dark:text-gray-400">
                  @{user}
                </p>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 dark:text-gray-300">
                This tweet is hosted by Twitter. By viewing it, you agree to Twitter&apos;s privacy policy and terms of service.
              </p>
              
              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View on Twitter
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TwitterEmbed;
