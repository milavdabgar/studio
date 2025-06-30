
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
  try {
    await connectMongoose();
    const { id: teamId } = await params;

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
      team.members.map(async member => {
        // Check if userId is a valid MongoDB ObjectId
        const isValidUserObjectId = /^[0-9a-fA-F]{24}$/.test(member.userId);
        
        const userQuery = isValidUserObjectId 
          ? { $or: [{ id: member.userId }, { _id: member.userId }] }
          : { id: member.userId };
          
        const user = await UserModel.findOne(userQuery).lean();
        
        return {
          id: member._id,
          userId: member.userId,
          name: user?.displayName || member.name || 'Unknown User', 
          enrollmentNo: member.enrollmentNo,
          role: member.role,
          isLeader: member.isLeader,
          joinedAt: member.joinedAt,
          email: user?.email, 
        };
      })
    );

    return NextResponse.json({
      status: 'success',
      data: {
        teamId: team.id || team._id,
        teamName: team.name,
        members: memberDetails,
      }
    });
  } catch (error) {
    console.error('Error getting team members:', error);
    return NextResponse.json({ message: 'Error getting team members', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await connectMongoose();
    const { id: teamId } = await params;

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
    const maxMembers = team.maxMembers || 4;
    if (team.members.length >= maxMembers) {
      return NextResponse.json({ message: `Team has reached the maximum limit of ${maxMembers} members` }, { status: 400 });
    }

    // Check for duplicate member
    if (team.members.some(m => m.userId === userId)) {
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
      name: name || userExists.displayName,
      enrollmentNo,
      role: role || 'Member',
      isLeader: isLeader || false,
      joinedAt: new Date().toISOString()
    };

    team.members.push(newMember);
    team.updatedAt = new Date().toISOString();
    team.updatedBy = "user_admin_placeholder_member_add"; 

    await team.save();

    return NextResponse.json({ status: 'success', data: { team: team.toJSON() } }, { status: 200 });
  } catch (error) {
    console.error(`Error adding member to team:`, error);
    return NextResponse.json({ message: 'Error adding member to team', error: (error as Error).message }, { status: 500 });
  }
}
