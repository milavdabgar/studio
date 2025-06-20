// src/components/seo/SEOMetaTags.tsx

import { Metadata } from 'next';
import { PostData } from '@/lib/types';

interface SEOMetaTagsProps {
  title: string;
  description: string;
  lang: string;
  path: string;
  post?: PostData;
  image?: string;
  type?: 'website' | 'article';
}

export function generateSEOMetadata({
  title,
  description,
  lang,
  path,
  post,
  image,
  type = 'website'
}: SEOMetaTagsProps): Metadata {
  const baseUrl = 'https://polymanager.app';
  const url = `${baseUrl}${path}`;
  const defaultImage = `${baseUrl}/og-image.png`;
  
  const siteName = lang === 'gu' ? 'મિલાવ દબગર' : 'Milav Dabgar';
  const locale = lang === 'gu' ? 'gu_IN' : 'en_US';
  const alternateLocale = lang === 'gu' ? 'en_US' : 'gu_IN';
  
  const baseMetadata: Metadata = {
    title: `${title} | ${siteName}`,
    description,
    alternates: {
      canonical: url,
      languages: {
        'en': `${baseUrl}${path.replace(`/${lang}/`, '/en/')}`,
        'gu': `${baseUrl}${path.replace(`/${lang}/`, '/gu/')}`,
      },
    },
    openGraph: {
      type: type,
      locale: locale,
      alternateLocale: alternateLocale,
      url: url,
      title: title,
      description: description,
      siteName: siteName,
      images: [{
        url: image || defaultImage,
        width: 1200,
        height: 630,
        alt: title,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [image || defaultImage],
      creator: '@milavdabgar',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };

  // Add article-specific metadata
  if (type === 'article' && post) {
    baseMetadata.openGraph = {
      ...baseMetadata.openGraph,
      type: 'article',
      publishedTime: new Date(post.date).toISOString(),
      authors: post.author ? (Array.isArray(post.author) ? post.author : [post.author]) : ['Milav Dabgar'],
      tags: post.tags || [],
    };
  }

  return baseMetadata;
}

// JSON-LD Structured Data Component
export function generateArticleJsonLD(post: PostData, lang: string, url: string) {
  const baseUrl = 'https://polymanager.app';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || '',
    image: `${baseUrl}/og-image.png`,
    author: {
      '@type': 'Person',
      name: Array.isArray(post.author) ? post.author.join(', ') : post.author || 'Milav Dabgar',
      url: `${baseUrl}/authors/${lang}/${encodeURIComponent(Array.isArray(post.author) ? post.author[0] : post.author || 'Milav Dabgar')}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Milav Dabgar',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: post.categories ? post.categories[0] : 'Technology',
    keywords: post.tags ? post.tags.join(', ') : '',
    inLanguage: lang,
  };
}

export function generateBreadcrumbJsonLD(breadcrumbs: Array<{label: string, href: string}>, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `${baseUrl}${item.href}` : undefined,
    })),
  };
}
