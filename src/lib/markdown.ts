// src/lib/markdown.ts

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import gfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { PostData, PostPreview } from './types';
import { processMarkdownWithShortcodes } from './shortcodes';
import { detectContentType, getContentTypeInfo } from './content-types';

const contentDirectory = path.join(process.cwd(), 'content');
export const availableLanguages = ['en', 'gu'];

// Re-export types for backward compatibility
export type { PostData, PostPreview } from './types';
export type { ContentFileDetails };

interface FileDetails {
  slugParts: string[];
  lang: string;
  id: string; 
  fullPath: string;
  relativePath: string; 
}

interface ContentFileDetails extends FileDetails {
  contentType: string;
  extension: string;
  filename: string;
  isBrowserViewable: boolean;
  requiresDownload: boolean;
}

function getAllMarkdownFilesRecursive(dir: string, baseDir: string = dir, currentPathParts: string[] = []): FileDetails[] {
  let files: FileDetails[] = [];
  if (!fs.existsSync(dir)) {
    console.warn(`[getAllMarkdownFilesRecursive] Directory not found, cannot read: ${dir}`);
    return files;
  }
  
  // Skip heavy directories that contain mostly images/assets but no markdown content
  const skipDirectories = ['images', 'assets'];
  const currentDirName = currentPathParts[currentPathParts.length - 1];
  if (skipDirectories.includes(currentDirName)) {
    console.log(`[getAllMarkdownFilesRecursive] Skipping heavy directory: ${dir}`);
    return files;
  }
  
  console.log(`[getAllMarkdownFilesRecursive] Scanning directory: ${dir}, currentPathParts: ${JSON.stringify(currentPathParts)}`);

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
    console.log(`[getAllMarkdownFilesRecursive] Directory ${dir} contains ${entries.length} entries:`, 
      entries.map(e => `${e.name}${e.isDirectory() ? '/' : ''}`).slice(0, 10));
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.warn(`[getAllMarkdownFilesRecursive] Could not read directory ${dir}:`, errorMessage);
    return files;
  }

  for (const entry of entries) {
    const fullEntryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip directories that might contain too many files (like images and assets)
      if (entry.name.includes('images') || entry.name.includes('assets')) {
        console.log(`[getAllMarkdownFilesRecursive] Skipping directory with many files: ${entry.name}`);
        continue;
      }
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

function getAllContentFilesRecursive(dir: string, baseDir: string = dir, currentPathParts: string[] = []): ContentFileDetails[] {
  let files: ContentFileDetails[] = [];
  if (!fs.existsSync(dir)) {
    console.warn(`[getAllContentFilesRecursive] Directory not found, cannot read: ${dir}`);
    return files;
  }
  
  // Skip heavy directories that contain mostly images/assets but no content
  const skipDirectories = ['node_modules', '.git', '.next', 'dist', 'build'];
  const currentDirName = currentPathParts[currentPathParts.length - 1];
  if (skipDirectories.includes(currentDirName)) {
    console.log(`[getAllContentFilesRecursive] Skipping directory: ${dir}`);
    return files;
  }
  
  console.log(`[getAllContentFilesRecursive] Scanning directory: ${dir}, currentPathParts: ${JSON.stringify(currentPathParts)}`);

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
    console.log(`[getAllContentFilesRecursive] Directory ${dir} contains ${entries.length} entries:`, 
      entries.map(e => `${e.name}${e.isDirectory() ? '/' : ''}`).slice(0, 10));
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.warn(`[getAllContentFilesRecursive] Could not read directory ${dir}:`, errorMessage);
    return files;
  }

  for (const entry of entries) {
    const fullEntryPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files = files.concat(getAllContentFilesRecursive(fullEntryPath, baseDir, [...currentPathParts, entry.name]));
    } else if (entry.isFile()) {
      // Skip hidden files and system files
      if (entry.name.startsWith('.') || entry.name.startsWith('~')) {
        continue;
      }
      
      let lang = 'en'; 
      let baseNameWithoutExt = path.parse(entry.name).name;
      const extension = path.parse(entry.name).ext;

      // Check for language suffix in filename (before extension)
      const langMatch = baseNameWithoutExt.match(/\.([a-z]{2})$/);
      if (langMatch && availableLanguages.includes(langMatch[1])) {
        lang = langMatch[1];
        baseNameWithoutExt = baseNameWithoutExt.substring(0, baseNameWithoutExt.length - 3); 
      }

      let slugPartsForFile: string[];
      let id: string;

      if (baseNameWithoutExt.toLowerCase() === '_index' || baseNameWithoutExt.toLowerCase() === 'index') {
        slugPartsForFile = [...currentPathParts];
        id = slugPartsForFile.join('/') || ''; 
      } else {
        slugPartsForFile = [...currentPathParts, baseNameWithoutExt];
        id = slugPartsForFile.join('/');
      }
      
      // Make ID unique by including extension for non-markdown files
      if (extension !== '.md') {
        id = `${id}${extension}`;
      }
      
      // Get content type information
      const contentTypeInfo = getContentTypeInfo(fullEntryPath);
      
      const fileDetail: ContentFileDetails = {
        slugParts: slugPartsForFile,
        lang,
        id,
        fullPath: fullEntryPath,
        relativePath: path.relative(baseDir, fullEntryPath).replace(/\\/g, '/'),
        contentType: contentTypeInfo.type,
        extension,
        filename: entry.name,
        isBrowserViewable: contentTypeInfo.isBrowserViewable,
        requiresDownload: contentTypeInfo.requiresDownload
      };
      files.push(fileDetail);
    }
  }
  return files;
}

