'use client';

import { useState, ReactNode } from 'react';

interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  showGradient?: boolean;
  children?: ReactNode;
}

export function HeroImage({ 
  src, 
  alt, 
  className = "w-full h-full object-cover", 
  containerClassName = "relative w-full h-64 sm:h-80 lg:h-96 mb-8 rounded-xl overflow-hidden",
  showGradient = false,
  children
}: HeroImageProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return null;
  }

  return (
    <div className={containerClassName}>
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => setImageError(true)}
      />
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      )}
      {children}
    </div>
  );
}