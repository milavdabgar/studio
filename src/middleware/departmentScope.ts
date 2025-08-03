import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/services/authService';
import type { UserRole } from '@/types/entities';

/**
 * Department scoping middleware for HOD and department-level operations
 * Automatically filters data based on user's department association
 */

export interface DepartmentScopeContext {
  departmentId?: string;
  instituteId?: string;
  userRole: UserRole;
  userId: string;
  canAccessAllDepartments: boolean;
}

/**
 * Middleware to add department scoping to API requests
 */
export async function withDepartmentScope(
  request: NextRequest,
  handler: (req: NextRequest, context: DepartmentScopeContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get user from request (authentication should be handled before this middleware)
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - User not found' },
        { status: 401 }
      );
    }

    // Determine department scope based on user role
    const context: DepartmentScopeContext = {
      userRole: user.activeRole,
      userId: user.id,
      canAccessAllDepartments: false
    };

    // Role-based scoping logic
    switch (user.activeRole) {
      case 'hod':
        // HODs can only access their department data
        context.departmentId = user.departmentId;
        context.instituteId = user.instituteId;
        context.canAccessAllDepartments = false;
        break;
        
      case 'department_admin':
        // Department admins can only access their department
        context.departmentId = user.departmentId;
        context.instituteId = user.instituteId;
        context.canAccessAllDepartments = false;
        break;
        
      case 'institute_admin':
      case 'principal':
        // Institute level users can access all departments in their institute
        context.instituteId = user.instituteId;
        context.canAccessAllDepartments = true;
        break;
        
      case 'admin':
      case 'super_admin':
        // System admins can access all data
        context.canAccessAllDepartments = true;
        break;
        
      case 'faculty':
        // Faculty can only access their department (limited scope)
        context.departmentId = user.departmentId;
        context.instituteId = user.instituteId;
        context.canAccessAllDepartments = false;
        break;
        
      default:
        return NextResponse.json(
          { error: 'Insufficient permissions for department operations' },
          { status: 403 }
        );
    }

    // Validate department access for restricted roles
    if (!context.canAccessAllDepartments && !context.departmentId) {
      return NextResponse.json(
        { error: 'Department association required for this operation' },
        { status: 403 }
      );
    }

    // Call the handler with the scoped context
    return await handler(request, context);
    
  } catch (error) {
    console.error('Department scope middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error in department scoping' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to create department-scoped database filters
 */
export function createDepartmentFilter(context: DepartmentScopeContext): Record<string, any> {
  const filter: Record<string, any> = {};
  
  if (!context.canAccessAllDepartments) {
    if (context.departmentId) {
      filter.departmentId = context.departmentId;
    }
    if (context.instituteId && !context.departmentId) {
      filter.instituteId = context.instituteId;
    }
  }
  
  return filter;
}

/**
 * Helper function to create student-scoped filters (includes program-based filtering)
 */
export function createStudentScopeFilter(context: DepartmentScopeContext): Record<string, any> {
  const filter = createDepartmentFilter(context);
  
  // For students, we might need to filter by programs associated with the department
  if (context.departmentId && !context.canAccessAllDepartments) {
    // This would be expanded to include program filtering logic
    // filter.$or = [
    //   { departmentId: context.departmentId },
    //   { 'program.departmentId': context.departmentId }
    // ];
  }
  
  return filter;
}

/**
 * Helper function to create faculty-scoped filters
 */
export function createFacultyScopeFilter(context: DepartmentScopeContext): Record<string, any> {
  const filter = createDepartmentFilter(context);
  
  // Faculty might be associated with multiple departments through assignments
  if (context.departmentId && !context.canAccessAllDepartments) {
    filter.$or = [
      { departmentId: context.departmentId },
      { 'assignments.departmentId': context.departmentId },
      { 'primaryDepartmentId': context.departmentId }
    ];
  }
  
  return filter;
}

/**
 * Helper function to create course offerings scoped filters
 */
export function createCourseOfferingScopeFilter(context: DepartmentScopeContext): Record<string, any> {
  const filter = createDepartmentFilter(context);
  
  // Course offerings are scoped by the offering department
  if (context.departmentId && !context.canAccessAllDepartments) {
    filter.$or = [
      { offeringDepartmentId: context.departmentId },
      { 'course.departmentId': context.departmentId }
    ];
  }
  
  return filter;
}

/**
 * Helper function to create timetable scoped filters
 */
export function createTimetableScopeFilter(context: DepartmentScopeContext): Record<string, any> {
  const filter = createDepartmentFilter(context);
  
  // Timetables are scoped by the managing department
  if (context.departmentId && !context.canAccessAllDepartments) {
    filter.$or = [
      { managingDepartmentId: context.departmentId },
      { 'batch.departmentId': context.departmentId },
      { 'program.departmentId': context.departmentId }
    ];
  }
  
  return filter;
}

/**
 * Helper function to create committee scoped filters
 */
export function createCommitteeScopeFilter(context: DepartmentScopeContext): Record<string, any> {
  const filter = createDepartmentFilter(context);
  
  // Committees can be department-level or institute-level
  if (context.departmentId && !context.canAccessAllDepartments) {
    filter.$or = [
      { departmentId: context.departmentId },
      { scope: 'department', departmentId: context.departmentId },
      { scope: 'institute', instituteId: context.instituteId },
      { 'members.userId': context.userId } // User is a member
    ];
  }
  
  return filter;
}

/**
 * Validation helper to check if user can access specific department data
 */
export function canAccessDepartment(
  context: DepartmentScopeContext, 
  targetDepartmentId: string
): boolean {
  if (context.canAccessAllDepartments) {
    return true;
  }
  
  return context.departmentId === targetDepartmentId;
}

/**
 * Validation helper to check if user can modify department data
 */
export function canModifyDepartmentData(
  context: DepartmentScopeContext,
  targetDepartmentId?: string
): boolean {
  // System admins can modify any department
  if (context.canAccessAllDepartments && 
      ['admin', 'super_admin', 'institute_admin'].includes(context.userRole)) {
    return true;
  }
  
  // HODs and department admins can modify their own department
  if (['hod', 'department_admin'].includes(context.userRole)) {
    return !targetDepartmentId || context.departmentId === targetDepartmentId;
  }
  
  return false;
}

/**
 * Helper to get accessible department IDs for a user
 */
export function getAccessibleDepartmentIds(context: DepartmentScopeContext): string[] {
  if (context.canAccessAllDepartments) {
    // Would return all department IDs in the institute/system
    // This would typically come from a database query
    return []; // Placeholder - implement based on your data structure
  }
  
  return context.departmentId ? [context.departmentId] : [];
}

/**
 * Type guard to check if context has department access
 */
export function hasDepartmentAccess(context: DepartmentScopeContext): boolean {
  return context.canAccessAllDepartments || !!context.departmentId;
}

export default withDepartmentScope;