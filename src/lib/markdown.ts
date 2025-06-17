
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
  } catch (e) {
    console.warn(`[markdown.ts] Could not read directory ${dir}:`, e);
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
    try {
      // console.log(`[getSortedPostsData] Processing file: ${fileDetail.fullPath}`);
      const fileContents = fs.readFileSync(fileDetail.fullPath, 'utf8');
      const matterResult = matter(fileContents);

      let contentToProcess = matterResult.content.replace(/{{< mermaid >}}([\s\S]*?){{< \/mermaid >}}/gs, (match, mermaidContent) => {
        return '```mermaid\n' + mermaidContent.trim() + '\n```';
      });
      // More aggressive shortcode filtering
      contentToProcess = contentToProcess.replace(/{{< \/?\w+.*?>}}/gs, (match) => {
        return `<!-- Hugo Shortcode Filtered: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`;
      });
      contentToProcess = contentToProcess.replace(/{{%\s*ref\s*"([^"]+)"\s*%}}/g, (match, refPath) => {
        return `[Internal Link: ${refPath}](${refPath})`; // Basic placeholder
      });
      contentToProcess = contentToProcess.replace(/{{< \/?figure.*?>}}/gs, (match) => {
        return `<!-- Hugo Figure Shortcode Filtered: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`;
      });
      // General catch-all for Hugo-like shortcodes ( {{< ... >}} or {{% ... %}} )
      contentToProcess = contentToProcess.replace(/{{[<%][\s\S]*?[%>]}}/g, (match) => {
        return `<!-- Hugo Shortcode Filtered: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`;
      });


      const plainContent = contentToProcess
        .replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags
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
    } catch (e) {
      console.error(`[getSortedPostsData] Error processing file ${fileDetail.fullPath} for preview list:`, e);
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
  console.log(`[getPostData] Attempting to get post for lang: "${langParam}", slug: "${normalizedSlug}"`);
  
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
      } else if (ext === '.md' && !langSuffixMatch) { // If it's just .md, it's English
        resolvedLang = 'en';
      }
      console.log(`[getPostData] Found file: ${fullPath} with resolvedLang: ${resolvedLang}`);
      break;
    } else {
      // console.log(`[getPostData] File not found at ${fullPath}`);
    }
  }

  if (!filePath) {
    console.warn(`[getPostData] Markdown file not found. Content directory: ${contentDirectory}, Normalized slug: ${normalizedSlug}, Looked for: ${possibleFileNames.join(', ')}`);
    return null; 
  }
  
  try {
    // console.log(`[getPostData] Reading file: ${filePath}`);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    // console.log(`[getPostData] Parsing frontmatter for: ${filePath}`);
    const matterResult = matter(fileContents);

    let contentToProcess = matterResult.content.replace(/{{< mermaid >}}([\s\S]*?){{< \/mermaid >}}/gs, (match, mermaidContent) => {
      return '```mermaid\n' + mermaidContent.trim() + '\n```';
    });
    // More aggressive shortcode filtering
    contentToProcess = contentToProcess.replace(/{{< \/?\w+.*?>}}/gs, (match) => {
      return `<!-- Hugo Shortcode Filtered: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`;
    });
    contentToProcess = contentToProcess.replace(/{{%\s*ref\s*"([^"]+)"\s*%}}/g, (match, refPath) => {
      return `[Internal Link: ${refPath}](${refPath})`; // Basic placeholder
    });
    contentToProcess = contentToProcess.replace(/{{< \/?figure.*?>}}/gs, (match) => {
      return `<!-- Hugo Figure Shortcode Filtered: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`;
    });
    // General catch-all for Hugo-like shortcodes ( {{< ... >}} or {{% ... %}} )
    contentToProcess = contentToProcess.replace(/{{[<%][\s\S]*?[%>]}}/g, (match) => {
      return `<!-- Hugo Shortcode Filtered: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`;
    });


    // console.log(`[getPostData] Processing markdown to HTML for: ${filePath}`);
    const processedContent = await remark()
      .use(gfm)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeKatex, { output: 'htmlAndMathml', throwOnError: false }) // Critical: don't throw on KaTeX errors
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(contentToProcess);
      
    const contentHtml = processedContent.toString();

    const plainContentForExcerpt = contentToProcess
        .replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags
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
  } catch (e: any) { // Catch any error during file read, matter parse, or remark processing
    console.error(`[getPostData] CRITICAL ERROR processing markdown file ${filePath}:`, e.message, e.stack);
    return null; // Gracefully return null
  }
}

export function getAllPostSlugsForStaticParams(): Array<{ lang: string; slugParts: string[] } > {
  const allFileDetails = getAllMarkdownFilesRecursive(contentDirectory);
  return allFileDetails.map(fileDetail => ({
    lang: fileDetail.lang, 
    slugParts: fileDetail.slugParts, 
  }));
}

