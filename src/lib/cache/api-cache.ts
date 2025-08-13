import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for server-side API responses
// In production, you might want to use Redis or another external cache
class ApiCache {
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();

  set(key: string, data: any, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiresAt });
  }

  get(key: string): any | null {
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

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Clean up expired items periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

const apiCache = new ApiCache();

// Cleanup every 5 minutes
setInterval(() => {
  apiCache.cleanup();
}, 5 * 60 * 1000);

export { apiCache };

// Cache middleware for API routes
export function withCache(
  handler: (request: NextRequest) => Promise<Response | NextResponse>,
  options: {
    ttl?: number;
    keyGenerator?: (request: NextRequest) => string;
    skipCache?: (request: NextRequest) => boolean;
  } = {}
) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `${req.method}:${req.url}`,
    skipCache = () => false
  } = options;

  return async (request: NextRequest): Promise<Response | NextResponse> => {
    // Skip cache for non-GET requests or when skipCache returns true
    if (request.method !== 'GET' || skipCache(request)) {
      return handler(request);
    }

    const cacheKey = keyGenerator(request);
    const cached = apiCache.get(cacheKey);

    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': `public, max-age=${ttl}`,
        },
      });
    }

    // Execute the handler
    const response = await handler(request);
    
    // Only cache successful responses
    if (response.ok) {
      try {
        const data = await response.clone().json();
        apiCache.set(cacheKey, data, ttl);
      } catch (error) {
        // If response is not JSON, don't cache
        console.warn('Failed to cache non-JSON response:', error);
      }
    }

    // Add cache headers
    const newResponse = new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'X-Cache': 'MISS',
        'Cache-Control': `public, max-age=${ttl}`,
      },
    });

    return newResponse;
  };
}

// Specialized cache invalidation functions
export const cacheInvalidation = {
  students: (departmentId?: string) => {
    if (departmentId) {
      apiCache.invalidatePattern(`.*students.*departmentId=${departmentId}`);
    } else {
      apiCache.invalidatePattern('.*students.*');
    }
  },

  courses: (programId?: string) => {
    if (programId) {
      apiCache.invalidatePattern(`.*courses.*programId=${programId}`);
    } else {
      apiCache.invalidatePattern('.*courses.*');
    }
  },

  faculty: (departmentId?: string) => {
    if (departmentId) {
      apiCache.invalidatePattern(`.*faculty.*departmentId=${departmentId}`);
    } else {
      apiCache.invalidatePattern('.*faculty.*');
    }
  },

  programs: () => {
    apiCache.invalidatePattern('.*programs.*');
  },

  all: () => {
    apiCache.clear();
  }
};

// Cache key generators for consistent caching
export const cacheKeyGenerators = {
  students: (req: NextRequest) => {
    const url = new URL(req.url);
    const departmentId = url.searchParams.get('departmentId');
    return `GET:students:${departmentId || 'all'}`;
  },

  courses: (req: NextRequest) => {
    const url = new URL(req.url);
    const programId = url.searchParams.get('programId');
    return `GET:courses:${programId || 'all'}`;
  },

  faculty: (req: NextRequest) => {
    const url = new URL(req.url);
    const departmentId = url.searchParams.get('departmentId');
    return `GET:faculty:${departmentId || 'all'}`;
  },

  programs: (req: NextRequest) => {
    const url = new URL(req.url);
    const departmentId = url.searchParams.get('departmentId');
    return `GET:programs:${departmentId || 'all'}`;
  }
};

export default apiCache;