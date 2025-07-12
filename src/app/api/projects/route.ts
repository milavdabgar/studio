
import { NextResponse, type NextRequest } from 'next/server';
import type { Project } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { ProjectModel } from '@/lib/models';

// Initialize default projects if none exist
async function initializeDefaultProjects() {
  await connectMongoose();
  const projectCount = await ProjectModel.countDocuments();
  
  if (projectCount === 0) {
    const now = new Date().toISOString();
    const defaultProjects = [
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
    
    await ProjectModel.insertMany(defaultProjects);
  }
}


const generateId = (): string => `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();
    await initializeDefaultProjects();
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    
    // Build filter query
    const filter: Record<string, unknown> = {};
    if (eventId) filter.eventId = eventId;
    if (department && department !== 'all') filter.department = department;
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;

    const projects = await ProjectModel.find(filter).lean();
    
    // Format projects to ensure proper id field
    const projectsWithId = projects.map(project => ({
      ...project,
      id: project.id || (project as { _id: unknown })._id?.toString()
    }));
    
    return NextResponse.json({ status: 'success', data: { projects: projectsWithId } });
  } catch (error) {
    console.error("Error in GET /api/projects:", error);
    return NextResponse.json({ message: 'Internal server error processing projects request.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoose();
    
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
    const newProjectData = {
      id: generateId(),
      ...projectData,
      status: projectData.status || 'submitted',
      requirements: projectData.requirements || { power: false, internet: false, specialSpace: false },
      deptEvaluation: projectData.deptEvaluation || { completed: false },
      centralEvaluation: projectData.centralEvaluation || { completed: false },
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
    };
    
    const newProject = new ProjectModel(newProjectData);
    await newProject.save();
    
    return NextResponse.json({ status: 'success', data: { project: newProject.toJSON() } }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    
    // SECURITY FIX: Handle validation errors properly
    if (error instanceof Error && error.message.includes('validation failed')) {
      return NextResponse.json({ 
        message: 'Validation failed. Please check your input data.', 
        details: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({ message: 'Error creating project' }, { status: 500 });
  }
}
