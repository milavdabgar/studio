// src/components/slidev/SlidevRenderer.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { parseSlidevContent, generateSlideNavigation, type SlidevPresentation } from '@/lib/slidev-parser';
import { SlidevSlide } from '@/components/slidev/SlidevSlide';
import { SlidevControls } from '@/components/slidev/SlidevControls';
import { SlidevThumbnails } from '@/components/slidev/SlidevThumbnails';
import { ChevronLeft, ChevronRight, Maximize, Minimize, Home, RotateCcw } from 'lucide-react';

interface SlidevRendererProps {
  content: string;
  className?: string;
}

export function SlidevRenderer({ content, className }: SlidevRendererProps) {
  const [presentation, setPresentation] = useState<SlidevPresentation | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Parse Slidev content
  useEffect(() => {
    try {
      const parsed = parseSlidevContent(content);
      setPresentation(parsed);
      setIsLoading(false);
    } catch (error) {
      console.error('Error parsing Slidev content:', error);
      setIsLoading(false);
    }
  }, [content]);

  // Navigation functions
  const goToSlide = useCallback((index: number) => {
    if (!presentation) return;
    const newIndex = Math.max(0, Math.min(presentation.slides.length - 1, index));
    setCurrentSlide(newIndex);
  }, [presentation]);

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  const goToFirstSlide = useCallback(() => {
    goToSlide(0);
  }, [goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!presentation) return;

      switch (event.key) {
        case 'ArrowRight':
        case ' ':
          event.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          prevSlide();
          break;
        case 'Home':
          event.preventDefault();
          goToFirstSlide();
          break;
        case 'End':
          event.preventDefault();
          goToSlide(presentation.slides.length - 1);
          break;
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          }
          break;
        case 'f':
        case 'F11':
          event.preventDefault();
          setIsFullscreen(!isFullscreen);
          break;
        case 't':
          event.preventDefault();
          setShowThumbnails(!showThumbnails);
          break;
      }
    };

    if (isFullscreen || showThumbnails) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [presentation, currentSlide, isFullscreen, showThumbnails, nextSlide, prevSlide, goToFirstSlide, goToSlide]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.warn('Fullscreen not supported:', error);
        setIsFullscreen(true); // Fallback to CSS fullscreen
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (error) {
        console.warn('Exit fullscreen failed:', error);
        setIsFullscreen(false);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="slidev-container loading">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3 text-lg">Loading slides...</span>
        </div>
      </div>
    );
  }

  if (!presentation || presentation.slides.length === 0) {
    return (
      <div className="slidev-container error">
        <div className="flex items-center justify-center h-96 text-red-500">
          <p>Failed to load slides. Please check the content format.</p>
        </div>
      </div>
    );
  }

  const navigation = generateSlideNavigation(presentation);

  return (
    <div className={`slidev-container ${className} ${isFullscreen ? 'fullscreen' : ''} theme-${presentation.theme}`}>
      {/* Header with title and controls */}
      <div className="slidev-header">
        <div className="slidev-title">
          <h1>{presentation.title || 'Untitled Presentation'}</h1>
          <span className="slidev-slide-counter">
            {currentSlide + 1} / {presentation.totalSlides}
          </span>
        </div>
        
        <div className="slidev-header-controls">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className="control-btn"
            title="Toggle thumbnails (T)"
          >
            <Home className="w-4 h-4" />
          </button>
          
          <button
            onClick={goToFirstSlide}
            className="control-btn"
            title="First slide (Home)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="control-btn"
            title="Toggle fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="slidev-main">
        {showThumbnails ? (
          <SlidevThumbnails
            slides={presentation.slides}
            navigation={navigation}
            currentSlide={currentSlide}
            onSlideSelect={goToSlide}
            onClose={() => setShowThumbnails(false)}
          />
        ) : (
          <>
            {/* Current slide */}
            <div className="slidev-slide-container">
              <SlidevSlide
                slide={presentation.slides[currentSlide]}
                slideNumber={currentSlide + 1}
                totalSlides={presentation.totalSlides}
                theme={presentation.theme || 'default'}
              />
            </div>

            {/* Navigation arrows */}
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="slidev-nav-btn slidev-nav-prev"
              title="Previous slide (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={nextSlide}
              disabled={currentSlide === presentation.slides.length - 1}
              className="slidev-nav-btn slidev-nav-next"
              title="Next slide (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Bottom controls */}
      {!showThumbnails && (
        <SlidevControls
          currentSlide={currentSlide}
          totalSlides={presentation.totalSlides}
          onSlideChange={goToSlide}
          onPrevious={prevSlide}
          onNext={nextSlide}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
      )}

      {/* Keyboard shortcuts help */}
      {isFullscreen && (
        <div className="slidev-help">
          <div className="text-xs opacity-50">
            ← → Space: Navigate | F: Fullscreen | T: Thumbnails | Esc: Exit
          </div>
        </div>
      )}
    </div>
  );
}
