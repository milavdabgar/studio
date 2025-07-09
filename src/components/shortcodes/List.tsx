// src/components/shortcodes/List.tsx
// Blowfish List shortcode - Display a list of recent articles

import React from 'react';
import Link from 'next/link';

interface ListProps {
  limit: number | string;
  title?: string;
  cardView?: boolean | string;
  where?: string;
  value?: string;
  children?: React.ReactNode;
}

// Mock article data - in a real implementation, this would come from your CMS/data source
const mockArticles = [
  {
    title: "Getting Started with Next.js",
    slug: "/blog/getting-started-nextjs",
    excerpt: "Learn how to build modern web applications with Next.js and React.",
    date: "2024-01-15",
    tags: ["nextjs", "react", "tutorial"],
    type: "tutorial"
  },
  {
    title: "Advanced React Patterns",
    slug: "/blog/advanced-react-patterns",
    excerpt: "Explore advanced patterns and techniques for building scalable React applications.",
    date: "2024-01-12",
    tags: ["react", "patterns", "advanced"],
    type: "guide"
  },
  {
    title: "TypeScript Best Practices",
    slug: "/blog/typescript-best-practices",
    excerpt: "Learn best practices for writing maintainable TypeScript code.",
    date: "2024-01-10",
    tags: ["typescript", "best-practices"],
    type: "guide"
  },
  {
    title: "Building a Design System",
    slug: "/blog/building-design-system",
    excerpt: "Create a scalable design system for your web applications.",
    date: "2024-01-08",
    tags: ["design", "system", "ui"],
    type: "sample"
  },
  {
    title: "Performance Optimization",
    slug: "/blog/performance-optimization",
    excerpt: "Optimize your React applications for better performance.",
    date: "2024-01-05",
    tags: ["performance", "optimization"],
    type: "tutorial"
  },
  {
    title: "Modern CSS Techniques",
    slug: "/blog/modern-css-techniques",
    excerpt: "Explore modern CSS features and techniques for better styling.",
    date: "2024-01-03",
    tags: ["css", "modern", "styling"],
    type: "sample"
  }
];

const List: React.FC<ListProps> = ({
  limit,
  title = "Recent",
  cardView = false,
  where,
  value
}) => {
  // Parse limit to number
  const limitNum = typeof limit === 'string' ? parseInt(limit) : limit;
  const isCardView = typeof cardView === 'string' ? cardView === 'true' : cardView;

  // Filter articles based on where/value parameters
  let filteredArticles = mockArticles;
  if (where && value) {
    filteredArticles = mockArticles.filter(article => {
      // Simple filtering based on type or other properties
      if (where.toLowerCase() === 'type') {
        return article.type === value;
      }
      // Add more filtering logic as needed
      return true;
    });
  }

  // Limit the number of articles
  const articles = filteredArticles.slice(0, limitNum);

  if (articles.length === 0) {
    return (
      <div className="my-6 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-center text-neutral-500 dark:text-neutral-400">
        No articles found.
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isCardView) {
    return (
      <div className="my-6">
        {title && (
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {title}
          </h3>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <Link 
              key={index}
              href={article.slug}
              className="group block bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors duration-200 overflow-hidden dark:bg-gray-900 dark:border-gray-700"
            >
              <div className="p-4">
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-primary dark:hover:text-primary-600 dark:group-hover:text-primary dark:hover:text-primary-400 transition-colors duration-200 mb-2">
                  {article.title}
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <time className="text-xs text-neutral-500 dark:text-neutral-500">
                    {formatDate(article.date)}
                  </time>
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex gap-1">
                      {article.tags.slice(0, 2).map((tag, tagIndex) => (
                        <span 
                          key={tagIndex}
                          className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="my-6">
      {title && (
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {title}
        </h3>
      )}
      <div className="space-y-3">
        {articles.map((article, index) => (
          <Link 
            key={index}
            href={article.slug}
            className="group flex items-start space-x-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200"
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-primary dark:hover:text-primary-600 dark:group-hover:text-primary dark:hover:text-primary-400 transition-colors duration-200 mb-1">
                {article.title}
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2 line-clamp-2">
                {article.excerpt}
              </p>
              <div className="flex items-center space-x-3">
                <time className="text-xs text-neutral-500 dark:text-neutral-500">
                  {formatDate(article.date)}
                </time>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex gap-1">
                    {article.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span 
                        key={tagIndex}
                        className="px-1.5 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <svg 
              className="w-5 h-5 text-neutral-400 group-hover:text-primary dark:hover:text-primary-500 transition-colors duration-200 flex-shrink-0 mt-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default List;
