import { cn } from './utils';
import { describe, it, expect } from '@jest/globals';

describe('utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('bg-red-500', 'text-white');
      expect(result).toContain('bg-red-500');
      expect(result).toContain('text-white');
    });

    it('should handle conditional class names', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
    });

    it('should handle false conditional class names', () => {
      const isActive = false;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).not.toContain('active-class');
    });

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      // twMerge should keep only the last conflicting class
      expect(result).not.toContain('bg-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('should handle empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle null and undefined inputs', () => {
      const result = cn('base', null, undefined, 'other');
      expect(result).toContain('base');
      expect(result).toContain('other');
    });

    it('should handle array inputs', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('should handle object inputs', () => {
      const result = cn({
        'active': true,
        'inactive': false,
        'base': true
      });
      expect(result).toContain('active');
      expect(result).not.toContain('inactive');
      expect(result).toContain('base');
    });

    it('should handle complex mixed inputs', () => {
      const isActive = true;
      const isPrimary = false;
      const result = cn(
        'btn',
        ['text-sm', 'font-medium'],
        {
          'btn-primary': isPrimary,
          'btn-active': isActive
        },
        isActive && 'active-state',
        null,
        undefined
      );
      expect(result).toContain('btn');
      expect(result).toContain('text-sm');
      expect(result).toContain('font-medium');
      expect(result).toContain('btn-active');
      expect(result).toContain('active-state');
      expect(result).not.toContain('btn-primary');
    });
  });
});