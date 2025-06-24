// src/app/api/projects/[id]/details/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Project, ProjectTeam, ProjectLocation, ProjectEvent, Department, User as SystemUser } from '@/types/entities';

// Ensure global stores are initialized as in other files
declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECTS_STORE__: Project[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_TEAMS_STORE__: ProjectTeam[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_LOCATIONS_STORE__: ProjectLocation[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_EVENTS_STORE__: ProjectEvent[] | undefined;
  // eslint-disable-next-line no-var
  var __API_DEPARTMENTS_STORE__: Department[] | undefined;
  // eslint-disable-next-line no-var
  var __API_USERS_STORE__: SystemUser[] | undefined; // For guide and jury
}

if (!global.__API_PROJECTS_STORE__) global.__API_PROJECTS_STORE__ = [];
if (!global.__API_PROJECT_TEAMS_STORE__) global.__API_PROJECT_TEAMS_STORE__ = [];
if (!global.__API_PROJECT_LOCATIONS_STORE__) global.__API_PROJECT_LOCATIONS_STORE__ = [];
if (!global.__API_PROJECT_EVENTS_STORE__) global.__API_PROJECT_EVENTS_STORE__ = [];
if (!global.__API_DEPARTMENTS_STORE__) global.__API_DEPARTMENTS_STORE__ = [];
if (!global.__API_USERS_STORE__) global.__API_USERS_STORE__ = [];

const projectsStore: Project[] = global.__API_PROJECTS_STORE__;
const teamsStore: ProjectTeam[] = global.__API_PROJECT_TEAMS_STORE__;
const locationsStore: ProjectLocation[] = global.__API_PROJECT_LOCATIONS_STORE__;
const eventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__;
const departmentsStore: Department[] = global.__API_DEPARTMENTS_STORE__;
const usersStore: SystemUser[] = global.__API_USERS_STORE__;


interface RouteParams {
  params: {
    id: string; // Project ID
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;

  const project = projectsStore.find(p => p.id === id);
  if (!project) {
    return NextResponse.json({ message: 'Project not found' }, { status: 404 });
  }

  const team = teamsStore.find(t => t.id === project.teamId);
  // Find location by project.locationId which stores the user-friendly string ID (e.g., "A-01")
  const location = locationsStore.find(l => l.locationId === project.locationId);
  const event = eventsStore.find(e => e.id === project.eventId);
  const departmentDetails = departmentsStore.find(d => d.id === project.department);
  const guideDetails = usersStore.find(u => u.id === project.guide.userId);
  const deptJuryDetails = project.deptEvaluation?.juryId ? usersStore.find(u => u.id === project.deptEvaluation!.juryId) : undefined;
  const centralJuryDetails = project.centralEvaluation?.juryId ? usersStore.find(u => u.id === project.centralEvaluation!.juryId) : undefined;
  
  const projectWithDetails = {
    ...project,
    team: team || null, // Return null if not found, or teamId if preferred
    location: location || null,
    event: event || null,
    departmentDetails: departmentDetails || null,
    guideDetails: guideDetails ? { id: guideDetails.id, displayName: guideDetails.displayName, email: guideDetails.email } : null, // Select specific user fields
    deptJuryDetails: deptJuryDetails ? { id: deptJuryDetails.id, displayName: deptJuryDetails.displayName, email: deptJuryDetails.email } : null,
    centralJuryDetails: centralJuryDetails ? { id: centralJuryDetails.id, displayName: centralJuryDetails.displayName, email: centralJuryDetails.email } : null,
  };


  return NextResponse.json({ status: 'success', data: { project: projectWithDetails } });
}
