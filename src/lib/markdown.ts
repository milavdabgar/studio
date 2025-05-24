
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

const postsRootDirectory = path.join(process.cwd(), 'content/posts');
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

export function getSortedPostsData(lang: string = 'en'): PostPreview[] {
  const postsDirectory = path.join(postsRootDirectory, lang);
  let fileNames: string[] = [];
  try {
    if (!fs.existsSync(postsDirectory)) {
      console.warn(`Directory not found for language "${lang}": ${postsDirectory}`);
      return [];
    }
    fileNames = fs.readdirSync(postsDirectory);
  } catch (e) {
    const error = e as Error;
    console.warn(`Error reading posts directory for language "${lang}" (${postsDirectory}): ${error.message}`);
    return [];
  }
  
  const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      const id = fileName.replace(/\.md$/, ''); // slug
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const matterResult = matter(fileContents);

      const plainContent = matterResult.content.replace(/<\/?[^>]+(>|$)/g, "");
      const excerpt = plainContent.substring(0, 150) + (plainContent.length > 150 ? '...' : '');

      return {
        id,
        lang,
        title: matterResult.data.title || 'Untitled Post',
        date: matterResult.data.date || new Date().toISOString(),
        excerpt,
        ...matterResult.data,
      };
    });

  return allPostsData.sort((a, b) => {
    if (new Date(a.date) < new Date(b.date)) {
      return 1;
    } else {
      return -1;
    }
  });
}

export async function getPostData(lang: string, id: string): Promise<PostData> {
  const postsDirectory = path.join(postsRootDirectory, lang);
  const fullPath = path.join(postsDirectory, `${id}.md`);
  let fileContents = '';
  try {
    fileContents = fs.readFileSync(fullPath, 'utf8');
  } catch (e) {
    throw new Error(`Post with lang "${lang}" and id "${id}" not found at ${fullPath}.`);
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
    id,
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
  availableLanguages.forEach(lang => {
    const postsDirectory = path.join(postsRootDirectory, lang);
    if (fs.existsSync(postsDirectory)) {
      const fileNames = fs.readdirSync(postsDirectory).filter(fileName => fileName.endsWith('.md'));
      fileNames.forEach(fileName => {
        paths.push({
          params: {
            lang,
            slug: fileName.replace(/\.md$/, ''),
          },
        });
      });
    }
  });
  return paths;
}
