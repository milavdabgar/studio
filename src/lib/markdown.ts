
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
  slugParts: string[]; // e.g., ['my-section', 'my-post'] or ['my-section'] for _index.md
  lang: string;        // e.g., 'en' or 'gu'
  id: string;          // e.g., 'my-section/my-post' or 'my-section' for _index.md
  fullPath: string;    // Absolute path to the .md file
  relativePath: string;// Path relative to contentDirectory e.g., section/my-post.gu.md
}

// Helper function to recursively get all markdown files and their details
function getAllMarkdownFilesRecursive(dir: string, baseDir: string = dir, currentPathParts: string[] = []): FileDetails[] {
  let files: FileDetails[] = [];
  if (!fs.existsSync(dir)) {
    console.warn(`[markdown.ts getAllMarkdownFilesRecursive] Directory not found: ${dir}`);
    return files;
  }

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e: any) {
    console.warn(`[markdown.ts getAllMarkdownFilesRecursive] Could not read directory ${dir}:`, e.message);
    return files;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllMarkdownFilesRecursive(fullPath, baseDir, [...currentPathParts, entry.name]));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      let lang = 'en';
      let baseName = entry.name.substring(0, entry.name.length - 3); // Remove .md

      const langMatch = baseName.match(/\.([a-z]{2})$/);
      if (langMatch && availableLanguages.includes(langMatch[1])) {
        lang = langMatch[1];
        baseName = baseName.substring(0, baseName.length - 3); // Remove .[lang]
      }

      let slugParts: string[];
      let id: string;

      if (baseName === '_index' || baseName === 'index') {
        slugParts = [...currentPathParts]; // For content/blog/_index.md, slugParts = ['blog']
        id = slugParts.join('/');
      } else {
        slugParts = [...currentPathParts, baseName];
        id = slugParts.join('/');
      }
      
      // Skip if ID becomes empty (e.g. root _index.md if not desired as a route)
      // if (id === '' && baseName === '_index') continue;


      files.push({
        slugParts,
        lang,
        id,
        fullPath,
        relativePath: path.relative(baseDir, fullPath).replace(/\\/g, '/'),
      });
    }
  }
  return files;
}

