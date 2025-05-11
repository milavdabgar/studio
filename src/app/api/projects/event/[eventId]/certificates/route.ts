
import { NextResponse, type NextRequest } from 'next/server';
import type { Project, ProjectEvent, Department, ProjectTeam as Team } from '@/types/entities';

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

interface CertificateData {
    projectId: string;
    title: string;
    teamName?: string;
    teamMembers?: string[];
    departmentName?: string;
    score?: number;
    rank?: number;
    certificateType: 'participation' | 'department-winner' | 'institute-winner';
    eventName: string;
    eventDate: string; // Assuming eventDate is a string like "YYYY-MM-DD"
    downloadUrl: string;
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
  const certificates: CertificateData[] = [];

  if (certificateType === 'participation') {
    eventProjects.forEach(project => {
      const team = teamsStore.find(t => t.id === project.teamId);
      const department = departmentsStore.find(d => d.id === project.department);
      certificates.push({
        projectId: project.id,
        title: project.title,
        teamName: team?.name,
        teamMembers: team?.members.map(m => m.name),
        departmentName: department?.name,
        certificateType: 'participation',
        eventName: event.name,
        eventDate: event.eventDate,
        downloadUrl: `/api/projects/certificates/download/${project.id}?type=participation` // Example
      });
    });
  } else if (certificateType === 'department-winner') {
    const departmentWinnersMap = new Map<string, Project[]>();
    eventProjects
        .filter(p => p.deptEvaluation?.completed && p.deptEvaluation.score !== undefined)
        .forEach(p => {
            if (!departmentWinnersMap.has(p.department)) {
                departmentWinnersMap.set(p.department, []);
            }
            departmentWinnersMap.get(p.department)?.push(p);
        });

    departmentWinnersMap.forEach((deptProjects, deptId) => {
        deptProjects.sort((a, b) => (b.deptEvaluation?.score || 0) - (a.deptEvaluation?.score || 0));
        deptProjects.slice(0, 3).forEach((project, index) => {
            const team = teamsStore.find(t => t.id === project.teamId);
            const department = departmentsStore.find(d => d.id === project.department);
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
            const department = departmentsStore.find(d => d.id === project.department);
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