/**
 * Check for featured image files in a directory following Hugo conventions
 * Looks for files named 'featured.*' with common image extensions
 */
function findFeaturedImageInDirectory(dirPath: string): string | null {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return null;
  }
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const lowerFile = file.toLowerCase();
      if (lowerFile.startsWith('featured.')) {
        const ext = path.extname(lowerFile);
        if (imageExtensions.includes(ext)) {
          return file; // Return relative filename
        }
      }
    }
  } catch (error) {
    console.warn(`[findFeaturedImageInDirectory] Error reading directory ${dirPath}:`, error);
  }
  
  return null;
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
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.warn(`[getPostData DIAGNOSTIC for blog/hello-world] Could not list files in blog directory: `, errorMessage);
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
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.warn(`[getPostData DEBUG] Error checking file ${check.filePathToCheck}: ${errorMessage}`);
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
  } catch (readError: unknown) {
    console.error(`[getPostData] CRITICAL ERROR reading file ${filePath}:`, readError);
    return null;
  }
  
  let matterResult;
  try {
    console.log(`[getPostData DEBUG] Parsing frontmatter for: ${filePath}`);
    matterResult = matter(fileContents);
    console.log(`[getPostData DEBUG] Successfully parsed frontmatter for: ${filePath}. Title: ${matterResult.data.title}`);
  } catch (matterError: unknown) {
    console.error(`[getPostData] CRITICAL ERROR parsing frontmatter for file ${filePath}:`, matterError);
    return null;
  }

  let contentToProcess = matterResult.content;
  console.log(`[getPostData DEBUG] Content before shortcode removal for ${filePath} (first 100 chars): "${contentToProcess.substring(0,100).replace(/\n/g, '\\\\n')}"`);
   // Handle Hugo shortcodes first - convert to React component placeholders
  contentToProcess = processMarkdownWithShortcodes(contentToProcess);

  // Filter out any remaining unsupported Hugo shortcodes (but NOT the ones already processed)
  contentToProcess = contentToProcess.replace(/{{% .*? %}}/g, (match) => `<!-- HUGO_SHORTCODE_FILTERED_PERCENT: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`);
  
  // Only filter out shortcodes that are not supported by our shortcode registry
  // Use negative lookahead to avoid filtering known shortcodes that have been processed into placeholders
  contentToProcess = contentToProcess.replace(/{{< (?!\/?(youtube|YouTube|figure|Figure|gallery|image-gallery|ImageGallery|x|X|twitter|Twitter|instagram|Instagram|qr|QRCode|code|CodeBlock|alert|Alert|badge|Badge|button|Button|timeline|Timeline|timelineItem|TimelineItem|github|GitHub|mermaid|Mermaid|chart|Chart|icon|Icon|swatches|Swatches|article|Article)\b)[^>]* >}}/g, (match) => `<!-- HUGO_SHORTCODE_FILTERED_ANGLE: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`);
  console.log(`[getPostData DEBUG] Content after shortcode processing for ${filePath} (first 100 chars): "${contentToProcess.substring(0,100).replace(/\n/g, '\\\\n')}"`);

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
  } catch (remarkError: unknown) {
    console.error(`[getPostData] CRITICAL ERROR during Remark/Rehype processing for file ${filePath}:`, remarkError);
    return null;
  }

  let contentHtml = processedContent.toString();
  
  // Detect content type
  const contentType = detectContentType(filePath);
  console.log(`[getPostData DEBUG] Content type detected for ${filePath}: ${contentType}`);
  
  // Extract better excerpt
  const excerpt = matterResult.data.excerpt || extractExcerpt(contentToProcess);
  
  // Normalize date to string format
  let normalizedDate = matterResult.data.date;
  
  if (normalizedDate instanceof Date) {
    normalizedDate = normalizedDate.toISOString();
  } else if (normalizedDate && typeof normalizedDate !== 'string') {
    try {
      normalizedDate = new Date(normalizedDate).toISOString();
    } catch (e: unknown) {
      console.warn('Failed to convert date, using current date:', e);
      normalizedDate = new Date().toISOString();
    }
  } else if (!normalizedDate) {
    normalizedDate = new Date().toISOString();
  }

  // Check for featured image following Hugo conventions
  let featuredImage = matterResult.data.featured;
  if (!featuredImage && internalSlugParts.length > 0) {
    // For bundle-style posts (index.md in a directory), check the same directory
    const postDir = path.join(contentDirectory, ...internalSlugParts);
    const autoFeaturedImage = findFeaturedImageInDirectory(postDir);
    if (autoFeaturedImage) {
      featuredImage = autoFeaturedImage;
    }
  }

  return {
    id: internalSlugParts.join('/') || '', 
    slugParts: internalSlugParts,
    lang: resolvedLang, 
    contentHtml,
    contentType, // Add content type
    rawContent: matterResult.content, // Add raw content for Slidev processing
    title: matterResult.data.title || path.basename(filePath, path.extname(filePath)).replace(/\.(en|gu)$/, '').replace(/^_index$|^index$/, internalSlugParts[internalSlugParts.length -1] || 'Section Index') || 'Untitled Post',
    date: normalizedDate,
    excerpt,
    tags: Array.isArray(matterResult.data.tags) ? matterResult.data.tags : [],
    categories: Array.isArray(matterResult.data.categories) ? matterResult.data.categories : [],
    series: matterResult.data.series || '',
    author: matterResult.data.author || '',
    draft: matterResult.data.draft || false,
    readingTime: calculateReadingTime(contentToProcess),
    wordCount: calculateWordCount(contentToProcess),
    ...matterResult.data,
    // Override featured field with our detected/processed value
    featured: featuredImage || false,
  };
}

