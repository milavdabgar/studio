// src/app/api/projects/[id]/central-evaluation/route.ts
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
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next');
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ message: 'Database connection failed.' }, { status: 500 });
  }

  try {
    const { id: projectId } = await params;
    const evaluationData = await request.json() as Omit<ProjectEvaluation, 'completed' | 'juryId' | 'evaluatedAt'>;

    if (evaluationData.score === undefined || evaluationData.score < 0 || evaluationData.score > 100) {
      return NextResponse.json({ message: 'Score must be between 0 and 100.' }, { status: 400 });
    }

    const project = await ProjectModel.findOne({ 
      id: projectId 
    });

    if (!project) {
      return NextResponse.json({ message: 'Project not found.' }, { status: 404 });
    }

    if (!project.deptEvaluation?.completed) {
        return NextResponse.json({ message: 'Department evaluation must be completed before central evaluation.' }, { status: 400 });
    }

    const centralEvaluation = {
      completed: true,
      score: evaluationData.score,
      feedback: evaluationData.feedback || undefined,
      juryId: "user_jury_placeholder_central", // TODO: Get actual jury user ID
      evaluatedAt: new Date().toISOString(),
      criteriaScores: evaluationData.criteriaScores || undefined,
    };

    const updatedProject = await ProjectModel.findOneAndUpdate(
      { id: projectId },
      { 
        centralEvaluation,
        status: 'evaluated', // Update status after central evaluation
        updatedAt: new Date().toISOString()
      },
      { new: true }
    );

    return NextResponse.json({ status: 'success', data: { project: updatedProject } });
  } catch (error) {
    console.error(`Error submitting central evaluation:`, error);
    return NextResponse.json({ message: 'Error submitting central evaluation' }, { status: 500 });
  }
}
