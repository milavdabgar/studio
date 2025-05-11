
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectTeam, User } from '@/types/entities'; // Assuming User type for member details

// Ensure the global stores are initialized if not already
if (!(global as any).__API_PROJECT_TEAMS_STORE__) {
  (global as any).__API_PROJECT_TEAMS_STORE__ = [];
}
if (!(global as any).__API_USERS_STORE__) {
  (global as any).__API_USERS_STORE__ = [];
}

const projectTeamsStore: ProjectTeam[] = (global as any).__API_PROJECT_TEAMS_STORE__;
const usersStore: User[] = (global as any).__API_USERS_STORE__;

interface RouteParams {
  params: {
    id: string; // Team ID
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: teamId } = params;

  const team = projectTeamsStore.find(t => t.id === teamId);

  if (!team) {
    return NextResponse.json({ message: 'Team not found' }, { status: 404 });
  }

  const memberDetails = team.members.map(member => {
    const user = usersStore.find(u => u.id === member.userId);
    return {
      userId: member.userId,
      name: user?.displayName || member.name || 'Unknown User', // Fallback name
      enrollmentNo: member.enrollmentNo,
      role: member.role,
      isLeader: member.isLeader,
      email: user?.email, // Add email if available
    };
  });

  return NextResponse.json({
    teamId: team.id,
    teamName: team.name,
    members: memberDetails,
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: teamId } = params;
  let team = projectTeamsStore.find(t => t.id === teamId);

  if (!team) {
    return NextResponse.json({ message: 'Team not found' }, { status: 404 });
  }

  try {
    const { userId, name, enrollmentNo, role, isLeader } = await request.json();

    if (!userId || !name || !enrollmentNo) {
      return NextResponse.json({ message: 'User ID, name, and enrollment number are required for a new member.' }, { status: 400 });
    }
    
    // TODO: Add permission checks for adding members (e.g., only admin or team leader)

    if (team.members.length >= 4) {
      return NextResponse.json({ message: 'Team cannot have more than 4 members' }, { status: 400 });
    }

    if (team.members.some(m => m.userId === userId)) {
      return NextResponse.json({ message: 'User is already a member of this team' }, { status: 400 });
    }

    const userExists = usersStore.find(u => u.id === userId);
    if (!userExists) {
        return NextResponse.json({ message: `User with ID ${userId} not found.`}, {status: 404});
    }


    const newMember = {
      userId,
      name: name || userExists.displayName,
      enrollmentNo,
      role: role || 'Member',
      isLeader: isLeader || false,
    };

    team.members.push(newMember);
    team.updatedAt = new Date().toISOString();

    // Update the store
    const teamIndex = projectTeamsStore.findIndex(t => t.id === teamId);
    if (teamIndex !== -1) {
      projectTeamsStore[teamIndex] = team;
    }
     (global as any).__API_PROJECT_TEAMS_STORE__ = projectTeamsStore;


    return NextResponse.json(team, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error adding member to team', error: (error as Error).message }, { status: 500 });
  }
}
