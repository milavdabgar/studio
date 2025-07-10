// src/app/api/project-teams/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectTeam } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { ProjectTeamModel } from '@/lib/models';

const generateTeamIdInternal = (): string => `team_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      filters[key] = value;
    });

    // Build MongoDB query
    const query: Record<string, string> = {};
    if (filters.department) {
      query.department = filters.department;
    }
    if (filters.eventId) {
      query.eventId = filters.eventId;
    }
    
    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10; 
    
    // Get total count for pagination
    const total = await ProjectTeamModel.countDocuments(query);
    
    // Get paginated teams
    const teams = await ProjectTeamModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
      
    // Format teams with proper id field
    const teamsWithId = teams.map(team => ({
      ...team,
      id: team.id || (team as Record<string, unknown> & { _id: { toString(): string } })._id.toString()
    }));

    return NextResponse.json({
      status: 'success',
      data: {
        teams: teamsWithId,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1 
        }
      }
    });
  } catch (error) {
    console.error("Error in GET /api/project-teams:", error);
    return NextResponse.json({ message: 'Internal server error processing project teams request.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
    const teamData = await request.json() as Omit<ProjectTeam, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;

    if (!teamData.name || !teamData.name.trim() || !teamData.department || !teamData.eventId) {
      return NextResponse.json({ message: 'Missing required fields: name, department, eventId.' }, { status: 400 });
    }
    if (!teamData.members || teamData.members.length === 0 || !teamData.members.some(m => m.isLeader)) {
        return NextResponse.json({ message: 'Team must have at least one member and one leader.' }, { status: 400 });
    }
    
    // Check for existing team with same name and event
    const existingTeam = await ProjectTeamModel.findOne({
      name: { $regex: new RegExp(`^${teamData.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      eventId: teamData.eventId
    });
    
    if (existingTeam) {
        return NextResponse.json({ message: `Team with name '${teamData.name}' already exists for this event.`}, { status: 409 });
    }

    const currentTimestamp = new Date().toISOString();
    
    // Ensure members have joinedAt timestamps
    const processedMembers = teamData.members?.map(member => ({
      ...member,
      joinedAt: member.joinedAt || currentTimestamp
    })) || [];
    
    const newTeamData = {
      id: generateTeamIdInternal(),
      name: teamData.name,
      description: teamData.description,
      department: teamData.department,
      eventId: teamData.eventId,
      maxMembers: teamData.maxMembers,
      status: teamData.status || 'active',
      members: processedMembers,
      createdBy: "user_admin_placeholder", 
      updatedBy: "user_admin_placeholder",
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const newTeam = new ProjectTeamModel(newTeamData);
    await newTeam.save();
    
    // Return team with properly formatted id
    const teamToReturn = newTeam.toJSON();
    
    return NextResponse.json({ status: 'success', data: { team: teamToReturn } }, { status: 201 });
  } catch (error) {
    console.error('Error creating project team:', error);
    return NextResponse.json({ message: 'Error creating project team' }, { status: 500 });
  }
}