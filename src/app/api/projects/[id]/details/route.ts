// src/app/api/projects/[id]/details/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Project, ProjectTeam, ProjectLocation, ProjectEvent, Department, User as SystemUser } from '@/types/entities';
import { ProjectModel, ProjectTeamModel, ProjectLocationModel, ProjectEventModel, DepartmentModel, UserModel } from '@/lib/models';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{
    id: string; // Project ID
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next');
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ message: 'Database connection failed.' }, { status: 500 });
  }

  try {
    const { id } = await params;

    const project = await ProjectModel.findOne({ 
      id
    }).lean() as Project | null;

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    // Fetch related data in parallel
    const [team, location, event, departmentDetails, guideDetails, deptJuryDetails, centralJuryDetails] = await Promise.all([
      ProjectTeamModel.findOne({ 
        id: project.teamId 
      }).lean() as Promise<ProjectTeam | null>,
      
      ProjectLocationModel.findOne({ locationId: project.locationId }).lean() as Promise<ProjectLocation | null>,
      
      ProjectEventModel.findOne({ 
        id: project.eventId 
      }).lean() as Promise<ProjectEvent | null>,
      
      DepartmentModel.findOne({ 
        id: project.department 
      }).lean() as Promise<Department | null>,
      
      UserModel.findOne({ 
        id: project.guide.userId 
      }).lean() as Promise<SystemUser | null>,
      
      project.deptEvaluation?.juryId ? 
        UserModel.findOne({ 
          id: project.deptEvaluation.juryId 
        }).lean() as Promise<SystemUser | null> : 
        Promise.resolve(null),
      
      project.centralEvaluation?.juryId ? 
        UserModel.findOne({ 
          id: project.centralEvaluation.juryId 
        }).lean() as Promise<SystemUser | null> : 
        Promise.resolve(null)
    ]);

    const projectWithDetails = {
      ...project,
      team: team || null,
      location: location || null,
      event: event || null,
      departmentDetails: departmentDetails || null,
      guideDetails: guideDetails ? { 
        id: guideDetails.id, 
        displayName: guideDetails.displayName, 
        email: guideDetails.email 
      } : null,
      deptJuryDetails: deptJuryDetails ? { 
        id: deptJuryDetails.id, 
        displayName: deptJuryDetails.displayName, 
        email: deptJuryDetails.email 
      } : null,
      centralJuryDetails: centralJuryDetails ? { 
        id: centralJuryDetails.id, 
        displayName: centralJuryDetails.displayName, 
        email: centralJuryDetails.email 
      } : null,
    };

    return NextResponse.json({ status: 'success', data: { project: projectWithDetails } });
  } catch (error) {
    console.error('Error fetching project details:', error);
    return NextResponse.json({ message: 'Error fetching project details.' }, { status: 500 });
  }
}
