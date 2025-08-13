import { NextRequest } from 'next/server';
import type { UserRole as UserRoleCode } from '@/types/entities';

interface MockUser {
  email: string;
  name: string;
  activeRole: UserRoleCode;
  availableRoles: UserRoleCode[];
  departmentId?: string;
  instituteId?: string;
}

/**
 * Create a mock NextRequest for testing API endpoints
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: any;
  user?: MockUser;
  headers?: Record<string, string>;
} = {}): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    body,
    user,
    headers = {}
  } = options;

  // Create mock request
  const request = new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  // Mock cookies if user is provided
  if (user) {
    const authCookie = encodeURIComponent(JSON.stringify(user));
    // Mock the cookies.get method
    jest.spyOn(request.cookies, 'get').mockImplementation((...args: any[]) => {
      const name = typeof args[0] === 'string' ? args[0] : args[0]?.name;
      if (name === 'auth_user') {
        return { name: 'auth_user', value: authCookie };
      }
      return undefined;
    });
  }

  return request;
}

/**
 * Default admin user for tests
 */
export const mockAdminUser: MockUser = {
  email: 'admin@test.com',
  name: 'Admin User',
  activeRole: 'admin',
  availableRoles: ['admin'],
  departmentId: 'dept_test',
  instituteId: 'inst_test'
};

/**
 * Default HOD user for tests
 */
export const mockHODUser: MockUser = {
  email: 'hod@test.com',
  name: 'HOD User',
  activeRole: 'hod',
  availableRoles: ['hod'],
  departmentId: 'dept_cs',
  instituteId: 'inst_test'
};

/**
 * Default faculty user for tests
 */
export const mockFacultyUser: MockUser = {
  email: 'faculty@test.com',
  name: 'Faculty User',
  activeRole: 'faculty',
  availableRoles: ['faculty'],
  departmentId: 'dept_cs',
  instituteId: 'inst_test'
};