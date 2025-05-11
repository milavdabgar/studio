
import { NextResponse, type NextRequest } from 'next/server';
import type { Project } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECTS_STORE__: Project[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_TEAMS_STORE__: any[] | undefined; // Define if not already
  // eslint-disable-next-line no-var
  var __API_PROJECT_EVENTS_STORE__: any[] | undefined; // Define if not already
  // eslint-disable-next-line no-var
  var __API_DEPARTMENTS_STORE__: any[] | undefined; // Define if not already
}

const now = new Date().toISOString();

if (!global.__API_PROJECT_TEAMS_STORE__) {
  global.__API_PROJECT_TEAMS_STORE__ = [
    { id: "team_innovate_gpp", name: "Team Innovate", department: "dept_ce_gpp", eventId: "event_techfest_2024_gpp", members: [{ userId: "user_student_ce001_gpp", name: "Student CE001", enrollmentNo: "220010107001", role:"Team Leader", isLeader: true }] },
    { id: "team_ecosol_gpp", name: "EcoSolutions", department: "dept_ee_gpp", eventId: "event_techfest_2024_gpp", members: [] },
  ];
}
if (!global.__API_PROJECT_EVENTS_STORE__) {
  global.__API_PROJECT_EVENTS_STORE__ = [
    { id: "event_techfest_2024_gpp", name: "TechFest 2024", academicYear: "2024-25", eventDate: "2025-03-15T00:00:00.000Z", registrationStartDate: "2024-12-01T00:00:00.000Z", registrationEndDate: "2025-01-31T00:00:00.000Z", status: "upcoming", isActive: true, departments: ["dept_ce_gpp", "dept_me_gpp"], schedule: [] },
  ];
}
if(!global.__API_DEPARTMENTS_STORE__) {
    global.__API_DEPARTMENTS_STORE__ = [
        { id: "dept_ce_gpp", name: "Computer Engineering", code: "CE", instituteId: "inst1", status: "active" },
        { id: "dept_me_gpp", name: "Mechanical Engineering", code: "ME", instituteId: "inst1", status: "active" },
        { id: "dept_ee_gpp", name: "Electrical Engineering", code: "EE", instituteId: "inst1", status: "active" },
    ];
}


if (!global.__API_PROJECTS_STORE__ || global.__API_PROJECTS_STORE__.length === 0) {
  global.__API_PROJECTS_STORE__ = [
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
      createdAt: now,
      updatedAt: now,
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
      createdAt: now,
      updatedAt: now,
      deptEvaluation: { completed: true, score: 85, feedback: "Good work" },
      centralEvaluation: { completed: false },
    },
  ];
}
const projectsStore: Project[] = global.__API_PROJECTS_STORE__;

const generateId = (): string => `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  if (!Array.isArray(global.__API_PROJECTS_STORE__)) {
    global.__API_PROJECTS_STORE__ = []; // Initialize if corrupted
    return NextResponse.json({ message: 'Internal server error: Project data store corrupted.' }, { status: 500 });
  }
  
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  
  let filteredProjects = [...global.__API_PROJECTS_STORE__];

  if (eventId) {
    filteredProjects = filteredProjects.filter(project => project.eventId === eventId);
  }
  // Add other filters as needed based on searchParams

  return NextResponse.json(filteredProjects);
}

export async function POST(request: NextRequest) {
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
    // Add more validations as needed for category, guide, etc.

    const currentTimestamp = new Date().toISOString();
    const newProject: Project = {
      id: generateId(),
      ...projectData,
      status: projectData.status || 'submitted',
      requirements: projectData.requirements || { power: false, internet: false, specialSpace: false },
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    global.__API_PROJECTS_STORE__?.push(newProject);
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ message: 'Error creating project', error: (error as Error).message }, { status: 500 });
  }
}
