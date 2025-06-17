// src/components/blog/BlogLayout.tsx
"use client";

import { LanguageProvider } from '@/lib/contexts/LanguageContext';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LanguageSync } from './LanguageSync';
import { ThemeToggle } from '../theme-toggle';
import { Button } from '@/components/ui/button';
import { Search, Home, Archive, Tag, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { siteConfig } from '@/lib/config';

interface BlogLayoutProps {
  children: React.ReactNode;
  currentLang: string;
}

export function BlogLayout({ children, currentLang }: BlogLayoutProps) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LanguageSync currentLang={currentLang} />
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              {/* Logo/Brand */}
              <Link href="/" className="mr-6 flex items-center space-x-2">
                <BookOpen className="h-6 w-6" />
                <span className="hidden font-bold sm:inline-block">
                  {siteConfig.name}
                </span>
              </Link>

              {/* Navigation */}
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <Link
                  href={`/posts/${currentLang}`}
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Blog
                </Link>
                <Link
                  href={`/tags/${currentLang}`}
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Tags
                </Link>
                <Link
                  href={`/categories/${currentLang}`}
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Categories
                </Link>
              </nav>

              {/* Right side actions */}
              <div className="ml-auto flex items-center space-x-2">
                <Button variant="ghost" size="icon" aria-label="Search" asChild>
                  <Link href={`/search/${currentLang}`}>
                    <Search className="h-[1.2rem] w-[1.2rem]" />
                  </Link>
                </Button>
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t py-6 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
              <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                  Built with ❤️ by{" "}
                  <Link
                    href={siteConfig.author.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-4"
                  >
                    {siteConfig.author.name}
                  </Link>
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {Object.entries(siteConfig.author.links).slice(0, 4).map(([platform, url]) => (
                  <Link
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <span className="sr-only">{platform}</span>
                    {/* You can add icons here for each platform */}
                  </Link>
                ))}
              </div>
            </div>
          </footer>
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
