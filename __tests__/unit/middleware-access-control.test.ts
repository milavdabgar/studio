import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn(() => ({ cookies: { set: jest.fn() } })),
    redirect: jest.fn((url) => ({ url, type: 'redirect' }))
  }
}));

describe('Middleware Access Control', () => {
  let mockRequest: Partial<NextRequest>;
  let mockUrl: URL;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Suppress console.log, console.warn, and console.error during tests
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockUrl = new URL('https://example.com');
    
    mockRequest = {
      nextUrl: mockUrl as any,
      cookies: {
        get: jest.fn().mockReturnValue(undefined)
      } as any,
      url: 'https://example.com',
      headers: new Headers()
    };

    // Reset NextResponse mocks
    (NextResponse.next as jest.Mock).mockReturnValue({ cookies: { set: jest.fn() } });
    (NextResponse.redirect as jest.Mock).mockImplementation((url) => ({ url: url.toString(), type: 'redirect' }));
  });

  afterEach(() => {
    consoleSpy?.mockRestore();
    jest.restoreAllMocks();
  });

  describe('Public Routes', () => {
    const publicRoutes = [
      '/',
      '/login',
      '/signup',
      '/forgot-password',
      '/posts',
      '/posts/some-post',
      '/newsletters',
      '/about',
      '/departments',
      '/admissions',
      '/library',
      '/facilities',
      '/contact',
      '/ssip',
      '/slidev-builds',
      '/establishment',
      '/student-section',
      '/tpo',
      '/students',
      '/faculty'
    ];

    publicRoutes.forEach(route => {
      it(`allows access to public route: ${route}`, async () => {
        mockUrl.pathname = route;
        
        const response = await middleware(mockRequest as NextRequest);
        
        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();
      });
    });

    it('allows access to nested public routes', async () => {
      const nestedRoutes = [
        '/posts/category/tech',
        '/newsletters/2024/january',
        '/departments/computer-science',
        '/students/john-doe',
        '/faculty/dr-smith'
      ];

      for (const route of nestedRoutes) {
        mockUrl.pathname = route;
        
        const response = await middleware(mockRequest as NextRequest);
        
        expect(NextResponse.next).toHaveBeenCalled();
      }
    });
  });

  describe('Static Assets', () => {
    const staticAssets = [
      '/_next/static/chunks/main.js',
      '/_next/image/avatar.png',
      '/favicon.ico',
      '/icons/app-icon.png',
      '/slidev-builds/presentation.html',
      '/api/health'
    ];

    staticAssets.forEach(asset => {
      it(`allows access to static asset: ${asset}`, async () => {
        mockUrl.pathname = asset;
        
        const response = await middleware(mockRequest as NextRequest);
        
        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();
      });
    });
  });

  describe('Authentication Required Routes', () => {
    const protectedRoutes = [
      '/dashboard',
      '/admin',
      '/admin/users',
      '/faculty/courses',
      '/student/profile',
      '/notifications',
      '/project-fair/admin'
    ];

    protectedRoutes.forEach(route => {
      it(`redirects unauthenticated users from protected route: ${route}`, async () => {
        mockUrl.pathname = route;
        
        const response = await middleware(mockRequest as NextRequest);
        
        expect(NextResponse.redirect).toHaveBeenCalledWith(
          expect.objectContaining({
            href: expect.stringContaining('/login')
          })
        );
      });
    });

    it('includes redirectedFrom parameter in login URL', async () => {
      mockUrl.pathname = '/dashboard';
      
      await middleware(mockRequest as NextRequest);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('redirectedFrom=%2Fdashboard')
        })
      );
    });
  });

  describe('Role-Based Access Control', () => {
    const createAuthenticatedRequest = (role: string, availableRoles?: string[]) => {
      const authUser = {
        email: 'test@example.com',
        name: 'Test User',
        activeRole: role,
        availableRoles: availableRoles || [role]
      };

      (mockRequest.cookies!.get as jest.Mock).mockReturnValue({
        value: encodeURIComponent(JSON.stringify(authUser))
      });

      return mockRequest as NextRequest;
    };

    describe('Admin Routes', () => {
      const adminRoutes = [
        '/admin',
        '/admin/users',
        '/admin/roles',
        '/admin/institutes',
        '/admin/buildings',
        '/admin/rooms'
      ];

      adminRoutes.forEach(route => {
        it(`allows admin access to: ${route}`, async () => {
          mockUrl.pathname = route;
          const request = createAuthenticatedRequest('admin');
          
          const response = await middleware(request);
          
          expect(NextResponse.next).toHaveBeenCalled();
          expect(NextResponse.redirect).not.toHaveBeenCalled();
        });

        it(`allows super_admin access to: ${route}`, async () => {
          mockUrl.pathname = route;
          const request = createAuthenticatedRequest('super_admin');
          
          const response = await middleware(request);
          
          expect(NextResponse.next).toHaveBeenCalled();
        });

        it(`denies student access to: ${route}`, async () => {
          mockUrl.pathname = route;
          const request = createAuthenticatedRequest('student');
          
          const response = await middleware(request);
          
          expect(NextResponse.redirect).toHaveBeenCalledWith(
            expect.objectContaining({
              href: expect.stringContaining('/dashboard')
            })
          );
        });
      });
    });

    describe('Faculty Routes', () => {
      const facultyRoutes = [
        '/faculty/courses',
        '/faculty/my-courses',
        '/faculty/students',
        '/faculty/attendance/mark',
        '/faculty/assessments',
        '/faculty/profile',
        '/faculty/timetable'
      ];

      facultyRoutes.forEach(route => {
        it(`allows faculty access to: ${route}`, async () => {
          mockUrl.pathname = route;
          const request = createAuthenticatedRequest('faculty');
          
          const response = await middleware(request);
          
          expect(NextResponse.next).toHaveBeenCalled();
        });

        it(`allows hod access to: ${route}`, async () => {
          mockUrl.pathname = route;
          const request = createAuthenticatedRequest('hod');
          
          const response = await middleware(request);
          
          expect(NextResponse.next).toHaveBeenCalled();
        });

        it(`denies student access to: ${route}`, async () => {
          mockUrl.pathname = route;
          const request = createAuthenticatedRequest('student');
          
          const response = await middleware(request);
          
          expect(NextResponse.redirect).toHaveBeenCalled();
        });
      });
    });

    describe('Student Routes', () => {
      const studentRoutes = [
        '/student/assignments',
        '/student/profile',
        '/student/attendance',
        '/student/results',
        '/student/materials',
        '/student/exam-timetable',
        '/student/courses'
      ];

      studentRoutes.forEach(route => {
        it(`allows student access to: ${route}`, async () => {
          mockUrl.pathname = route;
          const request = createAuthenticatedRequest('student');
          
          const response = await middleware(request);
          
          expect(NextResponse.next).toHaveBeenCalled();
        });

        it(`denies faculty access to: ${route}`, async () => {
          mockUrl.pathname = route;
          const request = createAuthenticatedRequest('faculty');
          
          const response = await middleware(request);
          
          expect(NextResponse.redirect).toHaveBeenCalled();
        });
      });
    });

    describe('HOD Routes', () => {
      it('allows hod access to hod dashboard', async () => {
        mockUrl.pathname = '/dashboard/hod';
        const request = createAuthenticatedRequest('hod');
        
        const response = await middleware(request);
        
        expect(NextResponse.next).toHaveBeenCalled();
      });

      it('allows department_admin access to hod dashboard', async () => {
        mockUrl.pathname = '/dashboard/hod';
        const request = createAuthenticatedRequest('department_admin');
        
        const response = await middleware(request);
        
        expect(NextResponse.next).toHaveBeenCalled();
      });

      it('denies student access to hod dashboard', async () => {
        mockUrl.pathname = '/dashboard/hod';
        const request = createAuthenticatedRequest('student');
        
        const response = await middleware(request);
        
        expect(NextResponse.redirect).toHaveBeenCalled();
      });
    });

    describe('Committee Routes', () => {
      it('allows committee_convener access to committee meetings', async () => {
        mockUrl.pathname = '/committee/meetings';
        const request = createAuthenticatedRequest('committee_convener');
        
        const response = await middleware(request);
        
        expect(NextResponse.next).toHaveBeenCalled();
      });

      it('allows committee_co_convener access to committee meetings', async () => {
        mockUrl.pathname = '/committee/meetings';
        const request = createAuthenticatedRequest('committee_co_convener');
        
        const response = await middleware(request);
        
        expect(NextResponse.next).toHaveBeenCalled();
      });

      it('denies regular faculty access to committee meetings', async () => {
        mockUrl.pathname = '/committee/meetings';
        const request = createAuthenticatedRequest('faculty');
        
        const response = await middleware(request);
        
        expect(NextResponse.redirect).toHaveBeenCalled();
      });
    });

    describe('Project Fair Routes', () => {
      it('allows jury access to project fair jury section', async () => {
        mockUrl.pathname = '/project-fair/jury';
        const request = createAuthenticatedRequest('jury');
        
        const response = await middleware(request);
        
        expect(NextResponse.next).toHaveBeenCalled();
      });

      it('allows faculty access to project fair jury section', async () => {
        mockUrl.pathname = '/project-fair/jury';
        const request = createAuthenticatedRequest('faculty');
        
        const response = await middleware(request);
        
        expect(NextResponse.next).toHaveBeenCalled();
      });

      it('allows student access to project fair student section', async () => {
        mockUrl.pathname = '/project-fair/student';
        const request = createAuthenticatedRequest('student');
        
        const response = await middleware(request);
        
        expect(NextResponse.next).toHaveBeenCalled();
      });

      it('denies student access to project fair admin section', async () => {
        mockUrl.pathname = '/project-fair/admin';
        const request = createAuthenticatedRequest('student');
        
        const response = await middleware(request);
        
        expect(NextResponse.redirect).toHaveBeenCalled();
      });
    });

    describe('Special Administrative Routes', () => {
      it('allows dte_admin access to DTE dashboard', async () => {
        mockUrl.pathname = '/dte/dashboard';
        const request = createAuthenticatedRequest('dte_admin');
        
        const response = await middleware(request);
        
        expect(NextResponse.next).toHaveBeenCalled();
      });

      it('allows gtu_admin access to GTU dashboard', async () => {
        mockUrl.pathname = '/gtu/dashboard';
        const request = createAuthenticatedRequest('gtu_admin');
        
        const response = await middleware(request);
        
        expect(NextResponse.next).toHaveBeenCalled();
      });

      it('denies regular admin access to DTE dashboard', async () => {
        mockUrl.pathname = '/dte/dashboard';
        const request = createAuthenticatedRequest('admin');
        
        const response = await middleware(request);
        
        expect(NextResponse.redirect).toHaveBeenCalled();
      });
    });
  });

  describe('Dashboard Access', () => {
    it('allows any authenticated user to access general dashboard', async () => {
      mockUrl.pathname = '/dashboard';
      const roles = ['student', 'faculty', 'admin', 'hod', 'jury'];

      for (const role of roles) {
        const request = createAuthenticatedRequest(role);
        
        const response = await middleware(request);
        
        expect(NextResponse.next).toHaveBeenCalled();
      }
    });

    it('denies access to users with unknown role', async () => {
      mockUrl.pathname = '/dashboard';
      const request = createAuthenticatedRequest('unknown');
      
      const response = await middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalled();
    });
  });

  describe('Route Priority and Specificity', () => {
    it('applies most specific route rules first', async () => {
      // /admin/users should require admin/super_admin, not just any admin access
      mockUrl.pathname = '/admin/users';
      const request = createAuthenticatedRequest('hod'); // HOD has admin access but not to /admin/users
      
      const response = await middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it('falls back to general rules for non-specific routes', async () => {
      mockUrl.pathname = '/admin/some-new-section';
      const request = createAuthenticatedRequest('admin');
      
      const response = await middleware(request);
      
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe('Authentication Redirects', () => {
    it('redirects authenticated users from login page to dashboard', async () => {
      mockUrl.pathname = '/login';
      const request = createAuthenticatedRequest('student');
      
      const response = await middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/dashboard')
        })
      );
    });

    it('redirects authenticated users from signup page to dashboard', async () => {
      mockUrl.pathname = '/signup';
      const request = createAuthenticatedRequest('faculty');
      
      const response = await middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/dashboard')
        })
      );
    });
  });

  describe('Role-Specific Redirects', () => {
    it('redirects HOD to HOD dashboard on access denial', async () => {
      mockUrl.pathname = '/admin/users'; // HOD doesn't have access
      const request = createAuthenticatedRequest('hod');
      
      const response = await middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/dashboard/hod')
        })
      );
    });

    it('redirects department_admin to HOD dashboard on access denial', async () => {
      mockUrl.pathname = '/admin/users';
      const request = createAuthenticatedRequest('department_admin');
      
      const response = await middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/dashboard/hod')
        })
      );
    });

    it('redirects committee roles to committee dashboard on access denial', async () => {
      mockUrl.pathname = '/admin/users';
      const request = createAuthenticatedRequest('committee_convener');
      
      const response = await middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/dashboard/committee')
        })
      );
    });

    it('redirects dte_admin to DTE dashboard on access denial', async () => {
      mockUrl.pathname = '/admin/users';
      const request = createAuthenticatedRequest('dte_admin');
      
      const response = await middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/dte/dashboard')
        })
      );
    });

    it('redirects gtu_admin to GTU dashboard on access denial', async () => {
      mockUrl.pathname = '/admin/users';
      const request = createAuthenticatedRequest('gtu_admin');
      
      const response = await middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/gtu/dashboard')
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('handles malformed auth cookie gracefully', async () => {
      mockUrl.pathname = '/dashboard';
      (mockRequest.cookies!.get as jest.Mock).mockReturnValue({
        value: 'invalid-json'
      });
      
      const response = await middleware(mockRequest as NextRequest);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/login')
        })
      );
    });

    it('handles missing required fields in auth cookie', async () => {
      mockUrl.pathname = '/dashboard';
      const invalidAuthUser = {
        email: 'test@example.com'
        // Missing activeRole and availableRoles
      };
      
      (mockRequest.cookies!.get as jest.Mock).mockReturnValue({
        value: encodeURIComponent(JSON.stringify(invalidAuthUser))
      });
      
      const response = await middleware(mockRequest as NextRequest);
      
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/login')
        })
      );
    });

    it('handles non-string role values', async () => {
      mockUrl.pathname = '/dashboard';
      const invalidAuthUser = {
        email: 'test@example.com',
        name: 'Test User',
        activeRole: null,
        availableRoles: ['student']
      };
      
      (mockRequest.cookies!.get as jest.Mock).mockReturnValue({
        value: encodeURIComponent(JSON.stringify(invalidAuthUser))
      });
      
      const response = await middleware(mockRequest as NextRequest);
      
      // Should default to 'unknown' role and likely redirect
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it('handles invalid availableRoles array', async () => {
      mockUrl.pathname = '/dashboard';
      const invalidAuthUser = {
        email: 'test@example.com',
        name: 'Test User',
        activeRole: 'student',
        availableRoles: null
      };
      
      (mockRequest.cookies!.get as jest.Mock).mockReturnValue({
        value: encodeURIComponent(JSON.stringify(invalidAuthUser))
      });
      
      const response = await middleware(mockRequest as NextRequest);
      
      // Should default to ['unknown'] and allow basic dashboard access
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe('Console Logging', () => {
    it('logs access attempts and decisions', async () => {
      // Temporarily restore console.warn to test logging
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      mockUrl.pathname = '/admin/users';
      const request = createAuthenticatedRequest('student');
      
      await middleware(request);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('tried to access /admin/users without permission')
      );
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Matcher Configuration', () => {
    // These routes should be excluded by the matcher
    const excludedRoutes = [
      '/api/auth/callback',
      '/_next/static/chunks/main.js',
      '/_next/image/avatar.png',
      '/favicon.ico',
      '/slidev-builds/presentation.html'
    ];

    excludedRoutes.forEach(route => {
      it(`should be excluded by matcher: ${route}`, async () => {
        // Since we can't test the matcher directly, we verify these routes
        // are handled as static assets in the middleware logic
        mockUrl.pathname = route;
        
        const response = await middleware(mockRequest as NextRequest);
        
        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();
      });
    });
  });

  describe('Notifications Access', () => {
    it('allows all authenticated users to access notifications', async () => {
      mockUrl.pathname = '/notifications';
      const roles = ['student', 'faculty', 'admin', 'hod', 'institute_admin'];

      for (const role of roles) {
        jest.clearAllMocks();
        const request = createAuthenticatedRequest(role);
        
        const response = await middleware(request);
        
        expect(NextResponse.next).toHaveBeenCalled();
        expect(NextResponse.redirect).not.toHaveBeenCalled();
      }
    });
  });

  describe('Committee Dashboard Routes', () => {
    it('allows committee roles to access committee dashboard', async () => {
      mockUrl.pathname = '/dashboard/committee';
      const committeeRoles = [
        'committee_convener',
        'committee_co_convener',
        'committee_member'
      ];

      for (const role of committeeRoles) {
        jest.clearAllMocks();
        const request = createAuthenticatedRequest(role);
        
        const response = await middleware(request);
        
        expect(NextResponse.next).toHaveBeenCalled();
      }
    });

    it('denies non-committee roles access to committee dashboard', async () => {
      mockUrl.pathname = '/dashboard/committee';
      const request = createAuthenticatedRequest('student');
      
      const response = await middleware(request);
      
      expect(NextResponse.redirect).toHaveBeenCalled();
    });
  });

  const createAuthenticatedRequest = (role: string, availableRoles?: string[]) => {
    const authUser = {
      email: 'test@example.com',
      name: 'Test User',
      activeRole: role,
      availableRoles: availableRoles || [role]
    };

    (mockRequest.cookies!.get as jest.Mock).mockReturnValue({
      value: encodeURIComponent(JSON.stringify(authUser))
    });

    return mockRequest as NextRequest;
  };
});