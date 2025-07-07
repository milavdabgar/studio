
// src/app/api/projects/event/[eventId]/certificates/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Project, CertificateInfo, ProjectTeamMember } from '@/types/entities';
import mongoose from 'mongoose';
import { ProjectModel, ProjectEventModel, DepartmentModel, ProjectTeamModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');

    const { eventId  } = await params;
    const { searchParams } = new URL(request.url);
    const certificateType = searchParams.get('type') || 'participation';

    const event = await ProjectEventModel.findOne({ id: eventId });
    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    const eventProjects = await ProjectModel.find({ eventId });
    const certificates: CertificateInfo[] = [];

    if (certificateType === 'participation') {
      for (const project of eventProjects) {
        const team = await ProjectTeamModel.findOne({ id: project.teamId });
        const department = await DepartmentModel.findOne({ 
          id: typeof project.department === 'string' ? project.department : project.department
        });
        
        certificates.push({
          projectId: project.id,
          title: project.title,
          teamName: team?.name,
          teamMembers: team?.members.map((m: ProjectTeamMember) => m.name),
          departmentName: department?.name,
          certificateType: 'participation',
          eventName: event.name,
          eventDate: event.eventDate,
          downloadUrl: `/api/projects/certificates/download/${project.id}?type=participation` 
        });
      }
    } else if (certificateType === 'department-winner') {
      const departmentWinnersMap = new Map<string, Project[]>();
      eventProjects
          .filter(p => p.deptEvaluation?.completed && p.deptEvaluation.score !== undefined)
          .forEach(p => {
              const deptId = typeof p.department === 'string' ? p.department : p.department || 'unknown_dept';
              if (!departmentWinnersMap.has(deptId)) {
                  departmentWinnersMap.set(deptId, []);
              }
              departmentWinnersMap.get(deptId)?.push(p);
          });

      for (const [deptId, deptProjects] of departmentWinnersMap) {
          deptProjects.sort((a, b) => (b.deptEvaluation?.score || 0) - (a.deptEvaluation?.score || 0));
          for (const [index, project] of deptProjects.slice(0, 3).entries()) {
              const team = await ProjectTeamModel.findOne({ id: project.teamId });
              const department = await DepartmentModel.findOne({ 
                id: typeof project.department === 'string' ? project.department : project.department
              });
              
              certificates.push({
                  projectId: project.id,
                  title: project.title,
                  teamName: team?.name,
                  teamMembers: team?.members.map((m: ProjectTeamMember) => m.name),
                  departmentName: department?.name,
                  score: project.deptEvaluation?.score,
                  rank: index + 1,
                  certificateType: 'department-winner',
                  eventName: event.name,
                  eventDate: event.eventDate,
                  downloadUrl: `/api/projects/certificates/download/${project.id}?type=department-winner&rank=${index+1}`
              });
          }
      }

    } else if (certificateType === 'institute-winner') {
       const topProjects = eventProjects
          .filter(p => p.centralEvaluation?.completed && p.centralEvaluation.score !== undefined)
          .sort((a,b) => (b.centralEvaluation?.score || 0) - (a.centralEvaluation?.score || 0))
          .slice(0,3);
          
       for (const [index, project] of topProjects.entries()) {
          const team = await ProjectTeamModel.findOne({ id: project.teamId });
          const department = await DepartmentModel.findOne({ 
            id: typeof project.department === 'string' ? project.department : project.department
          });
          
           certificates.push({
              projectId: project.id,
              title: project.title,
              teamName: team?.name,
              teamMembers: team?.members.map((m: ProjectTeamMember) => m.name),
              departmentName: department?.name,
              score: project.centralEvaluation?.score,
              rank: index + 1,
              certificateType: 'institute-winner',
              eventName: event.name,
              eventDate: event.eventDate,
              downloadUrl: `/api/projects/certificates/download/${project.id}?type=institute-winner&rank=${index+1}`
          });
       }
    } else {
      return NextResponse.json({ message: 'Invalid certificate type' }, { status: 400 });
    }

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ message: 'Error fetching certificates', error: (error as Error).message }, { status: 500 });
  }
}
