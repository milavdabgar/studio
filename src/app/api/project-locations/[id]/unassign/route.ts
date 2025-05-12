// src/app/api/project-locations/[id]/unassign/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectLocation, Project } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_LOCATIONS_STORE__: ProjectLocation[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECTS_STORE__: Project[] | undefined;
}

if (!global.__API_PROJECT_LOCATIONS_STORE__) global.__API_PROJECT_LOCATIONS_STORE__ = [];
if (!global.__API_PROJECTS_STORE__) global.__API_PROJECTS_STORE__ = [];

let projectLocationsStore: ProjectLocation[] = global.__API_PROJECT_LOCATIONS_STORE__;
let projectsStore: Project[] = global.__API_PROJECTS_STORE__;


interface RouteParams {
  params: {
    id: string; // This is the locationId string (e.g., "A-01"), not MongoDB _id
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: locationIdString } = params; // The user-friendly locationId
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

    locationToUpdate.projectId = undefined; // Clear the project ID
    locationToUpdate.isAssigned = false;
    locationToUpdate.updatedAt = new Date().toISOString();
    locationToUpdate.updatedBy = "user_admin_placeholder_unassign"; // TODO: Actual user

    projectLocationsStore[locationIndex] = locationToUpdate;
    global.__API_PROJECT_LOCATIONS_STORE__ = projectLocationsStore;

    // Also update the previously assigned project to remove its locationId
    if (previouslyAssignedProjectId) {
        const projectToUpdateIndex = projectsStore.findIndex(p => p.id === previouslyAssignedProjectId);
        if (projectToUpdateIndex !== -1) {
            projectsStore[projectToUpdateIndex].locationId = undefined; // Clear location from project
            projectsStore[projectToUpdateIndex].updatedAt = new Date().toISOString();
            global.__API_PROJECTS_STORE__ = projectsStore;
        }
    }

    return NextResponse.json({ status: 'success', data: { location: locationToUpdate } });
  } catch (error) {
    console.error(`Error unassigning project from location ${locationIdString}:`, error);
    return NextResponse.json({ message: 'Error unassigning project from location', error: (error as Error).message }, { status: 500 });
  }
}
```
  </change>
  <change>
    <file>src/app/api/project-locations/batch