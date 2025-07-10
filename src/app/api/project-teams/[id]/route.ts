// src/app/api/project-teams/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectTeam, ProjectTeamMember } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { ProjectTeamModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface MongoDocument {
  _id: string;
  id?: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    // Try to find by custom id first, then by MongoDB _id if it's a valid ObjectId
    let team = await ProjectTeamModel.findOne({ id }).lean();
    if (!team && id.match(/^[0-9a-fA-F]{24}$/)) {
      team = await ProjectTeamModel.findById(id).lean();
    }
    
    if (team) {
      const teamWithId = {
        ...team,
        id: (team as MongoDocument).id || (team as MongoDocument)._id.toString()
      };
      return NextResponse.json({ status: 'success', data: { team: teamWithId } });
    }
    
    return NextResponse.json({ message: 'Team not found' }, { status: 404 });
  } catch (error) {
    console.error(`Error fetching project team ${id}:`, error);
    return NextResponse.json({ 
      message: 'Internal server error during team fetch.', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    const teamDataToUpdate = await request.json() as Partial<Omit<ProjectTeam, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;
    
    // Find the existing team
    let existingTeam = await ProjectTeamModel.findOne({ id }).lean();
    if (!existingTeam && id.match(/^[0-9a-fA-F]{24}$/)) {
      existingTeam = await ProjectTeamModel.findById(id).lean();
    }
    
    if (!existingTeam) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }

    // Validation
    if (teamDataToUpdate.name !== undefined && !teamDataToUpdate.name.trim()) {
        return NextResponse.json({ message: 'Team Name cannot be empty if provided.' }, { status: 400 });
    }
    if (teamDataToUpdate.members && teamDataToUpdate.members.length === 0) {
        return NextResponse.json({ message: 'Team must have at least one member.' }, { status: 400 });
    }
    if (teamDataToUpdate.members && !teamDataToUpdate.members.some((m: ProjectTeamMember) => m.isLeader)) {
        return NextResponse.json({ message: 'Team must have at least one leader.' }, { status: 400 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      ...teamDataToUpdate,
      updatedBy: "user_admin_placeholder_update",
      updatedAt: new Date().toISOString()
    };

    // Remove undefined fields and trim strings
    Object.keys(updateData).forEach((key: string) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      } else if (typeof updateData[key] === 'string') {
        updateData[key] = updateData[key].trim();
      }
    });

    // Update the team
    const updatedTeam = await ProjectTeamModel.findOneAndUpdate(
      { _id: (existingTeam as MongoDocument)._id },
      updateData,
      { new: true, lean: true }
    );

    if (!updatedTeam) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }

    // Format response
    const teamToReturn = {
      ...updatedTeam,
      id: (updatedTeam as MongoDocument).id || (updatedTeam as MongoDocument)._id.toString()
    };

    return NextResponse.json({ status: 'success', data: { team: teamToReturn } });
  } catch (error) {
    console.error(`Error updating team ${id}:`, error);
    return NextResponse.json({ message: `Error updating team` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    await connectMongoose();
    
    // Find and delete the team
    let deletedTeam = await ProjectTeamModel.findOneAndDelete({ id }).lean();
    if (!deletedTeam && id.match(/^[0-9a-fA-F]{24}$/)) {
      deletedTeam = await ProjectTeamModel.findByIdAndDelete(id).lean();
    }

    if (!deletedTeam) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({ status: 'success', data: null }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting team ${id}:`, error);
    return NextResponse.json({ message: `Error deleting team` }, { status: 500 });
  }
}