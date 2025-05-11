// src/app/api/project-teams/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectTeam, ProjectTeamMember } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_TEAMS_STORE__: ProjectTeam[] | undefined;
}

if (!global.__API_PROJECT_TEAMS_STORE__) {
  global.__API_PROJECT_TEAMS_STORE__ = [];
}
// This variable will reference the global store.
// IMPORTANT: If this variable is reassigned (e.g., by .filter()), 
// global.__API_PROJECT_TEAMS_STORE__ must also be reassigned to reflect the change.
let projectTeamsStore: ProjectTeam[] = global.__API_PROJECT_TEAMS_STORE__;

interface RouteParams {
  params: {
    id: string; // Team ID
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  // Ensure the store is an array before searching
  if (!Array.isArray(global.__API_PROJECT_TEAMS_STORE__)) {
    global.__API_PROJECT_TEAMS_STORE__ = []; // Recover if possible
    projectTeamsStore = global.__API_PROJECT_TEAMS_STORE__; // Update local ref
    return NextResponse.json({ message: 'Project Team data store corrupted.' }, { status: 500 });
  }
  projectTeamsStore = global.__API_PROJECT_TEAMS_STORE__; // Ensure local ref is up-to-date
  const team = projectTeamsStore.find(t => t.id === id);
  if (team) {
    return NextResponse.json({ status: 'success', data: { team } });
  }
  return NextResponse.json({ message: 'Team not found' }, { status: 404 });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) { // Changed from PUT to PATCH for partial updates
  const { id } = params;
  if (!Array.isArray(global.__API_PROJECT_TEAMS_STORE__)) {
    global.__API_PROJECT_TEAMS_STORE__ = [];
    projectTeamsStore = global.__API_PROJECT_TEAMS_STORE__;
    return NextResponse.json({ message: 'Project Team data store corrupted.' }, { status: 500 });
  }
  projectTeamsStore = global.__API_PROJECT_TEAMS_STORE__;

  try {
    const teamDataToUpdate = await request.json() as Partial<Omit<ProjectTeam, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;
    const teamIndex = projectTeamsStore.findIndex(t => t.id === id);

    if (teamIndex === -1) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }

    const existingTeam = projectTeamsStore[teamIndex];

    if (teamDataToUpdate.name !== undefined && !teamDataToUpdate.name.trim()) {
        return NextResponse.json({ message: 'Team Name cannot be empty if provided.' }, { status: 400 });
    }
    // Add other specific validations for update if needed

    const updatedTeam: ProjectTeam = {
      ...existingTeam,
      ...teamDataToUpdate,
      name: teamDataToUpdate.name?.trim() || existingTeam.name,
      // Ensure members array is preserved or updated correctly
      members: teamDataToUpdate.members || existingTeam.members,
      updatedBy: "user_admin_placeholder_update", // TODO: Get actual user ID
      updatedAt: new Date().toISOString(),
    };

    projectTeamsStore[teamIndex] = updatedTeam;
    global.__API_PROJECT_TEAMS_STORE__ = projectTeamsStore; // Persist change to global

    return NextResponse.json({ status: 'success', data: { team: updatedTeam } });
  } catch (error) {
    console.error(`Error updating team ${id}:`, error);
    return NextResponse.json({ message: `Error updating team ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_PROJECT_TEAMS_STORE__)) {
    global.__API_PROJECT_TEAMS_STORE__ = [];
    projectTeamsStore = global.__API_PROJECT_TEAMS_STORE__;
    return NextResponse.json({ message: 'Project Team data store corrupted.' }, { status: 500 });
  }
  projectTeamsStore = global.__API_PROJECT_TEAMS_STORE__;

  const initialLength = projectTeamsStore.length;
  const newStore = projectTeamsStore.filter(t => t.id !== id);

  if (newStore.length === initialLength) {
    return NextResponse.json({ message: 'Team not found' }, { status: 404 });
  }
  
  global.__API_PROJECT_TEAMS_STORE__ = newStore; // Update the global store reference
  projectTeamsStore = newStore; // Update local reference as well

  return NextResponse.json({ message: 'Team deleted successfully' }, { status: 200 });
}