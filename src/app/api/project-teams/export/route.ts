// src/app/api/project-teams/export/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectTeam, Department, ProjectEvent, User as SystemUser, ProjectTeamMember } from '@/types/entities';
import { Parser } from 'json2csv';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_TEAMS_STORE__: ProjectTeam[] | undefined;
  // eslint-disable-next-line no-var
  var __API_DEPARTMENTS_STORE__: Department[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_EVENTS_STORE__: ProjectEvent[] | undefined;
  // eslint-disable-next-line no-var
  var __API_USERS_STORE__: SystemUser[] | undefined;
}

if (!global.__API_PROJECT_TEAMS_STORE__) global.__API_PROJECT_TEAMS_STORE__ = [];
if (!global.__API_DEPARTMENTS_STORE__) global.__API_DEPARTMENTS_STORE__ = [];
if (!global.__API_PROJECT_EVENTS_STORE__) global.__API_PROJECT_EVENTS_STORE__ = [];
if (!global.__API_USERS_STORE__) global.__API_USERS_STORE__ = [];

const teamsStore: ProjectTeam[] = global.__API_PROJECT_TEAMS_STORE__;
const departmentsStore: Department[] = global.__API_DEPARTMENTS_STORE__;
const eventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__;
const usersStore: SystemUser[] = global.__API_USERS_STORE__;


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const departmentIdFilter = searchParams.get('department');

    let filteredTeams = [...teamsStore];

    if (eventId) filteredTeams = filteredTeams.filter(t => t.eventId === eventId);
    if (departmentIdFilter) filteredTeams = filteredTeams.filter(t => t.department === departmentIdFilter);

    if (filteredTeams.length === 0) {
      return NextResponse.json({ message: 'No teams to export for the given filters.' }, { status: 404 });
    }

    const teamDataForCsv = filteredTeams.flatMap(team => {
        const department = departmentsStore.find(d => d.id === team.department);
        const event = eventsStore.find(e => e.id === team.eventId);
        
        if (team.members.length === 0) {
            return [{ // Return a row even for teams with no members
                teamId: team.id,
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
                createdAt: team.createdAt ? new Date(team.createdAt).toISOString() : '',
            }];
        }

        return team.members.map(member => {
            const user = usersStore.find(u => u.id === member.userId);
            return {
                teamId: team.id,
                teamName: team.name,
                departmentName: department?.name || team.department,
                departmentCode: department?.code || '',
                eventName: event?.name || team.eventId,
                memberCount: team.members.length,
                memberUserId: member.userId,
                memberName: user?.displayName || member.name,
                memberEnrollmentNo: member.enrollmentNo,
                memberRole: member.role,
                memberIsLeader: member.isLeader,
                createdBy: team.createdBy || '', // Assuming User ID, needs mapping to name if required
                createdAt: team.createdAt ? new Date(team.createdAt).toISOString() : '',
            };
        });
    });
    
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
