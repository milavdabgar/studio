import { getClient, RedisClient } from '@/lib/redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  useRedis?: boolean;
}

export interface CacheItem<T = unknown> {
  value: T;
  expiry: number;
}

export class CacheService {
  private cache: Map<string, CacheItem> = new Map();
  private defaultTtl: number = 3600; // 1 hour
  private prefix: string = '';
  private useRedis: boolean = false;
  private redis?: RedisClient;

  constructor(options: CacheOptions = {}) {
    this.defaultTtl = options.ttl || 3600;
    this.prefix = options.prefix || '';
    this.useRedis = options.useRedis || false;
    
    if (this.useRedis) {
      this.redis = getClient();
    } else {
      // Clean up expired items every 5 minutes for in-memory cache
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  private getKey(key: string): string {
    if (!this.prefix) return key;
    
    // If prefix already ends with ':', don't add another one
    if (this.prefix.endsWith(':')) {
      return `${this.prefix}${key}`;
    }
    
    return `${this.prefix}:${key}`;
  }

  private isExpired(item: CacheItem): boolean {
    return Date.now() > item.expiry;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Public method for testing cleanup functionality
  forceCleanup(): void {
    this.cleanup();
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);
    
    if (this.useRedis && this.redis) {
      const value = await this.redis.get(fullKey);
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        // If JSON parsing fails, return null
        return null;
      }
    }
    
    const item = this.cache.get(fullKey);
    
    if (!item) {
      return null;
    }
    
    if (this.isExpired(item)) {
      this.cache.delete(fullKey);
      return null;
    }
    
    return item.value as T;
  }

  async set<T = unknown>(key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = this.getKey(key);
    const effectiveTtl = ttl !== undefined ? ttl : this.defaultTtl;
    
    if (this.useRedis && this.redis) {
      await this.redis.set(fullKey, JSON.stringify(value));
      if (effectiveTtl > 0) {
        await this.redis.expire(fullKey, effectiveTtl);
      }
      return;
    }
    
    const expiryTime = Date.now() + (effectiveTtl * 1000);
    
    this.cache.set(fullKey, {
      value,
      expiry: expiryTime,
    });
  }

  async has(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);
    
    if (this.useRedis && this.redis) {
      const value = await this.redis.get(fullKey);
      return value !== null;
    }
    
    const item = this.cache.get(fullKey);
    
    if (!item) {
      return false;
    }
    
    if (this.isExpired(item)) {
      this.cache.delete(fullKey);
      return false;
    }
    
    return true;
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);
    
    if (this.useRedis && this.redis) {
      const result = await this.redis.del(fullKey);
      return result > 0;
    }
    
    return this.cache.delete(fullKey);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(pattern?: string): Promise<string[]> {
    const keys = Array.from(this.cache.keys());
    
    if (!pattern) {
      return keys.map(key => 
        this.prefix && key.startsWith(`${this.prefix}:`) 
          ? key.substring(this.prefix.length + 1)
          : key
      );
    }
    
    // Simple pattern matching (supports * wildcard)
    const regex = new RegExp(
      pattern.replace(/\*/g, '.*').replace(/\?/g, '.'),
      'i'
    );
    
    return keys
      .filter(key => {
        const cleanKey = this.prefix && key.startsWith(`${this.prefix}:`) 
          ? key.substring(this.prefix.length + 1)
          : key;
        return regex.test(cleanKey);
      })
      .map(key => 
        this.prefix && key.startsWith(`${this.prefix}:`) 
          ? key.substring(this.prefix.length + 1)
          : key
      );
  }

  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    const promises = keys.map(key => this.get<T>(key));
    return Promise.all(promises);
  }

  async mset<T = unknown>(entries: Array<[string, T]>, ttl?: number): Promise<void> {
    const promises = entries.map(([key, value]) => this.set(key, value, ttl));
    await Promise.all(promises);
  }

  async increment(key: string, delta: number = 1): Promise<number> {
    const current = await this.get<number>(key) || 0;
    const newValue = current + delta;
    await this.set(key, newValue);
    return newValue;
  }

  async decrement(key: string, delta: number = 1): Promise<number> {
    return this.increment(key, -delta);
  }

  async getOrSet<T = unknown>(
    key: string, 
    factory: (isCacheMiss?: boolean) => Promise<T> | T, 
    ttl?: number
  ): Promise<T> {
    const existing = await this.get<T>(key);
    
    if (existing !== null) {
      return existing;
    }
    
    const value = await factory(true); // Pass true to indicate cache miss
    await this.set(key, value, ttl);
    return value;
  }

  async remember<T = unknown>(
    key: string,
    ttl: number,
    factory: () => Promise<T> | T
  ): Promise<T> {
    return this.getOrSet(key, factory, ttl);
  }

  async flush(): Promise<void> {
    await this.clear();
  }

  getStats(): { size: number; memoryUsage: number } {
    return {
      size: this.cache.size,
      memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length,
    };
  }

  withPrefix(prefix: string): CacheService {
    return new CacheService({
      ttl: this.defaultTtl,
      prefix: prefix, // Use the provided prefix directly
      useRedis: this.useRedis,
    });
  }

  generateCacheKey(base: string, params: Record<string, string | number | boolean>): string {
    const crypto = require('crypto');
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((sorted, key) => {
        sorted[key] = params[key];
        return sorted;
      }, {} as Record<string, string | number | boolean>);
    
    const hash = crypto.createHash('md5')
      .update(JSON.stringify(sortedParams))
      .digest('hex');
    
    return `${base}:${hash}`;
  }

  cached<T extends (...args: unknown[]) => Promise<unknown>>(
    key: string,
    fn: T,
    ttl?: number
  ): T {
    return (async (...args: Parameters<T>) => {
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }
      
      const result = await fn(...args);
      if (result !== undefined) {
        await this.set(key, result, ttl);
      }
      return result;
    }) as T;
  }

  async clearByPattern(pattern: string): Promise<number> {
    if (this.useRedis && this.redis) {
      const keys = await (this.redis as RedisClient & { keys: (pattern: string) => Promise<string[]> }).keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      await (this.redis as RedisClient & { del: (...keys: string[]) => Promise<number> }).del(...keys);
      return keys.length;
    }
    
    // For in-memory cache, implement pattern matching
    const keys = Array.from(this.cache.keys());
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');
    const matchingKeys = keys.filter(key => regex.test(key));
    
    matchingKeys.forEach(key => this.cache.delete(key));
    return matchingKeys.length;
  }

  async flushAll(): Promise<void> {
    if (this.useRedis && this.redis) {
      await (this.redis as RedisClient & { flushdb: () => Promise<void> }).flushdb();
      return;
    }
    
    this.cache.clear();
  }
}
