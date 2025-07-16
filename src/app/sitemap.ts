import { MetadataRoute } from 'next';
import { getSortedPostsData, getAllTags, getAllCategories, getAllAuthors } from '@/lib/markdown';
import { languages } from '@/lib/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gppalanpur.in';
  const currentDate = new Date();
  
  const sitemap: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // Add language-specific home pages
  for (const lang of Object.keys(languages)) {
    sitemap.push({
      url: `${baseUrl}/${lang}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    });

    // Add blog index pages
    sitemap.push({
      url: `${baseUrl}/posts/${lang}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    });

    // Add search pages
    sitemap.push({
      url: `${baseUrl}/search/${lang}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6,
    });

    // Add taxonomy pages
    sitemap.push({
      url: `${baseUrl}/categories/${lang}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    });

    sitemap.push({
      url: `${baseUrl}/tags/${lang}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    });

    sitemap.push({
      url: `${baseUrl}/authors/${lang}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    });

    try {
      // Get all posts for this language
      const posts = await getSortedPostsData(lang);
      
      for (const post of posts) {
        const postDate = new Date(post.date || new Date());
        sitemap.push({
          url: `${baseUrl}${post.href}`,
          lastModified: postDate,
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      }

      // Get all categories for this language
      const categories = await getAllCategories(lang);
      for (const category of categories) {
        sitemap.push({
          url: `${baseUrl}/categories/${lang}/${encodeURIComponent(category.name)}`,
          lastModified: currentDate,
          changeFrequency: 'weekly',
          priority: 0.5,
        });
      }

      // Get all tags for this language
      const tags = await getAllTags(lang);
      for (const tag of tags) {
        sitemap.push({
          url: `${baseUrl}/tags/${lang}/${encodeURIComponent(tag.name)}`,
          lastModified: currentDate,
          changeFrequency: 'weekly',
          priority: 0.5,
        });
      }

      // Get all authors for this language
      const authors = await getAllAuthors(lang);
      for (const author of authors) {
        sitemap.push({
          url: `${baseUrl}/authors/${lang}/${encodeURIComponent(author.name)}`,
          lastModified: currentDate,
          changeFrequency: 'monthly',
          priority: 0.5,
        });
      }
    } catch (error) {
      console.error(`Error generating sitemap entries for language ${lang}:`, error);
    }
  }

  // Add static pages
  sitemap.push({
    url: `${baseUrl}/login`,
    lastModified: currentDate,
    changeFrequency: 'yearly',
    priority: 0.3,
  });

  return sitemap;
}
