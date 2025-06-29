
import { NextResponse, type NextRequest } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import { ProjectTeamModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string; // Team ID
    memberUserId: string; // User ID of the member to remove
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id: teamId, memberUserId } = await params;

    // Check if teamId is a valid MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(teamId);
    
    const query = isValidObjectId 
      ? { $or: [{ id: teamId }, { _id: teamId }] }
      : { id: teamId };
      
    const team = await ProjectTeamModel.findOne(query);

    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }

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
    
    await team.save();

    return NextResponse.json({ status: 'success', data: { team: team.toJSON() } }, { status: 200 });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json({ message: 'Error removing team member', error: (error as Error).message }, { status: 500 });
  }
}