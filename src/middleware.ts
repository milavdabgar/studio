
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { UserRole as UserRoleCode } from '@/types/entities'; // UserRole is now UserRoleCode

// This would ideally fetch from an API or shared config in a real app
// For middleware, direct API fetch might be slow. Consider embedding essential roles or using a faster mechanism.
// As a temporary measure, keep a static list of essential system role CODES.
// Note: SYSTEM_ROLE_CODES defined for reference but not actively used in current middleware logic
// const SYSTEM_ROLE_CODES = ['admin', 'student', 'faculty', 'hod', 'jury', 'unknown', 'super_admin', 'committee_convener', 'committee_co_convener', 'committee_member'];

interface AuthUser {
  email: string;
  name: string;
  activeRole: UserRoleCode; // Role code
  availableRoles: UserRoleCode[]; // Role codes
}

const isAuthenticated = (request: NextRequest): AuthUser | null => {
  const authUserCookie = request.cookies.get('auth_user')?.value;
  if (authUserCookie) {
    try {
      const decodedCookie = decodeURIComponent(authUserCookie);
      const parsedUser = JSON.parse(decodedCookie) as AuthUser;
      
      if (parsedUser && parsedUser.email && parsedUser.activeRole && parsedUser.availableRoles) {
        const validActiveRole = typeof parsedUser.activeRole === 'string' ? parsedUser.activeRole : 'unknown';
        const validAvailableRoles = Array.isArray(parsedUser.availableRoles) && parsedUser.availableRoles.every(r => typeof r === 'string') 
            ? parsedUser.availableRoles 
            : ['unknown'];

        return { 
          email: parsedUser.email, 
          name: parsedUser.name || parsedUser.email,
          activeRole: validActiveRole, // Should be a role CODE
          availableRoles: validAvailableRoles.length > 0 ? validAvailableRoles : ['unknown'] // Array of role CODES
        };
      }
    } catch (error) {
      console.error("Error parsing auth_user cookie in middleware:", error);
      const response = NextResponse.next(); // Create a response to clear cookie
      response.cookies.set('auth_user', '', { path: '/', maxAge: 0 });
      // Cannot directly return the response with cleared cookie here if we want to redirect or proceed.
      // The act of returning null will cause the caller to handle redirection or access denial.
      // Clearing cookie is best-effort if parsing fails.
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
  // '/courses', // Removing /courses as it might have public-facing course catalog aspects
  '/student/assignments', // Keep student assignments protected
  '/student/profile',
  '/student/attendance',
  '/student/results',
  '/student/materials',
  '/student/exam-timetable',
  '/student/courses/enroll', // Specific enrollment page should be protected
  '/committee', 
  '/notifications', // Notifications should be protected
];

const PUBLIC_ROUTES = [
  '/', 
  '/login',
  '/signup',
  '/api/auth/callback/credentials',
  '/posts', // Add /posts base route
  '/newsletters', // Add newsletters to public routes
  '/about', // Add about page to public routes
  '/departments', // Add departments page to public routes
  '/admissions', // Add admissions page to public routes
  '/library', // Add library page to public routes
  '/facilities', // Add facilities page to public routes
  '/contact', // Add contact page to public routes
  '/ssip', // Add SSIP page to public routes
  '/establishment', // Add establishment page to public routes
  '/student-section', // Add student section page to public routes
  '/tpo', // Add TPO page to public routes
];

// Role access control: Key is route prefix, Value is array of ALLOWED role CODES
const ROLE_ACCESS_CONTROL: Record<string, UserRoleCode[]> = {
  '/admin/users': ['admin', 'super_admin'],
  '/admin/roles': ['admin', 'super_admin'],
  '/admin/institutes': ['admin', 'super_admin', 'hod', 'institute_admin'],
  '/admin/buildings': ['admin', 'super_admin', 'hod', 'institute_admin'],
  '/admin/rooms': ['admin', 'super_admin', 'hod', 'institute_admin'],
  '/admin/students': ['admin', 'super_admin', 'hod', 'faculty', 'institute_admin', 'department_admin'],
  '/admin/faculty': ['admin', 'super_admin', 'hod', 'institute_admin', 'department_admin'],
  '/admin/departments': ['admin', 'super_admin', 'hod', 'institute_admin'],
  '/admin/programs': ['admin', 'super_admin', 'hod', 'institute_admin', 'department_admin'],
  '/admin/courses': ['admin', 'super_admin', 'hod', 'faculty', 'institute_admin', 'department_admin'],
  '/admin/committees': ['admin', 'super_admin', 'institute_admin', 'committee_admin'],
  '/admin': ['admin', 'super_admin', 'hod', 'institute_admin', 'department_admin', 'committee_admin'], 
  '/project-fair/admin': ['admin', 'super_admin', 'hod', 'faculty'],
  '/project-fair/jury': ['jury', 'faculty', 'admin', 'super_admin'],
  '/faculty/courses': ['faculty', 'hod', 'admin', 'super_admin'],
  '/faculty/my-courses': ['faculty', 'hod', 'admin', 'super_admin'],
  '/faculty/students': ['faculty', 'hod', 'admin', 'super_admin'],
  '/faculty/attendance/mark': ['faculty', 'hod', 'admin', 'super_admin'],
  '/faculty/attendance/reports': ['faculty', 'hod', 'admin', 'super_admin'],
  '/faculty/assessments': ['faculty', 'hod', 'admin', 'super_admin'],
  '/faculty/assessments/grade': ['faculty', 'hod', 'admin', 'super_admin'],
  '/faculty/leaves': ['faculty', 'hod', 'admin', 'super_admin'],
  '/faculty/profile': ['faculty', 'hod', 'admin', 'super_admin'],
  '/faculty/timetable': ['faculty', 'hod', 'admin', 'super_admin'],
  '/faculty/course-offerings': ['faculty', 'hod', 'admin', 'super_admin'],
  '/faculty/exam-timetable': ['faculty', 'hod', 'admin', 'super_admin'],
  '/committee/meetings': ['committee_convener', 'committee_co_convener', 'admin', 'super_admin'], 
};


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticatedUser = isAuthenticated(request);
  
  // Allow static assets and API routes to pass through
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/') || 
      pathname.includes('.')) { // Common check for files like .ico, .png
    return NextResponse.next();
  }

  // Check if the route is public first
  if (PUBLIC_ROUTES.includes(pathname) || 
      pathname.startsWith('/posts') || 
      pathname.startsWith('/newsletters') ||
      pathname.startsWith('/departments/')) {
    // If accessing login or signup while already authenticated, redirect to dashboard
    if ((pathname === '/login' || pathname === '/signup') && authenticatedUser) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  const isProtectedRoute = PROTECTED_ROUTES_PREFIXES.some(prefix => pathname.startsWith(prefix));
  
  if (isProtectedRoute) {
    if (!authenticatedUser) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname); 
      return NextResponse.redirect(loginUrl);
    }

    let hasAccess = false;
    const activeRoleCode = authenticatedUser.activeRole;
    
    // Default access for general protected dashboard for any authenticated user (if not more specific rule applies)
    if (pathname === '/dashboard' && activeRoleCode !== 'unknown') {
        hasAccess = true;
    }

    const sortedRoutePrefixes = Object.keys(ROLE_ACCESS_CONTROL).sort((a, b) => b.length - a.length);

    for (const routePrefix of sortedRoutePrefixes) {
        if (pathname.startsWith(routePrefix)) {
            if (ROLE_ACCESS_CONTROL[routePrefix].includes(activeRoleCode)) {
                hasAccess = true;
            } else {
                hasAccess = false; // Specific rule matched, but role not allowed
            }
            break; 
        }
    }
    
    // Special handling for generic committee dashboards
    if (pathname.startsWith('/dashboard/committee')) {
        const isCommitteeRole = activeRoleCode.startsWith('committee_') || 
                                activeRoleCode.includes('_convener') || 
                                activeRoleCode.includes('_member') || 
                                activeRoleCode.includes('_co_convener');
        if (isCommitteeRole) {
            hasAccess = true;
        } else if (!hasAccess && !ROLE_ACCESS_CONTROL[pathname]) { // If no specific rule already granted access
             hasAccess = false; 
        }
    }
    // Allow access to specific HOD dashboard if role is HOD
    if (pathname.startsWith('/dashboard/hod') && activeRoleCode === 'hod') {
        hasAccess = true;
    }
    // Allow access to DTE dashboard if role is dte_admin
    if (pathname.startsWith('/dte/dashboard') && activeRoleCode === 'dte_admin') {
        hasAccess = true;
    }
    // Allow access to GTU dashboard if role is gtu_admin
    if (pathname.startsWith('/gtu/dashboard') && activeRoleCode === 'gtu_admin') {
        hasAccess = true;
    }


    if (!hasAccess) {
        console.warn(`User ${authenticatedUser.email} with active role code [${activeRoleCode}] tried to access ${pathname} without permission.`);
        // Redirect to their default dashboard or a generic access denied page
        let redirectPath = '/dashboard'; // Default redirect
        if (activeRoleCode === 'hod' || activeRoleCode === 'department_admin') redirectPath = '/dashboard/hod';
        else if (activeRoleCode.startsWith('committee_')) redirectPath = '/dashboard/committee';
        else if (activeRoleCode === 'dte_admin') redirectPath = '/dte/dashboard';
        else if (activeRoleCode === 'gtu_admin') redirectPath = '/gtu/dashboard';
        
        return NextResponse.redirect(new URL(redirectPath, request.url)); 
    }

  }
  
  return NextResponse.next();
}
    
// Matcher to apply middleware to all routes except static assets and API routes
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons/).*)',
  ],
}
