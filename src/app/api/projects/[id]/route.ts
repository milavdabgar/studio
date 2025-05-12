
import { NextResponse, type NextRequest } from 'next/server';
import type { Project } from '@/types/entities';
// Assuming these stores are initialized as in other files
declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECTS_STORE__: Project[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_LOCATIONS_STORE__: any[] | undefined;
}
if (!global.__API_PROJECTS_STORE__) global.__API_PROJECTS_STORE__ = [];
if (!global.__API_PROJECT_LOCATIONS_STORE__) global.__API_PROJECT_LOCATIONS_STORE__ = [];

let projectsStore: Project[] = global.__API_PROJECTS_STORE__;
let projectLocationsStore: any[] = global.__API_PROJECT_LOCATIONS_STORE__;


interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const project = projectsStore.find(p => p.id === id);
  if (project) {
    return NextResponse.json({ status: 'success', data: { project } });
  }
  return NextResponse.json({ message: 'Project not found' }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const projectDataToUpdate = await request.json() as Partial<Omit<Project, 'id'>>;
    const projectIndex = projectsStore.findIndex(p => p.id === id);

    if (projectIndex === -1) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }
    const existingProject = projectsStore[projectIndex];

    // Add specific validations for update if necessary
    if (projectDataToUpdate.title !== undefined && !projectDataToUpdate.title.trim()) {
        return NextResponse.json({ message: 'Project Title cannot be empty if provided.' }, { status: 400 });
    }

    const updatedProject: Project = {
      ...existingProject,
      ...projectDataToUpdate,
      updatedAt: new Date().toISOString(),
    };

    projectsStore[projectIndex] = updatedProject;
    global.__API_PROJECTS_STORE__ = projectsStore; // Persist change

    return NextResponse.json({ status: 'success', data: { project: updatedProject } });
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    return NextResponse.json({ message: `Error updating project ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const projectIndex = projectsStore.findIndex(p => p.id === id);

  if (projectIndex === -1) {
    return NextResponse.json({ message: 'Project not found' }, { status: 404 });
  }
  const deletedProject = projectsStore.splice(projectIndex, 1)[0];
  global.__API_PROJECTS_STORE__ = projectsStore; // Persist change

  // If project had a location, unassign it
  if (deletedProject.locationId) {
    const locationIndex = projectLocationsStore.findIndex(loc => loc.id === deletedProject.locationId || loc.locationId === deletedProject.locationId); // Check both possible ID fields
    if (locationIndex !== -1) {
      projectLocationsStore[locationIndex].projectId = null;
      projectLocationsStore[locationIndex].isAssigned = false;
      projectLocationsStore[locationIndex].updatedBy = "user_admin_placeholder_project_delete"; // Placeholder
      global.__API_PROJECT_LOCATIONS_STORE__ = projectLocationsStore;
    }
  }

  return NextResponse.json({ status: 'success', data: null });
}
```
  </change>
  <change>
    <file>src/app/api/projects/statistics/route