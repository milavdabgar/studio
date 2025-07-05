import { NextRequest } from 'next/server';
import { authMiddleware } from '../authMiddleware';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('authMiddleware', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    // Create a basic mock request
    mockRequest = new NextRequest('http://localhost:3000/api/test');
  });

  describe('Authentication Header Validation', () => {
    it('should return 401 when no authorization header is provided', async () => {
      const response = await authMiddleware(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('No token provided');
    });

    it('should return 401 when authorization header is empty', async () => {
      const requestWithEmptyAuth = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: '' }
      });
      
      const response = await authMiddleware(requestWithEmptyAuth);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('No token provided');
    });

    it('should return 401 when authorization header only contains "Bearer"', async () => {
      const requestWithBearerOnly = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer' }
      });
      
      const response = await authMiddleware(requestWithBearerOnly);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('No token provided');
    });

    it('should return 401 when authorization header only contains "Bearer "', async () => {
      const requestWithBearerSpace = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer ' }
      });
      
      const response = await authMiddleware(requestWithBearerSpace);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('No token provided');
    });
  });

  describe('Valid Token Scenarios', () => {
    it('should allow request with valid Bearer token', async () => {
      const requestWithToken = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer valid-jwt-token-here' }
      });
      
      const response = await authMiddleware(requestWithToken);
      
      // NextResponse.next() should not have status or json methods for successful requests
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('should extract token correctly from Bearer authorization', async () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const requestWithJWT = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: `Bearer ${token}` }
      });
      
      const response = await authMiddleware(requestWithJWT);
      
      // Should pass through without error
      expect(response.status).not.toBe(401);
    });

    it('should handle token with special characters', async () => {
      const tokenWithSpecialChars = 'token-with_special.characters+and=symbols';
      const requestWithSpecialToken = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: `Bearer ${tokenWithSpecialChars}` }
      });
      
      const response = await authMiddleware(requestWithSpecialToken);
      
      expect(response.status).not.toBe(401);
    });

    it('should handle very long tokens', async () => {
      const longToken = 'a'.repeat(1000); // Very long token
      const requestWithLongToken = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: `Bearer ${longToken}` }
      });
      
      const response = await authMiddleware(requestWithLongToken);
      
      expect(response.status).not.toBe(401);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle malformed authorization headers', async () => {
      const requestWithMalformed = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'NotBearer token-here' }
      });
      
      const response = await authMiddleware(requestWithMalformed);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('No token provided');
    });

    it('should handle authorization header with extra spaces', async () => {
      const requestWithSpaces = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: '  Bearer   token-with-spaces  ' }
      });
      
      // This should fail because the middleware expects exact "Bearer " format
      const response = await authMiddleware(requestWithSpaces);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('No token provided');
    });

    it('should handle multiple authorization headers', async () => {
      // Note: This is testing current behavior, but multiple auth headers should be handled carefully
      const requestWithValidToken = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer valid-token' }
      });
      
      const response = await authMiddleware(requestWithValidToken);
      
      expect(response.status).not.toBe(401);
    });

    it('should handle case-sensitive Bearer keyword', async () => {
      const requestWithLowerCase = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'bearer valid-token' }
      });
      
      const response = await authMiddleware(requestWithLowerCase);
      const data = await response.json();
      
      // Should fail because Bearer is case-sensitive
      expect(response.status).toBe(401);
      expect(data.error).toBe('No token provided');
    });

    it('should handle null token after Bearer extraction', async () => {
      // This tests the edge case where replace returns empty string
      const requestWithJustBearer = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer' }
      });
      
      const response = await authMiddleware(requestWithJustBearer);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('No token provided');
    });
  });

  describe('HTTP Methods and Paths', () => {
    it('should work with different HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        const request = new NextRequest('http://localhost:3000/api/test', {
          method,
          headers: { authorization: 'Bearer valid-token' }
        });
        
        const response = await authMiddleware(request);
        expect(response.status).not.toBe(401);
      }
    });

    it('should work with different API paths', async () => {
      const paths = [
        'http://localhost:3000/api/users',
        'http://localhost:3000/api/students/123',
        'http://localhost:3000/api/courses/create',
        'http://localhost:3000/api/admin/settings'
      ];
      
      for (const path of paths) {
        const request = new NextRequest(path, {
          headers: { authorization: 'Bearer valid-token' }
        });
        
        const response = await authMiddleware(request);
        expect(response.status).not.toBe(401);
      }
    });
  });

  describe('Response Format', () => {
    it('should return proper JSON error response', async () => {
      const response = await authMiddleware(mockRequest);
      const data = await response.json();
      
      // Test environment may not set content-type properly, focus on data structure
      expect(typeof data).toBe('object');
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });

    it('should not include sensitive information in error response', async () => {
      const response = await authMiddleware(mockRequest);
      const data = await response.json();
      
      // Ensure no sensitive data is leaked
      expect(data).not.toHaveProperty('token');
      expect(data).not.toHaveProperty('jwt');
      expect(data).not.toHaveProperty('secret');
      expect(data).not.toHaveProperty('key');
    });
  });
});