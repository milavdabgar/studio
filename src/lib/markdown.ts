
// src/lib/markdown.ts

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

// Base directory for all markdown content
const contentDirectory = path.join(process.cwd(), 'content');
export const availableLanguages = ['en', 'gu']; // Supported languages

export interface PostData {
  id: string; // Combined slug, e.g., "section/my-post"
  slugParts: string[]; // e.g., ['section', 'my-post']
  lang: string;
  title: string;
  date: string;
  contentHtml: string;
  excerpt?: string;
  [key: string]: any; // For other frontmatter fields
}

export interface PostPreview {
  id: string; // Combined slug, e.g., "section/my-post"
  slugParts: string[];
  lang: string;
  title: string;
  date: string;
  excerpt?: string;
  href: string; // Full path for linking, e.g., /posts/en/section/my-post
  [key: string]: any;
}

interface FileDetails {
  slugParts: string[]; // e.g., ['my-section', 'my-post']
  lang: string;        // e.g., 'en' or 'gu'
  id: string;          // e.g., 'my-section/my-post' (this is slugParts.join('/'))
  fullPath: string;    // Absolute path to the .md file
  relativePath: string;// Path relative to contentDirectory e.g., section/my-post.gu.md
}

// Helper function to recursively get all markdown files and their details
function getAllMarkdownFilesRecursive(dir: string, baseDir: string = dir): FileDetails[] {
  let files: FileDetails[] = [];
  if (!fs.existsSync(dir)) {
    console.warn(`Content directory or subdirectory not found during scan: ${dir}`);
    return files;
  }

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    console.warn(`Could not read directory ${dir}:`, e);
    return files; // Skip this directory
  }


  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllMarkdownFilesRecursive(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const relativePathWithExt = path.relative(baseDir, fullPath); 
      
      let lang = 'en'; 
      let slugPath = relativePathWithExt.substring(0, relativePathWithExt.length - 3); 

      const langMatch = slugPath.match(/\.([a-z]{2})$/);
      if (langMatch && availableLanguages.includes(langMatch[1])) {
        lang = langMatch[1];
        slugPath = slugPath.substring(0, slugPath.length - 3); 
      }
      
      const slugParts = slugPath.split(path.sep).filter(p => p);
      const id = slugParts.join('/'); 

      files.push({
        slugParts,
        lang,
        id,
        fullPath,
        relativePath: relativePathWithExt,
      });
    }
  }
  return files;
}

export async function getSortedPostsData(langToFilter?: string): Promise<PostPreview[]> {
  const allFileDetails = getAllMarkdownFilesRecursive(contentDirectory);

  const allPostsDataPromises = allFileDetails.map(async (fileDetail) => {
    if (langToFilter && fileDetail.lang !== langToFilter) {
      return null;
    }
    try {
      const fileContents = fs.readFileSync(fileDetail.fullPath, 'utf8');
      const matterResult = matter(fileContents);

      const plainContent = matterResult.content.replace(/<\/?[^>]+(>|$)/g, "");
      const excerpt = plainContent.substring(0, 150) + (plainContent.length > 150 ? '...' : '');

      return {
        id: fileDetail.id,
        slugParts: fileDetail.slugParts,
        lang: fileDetail.lang,
        title: matterResult.data.title || 'Untitled Post',
        date: matterResult.data.date || new Date().toISOString(),
        excerpt,
        href: `/posts/${fileDetail.lang}/${fileDetail.id}`,
        ...matterResult.data,
      };
    } catch (e) {
      console.error(`Error processing file ${fileDetail.fullPath}:`, e);
      return null; // Skip this post if there's an error reading/parsing it
    }
  });

  const allPostsData = (await Promise.all(allPostsDataPromises)).filter(Boolean) as PostPreview[];

  return allPostsData.sort((a, b) => {
    try {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA < dateB) return 1;
        if (dateA > dateB) return -1;
        return 0;
    } catch (e) {
        return 0; 
    }
  });
}

export async function getPostData(langParam: string, slugParts: string[]): Promise<PostData | null> {
  const baseSlugPath = slugParts.join(path.sep); 
  
  const possibleFileNamesWithLang = [
    `${baseSlugPath}.${langParam}.md`,
  ];
  if (langParam === 'en') {
    possibleFileNamesWithLang.push(`${baseSlugPath}.md`);
  }

  let filePath: string | undefined;
  let resolvedLang = langParam;

  for (const fileName of possibleFileNamesWithLang) {
    const fullPath = path.join(contentDirectory, fileName);
    if (fs.existsSync(fullPath)) {
      filePath = fullPath;
      const langMatch = fileName.match(/\.([a-z]{2})\.md$/);
      if (langMatch && availableLanguages.includes(langMatch[1])) {
        resolvedLang = langMatch[1];
      } else if (fileName.endsWith('.md') && !langMatch) {
        resolvedLang = 'en';
      }
      break;
    }
  }

  if (!filePath) {
    console.warn(`Post not found for lang "${langParam}" and slugParts "${slugParts.join('/')}". Looked in content directory using patterns like ${possibleFileNamesWithLang.join(', ')}`);
    return null;
  }

  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
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
      id: slugParts.join('/'),
      slugParts,
      lang: resolvedLang,
      contentHtml,
      title: matterResult.data.title || 'Untitled Post',
      date: matterResult.data.date || new Date().toISOString(),
      excerpt,
      ...matterResult.data,
    };
  } catch (e) {
    console.error(`Error processing markdown file ${filePath}:`, e);
    return null; // Gracefully return null if processing fails
  }
}

export function getAllPostSlugsForStaticParams(): Array<{ lang: string; slugParts: string[] } > {
  const allFileDetails = getAllMarkdownFilesRecursive(contentDirectory);
  
  // The params object must match the dynamic route segment names.
  // Our route is /posts/[lang]/[[...slugParts]]/page.tsx
  // So, params should be { lang: '...', slugParts: ['part1', 'part2'] }
  return allFileDetails.map(fileDetail => ({
    lang: fileDetail.lang, // This directly maps to the [lang] segment
    slugParts: fileDetail.slugParts, // This maps to the [[...slugParts]] segment
  }));
}
