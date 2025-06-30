// src/app/api/project-locations/[id]/unassign/route.ts
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
  const { id: locationIdString  } = await params; 
  try {
    const locationIndex = projectLocationsStore.findIndex(loc => loc.locationId === locationIdString);
    if (locationIndex === -1) {
      return NextResponse.json({ message: `Location with ID '${locationIdString}' not found.` }, { status: 404 });
    }

    const locationToUpdate = { ...projectLocationsStore[locationIndex] };

    if (!locationToUpdate.isAssigned || !locationToUpdate.projectId) {
      return NextResponse.json({ message: `Location ${locationIdString} is not currently assigned to any project.` }, { status: 400 });
    }

    const previouslyAssignedProjectId = locationToUpdate.projectId;
    const project = projectsStore.find(p => p.id === previouslyAssignedProjectId);


    locationToUpdate.projectId = undefined; 
    locationToUpdate.isAssigned = false;
    locationToUpdate.updatedAt = new Date().toISOString();
    locationToUpdate.updatedBy = "user_admin_placeholder_unassign"; 

    projectLocationsStore[locationIndex] = locationToUpdate;
    global.__API_PROJECT_LOCATIONS_STORE__ = projectLocationsStore;

    if (previouslyAssignedProjectId) {
        const projectToUpdateIndex = projectsStore.findIndex(p => p.id === previouslyAssignedProjectId);
        if (projectToUpdateIndex !== -1) {
            projectsStore[projectToUpdateIndex].locationId = undefined; 
            projectsStore[projectToUpdateIndex].updatedAt = new Date().toISOString();
            global.__API_PROJECTS_STORE__ = projectsStore;
        }
    }

    // --- Notification Trigger ---
    if (project) {
        const team = projectTeamsStore.find(t => t.id === project.teamId);
        if (team && team.members) {
            for (const member of team.members) {
                try {
                    await notificationService.createNotification({
                        userId: member.userId,
                        message: `Your project '${project.title}' has been unassigned from location/stall '${locationIdString}'.`,
                        type: 'project_location_update',
                        link: `/project-fair/student`, 
                    });
                } catch (notifError) {
                    console.error(`Failed to send location unassignment notification to user ${member.userId}:`, notifError);
                }
            }
        }
    }
    // --- End Notification Trigger ---


    return NextResponse.json({ status: 'success', data: { location: locationToUpdate } });
  } catch (error) {
    console.error(`Error unassigning project from location ${locationIdString}:`, error);
    return NextResponse.json({ message: 'Error unassigning project from location', error: (error as Error).message }, { status: 500 });
  }
}
