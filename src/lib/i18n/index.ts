// src/lib/i18n/index.ts

import { Language } from '@/lib/config';

export type TranslationKey = keyof typeof translations.en;

export const translations = {
  en: {
    // Global
    language: "EN",
    
    // Navigation
    home: "Home",
    blog: "Blog",
    posts: "Posts",
    about: "About",
    search: "Search",
    tags: "Tags",
    categories: "Categories",
    
    // Article
    reading_time: "reading time",
    word_count: "words",
    part_of_series: "This article is part of a series.",
    related_articles: "Related Articles",
    published_on: "Published on",
    updated_on: "Updated on",
    by_author: "by",
    
    // Metadata
    minutes: "minutes",
    minute: "minute",
    
    // Actions
    back_to_all_posts: "Back to all posts",
    back_to_home: "Back to Home",
    read_more: "Read more",
    view_all: "View all",
    
    // Status
    no_posts_found: "No posts found",
    no_results: "No results found",
    loading: "Loading...",
    draft: "Draft",
    
    // Theme
    toggle_theme: "Toggle theme",
    dark_mode: "Dark mode",
    light_mode: "Light mode",
    
    // Language
    switch_language: "Switch language",
    
    // Search
    search_placeholder: "Search posts...",
    search_results: "Search Results",
    search_results_for: "Search results for",
    
    // Footer
    powered_by: "Powered by",
    
    // Error
    error_404: "Page not found",
    error_404_description: "The page you're looking for doesn't exist.",
    go_home: "Go Home",
    
    // Additional keys
    date_not_available: "Date not available"
  },
  gu: {
    // Global
    language: "GU",
    
    // Navigation
    home: "હોમ",
    blog: "બ્લોગ", 
    posts: "પોસ્ટ્સ",
    about: "વિશે",
    search: "શોધ",
    tags: "ટેગ્સ",
    categories: "શ્રેણીઓ",
    
    // Article
    reading_time: "વાંચન સમય",
    word_count: "શબ્દો",
    part_of_series: "આ લેખ શ્રેણીનો એક ભાગ છે.",
    related_articles: "સંબંધિત લેખો",
    published_on: "પ્રકાશિત તારીખ",
    updated_on: "છેલ્લે અપડેટ કર્યું",
    by_author: "લેખક",
    
    // Metadata  
    minutes: "મિનિટ",
    minute: "મિનિટ",
    
    // Actions
    back_to_all_posts: "બધા લેખો પર પાછા જાઓ",
    back_to_home: "હોમ પર પાછા જાઓ", 
    read_more: "વધુ વાંચો",
    view_all: "બધું જુઓ",
    
    // Status
    no_posts_found: "કોઈ પોસ્ટ્સ મળ્યા નથી",
    no_results: "કોઈ પરિણામો મળ્યા નથી", 
    loading: "લોડ થઈ રહ્યું છે...",
    draft: "ડ્રાફ્ટ",
    
    // Theme
    toggle_theme: "થીમ ટૉગલ કરો",
    dark_mode: "ડાર્ક મોડ",
    light_mode: "લાઇટ મોડ",
    
    // Language
    switch_language: "ભાષા બદલો",
    
    // Search
    search_placeholder: "પોસ્ટ્સ શોધો...",
    search_results: "શોધ પરિણામો",
    search_results_for: "આના માટે શોધ પરિણામો",
    
    // Footer
    powered_by: "દ્વારા સંચાલિત",
    
    // Error
    error_404: "પેજ મળ્યું નથી",
    error_404_description: "તમે જે પેજ શોધી રહ્યા છો તે અસ્તિત્વમાં નથી.",
    go_home: "હોમ પર જાઓ",
    
    // Additional keys
    date_not_available: "તારીખ ઉપલબ્ધ નથી"
  }
} as const;

export function getTranslation(lang: Language, key: TranslationKey): string {
  return translations[lang]?.[key] || translations.en[key] || key;
}

export function useTranslation(lang: Language) {
  return {
    t: (key: TranslationKey) => getTranslation(lang, key),
    lang
  };
}
