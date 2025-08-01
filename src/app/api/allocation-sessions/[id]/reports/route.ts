import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { 
  AllocationSessionModel, 
  CourseAllocationModel, 
  AllocationConflictModel,
  FacultyModel,
  CourseOfferingModel,
  CourseModel,
  ProgramModel
} from '@/lib/models';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectMongoose();
    
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';
    const format = searchParams.get('format') || 'json';
    
    const session = await AllocationSessionModel.findOne({ id: params.id }).lean();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Allocation session not found' },
        { status: 404 }
      );
    }

    // Fetch all related data
    const [allocations, conflicts, faculties, courseOfferings, courses, programs] = await Promise.all([
      CourseAllocationModel.find({ sessionId: params.id }).lean(),
      AllocationConflictModel.find({ sessionId: params.id }).lean(),
      FacultyModel.find({}).lean(),
      CourseOfferingModel.find({
        academicYear: (session as any).academicYear,
        semester: { $in: (session as any).semesters }
      }).lean(),
      CourseModel.find({}).lean(),
      ProgramModel.find({}).lean()
    ]);

    // Enrich allocations with additional details
    const enrichedAllocations = allocations.map(allocation => {
      const faculty = faculties.find(f => f.id === (allocation as any).facultyId);
      const courseOffering = courseOfferings.find(co => co.id === (allocation as any).courseOfferingId);
      const course = courses.find(c => c.id === (courseOffering as any)?.courseId);
      const program = programs.find(p => p.id === (courseOffering as any)?.programId);
      
      return {
        ...allocation,
        facultyName: (faculty as any)?.displayName || (faculty as any)?.fullName || 'Unknown Faculty',
        facultyDepartment: (faculty as any)?.department || 'Unknown Department',
        facultyEmail: (faculty as any)?.instituteEmail || 'N/A',
        courseName: (course as any)?.subjectName || 'Unknown Course',
        courseCode: (course as any)?.subcode || 'N/A',
        programName: (program as any)?.name || 'Unknown Program',
        semester: (courseOffering as any)?.semester || 'N/A',
        category: (course as any)?.category || 'N/A',
        lectureHours: (course as any)?.lectureHours || 0,
        tutorialHours: (course as any)?.tutorialHours || 0,
        practicalHours: (course as any)?.practicalHours || 0
      };
    });

    // Generate comprehensive analytics
    const analytics = generateReportAnalytics(enrichedAllocations, faculties, conflicts);

    let reportData;
    
    switch (reportType) {
      case 'summary':
        reportData = generateSummaryReport(session, analytics, enrichedAllocations, conflicts);
        break;
      case 'faculty':
        reportData = generateFacultyReport(session, analytics, enrichedAllocations, faculties);
        break;
      case 'department':
        reportData = generateDepartmentReport(session, analytics, enrichedAllocations, faculties);
        break;
      case 'conflicts':
        reportData = generateConflictsReport(session, conflicts, enrichedAllocations, faculties);
        break;
      case 'workload':
        reportData = generateWorkloadReport(session, analytics, enrichedAllocations, faculties);
        break;
      case 'detailed':
        reportData = generateDetailedReport(session, analytics, enrichedAllocations, conflicts, faculties);
        break;
      default:
        reportData = generateSummaryReport(session, analytics, enrichedAllocations, conflicts);
    }

    // Handle different output formats
    if (format === 'csv') {
      const csv = convertToCSV(reportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="allocation-report-${params.id}-${reportType}.csv"`
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      metadata: {
        sessionId: params.id,
        sessionName: (session as any).name,
        reportType,
        generatedAt: new Date().toISOString(),
        totalRecords: reportData.allocations?.length || reportData.length || 0
      }
    });

  } catch (error) {
    console.error('Error generating allocation report:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate allocation report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateReportAnalytics(allocations: any[], faculties: any[], conflicts: any[]) {
  const facultyWorkload = faculties.map(faculty => {
    const facultyAllocations = allocations.filter(a => a.facultyId === (faculty as any).id);
    const totalHours = facultyAllocations.reduce((sum, a) => sum + (a.hoursPerWeek || 0), 0);
    
    return {
      faculty,
      allocations: facultyAllocations,
      totalHours,
      courseCount: facultyAllocations.length,
      utilization: Math.round((totalHours / 18) * 100),
      status: totalHours > 18 ? 'overloaded' : totalHours < 12 ? 'underutilized' : 'optimal'
    };
  });

  const departmentStats = Object.entries(
    facultyWorkload.reduce((acc, fw) => {
      const dept = (fw.faculty as any).department || 'Unknown';
      if (!acc[dept]) {
        acc[dept] = {
          facultyCount: 0,
          totalHours: 0,
          totalCourses: 0,
          overloadedFaculty: 0,
          underutilizedFaculty: 0
        };
      }
      acc[dept].facultyCount += 1;
      acc[dept].totalHours += fw.totalHours;
      acc[dept].totalCourses += fw.courseCount;
      if (fw.status === 'overloaded') acc[dept].overloadedFaculty += 1;
      if (fw.status === 'underutilized') acc[dept].underutilizedFaculty += 1;
      return acc;
    }, {} as Record<string, any>)
  ).map(([department, stats]) => ({
    department,
    ...stats,
    avgHours: Math.round(stats.totalHours / stats.facultyCount),
    utilization: Math.round((stats.totalHours / (stats.facultyCount * 18)) * 100)
  }));

  return {
    facultyWorkload,
    departmentStats,
    overallStats: {
      totalAllocations: allocations.length,
      totalFaculty: faculties.length,
      totalConflicts: conflicts.length,
      resolvedConflicts: conflicts.filter(c => (c as any).status === 'resolved').length,
      manualAdjustments: allocations.filter(a => a.isManualAssignment).length,
      highPreferenceMatch: allocations.filter(a => a.preferenceMatch === 'high').length,
      averageScore: Math.round(allocations.reduce((sum, a) => sum + (a.allocationScore || 0), 0) / allocations.length),
      overloadedFaculty: facultyWorkload.filter(fw => fw.status === 'overloaded').length,
      underutilizedFaculty: facultyWorkload.filter(fw => fw.status === 'underutilized').length
    }
  };
}

function generateSummaryReport(session: any, analytics: any, allocations: any[], conflicts: any[]) {
  return {
    session: {
      id: session.id,
      name: session.name,
      academicYear: session.academicYear,
      semesters: session.semesters,
      status: session.status,
      createdAt: session.createdAt,
      completedAt: session.completedAt || null
    },
    summary: analytics.overallStats,
    topMetrics: {
      mostLoadedFaculty: analytics.facultyWorkload
        .sort((a: any, b: any) => b.totalHours - a.totalHours)
        .slice(0, 5)
        .map((fw: any) => ({
          name: (fw.faculty as any).displayName || (fw.faculty as any).fullName,
          hours: fw.totalHours,
          courses: fw.courseCount,
          department: (fw.faculty as any).department
        })),
      departmentUtilization: analytics.departmentStats
        .sort((a: any, b: any) => b.utilization - a.utilization)
        .map((ds: any) => ({
          department: ds.department,
          utilization: ds.utilization,
          facultyCount: ds.facultyCount,
          avgHours: ds.avgHours
        })),
      criticalConflicts: conflicts
        .filter(c => (c as any).severity === 'critical' || (c as any).severity === 'high')
        .map(c => ({
          id: (c as any).id,
          type: (c as any).conflictType,
          severity: (c as any).severity,
          description: (c as any).description
        }))
    },
    allocations: allocations.map(a => ({
      facultyName: a.facultyName,
      courseName: a.courseName,
      courseCode: a.courseCode,
      hoursPerWeek: a.hoursPerWeek,
      preferenceMatch: a.preferenceMatch,
      allocationScore: a.allocationScore,
      isManual: a.isManualAssignment
    }))
  };
}

function generateFacultyReport(session: any, analytics: any, allocations: any[], faculties: any[]) {
  return analytics.facultyWorkload.map((fw: any) => ({
    facultyId: (fw.faculty as any).id,
    facultyName: (fw.faculty as any).displayName || (fw.faculty as any).fullName,
    department: (fw.faculty as any).department,
    email: (fw.faculty as any).instituteEmail,
    totalHours: fw.totalHours,
    courseCount: fw.courseCount,
    utilization: fw.utilization,
    status: fw.status,
    courses: fw.allocations.map((a: any) => ({
      courseName: a.courseName,
      courseCode: a.courseCode,
      hoursPerWeek: a.hoursPerWeek,
      semester: a.semester,
      preferenceMatch: a.preferenceMatch,
      allocationScore: a.allocationScore,
      isManual: a.isManualAssignment
    }))
  }));
}

function generateDepartmentReport(session: any, analytics: any, allocations: any[], faculties: any[]) {
  return analytics.departmentStats.map((ds: any) => ({
    department: ds.department,
    facultyCount: ds.facultyCount,
    totalHours: ds.totalHours,
    totalCourses: ds.totalCourses,
    avgHours: ds.avgHours,
    utilization: ds.utilization,
    overloadedFaculty: ds.overloadedFaculty,
    underutilizedFaculty: ds.underutilizedFaculty,
    faculty: analytics.facultyWorkload
      .filter((fw: any) => (fw.faculty as any).department === ds.department)
      .map((fw: any) => ({
        name: (fw.faculty as any).displayName || (fw.faculty as any).fullName,
        hours: fw.totalHours,
        courses: fw.courseCount,
        status: fw.status
      }))
  }));
}

function generateConflictsReport(session: any, conflicts: any[], allocations: any[], faculties: any[]) {
  return conflicts.map(conflict => {
    const faculty = faculties.find(f => f.id === (conflict as any).facultyId);
    return {
      id: (conflict as any).id,
      type: (conflict as any).conflictType,
      severity: (conflict as any).severity,
      status: (conflict as any).status,
      description: (conflict as any).description,
      facultyName: (faculty as any)?.displayName || (faculty as any)?.fullName || 'N/A',
      facultyDepartment: (faculty as any)?.department || 'N/A',
      courseOfferingIds: (conflict as any).courseOfferingIds,
      createdAt: (conflict as any).createdAt,
      resolvedAt: (conflict as any).resolvedAt || null
    };
  });
}

function generateWorkloadReport(session: any, analytics: any, allocations: any[], faculties: any[]) {
  return {
    summary: {
      totalFaculty: analytics.overallStats.totalFaculty,
      overloadedFaculty: analytics.overallStats.overloadedFaculty,
      underutilizedFaculty: analytics.overallStats.underutilizedFaculty,
      averageUtilization: Math.round(
        analytics.facultyWorkload.reduce((sum: number, fw: any) => sum + fw.utilization, 0) / 
        analytics.facultyWorkload.length
      )
    },
    facultyDetails: analytics.facultyWorkload
      .sort((a: any, b: any) => b.totalHours - a.totalHours)
      .map((fw: any) => ({
        name: (fw.faculty as any).displayName || (fw.faculty as any).fullName,
        department: (fw.faculty as any).department,
        totalHours: fw.totalHours,
        utilization: fw.utilization,
        status: fw.status,
        courses: fw.courseCount,
        gtuCompliance: fw.totalHours <= 18 ? 'compliant' : 'violation'
      })),
    departmentSummary: analytics.departmentStats
  };
}

function generateDetailedReport(session: any, analytics: any, allocations: any[], conflicts: any[], faculties: any[]) {
  return {
    sessionInfo: generateSummaryReport(session, analytics, allocations, conflicts).session,
    analytics: analytics.overallStats,
    facultyReport: generateFacultyReport(session, analytics, allocations, faculties),
    departmentReport: generateDepartmentReport(session, analytics, allocations, faculties),
    conflictsReport: generateConflictsReport(session, conflicts, allocations, faculties),
    workloadReport: generateWorkloadReport(session, analytics, allocations, faculties)
  };
}

function convertToCSV(data: any): string {
  // Simple CSV conversion - can be enhanced based on data structure
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(item => 
      headers.map(header => {
        const value = item[header];
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value).replace(/"/g, '""');
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  }
  
  // For non-array data, convert to key-value pairs
  const entries = Object.entries(data);
  return entries.map(([key, value]) => 
    `"${key}","${typeof value === 'object' ? JSON.stringify(value).replace(/"/g, '""') : String(value).replace(/"/g, '""')}"`
  ).join('\n');
}