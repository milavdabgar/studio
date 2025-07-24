// src/components/slidev/SlidevEmbedded.tsx
"use client";

import React, { useState, useEffect } from 'react';

interface SlidevEmbeddedProps {
  presentationPath: string;
  title: string;
}

export function SlidevEmbedded({ presentationPath, title }: SlidevEmbeddedProps) {
  const [buildExists, setBuildExists] = useState<boolean | null>(null);
  const buildUrl = `/slidev-builds/${presentationPath}/index.html`;

  useEffect(() => {
    // Check if the Slidev build exists
    fetch(buildUrl, { method: 'HEAD' })
      .then(response => {
        setBuildExists(response.ok);
      })
      .catch(() => {
        setBuildExists(false);
      });
  }, [buildUrl]);

  // Show loading state while checking
  if (buildExists === null) {
    return (
      <div className="slidev-embedded-container">
        <div className="slidev-app-header bg-white border-b px-4 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">
              📊 {title} • Loading...
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center h-96 bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading presentation...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if build doesn't exist
  if (!buildExists) {
    return (
      <div className="slidev-embedded-container">
        <div className="slidev-app-header bg-white border-b px-4 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">
              📊 {title} • Presentation Not Available
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center h-96 bg-gray-50">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Presentation Build Not Found</h3>
            <p className="text-gray-600 mb-4">
              The Slidev presentation for "{presentationPath}" hasn't been built yet or is not available.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>For developers:</strong> Run the Slidev build process to generate the static presentation files.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        src={buildUrl}
        className="w-full"
        style={{ height: 'calc(100vh - 60px)' }}
        frameBorder="0"
        allow="fullscreen"
        title={title}
      />
    </div>
  );
}
