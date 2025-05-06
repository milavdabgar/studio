import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This is a placeholder for actual authentication logic.
// In a real application, you would use NextAuth.js or a similar library
// to check for a valid session and user roles.
const isAuthenticated = (request: NextRequest): boolean => {
  // For now, let's assume a cookie 'auth_token' signifies authentication.
  // This is NOT secure for production.
  const authToken = request.cookies.get('auth_token')?.value;
  return !!authToken; 
};

const PROTECTED_ROUTES_PREFIXES = [
  '/dashboard',
  '/admin',
  '/project-fair/admin',
  '/project-fair/jury',
  '/project-fair/student',
  '/results/', // Matches /results/:id and /results/history/:studentId
];

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow requests for API routes, static files, and image optimization
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') || 
      pathname.includes('.')) { // commonly used for static assets like .png, .jpg
    return NextResponse.next();
  }

  const isProtectedRoute = PROTECTED_ROUTES_PREFIXES.some(prefix => pathname.startsWith(prefix));
  
  // Special handling for /results exactly, if it's meant to be public or has a different auth logic.
  // The current prefix logic makes /results itself protected. If /results should be public, adjust PROTECTED_ROUTES_PREFIXES.

  if (isProtectedRoute) {
    if (!isAuthenticated(request)) {
      // Redirect to login page if not authenticated and trying to access a protected route
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname); // Optional: pass original path for redirect after login
      return NextResponse.redirect(loginUrl);
    }
    // TODO: Add role-based access control here
    // For example, check user role against allowed roles for the specific path.
    // If access is denied, redirect to an unauthorized page or dashboard.
  } else if (PUBLIC_ROUTES.includes(pathname)) {
    // If authenticated and trying to access login/signup, redirect to dashboard
    // This is optional and depends on desired UX.
    if ((pathname === '/login' || pathname === '/signup') && isAuthenticated(request)) {
       return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

// Optionally, you can specify a matcher to define which paths this middleware should run on.
// This can improve performance by not running middleware on every request.
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
