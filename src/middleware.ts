
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { UserRole, Role } from '@/types/entities'; // Import Role

// This would ideally fetch from an API or shared config in a real app
// For middleware, direct API fetch might be slow. Consider embedding essential roles or using a faster mechanism.
// As a temporary measure, keep a static list of essential system role CODES.
const SYSTEM_ROLE_CODES = ['admin', 'student', 'faculty', 'hod', 'jury', 'unknown', 'super_admin'];

interface AuthUser {
  email: string;
  name: string;
  activeRole: UserRole; // This should be a role NAME
  availableRoles: UserRole[]; // These are role NAMES
}

const isAuthenticated = (request: NextRequest): AuthUser | null => {
  const authUserCookie = request.cookies.get('auth_user')?.value;
  if (authUserCookie) {
    try {
      const decodedCookie = decodeURIComponent(authUserCookie);
      const parsedUser = JSON.parse(decodedCookie) as AuthUser;
      
      if (parsedUser && parsedUser.email && parsedUser.activeRole && parsedUser.availableRoles) {
        // Basic validation for activeRole and availableRoles structure
        const validActiveRole = typeof parsedUser.activeRole === 'string' ? parsedUser.activeRole : 'unknown';
        const validAvailableRoles = Array.isArray(parsedUser.availableRoles) && parsedUser.availableRoles.every(r => typeof r === 'string') 
            ? parsedUser.availableRoles 
            : ['unknown'];

        return { 
          email: parsedUser.email, 
          name: parsedUser.name || parsedUser.email,
          activeRole: validActiveRole, 
          availableRoles: validAvailableRoles.length > 0 ? validAvailableRoles : ['unknown'] 
        };
      }
    } catch (error) {
      console.error("Error parsing auth_user cookie in middleware:", error);
      const response = NextResponse.next();
      response.cookies.set('auth_user', '', { path: '/', maxAge: 0 });
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
  '/committee', // New prefix for committee related pages
];

const PUBLIC_ROUTES = [
  '/', 
  '/login',
  '/signup',
];

// Role access control: Key is route prefix, Value is array of ALLOWED role CODES
const ROLE_ACCESS_CONTROL: Record<string, UserRole[]> = {
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
  '/project-fair/jury': ['jury', 'faculty', 'admin', 'hod', 'super_admin'],
  '/faculty/courses': ['faculty', 'hod', 'admin', 'super_admin'],
  '/faculty/students': ['faculty', 'hod', 'admin', 'super_admin'],
  '/committee/my-committee': ['committee_convener', 'committee_co_convener', 'committee_member', 'admin', 'super_admin'], // Example
  '/committee/meetings': ['committee_convener', 'committee_co_convener', 'admin', 'super_admin'], // Example
};


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticatedUser = isAuthenticated(request);

  // Fetch all system roles once (this could be cached or pre-loaded)
  // For middleware, direct API calls on every request can be slow.
  // A better approach for production would be to:
  // 1. Fetch roles less frequently and cache them (e.g., in a global variable or Redis if available).
  // 2. Or, embed essential role-permission mappings if they are relatively static.
  // For now, we'll proceed with a simplified check based on known role codes.
  // If dynamic roles become very complex, a more robust RBAC system or API call is needed.
  
  // In a real scenario, fetch roles from your API:
  // const allSystemRolesResponse = await fetch(new URL('/api/roles', request.url).toString());
  // const allSystemRoles: Role[] = allSystemRolesResponse.ok ? await allSystemRolesResponse.json() : [];
  // For this example, we rely on the activeRole string from the cookie.

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
    const activeRoleName = authenticatedUser.activeRole; // This is a role NAME from the cookie
    
    // The activeRole in the cookie is the role NAME. We need to map it to a CODE if your ROLE_ACCESS_CONTROL uses codes.
    // For now, let's assume activeRole from cookie can be directly compared if it matches the codes in ROLE_ACCESS_CONTROL
    // Or, we update ROLE_ACCESS_CONTROL to use role names, or ensure cookie stores activeRole as code.
    // Simpler: if activeRole is a known system role CODE, use it. Otherwise, it might be a dynamic role name.

    if (activeRoleName !== 'unknown') {
        hasAccess = true; // Default access for authenticated users to general protected areas
    }

    const sortedRoutePrefixes = Object.keys(ROLE_ACCESS_CONTROL).sort((a, b) => b.length - a.length);

    for (const routePrefix of sortedRoutePrefixes) {
        if (pathname.startsWith(routePrefix)) {
            // This check assumes activeRoleName from cookie can be directly compared to codes in ROLE_ACCESS_CONTROL.
            // If activeRoleName is "Admin" (name) and ROLE_ACCESS_CONTROL has "admin" (code), it needs mapping.
            // For dynamic committee roles, activeRoleName will be like "CWAN Convener".
            // We need to check if any of the user's *availableRoles* (which are also names) map to a code that has access.
            
            // Simplification: If activeRoleName is a direct match in the allowed list (assuming names match codes for system roles)
            if (ROLE_ACCESS_CONTROL[routePrefix].includes(activeRoleName as UserRole)) {
                hasAccess = true;
                break;
            }
            // For dynamic roles like "CWAN Convener", they might not be in ROLE_ACCESS_CONTROL directly for specific admin routes.
            // Access to generic /committee/* routes should be handled separately or by adding specific committee role codes/names to ROLE_ACCESS_CONTROL.
            // For example, if /committee/my-committee requires 'committee_convener' (code), and user's activeRole is 'CWAN Convener' (name), a mapping is needed.
            // Or, the cookie's activeRole should store the role CODE.
            
            // Fallback to false if specific route rule exists and doesn't match.
            hasAccess = false; 
            break; 
        }
    }
    
    if (pathname.startsWith('/dashboard/committee') && authenticatedUser.activeRole.toLowerCase().includes('committee')) {
      hasAccess = true; // Allow access to generic committee dashboard for any committee role.
    }


    if (!hasAccess) {
        console.warn(`User ${authenticatedUser.email} with active role [${activeRoleName}] tried to access ${pathname} without permission.`);
        return NextResponse.redirect(new URL('/dashboard', request.url)); 
    }

  } else if (PUBLIC_ROUTES.includes(pathname)) {
    if ((pathname === '/login' || pathname === '/signup') && authenticatedUser) {
       return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}
