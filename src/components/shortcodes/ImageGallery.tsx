// src/components/shortcodes/ImageGallery.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageGalleryProps {
  images: string | string[]; // Can be comma-separated string or array
  captions?: string | string[]; // Optional captions
  titles?: string | string[]; // Optional titles
  height?: number;
  className?: string;
  autoplay?: boolean;
  interval?: number; // Autoplay interval in ms
}

export function ImageGallery({
  images,
  captions,
  titles,
  height = 250,
  className = '',
  autoplay = false,
  interval = 5000
}: ImageGalleryProps) {
  // React hooks must be called at the top level
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Parse images array (safe to do before hooks)
  const imageArray = images ? (Array.isArray(images) ? images : images.split(',').map(img => img.trim())) : [];
  const fixedImageArray = imageArray.map(src => 
    src && !src.startsWith('http') && !src.startsWith('/') ? `/${src}` : src
  );
  
  const captionArray = captions 
    ? (Array.isArray(captions) ? captions : captions.split(',').map(cap => cap.trim()))
    : [];
    
  const titleArray = titles 
    ? (Array.isArray(titles) ? titles : titles.split(',').map(title => title.trim()))
    : [];

  // Autoplay effect - must be before any early returns
  useEffect(() => {
    if (autoplay && !isModalOpen) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % fixedImageArray.length);
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
  }, [autoplay, interval, fixedImageArray.length, isModalOpen]);

  // Check if images is provided and handle it safely
  if (!images) {
    return (
      <div className="p-4 text-center text-gray-500 border border-gray-200 rounded dark:text-gray-400 dark:border-gray-700">
        No images provided for gallery
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % fixedImageArray.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + fixedImageArray.length) % fixedImageArray.length);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }
  };

  if (fixedImageArray.length === 0) {
    return <div className="text-gray-500 dark:text-gray-400">No images provided</div>;
  }

  const currentCaption = captionArray[currentIndex];
  const currentTitle = titleArray[currentIndex];

  return (
    <>
      {/* Gallery Container */}
      <div className={`relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden w-full max-w-xl sm:max-w-2xl mx-auto ${className}`}>
        {/* Main Image */}
        <div 
          className="relative group cursor-zoom-in"
          style={{ height: Math.min(height, 400) }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={openModal}
        >
          <Image
            src={fixedImageArray[currentIndex]}
            alt={currentTitle || currentCaption || `Image ${currentIndex + 1}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
          
          {/* Zoom indicator */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black bg-opacity-50 text-white p-2 rounded-full">
              <ZoomIn className="h-4 w-4" />
            </div>
          </div>

          {/* Navigation arrows */}
          {fixedImageArray.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-black hover:bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-black hover:bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Dots indicator */}
        {fixedImageArray.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {fixedImageArray.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
              />
            ))}
          </div>
        )}

        {/* Image counter */}
        {fixedImageArray.length > 1 && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {currentIndex + 1} / {fixedImageArray.length}
          </div>
        )}
      </div>

      {/* Caption */}
      {(currentCaption || currentTitle) && (
        <div className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">
          {currentTitle && <div className="font-medium">{currentTitle}</div>}
          {currentCaption && <div>{currentCaption}</div>}
        </div>
      )}

      {/* Thumbnail strip */}
      {fixedImageArray.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {fixedImageArray.map((image, index) => (
            <button
              key={index}
              className={`relative flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                index === currentIndex 
                  ? 'border-blue-500' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
              onClick={() => setCurrentIndex(index)}
            >
              <Image
                src={image}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Full-screen Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <Image
              src={fixedImageArray[currentIndex]}
              alt={currentTitle || currentCaption || `Image ${currentIndex + 1}`}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:text-gray-300"
              onClick={closeModal}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation in modal */}
            {fixedImageArray.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Caption in modal */}
            {(currentCaption || currentTitle) && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-white bg-black bg-opacity-50 px-4 py-2 rounded">
                {currentTitle && <div className="font-medium">{currentTitle}</div>}
                {currentCaption && <div className="text-sm">{currentCaption}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ImageGallery;
