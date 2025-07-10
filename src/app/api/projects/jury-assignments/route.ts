// src/app/api/projects/jury-assignments/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { ProjectModel, ProjectEventModel } from '@/lib/models';
import type { Project } from '@/types/entities';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const evaluationType = searchParams.get('evaluationType') || 'department'; // 'department' or 'central'

    if (!eventId) {
      return NextResponse.json({ message: 'Event ID is required.' }, { status: 400 });
    }

    const event = await ProjectEventModel.findOne({
      id: eventId
    }).lean();
    
    if (!event) {
      return NextResponse.json({ message: 'Event not found.' }, { status: 404 });
    }
    
    // For now, assume all 'approved' projects are available for jury. 
    // A real system might have specific jury-project assignments.
    const projectsForEvent = await ProjectModel.find({
      eventId: eventId,
      status: 'approved'
    }).lean();

    const evaluatedProjects: Project[] = [];
    const pendingProjects: Project[] = [];

    projectsForEvent.forEach(project => {
      const projectData = project as unknown as Project;
      if (evaluationType === 'central') {
        if (projectData.centralEvaluation?.completed) {
          evaluatedProjects.push(projectData);
        } else {
          pendingProjects.push(projectData);
        }
      } else { // Default to department evaluation
        if (projectData.deptEvaluation?.completed) {
          evaluatedProjects.push(projectData);
        } else {
          pendingProjects.push(projectData);
        }
      }
    });
    
    // Optionally sort pending projects, e.g., by location or title
    pendingProjects.sort((a, b) => (a.locationId || '').localeCompare(b.locationId || '') || a.title.localeCompare(b.title));
    evaluatedProjects.sort((a, b) => (a.locationId || '').localeCompare(b.locationId || '') || a.title.localeCompare(b.title));

    return NextResponse.json({
      status: 'success',
      data: {
        evaluatedProjects,
        pendingProjects,
        totalEvaluated: evaluatedProjects.length,
        totalPending: pendingProjects.length,
      },
    });

  } catch (error) {
    console.error('Error fetching projects for jury:', error);
    return NextResponse.json({ message: 'Error fetching projects for jury' }, { status: 500 });
  }
}
