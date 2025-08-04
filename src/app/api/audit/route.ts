import { NextResponse, type NextRequest } from 'next/server';
import { auditLogger } from '@/lib/audit/audit-logger';
import { withAPIRoleAccess, type APIAccessContext } from '@/lib/auth/api-middleware';

async function handleGetAuditLogs(request: NextRequest, context: APIAccessContext) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const userId = searchParams.get('userId') || undefined;
    const userRole = searchParams.get('userRole') || undefined;
    const action = searchParams.get('action') || undefined;
    const resource = searchParams.get('resource') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    // Apply department filtering for non-admin users
    let departmentId: string | undefined;
    if (!context.canViewAllDepartments && context.departmentFilter) {
      departmentId = context.departmentFilter;
    }

    const filters = {
      userId,
      userRole,
      action,
      resource,
      status,
      departmentId,
      startDate,
      endDate,
      limit
    };

    const logs = await auditLogger.getLogs(filters);

    return NextResponse.json({
      logs,
      total: logs.length,
      filters: filters
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({
      message: 'Error fetching audit logs',
      error: (error as Error).message
    }, { status: 500 });
  }
}

async function handleGetAuditSummary(request: NextRequest, context: APIAccessContext) {
  try {
    // Apply department filtering for non-admin users
    const departmentId = !context.canViewAllDepartments && context.departmentFilter 
      ? context.departmentFilter 
      : undefined;

    const summary = await auditLogger.getAuditSummary(departmentId);

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Error fetching audit summary:', error);
    return NextResponse.json({
      message: 'Error fetching audit summary',
      error: (error as Error).message
    }, { status: 500 });
  }
}

// Export wrapped functions for API routes
export const GET = withAPIRoleAccess(async (request: NextRequest, context: APIAccessContext) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'summary') {
    return handleGetAuditSummary(request, context);
  } else {
    return handleGetAuditLogs(request, context);
  }
}, ['admin', 'super_admin', 'principal', 'hod']);