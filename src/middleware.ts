

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type UserRole = 'admin' | 'student' | 'faculty' | 'hod' | 'jury' | 'unknown';

interface AuthUser {
  email: string;
  name: string;
  activeRole: UserRole;
  availableRoles: UserRole[];
}

const isAuthenticated = (request: NextRequest): AuthUser | null => {
  const authUserCookie = request.cookies.get('auth_user')?.value;
  if (authUserCookie) {
    try {
      const decodedCookie = decodeURIComponent(authUserCookie);
      const parsedUser = JSON.parse(decodedCookie) as AuthUser;
      
      if (parsedUser && parsedUser.email && parsedUser.activeRole && parsedUser.availableRoles) {
        // Validate activeRole and availableRoles
        const validActiveRole = ['admin', 'student', 'faculty', 'hod', 'jury', 'unknown'].includes(parsedUser.activeRole) ? parsedUser.activeRole : 'unknown';
        const validAvailableRoles = parsedUser.availableRoles.filter(role => 
          ['admin', 'student', 'faculty', 'hod', 'jury', 'unknown'].includes(role)
        );

        return { 
          email: parsedUser.email, 
          name: parsedUser.name || parsedUser.email,
          activeRole: validActiveRole, 
          availableRoles: validAvailableRoles.length > 0 ? validAvailableRoles : ['unknown'] 
        };
      }
    } catch (error) {
      console.error("Error parsing auth_user cookie in middleware:", error);
      // Invalidate cookie if parsing fails
      const response = NextResponse.next();
      response.cookies.set('auth_user', '', { path: '/', maxAge: 0 });
      // It's tricky to return this response directly from here, so for now, just log and return null
      return null;
    }
  }
  return null; 
};

const PROTECTED_ROUTES_PREFIXES = [
  '/dashboard',
  '/admin',
  '/project-fair/admin',
  '/project-fair/jury',
  '/project-fair/student',
  '/results/history', 
  '/faculty', // This is a general prefix, more specific /faculty/... routes below
  '/courses',
  '/assignments',
];

const PUBLIC_ROUTES = [
  '/', 
  '/login',
  '/signup',
];

// Role access is now based on the *activeRole*
const ROLE_ACCESS_CONTROL: Record<string, UserRole[]> = {
  '/admin/users': ['admin'],
  '/admin/roles': ['admin'],
  '/admin/students': ['admin', 'hod'],
  '/admin/faculty': ['admin', 'hod'],
  '/admin/departments': ['admin', 'hod'],
  '/admin/programs': ['admin', 'hod'],
  '/admin/courses': ['admin', 'hod'],
  '/admin': ['admin', 'hod'], 
  '/project-fair/admin': ['admin', 'hod'],
  '/project-fair/jury': ['jury', 'faculty', 'admin', 'hod'],
  '/faculty/courses': ['faculty', 'hod', 'admin'], // Example more specific route
  '/faculty/students': ['faculty', 'hod', 'admin'], // Example
  // Add more specific rules as needed. Routes not listed here but starting with a protected prefix
  // will be accessible if the user has any role other than 'unknown' for their activeRole.
};


export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticatedUser = isAuthenticated(request);

  // Allow Next.js internals and static assets
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/') || // Assuming API routes might have their own auth
      pathname.includes('.')) { // asset files like .png, .css
    return NextResponse.next();
  }

  const isProtectedRoute = PROTECTED_ROUTES_PREFIXES.some(prefix => pathname.startsWith(prefix));
  
  if (isProtectedRoute) {
    if (!authenticatedUser) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname); 
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access control based on activeRole
    let hasAccess = false;
    const activeRole = authenticatedUser.activeRole;

    // Default for protected routes: if no specific rule, allow if activeRole is not 'unknown'
    if (activeRole !== 'unknown') {
        hasAccess = true; 
    }

    // Check against specific rules in ROLE_ACCESS_CONTROL
    // Iterate in a way that more specific paths are checked first
    const sortedRoutePrefixes = Object.keys(ROLE_ACCESS_CONTROL).sort((a, b) => b.length - a.length);

    for (const routePrefix of sortedRoutePrefixes) {
        if (pathname.startsWith(routePrefix)) {
            hasAccess = ROLE_ACCESS_CONTROL[routePrefix].includes(activeRole);
            break; 
        }
    }
    
    // Special handling for /dashboard - any authenticated user (with a non-'unknown' active role) can access it.
    // This is already covered by the default access rule above.

    if (!hasAccess) {
        console.warn(`User ${authenticatedUser.email} with active role [${activeRole}] tried to access ${pathname} without permission.`);
        // Redirect to dashboard, which should always be accessible if logged in.
        // If dashboard itself is restricted, this might loop. Consider an 'unauthorized' page.
        return NextResponse.redirect(new URL('/dashboard', request.url)); 
    }

  } else if (PUBLIC_ROUTES.includes(pathname)) {
    // If user is authenticated and tries to access login/signup, redirect to dashboard
    if ((pathname === '/login' || pathname === '/signup') && authenticatedUser) {
       return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}



