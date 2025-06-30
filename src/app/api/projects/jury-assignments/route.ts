// src/app/api/projects/jury-assignments/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Project, ProjectEvent } from '@/types/entities';
import { ProjectModel, ProjectEventModel } from '@/lib/models';
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
      $or: [{ id: eventId }, { _id: eventId }]
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

    const evaluatedProjects: any[] = [];
    const pendingProjects: any[] = [];

    projectsForEvent.forEach(project => {
      if (evaluationType === 'central') {
        if ((project as any).centralEvaluation?.completed) {
          evaluatedProjects.push(project);
        } else {
          pendingProjects.push(project);
        }
      } else { // Default to department evaluation
        if ((project as any).deptEvaluation?.completed) {
          evaluatedProjects.push(project);
        } else {
          pendingProjects.push(project);
        }
      }
    });
    
    // Optionally sort pending projects, e.g., by location or title
    pendingProjects.sort((a, b) => ((a as any).locationId || '').localeCompare((b as any).locationId || '') || (a as any).title.localeCompare((b as any).title));
    evaluatedProjects.sort((a, b) => ((a as any).locationId || '').localeCompare((b as any).locationId || '') || (a as any).title.localeCompare((b as any).title));

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
    return NextResponse.json({ message: 'Error fetching projects for jury', error: (error as Error).message }, { status: 500 });
  }
}
