
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
  id: string; // The "slug" including subdirectories, e.g., "blog/my-post" or "" for root _index
  fullPath: string;
  relativePath: string; // Relative to contentDirectory
}

function getAllMarkdownFilesRecursive(dir: string, baseDir: string = dir, currentPathParts: string[] = []): FileDetails[] {
  let files: FileDetails[] = [];
  if (!fs.existsSync(dir)) {
    console.warn(`[markdown.ts getAllMarkdownFilesRecursive] Directory not found, cannot read: ${dir}`);
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
      let lang = 'en';
      let baseNameWithoutLangSuffix = entry.name.substring(0, entry.name.length - 3); // remove .md

      const langMatch = baseNameWithoutLangSuffix.match(/\.([a-z]{2})$/);
      if (langMatch && availableLanguages.includes(langMatch[1])) {
        lang = langMatch[1];
        baseNameWithoutLangSuffix = baseNameWithoutLangSuffix.substring(0, baseNameWithoutLangSuffix.length - 3); // remove .[lang]
      }

      let slugPartsForFile: string[];
      let id: string;

      if (baseNameWithoutLangSuffix.toLowerCase() === '_index' || baseNameWithoutLangSuffix.toLowerCase() === 'index') {
        slugPartsForFile = [...currentPathParts];
        id = slugPartsForFile.join('/');
      } else {
        slugPartsForFile = [...currentPathParts, baseNameWithoutLangSuffix];
        id = slugPartsForFile.join('/');
      }
      
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


export async function getPostData(langParam: string, slugParts: string[]): Promise<PostData | null> {
  const normalizedSlug = slugParts.join('/');
  console.log(`\n[getPostData invoked] lang: "${langParam}", slugParts: ${JSON.stringify(slugParts)}, normalizedSlug: "${normalizedSlug}"`);
  console.log(`[getPostData] contentDirectory: ${contentDirectory}`);

  const baseSlugPathForFs = slugParts.join(path.sep); // Use platform-specific separator for fs operations
  console.log(`[getPostData] baseSlugPathForFs: "${baseSlugPathForFs}"`);

  const possibleFileChecks: { filePathToCheck: string, resolvedLang: string, description: string }[] = [];

  // Case 1: Exact file match: content/blog/hello-world.en.md or content/blog/hello-world.md
  possibleFileChecks.push({
    filePathToCheck: path.join(contentDirectory, `${baseSlugPathForFs}.${langParam}.md`),
    resolvedLang: langParam,
    description: `Exact lang file: ${baseSlugPathForFs}.${langParam}.md`
  });
  if (langParam === 'en') {
    possibleFileChecks.push({
      filePathToCheck: path.join(contentDirectory, `${baseSlugPathForFs}.md`),
      resolvedLang: 'en',
      description: `Default English file: ${baseSlugPathForFs}.md`
    });
  }

  // Case 2: Index file in directory: content/blog/hello-world/_index.en.md or content/blog/hello-world/_index.md
  // This case applies if the slug itself represents a directory.
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
  
  // Diagnostic check: hardcoded path for the problematic file
  if (langParam === 'en' && normalizedSlug === 'blog/hello-world') {
      const hardcodedPath = path.join(contentDirectory, 'blog', 'hello-world.md');
      possibleFileChecks.push({
          filePathToCheck: hardcodedPath,
          resolvedLang: 'en',
          description: `[DIAGNOSTIC HARDCODED] ${hardcodedPath}`
      });
  }


  console.log(`[getPostData] Possible file paths to check (in order):`);
  possibleFileChecks.forEach((pfc, idx) => console.log(`  [${idx}] Desc: ${pfc.description}, Path: ${pfc.filePathToCheck}, Expected Lang: ${pfc.resolvedLang}`));

  let filePath: string | undefined;
  let resolvedLang = langParam;

  for (const check of possibleFileChecks) {
    console.log(`[getPostData] Checking for file existence and type: ${check.filePathToCheck}`);
    try {
      if (fs.existsSync(check.filePathToCheck)) {
        console.log(`[getPostData] Path EXISTS: ${check.filePathToCheck}`);
        if (fs.statSync(check.filePathToCheck).isFile()) {
            filePath = check.filePathToCheck;
            resolvedLang = check.resolvedLang;
            console.log(`[getPostData] File FOUND and IS A FILE: ${filePath}, Resolved Language: ${resolvedLang}`);
            break;
        } else {
            console.log(`[getPostData] Path exists but IS NOT A FILE: ${check.filePathToCheck}`);
        }
      } else {
        // console.log(`[getPostData] Path DOES NOT EXIST: ${check.filePathToCheck}`);
      }
    } catch(e: any) {
      console.warn(`[getPostData] Error during fs.existsSync or fs.statSync for ${check.filePathToCheck}: ${e.message}`);
    }
  }

  if (!filePath) {
    console.error(`\n🛑🛑🛑 [getPostData] FILE NOT FOUND! 🛑🛑🛑`);
    console.error(`Original slug: "${normalizedSlug}", Lang: "${langParam}"`);
    console.error(`Based on slugParts: ${JSON.stringify(slugParts)}`);
    console.error(`Content Directory: ${contentDirectory}`);
    console.error(`Checked paths (absolute values logged above).`);
    return null;
  }

  // --- Start processing file ---
  try {
    console.log(`[getPostData] Reading file contents from: ${filePath}`);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    console.log(`[getPostData] Successfully read file: ${filePath}. Length: ${fileContents.length}.`);
    console.log(`[getPostData] Content snippet (first 100 chars): "${fileContents.substring(0,100).replace(/\n/g, '\\n')}"`);


    let matterResult;
    try {
      matterResult = matter(fileContents);
      console.log(`[getPostData] Successfully parsed frontmatter for: ${filePath}. Title: ${matterResult.data.title}`);
    } catch (e: any) {
      console.error(`[getPostData] CRITICAL ERROR parsing frontmatter for file ${filePath}. Error:`, e);
      return null; 
    }

    let contentToProcess = matterResult.content;
    // console.log(`[getPostData] Content before shortcode removal for ${filePath} (first 100 chars): ${contentToProcess.substring(0, 100)}`);

    contentToProcess = contentToProcess.replace(/{{<.*?>.*?{{\s*<\s*\/\s*.*?\s*>\s*}}/gs, (match) => `<!-- HUGO_PAIRED_SHORTCODE_FILTERED: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`);
    contentToProcess = contentToProcess.replace(/{{<.*?>}}/g, (match) => `<!-- HUGO_SINGLE_SHORTCODE_FILTERED: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`);
    contentToProcess = contentToProcess.replace(/{{%(?:.|\n)*?%}}/gs, (match) => `<!-- HUGO_PERCENT_SHORTCODE_FILTERED: ${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')} -->`);
    // console.log(`[getPostData] Content after shortcode removal for ${filePath} (first 100 chars): ${contentToProcess.substring(0, 100)}`);


    let processedContent;
    try {
      // console.log(`[getPostData] Starting remark processing for: ${filePath}`);
      processedContent = await remark()
        .use(gfm)
        .use(remarkMath)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeKatex, { output: 'htmlAndMathml', throwOnError: false })
        .use(rehypeStringify, { allowDangerousHtml: true })
        .process(contentToProcess);
      console.log(`[getPostData] Successfully processed markdown to HTML for: ${filePath}`);
    } catch (e: any) {
      console.error(`[getPostData] CRITICAL ERROR during remark/rehype processing for file ${filePath}. Error:`, e);
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
  } catch (error: any) {
    console.error(`[getPostData] OVERALL CRITICAL ERROR processing file ${filePath}. Error:`, error);
    console.error(`Stack trace: ${error.stack}`);
    return null;
  }
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

      let contentForExcerpt = matterResult.content;
      contentForExcerpt = contentForExcerpt.replace(/{{<.*?>.*?{{\s*<\s*\/\s*.*?\s*>\s*}}/gs, '[Shortcode Block]');
      contentForExcerpt = contentForExcerpt.replace(/{{<.*?>}}/g, '[Shortcode]');
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
        href: `/posts/${fileDetail.lang}/${fileDetail.id || ''}`.replace(/\/$/, ''), // Ensure no trailing slash for root index
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

export function getAllPostSlugsForStaticParams(): Array<{ lang: string; slugParts: string[] } > {
  try {
    // console.log("[getAllPostSlugsForStaticParams] Starting. Content directory:", contentDirectory);
    const allFileDetails = getAllMarkdownFilesRecursive(contentDirectory);
    // console.log(`[getAllPostSlugsForStaticParams] Found ${allFileDetails.length} raw file details.`);

    const validSlugs = allFileDetails.map(fileDetail => {
      // For a root index like /posts/en/, id is "" and slugParts should be []
      // For /posts/en/blog, id is "blog", slugParts is ['blog']
      // For /posts/en/blog/my-post, id is "blog/my-post", slugParts is ['blog', 'my-post']
      return {
        lang: fileDetail.lang,
        slugParts: fileDetail.slugParts, 
      };
    });
    // console.log(`[getAllPostSlugsForStaticParams] Processed ${validSlugs.length} valid slugs for static params.`);
    return validSlugs;
  } catch (e: any) {
    console.error("[getAllPostSlugsForStaticParams] CRITICAL ERROR generating static params:", e);
    return [];
  }
}
