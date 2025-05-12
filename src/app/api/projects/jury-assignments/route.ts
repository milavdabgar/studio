// src/app/api/projects/jury-assignments/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Project, ProjectEvent } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECTS_STORE__: Project[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROJECT_EVENTS_STORE__: ProjectEvent[] | undefined;
}

if (!global.__API_PROJECTS_STORE__) global.__API_PROJECTS_STORE__ = [];
if (!global.__API_PROJECT_EVENTS_STORE__) global.__API_PROJECT_EVENTS_STORE__ = [];

const projectsStore: Project[] = global.__API_PROJECTS_STORE__;
const projectEventsStore: ProjectEvent[] = global.__API_PROJECT_EVENTS_STORE__;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const evaluationType = searchParams.get('evaluationType') || 'department'; // 'department' or 'central'

    if (!eventId) {
      return NextResponse.json({ message: 'Event ID is required.' }, { status: 400 });
    }

    const event = projectEventsStore.find(e => e.id === eventId);
    if (!event) {
      return NextResponse.json({ message: 'Event not found.' }, { status: 404 });
    }
    // For now, assume all 'approved' projects are available for jury. 
    // A real system might have specific jury-project assignments.
    const projectsForEvent = projectsStore.filter(p => p.eventId === eventId && p.status === 'approved');

    const evaluatedProjects: Project[] = [];
    const pendingProjects: Project[] = [];

    projectsForEvent.forEach(project => {
      if (evaluationType === 'central') {
        if (project.centralEvaluation?.completed) {
          evaluatedProjects.push(project);
        } else {
          pendingProjects.push(project);
        }
      } else { // Default to department evaluation
        if (project.deptEvaluation?.completed) {
          evaluatedProjects.push(project);
        } else {
          pendingProjects.push(project);
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
    return NextResponse.json({ message: 'Error fetching projects for jury', error: (error as Error).message }, { status: 500 });
  }
}
