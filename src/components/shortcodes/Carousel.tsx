// src/components/shortcodes/Carousel.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CarouselProps {
  images: string | string[];
  captions?: string | string[];
  height?: number;
  autoplay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
}

export function Carousel({
  images,
  captions,
  height = 400,
  autoplay = false,
  interval = 5000,
  showDots = true,
  showArrows = true,
  className = ''
}: CarouselProps) {
  // Parse images array and normalize paths
  const imageArray = Array.isArray(images) 
    ? images 
    : images.split(',').map(img => img.trim());
  
  // Convert relative image paths to API paths for content images
  const normalizedImages = imageArray.map(img => {
    if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/')) {
      return img; // Already absolute URL or properly formatted path
    }
    // Convert relative path to API route
    return `/api/content/images/portfolio/${img}`;
  });
  
  const captionArray = captions 
    ? (Array.isArray(captions) ? captions : captions.split(',').map(cap => cap.trim()))
    : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Autoplay effect
  useEffect(() => {
    if (autoplay && normalizedImages.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % normalizedImages.length);
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoplay, interval, normalizedImages.length]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % normalizedImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + normalizedImages.length) % normalizedImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (normalizedImages.length === 0) {
    return <div className="text-gray-500 dark:text-gray-400">No images provided</div>;
  }

  const currentCaption = captionArray[currentIndex];

  return (
    <div className={`relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden w-full max-w-2xl mx-auto ${className}`}>
      {/* Main Image */}
      <div 
        className="relative"
        style={{ height }}
      >
        <Image
          src={normalizedImages[currentIndex]}
          alt={currentCaption || `Slide ${currentIndex + 1}`}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
        />
        
        {/* Navigation arrows */}
        {showArrows && normalizedImages.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-black hover:bg-opacity-70"
              onClick={prevImage}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-black hover:bg-opacity-70"
              onClick={nextImage}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Slide counter */}
        {normalizedImages.length > 1 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {currentIndex + 1} / {normalizedImages.length}
          </div>
        )}
      </div>

      {/* Caption */}
      {currentCaption && (
        <div className="p-3 text-center text-sm text-gray-600 dark:text-gray-400">
          {currentCaption}
        </div>
      )}

      {/* Dots indicator */}
      {showDots && normalizedImages.length > 1 && (
        <div className="flex justify-center gap-2 p-3">
          {normalizedImages.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              }`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Carousel;
