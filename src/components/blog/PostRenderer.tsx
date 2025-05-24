// src/components/blog/PostRenderer.tsx
"use client";

import React, { useEffect } from 'react';

interface PostRendererProps {
  contentHtml: string;
}

const PostRenderer: React.FC<PostRendererProps> = ({ contentHtml }) => {
  useEffect(() => {
    // Dynamically import Mermaid to avoid SSR issues and ensure it runs client-side
    import('mermaid').then(mermaid => {
      try {
        mermaid.default.initialize({ startOnLoad: false, theme: 'default' });
        const elementsToRender = Array.from(
          document.querySelectorAll('pre.mermaid, code.language-mermaid, div.mermaid')
        );
        if (elementsToRender.length > 0) {
           mermaid.default.run({
              nodes: elementsToRender as HTMLElement[], // Cast to HTMLElement[]
            });
        }
      } catch (e) {
          console.error("Mermaid initialization or run error:", e);
      }
    }).catch(e => console.error("Failed to load Mermaid library:", e));
  }, [contentHtml]); // Re-run if contentHtml changes, though typically it won't for a static post

  return <div dangerouslySetInnerHTML={{ __html: contentHtml }} />;
};

export default PostRenderer;
