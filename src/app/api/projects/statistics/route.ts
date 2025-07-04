// src/app/api/projects/statistics/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Project, ProjectEvent, Department } from '@/types/entities';
import mongoose from 'mongoose';
import { ProjectModel, ProjectEventModel, DepartmentModel } from '@/lib/models';


export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    // Build query for projects
    const projectQuery: any = {};
    if (eventId) {
      const eventExists = await ProjectEventModel.findOne({
        id: eventId
      });
      if (!eventExists) {
        return NextResponse.json({ message: 'Event not found.' }, { status: 404 });
      }
      projectQuery.eventId = eventId;
    }

    const relevantProjects = await ProjectModel.find(projectQuery).lean();
    const departments = await DepartmentModel.find({}).lean();

    if (relevantProjects.length === 0) {
      const emptyStats = {
        total: 0, evaluated: 0, pending: 0, averageScore: 0, departmentWise: {}
      };
      return NextResponse.json({ status: 'success', data: emptyStats });
    }
    
    const departmentStatsMap = new Map<string, { departmentId: string; name: string; code: string; total: number; evaluated: number; totalScore: number; scoreCount: number }>();

    relevantProjects.forEach((project: any) => {
      const deptId = project.department; 
      const deptInfo = departments.find((d: any) => d.id === deptId || d._id.toString() === deptId);

      if (!departmentStatsMap.has(deptId)) {
        departmentStatsMap.set(deptId, { 
            departmentId: deptId,
            name: deptInfo?.name || 'Unknown Department', 
            code: deptInfo?.code || 'UNK', 
            total: 0, 
            evaluated: 0,
            totalScore: 0,
            scoreCount: 0
        });
      }
      const stats = departmentStatsMap.get(deptId)!;
      stats.total++;
      const deptEvalScore = project.deptEvaluation?.score;
      const centralEvalScore = project.centralEvaluation?.score;
      
      if ((project.deptEvaluation?.completed && typeof deptEvalScore === 'number') || (project.centralEvaluation?.completed && typeof centralEvalScore === 'number')) {
        stats.evaluated++;
        const scoreToConsider = typeof centralEvalScore === 'number' ? centralEvalScore : (typeof deptEvalScore === 'number' ? deptEvalScore : undefined);
        if (scoreToConsider !== undefined) {
            stats.totalScore += scoreToConsider;
            stats.scoreCount++;
        }
      }
    });
    
    const departmentWiseArray = Array.from(departmentStatsMap.values()).map(deptStat => ({
        departmentId: deptStat.departmentId,
        name: deptStat.name,
        code: deptStat.code,
        totalProjects: deptStat.total,
        evaluatedProjects: deptStat.evaluated,
        averageScore: deptStat.scoreCount > 0 ? parseFloat((deptStat.totalScore / deptStat.scoreCount).toFixed(2)) : 0,
    }));

    const overallTotal = relevantProjects.length;
    const overallEvaluated = relevantProjects.filter((p: any) => (p.deptEvaluation?.completed && typeof p.deptEvaluation.score === 'number') || (p.centralEvaluation?.completed && typeof p.centralEvaluation.score === 'number')).length;
    const overallPending = overallTotal - overallEvaluated;
    
    let sumOfScores = 0;
    let countOfScoredProjects = 0;
    relevantProjects.forEach((p: any) => {
        const scoreToConsider = typeof p.centralEvaluation?.score === 'number' ? p.centralEvaluation.score : (typeof p.deptEvaluation?.score === 'number' ? p.deptEvaluation.score : undefined);
        if (scoreToConsider !== undefined) {
            sumOfScores += scoreToConsider;
            countOfScoredProjects++;
        }
    });
    const overallAverageScore = countOfScoredProjects > 0 ? parseFloat((sumOfScores / countOfScoredProjects).toFixed(2)) : 0;

    const responseData = {
      total: overallTotal,
      evaluated: overallEvaluated,
      pending: overallPending,
      averageScore: overallAverageScore,
      departmentWise: departmentWiseArray.reduce((acc: any, curr) => {
        acc[curr.name] = { 
            total: curr.totalProjects,
            evaluated: curr.evaluatedProjects,
            averageScore: curr.averageScore
        };
        return acc;
      }, {}),
    };

    return NextResponse.json({ status: 'success', data: responseData });

  } catch (error) {
    console.error("Error fetching project statistics:", error);
    return NextResponse.json({ message: "Error fetching project statistics", error: (error as Error).message }, { status: 500 });
  }
}