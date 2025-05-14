
// src/app/api/projects/event/[eventId]/certificates/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Project, ProjectEvent, Department, ProjectTeam as Team, CertificateInfo } from '@/types/entities';

// Ensure global stores are initialized
if (!(global as any).__API_PROJECTS_STORE__) {
  (global as any).__API_PROJECTS_STORE__ = [];
}
if (!(global as any).__API_PROJECT_EVENTS_STORE__) {
  (global as any).__API_PROJECT_EVENTS_STORE__ = [];
}
if (!(global as any).__API_DEPARTMENTS_STORE__) {
  (global as any).__API_DEPARTMENTS_STORE__ = [];
}
if (!(global as any).__API_PROJECT_TEAMS_STORE__) {
  (global as any).__API_PROJECT_TEAMS_STORE__ = [];
}

const projectsStore: Project[] = (global as any).__API_PROJECTS_STORE__;
const projectEventsStore: ProjectEvent[] = (global as any).__API_PROJECT_EVENTS_STORE__;
const departmentsStore: Department[] = (global as any).__API_DEPARTMENTS_STORE__;
const teamsStore: Team[] = (global as any).__API_PROJECT_TEAMS_STORE__;

interface RouteParams {
  params: {
    eventId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { eventId } = params;
  const { searchParams } = new URL(request.url);
  const certificateType = searchParams.get('type') || 'participation';

  const event = projectEventsStore.find(e => e.id === eventId);
  if (!event) {
    return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  }

  const eventProjects = projectsStore.filter(p => p.eventId === eventId);
  const certificates: CertificateInfo[] = [];

  if (certificateType === 'participation') {
    eventProjects.forEach(project => {
      const team = teamsStore.find(t => t.id === project.teamId);
      const department = departmentsStore.find(d => d.id === (typeof project.department === 'string' ? project.department : project.department?.id));
      certificates.push({
        projectId: project.id,
        title: project.title,
        teamName: team?.name,
        teamMembers: team?.members.map(m => m.name),
        departmentName: department?.name,
        certificateType: 'participation',
        eventName: event.name,
        eventDate: event.eventDate,
        downloadUrl: `/api/projects/certificates/download/${project.id}?type=participation` 
      });
    });
  } else if (certificateType === 'department-winner') {
    const departmentWinnersMap = new Map<string, Project[]>();
    eventProjects
        .filter(p => p.deptEvaluation?.completed && p.deptEvaluation.score !== undefined)
        .forEach(p => {
            const deptId = typeof p.department === 'string' ? p.department : p.department?.id || 'unknown_dept';
            if (!departmentWinnersMap.has(deptId)) {
                departmentWinnersMap.set(deptId, []);
            }
            departmentWinnersMap.get(deptId)?.push(p);
        });

    departmentWinnersMap.forEach((deptProjects) => {
        deptProjects.sort((a, b) => (b.deptEvaluation?.score || 0) - (a.deptEvaluation?.score || 0));
        deptProjects.slice(0, 3).forEach((project, index) => {
            const team = teamsStore.find(t => t.id === project.teamId);
            const department = departmentsStore.find(d => d.id === (typeof project.department === 'string' ? project.department : project.department?.id));
            certificates.push({
                projectId: project.id,
                title: project.title,
                teamName: team?.name,
                teamMembers: team?.members.map(m => m.name),
                departmentName: department?.name,
                score: project.deptEvaluation?.score,
                rank: index + 1,
                certificateType: 'department-winner',
                eventName: event.name,
                eventDate: event.eventDate,
                downloadUrl: `/api/projects/certificates/download/${project.id}?type=department-winner&rank=${index+1}`
            });
        });
    });

  } else if (certificateType === 'institute-winner') {
     eventProjects
        .filter(p => p.centralEvaluation?.completed && p.centralEvaluation.score !== undefined)
        .sort((a,b) => (b.centralEvaluation?.score || 0) - (a.centralEvaluation?.score || 0))
        .slice(0,3)
        .forEach((project, index) => {
            const team = teamsStore.find(t => t.id === project.teamId);
            const department = departmentsStore.find(d => d.id === (typeof project.department === 'string' ? project.department : project.department?.id));
             certificates.push({
                projectId: project.id,
                title: project.title,
                teamName: team?.name,
                teamMembers: team?.members.map(m => m.name),
                departmentName: department?.name,
                score: project.centralEvaluation?.score,
                rank: index + 1,
                certificateType: 'institute-winner',
                eventName: event.name,
                eventDate: event.eventDate,
                downloadUrl: `/api/projects/certificates/download/${project.id}?type=institute-winner&rank=${index+1}`
            });
        });
  } else {
    return NextResponse.json({ message: 'Invalid certificate type' }, { status: 400 });
  }

  return NextResponse.json({ certificates });
}
