// src/components/shortcodes/YouTubeLite.tsx
// Hugo Blowfish YouTubeLite shortcode - performance-optimized YouTube embeds
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { PlayIcon } from '@heroicons/react/24/solid';

interface YouTubeLiteProps {
  id: string; // YouTube video ID
  label?: string; // Accessible label for the video
  title?: string; // Video title
  thumbnail?: string; // Custom thumbnail URL
  autoplay?: boolean; // Whether to autoplay when clicked
  start?: number; // Start time in seconds
  end?: number; // End time in seconds
  className?: string;
}

export default function YouTubeLite({ 
  id,
  label = 'Play video',
  title = '',
  thumbnail,
  autoplay = true,
  start,
  end,
  className = ''
}: YouTubeLiteProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!id) {
    console.warn('YouTubeLite: Missing video ID');
    return null;
  }

  const getThumbnailUrl = () => {
    if (thumbnail) return thumbnail;
    return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  };

  const getEmbedUrl = () => {
    const params = new URLSearchParams();
    if (autoplay) params.append('autoplay', '1');
    if (start) params.append('start', start.toString());
    if (end) params.append('end', end.toString());
    
    const queryString = params.toString();
    return `https://www.youtube.com/embed/${id}${queryString ? `?${queryString}` : ''}`;
  };

  const handlePlay = () => {
    setIsLoaded(true);
  };

  const containerClasses = [
    'youtube-lite',
    'relative',
    'aspect-video',
    'bg-neutral-900',
    'rounded-lg',
    'overflow-hidden',
    'shadow-lg',
    className
  ].filter(Boolean).join(' ');

  if (isLoaded) {
    return (
      <div className={containerClasses}>
        <iframe
          src={getEmbedUrl()}
          title={title || label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <button
        onClick={handlePlay}
        className="relative w-full h-full group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
        aria-label={label}
      >
        {/* Thumbnail */}
        <Image
          src={getThumbnailUrl()}
          alt={title || 'Video thumbnail'}
          fill
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to default thumbnail
            const target = e.target as HTMLImageElement;
            target.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-colors" />
        
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-red-600 hover:bg-red-700 transition-colors rounded-full p-4 group-hover:scale-110 transform transition-transform">
            <PlayIcon className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
        
        {/* Title overlay */}
        {title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <h3 className="text-white text-sm font-medium truncate">
              {title}
            </h3>
          </div>
        )}
      </button>
    </div>
  );
}

// Named export for compatibility
export { YouTubeLite };
