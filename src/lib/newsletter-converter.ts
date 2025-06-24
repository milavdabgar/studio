/**
 * Newsletter Content Converter - Extension of ContentConverterV2
 * Specialized for newsletter layouts and multi-format export
 */

import { ContentConverterV2 } from './content-converter-v2';

interface NewsletterOptions {
  title?: string;
  author?: string;
  edition?: string;
  academicYear?: string;
  department?: string;
  logo?: string;
  headerImage?: string;
  contactInfo?: {
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  includeTableOfContents?: boolean;
  customStyles?: string;
}

export class NewsletterConverter extends ContentConverterV2 {
  
  async convertNewsletter(
    markdownContent: string, 
    format: string, 
    options: NewsletterOptions = {}
  ): Promise<Buffer | string> {
    
    // Enhanced options for newsletter-specific styling
    const enhancedOptions = {
      title: options.title || 'Newsletter',
      author: options.author || 'Department Newsletter',
      includeStyles: true,
      pdfOptions: {
        format: 'A4' as const,
        margin: {
          top: '15mm',
          right: '15mm', 
          bottom: '20mm',
          left: '15mm'
        },
        waitForNetwork: true,
        timeout: 45000
      }
    };

    // Use parent converter with newsletter-specific preprocessing
    const processedContent = await this.preprocessNewsletterContent(
      markdownContent, 
      options
    );
    
    return await this.convert(processedContent, format, enhancedOptions);
  }

  private async preprocessNewsletterContent(
    content: string, 
    options: NewsletterOptions
  ): Promise<string> {
    let processedContent = content;

    // Add newsletter header if not present
    if (!processedContent.includes('# Spectrum') && options.title) {
      const header = this.generateNewsletterHeader(options);
      processedContent = header + '\n\n' + processedContent;
    }

    // Add table of contents if requested
    if (options.includeTableOfContents) {
      const toc = this.generateTableOfContents(processedContent);
      processedContent = processedContent.replace(
        /(# .+\n)/,
        '$1\n' + toc + '\n\n---\n\n'
      );
    }

    // Add contact information footer
    if (options.contactInfo) {
      const footer = this.generateNewsletterFooter(options.contactInfo);
      processedContent += '\n\n---\n\n' + footer;
    }

    return processedContent;
  }

  private generateNewsletterHeader(options: NewsletterOptions): string {
    return `# ${options.title || 'Spectrum Newsletter'}

**${options.department || 'Electronics & Communication Engineering'}**  
*${options.edition || 'Current Edition'} | ${options.academicYear || new Date().getFullYear()}*

---`;
  }

  private generateTableOfContents(content: string): string {
    const headers = content.match(/^#{1,3}\s+(.+)$/gm) || [];
    
    let toc = '## Table of Contents\n\n';
    
    headers.forEach((header) => {
      const level = (header.match(/#/g) || []).length;
      const title = header.replace(/^#+\s+/, '');
      const indent = '  '.repeat(level - 1);
      const anchor = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      toc += `${indent}- [${title}](#${anchor})\n`;
    });

    return toc;
  }

  private generateNewsletterFooter(contactInfo: NewsletterOptions['contactInfo']): string {
    let footer = '## Contact Information\n\n';
    
    if (contactInfo?.address) {
      footer += `**Address:** ${contactInfo.address}\n\n`;
    }
    
    if (contactInfo?.phone) {
      footer += `**Phone:** ${contactInfo.phone}\n\n`;
    }
    
    if (contactInfo?.email) {
      footer += `**Email:** ${contactInfo.email}\n\n`;
    }
    
    if (contactInfo?.website) {
      footer += `**Website:** ${contactInfo.website}\n\n`;
    }

    footer += `---\n\n*Generated on ${new Date().toLocaleDateString('en-GB')} using Newsletter Content System*`;
    
    return footer;
  }
}
