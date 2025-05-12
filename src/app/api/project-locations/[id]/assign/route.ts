// src/app/api/project-locations/[id]/assign/route.ts
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

    const projectExists = projectsStore.find(p => p.id === projectId);
    if (!projectExists) {
      return NextResponse.json({ message: `Project with ID '${projectId}' not found.` }, { status: 404 });
    }
    
    // Check if this project is already assigned to a *different* location
    const otherLocationAssignedToProject = projectLocationsStore.find(loc => loc.projectId === projectId && loc.locationId !== locationIdString);
    if (otherLocationAssignedToProject) {
        return NextResponse.json({ message: `Project ${projectId} is already assigned to location ${otherLocationAssignedToProject.locationId}.`}, { status: 409 });
    }


    locationToUpdate.projectId = projectId;
    locationToUpdate.isAssigned = true;
    locationToUpdate.updatedAt = new Date().toISOString();
    locationToUpdate.updatedBy = "user_admin_placeholder_assign"; // TODO: Actual user

    projectLocationsStore[locationIndex] = locationToUpdate;
    global.__API_PROJECT_LOCATIONS_STORE__ = projectLocationsStore;

    // Also update the project to store its locationId
    const projectToUpdateIndex = projectsStore.findIndex(p => p.id === projectId);
    if (projectToUpdateIndex !== -1) {
        projectsStore[projectToUpdateIndex].locationId = locationIdString;
        projectsStore[projectToUpdateIndex].updatedAt = new Date().toISOString();
        global.__API_PROJECTS_STORE__ = projectsStore;
    }


    return NextResponse.json({ status: 'success', data: { location: locationToUpdate } });
  } catch (error) {
    console.error(`Error assigning project to location ${locationIdString}:`, error);
    return NextResponse.json({ message: 'Error assigning project to location', error: (error as Error