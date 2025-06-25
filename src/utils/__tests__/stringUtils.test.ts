import {
  truncate,
  capitalize,
  toCamelCase,
  toKebabCase,
  toTitleCase,
  generateId,
  isEmail,
  isURL,
  stripHtml,
  countWords,
  removeAccents
} from '../stringUtils';

describe('String Utilities', () => {
  describe('truncate', () => {
    it('truncates string with default length', () => {
      expect(truncate('This is a long string')).toBe('This is a long string');
      expect(truncate('This is a long string', 10)).toBe('This is a...');
    });

    it('handles custom ellipsis', () => {
      expect(truncate('This is a long string', 10, '***')).toBe('This is a***');
    });

    it('returns empty string for non-string input', () => {
      // @ts-expect-error Testing invalid input
      expect(truncate(null)).toBe('');
      // @ts-expect-error Testing invalid input
      expect(truncate(undefined)).toBe('');
      // @ts-expect-error Testing invalid input
      expect(truncate(123)).toBe('');
    });
  });

  describe('capitalize', () => {
    it('capitalizes the first letter of a string', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('hello world')).toBe('Hello world');
      expect(capitalize('')).toBe('');
      // @ts-expect-error Testing invalid input
      expect(capitalize(null)).toBe('');
    });
  });

  describe('toCamelCase', () => {
    it('converts strings to camelCase', () => {
      expect(toCamelCase('hello-world')).toBe('helloWorld');
      expect(toCamelCase('hello_world')).toBe('helloWorld');
      expect(toCamelCase('Hello World')).toBe('helloWorld');
      expect(toCamelCase('hello-world_example text')).toBe('helloWorldExampleText');
    });
  });

  describe('toKebabCase', () => {
    it('converts strings to kebab-case', () => {
      expect(toKebabCase('helloWorld')).toBe('hello-world');
      expect(toKebabCase('HelloWorld')).toBe('hello-world');
      expect(toKebabCase('hello world')).toBe('hello-world');
      expect(toKebabCase('hello_world_example')).toBe('hello-world-example');
    });
  });

  describe('toTitleCase', () => {
    it('converts strings to Title Case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
      expect(toTitleCase('hello-world')).toBe('Hello World');
      expect(toTitleCase('hello_world')).toBe('Hello World');
      expect(toTitleCase('helloWorld')).toBe('Hello World');
      expect(toTitleCase('hello  world')).toBe('Hello World');
    });
  });

  describe('generateId', () => {
    it('generates a string of specified length', () => {
      expect(generateId(10)).toHaveLength(10);
      expect(generateId(20)).toHaveLength(20);
      expect(typeof generateId()).toBe('string');
    });

    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('isEmail', () => {
    it('validates email addresses', () => {
      expect(isEmail('test@example.com')).toBe(true);
      expect(isEmail('user.name@domain.co.uk')).toBe(true);
      expect(isEmail('user+tag@example.com')).toBe(true);
      expect(isEmail('plainaddress')).toBe(false);
      expect(isEmail('@missingusername.com')).toBe(false);
      expect(isEmail('user@.com')).toBe(false);
    });
  });

  describe('isURL', () => {
    it('validates URLs', () => {
      expect(isURL('https://example.com')).toBe(true);
      expect(isURL('http://example.com/path?query=string')).toBe(true);
      expect(isURL('www.example.com')).toBe(true);
      expect(isURL('not-a-url')).toBe(false);
      expect(isURL('https://')).toBe(false);
    });
  });

  describe('stripHtml', () => {
    it('removes HTML tags from strings', () => {
      expect(stripHtml('<p>Hello World</p>')).toBe('Hello World');
      expect(stripHtml('<div><h1>Title</h1><p>Content</p></div>')).toBe('TitleContent');
      expect(stripHtml('No HTML here')).toBe('No HTML here');
      expect(stripHtml('')).toBe('');
    });
  });

  describe('countWords', () => {
    it('counts words in a string', () => {
      expect(countWords('Hello world')).toBe(2);
      expect(countWords('  Multiple   spaces   ')).toBe(2);
      expect(countWords('')).toBe(0);
      expect(countWords('Hello, world! This is a test.')).toBe(6);
    });
  });

  describe('removeAccents', () => {
    it('removes diacritics from characters', () => {
      expect(removeAccents('Café')).toBe('Cafe');
      expect(removeAccents('Héllò Wörld')).toBe('Hello World');
      expect(removeAccents('àáâãäåçèéêëìíîïñòóôõöùúûüýÿ')).toBe('aaaaaaceeeeiiiinooooouuuuyy');
      expect(removeAccents('No accents here')).toBe('No accents here');
    });
  });
});
