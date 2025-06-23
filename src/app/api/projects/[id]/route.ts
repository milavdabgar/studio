
import { NextResponse, type NextRequest } from 'next/server';
import type { Project, ProjectTeam, ProjectLocation } from '@/types/entities';
import { notificationService } from '@/lib/api/notifications';

// Assuming these stores are initialized as in other files
declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECTS_STORE__: Project[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_LOCATIONS_STORE__: ProjectLocation[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_TEAMS_STORE__: ProjectTeam[] | undefined; 
}
if (!global.__API_PROJECTS_STORE__) global.__API_PROJECTS_STORE__ = [];
if (!global.__API_PROJECT_LOCATIONS_STORE__) global.__API_PROJECT_LOCATIONS_STORE__ = [];
if (!global.__API_PROJECT_TEAMS_STORE__) global.__API_PROJECT_TEAMS_STORE__ = [];


let projectsStore: Project[] = global.__API_PROJECTS_STORE__;
let projectLocationsStore: ProjectLocation[] = global.__API_PROJECT_LOCATIONS_STORE__;
const projectTeamsStore: ProjectTeam[] = global.__API_PROJECT_TEAMS_STORE__;


interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const project = projectsStore.find(p => p.id === id);
  if (project) {
    return NextResponse.json({ status: 'success', data: { project } });
  }
  return NextResponse.json({ message: 'Project not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const projectDataToUpdate = await request.json() as Partial<Omit<Project, 'id'>>;
    const projectIndex = projectsStore.findIndex(p => p.id === id);

    if (projectIndex === -1) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }
    const existingProject = projectsStore[projectIndex];

    if (projectDataToUpdate.title !== undefined && !projectDataToUpdate.title.trim()) {
        return NextResponse.json({ message: 'Project Title cannot be empty if provided.' }, { status: 400 });
    }

    const updatedProject: Project = {
      ...existingProject,
      ...projectDataToUpdate,
      updatedAt: new Date().toISOString(),
    };

    projectsStore[projectIndex] = updatedProject;
    global.__API_PROJECTS_STORE__ = projectsStore;

    // --- Notification Trigger for Project Status Change ---
    if (projectDataToUpdate.status && projectDataToUpdate.status !== existingProject.status) {
        const team = projectTeamsStore.find(t => t.id === updatedProject.teamId);
        if (team && team.members) {
            for (const member of team.members) {
                try {
                    await notificationService.createNotification({
                        userId: member.userId,
                        message: `The status of your project '${updatedProject.title}' has been updated to '${updatedProject.status}'.`,
                        type: 'project_status_change',
                        link: `/project-fair/student`, // Or a more specific link if available
                    });
                } catch (notifError) {
                    console.error(`Failed to send project status update notification to user ${member.userId}:`, notifError);
                }
            }
        }
    }
    // --- End Notification Trigger ---


    return NextResponse.json({ status: 'success', data: { project: updatedProject } });
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    return NextResponse.json({ message: `Error updating project ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const projectIndex = projectsStore.findIndex(p => p.id === id);

  if (projectIndex === -1) {
    return NextResponse.json({ message: 'Project not found' }, { status: 404 });
  }
  const deletedProject = projectsStore.splice(projectIndex, 1)[0];
  global.__API_PROJECTS_STORE__ = projectsStore; 

  if (deletedProject.locationId) {
    const locationIndex = projectLocationsStore.findIndex(loc => loc.id === deletedProject.locationId || loc.locationId === deletedProject.locationId);
    if (locationIndex !== -1) {
      projectLocationsStore[locationIndex].projectId = undefined; 
      projectLocationsStore[locationIndex].isAssigned = false;
      projectLocationsStore[locationIndex].updatedBy = "user_admin_placeholder_project_delete"; 
      projectLocationsStore[locationIndex].updatedAt = new Date().toISOString();
      global.__API_PROJECT_LOCATIONS_STORE__ = projectLocationsStore;
    }
  }

  return NextResponse.json({ status: 'success', data: null });
}
