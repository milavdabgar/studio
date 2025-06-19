// src/components/shortcodes/index.tsx
// Shortcode Registry - Hugo-style shortcodes for Next.js

import { YouTube } from './YouTube';
import { Figure } from './Figure';
import { ImageGallery } from './ImageGallery';
import { TwitterEmbed } from './TwitterEmbed';
import { Instagram } from './Instagram';
import { QRCode } from './QRCode';
import { CodeBlock } from './CodeBlock';
import { Carousel } from './Carousel';

// Blowfish shortcodes
import { Alert } from './Alert';
import { Badge } from './Badge';
import { Button } from './Button';
import { Timeline } from './Timeline';
import { TimelineItem } from './TimelineItem';
import { GitHub } from './GitHub';
import { Mermaid } from './Mermaid';

// Named exports - Blowfish shortcodes (exact API compatibility)
export { Alert } from './Alert';
export { Badge } from './Badge';
export { Button } from './Button';
export { Timeline } from './Timeline';
export { TimelineItem } from './TimelineItem';
export { GitHub } from './GitHub';
export { Mermaid } from './Mermaid';

// Named exports - Original shortcodes
export { YouTube } from './YouTube';
export { Figure } from './Figure';
export { ImageGallery } from './ImageGallery';
export { TwitterEmbed } from './TwitterEmbed';
export { Instagram } from './Instagram';
export { QRCode } from './QRCode';
export { CodeBlock } from './CodeBlock';
export { Carousel } from './Carousel';

// Shortcode aliases for Hugo compatibility
export { TwitterEmbed as X } from './TwitterEmbed';
export { Figure as figure } from './Figure';
export { YouTube as youtube } from './YouTube';
export { Instagram as instagram } from './Instagram';
export { QRCode as qr } from './QRCode';
export { ImageGallery as gallery } from './ImageGallery';
export { Carousel as carousel } from './Carousel';

// Blowfish shortcode aliases (lowercase)
export { Alert as alert } from './Alert';
export { Badge as badge } from './Badge';
export { Button as button } from './Button';
export { Timeline as timeline } from './Timeline';
export { TimelineItem as timelineItem } from './TimelineItem';
export { GitHub as github } from './GitHub';
export { Mermaid as mermaid } from './Mermaid';

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
  Carousel,
  carousel: Carousel,
  
  // Utilities
  QRCode,
  qr: QRCode,
  CodeBlock,
  code: CodeBlock,
};

export default shortcodes;