export async function getSortedPostsData(langToFilter?: string): Promise<PostPreview[]> {
  const allFileDetails = getAllMarkdownFilesRecursive(contentDirectory);
  // console.log(`[getSortedPostsData] Found ${allFileDetails.length} total markdown files.`);

  const allPostsDataPromises = allFileDetails.map(async (fileDetail) => {
    if (langToFilter && fileDetail.lang !== langToFilter) {
      return null;
    }
    // Skip _index files for the main post listing if they represent section overviews not individual posts
    // This depends on desired behavior. For now, let's include them.
    // if (fileDetail.relativePath.endsWith('_index.md') || fileDetail.relativePath.endsWith('index.md')) {
    //    // if you want to exclude section index pages from the main list
    // }

    const filePath = fileDetail.fullPath;
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const matterResult = matter(fileContents);

      let contentForExcerpt = matterResult.content;
      contentForExcerpt = contentForExcerpt.replace(/{{([%<])(?:.|\n)*?([%>])}}/gs, (match) => {
        if (match.includes('```mermaid')) return match; 
        return `<!-- HUGO_SHORTCODE_FILTERED_EXCERPT: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`;
      });
      const plainContent = contentForExcerpt.replace(/<\/?[^>]+(>|$)/g, "").replace(/<!--.*?-->/gs, "").replace(/```[\s\S]*?```/g, "[Code Block]");
      const excerpt = plainContent.substring(0, 150) + (plainContent.length > 150 ? '...' : '');
      
      const title = matterResult.data.title || fileDetail.slugParts[fileDetail.slugParts.length -1] || 'Untitled Post';
      const date = matterResult.data.date || new Date().toISOString();

      return {
        id: fileDetail.id, // id is now 'section/slug' or 'slug' or 'section' for _index.md
        slugParts: fileDetail.slugParts,
        lang: fileDetail.lang,
        title,
        date,
        excerpt,
        href: `/posts/${fileDetail.lang}/${fileDetail.id}`,
        ...matterResult.data,
      };
    } catch (e: any) { 
      console.error(`[getSortedPostsData] ERROR processing file ${filePath} for preview list:`, e);
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
  console.log(`[getPostData DEBUG] =================================================================`);
  console.log(`[getPostData DEBUG] Attempting to get post for lang: "${langParam}", slug: "${normalizedSlug}"`);
  console.log(`[getPostData DEBUG] Content Directory Root: ${contentDirectory}`);
  
  const baseSlugPathForFs = slugParts.join(path.sep); // Use platform-specific separator for fs operations
  
  // Order matters: specific language file, then generic, then index files
  const possibleFileNames = [
    `${baseSlugPathForFs}.${langParam}.md`,         // section/my-post.en.md
    path.join(baseSlugPathForFs, `_index.${langParam}.md`), // section/my-post/_index.en.md (if my-post is a section)
    path.join(baseSlugPathForFs, `index.${langParam}.md`),  // section/my-post/index.en.md
  ];

  if (langParam === 'en') { // Only for English, check for non-suffixed files
    possibleFileNames.push(`${baseSlugPathForFs}.md`);      // section/my-post.md
    possibleFileNames.push(path.join(baseSlugPathForFs, `_index.md`)); // section/my-post/_index.md
    possibleFileNames.push(path.join(baseSlugPathForFs, `index.md`));  // section/my-post/index.md
  }
  
  // If slugParts is empty (e.g. /posts/en/), look for root _index files
  if (slugParts.length === 0) {
    possibleFileNames.unshift(`_index.${langParam}.md`);
    if (langParam === 'en') {
      possibleFileNames.unshift(`_index.md`);
    }
  }


  let filePath: string | undefined;
  let resolvedLang = langParam;

  console.log(`[getPostData DEBUG] Base slug for FS operations: ${baseSlugPathForFs}`);
  console.log(`[getPostData DEBUG] Possible relative filenames to check:`);
  possibleFileNames.forEach(fn => console.log(`  - ${fn}`));

  for (const fileName of possibleFileNames) {
    const fullPath = path.join(contentDirectory, fileName);
    console.log(`[getPostData DEBUG] Checking for file at (absolute): ${fullPath}`);
    try {
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        filePath = fullPath;
        console.log(`[getPostData DEBUG] File FOUND: ${filePath}`);
        
        const ext = path.extname(fileName);
        const nameWithoutExt = path.basename(fileName, ext);
        const langSuffixMatch = nameWithoutExt.match(/\.([a-z]{2})$/);
        if (langSuffixMatch && availableLanguages.includes(langSuffixMatch[1])) {
          resolvedLang = langSuffixMatch[1];
        } else if (ext === '.md' && !langSuffixMatch) {
          resolvedLang = 'en';
        }
        console.log(`[getPostData DEBUG] Resolved language for found file: ${resolvedLang}`);
        break;
      } else {
        // console.log(`[getPostData DEBUG] File does NOT exist or is not a file at: ${fullPath}`);
      }
    } catch(e) {
      console.warn(`[getPostData DEBUG] Error checking stat for ${fullPath}: ${(e as Error).message}`);
    }
  }

  if (!filePath) {
    console.error(`\n🛑🛑🛑 [getPostData] FILE NOT FOUND! 🛑🛑🛑`);
    console.error(`Slug: "${normalizedSlug}", Lang: "${langParam}"`);
    console.error(`Content Directory: ${contentDirectory}`);
    console.error(`Checked paths (relative to content dir):`);
    possibleFileNames.forEach(pfn => console.error(`  - ${pfn} (resolved to: ${path.join(contentDirectory, pfn)})`));
    return null; 
  }
  
  let fileContents;
  try {
    console.log(`[getPostData DEBUG] Reading file contents from: ${filePath}`);
    fileContents = fs.readFileSync(filePath, 'utf8');
  } catch (e: any) {
    console.error(`[getPostData] CRITICAL ERROR reading file ${filePath}:`, e);
    return null;
  }
    
  let matterResult;
  try {
    matterResult = matter(fileContents);
  } catch (e: any) {
    console.error(`[getPostData] CRITICAL ERROR parsing frontmatter for file ${filePath}:`, e);
    return null;
  }
    
  let contentToProcess = matterResult.content;
  // console.log(`[getPostData DEBUG] Content before shortcode removal (first 150 chars) for ${filePath}: ${contentToProcess.substring(0, 150)}`);
  
  contentToProcess = contentToProcess.replace(/{{([%<])(?:.|\n)*?([%>])}}/gs, (match) => {
    if (match.includes('```mermaid')) return match;
    return `<!-- HUGO_SHORTCODE_FILTERED: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`;
  });
  // console.log(`[getPostData DEBUG] Content after shortcode removal (first 150 chars) for ${filePath}: ${contentToProcess.substring(0, 150)}`);

  let processedContent;
  try {
      processedContent = await remark()
        .use(gfm)
        .use(remarkMath)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeKatex, { output: 'htmlAndMathml', throwOnError: false })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process(contentToProcess);
  } catch (e: any) {
      console.error(`[getPostData] CRITICAL ERROR during remark/rehype processing for file ${filePath}:`, e);
      return null;
  }
        
  const contentHtml = processedContent.toString();
  // console.log(`[getPostData DEBUG] Processed HTML (first 200 chars) for ${filePath}: ${contentHtml.substring(0, 200)}`);

  const plainContentForExcerpt = contentToProcess
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(/<!--.*?-->/gs, "")
      .replace(/```[\s\S]*?```/g, "[Code Block]"); 
  const excerpt = plainContentForExcerpt.substring(0, 150) + (plainContentForExcerpt.length > 150 ? '...' : '');

  return {
    id: slugParts.join('/'),
    slugParts,
    lang: resolvedLang,
    contentHtml,
    title: matterResult.data.title || path.basename(filePath, path.extname(filePath)).replace(/\.(en|gu)$/, '').replace(/^_index$|^index$/, slugParts[slugParts.length -1] || 'Section Index') || 'Untitled Post',
    date: matterResult.data.date || new Date().toISOString(),
    excerpt,
    ...matterResult.data,
  };
}

export function getAllPostSlugsForStaticParams(): Array<{ lang: string; slugParts: string[] } > {
  try {
    const allFileDetails = getAllMarkdownFilesRecursive(contentDirectory);
    // Filter out entries where id is empty AND slugParts is also empty (e.g. a root _index.md without further path parts)
    // unless we specifically want a route like /posts/en/ for content/_index.en.md
    const validFileDetails = allFileDetails.filter(detail => {
      if (detail.id === '' && detail.slugParts.length === 0) {
        // This is a root _index.md or _index.lang.md
        // It should be included if it's intended to be a page (e.g., for /posts/en/)
        return true; 
      }
      return detail.id && detail.id.length > 0;
    });
    
    return validFileDetails.map(fileDetail => ({
      lang: fileDetail.lang, 
      // For root index files (id=''), slugParts should be an empty array
      slugParts: fileDetail.id === '' ? [] : fileDetail.slugParts, 
    }));
  } catch (e: any) {
    console.error("[getAllPostSlugsForStaticParams] CRITICAL ERROR generating static params:", e);
    return [];
  }
}

