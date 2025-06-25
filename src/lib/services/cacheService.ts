export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export interface CacheItem<T = any> {
  value: T;
  expiry: number;
}

export class CacheService {
  private cache: Map<string, CacheItem> = new Map();
  private defaultTtl: number = 3600; // 1 hour
  private prefix: string = '';

  constructor(options: CacheOptions = {}) {
    this.defaultTtl = options.ttl || 3600;
    this.prefix = options.prefix || '';
    
    // Clean up expired items every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
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

  async get<T = any>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);
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

  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = this.getKey(key);
    const expiryTime = Date.now() + ((ttl || this.defaultTtl) * 1000);
    
    this.cache.set(fullKey, {
      value,
      expiry: expiryTime,
    });
  }

  async has(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);
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

  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    const promises = keys.map(key => this.get<T>(key));
    return Promise.all(promises);
  }

  async mset<T = any>(entries: Array<[string, T]>, ttl?: number): Promise<void> {
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

  async getOrSet<T = any>(
    key: string, 
    factory: () => Promise<T> | T, 
    ttl?: number
  ): Promise<T> {
    const existing = await this.get<T>(key);
    
    if (existing !== null) {
      return existing;
    }
    
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  async remember<T = any>(
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
}
