
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectTeam } from '@/types/entities';

// Ensure the global store is initialized if not already
if (!(global as any).__API_PROJECT_TEAMS_STORE__) {
  (global as any).__API_PROJECT_TEAMS_STORE__ = [];
}
const projectTeamsStore: ProjectTeam[] = (global as any).__API_PROJECT_TEAMS_STORE__;

interface RouteParams {
  params: {
    id: string; // Team ID
    memberUserId: string; // User ID of the member to set as leader
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: teamId, memberUserId } = params;

  const teamIndex = projectTeamsStore.findIndex(t => t.id === teamId);

  if (teamIndex === -1) {
    return NextResponse.json({ message: 'Team not found' }, { status: 404 });
  }

  const team = projectTeamsStore[teamIndex];

  // TODO: Add permission checks (e.g., only admin or current team leader can change leader)

  const memberToSetAsLeaderIndex = team.members.findIndex(m => m.userId === memberUserId);
  if (memberToSetAsLeaderIndex === -1) {
    return NextResponse.json({ message: 'User is not a member of this team' }, { status: 404 });
  }

  team.members.forEach((member, index) => {
    member.isLeader = member.userId === memberUserId;
    member.role = member.isLeader ? 'Team Leader' : (member.role === 'Team Leader' ? 'Member' : member.role);
  });
  team.updatedAt = new Date().toISOString();

  projectTeamsStore[teamIndex] = team;
  (global as any).__API_PROJECT_TEAMS_STORE__ = projectTeamsStore;

  return NextResponse.json(team, { status: 200 });
}