// Utility functions
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function calculateWordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

export function extractExcerpt(content: string, maxLength: number = 150): string {
  // Remove HTML tags for excerpt
  const plainText = content.replace(/<[^>]*>/g, '');
  if (plainText.length <= maxLength) return plainText;
  return plainText.slice(0, maxLength).trim() + '...';
}

export async function getSortedPostsData(langToFilter?: string): Promise<PostPreview[]> {
  console.log(`[getSortedPostsData] Starting with langToFilter: ${langToFilter}, contentDirectory: ${contentDirectory}`);
  const allFileDetails = getAllMarkdownFilesRecursive(contentDirectory);
  
  // Filter out _index files - these are section pages, not posts
  const postFileDetails = allFileDetails.filter(fileDetail => {
    const filename = path.basename(fileDetail.fullPath, path.extname(fileDetail.fullPath));
    const isIndexFile = filename === '_index' || filename.startsWith('_index.');
    if (isIndexFile) {
      console.log(`[getSortedPostsData] Excluding _index file: ${fileDetail.fullPath}`);
    }
    return !isIndexFile;
  });
  
  console.log(`[getSortedPostsData] Found ${allFileDetails.length} total markdown files, ${postFileDetails.length} posts (excluding _index files)`);
  console.log(`[getSortedPostsData] Sample files:`, postFileDetails.slice(0, 5).map(f => ({ id: f.id, lang: f.lang, fullPath: f.fullPath })));
  
  const allPostsDataPromises = postFileDetails.map(async (fileDetail) => {
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

      // Check for featured image following Hugo conventions
      let featuredImage = matterResult.data.featured;
      if (!featuredImage && fileDetail.slugParts.length > 0) {
        // For bundle-style posts (index.md in a directory), check the same directory
        const postDir = path.join(contentDirectory, ...fileDetail.slugParts);
        const autoFeaturedImage = findFeaturedImageInDirectory(postDir);
        if (autoFeaturedImage) {
          featuredImage = autoFeaturedImage;
        }
      }

      return {
        id: fileDetail.id,
        slugParts: fileDetail.slugParts,
        lang: fileDetail.lang,
        title,
        date,
        excerpt,
        href: `/posts/${fileDetail.lang}/${fileDetail.id || ''}`.replace(/\/$/, ''), 
        ...matterResult.data,
        // Override featured field with our detected/processed value
        featured: featuredImage || false,
      };
    } catch (e: unknown) { 
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
    } catch {
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
  } catch (e: unknown) {
    console.error("[getAllPostSlugsForStaticParams] CRITICAL ERROR generating static params:", e);
    return [{ lang: 'en', slugParts: undefined }, { lang: 'gu', slugParts: undefined }]; // Fallback
  }
}

export async function getAllContentFiles(langToFilter?: string): Promise<ContentFileDetails[]> {
  console.log(`[getAllContentFiles] Starting with langToFilter: ${langToFilter}, contentDirectory: ${contentDirectory}`);
  const allFileDetails = getAllContentFilesRecursive(contentDirectory);
  console.log(`[getAllContentFiles] Found ${allFileDetails.length} total content files`);
  
  // Filter by language if specified
  if (langToFilter) {
    const filteredFiles = allFileDetails.filter(file => file.lang === langToFilter);
    console.log(`[getAllContentFiles] Filtered to ${filteredFiles.length} files for language: ${langToFilter}`);
    return filteredFiles;
  }
  
  return allFileDetails;
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

// Get direct articles following Hugo conventions (single .md files and folders with index.md, excluding _index.md)
export async function getDirectPostsForDirectory(dirPath: string[], lang: string = 'en'): Promise<PostPreview[]> {
  try {
    const directoryPath = path.join(contentDirectory, ...dirPath);
    
    if (!fs.existsSync(directoryPath)) {
      return [];
    }
    
    const allPostsData = await getSortedPostsData(lang);
    const directPosts: PostPreview[] = [];
    
    // Get all posts that are direct children of this directory
    const candidatePosts = allPostsData.filter(post => {
      if (!post.id) return false;
      
      const postPathParts = post.id.split('/');
      
      // Must be exactly one level deeper than current directory
      if (postPathParts.length !== dirPath.length + 1) return false;
      
      // Check if this post's path starts with the directory path
      for (let i = 0; i < dirPath.length; i++) {
        if (postPathParts[i] !== dirPath[i]) return false;
      }
      
      return true;
    });
    
    // Filter out _index files (these are section pages, not articles) - should be unnecessary now
    const articlePosts = candidatePosts.filter(post => {
      const postPathParts = post.id!.split('/');
      const filename = postPathParts[postPathParts.length - 1];
      
      // Exclude _index files (section pages) - this should already be filtered out by getSortedPostsData
      if (filename === '_index' || filename.startsWith('_index.')) {
        console.log(`[getDirectPostsForDirectory] EXCLUDING _index file: ${post.id}`);
        return false;
      }
      
      return true;
    });
    
    // Now check for article bundles (folders with index.md)
    const sectionDirPath = path.join(contentDirectory, ...dirPath);
    
    try {
      const entries = fs.readdirSync(sectionDirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subdirPath = path.join(sectionDirPath, entry.name);
          
          // Check if this directory has index.md (article bundle) but NOT _index.md (section)
          const hasArticleIndex = fs.existsSync(path.join(subdirPath, `index.md`)) ||
                                 fs.existsSync(path.join(subdirPath, `index.${lang}.md`));
          const hasSectionIndex = fs.existsSync(path.join(subdirPath, `_index.md`)) ||
                                 fs.existsSync(path.join(subdirPath, `_index.${lang}.md`));
          
          if (hasArticleIndex && !hasSectionIndex) {
            // This is an article bundle - find the index post
            const bundlePosts = allPostsData.filter(post => {
              if (!post.id) return false;
              const postPathParts = post.id.split('/');
              
              // Check if post is in this bundle directory
              if (postPathParts.length !== dirPath.length + 2) return false;
              
              // Check path match
              for (let i = 0; i < dirPath.length; i++) {
                if (postPathParts[i] !== dirPath[i]) return false;
              }
              
              if (postPathParts[dirPath.length] !== entry.name) return false;
              
              const filename = postPathParts[postPathParts.length - 1];
              return filename === 'index' || filename.startsWith('index.');
            });
            
            if (bundlePosts.length > 0) {
              directPosts.push(...bundlePosts);
            }
          }
          // If it has _index.md, it's a section and will be handled by subsections
          // If it has neither, it's not a Hugo-style structure, so we skip it
        }
      }
    } catch (error) {
      console.warn(`[getDirectPostsForDirectory] Error reading directory ${sectionDirPath}:`, error);
    }
    
    // Combine single file articles with bundle articles
    directPosts.push(...articlePosts);
    
    console.log(`[getDirectPostsForDirectory] Found ${directPosts.length} direct articles for directory: ${dirPath.join('/')}`);
    return directPosts;
  } catch (error) {
    console.error(`[getDirectPostsForDirectory] Error getting direct posts for ${dirPath.join('/')}:`, error);
    return [];
  }
}

// Updated function to get direct content (files + folders) in a section
export async function getDirectSectionContent(dirPath: string[], lang: string = 'en'): Promise<{
  files: ContentFileDetails[];
  subsections: { name: string; slug: string; posts: PostPreview[]; description?: string }[];
}> {
  try {
    const directoryPath = path.join(contentDirectory, ...dirPath);
    
    if (!fs.existsSync(directoryPath)) {
      return { files: [], subsections: [] };
    }

    // Get all content files for this language
    const allContentFiles = await getAllContentFiles(lang);
    
    // Filter files that are direct children of this directory (excluding markdown files)
    const directFiles = allContentFiles.filter(file => {
      if (!file.id) return false;
      
      // Exclude markdown files - they should appear as posts/subsections instead
      if (file.contentType === 'markdown' || file.extension === '.md') return false;
      
      const filePathParts = file.id.split('/');
      
      // Check if file is a direct child of this directory
      if (filePathParts.length !== dirPath.length + 1) return false;
      
      // Check if the directory path matches
      for (let i = 0; i < dirPath.length; i++) {
        if (filePathParts[i] !== dirPath[i]) return false;
      }
      
      return true;
    });

    // Hugo-style subsections: only directories with _index.md files
    const sectionDirPath = path.join(contentDirectory, ...dirPath);
    const subsections: { name: string; slug: string; posts: PostPreview[]; description?: string }[] = [];
    
    try {
      const entries = fs.readdirSync(sectionDirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subdirPath = path.join(sectionDirPath, entry.name);
          
          // Check if this directory has _index.md or _index.gu.md (Hugo section pages)
          const hasIndexFile = fs.existsSync(path.join(subdirPath, `_index.md`)) ||
                              fs.existsSync(path.join(subdirPath, `_index.${lang}.md`));
          
          if (hasIndexFile) {
            // Read the _index.md file to get the title and description
            let sectionTitle = entry.name; // fallback to folder name
            let sectionDescription = '';
            
            try {
              // Try language-specific _index file first, then fallback to default
              const indexPath = fs.existsSync(path.join(subdirPath, `_index.${lang}.md`)) 
                ? path.join(subdirPath, `_index.${lang}.md`)
                : path.join(subdirPath, `_index.md`);
              
              if (fs.existsSync(indexPath)) {
                const indexContent = fs.readFileSync(indexPath, 'utf8');
                const indexMatter = matter(indexContent);
                
                // Use title from frontmatter, fallback to folder name
                sectionTitle = indexMatter.data.title || entry.name;
                sectionDescription = indexMatter.data.description || indexMatter.data.summary || '';
              }
            } catch (error) {
              console.warn(`[getDirectSectionContent] Error reading _index file for ${entry.name}:`, error);
            }
            
            // Get all posts in this subsection
            const allPostsData = await getSortedPostsData(lang);
            const subsectionPosts = allPostsData.filter(post => {
              if (!post.id) return false;
              const postPathParts = post.id.split('/');
              
              // Check if post is within this subsection
              if (postPathParts.length <= dirPath.length + 1) return false;
              
              // Check if the path matches up to this subsection
              for (let i = 0; i < dirPath.length; i++) {
                if (postPathParts[i] !== dirPath[i]) return false;
              }
              
              return postPathParts[dirPath.length] === entry.name;
            });
            
            subsections.push({
              name: sectionTitle, // Now using title from _index.md frontmatter
              slug: [...dirPath, entry.name].join('/'),
              posts: subsectionPosts,
              description: sectionDescription || `${subsectionPosts.length} item${subsectionPosts.length !== 1 ? 's' : ''}`
            });
          }
        }
      }
    } catch (error) {
      console.warn(`[getDirectSectionContent] Error reading directory ${sectionDirPath}:`, error);
    }

    // Sort subsections by name
    subsections.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`[getDirectSectionContent] Found ${directFiles.length} direct files and ${subsections.length} subsections for directory: ${dirPath.join('/')}`);
    return { files: directFiles, subsections };
  } catch (error) {
    console.error(`[getDirectSectionContent] Error getting content for ${dirPath.join('/')}:`, error);
    return { files: [], subsections: [] };
  }
}

