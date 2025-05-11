
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectTeam } from '@/types/entities';

// Ensure the global store is initialized if not already
if (!(global as any).__API_PROJECT_TEAMS_STORE__) {
  (global as any).__API_PROJECT_TEAMS_STORE__ = [];
}
// let projectTeamsStore: ProjectTeam[] = (global as any).__API_PROJECT_TEAMS_STORE__; // Local ref is fine here if mutations update global

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
      currentProjectTeamsStore = []; // Recover if corrupted
      global.__API_PROJECT_TEAMS_STORE__ = currentProjectTeamsStore;
      return NextResponse.json({ message: 'Team data store issue, please retry or contact admin.' }, { status: 500 });
  }

  const teamIndex = currentProjectTeamsStore.findIndex(t => t.id === teamId);

  if (teamIndex === -1) {
    return NextResponse.json({ message: 'Team not found' }, { status: 404 });
  }

  const team = { ...currentProjectTeamsStore[teamIndex] }; // Work on a copy

  // TODO: Add permission checks (e.g., only admin or current team leader can change leader)

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
  team.updatedBy = "user_admin_placeholder_leader_change"; // TODO: Replace with actual user ID

  currentProjectTeamsStore[teamIndex] = team;
  global.__API_PROJECT_TEAMS_STORE__ = currentProjectTeamsStore; // Persist changes to global store

  return NextResponse.json(team, { status: 200 });
}