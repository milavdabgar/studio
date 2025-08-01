import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { 
  AllocationSessionModel, 
  CourseAllocationModel, 
  AllocationConflictModel,
  FacultyModel
} from '@/lib/models';

const generateId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// GET - Get approval status and pending approvals
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const approverRole = searchParams.get('role') || 'hod'; // hod, admin, dean
    
    const session = await AllocationSessionModel.findOne({ id: params.id }).lean();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Allocation session not found' },
        { status: 404 }
      );
    }

    // Get allocations for the session
    const allocations = await CourseAllocationModel.find({ sessionId: params.id }).lean();
    
    // Filter by department if specified (for HOD view)
    let relevantAllocations = allocations;
    if (department && approverRole === 'hod') {
      const departmentFaculty = await FacultyModel.find({ department }).lean();
      const facultyIds = departmentFaculty.map(f => (f as any).id);
      relevantAllocations = allocations.filter(a => facultyIds.includes((a as any).facultyId));
    }

    // Group allocations by approval status
    const approvalStats = {
      pending: relevantAllocations.filter(a => (a as any).approvalStatus === 'pending' || !(a as any).approvalStatus).length,
      approved: relevantAllocations.filter(a => (a as any).approvalStatus === 'approved').length,
      rejected: relevantAllocations.filter(a => (a as any).approvalStatus === 'rejected').length,
      needsReview: relevantAllocations.filter(a => (a as any).isManualAssignment && (a as any).approvalStatus !== 'approved').length
    };

    // Get department-wise approval summary (for admin view)
    let departmentSummary = null;
    if (approverRole === 'admin') {
      const departments = [...new Set(allocations.map(a => (a as any).facultyDepartment).filter(Boolean))];
      departmentSummary = await Promise.all(
        departments.map(async (dept) => {
          const deptFaculty = await FacultyModel.find({ department: dept }).lean();
          const facultyIds = deptFaculty.map(f => (f as any).id);
          const deptAllocations = allocations.filter(a => facultyIds.includes((a as any).facultyId));
          
          return {
            department: dept,
            totalAllocations: deptAllocations.length,
            pending: deptAllocations.filter(a => (a as any).approvalStatus === 'pending' || !(a as any).approvalStatus).length,
            approved: deptAllocations.filter(a => (a as any).approvalStatus === 'approved').length,
            rejected: deptAllocations.filter(a => (a as any).approvalStatus === 'rejected').length,
            facultyCount: deptFaculty.length
          };
        })
      );
    }

    // Get recent approval activities
    const recentApprovals = relevantAllocations
      .filter(a => (a as any).approvalHistory && (a as any).approvalHistory.length > 0)
      .map(a => ({
        allocationId: (a as any).id,
        facultyId: (a as any).facultyId,
        courseOfferingId: (a as any).courseOfferingId,
        latestApproval: (a as any).approvalHistory[(a as any).approvalHistory.length - 1]
      }))
      .sort((a, b) => new Date(b.latestApproval.timestamp).getTime() - new Date(a.latestApproval.timestamp).getTime())
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        sessionInfo: {
          id: (session as any).id,
          name: (session as any).name,
          status: (session as any).status,
          academicYear: (session as any).academicYear,
          semesters: (session as any).semesters
        },
        approvalStats,
        departmentSummary,
        recentApprovals,
        canApprove: (session as any).status === 'completed' || (session as any).status === 'in_progress',
        totalRelevantAllocations: relevantAllocations.length
      }
    });

  } catch (error) {
    console.error('Error fetching approval data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch approval data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Submit approval/rejection for allocation(s)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const body = await request.json();
    
    const {
      allocationIds,
      action, // 'approve', 'reject', 'request_changes'
      approverRole, // 'hod', 'admin', 'dean'
      approverName,
      approverEmail,
      comments = '',
      department // for HOD approvals
    } = body;

    if (!allocationIds || !Array.isArray(allocationIds) || allocationIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No allocation IDs provided' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'request_changes'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be approve, reject, or request_changes' },
        { status: 400 }
      );
    }

    // Verify session exists and is in appropriate state
    const session = await AllocationSessionModel.findOne({ id: params.id });
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Allocation session not found' },
        { status: 404 }
      );
    }

    if (!['completed', 'in_progress'].includes((session as any).status)) {
      return NextResponse.json(
        { success: false, error: 'Session must be completed or in progress to approve allocations' },
        { status: 400 }
      );
    }

    // Get allocations to approve
    const allocations = await CourseAllocationModel.find({ 
      id: { $in: allocationIds },
      sessionId: params.id 
    });

    if (allocations.length !== allocationIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some allocation IDs were not found' },
        { status: 404 }
      );
    }

    // For HOD approvals, verify they only approve their department's allocations
    if (approverRole === 'hod' && department) {
      const departmentFaculty = await FacultyModel.find({ department }).lean();
      const facultyIds = departmentFaculty.map(f => (f as any).id);
      
      const invalidAllocations = allocations.filter(a => !facultyIds.includes((a as any).facultyId));
      if (invalidAllocations.length > 0) {
        return NextResponse.json(
          { success: false, error: 'HODs can only approve allocations for their department faculty' },
          { status: 403 }
        );
      }
    }

    // Create approval record
    const approvalRecord = {
      id: generateId('apr'),
      action,
      approverRole,
      approverName,
      approverEmail,
      comments,
      timestamp: new Date().toISOString(),
      department: department || null
    };

    // Update allocations with approval status
    const updatePromises = allocations.map(async (allocation) => {
      const currentHistory = (allocation as any).approvalHistory || [];
      const newHistory = [...currentHistory, approvalRecord];
      
      let newStatus = action === 'approve' ? 'approved' : 
                     action === 'reject' ? 'rejected' : 'pending';
      
      // If requesting changes, keep as pending but add to history
      if (action === 'request_changes') {
        newStatus = 'pending';
      }

      await CourseAllocationModel.findOneAndUpdate(
        { id: (allocation as any).id },
        {
          approvalStatus: newStatus,
          approvalHistory: newHistory,
          lastApprovedBy: action === 'approve' ? approverName : (allocation as any).lastApprovedBy,
          lastApprovedAt: action === 'approve' ? new Date().toISOString() : (allocation as any).lastApprovedAt,
          updatedAt: new Date().toISOString()
        }
      );
    });

    await Promise.all(updatePromises);

    // Update session statistics if needed
    const sessionAllocations = await CourseAllocationModel.find({ sessionId: params.id }).lean();
    const approvedCount = sessionAllocations.filter(a => (a as any).approvalStatus === 'approved').length;
    const totalCount = sessionAllocations.length;
    
    const updatedStats = {
      ...(session as any).statistics,
      approvedAllocations: approvedCount,
      approvalProgress: Math.round((approvedCount / totalCount) * 100)
    };

    await AllocationSessionModel.findOneAndUpdate(
      { id: params.id },
      { 
        statistics: updatedStats,
        updatedAt: new Date().toISOString()
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        processedAllocations: allocationIds.length,
        action,
        approvalRecord,
        sessionStats: {
          approvedCount,
          totalCount,
          approvalProgress: updatedStats.approvalProgress
        }
      }
    });

  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process approval',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Bulk approval actions
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const body = await request.json();
    
    const {
      action, // 'approve_all', 'approve_department', 'approve_by_criteria'
      approverRole,
      approverName,
      approverEmail,
      department,
      criteria = {}, // For criteria-based approval
      comments = ''
    } = body;

    const session = await AllocationSessionModel.findOne({ id: params.id });
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Allocation session not found' },
        { status: 404 }
      );
    }

    let query: any = { sessionId: params.id };
    let description = '';

    switch (action) {
      case 'approve_all':
        query.approvalStatus = { $ne: 'approved' };
        description = 'All pending allocations';
        break;
        
      case 'approve_department':
        if (!department) {
          return NextResponse.json(
            { success: false, error: 'Department is required for department approval' },
            { status: 400 }
          );
        }
        const deptFaculty = await FacultyModel.find({ department }).lean();
        const facultyIds = deptFaculty.map(f => (f as any).id);
        query.facultyId = { $in: facultyIds };
        query.approvalStatus = { $ne: 'approved' };
        description = `All ${department} department allocations`;
        break;
        
      case 'approve_by_criteria':
        if (criteria.preferenceMatch) {
          query.preferenceMatch = criteria.preferenceMatch;
        }
        if (criteria.minScore) {
          query.allocationScore = { $gte: criteria.minScore };
        }
        if (criteria.onlyAutomatic) {
          query.isManualAssignment = { $ne: true };
        }
        query.approvalStatus = { $ne: 'approved' };
        description = 'Allocations matching specified criteria';
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid bulk action' },
          { status: 400 }
        );
    }

    const allocationsToApprove = await CourseAllocationModel.find(query);
    
    if (allocationsToApprove.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          processedAllocations: 0,
          message: 'No allocations matched the criteria or all are already approved'
        }
      });
    }

    // Create approval record
    const approvalRecord = {
      id: generateId('apr'),
      action: 'approve',
      approverRole,
      approverName,
      approverEmail,
      comments: comments || `Bulk approval: ${description}`,
      timestamp: new Date().toISOString(),
      department: department || null,
      bulkAction: true
    };

    // Update all matching allocations
    await CourseAllocationModel.updateMany(
      query,
      {
        $set: {
          approvalStatus: 'approved',
          lastApprovedBy: approverName,
          lastApprovedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        $push: {
          approvalHistory: approvalRecord
        }
      }
    );

    // Update session statistics
    const sessionAllocations = await CourseAllocationModel.find({ sessionId: params.id }).lean();
    const approvedCount = sessionAllocations.filter(a => (a as any).approvalStatus === 'approved').length;
    const totalCount = sessionAllocations.length;
    
    const updatedStats = {
      ...(session as any).statistics,
      approvedAllocations: approvedCount,
      approvalProgress: Math.round((approvedCount / totalCount) * 100)
    };

    await AllocationSessionModel.findOneAndUpdate(
      { id: params.id },
      { 
        statistics: updatedStats,
        updatedAt: new Date().toISOString()
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        processedAllocations: allocationsToApprove.length,
        action,
        description,
        approvalRecord,
        sessionStats: {
          approvedCount,
          totalCount,
          approvalProgress: updatedStats.approvalProgress
        }
      }
    });

  } catch (error) {
    console.error('Error processing bulk approval:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process bulk approval',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}