
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import gfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

// Posts are now directly in content/posts, language is part of the filename
const postsDirectory = path.join(process.cwd(), 'content/posts');
export const availableLanguages = ['en', 'gu'];

export interface PostData {
  id: string; // This will be the slug
  lang: string;
  title: string;
  date: string;
  contentHtml: string;
  excerpt?: string;
  [key: string]: any; // For other frontmatter fields
}

export interface PostPreview {
  id: string; // slug
  lang: string;
  title: string;
  date: string;
  excerpt?: string;
  [key: string]: any;
}

function parseFileName(fileName: string): { slug: string; lang: string } {
  const langMatch = fileName.match(/\.([a-z]{2})\.md$/);
  if (langMatch) {
    return {
      slug: fileName.replace(/\.([a-z]{2})\.md$/, ''),
      lang: langMatch[1],
    };
  }
  // Default to 'en' if no language code is found in the filename (e.g., 'hello-world.md')
  return {
    slug: fileName.replace(/\.md$/, ''),
    lang: 'en',
  };
}

export async function getSortedPostsData(lang: string = 'en'): Promise<PostPreview[]> {
  let fileNames: string[] = [];
  try {
    if (!fs.existsSync(postsDirectory)) {
      console.warn(`Posts directory not found: ${postsDirectory}`);
      return [];
    }
    fileNames = fs.readdirSync(postsDirectory);
  } catch (e) {
    const error = e as Error;
    console.warn(`Error reading posts directory (${postsDirectory}): ${error.message}`);
    return [];
  }
  
  const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      const { slug, lang: fileLang } = parseFileName(fileName);
      
      // Only process files matching the requested language
      if (fileLang !== lang) {
        return null;
      }

      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const matterResult = matter(fileContents);

      const plainContent = matterResult.content.replace(/<\/?[^>]+(>|$)/g, "");
      const excerpt = plainContent.substring(0, 150) + (plainContent.length > 150 ? '...' : '');

      return {
        id: slug,
        lang: fileLang,
        title: matterResult.data.title || 'Untitled Post',
        date: matterResult.data.date || new Date().toISOString(),
        excerpt,
        ...matterResult.data,
      };
    })
    .filter(post => post !== null) as PostPreview[]; // Filter out nulls and cast

  return allPostsData.sort((a, b) => {
    if (new Date(a.date) < new Date(b.date)) {
      return 1;
    } else {
      return -1;
    }
  });
}

export async function getPostData(lang: string, slug: string): Promise<PostData> {
  const fileNameToRead = lang === 'en' ? `${slug}.md` : `${slug}.${lang}.md`;
  const fullPath = path.join(postsDirectory, fileNameToRead);
  
  let fileContents = '';
  try {
    fileContents = fs.readFileSync(fullPath, 'utf8');
  } catch (e) {
    // Fallback for English: if 'slug.en.md' doesn't exist but 'slug.md' does (and lang is 'en'), use 'slug.md'
    if (lang === 'en' && fileNameToRead === `${slug}.en.md`) {
        const defaultEnPath = path.join(postsDirectory, `${slug}.md`);
        try {
            fileContents = fs.readFileSync(defaultEnPath, 'utf8');
        } catch (e2) {
            throw new Error(`Post with lang "${lang}" and slug "${slug}" not found at ${fullPath} or ${defaultEnPath}.`);
        }
    } else {
        throw new Error(`Post with lang "${lang}" and slug "${slug}" not found at ${fullPath}.`);
    }
  }

  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(gfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true }) 
    .use(rehypeKatex, { output: 'htmlAndMathml' }) 
    .use(rehypeStringify, { allowDangerousHtml: true }) 
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  const plainContent = matterResult.content.replace(/<\/?[^>]+(>|$)/g, "");
  const excerpt = plainContent.substring(0, 150) + (plainContent.length > 150 ? '...' : '');

  return {
    id: slug,
    lang,
    contentHtml,
    title: matterResult.data.title || 'Untitled Post',
    date: matterResult.data.date || new Date().toISOString(),
    excerpt,
    ...matterResult.data,
  };
}

export function getAllPostSlugsWithLang(): { params: { lang: string; slug: string } }[] {
  const paths: { params: { lang: string; slug: string } }[] = [];
  if (fs.existsSync(postsDirectory)) {
    const fileNames = fs.readdirSync(postsDirectory).filter(fileName => fileName.endsWith('.md'));
    fileNames.forEach(fileName => {
      const { slug, lang } = parseFileName(fileName);
      if (availableLanguages.includes(lang)) { // Ensure we only generate paths for supported languages
        paths.push({
          params: {
            lang,
            slug,
          },
        });
      }
    });
  }
  return paths;
}
