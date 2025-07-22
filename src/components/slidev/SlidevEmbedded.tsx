// src/components/slidev/SlidevEmbedded.tsx
"use client";

import React from 'react';

interface SlidevEmbeddedProps {
  presentationPath: string;
  title: string;
}

export function SlidevEmbedded({ presentationPath, title }: SlidevEmbeddedProps) {
  return (
    <div className="slidev-embedded-container">
      {/* Keep your app's header visible but make it smaller */}
      <div className="slidev-app-header bg-white border-b px-4 py-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">
            📊 {title} • Presentation Mode
          </span>
          <div className="flex items-center space-x-2">
            <button className="text-blue-600 hover:text-blue-800">
              📥 Download
            </button>
            <button className="text-gray-600 hover:text-gray-800">
              🏠 Back to Course
            </button>
          </div>
        </div>
      </div>

      {/* Embedded native Slidev - FULL FEATURES */}
      <iframe
        src={`/slidev-builds/${presentationPath}/index.html`}
        className="w-full"
        style={{ height: 'calc(100vh - 60px)' }}
        frameBorder="0"
        allow="fullscreen"
        title={title}
      />
    </div>
  );
}
