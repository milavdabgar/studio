
import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { ProjectTeamModel } from '@/lib/models';

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
      
    const team = await ProjectTeamModel.findOne(query);

    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }

    const memberToSetAsLeaderIndex = (team as any).members.findIndex((m: any) => m.userId === memberUserId);
    if (memberToSetAsLeaderIndex === -1) {
      return NextResponse.json({ message: 'User is not a member of this team' }, { status: 404 });
    }

    // Update all members - set the specified member as leader and others as non-leaders
    (team as any).members = (team as any).members.map((member: any) => ({
      ...member,
      isLeader: member.userId === memberUserId,
      role: member.userId === memberUserId ? 'Team Leader' : (member.role === 'Team Leader' ? 'Member' : member.role),
    }));
    
    (team as any).updatedAt = new Date().toISOString();
    (team as any).updatedBy = "user_admin_placeholder_leader_change"; 

    await (team as any).save();

    return NextResponse.json({ status: 'success', data: { team: (team as any).toJSON() } }, { status: 200 });
  } catch (error) {
    console.error('Error changing team leader:', error);
    return NextResponse.json({ message: 'Error changing team leader', error: (error as Error).message }, { status: 500 });
  }
}