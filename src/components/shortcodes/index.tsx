// src/components/shortcodes/index.tsx
// Shortcode Registry - Hugo-style shortcodes for Next.js

import { YouTube } from './YouTube';
import { Figure } from './Figure';
import { ImageGallery } from './ImageGallery';
import { TwitterEmbed } from './TwitterEmbed';
import { Instagram } from './Instagram';
import { QRCode } from './QRCode';
import { CodeBlock } from './CodeBlock';

// Named exports
export { YouTube } from './YouTube';
export { Figure } from './Figure';
export { ImageGallery } from './ImageGallery';
export { TwitterEmbed } from './TwitterEmbed';
export { Instagram } from './Instagram';
export { QRCode } from './QRCode';
export { CodeBlock } from './CodeBlock';

// Shortcode aliases for Hugo compatibility
export { TwitterEmbed as X } from './TwitterEmbed';
export { Figure as figure } from './Figure';
export { YouTube as youtube } from './YouTube';
export { Instagram as instagram } from './Instagram';
export { QRCode as qr } from './QRCode';
export { ImageGallery as gallery } from './ImageGallery';

// Default export with all shortcodes
export const shortcodes = {
  // Video embeds
  YouTube,
  youtube: YouTube,
  
  // Social media
  TwitterEmbed,
  X: TwitterEmbed,
  x: TwitterEmbed,
  Instagram,
  instagram: Instagram,
  
  // Images
  Figure,
  figure: Figure,
  ImageGallery,
  gallery: ImageGallery,
  
  // Utilities
  QRCode,
  qr: QRCode,
  CodeBlock,
  code: CodeBlock,
};

export default shortcodes;
