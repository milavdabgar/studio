"use client";

// src/components/shortcodes/BlowfishCarousel.tsx
// Blowfish Carousel shortcode - Image carousel with auto-scroll and aspect ratios

import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface BlowfishCarouselProps {
  images?: string | string[];
  aspectRatio?: '16-9' | '21-9' | '32-9';
  interval?: number | string;
  // Support both positional and named parameters
  children?: React.ReactNode;
}

const BlowfishCarousel: React.FC<BlowfishCarouselProps> = ({
  images = '',
  aspectRatio = '16-9',
  interval = 2000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageList, setImageList] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);

  // Parse images parameter
  useEffect(() => {
    let parsedImages: string[] = [];

    if (typeof images === 'string') {
      if (images.includes('{') && images.includes('}')) {
        // Parse comma-separated list in braces: {img1.jpg,img2.jpg,img3.jpg}
        const cleaned = images.replace(/[{}]/g, '');
        parsedImages = cleaned.split(',').map(img => img.trim()).filter(img => img);
      } else if (images.includes('*')) {
        // Handle regex pattern like "gallery/*"
        // For now, we'll assume a basic gallery pattern
        const basePattern = images.replace('*', '');
        // Generate some example images for the pattern
        parsedImages = [
          `${basePattern}01.jpg`,
          `${basePattern}02.jpg`,
          `${basePattern}03.jpg`,
          `${basePattern}04.jpg`,
          `${basePattern}05.jpg`,
        ];
      } else {
        // Single image
        parsedImages = [images];
      }
    } else if (Array.isArray(images)) {
      parsedImages = images;
    }

    // Use content-images API for local images
    parsedImages = parsedImages.map(img => {
      if (img.startsWith('http') || img.startsWith('/api/')) return img; // Keep external URLs and API routes
      
      // For relative paths, use content-images API
      if (!img.startsWith('/')) {
        return `/api/content-images/development/shortcodes/${img}`;
      }
      
      // For absolute paths, use content-images API
      return `/api/content-images${img}`;
    });

    setImageList(parsedImages);
  }, [images]);

  // Auto-scroll functionality
  useEffect(() => {
    if (!isPlaying || imageList.length <= 1) return;

    const intervalMs = typeof interval === 'string' ? parseInt(interval) : interval;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % imageList.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [interval, isPlaying, imageList.length]);

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 1) % imageList.length);
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev - 1 + imageList.length) % imageList.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Get aspect ratio classes
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '21-9':
        return 'aspect-[21/9]';
      case '32-9':
        return 'aspect-[32/9]';
      case '16-9':
      default:
        return 'aspect-video'; // 16:9
    }
  };

  if (imageList.length === 0) {
    return (
      <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-lg p-8 text-center text-neutral-500 dark:text-neutral-400">
        No images provided for carousel
      </div>
    );
  }

  return (
    <div className="relative w-full my-6">
      {/* Main carousel container */}
      <div className={`relative w-full overflow-hidden rounded-lg ${getAspectRatioClass()}`}>
        {/* Images */}
        <div 
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {imageList.map((image, index) => (
            <div key={index} className="w-full h-full flex-shrink-0 relative">
              <Image
                src={image}
                alt={`Carousel image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized
              />
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        {imageList.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors duration-200"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors duration-200"
              aria-label="Next image"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Play/Pause button */}
        {imageList.length > 1 && (
          <button
            onClick={togglePlayPause}
            className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors duration-200"
            aria-label={isPlaying ? 'Pause carousel' : 'Play carousel'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 4h2v12H6V4zm6 0h2v12h-2V4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 5v10l6-5-6-5z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Dots indicator */}
      {imageList.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {imageList.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                index === currentIndex 
                  ? 'bg-primary-600 dark:bg-primary-400' 
                  : 'bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-500'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BlowfishCarousel;
