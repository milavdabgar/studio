
import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { ProjectTeamModel, type IProjectTeam } from '@/lib/models';
import type { ProjectTeamMember } from '@/types/entities';

interface RouteParams {
  params: Promise<{
    id: string; // Team ID
    memberUserId: string; // User ID of the member to set as leader
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: teamId, memberUserId } = await params;
  
  try {
    await connectMongoose();

    // Check if teamId is a valid MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(teamId);
    
    const query = isValidObjectId 
      ? { $or: [{ id: teamId }, { _id: teamId }] }
      : { id: teamId };
      
    const team = await ProjectTeamModel.findOne(query) as IProjectTeam | null;

    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }

    const memberToSetAsLeaderIndex = team.members.findIndex((m: ProjectTeamMember) => m.userId === memberUserId);
    if (memberToSetAsLeaderIndex === -1) {
      return NextResponse.json({ message: 'User is not a member of this team' }, { status: 404 });
    }

    // Update all members - set the specified member as leader and others as non-leaders
    team.members = team.members.map((member: ProjectTeamMember) => ({
      ...member,
      isLeader: member.userId === memberUserId,
      role: member.userId === memberUserId ? 'Team Leader' : (member.role === 'Team Leader' ? 'Member' : member.role),
    }));
    
    team.updatedAt = new Date().toISOString();
    team.updatedBy = "user_admin_placeholder_leader_change"; 

    await team.save();

    return NextResponse.json({ status: 'success', data: { team: team.toJSON() } }, { status: 200 });
  } catch (error) {
    console.error('Error changing team leader:', error);
    return NextResponse.json({ message: 'Error changing team leader', error: (error as Error).message }, { status: 500 });
  }
}