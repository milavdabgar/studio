import { DataTransformService, NormalizedResponse, NormalizationOptions } from '../dataTransformService';

describe('DataTransformService', () => {
  describe('normalizeResponse', () => {
    it('should handle empty or null response', () => {
      const result = DataTransformService.normalizeResponse(null as any);
      expect(result).toEqual({
        entities: {},
        result: [],
        meta: undefined,
      });
    });

    it('should handle response with no data', () => {
      const response = { meta: { total: 0 } };
      const result = DataTransformService.normalizeResponse(response);
      expect(result).toEqual({
        entities: {},
        result: [],
        meta: { total: 0 },
      });
    });

    it('should normalize single item response', () => {
      const response = {
        data: { id: 1, name: 'Test Item', description: 'Test description' },
        meta: { total: 1 }
      };
      
      const result = DataTransformService.normalizeResponse(response);
      
      expect(result.entities.items).toEqual({
        1: { id: 1, name: 'Test Item', description: 'Test description' }
      });
      expect(result.result).toEqual([1]);
      expect(result.meta).toEqual({ total: 1 });
    });

    it('should normalize array of items', () => {
      const response = {
        data: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
          { id: 3, name: 'Item 3' }
        ],
        meta: { total: 3, page: 1, limit: 10 }
      };
      
      const result = DataTransformService.normalizeResponse(response);
      
      expect(result.entities.items).toEqual({
        1: { id: 1, name: 'Item 1' },
        2: { id: 2, name: 'Item 2' },
        3: { id: 3, name: 'Item 3' }
      });
      expect(result.result).toEqual([1, 2, 3]);
      expect(result.meta?.totalPages).toBe(1);
    });

    it('should use custom entity type', () => {
      const response = {
        data: [{ id: 1, name: 'User 1' }, { id: 2, name: 'User 2' }]
      };
      const options: NormalizationOptions = { entityType: 'users' };
      
      const result = DataTransformService.normalizeResponse(response, options);
      
      expect(result.entities.users).toBeDefined();
      expect(result.entities.items).toBeUndefined();
      expect(result.entities.users[1]).toEqual({ id: 1, name: 'User 1' });
    });

    it('should handle nested single objects', () => {
      const response = {
        data: [
          {
            id: 1,
            name: 'Post 1',
            author: { id: 10, name: 'Author 1' }
          }
        ]
      };
      const options: NormalizationOptions = {
        entityType: 'posts',
        author: 'authors'
      };
      
      const result = DataTransformService.normalizeResponse(response, options);
      
      expect((result.entities.posts as any)[1].author).toEqual(10);
      expect((result.entities.authors as any)[10]).toEqual({ id: 10, name: 'Author 1' });
    });

    it('should handle nested arrays', () => {
      const response = {
        data: [
          {
            id: 1,
            name: 'Post 1',
            comments: [
              { id: 100, text: 'Comment 1' },
              { id: 101, text: 'Comment 2' }
            ]
          }
        ]
      };
      const options: NormalizationOptions = {
        entityType: 'posts',
        comments: 'comments'
      };
      
      const result = DataTransformService.normalizeResponse(response, options);
      
      expect((result.entities.posts as any)[1].comments).toEqual([100, 101]);
      expect(result.entities.comments).toEqual({
        100: { id: 100, text: 'Comment 1' },
        101: { id: 101, text: 'Comment 2' }
      });
    });

    it('should handle items without id', () => {
      const response = {
        data: [
          { id: 1, name: 'Valid Item' },
          { name: 'Invalid Item' }, // Missing id
          null, // Null item
          'string item' // Non-object item
        ]
      };
      
      const result = DataTransformService.normalizeResponse(response);
      
      expect(result.entities.items).toEqual({
        1: { id: 1, name: 'Valid Item' }
      });
      expect(result.result).toEqual([1]);
    });

    it('should calculate totalPages from meta', () => {
      const response = {
        data: [{ id: 1, name: 'Item 1' }],
        meta: { total: 25, limit: 10, page: 1 }
      };
      
      const result = DataTransformService.normalizeResponse(response);
      
      expect(result.meta?.totalPages).toBe(3); // Math.ceil(25/10)
    });

    it('should not overwrite existing totalPages', () => {
      const response = {
        data: [{ id: 1, name: 'Item 1' }],
        meta: { total: 25, limit: 10, page: 1, totalPages: 5 }
      };
      
      const result = DataTransformService.normalizeResponse(response);
      
      expect(result.meta?.totalPages).toBe(5); // Should keep existing value
    });

    it('should handle nested objects without id', () => {
      const response = {
        data: [
          {
            id: 1,
            name: 'Post 1',
            metadata: { created: '2023-01-01', updated: '2023-01-02' } // No id
          }
        ]
      };
      const options: NormalizationOptions = {
        entityType: 'posts',
        metadata: 'metadata'
      };
      
      const result = DataTransformService.normalizeResponse(response, options);
      
      expect((result.entities.posts as any)[1].metadata).toEqual({
        created: '2023-01-01',
        updated: '2023-01-02'
      });
      expect(result.entities.metadata).toBeUndefined();
    });

    it('should handle mixed array content in nested arrays', () => {
      const response = {
        data: [
          {
            id: 1,
            name: 'Post 1',
            tags: [
              { id: 10, name: 'Tag 1' },
              'string-tag', // Non-object item
              { name: 'No ID tag' }, // Missing id
              null // Null item
            ]
          }
        ]
      };
      const options: NormalizationOptions = {
        entityType: 'posts',
        tags: 'tags'
      };
      
      const result = DataTransformService.normalizeResponse(response, options);
      
      expect((result.entities.posts as any)[1].tags).toEqual([10, 'string-tag', { name: 'No ID tag' }, null]);
      expect(result.entities.tags).toEqual({
        10: { id: 10, name: 'Tag 1' }
      });
    });
  });

  describe('denormalize', () => {
    it('should handle empty or missing entities', () => {
      const result = DataTransformService.denormalize({}, 'users');
      expect(result).toEqual([]);

      const result2 = DataTransformService.denormalize({ entities: {} }, 'users');
      expect(result2).toEqual([]);

      const result3 = DataTransformService.denormalize({ entities: { posts: {} } }, 'users');
      expect(result3).toEqual([]);
    });

    it('should denormalize simple entities', () => {
      const normalizedData = {
        entities: {
          users: {
            1: { id: 1, name: 'User 1' },
            2: { id: 2, name: 'User 2' }
          }
        },
        result: [1, 2]
      };
      
      const result = DataTransformService.denormalize(normalizedData, 'users');
      
      expect(result).toEqual([
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' }
      ]);
    });

    it('should denormalize without result array', () => {
      const normalizedData = {
        entities: {
          users: {
            1: { id: 1, name: 'User 1' },
            2: { id: 2, name: 'User 2' }
          }
        }
      };
      
      const result = DataTransformService.denormalize(normalizedData, 'users');
      
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ id: 1, name: 'User 1' });
      expect(result).toContainEqual({ id: 2, name: 'User 2' });
    });

    it('should resolve single relations', () => {
      const normalizedData = {
        entities: {
          posts: {
            1: { id: 1, title: 'Post 1', author: 10 }
          },
          users: {
            10: { id: 10, name: 'Author 1' }
          }
        },
        result: [1]
      };
      
      const result = DataTransformService.denormalize(normalizedData, 'posts', ['author']);
      
      expect(result[0].author).toEqual({ id: 10, name: 'Author 1' });
    });

    it('should resolve array relations', () => {
      const normalizedData = {
        entities: {
          posts: {
            1: { id: 1, title: 'Post 1', comments: [100, 101] }
          },
          comments: {
            100: { id: 100, text: 'Comment 1' },
            101: { id: 101, text: 'Comment 2' }
          }
        },
        result: [1]
      };
      
      const result = DataTransformService.denormalize(normalizedData, 'posts', ['comments']);
      
      expect(result[0].comments).toEqual([
        { id: 100, text: 'Comment 1' },
        { id: 101, text: 'Comment 2' }
      ]);
    });

    it('should handle missing relations gracefully', () => {
      const normalizedData = {
        entities: {
          posts: {
            1: { id: 1, title: 'Post 1', author: 999 } // Missing author
          },
          users: {
            10: { id: 10, name: 'Author 1' }
          }
        },
        result: [1]
      };
      
      const result = DataTransformService.denormalize(normalizedData, 'posts', ['author']);
      
      expect(result[0].author).toBe(999); // Should remain as ID
    });

    it('should handle relations that are already objects', () => {
      const normalizedData = {
        entities: {
          posts: {
            1: { id: 1, title: 'Post 1', author: { id: 10, name: 'Author 1' } }
          }
        },
        result: [1]
      };
      
      const result = DataTransformService.denormalize(normalizedData, 'posts', ['author']);
      
      expect(result[0].author).toEqual({ id: 10, name: 'Author 1' });
    });

    it('should handle mixed array relations', () => {
      const normalizedData = {
        entities: {
          posts: {
            1: { id: 1, title: 'Post 1', tags: [100, 999, 101] } // 999 doesn't exist
          },
          tags: {
            100: { id: 100, name: 'Tag 1' },
            101: { id: 101, name: 'Tag 2' }
          }
        },
        result: [1]
      };
      
      const result = DataTransformService.denormalize(normalizedData, 'posts', ['tags']);
      
      expect(result[0].tags).toEqual([
        { id: 100, name: 'Tag 1' },
        999, // Should remain as ID since not found
        { id: 101, name: 'Tag 2' }
      ]);
    });

    it('should not mutate original data', () => {
      const normalizedData = {
        entities: {
          posts: {
            1: { id: 1, title: 'Post 1', author: 10 }
          },
          users: {
            10: { id: 10, name: 'Author 1' }
          }
        },
        result: [1]
      };
      
      const originalPost = normalizedData.entities.posts[1];
      DataTransformService.denormalize(normalizedData, 'posts', ['author']);
      
      expect(originalPost.author).toBe(10); // Should remain unchanged
    });
  });

  describe('integration tests', () => {
    it('should normalize and denormalize consistently', () => {
      const originalData = {
        data: [
          {
            id: 1,
            title: 'Post 1',
            author: { id: 10, name: 'Author 1' },
            comments: [
              { id: 100, text: 'Comment 1' },
              { id: 101, text: 'Comment 2' }
            ]
          }
        ],
        meta: { total: 1 }
      };
      
      const options = {
        entityType: 'posts',
        author: 'users',
        comments: 'comments'
      };
      
      // Normalize
      const normalized = DataTransformService.normalizeResponse(originalData, options);
      
      // Denormalize
      const denormalized = DataTransformService.denormalize(
        normalized,
        'posts',
        ['author', 'comments']
      );
      
      expect(denormalized).toEqual(originalData.data);
    });
  });
});