// src/app/api/project-teams/export/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectTeamMember } from '@/types/entities';
import { Parser } from 'json2csv';
import { connectMongoose } from '@/lib/mongodb';
import { ProjectTeamModel, DepartmentModel, UserModel, ProjectEventModel } from '@/lib/models';


export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const departmentIdFilter = searchParams.get('department');

    // Build query filters
    const query: Record<string, string> = {};
    if (eventId) query.eventId = eventId;
    if (departmentIdFilter) query.department = departmentIdFilter;

    const filteredTeams = await ProjectTeamModel.find(query).lean();

    if (filteredTeams.length === 0) {
      return NextResponse.json({ message: 'No teams to export for the given filters.' }, { status: 404 });
    }

    // Get all departments and events for lookup
    const departments = await DepartmentModel.find({}).lean();
    const events = await ProjectEventModel.find({}).lean();

    const teamDataForCsv = await Promise.all(filteredTeams.map(async (team: Record<string, unknown>) => {
        const department = departments.find((d: Record<string, unknown>) => d.id === team.department || (d._id && d._id.toString() === team.department));
        const event = events.find((e: Record<string, unknown>) => e.id === team.eventId || (e._id && e._id.toString() === team.eventId));
        
        const members = team.members as ProjectTeamMember[] || [];
        if (members.length === 0) {
            return [{ // Return a row even for teams with no members
                teamId: team.id || team._id,
                teamName: team.name,
                departmentName: department?.name || team.department,
                departmentCode: department?.code || '',
                eventName: event?.name || team.eventId,
                memberCount: 0,
                memberUserId: '',
                memberName: '',
                memberEnrollmentNo: '',
                memberRole: '',
                memberIsLeader: '',
                createdBy: team.createdBy || '',
                createdAt: team.createdAt ? new Date(team.createdAt as string).toISOString() : '',
            }];
        }

        return await Promise.all(members.map(async (member: ProjectTeamMember) => {
            // Find user by userId with flexible matching
            const isValidUserObjectId = /^[0-9a-fA-F]{24}$/.test(member.userId);
            const userQuery = isValidUserObjectId 
              ? { $or: [{ id: member.userId }, { _id: member.userId }] }
              : { id: member.userId };
            const user = await UserModel.findOne(userQuery).lean();
            
            return {
                teamId: team.id || team._id,
                teamName: team.name,
                departmentName: department?.name || team.department,
                departmentCode: department?.code || '',
                eventName: event?.name || team.eventId,
                memberCount: members.length,
                memberUserId: member.userId,
                memberName: (user as Record<string, unknown>)?.displayName || member.name,
                memberEnrollmentNo: member.enrollmentNo,
                memberRole: member.role,
                memberIsLeader: member.isLeader,
                createdBy: team.createdBy || '',
                createdAt: team.createdAt ? new Date(team.createdAt as string).toISOString() : '',
            };
        }));
    })).then((results) => results.flat());
    
    if (teamDataForCsv.length === 0) {
         return NextResponse.json({ message: 'No team data processed for export.' }, { status: 404 });
    }


    const fields = [
        "teamId", "teamName", "departmentName", "departmentCode", "eventName", "memberCount",
        "memberUserId", "memberName", "memberEnrollmentNo", "memberRole", "memberIsLeader",
        "createdBy", "createdAt"
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(teamDataForCsv);

    const headers = new Headers();
    headers.append('Content-Type', 'text/csv');
    headers.append('Content-Disposition', `attachment; filename="project_teams_export_${new Date().toISOString().split('T')[0]}.csv"`);
    
    return new NextResponse(csv, { headers });

  } catch (error) {
    console.error('Error exporting project teams:', error);
    return NextResponse.json({ message: 'Error exporting project teams' }, { status: 500 });
  }
}
