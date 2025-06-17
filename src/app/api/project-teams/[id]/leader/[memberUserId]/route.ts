
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectTeam } from '@/types/entities';

// Ensure the global store is initialized if not already
if (!(global as any).__API_PROJECT_TEAMS_STORE__) {
  (global as any).__API_PROJECT_TEAMS_STORE__ = [];
}

interface RouteParams {
  params: {
    id: string; // Team ID
    memberUserId: string; // User ID of the member to set as leader
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: teamId, memberUserId } = params;
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

  const memberToSetAsLeaderIndex = team.members.findIndex(m => m.userId === memberUserId);
  if (memberToSetAsLeaderIndex === -1) {
    return NextResponse.json({ message: 'User is not a member of this team' }, { status: 404 });
  }

  team.members = team.members.map((member, index) => ({
    ...member,
    isLeader: member.userId === memberUserId,
    role: member.userId === memberUserId ? 'Team Leader' : (member.role === 'Team Leader' ? 'Member' : member.role),
  }));
  team.updatedAt = new Date().toISOString();
  team.updatedBy = "user_admin_placeholder_leader_change"; 

  currentProjectTeamsStore[teamIndex] = team;
  global.__API_PROJECT_TEAMS_STORE__ = currentProjectTeamsStore; 

  return NextResponse.json({ status: 'success', data: { team } }, { status: 200 });
}