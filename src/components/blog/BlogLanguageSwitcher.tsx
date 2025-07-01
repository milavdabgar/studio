// src/components/blog/BlogLanguageSwitcher.tsx
"use client";

import { useLanguage } from '@/lib/contexts/LanguageContext';
import { languages, Language } from '@/lib/config';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export function BlogLanguageSwitcher() {
  const { language, setLanguage, availableLanguages } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLang: Language) => {
    // Update the context state
    setLanguage(newLang);
    
    // Handle URL navigation
    if (pathname) {
      // Check if current path is a blog-related URL pattern
      const pathSegments = pathname.split('/').filter(Boolean);
      
      if (pathSegments.length > 0 && ['posts', 'tags', 'categories', 'search'].includes(pathSegments[0])) {
        // Replace the language in the URL
        // Current URL: /posts/en/some/path or /tags/gu/some/path
        // New URL: /posts/newLang/some/path or /tags/newLang/some/path
        const newPathSegments = [pathSegments[0], newLang, ...pathSegments.slice(2)];
        const newPath = '/' + newPathSegments.join('/');
        router.push(newPath);
      } else {
        // For non-blog pages, redirect to the blog home for the new language
        router.push(`/posts/${newLang}`);
      }
    } else {
      // Fallback: redirect to blog home
      router.push(`/posts/${newLang}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Switch language">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={language === lang ? "bg-accent" : ""}
          >
            <span className="mr-2">{languages[lang].flag}</span>
            <span>{languages[lang].displayName}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
