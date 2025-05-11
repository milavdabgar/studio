// src/app/api/project-teams/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectTeam, ProjectTeamMember } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECT_TEAMS_STORE__: ProjectTeam[] | undefined;
}

const now = new Date().toISOString();

// Module-level store initialization (this runs once per module load/instance)
if (!global.__API_PROJECT_TEAMS_STORE__ || !Array.isArray(global.__API_PROJECT_TEAMS_STORE__) || global.__API_PROJECT_TEAMS_STORE__.length === 0) {
  global.__API_PROJECT_TEAMS_STORE__ = [
    { 
      id: "team_innovate_gpp", 
      name: "Team Innovate", 
      department: "dept_ce_gpp", 
      members: [{ userId: "user_student_ce001_gpp", name: "Student CE001", enrollmentNo: "220010107001", role:"Team Leader", isLeader: true }],
      eventId: "event_techfest_2024_gpp",
      createdAt: now,
      updatedAt: now,
    },
    { 
      id: "team_ecosol_gpp", 
      name: "EcoSolutions", 
      department: "dept_ee_gpp", 
      members: [{userId: "user_student_me002_gpp", name: "Student ME002", enrollmentNo: "220010108002", role: "Member", isLeader: false}], 
      eventId: "event_techfest_2024_gpp",
      createdAt: now,
      updatedAt: now,
    },
  ];
}
// This local variable `projectTeamsStore` will reference the global store.
// It's crucial that any modification to the array structure (like filter, splice)
// that intends to persist globally should reassign `global.__API_PROJECT_TEAMS_STORE__`.
let projectTeamsStore: ProjectTeam[] = global.__API_PROJECT_TEAMS_STORE__;

const generateTeamId = (): string => `team_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  let currentProjectTeamsStore = global.__API_PROJECT_TEAMS_STORE__;

  // Defensive check: if the store is not an array, re-initialize it.
  if (!Array.isArray(currentProjectTeamsStore)) {
    console.error("/api/project-teams GET: global.__API_PROJECT_TEAMS_STORE__ is not an array! Re-initializing.", currentProjectTeamsStore);
    const now = new Date().toISOString(); // Re-define now if it's not in scope here
    global.__API_PROJECT_TEAMS_STORE__ = [ 
        { 
          id: "team_innovate_gpp", 
          name: "Team Innovate", 
          department: "dept_ce_gpp", 
          members: [{ userId: "user_student_ce001_gpp", name: "Student CE001", enrollmentNo: "220010107001", role:"Team Leader", isLeader: true }],
          eventId: "event_techfest_2024_gpp",
          createdAt: now,
          updatedAt: now,
        },
        { 
          id: "team_ecosol_gpp", 
          name: "EcoSolutions", 
          department: "dept_ee_gpp", 
          members: [{userId: "user_student_me002_gpp", name: "Student ME002", enrollmentNo: "220010108002", role: "Member", isLeader: false}], 
          eventId: "event_techfest_2024_gpp",
          createdAt: now,
          updatedAt: now,
        },
    ];
    currentProjectTeamsStore = global.__API_PROJECT_TEAMS_STORE__;
    // Optionally, could return a 500 to indicate a recovery happened.
    // For now, will proceed with the re-initialized (default) data.
  }
  
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
        pages: Math.ceil(total / limit)
      }
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!Array.isArray(global.__API_PROJECT_TEAMS_STORE__)) {
        global.__API_PROJECT_TEAMS_STORE__ = []; // Initialize if corrupted
    }
    let currentProjectTeamsStore = global.__API_PROJECT_TEAMS_STORE__;

    const teamData = await request.json() as Omit<ProjectTeam, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;

    if (!teamData.name || !teamData.name.trim() || !teamData.department || !teamData.eventId) {
      return NextResponse.json({ message: 'Missing required fields: name, department, eventId.' }, { status: 400 });
    }
    if (!teamData.members || teamData.members.length === 0 || !teamData.members.some(m => m.isLeader)) {
        return NextResponse.json({ message: 'Team must have at least one member and one leader.' }, { status: 400 });
    }
    
    // Check for duplicate team name within the same event
    if (currentProjectTeamsStore.some(t => t.name.toLowerCase() === teamData.name.toLowerCase() && t.eventId === teamData.eventId)) {
        return NextResponse.json({ message: `Team with name '${teamData.name}' already exists for this event.`}, { status: 409 });
    }

    const currentTimestamp = new Date().toISOString();
    const newTeam: ProjectTeam = {
      id: generateTeamId(),
      ...teamData,
      createdBy: "user_admin_placeholder", // TODO: Replace with actual user ID from session
      updatedBy: "user_admin_placeholder",
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    currentProjectTeamsStore.push(newTeam);
    global.__API_PROJECT_TEAMS_STORE__ = currentProjectTeamsStore; // Persist change to global
    return NextResponse.json({ status: 'success', data: { team: newTeam } }, { status: 201 });
  } catch (error) {
    console.error('Error creating project team:', error);
    return NextResponse.json({ message: 'Error creating project team', error: (error as Error).message }, { status: 500 });
  }
}