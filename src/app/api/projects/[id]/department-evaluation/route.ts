// src/app/api/projects/[id]/department-evaluation/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Project, ProjectEvaluation } from '@/types/entities';

declare global {
  // eslint-disable-next-line no-var
  var __API_PROJECTS_STORE__: Project[] | undefined;
}
if (!global.__API_PROJECTS_STORE__) global.__API_PROJECTS_STORE__ = [];
let projectsStore: Project[] = global.__API_PROJECTS_STORE__;

interface RouteParams {
  params: {
    id: string; // Project ID
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: projectId } = params;
  try {
    const evaluationData = await request.json() as Omit<ProjectEvaluation, 'completed' | 'juryId' | 'evaluatedAt'>; // Assuming score, feedback, criteriaScores

    if (evaluationData.score === undefined || evaluationData.score < 0 || evaluationData.score > 100) {
      return NextResponse.json({ message: 'Score must be between 0 and 100.' }, { status: 400 });
    }

    const projectIndex = projectsStore.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
    }

    const projectToUpdate = { ...projectsStore[projectIndex] };
    
    projectToUpdate.deptEvaluation = {
      completed: true,
      score: evaluationData.score,
      feedback: evaluationData.feedback || undefined,
      juryId: "user_jury_placeholder_dept", // TODO: Get actual jury user ID from session/token
      evaluatedAt: new Date().toISOString(),
      criteriaScores: evaluationData.criteriaScores || undefined,
    };
    projectToUpdate.updatedAt = new Date().toISOString();
    // Optionally update project status to 'evaluated' if appropriate
    // projectToUpdate.status = 'evaluated'; 

    projectsStore[projectIndex] = projectToUpdate;
    global.__API_PROJECTS_STORE__ = projectsStore;

    return NextResponse.json({ status: 'success', data: { project: projectToUpdate } });

  } catch (error) {
    console.error(`Error submitting department evaluation for project ${projectId}:`, error);
    return NextResponse.json({ message: 'Error submitting department evaluation', error: (error as Error).message }, { status: 500 });
  }
}
