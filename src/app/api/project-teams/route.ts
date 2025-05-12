// src/app/api/project-teams/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectTeam, ProjectTeamMember } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_TEAMS_STORE__: ProjectTeam[] | undefined;
}

const initialProjectTeamsData: ProjectTeam[] = [
  { 
    id: "team_innovate_gpp", 
    name: "Team Innovate", 
    department: "dept_ce_gpp", 
    members: [{ userId: "user_student_ce001_gpp", name: "Student CE001", enrollmentNo: "220010107001", role:"Team Leader", isLeader: true }],
    eventId: "event_techfest_2024_gpp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: "team_ecosol_gpp", 
    name: "EcoSolutions", 
    department: "dept_ee_gpp", 
    members: [{userId: "user_student_me002_gpp", name: "Student ME002", enrollmentNo: "220010108002", role: "Member", isLeader: false}], 
    eventId: "event_techfest_2024_gpp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const ensureProjectTeamsStore = () => {
  if (!global.__API_PROJECT_TEAMS_STORE__ || !Array.isArray(global.__API_PROJECT_TEAMS_STORE__)) {
    console.warn("Project Teams API Store was not an array or undefined. Initializing with default data.");
    global.__API_PROJECT_TEAMS_STORE__ = [...initialProjectTeamsData];
  } else if (global.__API_PROJECT_TEAMS_STORE__.length === 0 && process.env.NODE_ENV === 'development') { // Optionally re-populate if empty in dev
    // This condition might need adjustment if an empty store is a valid state after deletions.
    // For now, let's assume if it's empty in dev, it might be due to HMR issues or accidental clearing.
    // console.warn("Project Teams API Store was an empty array. Re-initializing with default data for development.");
    // global.__API_PROJECT_TEAMS_STORE__ = [...initialProjectTeamsData];
  }
};

ensureProjectTeamsStore(); // Initialize at module load

const generateTeamIdInternal = (): string => `team_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  ensureProjectTeamsStore(); // Ensure store is valid for each request
  const currentProjectTeamsStore: ProjectTeam[] = global.__API_PROJECT_TEAMS_STORE__!;

  try {
    const { searchParams } = new URL(request.url);
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      filters[key] = value;
    });

    let filteredTeams = [...currentProjectTeamsStore]; 

    if (filters.department) {
      filteredTeams = filteredTeams.filter(team => team.department === filters.department);
    }
    if (filters.eventId) {
      filteredTeams = filteredTeams.filter(team => team.eventId === filters.eventId);
    }
    
    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10; 
    const total = filteredTeams.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTeams = filteredTeams.slice(startIndex, endIndex);

    return NextResponse.json({
      status: 'success',
      data: {
        teams: paginatedTeams,
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
    return NextResponse.json({ message: 'Internal server error processing project teams request.', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  ensureProjectTeamsStore();
  const currentProjectTeamsStore: ProjectTeam[] = global.__API_PROJECT_TEAMS_STORE__!;

  try {
    const teamData = await request.json() as Omit<ProjectTeam, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;

    if (!teamData.name || !teamData.name.trim() || !teamData.department || !teamData.eventId) {
      return NextResponse.json({ message: 'Missing required fields: name, department, eventId.' }, { status: 400 });
    }
    if (!teamData.members || teamData.members.length === 0 || !teamData.members.some(m => m.isLeader)) {
        return NextResponse.json({ message: 'Team must have at least one member and one leader.' }, { status: 400 });
    }
    
    if (currentProjectTeamsStore.some(t => t.name.toLowerCase() === teamData.name.toLowerCase() && t.eventId === teamData.eventId)) {
        return NextResponse.json({ message: `Team with name '${teamData.name}' already exists for this event.`}, { status: 409 });
    }

    const currentTimestamp = new Date().toISOString();
    const newTeam: ProjectTeam = {
      id: generateTeamIdInternal(),
      ...teamData,
      createdBy: "user_admin_placeholder", 
      updatedBy: "user_admin_placeholder",
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    currentProjectTeamsStore.push(newTeam);
    global.__API_PROJECT_TEAMS_STORE__ = currentProjectTeamsStore; 
    return NextResponse.json({ status: 'success', data: { team: newTeam } }, { status: 201 });
  } catch (error) {
    console.error('Error creating project team:', error);
    return NextResponse.json({ message: 'Error creating project team', error: (error as Error).message }, { status: 500 });
  }