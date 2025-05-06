
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface AuthUser {
  email: string;
  role: string;
}

// This is a placeholder for actual authentication logic.
// In a real application, you would use NextAuth.js or a similar library
// to check for a valid session and user roles.
const isAuthenticated = (request: NextRequest): AuthUser | null => {
  const authUserCookie = request.cookies.get('auth_user')?.value;
  if (authUserCookie) {
    try {
      const decodedCookie = decodeURIComponent(authUserCookie);
      const parsedUser = JSON.parse(decodedCookie) as AuthUser;
      // Add more validation if needed (e.g., check for specific properties)
      if (parsedUser && parsedUser.email && parsedUser.role) {
        return parsedUser;
      }
    } catch (error) {
      console.error("Error parsing auth_user cookie in middleware:", error);
      // Invalid cookie, treat as unauthenticated
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
  // Note: '/results' itself is not listed, so /results/some-public-report might be allowed if not caught by other logic.
  // If /results/* needs protection, consider adding '/results' to this list or be more specific.
];

const PUBLIC_ROUTES = [
  '/', // Landing page
  '/login',
  '/signup',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticatedUser = isAuthenticated(request);

  // Allow requests for API routes, static files, and image optimization
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') || 
      pathname.includes('.')) { // commonly used for static assets like .png, .jpg
    return NextResponse.next();
  }

  const isProtectedRoute = PROTECTED_ROUTES_PREFIXES.some(prefix => pathname.startsWith(prefix));
  
  if (isProtectedRoute) {
    if (!authenticatedUser) {
      // Redirect to login page if not authenticated and trying to access a protected route
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname); 
      return NextResponse.redirect(loginUrl);
    }
    // TODO: Add role-based access control here based on authenticatedUser.role
    // For example:
    // if (pathname.startsWith('/admin') && authenticatedUser.role !== 'admin') {
    //   return NextResponse.redirect(new URL('/unauthorized', request.url)); // Or redirect to dashboard
    // }
  } else if (PUBLIC_ROUTES.includes(pathname)) {
    // If authenticated and trying to access login/signup, redirect to dashboard
    if ((pathname === '/login' || pathname === '/signup') && authenticatedUser) {
       return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

// Config to specify paths for middleware execution (optional but recommended for performance)
// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      */
//     '/((?!api|_next/static|_next/image|favicon.ico).*)',
//   ],
// }