// Hugo-like section listing: only direct subsections, not deeply nested posts
export async function getDirectSubsections(dirPath: string[], lang: string = 'en'): Promise<{ name: string; slug: string; posts: PostPreview[]; description?: string }[]> {
  try {
    const directoryPath = path.join(contentDirectory, ...dirPath);
    
    if (!fs.existsSync(directoryPath)) {
      return [];
    }

    const allPostsData = await getSortedPostsData(lang);
    
    // Group posts by their immediate subdirectory
    const subsectionMap: Record<string, PostPreview[]> = {};
    
    allPostsData.forEach(post => {
      if (!post.id) return;
      
      const postPathParts = post.id.split('/');
      
      // Check if post is within this directory and has at least one more level
      if (postPathParts.length <= dirPath.length) return;
      
      // Check if the directory path matches
      let matches = true;
      for (let i = 0; i < dirPath.length; i++) {
        if (postPathParts[i] !== dirPath[i]) {
          matches = false;
          break;
        }
      }
      
      if (!matches) return;
      
      // Get the immediate next level (subsection name)
      const subsectionName = postPathParts[dirPath.length];
      
      if (!subsectionMap[subsectionName]) {
        subsectionMap[subsectionName] = [];
      }
      
      subsectionMap[subsectionName].push(post);
    });

    // Convert to array and add metadata
    const subsections = Object.entries(subsectionMap).map(([name, posts]) => ({
      name,
      slug: [...dirPath, name].join('/'),
      posts,
      description: `${posts.length} item${posts.length !== 1 ? 's' : ''}`
    }));

    // Sort subsections by name
    subsections.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`[getDirectSubsections] Found ${subsections.length} direct subsections for directory: ${dirPath.join('/')}`);
    return subsections;
  } catch (error) {
    console.error(`[getDirectSubsections] Error getting subsections for ${dirPath.join('/')}:`, error);
    return [];
  }
}

