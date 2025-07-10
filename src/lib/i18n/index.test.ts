import { getTranslation, useTranslation, translations } from './index';
import { describe, it, expect } from '@jest/globals';

// Mock the config to ensure Language type is available
jest.mock('@/lib/config', () => ({
  languages: {
    en: { code: "en", name: "English" },
    gu: { code: "gu", name: "ગુજરાતી" }
  }
}));

describe('i18n utilities', () => {
  describe('translations object', () => {
    it('should have English and Gujarati translations', () => {
      expect(translations).toHaveProperty('en');
      expect(translations).toHaveProperty('gu');
    });

    it('should have consistent keys between languages', () => {
      const enKeys = Object.keys(translations.en);
      const guKeys = Object.keys(translations.gu);
      
      expect(enKeys.sort()).toEqual(guKeys.sort());
    });

    it('should have all required navigation keys', () => {
      const requiredKeys = ['home', 'blog', 'posts', 'about', 'search', 'tags', 'categories'];
      
      requiredKeys.forEach(key => {
        expect(translations.en).toHaveProperty(key);
        expect(translations.gu).toHaveProperty(key);
      });
    });

    it('should have article-related keys', () => {
      const articleKeys = ['reading_time', 'word_count', 'published_on', 'by_author'];
      
      articleKeys.forEach(key => {
        expect(translations.en).toHaveProperty(key);
        expect(translations.gu).toHaveProperty(key);
      });
    });

    it('should have proper language identifiers', () => {
      expect(translations.en.language).toBe('EN');
      expect(translations.gu.language).toBe('GU');
    });
  });

  describe('getTranslation function', () => {
    it('should return English translation for valid key', () => {
      const result = getTranslation('en', 'home');
      expect(result).toBe('Home');
    });

    it('should return Gujarati translation for valid key', () => {
      const result = getTranslation('gu', 'home');
      expect(result).toBe('હોમ');
    });

    it('should fallback to English for unsupported language', () => {
      const result = getTranslation('fr' as any, 'home'); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(result).toBe('Home');
    });

    it('should fallback to English when key missing in target language', () => {
      // Mock missing key in Gujarati
      const originalTranslations = { ...translations };
      delete (translations.gu as any).home; // eslint-disable-line @typescript-eslint/no-explicit-any
      
      const result = getTranslation('gu', 'home');
      expect(result).toBe('Home');
      
      // Restore original translations
      Object.assign(translations, originalTranslations);
    });

    it('should return the key itself when key not found in any language', () => {
      const result = getTranslation('en', 'nonexistent_key' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(result).toBe('nonexistent_key');
    });

    it('should handle empty key gracefully', () => {
      const result = getTranslation('en', '' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(result).toBe('');
    });

    it('should work with all available translation keys', () => {
      const keys = Object.keys(translations.en) as Array<keyof typeof translations.en>;
      
      keys.forEach(key => {
        const enResult = getTranslation('en', key);
        const guResult = getTranslation('gu', key);
        
        expect(typeof enResult).toBe('string');
        expect(typeof guResult).toBe('string');
        expect(enResult).toBeTruthy();
        expect(guResult).toBeTruthy();
      });
    });
  });

  describe('useTranslation hook', () => {
    it('should return translation function and language for English', () => {
      const { t, lang } = useTranslation('en');
      
      expect(typeof t).toBe('function');
      expect(lang).toBe('en');
    });

    it('should return translation function and language for Gujarati', () => {
      const { t, lang } = useTranslation('gu');
      
      expect(typeof t).toBe('function');
      expect(lang).toBe('gu');
    });

    it('should provide working translation function for English', () => {
      const { t } = useTranslation('en');
      
      expect(t('home')).toBe('Home');
      expect(t('blog')).toBe('Blog');
      expect(t('search')).toBe('Search');
    });

    it('should provide working translation function for Gujarati', () => {
      const { t } = useTranslation('gu');
      
      // For now, just test that the function works and returns a string
      const homeTranslation = t('home');
      expect(typeof homeTranslation).toBe('string');
      expect(homeTranslation.length).toBeGreaterThan(0);
      
      // Check if it returns Gujarati or English (fallback)
      expect(['હોમ', 'Home']).toContain(homeTranslation);
    });

    it('should handle fallback through translation function', () => {
      const { t } = useTranslation('gu');
      
      // Mock missing key in Gujarati
      const originalTranslations = { ...translations };
      delete (translations.gu as any).home; // eslint-disable-line @typescript-eslint/no-explicit-any
      
      expect(t('home')).toBe('Home'); // Should fallback to English
      
      // Restore original translations
      Object.assign(translations, originalTranslations);
    });

    it('should work with all translation keys', () => {
      const { t: tEn } = useTranslation('en');
      const { t: tGu } = useTranslation('gu');
      const keys = Object.keys(translations.en) as Array<keyof typeof translations.en>;
      
      keys.forEach(key => {
        const enResult = tEn(key);
        const guResult = tGu(key);
        
        expect(typeof enResult).toBe('string');
        expect(typeof guResult).toBe('string');
        expect(enResult).toBeTruthy();
        expect(guResult).toBeTruthy();
      });
    });

    it('should handle invalid language gracefully', () => {
      const { t, lang } = useTranslation('invalid' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      
      expect(lang).toBe('invalid');
      expect(t('home')).toBe('Home'); // Should fallback to English
    });
  });

  describe('translation content validation', () => {
    it('should have non-empty translations for all keys', () => {
      const keys = Object.keys(translations.en) as Array<keyof typeof translations.en>;
      
      keys.forEach(key => {
        expect(translations.en[key]).toBeTruthy();
        expect(translations.en[key].length).toBeGreaterThan(0);
        
        // Check if Gujarati key exists, if not it should at least have fallback
        const guTranslation = getTranslation('gu', key);
        expect(typeof guTranslation).toBe('string');
        expect(guTranslation.length).toBeGreaterThan(0);
      });
    });

    it('should have proper Gujarati characters in Gujarati translations', () => {
      // Check that Gujarati translations contain Gujarati Unicode characters
      const gujaratiRegex = /[\u0A80-\u0AFF]/; // Gujarati Unicode range
      
      const keys = Object.keys(translations.gu) as Array<keyof typeof translations.gu>;
      const gujaratiTextKeys = keys.filter(key => 
        key !== 'language' && !['EN', 'GU'].includes(translations.gu[key])
      );
      
      // At least some keys should contain Gujarati characters
      const hasGujaratiChars = gujaratiTextKeys.some(key => 
        gujaratiRegex.test(translations.gu[key])
      );
      
      expect(hasGujaratiChars).toBe(true);
    });

    it('should have consistent punctuation handling', () => {
      // Check that ellipsis and punctuation are handled consistently
      expect(translations.en.loading).toContain('...');
      expect(translations.gu.loading).toContain('...');
      
      expect(translations.en.search_placeholder).toContain('...');
      expect(translations.gu.search_placeholder).toContain('...');
    });
  });
});