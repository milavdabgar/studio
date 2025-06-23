
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectTeam } from '@/types/entities';

// Ensure the global store is initialized if not already
if (!(global as any).__API_PROJECT_TEAMS_STORE__) {
  (global as any).__API_PROJECT_TEAMS_STORE__ = [];
}

interface RouteParams {
  params: Promise<{
    id: string; // Team ID
    memberUserId: string; // User ID of the member to remove
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id: teamId, memberUserId } = await params;
  let currentProjectTeamsStore = global.__API_PROJECT_TEAMS_STORE__ as ProjectTeam[];

  if (!Array.isArray(currentProjectTeamsStore)) {
    currentProjectTeamsStore = []; 
    global.__API_PROJECT_TEAMS_STORE__ = currentProjectTeamsStore;
    return NextResponse.json({ message: 'Team data store issue, please retry or contact admin.' }, { status: 500 });
  }

  const teamIndex = currentProjectTeamsStore.findIndex(t => t.id === teamId);

  if (teamIndex === -1) {
    return NextResponse.json({ message: 'Team not found' }, { status: 404 });
  }

  const team = { ...currentProjectTeamsStore[teamIndex] }; 

  if (team.members.length <= 1) {
    return NextResponse.json({ message: 'Team must have at least one member. Cannot remove the last member.' }, { status: 400 });
  }

  const memberToRemove = team.members.find(m => m.userId === memberUserId);
  if (!memberToRemove) {
    return NextResponse.json({ message: 'Member not found in this team' }, { status: 404 });
  }

  if (memberToRemove.isLeader && team.members.filter(m => m.isLeader).length === 1) {
    return NextResponse.json({ message: 'Cannot remove the only team leader. Assign another leader first.' }, { status: 400 });
  }

  team.members = team.members.filter(m => m.userId !== memberUserId);
  team.updatedAt = new Date().toISOString();
  team.updatedBy = "user_admin_placeholder_member_remove"; 
  
  currentProjectTeamsStore[teamIndex] = team;
  global.__API_PROJECT_TEAMS_STORE__ = currentProjectTeamsStore; 

  return NextResponse.json({ status: 'success', data: { team } }, { status: 200 });
}