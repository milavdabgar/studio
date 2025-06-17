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

const contentDirectory = path.join(process.cwd(), 'content');
export const availableLanguages = ['en', 'gu'];

console.log(`[markdown.ts TOP LEVEL] process.cwd(): ${process.cwd()}`);
console.log(`[markdown.ts TOP LEVEL] Content directory set to: ${contentDirectory}`);
if (!fs.existsSync(contentDirectory)) {
  console.warn(`[markdown.ts TOP LEVEL] WARNING: Content directory DOES NOT EXIST: ${contentDirectory}`);
}


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
    console.warn(`[getAllMarkdownFilesRecursive] Directory not found, cannot read: ${dir}`);
    return files;
  }

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e: any) {
    console.warn(`[getAllMarkdownFilesRecursive] Could not read directory ${dir}:`, e.message);
    return files;
  }

  for (const entry of entries) {
    const fullEntryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllMarkdownFilesRecursive(fullEntryPath, baseDir, [...currentPathParts, entry.name]));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      let lang = 'en'; 
      let baseNameWithoutLangSuffix = entry.name.substring(0, entry.name.length - 3); 

      const langMatch = baseNameWithoutLangSuffix.match(/\.([a-z]{2})$/);
      if (langMatch && availableLanguages.includes(langMatch[1])) {
        lang = langMatch[1];
        baseNameWithoutLangSuffix = baseNameWithoutLangSuffix.substring(0, baseNameWithoutLangSuffix.length - 3); 
      }

      let slugPartsForFile: string[];
      let id: string;

      if (baseNameWithoutLangSuffix.toLowerCase() === '_index' || baseNameWithoutLangSuffix.toLowerCase() === 'index') {
        slugPartsForFile = [...currentPathParts];
        id = slugPartsForFile.join('/') || ''; 
      } else {
        slugPartsForFile = [...currentPathParts, baseNameWithoutLangSuffix];
        id = slugPartsForFile.join('/');
      }
      
      const fileDetail = {
        slugParts: slugPartsForFile,
        lang,
        id,
        fullPath: fullEntryPath,
        relativePath: path.relative(baseDir, fullEntryPath).replace(/\\/g, '/'),
      };
      files.push(fileDetail);
    }
  }
  return files;
}

