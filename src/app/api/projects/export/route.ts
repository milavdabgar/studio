// src/app/api/projects/export/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { Parser } from 'json2csv';
import mongoose from 'mongoose';
import { ProjectModel, DepartmentModel, ProjectTeamModel, ProjectEventModel, UserModel } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const departmentIdFilter = searchParams.get('department');
    const statusFilter = searchParams.get('status');
    const categoryFilter = searchParams.get('category');

    // Build query filters
    const query: Record<string, unknown> = {};
    if (eventId) query.eventId = eventId;
    if (departmentIdFilter) query.department = departmentIdFilter;
    if (statusFilter) query.status = statusFilter;
    if (categoryFilter) query.category = categoryFilter;

    const filteredProjects = await ProjectModel.find(query).lean();

    if (filteredProjects.length === 0) {
      return NextResponse.json({ message: 'No projects to export for the given filters.' }, { status: 404 });
    }

    // Get all departments, teams, events, and users for lookup
    const departments = await DepartmentModel.find({}).lean();
    const teams = await ProjectTeamModel.find({}).lean();
    const events = await ProjectEventModel.find({}).lean();
    const users = await UserModel.find({}).lean();
    
    const projectDataForCsv = filteredProjects.map((project: Record<string, unknown>) => {
      const department = departments.find((d: Record<string, unknown>) => d.id === project.department || d._id?.toString() === project.department);
      const team = teams.find((t: Record<string, unknown>) => t.id === project.teamId || t._id?.toString() === project.teamId);
      const event = events.find((e: Record<string, unknown>) => e.id === project.eventId || e._id?.toString() === project.eventId);
      const guide = project.guide as Record<string, unknown> || {};
      const guideUser = users.find((u: Record<string, unknown>) => u.id === guide.userId || u._id?.toString() === guide.userId);
      const guideDepartment = departments.find((d: Record<string, unknown>) => d.id === guide.department || d._id?.toString() === guide.department);

      const requirements = project.requirements as Record<string, unknown> || {};
      const deptEval = project.deptEvaluation as Record<string, unknown> || {};
      const centralEval = project.centralEvaluation as Record<string, unknown> || {};
      
      return {
        id: project.id,
        title: project.title,
        category: project.category,
        abstract: project.abstract,
        departmentName: department?.name || project.department,
        departmentCode: department?.code || '',
        status: project.status,
        powerRequired: requirements.power || false,
        internetRequired: requirements.internet || false,
        specialSpaceRequired: requirements.specialSpace || false,
        otherRequirements: requirements.otherRequirements || '',
        guideName: guideUser?.displayName || guide.name || '',
        guideDepartmentName: guideDepartment?.name || guide.department || '',
        guideContact: guide.contactNumber || '',
        teamName: team?.name || project.teamId,
        eventName: event?.name || project.eventId,
        locationId: project.locationId || 'N/A',
        deptEvaluationCompleted: deptEval.completed || false,
        deptEvaluationScore: deptEval.score ?? '',
        deptEvaluationFeedback: deptEval.feedback || '',
        centralEvaluationCompleted: centralEval.completed || false,
        centralEvaluationScore: centralEval.score ?? '',
        centralEvaluationFeedback: centralEval.feedback || '',
        createdAt: project.createdAt ? new Date(project.createdAt as string).toISOString() : '',
        updatedAt: project.updatedAt ? new Date(project.updatedAt as string).toISOString() : '',
      };
    });

    const fields = Object.keys(projectDataForCsv[0] || {});
    const parser = new Parser({ fields });
    const csv = parser.parse(projectDataForCsv);

    const headers = new Headers();
    headers.append('Content-Type', 'text/csv');
    headers.append('Content-Disposition', `attachment; filename="projects_export_${new Date().toISOString().split('T')[0]}.csv"`);
    
    return new NextResponse(csv, { headers });

  } catch (error) {
    console.error('Error exporting projects:', error);
    return NextResponse.json({ message: 'Error exporting projects', error: (error as Error).message }, { status: 500 });
  }
}
