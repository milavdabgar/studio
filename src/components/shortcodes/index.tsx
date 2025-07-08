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

// Re-export shortcodes (imports handled in re-export section below)

// Re-export extended shortcodes (imports handled in re-export section below)

// Named exports - Blowfish shortcodes (exact API compatibility)
export { Alert } from './Alert';
export { Badge } from './Badge';
export { Button } from './Button';
export { Timeline } from './Timeline';
export { TimelineItem } from './TimelineItem';
export { GitHub } from './GitHub';
export { Mermaid } from './Mermaid';
export { Icon } from './Icon';
export { Lead } from './Lead';
export { Keyword } from './Keyword';
export { KeywordList } from './KeywordList';
export { TypeIt } from './TypeIt';
export { Swatches } from './Swatches';
export { YouTubeLite } from './YouTubeLite';
export { default as Article } from './Article';
export { Chart } from './Chart';

// New Blowfish shortcodes exports
export { default as BlowfishCarousel } from './BlowfishCarousel';
export { default as CodeImporter } from './CodeImporter';
export { default as Codeberg } from './Codeberg';
export { default as Forgejo } from './Forgejo';
export { default as Gist } from './Gist';
export { default as Gitea } from './Gitea';
export { default as GitLab } from './GitLab';
export { default as KaTeX } from './KaTeX';
export { default as List } from './List';
export { default as Gallery } from './Gallery';
export { default as LTR } from './LTR';
export { default as RTL } from './RTL';
export { default as MDImporter } from './MDImporter';
export { default as Ref } from './Ref';

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
export { Icon as icon } from './Icon';
export { Lead as lead } from './Lead';
export { Keyword as keyword } from './Keyword';
export { KeywordList as keywordList } from './KeywordList';
export { TypeIt as typeit } from './TypeIt';
export { Swatches as swatches } from './Swatches';
export { YouTubeLite as youtubeLite } from './YouTubeLite';

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
