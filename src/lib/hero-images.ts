// src/lib/hero-images.ts
import { PostPreview, PostData } from './types';

/**
 * Get hero image from post frontmatter following Hugo conventions
 * Hugo uses 'featured' field in frontmatter or auto-detects 'featured.*' files
 * The auto-detection is handled during post processing in markdown.ts
 */
export function getHeroImage(post: PostPreview | PostData): string | null {
  // Check if featured image is specified in frontmatter or auto-detected
  const featured = (post as any).featured;
  if (featured && typeof featured === 'string') {
    return featured;
  }
  
  return null;
}

/**
 * Resolve hero image path to content-images API URL
 * Handles both relative and absolute paths within content directory
 */
export function resolveHeroImageUrl(imagePath: string, postId: string): string {
  if (!imagePath) return '';
  
  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http') || imagePath.startsWith('/api/')) {
    return imagePath;
  }
  
  // For relative paths, resolve relative to the post's directory
  if (!imagePath.startsWith('/')) {
    const postDir = postId.split('/').slice(0, -1).join('/');
    return `/api/content-images/${postDir}/${imagePath}`;
  }
  
  // For absolute paths within content, use content-images API
  return `/api/content-images${imagePath}`;
}

/**
 * Get fully resolved hero image URL for a post
 */
export function getHeroImageUrl(post: PostPreview | PostData): string | null {
  const heroImage = getHeroImage(post);
  if (!heroImage) return null;
  
  return resolveHeroImageUrl(heroImage, post.id);
}

/**
 * Check if post has a hero image
 */
export function hasHeroImage(post: PostPreview | PostData): boolean {
  return getHeroImage(post) !== null;
}