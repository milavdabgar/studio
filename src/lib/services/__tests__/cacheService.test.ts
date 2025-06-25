import { CacheService } from '../cacheService';
import { createHash } from 'crypto';

// Mock Redis client
const mockRedis = {
  get: jest.fn(),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  flushdb: jest.fn().mockResolvedValue('OK'),
  keys: jest.fn().mockResolvedValue([]),
};

// Mock the Redis module
jest.mock('@/lib/redis', () => ({
  getClient: jest.fn().mockImplementation(() => mockRedis),
}));

// Mock the crypto module for consistent hashing in tests
jest.mock('crypto', () => ({
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('hashed-key'),
  }),
}));

describe('CacheService', () => {
  const defaultTtl = 3600; // 1 hour
  let cacheService: CacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService = new CacheService();
  });

  describe('get', () => {
    it('should return cached value if exists', async () => {
      const cachedValue = JSON.stringify({ data: 'test' });
      mockRedis.get.mockResolvedValueOnce(cachedValue);

      const result = await cacheService.get('test-key');

      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(JSON.parse(cachedValue));
    });

    it('should return null if key does not exist', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await cacheService.get('non-existent-key');

      expect(result).toBeNull();
    });

    it('should return null if JSON parsing fails', async () => {
      mockRedis.get.mockResolvedValueOnce('invalid-json');

      const result = await cacheService.get('invalid-json-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in cache with default TTL', async () => {
      const value = { data: 'test' };

      await cacheService.set('test-key', value);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(value)
      );
      expect(mockRedis.expire).toHaveBeenCalledWith('test-key', defaultTtl);
    });

    it('should set value with custom TTL', async () => {
      const customTtl = 60; // 1 minute
      const value = { data: 'test' };

      await cacheService.set('test-key', value, customTtl);

      expect(mockRedis.expire).toHaveBeenCalledWith('test-key', customTtl);
    });

    it('should set value without TTL if ttl is 0', async () => {
      const value = { data: 'test' };

      await cacheService.set('test-key', value, 0);

      expect(mockRedis.expire).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete key from cache', async () => {
      await cacheService.delete('key-to-delete');

      expect(mockRedis.del).toHaveBeenCalledWith('key-to-delete');
    });

    it('should return true if key was deleted', async () => {
      mockRedis.del.mockResolvedValueOnce(1);

      const result = await cacheService.delete('key-to-delete');

      expect(result).toBe(true);
    });

    it('should return false if key did not exist', async () => {
      mockRedis.del.mockResolvedValueOnce(0);

      const result = await cacheService.delete('non-existent-key');

      expect(result).toBe(false);
    });
  });

  describe('withPrefix', () => {
    it('should return a new CacheService instance with prefix', async () => {
      const prefixedCache = cacheService.withPrefix('user:');
      
      await prefixedCache.set('123', { name: 'John' });
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'user:123',
        JSON.stringify({ name: 'John' })
      );
    });
  });

  describe('generateCacheKey', () => {
    it('should generate a cache key from object', () => {
      const params = { userId: 123, type: 'profile', page: 1 };
      const key = cacheService.generateCacheKey('user-data', params);
      
      expect(createHash).toHaveBeenCalledWith('md5');
      expect(key).toBe('user-data:hashed-key');
    });

    it('should generate the same key for the same input', () => {
      const params1 = { a: 1, b: 2 };
      const params2 = { b: 2, a: 1 }; // Same keys, different order
      
      const key1 = cacheService.generateCacheKey('test', params1);
      const key2 = cacheService.generateCacheKey('test', params2);
      
      expect(key1).toBe(key2);
    });
  });

  describe('cached', () => {
    const mockFn = jest.fn().mockResolvedValue('result');
    
    beforeEach(() => {
      mockFn.mockClear();
      mockRedis.get.mockResolvedValue(null);
    });

    it('should call the function and cache the result', async () => {
      const cachedFn = cacheService.cached('test-key', mockFn, 60);
      
      const result = await cachedFn('arg1', 'arg2');
      
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBe('result');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify('result')
      );
      expect(mockRedis.expire).toHaveBeenCalledWith('test-key', 60);
    });

    it('should return cached result if available', async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify('cached-result'));
      
      const cachedFn = cacheService.cached('test-key', mockFn);
      const result = await cachedFn();
      
      expect(mockFn).not.toHaveBeenCalled();
      expect(result).toBe('cached-result');
    });

    it('should handle function that returns undefined', async () => {
      const fn = jest.fn().mockResolvedValue(undefined);
      const cachedFn = cacheService.cached('test-key', fn);
      
      const result = await cachedFn();
      
      expect(result).toBeUndefined();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe('clearByPattern', () => {
    it('should clear keys matching pattern', async () => {
      mockRedis.keys.mockResolvedValueOnce(['cache:key1', 'cache:key2']);
      
      const count = await cacheService.clearByPattern('cache:*');
      
      expect(mockRedis.keys).toHaveBeenCalledWith('cache:*');
      expect(mockRedis.del).toHaveBeenCalledWith('cache:key1', 'cache:key2');
      expect(count).toBe(2);
    });

    it('should return 0 if no keys match pattern', async () => {
      mockRedis.keys.mockResolvedValueOnce([]);
      
      const count = await cacheService.clearByPattern('non-matching-pattern');
      
      expect(count).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('flushAll', () => {
    it('should flush the entire cache', async () => {
      await cacheService.flushAll();
      
      expect(mockRedis.flushdb).toHaveBeenCalled();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const cachedValue = { data: 'cached' };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(cachedValue));
      
      const result = await cacheService.getOrSet('test-key', () => 
        Promise.resolve({ data: 'new' })
      );
      
      expect(result).toEqual(cachedValue);
    });

    it('should call factory function and cache result if not in cache', async () => {
      const factory = jest.fn().mockResolvedValue({ data: 'new' });
      mockRedis.get.mockResolvedValueOnce(null);
      
      const result = await cacheService.getOrSet('test-key', factory);
      
      expect(factory).toHaveBeenCalled();
      expect(result).toEqual({ data: 'new' });
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ data: 'new' })
      );
    });

    it('should pass cache miss to factory function', async () => {
      const factory = jest.fn().mockImplementation((isCacheMiss) => {
        return Promise.resolve({ fromCache: !isCacheMiss });
      });
      
      mockRedis.get.mockResolvedValueOnce(null);
      
      const result = await cacheService.getOrSet('test-key', factory);
      
      expect(factory).toHaveBeenCalledWith(true);
      expect(result).toEqual({ fromCache: false });
    });
  });
});
