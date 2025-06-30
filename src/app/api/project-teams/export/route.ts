// src/app/api/project-teams/export/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectTeam, Department, ProjectEvent, User as SystemUser, ProjectTeamMember } from '@/types/entities';
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
    const query: any = {};
    if (eventId) query.eventId = eventId;
    if (departmentIdFilter) query.department = departmentIdFilter;

    const filteredTeams = await ProjectTeamModel.find(query).lean();

    if (filteredTeams.length === 0) {
      return NextResponse.json({ message: 'No teams to export for the given filters.' }, { status: 404 });
    }

    // Get all departments and events for lookup
    const departments = await DepartmentModel.find({}).lean();
    const events = await ProjectEventModel.find({}).lean();

    const teamDataForCsv = await Promise.all(filteredTeams.map(async (team: any) => {
        const department = departments.find((d: any) => (d as any).id === (team as any).department || ((d as any)._id && (d as any)._id.toString() === (team as any).department));
        const event = events.find((e: any) => (e as any).id === (team as any).eventId || ((e as any)._id && (e as any)._id.toString() === (team as any).eventId));
        
        if ((team as any).members.length === 0) {
            return [{ // Return a row even for teams with no members
                teamId: (team as any).id || (team as any)._id,
                teamName: (team as any).name,
                departmentName: (department as any)?.name || (team as any).department,
                departmentCode: (department as any)?.code || '',
                eventName: (event as any)?.name || (team as any).eventId,
                memberCount: 0,
                memberUserId: '',
                memberName: '',
                memberEnrollmentNo: '',
                memberRole: '',
                memberIsLeader: '',
                createdBy: (team as any).createdBy || '',
                createdAt: (team as any).createdAt ? new Date((team as any).createdAt).toISOString() : '',
            }];
        }

        return await Promise.all((team as any).members.map(async (member: any) => {
            // Find user by userId with flexible matching
            const isValidUserObjectId = /^[0-9a-fA-F]{24}$/.test((member as any).userId);
            const userQuery = isValidUserObjectId 
              ? { $or: [{ id: (member as any).userId }, { _id: (member as any).userId }] }
              : { id: (member as any).userId };
            const user = await UserModel.findOne(userQuery).lean();
            
            return {
                teamId: (team as any).id || (team as any)._id,
                teamName: (team as any).name,
                departmentName: (department as any)?.name || (team as any).department,
                departmentCode: (department as any)?.code || '',
                eventName: (event as any)?.name || (team as any).eventId,
                memberCount: (team as any).members.length,
                memberUserId: (member as any).userId,
                memberName: (user as any)?.displayName || (member as any).name,
                memberEnrollmentNo: (member as any).enrollmentNo,
                memberRole: (member as any).role,
                memberIsLeader: (member as any).isLeader,
                createdBy: (team as any).createdBy || '',
                createdAt: (team as any).createdAt ? new Date((team as any).createdAt).toISOString() : '',
            };
        }));
    })).then((results: any) => results.flat());
    
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
    return NextResponse.json({ message: 'Error exporting project teams', error: (error as Error).message }, { status: 500 });
  }
}
