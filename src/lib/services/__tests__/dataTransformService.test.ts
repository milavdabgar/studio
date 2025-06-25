import { DataTransformService } from '../dataTransformService';

describe('DataTransformService', () => {
  describe('normalizeResponse', () => {
    it('should normalize API response with data and meta', () => {
      const apiResponse = {
        data: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        meta: {
          total: 2,
          page: 1,
          limit: 10,
        },
      };

      const result = DataTransformService.normalizeResponse(apiResponse);

      expect(result).toEqual({
        entities: {
          items: {
            1: { id: 1, name: 'Item 1' },
            2: { id: 2, name: 'Item 2' },
          },
        },
        result: [1, 2],
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should handle nested data structures', () => {
      const apiResponse = {
        data: [
          {
            id: 1,
            title: 'Post 1',
            author: { id: 1, name: 'Author 1' },
            tags: [{ id: 1, name: 'Tech' }],
          },
        ],
      };

      const result = DataTransformService.normalizeResponse(apiResponse, {
        author: 'users',
        tags: 'tags',
      });

      expect(result).toEqual({
        entities: {
          posts: {
            1: {
              id: 1,
              title: 'Post 1',
              author: 1,
              tags: [1],
            },
          },
          users: {
            1: { id: 1, name: 'Author 1' },
          },
          tags: {
            1: { id: 1, name: 'Tech' },
          },
        },
        result: [1],
      });
    });
  });

  describe('denormalize', () => {
    it('should denormalize data from normalized state', () => {
      const normalizedData = {
        entities: {
          users: {
            1: { id: 1, name: 'User 1' },
            2: { id: 2, name: 'User 2' },
          },
          posts: {
            1: {
              id: 1,
              title: 'Post 1',
              author: 1,
            },
            2: {
              id: 2,
              title: 'Post 2',
              author: 2,
            },
          },
        },
        result: [1, 2],
      };

      const result = DataTransformService.denormalize(normalizedData, 'posts', [
        'author',
      ]);

      expect(result).toEqual([
        {
          id: 1,
          title: 'Post 1',
          author: { id: 1, name: 'User 1' },
        },
        {
          id: 2,
          title: 'Post 2',
          author: { id: 2, name: 'User 2' },
        },
      ]);
    });
  });

  describe('formatDateRange', () => {
    it('should format date range with same month', () => {
      const startDate = '2023-01-15';
      const endDate = '2023-01-20';
      
      const result = DataTransformService.formatDateRange(startDate, endDate);
      
      expect(result).toBe('Jan 15-20, 2023');
    });

    it('should format date range with different months', () => {
      const startDate = '2023-01-28';
      const endDate = '2023-02-05';
      
      const result = DataTransformService.formatDateRange(startDate, endDate);
      
      expect(result).toBe('Jan 28 - Feb 5, 2023');
    });

    it('should format date range with different years', () => {
      const startDate = '2023-12-28';
      const endDate = '2024-01-05';
      
      const result = DataTransformService.formatDateRange(startDate, endDate);
      
      expect(result).toBe('Dec 28, 2023 - Jan 5, 2024');
    });
  });

  describe('formatCurrency', () => {
    it('should format number as currency', () => {
      expect(DataTransformService.formatCurrency(1000)).toBe('$1,000.00');
      expect(DataTransformService.formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
      expect(DataTransformService.formatCurrency(500, 'JPY')).toBe('¥500');
    });
  });

  describe('truncateText', () => {
    it('should truncate text to specified length', () => {
      const text = 'This is a long text that needs to be truncated';
      
      expect(DataTransformService.truncateText(text, 10)).toBe('This is a...');
      expect(DataTransformService.truncateText(text, 20, '***')).toBe('This is a long text***');
    });

    it('should not truncate if text is shorter than max length', () => {
      const text = 'Short text';
      expect(DataTransformService.truncateText(text, 20)).toBe(text);
    });
  });

  describe('slugify', () => {
    it('should convert text to URL-friendly slug', () => {
      expect(DataTransformService.slugify('Hello World!')).toBe('hello-world');
      expect(DataTransformService.slugify('Test & Test 123')).toBe('test-test-123');
      expect(DataTransformService.slugify('Café au Lait')).toBe('cafe-au-lait');
    });
  });

  describe('parseQueryString', () => {
    it('should parse query string to object', () => {
      const query = '?page=1&limit=10&search=test&tags[]=1&tags[]=2';
      
      const result = DataTransformService.parseQueryString(query);
      
      expect(result).toEqual({
        page: '1',
        limit: '10',
        search: 'test',
        tags: ['1', '2'],
      });
    });

    it('should handle empty query string', () => {
      expect(DataTransformService.parseQueryString('')).toEqual({});
      expect(DataTransformService.parseQueryString('?')).toEqual({});
    });
  });

  describe('stringifyQuery', () => {
    it('should convert object to query string', () => {
      const params = {
        page: 1,
        limit: 10,
        search: 'test',
        tags: [1, 2],
        sort: 'name',
        order: 'asc',
      };
      
      const result = DataTransformService.stringifyQuery(params);
      
      expect(result).toBe('page=1&limit=10&search=test&tags[]=1&tags[]=2&sort=name&order=asc');
    });

    it('should handle empty object', () => {
      expect(DataTransformService.stringifyQuery({})).toBe('');
    });
  });
});
