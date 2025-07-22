// src/components/slidev/SlidevControls.tsx
"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize, Play, Pause } from 'lucide-react';

interface SlidevControlsProps {
  currentSlide: number;
  totalSlides: number;
  onSlideChange: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

export function SlidevControls({
  currentSlide,
  totalSlides,
  onSlideChange,
  onPrevious,
  onNext,
  onToggleFullscreen,
  isFullscreen
}: SlidevControlsProps) {
  
  // Calculate progress percentage
  const progress = totalSlides > 0 ? ((currentSlide + 1) / totalSlides) * 100 : 0;
  
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSlide = parseInt(event.target.value) - 1;
    onSlideChange(newSlide);
  };

  return (
    <div className="slidev-controls">
      {/* Progress bar */}
      <div className="slidev-progress-container">
        <div 
          className="slidev-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Main controls */}
      <div className="slidev-controls-content">
        {/* Navigation buttons */}
        <div className="slidev-nav-controls">
          <button
            onClick={onPrevious}
            disabled={currentSlide === 0}
            className="slidev-control-btn"
            title="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={onNext}
            disabled={currentSlide === totalSlides - 1}
            className="slidev-control-btn"
            title="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Slide counter and scrubber */}
        <div className="slidev-slide-scrubber">
          <span className="slidev-slide-indicator">
            {currentSlide + 1} / {totalSlides}
          </span>
          
          <input
            type="range"
            min="1"
            max={totalSlides}
            value={currentSlide + 1}
            onChange={handleSliderChange}
            className="slidev-slider"
            title={`Go to slide ${currentSlide + 1} of ${totalSlides}`}
          />
        </div>
        
        {/* Utility controls */}
        <div className="slidev-utility-controls">
          <button
            onClick={onToggleFullscreen}
            className="slidev-control-btn"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
