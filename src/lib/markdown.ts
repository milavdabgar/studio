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

console.log(`[markdown.ts] Initialized. process.cwd(): ${process.cwd()}`);
console.log(`[markdown.ts] Content directory set to: ${contentDirectory}`);


export interface PostData {
  id: string;
  slugParts: string[];
  lang: string;
  title: string;
  date: string;
  contentHtml: string;
  excerpt?: string;
  [key: string]: any;
}

export interface PostPreview {
  id: string;
  slugParts: string[];
  lang: string;
  title: string;
  date: string;
  excerpt?: string;
  href: string;
  [key: string]: any;
}

interface FileDetails {
  slugParts: string[];
  lang: string;
  id: string;
  fullPath: string;
  relativePath: string;
}

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
    const fullEntryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllMarkdownFilesRecursive(fullEntryPath, baseDir, [...currentPathParts, entry.name]));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      let lang = 'en'; // Default to English
      let baseName = entry.name.substring(0, entry.name.length - 3);

      const langMatch = baseName.match(/\.([a-z]{2})$/);
      if (langMatch && availableLanguages.includes(langMatch[1])) {
        lang = langMatch[1];
        baseName = baseName.substring(0, baseName.length - 3);
      }

      let slugPartsForFile: string[];
      let id: string;

      if (baseName.toLowerCase() === '_index' || baseName.toLowerCase() === 'index') {
        slugPartsForFile = [...currentPathParts];
        id = slugPartsForFile.join('/');
      } else {
        slugPartsForFile = [...currentPathParts, baseName];
        id = slugPartsForFile.join('/');
      }
      
      // If currentPathParts is empty and baseName is _index or index, the id will be ""
      // This represents the root index file for a language, e.g. /posts/en/
      // slugPartsForFile should be an empty array for this case.

      files.push({
        slugParts: slugPartsForFile,
        lang,
        id,
        fullPath: fullEntryPath,
        relativePath: path.relative(baseDir, fullEntryPath).replace(/\\/g, '/'),
      });
    }
  }
  return files;
}

