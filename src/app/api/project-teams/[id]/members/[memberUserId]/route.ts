
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

    if ((team as any).members.length <= 1) {
      return NextResponse.json({ message: 'Team must have at least one member. Cannot remove the last member.' }, { status: 400 });
    }

    const memberToRemove = (team as any).members.find((m: any) => m.userId === memberUserId);
    if (!memberToRemove) {
      return NextResponse.json({ message: 'Member not found in this team' }, { status: 404 });
    }

    if ((memberToRemove as any).isLeader && (team as any).members.filter((m: any) => m.isLeader).length === 1) {
      return NextResponse.json({ message: 'Cannot remove the only team leader. Assign another leader first.' }, { status: 400 });
    }

    (team as any).members = (team as any).members.filter((m: any) => m.userId !== memberUserId);
    (team as any).updatedAt = new Date().toISOString();
    (team as any).updatedBy = "user_admin_placeholder_member_remove"; 
    
    await (team as any).save();

    return NextResponse.json({ status: 'success', data: { team: (team as any).toJSON() } }, { status: 200 });
  } catch (error) {
    console.error(`Error removing team member from team ${teamId}:`, error);
    return NextResponse.json({ message: 'Error removing team member', error: (error as Error).message }, { status: 500 });
  }
}