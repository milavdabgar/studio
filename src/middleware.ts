import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { UserRole as UserRoleCode, Role } from '@/types/entities'; // UserRole is now UserRoleCode

// This would ideally fetch from an API or shared config in a real app
// For middleware, direct API fetch might be slow. Consider embedding essential roles or using a faster mechanism.
// As a temporary measure, keep a static list of essential system role CODES.
const SYSTEM_ROLE_CODES = ['admin', 'student', 'faculty', 'hod', 'jury', 'unknown', 'super_admin', 'committee_convener', 'committee_co_convener', 'committee_member'];

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
  '/courses',
  '/assignments',
  '/committee', 
];

const PUBLIC_ROUTES = [
  '/', 
  '/login',
  '/signup',
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
  '/faculty/students': ['faculty', 'hod', 'admin', 'super_admin'],
  '/committee/meetings': ['committee_convener', 'committee_co_convener', 'admin', 'super_admin'], // Example of using codes
  // Generic committee dashboard access based on role code pattern matching.
};


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticatedUser = isAuthenticated(request);
  
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/') || 
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

    let hasAccess = false;
    const activeRoleCode = authenticatedUser.activeRole; // This is a role CODE
    
    if (activeRoleCode !== 'unknown') {
        hasAccess = true; // Default access for authenticated users to general protected areas like /dashboard
    }

    const sortedRoutePrefixes = Object.keys(ROLE_ACCESS_CONTROL).sort((a, b) => b.length - a.length);

    for (const routePrefix of sortedRoutePrefixes) {
        if (pathname.startsWith(routePrefix)) {
            if (ROLE_ACCESS_CONTROL[routePrefix].includes(activeRoleCode)) {
                hasAccess = true;
                break; 
            }
            hasAccess = false; // Specific rule matched, but role not allowed
            break; 
        }
    }
    
    // Special handling for generic committee dashboards based on role code pattern
    if (pathname.startsWith('/dashboard/committee')) {
        const isCommitteeRole = activeRoleCode.startsWith('committee_') || activeRoleCode.includes('_convener') || activeRoleCode.includes('_member') || activeRoleCode.includes('_co_convener');
        if (isCommitteeRole) {
            hasAccess = true;
        } else if (!hasAccess) { // If not already granted by a specific rule
             hasAccess = false; // Deny if no other rule matched and it's not a committee role accessing committee dashboard
        }
    }


    if (!hasAccess) {
        console.warn(`User ${authenticatedUser.email} with active role code [${activeRoleCode}] tried to access ${pathname} without permission.`);
        return NextResponse.redirect(new URL('/dashboard', request.url)); 
    }

  } else if (PUBLIC_ROUTES.includes(pathname)) {
    if ((pathname === '/login' || pathname === '/signup') && authenticatedUser) {
       return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}
    