export async function getSortedPostsData(langToFilter?: string): Promise<PostPreview[]> {
  // console.log(`[getSortedPostsData] Called with langToFilter: ${langToFilter}. Content directory: ${contentDirectory}`);
  const allFileDetails = getAllMarkdownFilesRecursive(contentDirectory);
  // console.log(`[getSortedPostsData] Found ${allFileDetails.length} total markdown files.`);

  const allPostsDataPromises = allFileDetails.map(async (fileDetail) => {
    if (langToFilter && fileDetail.lang !== langToFilter) {
      return null;
    }

    const filePath = fileDetail.fullPath;
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const matterResult = matter(fileContents);

      let contentForExcerpt = matterResult.content;
      // More aggressive shortcode filtering for excerpts
      contentForExcerpt = contentForExcerpt.replace(/{{<.*?>.*?{{\s*<\s*\/\s*.*?\s*>\s*}}/gs, '[Shortcode Block]'); // Paired shortcodes
      contentForExcerpt = contentForExcerpt.replace(/{{<.*?>}}/g, '[Shortcode]'); // Self-closing shortcodes
      contentForExcerpt = contentForExcerpt.replace(/{{%(?:.|\n)*?%}}/gs, '[Shortcode Block]');
      contentForExcerpt = contentForExcerpt.replace(/```mermaid(?:.|\n)*?```/gs, '[Mermaid Diagram]');


      const plainContent = contentForExcerpt.replace(/<\/?[^>]+(>|$)/g, "").replace(/<!--.*?-->/gs, "").replace(/```[\s\S]*?```/g, "[Code Block]");
      const excerpt = plainContent.substring(0, 150) + (plainContent.length > 150 ? '...' : '');
      
      const title = matterResult.data.title || fileDetail.slugParts[fileDetail.slugParts.length -1] || 'Untitled Post';
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
  console.log(`[getPostData DEBUG] Attempting to get post for lang: "${langParam}", slugParts: ${JSON.stringify(slugParts)}, normalizedSlug: "${normalizedSlug}"`);
  console.log(`[getPostData DEBUG] Content Directory Root: ${contentDirectory}`);

  const baseSlugPathForFs = slugParts.length > 0 ? slugParts.join(path.sep) : '';
  
  const possibleFileChecks: { filePathToCheck: string, resolvedLang: string }[] = [];

  // Case 1: slugParts lead to a directory, check for _index.lang.md or index.lang.md inside it
  if (slugParts.length > 0) {
    possibleFileChecks.push({ filePathToCheck: path.join(contentDirectory, baseSlugPathForFs, `_index.${langParam}.md`), resolvedLang: langParam});
    possibleFileChecks.push({ filePathToCheck: path.join(contentDirectory, baseSlugPathForFs, `index.${langParam}.md`), resolvedLang: langParam});
    if (langParam === 'en') {
      possibleFileChecks.push({ filePathToCheck: path.join(contentDirectory, baseSlugPathForFs, `_index.md`), resolvedLang: 'en'});
      possibleFileChecks.push({ filePathToCheck: path.join(contentDirectory, baseSlugPathForFs, `index.md`), resolvedLang: 'en'});
    }
  }

  // Case 2: slugParts lead to a file like slug.lang.md or slug.md
  possibleFileChecks.push({ filePathToCheck: path.join(contentDirectory, `${baseSlugPathForFs}.${langParam}.md`), resolvedLang: langParam});
  if (langParam === 'en') {
    possibleFileChecks.push({ filePathToCheck: path.join(contentDirectory, `${baseSlugPathForFs}.md`), resolvedLang: 'en'});
  }
  
  // Case 3: Root index files (_index.lang.md or _index.md in contentDirectory)
  // This is typically for when slugParts is empty (e.g., /posts/en/)
  if (slugParts.length === 0) {
    possibleFileChecks.push({ filePathToCheck: path.join(contentDirectory, `_index.${langParam}.md`), resolvedLang: langParam});
    if (langParam === 'en') {
      possibleFileChecks.push({ filePathToCheck: path.join(contentDirectory, `_index.md`), resolvedLang: 'en'});
    }
  }


  let filePath: string | undefined;
  let resolvedLang = langParam;

  console.log(`[getPostData DEBUG] Base slug for FS operations: "${baseSlugPathForFs}"`);
  console.log(`[getPostData DEBUG] Possible file checks (absolute paths):`);
  possibleFileChecks.forEach(check => console.log(`  - Path: ${check.filePathToCheck}, Expected Lang: ${check.resolvedLang}`));


  for (const check of possibleFileChecks) {
    console.log(`[getPostData DEBUG] Trying path: ${check.filePathToCheck}`);
    try {
      if (fs.existsSync(check.filePathToCheck) && fs.statSync(check.filePathToCheck).isFile()) {
        filePath = check.filePathToCheck;
        resolvedLang = check.resolvedLang;
        console.log(`[getPostData DEBUG] File FOUND: ${filePath}, Resolved Language: ${resolvedLang}`);
        break;
      } else {
         // console.log(`[getPostData DEBUG] File NOT found or not a file at: ${check.filePathToCheck}`);
      }
    } catch(e) {
      console.warn(`[getPostData DEBUG] Error checking stat for ${check.filePathToCheck}: ${(e as Error).message}`);
    }
  }

  if (!filePath) {
    console.error(`\n🛑🛑🛑 [getPostData] FILE NOT FOUND! 🛑🛑🛑`);
    console.error(`Original slug: "${normalizedSlug}", Lang: "${langParam}"`);
    console.error(`Based on slugParts: ${JSON.stringify(slugParts)}`);
    console.error(`Content Directory: ${contentDirectory}`);
    console.error(`Checked paths (absolute):`);
    possibleFileChecks.forEach(pfc => console.error(`  - ${pfc.filePathToCheck} (expected lang: ${pfc.resolvedLang})`));
    return null; 
  }
  
  let fileContents;
  try {
    // console.log(`[getPostData DEBUG] Reading file contents from: ${filePath}`);
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
  // console.log(`[getPostData DEBUG] Content before shortcode removal for ${filePath} (first 100 chars): ${contentToProcess.substring(0, 100)}`);
  
  // More aggressive shortcode filtering
  contentToProcess = contentToProcess.replace(/{{<.*?>.*?{{\s*<\s*\/\s*.*?\s*>\s*}}/gs, (match) => `<!-- HUGO_PAIRED_SHORTCODE_FILTERED: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`);
  contentToProcess = contentToProcess.replace(/{{<.*?>}}/g, (match) => `<!-- HUGO_SINGLE_SHORTCODE_FILTERED: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`);
  contentToProcess = contentToProcess.replace(/{{%(?:.|\n)*?%}}/gs, (match) => `<!-- HUGO_PERCENT_SHORTCODE_FILTERED: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`);
  
  // console.log(`[getPostData DEBUG] Content after shortcode removal for ${filePath} (first 100 chars): ${contentToProcess.substring(0, 100)}`);

  let processedContent;
  try {
    processedContent = await remark()
      .use(gfm)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeKatex, { output: 'htmlAndMathml', throwOnError: false }) // Keep throwOnError: false
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(contentToProcess);
  } catch (e: any) {
    console.error(`[getPostData] CRITICAL ERROR during remark/rehype processing for file ${filePath}:`, e);
    return null;
  }
        
  const contentHtml = processedContent.toString();

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
    console.log("[getAllPostSlugsForStaticParams] Starting. Content directory:", contentDirectory);
    const allFileDetails = getAllMarkdownFilesRecursive(contentDirectory);
    console.log(`[getAllPostSlugsForStaticParams] Found ${allFileDetails.length} raw file details.`);

    const validSlugs = allFileDetails.map(fileDetail => {
      const slugParts = fileDetail.id === '' ? [] : fileDetail.slugParts;
      return {
        lang: fileDetail.lang,
        slugParts: slugParts,
      };
    }).filter(Boolean) as Array<{ lang: string; slugParts: string[] }>; // Filter out any nulls just in case

    console.log(`[getAllPostSlugsForStaticParams] Processed ${validSlugs.length} valid slugs for static params:`);
    // validSlugs.slice(0, 20).forEach(s => console.log(`  - lang: ${s.lang}, slugParts: [${s.slugParts.join(', ')}]`)); // Log first 20
    // if (validSlugs.length > 20) console.log("  ... and more.");

    return validSlugs;
  } catch (e: any) {
    console.error("[getAllPostSlugsForStaticParams] CRITICAL ERROR generating static params:", e);
    return [];
  }
}
