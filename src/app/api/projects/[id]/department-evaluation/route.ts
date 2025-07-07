// src/app/api/projects/[id]/department-evaluation/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { ProjectEvaluation } from '@/types/entities';
import { ProjectModel } from '@/lib/models';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{
    id: string; // Project ID
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ message: 'Database connection failed.' }, { status: 500 });
  }

  try {
    const { id: projectId } = await params;
    const evaluationData = await request.json() as Omit<ProjectEvaluation, 'completed' | 'juryId' | 'evaluatedAt'>; // Assuming score, feedback, criteriaScores

    if (evaluationData.score === undefined || evaluationData.score < 0 || evaluationData.score > 100) {
      return NextResponse.json({ message: 'Score must be between 0 and 100.' }, { status: 400 });
    }

    const deptEvaluation = {
      completed: true,
      score: evaluationData.score,
      feedback: evaluationData.feedback || undefined,
      juryId: "user_jury_placeholder_dept", // TODO: Get actual jury user ID from session/token
      evaluatedAt: new Date().toISOString(),
      criteriaScores: evaluationData.criteriaScores || undefined,
    };

    const updatedProject = await ProjectModel.findOneAndUpdate(
      { id: projectId },
      { 
        deptEvaluation,
        updatedAt: new Date().toISOString()
        // Optionally update project status to 'evaluated' if appropriate
        // status: 'evaluated'
      },
      { new: true }
    );

    if (!updatedProject) {
      return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
    }

    return NextResponse.json({ status: 'success', data: { project: updatedProject } });
  } catch (error) {
    console.error(`Error submitting department evaluation:`, error);
    return NextResponse.json({ message: 'Error submitting department evaluation', error: (error as Error).message }, { status: 500 });
  }
}
