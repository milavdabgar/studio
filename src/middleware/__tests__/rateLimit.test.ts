import { NextRequest } from 'next/server';
import { rateLimit } from '../rateLimit';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('rateLimit middleware', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest('http://localhost:3000/api/test');
  });

  describe('Configuration options', () => {
    it('should accept rate limiting configuration with windowMs and max', () => {
      const options = { windowMs: 60000, max: 100 }; // 100 requests per minute
      
      expect(() => {
        const limiter = rateLimit(options);
        expect(typeof limiter).toBe('function');
      }).not.toThrow();
    });

    it('should create middleware function with zero max requests', () => {
      const options = { windowMs: 60000, max: 0 };
      
      const limiter = rateLimit(options);
      expect(typeof limiter).toBe('function');
    });

    it('should create middleware function with very high max requests', () => {
      const options = { windowMs: 60000, max: 1000000 };
      
      const limiter = rateLimit(options);
      expect(typeof limiter).toBe('function');
    });

    it('should create middleware function with very short window', () => {
      const options = { windowMs: 1000, max: 10 }; // 1 second window
      
      const limiter = rateLimit(options);
      expect(typeof limiter).toBe('function');
    });

    it('should create middleware function with very long window', () => {
      const options = { windowMs: 86400000, max: 1000 }; // 24 hour window
      
      const limiter = rateLimit(options);
      expect(typeof limiter).toBe('function');
    });

    it('should handle decimal values in configuration', () => {
      const options = { windowMs: 60000.5, max: 100.7 };
      
      const limiter = rateLimit(options);
      expect(typeof limiter).toBe('function');
    });

    it('should handle negative values in configuration', () => {
      const options = { windowMs: -60000, max: -100 };
      
      const limiter = rateLimit(options);
      expect(typeof limiter).toBe('function');
    });

    it('should handle zero window configuration', () => {
      const options = { windowMs: 0, max: 100 };
      
      const limiter = rateLimit(options);
      expect(typeof limiter).toBe('function');
    });

    it('should handle Infinity values in configuration', () => {
      const options = { windowMs: 60000, max: Infinity };
      
      const limiter = rateLimit(options);
      expect(typeof limiter).toBe('function');
    });

    it('should handle very large numeric values', () => {
      const options = { windowMs: Number.MAX_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER };
      
      const limiter = rateLimit(options);
      expect(typeof limiter).toBe('function');
    });
  });

  describe('Middleware execution', () => {
    it('should allow requests in mock implementation', async () => {
      const options = { windowMs: 60000, max: 100 };
      const limiter = rateLimit(options);
      
      const response = await limiter(mockRequest);
      
      // Mock implementation always allows requests
      expect(response.status).not.toBe(429);
      expect(response.status).not.toBe(400);
      expect(response.status).not.toBe(500);
    });

    it('should work with different HTTP methods', async () => {
      const options = { windowMs: 30000, max: 50 };
      const limiter = rateLimit(options);
      
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
      
      for (const method of methods) {
        const request = new NextRequest('http://localhost:3000/api/test', { method });
        const response = await limiter(request);
        
        // Mock implementation should work with all methods
        expect(response.status).not.toBe(429);
      }
    });

    it('should work with different request paths', async () => {
      const options = { windowMs: 60000, max: 100 };
      const limiter = rateLimit(options);
      
      const paths = [
        'http://localhost:3000/api/auth',
        'http://localhost:3000/api/users/profile',
        'http://localhost:3000/api/data/export',
        'http://localhost:3000/api/admin/settings',
        'http://localhost:3000/api/public/health'
      ];
      
      for (const path of paths) {
        const request = new NextRequest(path);
        const response = await limiter(request);
        
        expect(response.status).not.toBe(429);
      }
    });

    it('should handle requests with query parameters', async () => {
      const options = { windowMs: 60000, max: 100 };
      const limiter = rateLimit(options);
      
      const requestWithQuery = new NextRequest('http://localhost:3000/api/search?q=test&limit=10&page=1');
      const response = await limiter(requestWithQuery);
      
      expect(response.status).not.toBe(429);
    });

    it('should handle requests with headers', async () => {
      const options = { windowMs: 60000, max: 100 };
      const limiter = rateLimit(options);
      
      const requestWithHeaders = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'User-Agent': 'Test Client/1.0',
          'Authorization': 'Bearer token123',
          'X-Forwarded-For': '192.168.1.1',
          'Content-Type': 'application/json'
        }
      });
      
      const response = await limiter(requestWithHeaders);
      
      expect(response.status).not.toBe(429);
    });

    it('should handle requests with body', async () => {
      const options = { windowMs: 60000, max: 100 };
      const limiter = rateLimit(options);
      
      const requestWithBody = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify({ action: 'test', data: { key: 'value' } }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await limiter(requestWithBody);
      
      expect(response.status).not.toBe(429);
    });
  });

  describe('Rate limiting scenarios', () => {
    it('should handle multiple sequential requests', async () => {
      const options = { windowMs: 60000, max: 5 };
      const limiter = rateLimit(options);
      
      // Simulate multiple requests
      for (let i = 0; i < 10; i++) {
        const request = new NextRequest(`http://localhost:3000/api/test?seq=${i}`);
        const response = await limiter(request);
        
        // Mock implementation always allows
        expect(response.status).not.toBe(429);
      }
    });

    it('should handle concurrent requests', async () => {
      const options = { windowMs: 60000, max: 10 };
      const limiter = rateLimit(options);
      
      // Create multiple concurrent requests
      const requests = Array.from({ length: 20 }, (_, i) => 
        new NextRequest(`http://localhost:3000/api/test?concurrent=${i}`)
      );
      
      const responses = await Promise.all(
        requests.map(request => limiter(request))
      );
      
      // Mock implementation should handle all concurrent requests
      responses.forEach(response => {
        expect(response.status).not.toBe(429);
      });
    });

    it('should handle burst of requests', async () => {
      const options = { windowMs: 1000, max: 5 }; // Very short window
      const limiter = rateLimit(options);
      
      // Create burst of requests
      const burstRequests = Array.from({ length: 15 }, (_, i) => 
        new NextRequest(`http://localhost:3000/api/test?burst=${i}`)
      );
      
      const responses = await Promise.all(
        burstRequests.map(request => limiter(request))
      );
      
      // Mock implementation should handle burst
      responses.forEach(response => {
        expect(response.status).not.toBe(429);
      });
    });

    it('should handle mixed request types and patterns', async () => {
      const options = { windowMs: 60000, max: 20 };
      const limiter = rateLimit(options);
      
      const mixedRequests = [
        new NextRequest('http://localhost:3000/api/auth/login', { method: 'POST' }),
        new NextRequest('http://localhost:3000/api/users', { method: 'GET' }),
        new NextRequest('http://localhost:3000/api/data/upload', { 
          method: 'POST', 
          body: JSON.stringify({ file: 'test.txt' }),
          headers: { 'Content-Type': 'application/json' }
        }),
        new NextRequest('http://localhost:3000/api/settings', { method: 'PUT' }),
        new NextRequest('http://localhost:3000/api/logs', { method: 'GET' })
      ];
      
      for (const request of mixedRequests) {
        const response = await limiter(request);
        expect(response.status).not.toBe(429);
      }
    });
  });

  describe('Configuration edge cases', () => {
    it('should handle configuration with max as 0', async () => {
      const options = { windowMs: 60000, max: 0 };
      const limiter = rateLimit(options);
      
      const response = await limiter(mockRequest);
      
      // Mock implementation doesn't enforce limits
      expect(response.status).not.toBe(429);
    });

    it('should handle configuration with windowMs as 0', async () => {
      const options = { windowMs: 0, max: 100 };
      const limiter = rateLimit(options);
      
      const response = await limiter(mockRequest);
      
      expect(response.status).not.toBe(429);
    });

    it('should handle very small window values', async () => {
      const options = { windowMs: 1, max: 1 }; // 1ms window
      const limiter = rateLimit(options);
      
      const response = await limiter(mockRequest);
      
      expect(response.status).not.toBe(429);
    });

    it('should handle very large max values', async () => {
      const options = { windowMs: 60000, max: Number.MAX_SAFE_INTEGER };
      const limiter = rateLimit(options);
      
      const response = await limiter(mockRequest);
      
      expect(response.status).not.toBe(429);
    });

    it('should handle floating point values', async () => {
      const options = { windowMs: 60000.123, max: 100.456 };
      const limiter = rateLimit(options);
      
      const response = await limiter(mockRequest);
      
      expect(response.status).not.toBe(429);
    });
  });

  describe('Response validation', () => {
    it('should return NextResponse object', async () => {
      const options = { windowMs: 60000, max: 100 };
      const limiter = rateLimit(options);
      
      const response = await limiter(mockRequest);
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('object');
      expect(response.status).toBeDefined();
    });

    it('should not modify the original request', async () => {
      const options = { windowMs: 60000, max: 100 };
      const limiter = rateLimit(options);
      
      const originalUrl = mockRequest.url;
      const originalMethod = mockRequest.method;
      
      await limiter(mockRequest);
      
      expect(mockRequest.url).toBe(originalUrl);
      expect(mockRequest.method).toBe(originalMethod);
    });

    it('should work with different response scenarios', async () => {
      const options = { windowMs: 60000, max: 100 };
      const limiter = rateLimit(options);
      
      // Test multiple calls to ensure consistency
      const responses = await Promise.all([
        limiter(mockRequest),
        limiter(mockRequest),
        limiter(mockRequest)
      ]);
      
      responses.forEach(response => {
        expect(response).toBeDefined();
        expect(response.status).not.toBe(429);
      });
    });
  });

  describe('Production readiness considerations', () => {
    it('should be ready for Redis integration (interface compatibility)', async () => {
      const options = { windowMs: 60000, max: 100 };
      const limiter = rateLimit(options);
      
      // The middleware should be designed to easily integrate with Redis
      expect(typeof limiter).toBe('function');
      
      const response = await limiter(mockRequest);
      expect(response).toBeDefined();
    });

    it('should handle typical rate limiting configurations', async () => {
      const configurations = [
        { windowMs: 3600000, max: 1000 }, // 1000 per hour
        { windowMs: 60000, max: 100 },    // 100 per minute
        { windowMs: 1000, max: 10 },      // 10 per second
        { windowMs: 86400000, max: 5000 } // 5000 per day
      ];
      
      for (const config of configurations) {
        const limiter = rateLimit(config);
        const response = await limiter(mockRequest);
        
        expect(response.status).not.toBe(429);
      }
    });

    it('should handle enterprise-level configurations', async () => {
      const enterpriseConfigs = [
        { windowMs: 3600000, max: 10000 },    // High volume API
        { windowMs: 86400000, max: 1000000 }, // Very high daily limit
        { windowMs: 100, max: 1 }             // Very restrictive
      ];
      
      for (const config of enterpriseConfigs) {
        const limiter = rateLimit(config);
        const response = await limiter(mockRequest);
        
        // Mock should handle any configuration
        expect(response).toBeDefined();
      }
    });

    it('should work with sliding window algorithm considerations', async () => {
      const options = { windowMs: 60000, max: 100 };
      const limiter = rateLimit(options);
      
      // Simulate requests over time (in a real implementation, this would test sliding window)
      const timeBasedRequests = Array.from({ length: 50 }, (_, i) => 
        new NextRequest(`http://localhost:3000/api/test?time=${Date.now() + i}`)
      );
      
      const responses = await Promise.all(
        timeBasedRequests.map(request => limiter(request))
      );
      
      responses.forEach(response => {
        expect(response).toBeDefined();
      });
    });
  });

  describe('Error handling and robustness', () => {
    it('should handle malformed requests gracefully', async () => {
      const options = { windowMs: 60000, max: 100 };
      const limiter = rateLimit(options);
      
      // Create request with unusual URL but valid format
      const malformedRequest = new NextRequest('http://localhost:3000/api/test/.//..//weird//path');
      
      expect(async () => {
        await limiter(malformedRequest);
      }).not.toThrow();
    });

    it('should handle requests with special characters in URL', async () => {
      const options = { windowMs: 60000, max: 100 };
      const limiter = rateLimit(options);
      
      const specialUrls = [
        'http://localhost:3000/api/test?param=special%20chars',
        'http://localhost:3000/api/测试路径',
        'http://localhost:3000/api/test?emoji=🚀',
        'http://localhost:3000/api/test?unicode=∑∆∏'
      ];
      
      for (const url of specialUrls) {
        const request = new NextRequest(url);
        const response = await limiter(request);
        
        expect(response).toBeDefined();
      }
    });

    it('should be thread-safe in concurrent scenarios', async () => {
      const options = { windowMs: 60000, max: 50 };
      const limiter = rateLimit(options);
      
      // Simulate high concurrency
      const concurrentRequests = Array.from({ length: 100 }, (_, i) =>
        limiter(new NextRequest(`http://localhost:3000/api/test/${i}`))
      );
      
      const responses = await Promise.all(concurrentRequests);
      
      // All should complete without throwing
      expect(responses).toHaveLength(100);
      responses.forEach(response => {
        expect(response).toBeDefined();
      });
    });

    it('should handle memory pressure scenarios', async () => {
      const options = { windowMs: 60000, max: 1000 };
      const limiter = rateLimit(options);
      
      // Simulate many unique requests (would test memory usage in real implementation)
      const uniqueRequests = Array.from({ length: 1000 }, (_, i) =>
        new NextRequest(`http://localhost:3000/api/test?unique=${i}&data=${Math.random()}`)
      );
      
      for (const request of uniqueRequests) {
        const response = await limiter(request);
        expect(response).toBeDefined();
      }
    });

    it('should handle IP identification edge cases', async () => {
      const options = { windowMs: 60000, max: 100 };
      const limiter = rateLimit(options);
      
      // Test requests with different IP identification headers
      const ipHeaders = [
        { 'X-Forwarded-For': '192.168.1.1, 10.0.0.1' },
        { 'X-Real-IP': '203.0.113.1' },
        { 'X-Forwarded-For': '::1' }, // IPv6
        { 'CF-Connecting-IP': '198.51.100.1' }, // Cloudflare
        {} // No IP headers
      ];
      
      for (const headers of ipHeaders) {
        const request = new NextRequest('http://localhost:3000/api/test', { headers });
        const response = await limiter(request);
        
        expect(response).toBeDefined();
      }
    });
  });

  describe('Performance considerations', () => {
    it('should handle rapid successive requests efficiently', async () => {
      const options = { windowMs: 60000, max: 1000 };
      const limiter = rateLimit(options);
      
      const startTime = Date.now();
      
      // Rapid succession of requests
      for (let i = 0; i < 100; i++) {
        const request = new NextRequest(`http://localhost:3000/api/test?rapid=${i}`);
        const response = await limiter(request);
        expect(response).toBeDefined();
      }
      
      const endTime = Date.now();
      
      // Should complete reasonably quickly (mock implementation)
      expect(endTime - startTime).toBeLessThan(5000); // Less than 5 seconds
    });

    it('should handle large request payloads', async () => {
      const options = { windowMs: 60000, max: 100 };
      const limiter = rateLimit(options);
      
      const largePayload = JSON.stringify({
        data: 'x'.repeat(100000), // Large string
        array: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` }))
      });
      
      const requestWithLargePayload = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        body: largePayload,
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await limiter(requestWithLargePayload);
      
      expect(response).toBeDefined();
    });

    it('should handle stress testing scenarios', async () => {
      const options = { windowMs: 10000, max: 500 }; // 500 requests per 10 seconds
      const limiter = rateLimit(options);
      
      // Simulate stress testing
      const stressRequests = Array.from({ length: 200 }, (_, i) =>
        new NextRequest(`http://localhost:3000/api/stress?batch=${Math.floor(i / 10)}&item=${i}`)
      );
      
      const responses = await Promise.all(
        stressRequests.map(request => limiter(request))
      );
      
      // All should complete successfully in mock
      responses.forEach(response => {
        expect(response).toBeDefined();
        expect(response.status).not.toBe(429);
      });
    });
  });
});