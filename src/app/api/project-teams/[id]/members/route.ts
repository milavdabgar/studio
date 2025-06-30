
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectTeamMember } from '@/types/entities'; 
import { connectMongoose } from '@/lib/mongodb';
import { ProjectTeamModel, UserModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string; // Team ID
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: teamId } = await params;
  
  try {
    await connectMongoose();

    // Check if teamId is a valid MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(teamId);
    
    const query = isValidObjectId 
      ? { $or: [{ id: teamId }, { _id: teamId }] }
      : { id: teamId };
      
    const team = await ProjectTeamModel.findOne(query).lean();

    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }

    // Get member details with user information
    const memberDetails = await Promise.all(
      (team as any).members.map(async (member: any) => {
        // Check if userId is a valid MongoDB ObjectId
        const isValidUserObjectId = /^[0-9a-fA-F]{24}$/.test(member.userId);
        
        const userQuery = isValidUserObjectId 
          ? { $or: [{ id: member.userId }, { _id: member.userId }] }
          : { id: member.userId };
          
        const user = await UserModel.findOne(userQuery).lean();
        
        return {
          id: (member as any)._id,
          userId: (member as any).userId,
          name: (user as any)?.displayName || (member as any).name || 'Unknown User', 
          enrollmentNo: (member as any).enrollmentNo,
          role: (member as any).role,
          isLeader: (member as any).isLeader,
          joinedAt: (member as any).joinedAt,
          email: (user as any)?.email, 
        };
      })
    );

    return NextResponse.json({
      status: 'success',
      data: {
        teamId: (team as any).id || (team as any)._id,
        teamName: (team as any).name,
        members: memberDetails,
      }
    });
  } catch (error) {
    console.error('Error getting team members:', error);
    return NextResponse.json({ message: 'Error getting team members', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: teamId } = await params;
  
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

    const { userId, name, enrollmentNo, role, isLeader } = await request.json() as Partial<ProjectTeamMember> & { userId: string };

    if (!userId || !name || !enrollmentNo) {
      return NextResponse.json({ message: 'User ID, name, and enrollment number are required for a new member.' }, { status: 400 });
    }
    
    // Check maximum members limit (use team's maxMembers or default to 4)
    const maxMembers = (team as any).maxMembers || 4;
    if ((team as any).members.length >= maxMembers) {
      return NextResponse.json({ message: `Team has reached the maximum limit of ${maxMembers} members` }, { status: 400 });
    }

    // Check for duplicate member
    if ((team as any).members.some((m: any) => m.userId === userId)) {
      return NextResponse.json({ message: 'User is already a member of this team' }, { status: 400 });
    }

    // Verify user exists
    const isValidUserObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    
    const userQuery = isValidUserObjectId 
      ? { $or: [{ id: userId }, { _id: userId }] }
      : { id: userId };
      
    const userExists = await UserModel.findOne(userQuery).lean();
    
    if (!userExists) {
      return NextResponse.json({ message: `User with ID ${userId} not found.`}, {status: 404});
    }

    const newMember: ProjectTeamMember = {
      userId,
      name: name || (userExists as any).displayName,
      enrollmentNo,
      role: role || 'Member',
      isLeader: isLeader || false,
      joinedAt: new Date().toISOString()
    };

    (team as any).members.push(newMember);
    (team as any).updatedAt = new Date().toISOString();
    (team as any).updatedBy = "user_admin_placeholder_member_add"; 

    await (team as any).save();

    return NextResponse.json({ status: 'success', data: { team: (team as any).toJSON() } }, { status: 200 });
  } catch (error) {
    console.error(`Error adding member to team ${teamId}:`, error);
    return NextResponse.json({ message: 'Error adding member to team', error: (error as Error).message }, { status: 500 });
  }
}
