// Client-side caching utility for API responses and computed data

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ClientCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default TTL

  /**
   * Set cache item with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    });
  }

  /**
   * Get cache item if not expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired items
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const item of this.cache.values()) {
      if (now > item.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired
    };
  }

  /**
   * Cache with fallback function
   */
  async getOrSet<T>(
    key: string, 
    fallback: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fallback();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate keys by pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const clientCache = new ClientCache();

// Auto-cleanup expired items every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    clientCache.clearExpired();
  }, 5 * 60 * 1000);
}

// Cache key generators for common data types
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  students: (departmentId?: string) => departmentId ? `students:${departmentId}` : 'students:all',
  faculty: (departmentId?: string) => departmentId ? `faculty:${departmentId}` : 'faculty:all',
  courses: (programId?: string) => programId ? `courses:${programId}` : 'courses:all',
  programs: (departmentId?: string) => departmentId ? `programs:${departmentId}` : 'programs:all',
  timetables: (batchId?: string) => batchId ? `timetables:${batchId}` : 'timetables:all',
  committees: (type?: string) => type ? `committees:${type}` : 'committees:all',
  analytics: (type: string, timeframe: string) => `analytics:${type}:${timeframe}`,
  permissions: (userId: string, role: string) => `permissions:${userId}:${role}`
};

// TTL constants for different data types
export const cacheTTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes  
  LONG: 15 * 60 * 1000,      // 15 minutes
  EXTENDED: 60 * 60 * 1000,  // 1 hour
  STATIC: 24 * 60 * 60 * 1000 // 24 hours
};

export default clientCache;