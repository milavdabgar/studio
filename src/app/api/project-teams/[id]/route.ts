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
let projectTeamsStore: ProjectTeam[] = global.__API_PROJECT_TEAMS_STORE__;

interface RouteParams {
  params: {
    id: string; // Team ID
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  if (!Array.isArray(global.__API_PROJECT_TEAMS_STORE__)) {
    global.__API_PROJECT_TEAMS_STORE__ = []; 
    projectTeamsStore = global.__API_PROJECT_TEAMS_STORE__;
    return NextResponse.json({ message: 'Project Team data store corrupted.' }, { status: 500 });
  }
  projectTeamsStore = global.__API_PROJECT_TEAMS_STORE__; 
  const team = projectTeamsStore.find(t => t.id === id);
  if (team) {
    return NextResponse.json({ status: 'success', data: { team } });
  }
  return NextResponse.json({ message: 'Team not found' }, { status: 404 });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) { 
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
    if (teamDataToUpdate.members && teamDataToUpdate.members.length === 0) {
        return NextResponse.json({ message: 'Team must have at least one member.' }, { status: 400 });
    }
    if (teamDataToUpdate.members && !teamDataToUpdate.members.some(m => m.isLeader)) {
        return NextResponse.json({ message: 'Team must have at least one leader.' }, { status: 400 });
    }


    const updatedTeam: ProjectTeam = {
      ...existingTeam,
      ...teamDataToUpdate,
      name: teamDataToUpdate.name?.trim() || existingTeam.name,
      members: teamDataToUpdate.members || existingTeam.members,
      updatedBy: "user_admin_placeholder_update", 
      updatedAt: new Date().toISOString(),
    };

    projectTeamsStore[teamIndex] = updatedTeam;
    global.__API_PROJECT_TEAMS_STORE__ = projectTeamsStore; 

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
  
  global.__API_PROJECT_TEAMS_STORE__ = newStore; 
  projectTeamsStore = newStore; 

  return NextResponse.json({ status: 'success', data: null }, { status: 200 });
}