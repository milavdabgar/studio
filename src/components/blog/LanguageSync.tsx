// src/components/blog/LanguageSync.tsx
"use client";

import { useEffect } from 'react';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { Language, availableLanguages } from '@/lib/config';

interface LanguageSyncProps {
  currentLang: string;
}

export function LanguageSync({ currentLang }: LanguageSyncProps) {
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    // Sync the context language with the URL language
    if (
      availableLanguages.includes(currentLang as Language) && 
      language !== currentLang
    ) {
      setLanguage(currentLang as Language);
    }
  }, [currentLang, language, setLanguage]);

  return null; // This component doesn't render anything
}
