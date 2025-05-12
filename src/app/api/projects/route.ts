
import { NextResponse, type NextRequest } from 'next/server';
import type { Project } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECTS_STORE__: Project[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_TEAMS_STORE__: any[] | undefined; 
  // eslint-disable-next-line no-var
  var __API_PROJECT_EVENTS_STORE__: any[] | undefined; 
  // eslint-disable-next-line no-var
  var __API_DEPARTMENTS_STORE__: any[] | undefined; 
}

const initialProjectsData: Project[] = [
  { 
    id: "proj_smartwaste_gpp", 
    title: "Smart Waste Management System", 
    category: "IoT",
    abstract: "An IoT based system for smart waste collection.",
    department: "dept_ce_gpp", 
    status: "submitted",
    requirements: { power: true, internet: true, specialSpace: false },
    guide: { userId: "user_faculty_cs01_gpp", name: "Faculty CS01", department: "dept_ce_gpp", contactNumber: "1234567890" },
    teamId: "team_innovate_gpp",
    eventId: "event_techfest_2024_gpp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deptEvaluation: { completed: false },
    centralEvaluation: { completed: false },
  },
  { 
    id: "proj_waterpurifier_gpp", 
    title: "Solar Powered Water Purifier", 
    category: "Sustainability",
    abstract: "A portable solar water purifier.",
    department: "dept_ee_gpp", 
    status: "approved",
    requirements: { power: false, internet: false, specialSpace: true, otherRequirements: "Needs sunlight" },
    guide: { userId: "user_faculty_me01_gpp", name: "Faculty ME01", department: "dept_me_gpp", contactNumber: "0987654321" },
    teamId: "team_ecosol_gpp",
    eventId: "event_techfest_2024_gpp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deptEvaluation: { completed: true, score: 85, feedback: "Good work" },
    centralEvaluation: { completed: false },
  },
];

const ensureProjectsStore = () => {
  if (!global.__API_PROJECT_TEAMS_STORE__) global.__API_PROJECT_TEAMS_STORE__ = [];
  if (!global.__API_PROJECT_EVENTS_STORE__) global.__API_PROJECT_EVENTS_STORE__ = [];
  if (!global.__API_DEPARTMENTS_STORE__) global.__API_DEPARTMENTS_STORE__ = [];

  if (!global.__API_PROJECTS_STORE__ || !Array.isArray(global.__API_PROJECTS_STORE__)) {
    console.warn("Projects API Store was not an array or undefined. Initializing with default data.");
    global.__API_PROJECTS_STORE__ = [...initialProjectsData];
  } else if (global.__API_PROJECTS_STORE__.length === 0 && process.env.NODE_ENV === 'development') {
    // console.warn("Projects API Store was an empty array. Re-initializing with default data for development.");
    // global.__API_PROJECTS_STORE__ = [...initialProjectsData];
  }
};

ensureProjectsStore(); // Initialize at module load

const generateId = (): string => `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  ensureProjectsStore(); // Ensure store is valid for each request
  const currentProjectsStore: Project[] = global.__API_PROJECTS_STORE__!;

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    
    let filteredProjects = [...currentProjectsStore];

    if (eventId) {
      filteredProjects = filteredProjects.filter(project => project.eventId === eventId);
    }
    if (department && department !== 'all') {
      filteredProjects = filteredProjects.filter(project => project.department === department);
    }
    if (status && status !== 'all') {
      filteredProjects = filteredProjects.filter(project => project.status === status);
    }
    if (category && category !== 'all') {
      filteredProjects = filteredProjects.filter(project => project.category === category);
    }
    
    return NextResponse.json({ status: 'success', data: { projects: filteredProjects } });
  } catch (error) {
    console.error("Error in GET /api/projects:", error);
    return NextResponse.json({ message: 'Internal server error processing projects request.', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  ensureProjectsStore();
  const currentProjectsStore: Project[] = global.__API_PROJECTS_STORE__!;
  try {
    const projectData = await request.json() as Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

    if (!projectData.title || !projectData.title.trim()) {
      return NextResponse.json({ message: 'Project Title is required.' }, { status: 400 });
    }
    if (!projectData.department) {
      return NextResponse.json({ message: 'Department is required.' }, { status: 400 });
    }
     if (!projectData.teamId) {
      return NextResponse.json({ message: 'Team ID is required.' }, { status: 400 });
    }
     if (!projectData.eventId) {
      return NextResponse.json({ message: 'Event ID is required.' }, { status: 400 });
    }
    if (!projectData.guide || !projectData.guide.userId || !projectData.guide.name || !projectData.guide.department) {
        return NextResponse.json({ message: 'Guide information (userId, name, department) is required.' }, { status: 400 });
    }


    const currentTimestamp = new Date().toISOString();
    const newProject: Project = {
      id: generateId(),
      ...projectData,
      status: projectData.status || 'submitted',
      requirements: projectData.requirements || { power: false, internet: false, specialSpace: false },
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    currentProjectsStore.push(newProject);
    global.__API_PROJECTS_STORE__ = currentProjectsStore;
    return NextResponse.json({ status: 'success', data: { project: newProject } }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ message: 'Error creating project', error: (error as Error).message }, { status: 500 });
  }
}
