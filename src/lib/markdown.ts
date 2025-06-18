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
import { PostData, PostPreview } from './types';

const contentDirectory = path.join(process.cwd(), 'content');
export const availableLanguages = ['en', 'gu'];

// Re-export types for backward compatibility
export type { PostData, PostPreview } from './types';

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
  
  // Extract better excerpt
  const excerpt = matterResult.data.excerpt || extractExcerpt(contentToProcess);
  
  // Normalize date to string format
  let normalizedDate = matterResult.data.date;
  
  if (normalizedDate instanceof Date) {
    normalizedDate = normalizedDate.toISOString();
  } else if (normalizedDate && typeof normalizedDate !== 'string') {
    try {
      normalizedDate = new Date(normalizedDate).toISOString();
    } catch (e) {
      console.warn('Failed to convert date, using current date:', e);
      normalizedDate = new Date().toISOString();
    }
  } else if (!normalizedDate) {
    normalizedDate = new Date().toISOString();
  }

  return {
    id: internalSlugParts.join('/') || '', 
    slugParts: internalSlugParts,
    lang: resolvedLang, 
    contentHtml,
    title: matterResult.data.title || path.basename(filePath, path.extname(filePath)).replace(/\.(en|gu)$/, '').replace(/^_index$|^index$/, internalSlugParts[internalSlugParts.length -1] || 'Section Index') || 'Untitled Post',
    date: normalizedDate,
    excerpt,
    tags: Array.isArray(matterResult.data.tags) ? matterResult.data.tags : [],
    categories: Array.isArray(matterResult.data.categories) ? matterResult.data.categories : [],
    series: matterResult.data.series || '',
    author: matterResult.data.author || '',
    draft: matterResult.data.draft || false,
    featured: matterResult.data.featured || false,
    readingTime: calculateReadingTime(contentToProcess),
    wordCount: calculateWordCount(contentToProcess),
    ...matterResult.data,
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

