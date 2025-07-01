// src/components/blog/BlogLayout.tsx
"use client";

import { LanguageProvider } from '@/lib/contexts/LanguageContext';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { LanguageSync } from './LanguageSync';
import { PublicNav } from '@/components/public-nav';
import { Footer } from '@/components/footer';

interface BlogLayoutProps {
  children: React.ReactNode;
  currentLang: string;
}

export function BlogLayout({ children, currentLang }: BlogLayoutProps) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LanguageSync currentLang={currentLang} />
        <div className="flex flex-col min-h-screen">
          <PublicNav />
          
          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>

          <Footer />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
