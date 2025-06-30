
// src/app/api/projects/event/[eventId]/winners/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Project, ProjectEvent, Department, ProjectTeam as Team } from '@/types/entities';

// Ensure global stores are initialized
declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECTS_STORE__: Project[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_EVENTS_STORE__: ProjectEvent[] | undefined;
  // eslint-disable-next-line no-var
  var __API_DEPARTMENTS_STORE__: Department[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_TEAMS_STORE__: Team[] | undefined;
}

if (!global.__API_PROJECTS_STORE__) global.__API_PROJECTS_STORE__ = [];
if (!global.__API_PROJECT_EVENTS_STORE__) global.__API_PROJECT_EVENTS_STORE__ = [];
if (!global.__API_DEPARTMENTS_STORE__) global.__API_DEPARTMENTS_STORE__ = [];
if (!global.__API_PROJECT_TEAMS_STORE__) global.__API_PROJECT_TEAMS_STORE__ = [];

const projectsStore: Project[] = global.__API_PROJECTS_STORE__;
const projectEventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__;
const departmentsStore: Department[] = global.__API_DEPARTMENTS_STORE__;
const teamsStore: Team[] = global.__API_PROJECT_TEAMS_STORE__;

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

interface WinnerProject extends Project {
    rank?: number;
    teamDetails?: Team;
    departmentDetails?: Department;
}

interface DepartmentWinnerGroup {
    department: Department; // Store full department object
    winners: WinnerProject[];
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { eventId  } = await params;

  const event = projectEventsStore.find(e => e.id === eventId);
  if (!event) {
    return NextResponse.json({ message: 'Event not found' }, { status: 404 });
  }

  const isAdmin = true; // In a real app, get this from user session/role
  if (!event.publishResults && !isAdmin) {
    return NextResponse.json({ message: 'Results have not been published yet.' }, { status: 403 });
  }

  const eventProjects = projectsStore.filter(p => p.eventId === eventId);
  const departmentWinners: DepartmentWinnerGroup[] = [];

  departmentsStore.forEach(dept => {
    const projectsInDept = eventProjects
      .filter(p => (typeof p.department === 'string' ? p.department : p.department?.id) === dept.id && p.deptEvaluation?.completed && typeof p.deptEvaluation.score === 'number')
      .sort((a, b) => (b.deptEvaluation!.score!) - (a.deptEvaluation!.score!))
      .slice(0, 3) // Top 3
      .map((project, index) => ({
        ...project,
        rank: index + 1,
        teamDetails: teamsStore.find(t => t.id === project.teamId),
        departmentDetails: dept // Already have department details
      }));
    
    if (projectsInDept.length > 0) {
      departmentWinners.push({
        department: dept,
        winners: projectsInDept
      });
    }
  });

  const instituteWinners = eventProjects
    .filter(p => p.centralEvaluation?.completed && typeof p.centralEvaluation.score === 'number')
    .sort((a, b) => (b.centralEvaluation!.score!) - (a.centralEvaluation!.score!))
    .slice(0, 3) // Top 3
    .map((project, index) => ({
      ...project,
      rank: index + 1,
      teamDetails: teamsStore.find(t => t.id === project.teamId),
      departmentDetails: departmentsStore.find(d => d.id === (typeof project.department === 'string' ? project.department : project.department?.id))
    }));

  return NextResponse.json({
    status: 'success',
    data: {
      departmentWinners,
      instituteWinners
    }
  });
}
