
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
    console.warn(`[markdown.ts] Content directory or subdirectory not found during scan: ${dir}`);
    return files;
  }

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e: any) {
    console.warn(`[markdown.ts] Could not read directory ${dir}:`, e.message);
    return files;
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
      
      const normalizedSlugPath = slugPath.replace(/\\/g, '/');
      const slugParts = normalizedSlugPath.split('/').filter(p => p && p !== '.');
      const id = slugParts.join('/'); 

      files.push({
        slugParts,
        lang,
        id,
        fullPath,
        relativePath: relativePathWithExt.replace(/\\/g, '/'),
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
    const filePath = fileDetail.fullPath;
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const matterResult = matter(fileContents);

      let contentToProcess = matterResult.content.replace(/{{< mermaid >}}([\s\S]*?){{< \/mermaid >}}/gs, (match, mermaidContent) => {
        return '```mermaid\n' + mermaidContent.trim() + '\n```';
      });
      contentToProcess = contentToProcess.replace(/{{< \/?\w+.*?>}}/gs, (match) => {
        return `<!-- Hugo Shortcode Filtered: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`;
      });
      contentToProcess = contentToProcess.replace(/{{%\s*ref\s*"([^"]+)"\s*%}}/g, (match, refPath) => {
        return `[Internal Link: ${refPath}](${refPath})`;
      });
      contentToProcess = contentToProcess.replace(/{{< \/?figure.*?>}}/gs, (match) => {
        return `<!-- Hugo Figure Shortcode Filtered: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`;
      });
      contentToProcess = contentToProcess.replace(/{{[<%][\s\S]*?[%>]}}/g, (match) => {
        return `<!-- Hugo Shortcode Filtered: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`;
      });


      const plainContent = contentToProcess
        .replace(/<\/?[^>]+(>|$)/g, ""); 
      const excerpt = plainContent.substring(0, 150) + (plainContent.length > 150 ? '...' : '');
      
      const title = matterResult.data.title || 'Untitled Post';
      const date = matterResult.data.date || new Date().toISOString();

      return {
        id: fileDetail.id,
        slugParts: fileDetail.slugParts,
        lang: fileDetail.lang,
        title,
        date,
        excerpt,
        href: `/posts/${fileDetail.lang}/${fileDetail.id}`,
        ...matterResult.data,
      };
    } catch (e: any) { 
      console.error(`[getSortedPostsData] CRITICAL ERROR processing file ${filePath} for preview list:`, e);
      return null; 
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
        return a.title.localeCompare(b.title);
    }
  });
}

export async function getPostData(langParam: string, slugParts: string[]): Promise<PostData | null> {
  const normalizedSlug = slugParts.join('/');
  console.log(`[getPostData DEBUG] Attempting to get post for lang: "${langParam}", slug: "${normalizedSlug}"`);
  
  const baseSlugPathForFs = normalizedSlug.split('/').join(path.sep);
  
  const possibleFileNames = [
    `${baseSlugPathForFs}.${langParam}.md`,
  ];
  if (langParam === 'en') {
    possibleFileNames.push(`${baseSlugPathForFs}.md`);
  }

  let filePath: string | undefined;
  let resolvedLang = langParam;

  for (const fileName of possibleFileNames) {
    const fullPath = path.join(contentDirectory, fileName);
    if (fs.existsSync(fullPath)) {
      filePath = fullPath;
      const ext = path.extname(fileName);
      const nameWithoutExt = path.basename(fileName, ext);
      const langSuffixMatch = nameWithoutExt.match(/\.([a-z]{2})$/);
      if (langSuffixMatch && availableLanguages.includes(langSuffixMatch[1])) {
        resolvedLang = langSuffixMatch[1];
      } else if (ext === '.md' && !langSuffixMatch) {
        resolvedLang = 'en';
      }
      break;
    }
  }

  if (!filePath) {
    console.warn(`[getPostData DEBUG] Markdown file not found. Content directory: ${contentDirectory}, Normalized slug: ${normalizedSlug}, Looked for: ${possibleFileNames.join(', ')}`);
    return null; 
  }
  
  try {
    console.log(`[getPostData DEBUG] Reading file: ${filePath}`);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const matterResult = matter(fileContents);

    let contentToProcess = matterResult.content.replace(/{{< mermaid >}}([\s\S]*?){{< \/mermaid >}}/gs, (match, mermaidContent) => {
      return '```mermaid\n' + mermaidContent.trim() + '\n```';
    });
    contentToProcess = contentToProcess.replace(/{{< \/?\w+.*?>}}/gs, (match) => {
      return `<!-- Hugo Shortcode Filtered: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`;
    });
    contentToProcess = contentToProcess.replace(/{{%\s*ref\s*"([^"]+)"\s*%}}/g, (match, refPath) => {
      return `[Internal Link: ${refPath}](${refPath})`;
    });
    contentToProcess = contentToProcess.replace(/{{< \/?figure.*?>}}/gs, (match) => {
      return `<!-- Hugo Figure Shortcode Filtered: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`;
    });
    contentToProcess = contentToProcess.replace(/{{[<%][\s\S]*?[%>]}}/g, (match) => {
      return `<!-- Hugo Shortcode Filtered: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`;
    });


    // console.log(`[getPostData DEBUG] Attempting to process content for: ${filePath}`);
    const processedContent = await remark()
      .use(gfm)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeKatex, { output: 'htmlAndMathml', throwOnError: false }) 
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(contentToProcess);
    // console.log(`[getPostData DEBUG] Successfully processed content for: ${filePath}`);
      
    const contentHtml = processedContent.toString();

    const plainContentForExcerpt = contentToProcess
        .replace(/<\/?[^>]+(>|$)/g, ""); 
    const excerpt = plainContentForExcerpt.substring(0, 150) + (plainContentForExcerpt.length > 150 ? '...' : '');

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
  } catch (e: any) { 
    console.error(`[getPostData] CRITICAL ERROR processing markdown file ${filePath}:`, e);
    return null; 
  }
}

export function getAllPostSlugsForStaticParams(): Array<{ lang: string; slugParts: string[] } > {
  try {
    const allFileDetails = getAllMarkdownFilesRecursive(contentDirectory);
    return allFileDetails.map(fileDetail => ({
      lang: fileDetail.lang, 
      slugParts: fileDetail.slugParts, 
    }));
  } catch (e: any) {
    console.error("[getAllPostSlugsForStaticParams] CRITICAL ERROR generating static params:", e);
    return []; // Return empty array on error to prevent build crash
  }
}
