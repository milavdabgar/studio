
// src/app/api/projects/event/[eventId]/winners/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Project, ProjectEvent, Department, ProjectTeam as Team } from '@/types/entities';
import { ProjectModel, ProjectEventModel, DepartmentModel, ProjectTeamModel } from '@/lib/models';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

interface WinnerProject extends Project {
    rank?: number;
    teamDetails?: Team;
    departmentDetails?: Department;
}

interface DepartmentWinnerGroup {
    department: Department; // Store full department object
    winners: WinnerProject[];
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next');
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ message: 'Database connection failed.' }, { status: 500 });
  }

  try {
    const { eventId } = await params;

    const event = await ProjectEventModel.findOne({ 
      id: eventId 
    }).lean() as ProjectEvent | null;
    
    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    const isAdmin = true; // In a real app, get this from user session/role
    if (!event.publishResults && !isAdmin) {
      return NextResponse.json({ message: 'Results have not been published yet.' }, { status: 403 });
    }

    const [eventProjectsRaw, departmentsRaw, teamsRaw] = await Promise.all([
      ProjectModel.find({ eventId }).lean(),
      DepartmentModel.find({}).lean(),
      ProjectTeamModel.find({}).lean()
    ]);

    const eventProjects = eventProjectsRaw as unknown as Project[];
    const departments = departmentsRaw as unknown as Department[];
    const teams = teamsRaw as unknown as Team[];

    const departmentWinners: DepartmentWinnerGroup[] = [];

    departments.forEach(dept => {
      const projectsInDept = eventProjects
        .filter(p => {
          const deptId = typeof p.department === 'string' ? p.department : (p.department as { id?: string })?.id;
          return deptId === dept.id && p.deptEvaluation?.completed && typeof p.deptEvaluation.score === 'number';
        })
        .sort((a, b) => (b.deptEvaluation!.score!) - (a.deptEvaluation!.score!))
        .slice(0, 3) // Top 3
        .map((project, index) => ({
          ...project,
          rank: index + 1,
          teamDetails: teams.find(t => t.id === project.teamId),
          departmentDetails: dept // Already have department details
        } as WinnerProject));
      
      if (projectsInDept.length > 0) {
        departmentWinners.push({
          department: dept,
          winners: projectsInDept
        });
      }
    });

    const instituteWinners = eventProjects
      .filter(p => p.centralEvaluation?.completed && typeof p.centralEvaluation.score === 'number')
      .sort((a, b) => (b.centralEvaluation!.score!) - (a.centralEvaluation!.score!))
      .slice(0, 3) // Top 3
      .map((project, index) => ({
        ...project,
        rank: index + 1,
        teamDetails: teams.find(t => t.id === project.teamId),
        departmentDetails: departments.find(d => {
          const deptId = typeof project.department === 'string' ? project.department : (project.department as { id?: string })?.id;
          return d.id === deptId;
        })
      } as WinnerProject));

    return NextResponse.json({
      status: 'success',
      data: {
        departmentWinners,
        instituteWinners
      }
    });
  } catch (error) {
    console.error('Error fetching project winners:', error);
    return NextResponse.json({ message: 'Error fetching project winners.' }, { status: 500 });
  }
}