export async function getPostData({
  lang: langParam,
  slugParts: receivedSlugParts,
}: {
  lang: string;
  slugParts?: string[];
}): Promise<PostData | null> {
  
  const internalSlugParts = Array.isArray(receivedSlugParts) ? receivedSlugParts : [];

  const normalizedSlug = internalSlugParts.join('/');
  const baseSlugPathForFs = internalSlugParts.join(path.sep);

  console.log(`\n[getPostData DEBUG] Attempting to get post for lang: "${langParam}", receivedSlugParts: ${JSON.stringify(receivedSlugParts)}, final internalSlugParts: ${JSON.stringify(internalSlugParts)}, normalizedSlug: "${normalizedSlug}", contentDirectory: ${contentDirectory}`);
  console.log(`[getPostData DEBUG] baseSlugPathForFs: "${baseSlugPathForFs}"`);

  const possibleFileChecks: { filePathToCheck: string, resolvedLang: string, description: string }[] = [];

  if (langParam === 'en' && normalizedSlug === 'blog/hello-world') {
    const hardcodedPath = path.join(contentDirectory, 'blog', 'hello-world.md');
    possibleFileChecks.push({ 
        filePathToCheck: hardcodedPath,
        resolvedLang: 'en',
        description: `[DIAGNOSTIC HARDCODED] ${hardcodedPath}`
    });
    try {
      const parentDir = path.join(contentDirectory, 'blog');
      if (fs.existsSync(parentDir) && fs.statSync(parentDir).isDirectory()) {
          const filesInDir = fs.readdirSync(parentDir);
          console.log(`[getPostData DIAGNOSTIC for blog/hello-world] Listing files in ${parentDir}:`);
          filesInDir.forEach(f => console.log(`  - ${f}`));
      }
    } catch (e: any) {
      console.warn(`[getPostData DIAGNOSTIC for blog/hello-world] Could not list files in blog directory: `, e.message);
    }
  }
  
  if (internalSlugParts.length > 0) { 
      possibleFileChecks.push({
        filePathToCheck: path.join(contentDirectory, `${baseSlugPathForFs}.${langParam}.md`),
        resolvedLang: langParam,
        description: `Exact lang file: ${baseSlugPathForFs}.${langParam}.md`
      });
      if (langParam === 'en') { 
        possibleFileChecks.push({
          filePathToCheck: path.join(contentDirectory, `${baseSlugPathForFs}.md`),
          resolvedLang: 'en',
          description: `Default English file (no lang suffix): ${baseSlugPathForFs}.md`
        });
      }
  }
  
  possibleFileChecks.push({
    filePathToCheck: path.join(contentDirectory, baseSlugPathForFs, `_index.${langParam}.md`),
    resolvedLang: langParam,
    description: `Directory index with lang: ${baseSlugPathForFs}/_index.${langParam}.md`
  });
  if (langParam === 'en') { 
    possibleFileChecks.push({
      filePathToCheck: path.join(contentDirectory, baseSlugPathForFs, `_index.md`),
      resolvedLang: 'en',
      description: `Default English directory index: ${baseSlugPathForFs}/_index.md`
    });
  }
  possibleFileChecks.push({
    filePathToCheck: path.join(contentDirectory, baseSlugPathForFs, `index.${langParam}.md`),
    resolvedLang: langParam,
    description: `Directory index (alt) with lang: ${baseSlugPathForFs}/index.${langParam}.md`
  });
  if (langParam === 'en') {
    possibleFileChecks.push({
      filePathToCheck: path.join(contentDirectory, baseSlugPathForFs, `index.md`),
      resolvedLang: 'en',
      description: `Default English directory index (alt): ${baseSlugPathForFs}/index.md`
    });
  }

  console.log(`[getPostData DEBUG] Possible file paths to check (in order):`);
  possibleFileChecks.forEach((pfc, idx) => console.log(`  [${idx}] Desc: ${pfc.description}, Path: ${pfc.filePathToCheck}, Expected Lang: ${pfc.resolvedLang}`));

  let filePath: string | undefined;
  let resolvedLang = langParam;

  for (const check of possibleFileChecks) {
    console.log(`[getPostData DEBUG] Trying filePath: ${check.filePathToCheck}`);
    try {
      if (fs.existsSync(check.filePathToCheck) && fs.statSync(check.filePathToCheck).isFile()) {
        filePath = check.filePathToCheck;
        resolvedLang = check.resolvedLang; 
        console.log(`[getPostData DEBUG] File FOUND: ${filePath}, Resolved Language: ${resolvedLang}`);
        break;
      } else {
        console.log(`[getPostData DEBUG] File NOT found or not a file: ${check.filePathToCheck}`);
      }
    } catch (e: any) {
      console.warn(`[getPostData DEBUG] Error checking file ${check.filePathToCheck}: ${e.message}`);
    }
  }

  if (!filePath) {
    console.warn(`[getPostData] File not found for slug: "${normalizedSlug}", lang: "${langParam}"`);
    console.warn(`  Searched in: ${contentDirectory}`);
    console.warn(`  This is normal for 404 requests`);
    return null;
  }

  let fileContents;
  try {
    console.log(`[getPostData DEBUG] Reading file contents from: ${filePath}`);
    fileContents = fs.readFileSync(filePath, 'utf8');
    console.log(`[getPostData DEBUG] Successfully read file: ${filePath}. Length: ${fileContents.length}.`);
  } catch (readError: any) {
    console.error(`[getPostData] CRITICAL ERROR reading file ${filePath}:`, readError);
    return null;
  }
  
  let matterResult;
  try {
    console.log(`[getPostData DEBUG] Parsing frontmatter for: ${filePath}`);
    matterResult = matter(fileContents);
    console.log(`[getPostData DEBUG] Successfully parsed frontmatter for: ${filePath}. Title: ${matterResult.data.title}`);
  } catch (matterError: any) {
    console.error(`[getPostData] CRITICAL ERROR parsing frontmatter for file ${filePath}:`, matterError);
    return null;
  }

  let contentToProcess = matterResult.content;
  console.log(`[getPostData DEBUG] Content before shortcode removal for ${filePath} (first 100 chars): "${contentToProcess.substring(0,100).replace(/\n/g, '\\\\n')}"`);
  
  contentToProcess = contentToProcess.replace(/{{< mermaid >}}([\s\S]*?){{< \/mermaid >}}/gi, (match, mermaidContent) => `\n\`\`\`mermaid\n${mermaidContent.trim()}\n\`\`\`\n`);
  contentToProcess = contentToProcess.replace(/{{% .*? %}}/g, (match) => `<!-- HUGO_SHORTCODE_FILTERED_PERCENT: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`);
  contentToProcess = contentToProcess.replace(/{{< \/?\w+[^>]* >}}/g, (match) => `<!-- HUGO_SHORTCODE_FILTERED_ANGLE: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`);
  
  console.log(`[getPostData DEBUG] Content after shortcode removal for ${filePath} (first 100 chars): "${contentToProcess.substring(0,100).replace(/\n/g, '\\\\n')}"`);

  let processedContent;
  try {
    console.log(`[getPostData DEBUG] Starting remark processing for: ${filePath}`);
    processedContent = await remark()
      .use(gfm)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeKatex) 
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(contentToProcess);
    console.log(`[getPostData DEBUG] Successfully processed markdown to HTML for: ${filePath}`);
  } catch (remarkError: any) {
    console.error(`[getPostData] CRITICAL ERROR during Remark/Rehype processing for file ${filePath}:`, remarkError);
    return null;
  }

  const contentHtml = processedContent.toString();
  
  const plainContentForExcerpt = contentToProcess
      .replace(/<\/?[^>]+(>|$)/g, "") 
      .replace(/<!--[\s\S]*?-->/g, "")      
      .replace(/```[\s\S]*?```/g, "[Code Block]"); 
  const excerpt = plainContentForExcerpt.substring(0, 150) + (plainContentForExcerpt.length > 150 ? '...' : '');

  return {
    id: internalSlugParts.join('/') || '', 
    slugParts: internalSlugParts,
    lang: resolvedLang, 
    contentHtml,
    title: matterResult.data.title || path.basename(filePath, path.extname(filePath)).replace(/\.(en|gu)$/, '').replace(/^_index$|^index$/, internalSlugParts[internalSlugParts.length -1] || 'Section Index') || 'Untitled Post',
    date: matterResult.data.date || new Date().toISOString(),
    excerpt,
    ...matterResult.data,
  };
}

