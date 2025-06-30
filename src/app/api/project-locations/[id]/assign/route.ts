// src/app/api/project-locations/[id]/assign/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectLocation, Project, ProjectTeam } from '@/types/entities';
import { notificationService } from '@/lib/api/notifications';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_LOCATIONS_STORE__: ProjectLocation[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECTS_STORE__: Project[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_TEAMS_STORE__: ProjectTeam[] | undefined;
}

if (!global.__API_PROJECT_LOCATIONS_STORE__) global.__API_PROJECT_LOCATIONS_STORE__ = [];
if (!global.__API_PROJECTS_STORE__) global.__API_PROJECTS_STORE__ = [];
if (!global.__API_PROJECT_TEAMS_STORE__) global.__API_PROJECT_TEAMS_STORE__ = [];

const projectLocationsStore: ProjectLocation[] = global.__API_PROJECT_LOCATIONS_STORE__;
const projectsStore: Project[] = global.__API_PROJECTS_STORE__;
const projectTeamsStore: ProjectTeam[] = global.__API_PROJECT_TEAMS_STORE__;

interface RouteParams {
  params: Promise<{
    id: string; // This is the locationId string (e.g., "A-01"), not MongoDB _id
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: locationIdString  } = await params; // The user-friendly locationId
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ message: 'Project ID is required for assignment.' }, { status: 400 });
    }

    const locationIndex = projectLocationsStore.findIndex(loc => loc.locationId === locationIdString);
    if (locationIndex === -1) {
      return NextResponse.json({ message: `Location with ID '${locationIdString}' not found.` }, { status: 404 });
    }

    const locationToUpdate = { ...projectLocationsStore[locationIndex] };

    if (locationToUpdate.isAssigned && locationToUpdate.projectId && locationToUpdate.projectId !== projectId) {
      return NextResponse.json({ message: `Location ${locationIdString} is already assigned to project ${locationToUpdate.projectId}. Unassign it first.` }, { status: 409 });
    }

    const projectToAssign = projectsStore.find(p => p.id === projectId);
    if (!projectToAssign) {
      return NextResponse.json({ message: `Project with ID '${projectId}' not found.` }, { status: 404 });
    }
    
    const otherLocationAssignedToProject = projectLocationsStore.find(loc => loc.projectId === projectId && loc.locationId !== locationIdString);
    if (otherLocationAssignedToProject) {
        return NextResponse.json({ message: `Project ${projectId} is already assigned to location ${otherLocationAssignedToProject.locationId}.`}, { status: 409 });
    }

    locationToUpdate.projectId = projectId;
    locationToUpdate.isAssigned = true;
    locationToUpdate.updatedAt = new Date().toISOString();
    locationToUpdate.updatedBy = "user_admin_placeholder_assign"; 

    projectLocationsStore[locationIndex] = locationToUpdate;
    global.__API_PROJECT_LOCATIONS_STORE__ = projectLocationsStore;

    const projectToUpdateIndex = projectsStore.findIndex(p => p.id === projectId);
    if (projectToUpdateIndex !== -1) {
        projectsStore[projectToUpdateIndex].locationId = locationIdString;
        projectsStore[projectToUpdateIndex].updatedAt = new Date().toISOString();
        global.__API_PROJECTS_STORE__ = projectsStore;
    }

    // --- Notification Trigger ---
    const team = projectTeamsStore.find(t => t.id === projectToAssign.teamId);
    if (team && team.members) {
        for (const member of team.members) {
            try {
                await notificationService.createNotification({
                    userId: member.userId,
                    message: `Your project '${projectToAssign.title}' has been assigned to location/stall '${locationIdString}'.`,
                    type: 'project_location_update',
                    link: `/project-fair/student`, 
                });
            } catch (notifError) {
                console.error(`Failed to send location assignment notification to user ${member.userId}:`, notifError);
            }
        }
    }
    // --- End Notification Trigger ---

    return NextResponse.json({ status: 'success', data: { location: locationToUpdate } });
  } catch (error) {
    console.error(`Error assigning project to location ${locationIdString}:`, error);
    return NextResponse.json({ message: 'Error assigning project to location', error: (error as Error).message }, { status: 500 });
  }
}
