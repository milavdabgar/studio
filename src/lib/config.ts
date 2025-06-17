// src/lib/config.ts

export const siteConfig = {
  name: "Milav",
  description: "Personal blog and study materials by Milav Dabgar",
  url: "https://milav.in",
  ogImage: "/img/og-image.jpg",
  author: {
    name: "Milav Dabgar",
    email: "milav.dabgar@gmail.com",
    avatar: "/img/milav-avtar.jpeg",
    bio: "Lecturer in Electronics and Communication Engineering",
    links: {
      linkedin: "https://www.linkedin.com/in/milavdabgar/",
      github: "https://github.com/milavdabgar",
      instagram: "https://www.instagram.com/milav.dabgar/",
      youtube: "https://www.youtube.com/@milav.dabgar",
      facebook: "https://www.facebook.com/milav.dabgar",
      twitter: "https://twitter.com/milav_dabgar",
      whatsapp: "https://wa.me/918128576285",
      email: "mailto:milav.dabgar@gmail.com"
    }
  }
};

export const languages = {
  en: {
    code: "en",
    name: "English",
    displayName: "English",
    direction: "ltr",
    flag: "🇺🇸"
  },
  gu: {
    code: "gu", 
    name: "ગુજરાતી",
    displayName: "ગુજરાતી",
    direction: "ltr",
    flag: "🇮🇳"
  }
} as const;

export type Language = keyof typeof languages;
export const defaultLanguage: Language = "en";
export const availableLanguages = Object.keys(languages) as Language[];

export const blogConfig = {
  postsPerPage: 10,
  showExcerpts: true,
  showReadingTime: true,
  showAuthor: true,
  showTags: true,
  showCategories: true,
  enableSearch: true,
  enableComments: false,
  mainSections: ["blog"]
};
