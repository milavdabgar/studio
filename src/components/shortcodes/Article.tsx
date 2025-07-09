import React from 'react';

interface ArticleProps {
  link: string;
  title?: string;
  target?: string;
  rel?: string;
}

export default function Article({ link, title, target = '_blank', rel = 'noopener' }: ArticleProps) {
  if (!link) {
    return <div className="text-red-500">Article shortcode requires a link parameter</div>;
  }

  return (
    <div className="article-shortcode my-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
      <a 
        href={link} 
        target={target} 
        rel={rel}
        className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
      >
        {title || link}
      </a>
    </div>
  );
}