// Taxonomy functions
export async function getAllTags(lang?: string): Promise<{ name: string; count: number }[]> {
  const posts = await getSortedPostsData(lang);
  const tagCounts: Record<string, number> = {};
  
  posts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  
  return Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getAllCategories(lang?: string): Promise<{ name: string; count: number }[]> {
  const posts = await getSortedPostsData(lang);
  const categoryCounts: Record<string, number> = {};
  
  posts.forEach(post => {
    if (post.categories && Array.isArray(post.categories)) {
      post.categories.forEach(category => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
    }
  });
  
  return Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getAllAuthors(lang?: string): Promise<{ name: string; count: number }[]> {
  const posts = await getSortedPostsData(lang);
  const authorCounts: Record<string, number> = {};
  
  posts.forEach(post => {
    if (post.author) {
      const authors = Array.isArray(post.author) ? post.author : [post.author];
      authors.forEach(author => {
        if (author && author.trim()) {
          authorCounts[author] = (authorCounts[author] || 0) + 1;
        }
      });
    }
  });
  
  return Object.entries(authorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getPostsByTag(tag: string, lang?: string): Promise<PostPreview[]> {
  const posts = await getSortedPostsData(lang);
  return posts.filter(post => 
    post.tags && Array.isArray(post.tags) && post.tags.includes(tag)
  );
}

export async function getPostsByCategory(category: string, lang?: string): Promise<PostPreview[]> {
  const posts = await getSortedPostsData(lang);
  return posts.filter(post => 
    post.categories && Array.isArray(post.categories) && post.categories.includes(category)
  );
}

export async function getPostsByAuthor(author: string, lang?: string): Promise<PostPreview[]> {
  const posts = await getSortedPostsData(lang);
  return posts.filter(post => {
    if (!post.author) return false;
    const authors = Array.isArray(post.author) ? post.author : [post.author];
    return authors.includes(author);
  });
}

// Search function
export async function searchPosts(query: string, lang?: string): Promise<PostPreview[]> {
  const posts = await getSortedPostsData(lang);
  const lowercaseQuery = query.toLowerCase();
  
  return posts.filter(post => {
    const searchableContent = [
      post.title,
      post.excerpt || '',
      ...(post.tags || []),
      ...(post.categories || []),
      post.author || ''
    ].join(' ').toLowerCase();
    
    return searchableContent.includes(lowercaseQuery);
  });
}

export async function searchContentFiles(query: string, lang?: string): Promise<ContentFileDetails[]> {
  const allFiles = await getAllContentFiles(lang);
  const searchTerm = query.toLowerCase();
  
  return allFiles.filter(file => {
    const filenameMatch = file.filename.toLowerCase().includes(searchTerm);
    const pathMatch = file.relativePath.toLowerCase().includes(searchTerm);
    const extensionMatch = file.extension.toLowerCase().includes(searchTerm);
    const contentTypeMatch = file.contentType.toLowerCase().includes(searchTerm);
    
    return filenameMatch || pathMatch || extensionMatch || contentTypeMatch;
  });
}

// Related posts and navigation functions
export async function getRelatedPosts(currentPost: PostData, lang?: string, limit: number = 3): Promise<PostPreview[]> {
  const allPosts = await getSortedPostsData(lang);
  
  // Filter out the current post
  const otherPosts = allPosts.filter(post => post.id !== currentPost.id);
  
  // Score posts based on shared tags and categories
  const scoredPosts = otherPosts.map(post => {
    let score = 0;
    
    // Score for shared tags
    const currentTags = currentPost.tags || [];
    const postTags = post.tags || [];
    const sharedTags = currentTags.filter(tag => postTags.includes(tag));
    score += sharedTags.length * 3; // Weight tags heavily
    
    // Score for shared categories
    const currentCategories = currentPost.categories || [];
    const postCategories = post.categories || [];
    const sharedCategories = currentCategories.filter(category => postCategories.includes(category));
    score += sharedCategories.length * 2; // Weight categories moderately
    
    // Score for same author
    if (currentPost.author && post.author === currentPost.author) {
      score += 1;
    }
    
    return { ...post, score };
  });
  
  // Sort by score (descending) and take the top posts
  return scoredPosts
    .filter(post => post.score > 0) // Only posts with some relation
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function getAdjacentPosts(currentPost: PostData, lang?: string): Promise<{
  previousPost: PostPreview | null;
  nextPost: PostPreview | null;
}> {
  const allPosts = await getSortedPostsData(lang);
  
  // Find the current post index
  const currentIndex = allPosts.findIndex(post => post.id === currentPost.id);
  
  if (currentIndex === -1) {
    return { previousPost: null, nextPost: null };
  }
  
  // Get adjacent posts (posts are sorted by date descending)
  const previousPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  
  return { previousPost, nextPost };
}

// Pagination types and utilities
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedPosts {
  posts: PostPreview[];
  pagination: PaginationInfo;
}

export function calculatePagination(
  totalItems: number,
  currentPage: number,
  itemsPerPage: number = 10
): PaginationInfo {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  
  return {
    currentPage: validCurrentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    hasNextPage: validCurrentPage < totalPages,
    hasPreviousPage: validCurrentPage > 1,
  };
}

export async function getPaginatedPosts(
  langToFilter?: string,
  page: number = 1,
  itemsPerPage: number = 10
): Promise<PaginatedPosts> {
  const allPosts = await getSortedPostsData(langToFilter);
  const pagination = calculatePagination(allPosts.length, page, itemsPerPage);
  
  const startIndex = (pagination.currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const posts = allPosts.slice(startIndex, endIndex);
  
  return {
    posts,
    pagination,
  };
}

// Pagination for categories
export async function getPaginatedPostsByCategory(
  category: string,
  lang?: string,
  page: number = 1,
  itemsPerPage: number = 10
): Promise<PaginatedPosts> {
  const allPosts = await getPostsByCategory(category, lang);
  const pagination = calculatePagination(allPosts.length, page, itemsPerPage);
  
  const startIndex = (pagination.currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const posts = allPosts.slice(startIndex, endIndex);
  
  return {
    posts,
    pagination,
  };
}

// Pagination for tags
export async function getPaginatedPostsByTag(
  tag: string,
  lang?: string,
  page: number = 1,
  itemsPerPage: number = 10
): Promise<PaginatedPosts> {
  const allPosts = await getPostsByTag(tag, lang);
  const pagination = calculatePagination(allPosts.length, page, itemsPerPage);
  
  const startIndex = (pagination.currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const posts = allPosts.slice(startIndex, endIndex);
  
  return {
    posts,
    pagination,
  };
}

// Pagination for author posts
export async function getPaginatedPostsByAuthor(
  author: string,
  lang?: string,
  page: number = 1,
  itemsPerPage: number = 10
): Promise<PaginatedPosts> {
  const allPosts = await getPostsByAuthor(author, lang);
  const pagination = calculatePagination(allPosts.length, page, itemsPerPage);
  
  const startIndex = (pagination.currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const posts = allPosts.slice(startIndex, endIndex);
  
  return {
    posts,
    pagination,
  };
}

