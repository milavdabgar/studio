# Spectrum Newsletter Integration

This document describes how the Spectrum newsletter has been integrated into the Next.js application using the existing content converter system.

## 🎯 Overview

The Spectrum newsletter migration leverages your existing `ContentConverterV2` system to provide multi-format export capabilities for newsletters. This allows for easy distribution in PDF (primary), Word, RTF, HTML, and Markdown formats.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── newsletters/
│   │       ├── route.ts              # Main newsletter export API
│   │       └── list/route.ts         # Newsletter listing API
│   └── newsletters/
│       └── spectrum/
│           └── page.tsx              # Newsletter viewer page
├── lib/
│   └── newsletter-converter.ts       # Extended converter for newsletters
└── content/
    └── newsletters/
        └── spectrum-band-3-2023-24.md # Newsletter content
```

## 🚀 How to Use

### 1. View Newsletter
Navigate to: `/newsletters/spectrum`

### 2. Export Newsletter
The page provides buttons to export in multiple formats:
- **PDF** (Recommended) - High-quality with preserved styling
- **Word Document** - Microsoft Word compatible
- **HTML** - Web page format
- **RTF** - Universal rich text format
- **Markdown** - Plain text with formatting

### 3. API Usage

#### Export Newsletter
```bash
POST /api/newsletters
Content-Type: application/json

{
  "slug": "spectrum-band-3-2023-24",
  "format": "pdf",
  "lang": "en",
  "options": {
    "includeTableOfContents": true,
    "customStyles": true
  }
}
```

#### List Available Newsletters
```bash
GET /api/newsletters/list
```

## 🔧 Technical Details

### Newsletter Converter Extension
The `NewsletterConverter` class extends `ContentConverterV2` with newsletter-specific features:
- Automatic header generation
- Table of contents creation
- Contact information footer
- Newsletter-optimized PDF settings

### Content Structure
Newsletter content is stored as Markdown files with frontmatter:

```markdown
---
title: "Spectrum Newsletter - Band III"
author: "EC Department, Government Polytechnic Palanpur"
date: "2024-06-30"
edition: "Band III"
academic_year: "2023-24"
department: "Electronics & Communication Engineering"
---

# Newsletter Content Here...
```

### Export Features
- **PDF**: Optimized for print with proper page breaks
- **Word**: Structured document with images and formatting
- **RTF**: Universal format for maximum compatibility
- **HTML**: Web-optimized with responsive design
- **Markdown**: Source format for version control

## 📝 Adding New Newsletters

1. Create a new Markdown file in `content/newsletters/`
2. Include proper frontmatter with metadata
3. Write content using standard Markdown
4. The newsletter will automatically appear in the system

### Example Filename Convention
- `spectrum-band-4-2024-25.md` - Next edition
- `spectrum-special-issue-2024.md` - Special edition
- `newsletter-department-annual-2024.md` - Other newsletters

## 🎨 Customization

### Styling
Newsletter-specific styles can be customized in the converter's HTML template generation.

### Export Options
Additional export formats can be added by extending the `NewsletterConverter` class.

### Contact Information
Default contact details are automatically added but can be customized per newsletter via frontmatter.

## 🔍 Testing

### Local Testing
1. Start the development server: `npm run dev`
2. Navigate to `/newsletters/spectrum`
3. Test different export formats
4. Check `/api/newsletters/list` for available newsletters

### Production Deployment
Ensure the following dependencies are available:
- Puppeteer for PDF generation
- Pandoc for Word/RTF export (optional)
- All required Node.js packages

## 💡 Benefits

1. **Reuses Existing Infrastructure**: Leverages your proven content converter system
2. **Multi-format Support**: One source, multiple output formats
3. **Professional Quality**: High-quality PDF output optimized for printing
4. **Easy Distribution**: Simple download interface for different formats
5. **Version Control**: Markdown source enables easy version tracking
6. **Scalable**: Easy to add new newsletters and editions

## 🔮 Future Enhancements

- **Admin Interface**: Content management system for editing newsletters
- **Email Distribution**: Automated newsletter distribution
- **Analytics**: Download tracking and usage statistics
- **Templates**: Newsletter template system for different departments
- **Multilingual Support**: Newsletter translations

## 📞 Support

For technical issues or questions about the newsletter system:
- Check the API endpoints for error responses
- Verify content file format and frontmatter
- Ensure all dependencies are properly installed
- Review console logs for debugging information