export async function getSortedPostsData(langToFilter?: string): Promise<PostPreview[]> {
  const allFileDetails = getAllMarkdownFilesRecursive(contentDirectory);
  const allPostsDataPromises = allFileDetails.map(async (fileDetail) => {
    const filePath = fileDetail.fullPath;
    try {
      if (langToFilter && fileDetail.lang !== langToFilter) {
        return null;
      }
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const matterResult = matter(fileContents);

      let contentForExcerpt = matterResult.content;
      contentForExcerpt = contentForExcerpt.replace(/{{< mermaid >}}([\s\S]*?){{< \/mermaid >}}/gi, (match, mermaidContent) => `\n\`\`\`mermaid\n${mermaidContent.trim()}\n\`\`\`\n`);
      contentForExcerpt = contentForExcerpt.replace(/{{% .*? %}}/g, '[Shortcode]');
      contentForExcerpt = contentForExcerpt.replace(/{{< \/?\w+[^>]* >}}/g, (match) => `<!-- HUGO_SHORTCODE_FILTERED_ANGLE: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`);
      contentForExcerpt = contentForExcerpt.replace(/```mermaid[\s\S]*?```/g, '[Mermaid Diagram]');


      const plainContent = contentForExcerpt
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/```[\s\S]*?```/g, "[Code Block]");
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
        href: `/posts/${fileDetail.lang}/${fileDetail.id || ''}`.replace(/\/$/, ''), 
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

export function getAllPostSlugsForStaticParams(): Array<{ lang: string; slugParts: string[] | undefined }> {
  try {
    console.log("[getAllPostSlugsForStaticParams] Starting. Content directory:", contentDirectory);
    const allFileDetails = getAllMarkdownFilesRecursive(contentDirectory);
    console.log(`[getAllPostSlugsForStaticParams] Found ${allFileDetails.length} raw file details.`);

    const validSlugs = allFileDetails.map(fileDetail => {
      return {
        lang: fileDetail.lang,
        slugParts: fileDetail.slugParts && fileDetail.slugParts.length > 0 ? fileDetail.slugParts : undefined,
      };
    });
    console.log(`[getAllPostSlugsForStaticParams] Processed ${validSlugs.length} valid slugs for static params. Sample (first 5):`, validSlugs.slice(0, 3));
    return validSlugs;
  } catch (e: any) {
    console.error("[getAllPostSlugsForStaticParams] CRITICAL ERROR generating static params:", e);
    return [{ lang: 'en', slugParts: undefined }, { lang: 'gu', slugParts: undefined }]; // Fallback
  }
}

export async function getSubPostsForDirectory(dirPath: string[], lang: string = 'en'): Promise<PostPreview[]> {
  try {
    const directoryPath = path.join(contentDirectory, ...dirPath);
    
    if (!fs.existsSync(directoryPath)) {
      return [];
    }

    const allPostsData = await getSortedPostsData(lang);
    
    // Filter posts that are direct children or descendants of the directory
    const subPosts = allPostsData.filter(post => {
      if (!post.id) return false;
      
      const postPathParts = post.id.split('/');
      
      // Check if post is within this directory
      if (postPathParts.length <= dirPath.length) return false;
      
      // Check if the directory path matches
      for (let i = 0; i < dirPath.length; i++) {
        if (postPathParts[i] !== dirPath[i]) return false;
      }
      
      return true;
    });

    console.log(`[getSubPostsForDirectory] Found ${subPosts.length} sub-posts for directory: ${dirPath.join('/')}`);
    return subPosts;
  } catch (error) {
    console.error(`[getSubPostsForDirectory] Error getting sub-posts for ${dirPath.join('/')}:`, error);
    return [];
  }
}

