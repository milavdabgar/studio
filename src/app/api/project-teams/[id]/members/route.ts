
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectTeam, User, ProjectTeamMember } from '@/types/entities'; 

// Ensure the global stores are initialized if not already
if (!(global as any).__API_PROJECT_TEAMS_STORE__) {
  (global as any).__API_PROJECT_TEAMS_STORE__ = [];
}
if (!(global as any).__API_USERS_STORE__) {
  (global as any).__API_USERS_STORE__ = [];
}

interface RouteParams {
  params: Promise<{
    id: string; // Team ID
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: teamId } = await params;
  const projectTeamsStoreRef = global.__API_PROJECT_TEAMS_STORE__ as ProjectTeam[];
  const usersStoreRef = global.__API_USERS_STORE__ as User[];


  if (!Array.isArray(projectTeamsStoreRef) || !Array.isArray(usersStoreRef)) {
      global.__API_PROJECT_TEAMS_STORE__ = [];
      global.__API_USERS_STORE__ = [];
      return NextResponse.json({ message: 'Data store issue, please retry or contact admin.' }, { status: 500 });
  }

  const team = projectTeamsStoreRef.find(t => t.id === teamId);

  if (!team) {
    return NextResponse.json({ message: 'Team not found' }, { status: 404 });
  }

  const memberDetails = team.members.map(member => {
    const user = usersStoreRef.find(u => u.id === member.userId);
    return {
      userId: member.userId,
      name: user?.displayName || member.name || 'Unknown User', 
      enrollmentNo: member.enrollmentNo,
      role: member.role,
      isLeader: member.isLeader,
      email: user?.email, 
    };
  });

  return NextResponse.json({
    status: 'success',
    data: {
        teamId: team.id,
        teamName: team.name,
        members: memberDetails,
    }
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: teamId } = await params;
  let projectTeamsStoreRef = global.__API_PROJECT_TEAMS_STORE__ as ProjectTeam[];
  const usersStoreRef = global.__API_USERS_STORE__ as User[];

  if (!Array.isArray(projectTeamsStoreRef) || !Array.isArray(usersStoreRef)) {
      global.__API_PROJECT_TEAMS_STORE__ = [];
      global.__API_USERS_STORE__ = [];
      return NextResponse.json({ message: 'Data store issue, please retry or contact admin.' }, { status: 500 });
  }
  
  const teamIndex = projectTeamsStoreRef.findIndex(t => t.id === teamId);

  if (teamIndex === -1) {
    return NextResponse.json({ message: 'Team not found' }, { status: 404 });
  }
  
  const team = { ...projectTeamsStoreRef[teamIndex] }; 

  try {
    const { userId, name, enrollmentNo, role, isLeader } = await request.json() as Partial<ProjectTeamMember> & { userId: string };

    if (!userId || !name || !enrollmentNo) {
      return NextResponse.json({ message: 'User ID, name, and enrollment number are required for a new member.' }, { status: 400 });
    }
    
    if (team.members.length >= 4) {
      return NextResponse.json({ message: 'Team cannot have more than 4 members' }, { status: 400 });
    }

    if (team.members.some(m => m.userId === userId)) {
      return NextResponse.json({ message: 'User is already a member of this team' }, { status: 400 });
    }

    const userExists = usersStoreRef.find(u => u.id === userId);
    if (!userExists) {
        return NextResponse.json({ message: `User with ID ${userId} not found.`}, {status: 404});
    }


    const newMember: ProjectTeamMember = {
      userId,
      name: name || userExists.displayName,
      enrollmentNo,
      role: role || 'Member',
      isLeader: isLeader || false,
    };

    team.members.push(newMember);
    team.updatedAt = new Date().toISOString();
    team.updatedBy = "user_admin_placeholder_member_add"; 

    projectTeamsStoreRef[teamIndex] = team; 
    global.__API_PROJECT_TEAMS_STORE__ = projectTeamsStoreRef; 

    return NextResponse.json({ status: 'success', data: { team } }, { status: 200 });
  } catch (error) {
    console.error(`Error adding member to team ${teamId}:`, error);
    return NextResponse.json({ message: 'Error adding member to team', error: (error as Error).message }, { status: 500 });
  }
}
