// src/components/slidev/SlidevThumbnails.tsx
"use client";

import React from 'react';
import { X, Play } from 'lucide-react';
import { type SlidevSlide } from '@/lib/slidev-parser';

interface SlidevThumbnailsProps {
  slides: SlidevSlide[];
  navigation: Array<{
    index: number;
    title: string;
    layout: string;
    hasBackground: boolean;
  }>;
  currentSlide: number;
  onSlideSelect: (index: number) => void;
  onClose: () => void;
}

export function SlidevThumbnails({
  slides,
  navigation,
  currentSlide,
  onSlideSelect,
  onClose
}: SlidevThumbnailsProps) {
  
  const handleSlideClick = (index: number) => {
    onSlideSelect(index);
    onClose(); // Close thumbnails after selection
  };

  const extractPreviewText = (content: string, maxLength: number = 100): string => {
    // Remove markdown syntax for preview
    const cleanText = content
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
      
    return cleanText.length > maxLength 
      ? cleanText.substring(0, maxLength) + '...'
      : cleanText;
  };

  return (
    <div className="slidev-thumbnails">
      {/* Header */}
      <div className="slidev-thumbnails-header">
        <h2 className="slidev-thumbnails-title">
          <Play className="w-5 h-5 mr-2" />
          Slide Overview
        </h2>
        <button
          onClick={onClose}
          className="slidev-thumbnails-close"
          title="Close thumbnails (T)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Thumbnails grid */}
      <div className="slidev-thumbnails-grid">
        {slides.map((slide, index) => {
          const navInfo = navigation[index];
          const isActive = index === currentSlide;
          const previewText = extractPreviewText(slide.content);
          
          return (
            <div
              key={index}
              className={`slidev-thumbnail ${isActive ? 'active' : ''}`}
              onClick={() => handleSlideClick(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSlideClick(index);
                }
              }}
            >
              {/* Thumbnail content preview */}
              <div 
                className={`slidev-thumbnail-content ${navInfo.layout}`}
                style={{
                  background: slide.background || '#ffffff',
                  backgroundImage: navInfo.hasBackground ? `url(${slide.background})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Slide number badge */}
                <div className="slidev-thumbnail-number">
                  {index + 1}
                </div>
                
                {/* Content preview */}
                <div className="slidev-thumbnail-preview">
                  <div className="slidev-thumbnail-title">
                    {navInfo.title}
                  </div>
                  <div className="slidev-thumbnail-text">
                    {previewText}
                  </div>
                </div>
                
                {/* Layout indicator */}
                <div className="slidev-thumbnail-layout">
                  {navInfo.layout !== 'default' && (
                    <span className="slidev-layout-badge">
                      {navInfo.layout}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Active indicator */}
              {isActive && (
                <div className="slidev-thumbnail-active-indicator">
                  <div className="slidev-active-dot"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Footer with navigation hint */}
      <div className="slidev-thumbnails-footer">
        <p className="text-sm text-gray-500">
          Click on any slide to navigate • Press T to toggle thumbnails • Press Esc to close
        </p>
      </div>
    </div>
  );
}
