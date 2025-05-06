
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type UserRole = 'admin' | 'student' | 'faculty' | 'hod' | 'jury' | 'unknown';

interface AuthUser {
  email: string;
  roles: UserRole[]; // Changed from role: string to roles: UserRole[]
}

const isAuthenticated = (request: NextRequest): AuthUser | null => {
  const authUserCookie = request.cookies.get('auth_user')?.value;
  if (authUserCookie) {
    try {
      const decodedCookie = decodeURIComponent(authUserCookie);
      const parsedUser = JSON.parse(decodedCookie) as { email: string; roles: UserRole[] | UserRole }; // Allow single role for backward compatibility during transition
      
      if (parsedUser && parsedUser.email) {
        let rolesArray: UserRole[];
        if (Array.isArray(parsedUser.roles)) {
          rolesArray = parsedUser.roles;
        } else if (typeof parsedUser.roles === 'string') { // Handle old single role format
          rolesArray = [parsedUser.roles];
        } else {
          rolesArray = ['unknown']; // Default if roles format is unexpected
        }
        
        // Ensure roles are valid UserRole types
        const validRoles = rolesArray.filter(role => 
          ['admin', 'student', 'faculty', 'hod', 'jury', 'unknown'].includes(role)
        );

        return { email: parsedUser.email, roles: validRoles.length > 0 ? validRoles : ['unknown'] };
      }
    } catch (error) {
      console.error("Error parsing auth_user cookie in middleware:", error);
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
  '/faculty',
  '/courses',
  '/assignments',
];

const PUBLIC_ROUTES = [
  '/', 
  '/login',
  '/signup',
];

// Example: Define which roles can access which prefixes
const ROLE_ACCESS: Record<string, UserRole[]> = {
  '/admin': ['admin', 'hod'], // Only admin and hod can access /admin/*
  '/project-fair/admin': ['admin', 'hod'],
  '/project-fair/jury': ['jury', 'faculty', 'admin', 'hod'], // Jury, faculty, admin, hod can access jury pages
  '/faculty': ['faculty', 'hod', 'admin'],
  // Add more specific rules as needed
};


export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticatedUser = isAuthenticated(request);

  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') || 
      pathname.includes('.')) { 
    return NextResponse.next();
  }

  const isProtectedRoute = PROTECTED_ROUTES_PREFIXES.some(prefix => pathname.startsWith(prefix));
  
  if (isProtectedRoute) {
    if (!authenticatedUser) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname); 
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access control
    let hasAccess = false;
    // Default: if no specific rule, allow if any role is not 'unknown'
    if (authenticatedUser.roles.length > 0 && !authenticatedUser.roles.includes('unknown')) {
        hasAccess = true; 
    }

    for (const routePrefix in ROLE_ACCESS) {
        if (pathname.startsWith(routePrefix)) {
            // User has access if any of their roles are in the allowed list for this prefix
            hasAccess = authenticatedUser.roles.some(userRole => ROLE_ACCESS[routePrefix].includes(userRole));
            break; // Found the most specific rule, stop checking
        }
    }
    // Special handling for /dashboard - any authenticated user can access it
    if (pathname.startsWith('/dashboard')) {
        hasAccess = true;
    }


    if (!hasAccess) {
        // Redirect to dashboard or an unauthorized page if user doesn't have the right role
        // For simplicity, redirecting to dashboard. An '/unauthorized' page would be better.
        console.warn(`User ${authenticatedUser.email} with roles [${authenticatedUser.roles.join(', ')}] tried to access ${pathname} without permission.`);
        return NextResponse.redirect(new URL('/dashboard', request.url)); 
    }

  } else if (PUBLIC_ROUTES.includes(pathname)) {
    if ((pathname === '/login' || pathname === '/signup') && authenticatedUser) {
       return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}
