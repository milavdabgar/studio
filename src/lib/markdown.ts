
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import gfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, etc.)

const postsDirectory = path.join(process.cwd(), 'content/posts');

export interface PostData {
  id: string;
  title: string;
  date: string;
  contentHtml: string;
  excerpt?: string;
  [key: string]: any; // For other frontmatter fields
}

export function getSortedPostsData(): Omit<PostData, 'contentHtml'>[] {
  // Get file names under /content/posts
  let fileNames: string[] = [];
  try {
    fileNames = fs.readdirSync(postsDirectory);
  } catch (e) {
    // If the directory doesn't exist, return an empty array
    console.warn(`content/posts directory not found. No posts will be loaded.`);
    return [];
  }
  
  const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.md')) // Only include .md files
    .map(fileName => {
      // Remove ".md" from file name to get id
      const id = fileName.replace(/\.md$/, '');

      // Read markdown file as string
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      // Use gray-matter to parse the post metadata section
      const matterResult = matter(fileContents);

      // Generate a short excerpt (first 150 chars of content, simple approach)
      const plainContent = matterResult.content.replace(/<\/?[^>]+(>|$)/g, ""); // Strip HTML for excerpt
      const excerpt = plainContent.substring(0, 150) + (plainContent.length > 150 ? '...' : '');


      // Combine the data with the id
      return {
        id,
        title: matterResult.data.title || 'Untitled Post',
        date: matterResult.data.date || new Date().toISOString(),
        excerpt,
        ...matterResult.data,
      };
    });

  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (new Date(a.date) < new Date(b.date)) {
      return 1;
    } else {
      return -1;
    }
  });
}

export async function getPostData(id: string): Promise<PostData> {
  const fullPath = path.join(postsDirectory, `${id}.md`);
  let fileContents = '';
  try {
    fileContents = fs.readFileSync(fullPath, 'utf8');
  } catch (e) {
    // If the file doesn't exist, throw an error or return a specific structure
    throw new Error(`Post with id "${id}" not found.`);
  }

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents);

  // Use remark to convert markdown into HTML string
  const processedContent = await remark()
    .use(gfm) // Add GFM support
    .use(html, { sanitize: false }) // sanitize: false because we trust our markdown source
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  const plainContent = matterResult.content.replace(/<\/?[^>]+(>|$)/g, "");
  const excerpt = plainContent.substring(0, 150) + (plainContent.length > 150 ? '...' : '');

  // Combine the data with the id and contentHtml
  return {
    id,
    contentHtml,
    title: matterResult.data.title || 'Untitled Post',
    date: matterResult.data.date || new Date().toISOString(),
    excerpt,
    ...matterResult.data,
  };
}
