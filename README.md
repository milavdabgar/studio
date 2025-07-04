# Government Polytechnic Palanpur - Digital Platform

A comprehensive Next.js application for Government Polytechnic Palanpur, featuring a modern blog system, educational resources, and multilingual support.

## Features

- 🌐 **Multilingual Support** - English and Gujarati
- 📝 **Blog System** - Dynamic markdown-based blog with 30+ technical articles and 650+ study materials
- 🎓 **Educational Resources** - Study materials, newsletters, and academic content
- 🔍 **Search & Navigation** - Advanced search, categorization, and filtering
- 📱 **Responsive Design** - Mobile-first, modern UI with dark mode support
- ⚡ **Performance** - Optimized with Next.js 15, static generation, and Docker deployment

## Blog Content

The platform includes technical blog posts covering:
- Linux (Arch, Manjaro) installation and configuration
- Data Science and Machine Learning tutorials
- Programming guides (Python, OpenCV)
- Server setup and management (Nextcloud, OwnCloud)
- Educational tools and automation

Plus comprehensive study materials with 650+ solution guides for:
- Electronics Engineering (11-EC) - All semesters
- Information Technology (16-IT) - All semesters  
- ICT (32-ICT) - All semesters
- General subjects (00-General) - Mathematics, Physics, Chemistry, Communication Skills
- Exam solutions from 2021-2025 in both English and Gujarati

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Content**: Markdown with frontmatter, KaTeX for math rendering
- **Database**: MongoDB with Mongoose
- **Deployment**: Docker with multi-stage builds
- **Infrastructure**: Docker Compose, automated CI/CD

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Blog System

Blog posts are stored in markdown format in the `content/blog/` directory with support for:
- Multilingual content (`.md` for English, `.gu.md` for Gujarati)
- Rich frontmatter metadata
- LaTeX math expressions with KaTeX
- Image and media embedding
- Cross-references and related posts

## Deployment

The application is deployed using Docker with automated builds triggered by GitHub Actions. The deployment includes:
- Multi-stage Docker builds for optimization
- Content synchronization and validation
- Health checks and rollback capabilities

## Recent Updates

- ✅ Fixed blog post loading issue in production environment
- ✅ Restored missing markdown content files
- ✅ Verified Docker build process with complete content inclusion
- ✅ All 30+ blog posts now displaying correctly on production site
- ✅ Included 650+ study materials in blog system (exam solutions, course materials)
- ✅ Removed duplicate GitHub Actions workflows to prevent double deployments

Last updated: July 4, 2025
