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
    const query: any = {};
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
    
    const projectDataForCsv = filteredProjects.map((project: any) => {
      const department = departments.find((d: any) => d.id === project.department || d._id.toString() === project.department);
      const team = teams.find((t: any) => t.id === project.teamId || t._id.toString() === project.teamId);
      const event = events.find((e: any) => e.id === project.eventId || e._id.toString() === project.eventId);
      const guideUser = users.find((u: any) => u.id === project.guide?.userId || u._id.toString() === project.guide?.userId);
      const guideDepartment = departments.find((d: any) => d.id === project.guide?.department || d._id.toString() === project.guide?.department);

      return {
        id: project.id,
        title: project.title,
        category: project.category,
        abstract: project.abstract,
        departmentName: department?.name || project.department,
        departmentCode: department?.code || '',
        status: project.status,
        powerRequired: project.requirements?.power || false,
        internetRequired: project.requirements?.internet || false,
        specialSpaceRequired: project.requirements?.specialSpace || false,
        otherRequirements: project.requirements?.otherRequirements || '',
        guideName: guideUser?.displayName || project.guide?.name || '',
        guideDepartmentName: guideDepartment?.name || project.guide?.department || '',
        guideContact: project.guide?.contactNumber || '',
        teamName: team?.name || project.teamId,
        eventName: event?.name || project.eventId,
        locationId: project.locationId || 'N/A',
        deptEvaluationCompleted: project.deptEvaluation?.completed || false,
        deptEvaluationScore: project.deptEvaluation?.score ?? '',
        deptEvaluationFeedback: project.deptEvaluation?.feedback || '',
        centralEvaluationCompleted: project.centralEvaluation?.completed || false,
        centralEvaluationScore: project.centralEvaluation?.score ?? '',
        centralEvaluationFeedback: project.centralEvaluation?.feedback || '',
        createdAt: project.createdAt ? new Date(project.createdAt).toISOString() : '',
        updatedAt: project.updatedAt ? new Date(project.updatedAt).toISOString() : '',
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
