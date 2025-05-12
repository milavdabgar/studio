// src/app/api/projects/export/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Project, Department, ProjectTeam, ProjectEvent, User as SystemUser } from '@/types/entities';
import { Parser } from 'json2csv';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECTS_STORE__: Project[] | undefined;
  // eslint-disable-next-line no-var
  var __API_DEPARTMENTS_STORE__: Department[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_TEAMS_STORE__: ProjectTeam[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_EVENTS_STORE__: ProjectEvent[] | undefined;
  // eslint-disable-next-line no-var
  var __API_USERS_STORE__: SystemUser[] | undefined;
}

if (!global.__API_PROJECTS_STORE__) global.__API_PROJECTS_STORE__ = [];
if (!global.__API_DEPARTMENTS_STORE__) global.__API_DEPARTMENTS_STORE__ = [];
if (!global.__API_PROJECT_TEAMS_STORE__) global.__API_PROJECT_TEAMS_STORE__ = [];
if (!global.__API_PROJECT_EVENTS_STORE__) global.__API_PROJECT_EVENTS_STORE__ = [];
if (!global.__API_USERS_STORE__) global.__API_USERS_STORE__ = [];


const projectsStore: Project[] = global.__API_PROJECTS_STORE__;
const departmentsStore: Department[] = global.__API_DEPARTMENTS_STORE__;
const teamsStore: ProjectTeam[] = global.__API_PROJECT_TEAMS_STORE__;
const eventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__;
const usersStore: SystemUser[] = global.__API_USERS_STORE__;


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const departmentIdFilter = searchParams.get('department');
    const statusFilter = searchParams.get('status');
    const categoryFilter = searchParams.get('category');

    let filteredProjects = [...projectsStore];

    if (eventId) filteredProjects = filteredProjects.filter(p => p.eventId === eventId);
    if (departmentIdFilter) filteredProjects = filteredProjects.filter(p => p.department === departmentIdFilter);
    if (statusFilter) filteredProjects = filteredProjects.filter(p => p.status === statusFilter);
    if (categoryFilter) filteredProjects = filteredProjects.filter(p => p.category === categoryFilter);

    if (filteredProjects.length === 0) {
      return NextResponse.json({ message: 'No projects to export for the given filters.' }, { status: 404 });
    }
    
    const projectDataForCsv = filteredProjects.map(project => {
      const department = departmentsStore.find(d => d.id === project.department);
      const team = teamsStore.find(t => t.id === project.teamId);
      const event = eventsStore.find(e => e.id === project.eventId);
      const guideUser = usersStore.find(u => u.id === project.guide.userId);
      const guideDepartment = departmentsStore.find(d => d.id === project.guide.department);

      return {
        id: project.id,
        title: project.title,
        category: project.category,
        abstract: project.abstract,
        departmentName: department?.name || project.department,
        departmentCode: department?.code || '',
        status: project.status,
        powerRequired: project.requirements.power,
        internetRequired: project.requirements.internet,
        specialSpaceRequired: project.requirements.specialSpace,
        otherRequirements: project.requirements.otherRequirements || '',
        guideName: guideUser?.displayName || project.guide.name,
        guideDepartmentName: guideDepartment?.name || project.guide.department,
        guideContact: project.guide.contactNumber || '',
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
