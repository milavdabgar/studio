// src/components/shortcodes/YouTube.tsx
"use client";

import { useState } from 'react';
import { Play, Shield } from 'lucide-react';

interface YouTubeProps {
  id: string;
  title?: string;
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
  start?: number;
  end?: number;
  privacy?: boolean; // Enhanced privacy mode
  className?: string;
}

export function YouTube({
  id,
  title = "YouTube video",
  autoplay = false,
  mute = false,
  loop = false,
  start,
  end,
  privacy = true,
  className = ""
}: YouTubeProps) {
  const [isPrivacyAccepted, setIsPrivacyAccepted] = useState(!privacy);
  const [isLoading, setIsLoading] = useState(false);

  // Build YouTube URL parameters
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    ...(autoplay && { autoplay: '1' }),
    ...(mute && { mute: '1' }),
    ...(loop && { loop: '1', playlist: id }),
    ...(start && { start: start.toString() }),
    ...(end && { end: end.toString() }),
  });

  const domain = privacy ? 'youtube-nocookie.com' : 'youtube.com';
  const embedUrl = `https://www.${domain}/embed/${id}?${params}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;

  const handlePrivacyAccept = () => {
    setIsLoading(true);
    setIsPrivacyAccepted(true);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (!isPrivacyAccepted) {
    return (
      <div className={`relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden w-full max-w-xl sm:max-w-2xl mx-auto ${className}`}>
        <div 
          className="relative aspect-video bg-cover bg-center"
          style={{ backgroundImage: `url(${thumbnailUrl})` }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          
          {/* Privacy notice */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white text-center">
            <Shield className="h-12 w-12 mb-4 text-blue-400" />
            <h3 className="text-lg font-semibold mb-2">Privacy Enhanced Mode</h3>
            <p className="text-sm mb-4 max-w-md">
              This video is hosted by YouTube. By watching it, you agree to YouTube&apos;s privacy policy and terms of service.
            </p>
            <button
              onClick={handlePrivacyAccept}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Play className="h-5 w-5" />
              Load Video
            </button>
          </div>
        </div>
        
        {/* Video title */}
        <div className="p-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 dark:text-white">{title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">YouTube Video</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden w-full max-w-xl sm:max-w-2xl mx-auto ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10 dark:bg-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 dark:border-gray-700"></div>
        </div>
      )}
      
      <iframe
        src={embedUrl}
        title={title}
        className="w-full aspect-video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        onLoad={handleLoad}
      />
    </div>
  );
}

export default YouTube;
