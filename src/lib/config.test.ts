import { 
  siteConfig, 
  languages, 
  defaultLanguage, 
  availableLanguages, 
  blogConfig,
  type Language 
} from './config';
import { describe, it, expect } from '@jest/globals';

describe('Config Tests', () => {
  describe('siteConfig', () => {
    it('should have required site configuration properties', () => {
      expect(siteConfig).toHaveProperty('name');
      expect(siteConfig).toHaveProperty('description');
      expect(siteConfig).toHaveProperty('url');
      expect(siteConfig).toHaveProperty('ogImage');
      expect(siteConfig).toHaveProperty('author');
    });

    it('should have valid site name and URL', () => {
      expect(typeof siteConfig.name).toBe('string');
      expect(siteConfig.name).toBe('Milav');
      expect(typeof siteConfig.url).toBe('string');
      expect(siteConfig.url).toBe('https://milav.in');
    });

    it('should have author information', () => {
      expect(siteConfig.author).toHaveProperty('name');
      expect(siteConfig.author).toHaveProperty('email');
      expect(siteConfig.author).toHaveProperty('avatar');
      expect(siteConfig.author).toHaveProperty('bio');
      expect(siteConfig.author).toHaveProperty('links');
      
      expect(siteConfig.author.name).toBe('Milav Dabgar');
      expect(siteConfig.author.email).toBe('milav.dabgar@gmail.com');
    });

    it('should have author social links', () => {
      const links = siteConfig.author.links;
      expect(links).toHaveProperty('linkedin');
      expect(links).toHaveProperty('github');
      expect(links).toHaveProperty('instagram');
      expect(links).toHaveProperty('youtube');
      expect(links).toHaveProperty('facebook');
      expect(links).toHaveProperty('twitter');
      expect(links).toHaveProperty('whatsapp');
      expect(links).toHaveProperty('email');

      // Validate URLs
      expect(links.linkedin).toMatch(/^https:\/\/www\.linkedin\.com/);
      expect(links.github).toMatch(/^https:\/\/github\.com/);
      expect(links.instagram).toMatch(/^https:\/\/www\.instagram\.com/);
      expect(links.youtube).toMatch(/^https:\/\/www\.youtube\.com/);
      expect(links.facebook).toMatch(/^https:\/\/www\.facebook\.com/);
      expect(links.twitter).toMatch(/^https:\/\/twitter\.com/);
      expect(links.whatsapp).toMatch(/^https:\/\/wa\.me/);
      expect(links.email).toMatch(/^mailto:/);
    });
  });

  describe('languages', () => {
    it('should have English and Gujarati languages', () => {
      expect(languages).toHaveProperty('en');
      expect(languages).toHaveProperty('gu');
    });

    it('should have correct English language configuration', () => {
      const en = languages.en;
      expect(en.code).toBe('en');
      expect(en.name).toBe('English');
      expect(en.displayName).toBe('English');
      expect(en.direction).toBe('ltr');
      expect(en.flag).toBe('🇺🇸');
    });

    it('should have correct Gujarati language configuration', () => {
      const gu = languages.gu;
      expect(gu.code).toBe('gu');
      expect(gu.name).toBe('ગુજરાતી');
      expect(gu.displayName).toBe('ગુજરાતી');
      expect(gu.direction).toBe('ltr');
      expect(gu.flag).toBe('🇮🇳');
    });

    it('should have consistent language structure', () => {
      Object.values(languages).forEach(lang => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('displayName');
        expect(lang).toHaveProperty('direction');
        expect(lang).toHaveProperty('flag');
        
        expect(typeof lang.code).toBe('string');
        expect(typeof lang.name).toBe('string');
        expect(typeof lang.displayName).toBe('string');
        expect(typeof lang.direction).toBe('string');
        expect(typeof lang.flag).toBe('string');
        
        expect(lang.direction).toMatch(/^(ltr|rtl)$/);
        expect(lang.code).toMatch(/^[a-z]{2}$/);
      });
    });
  });

  describe('language configuration', () => {
    it('should have correct default language', () => {
      expect(defaultLanguage).toBe('en');
      expect(languages[defaultLanguage]).toBeDefined();
    });

    it('should have available languages array', () => {
      expect(Array.isArray(availableLanguages)).toBe(true);
      expect(availableLanguages).toContain('en');
      expect(availableLanguages).toContain('gu');
      expect(availableLanguages).toHaveLength(2);
    });

    it('should have available languages match languages object keys', () => {
      const languageKeys = Object.keys(languages);
      expect(availableLanguages.sort()).toEqual(languageKeys.sort());
    });

    it('should validate Language type', () => {
      // This is more of a compile-time check, but we can verify runtime behavior
      const testLang: Language = 'en';
      expect(languages[testLang]).toBeDefined();
      
      // Test that invalid language would be caught at compile time
      // const invalidLang: Language = 'fr'; // This would cause a TypeScript error
    });
  });

  describe('blogConfig', () => {
    it('should have required blog configuration properties', () => {
      expect(blogConfig).toHaveProperty('postsPerPage');
      expect(blogConfig).toHaveProperty('showExcerpts');
      expect(blogConfig).toHaveProperty('showReadingTime');
      expect(blogConfig).toHaveProperty('showAuthor');
      expect(blogConfig).toHaveProperty('showTags');
      expect(blogConfig).toHaveProperty('showCategories');
      expect(blogConfig).toHaveProperty('enableSearch');
      expect(blogConfig).toHaveProperty('enableComments');
      expect(blogConfig).toHaveProperty('mainSections');
    });

    it('should have valid numeric configuration', () => {
      expect(typeof blogConfig.postsPerPage).toBe('number');
      expect(blogConfig.postsPerPage).toBeGreaterThan(0);
      expect(blogConfig.postsPerPage).toBe(10);
    });

    it('should have boolean flags', () => {
      expect(typeof blogConfig.showExcerpts).toBe('boolean');
      expect(typeof blogConfig.showReadingTime).toBe('boolean');
      expect(typeof blogConfig.showAuthor).toBe('boolean');
      expect(typeof blogConfig.showTags).toBe('boolean');
      expect(typeof blogConfig.showCategories).toBe('boolean');
      expect(typeof blogConfig.enableSearch).toBe('boolean');
      expect(typeof blogConfig.enableComments).toBe('boolean');
      
      // Test specific values
      expect(blogConfig.showExcerpts).toBe(true);
      expect(blogConfig.showReadingTime).toBe(true);
      expect(blogConfig.showAuthor).toBe(true);
      expect(blogConfig.showTags).toBe(true);
      expect(blogConfig.showCategories).toBe(true);
      expect(blogConfig.enableSearch).toBe(true);
      expect(blogConfig.enableComments).toBe(false);
    });

    it('should have main sections array', () => {
      expect(Array.isArray(blogConfig.mainSections)).toBe(true);
      expect(blogConfig.mainSections).toContain('blog');
      expect(blogConfig.mainSections).toHaveLength(1);
    });
  });

  describe('configuration consistency', () => {
    it('should have consistent types across configuration objects', () => {
      // Ensure all config objects are properly structured
      expect(typeof siteConfig).toBe('object');
      expect(typeof languages).toBe('object');
      expect(typeof blogConfig).toBe('object');
      
      expect(siteConfig).not.toBeNull();
      expect(languages).not.toBeNull();
      expect(blogConfig).not.toBeNull();
    });

    it('should not have undefined or null required values', () => {
      expect(siteConfig.name).toBeTruthy();
      expect(siteConfig.description).toBeTruthy();
      expect(siteConfig.url).toBeTruthy();
      expect(siteConfig.author.name).toBeTruthy();
      expect(siteConfig.author.email).toBeTruthy();
      
      expect(defaultLanguage).toBeTruthy();
      expect(availableLanguages.length).toBeGreaterThan(0);
      
      expect(blogConfig.postsPerPage).toBeTruthy();
    });

    it('should have valid URL formats', () => {
      // Test main site URL
      expect(siteConfig.url).toMatch(/^https?:\/\/.+/);
      
      // Test author links (those that should be URLs)
      const urlLinks = [
        'linkedin', 'github', 'instagram', 'youtube', 
        'facebook', 'twitter', 'whatsapp'
      ];
      
      urlLinks.forEach(linkType => {
        const url = siteConfig.author.links[linkType as keyof typeof siteConfig.author.links];
        expect(url).toMatch(/^https?:\/\/.+/);
      });
      
      // Test email link
      expect(siteConfig.author.links.email).toMatch(/^mailto:.+@.+/);
    });
  });
});