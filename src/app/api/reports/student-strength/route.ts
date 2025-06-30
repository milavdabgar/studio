
import { NextResponse, type NextRequest } from 'next/server';
import type { Student, Program, Batch, Institute } from '@/types/entities';
import { StudentModel, ProgramModel, BatchModel, InstituteModel } from '@/lib/models';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymanager');
    
    const { searchParams } = new URL(request.url);
    const filterInstituteId = searchParams.get('instituteId');

    // Fetch data from MongoDB
    const studentsStore = await StudentModel.find({}).lean() as any[] as Student[];
    const programsStore = await ProgramModel.find({}).lean() as any[] as Program[];
    const batchesStore = await BatchModel.find({}).lean() as any[] as Batch[];
    const institutesStore = await InstituteModel.find({}).lean() as any[] as Institute[];

    const reportData: {
      byInstitute: Array<{
        instituteId: string;
        instituteName: string;
        instituteCode: string;
        totalStudents: number;
        programs: Array<{
          programId: string;
          programName: string;
          programCode: string;
          totalStudents: number;
          batches: Array<{
            batchId: string;
            batchName: string;
            totalStudents: number;
            semesters: Array<{
              semester: number;
              totalStudents: number;
            }>;
          }>;
        }>;
      }>;
      overallTotal: number;
    } = {
      byInstitute: [],
      overallTotal: 0,
    };

    let institutesToProcess = institutesStore;
    if (filterInstituteId) {
        institutesToProcess = institutesStore.filter(inst => inst.id === filterInstituteId);
    }

    institutesToProcess.forEach(institute => {
      const institutePrograms = programsStore.filter(p => p.instituteId === institute.id);
      const instituteData = {
        instituteId: institute.id,
        instituteName: institute.name,
        instituteCode: institute.code,
        totalStudents: 0,
        programs: [] as any[],
      };

      institutePrograms.forEach(program => {
        const programBatches = batchesStore.filter(b => b.programId === program.id);
        const programData = {
          programId: program.id,
          programName: program.name,
          programCode: program.code,
          totalStudents: 0,
          batches: [] as any[],
        };

        programBatches.forEach(batch => {
          const studentsInBatch = studentsStore.filter(s => s.batchId === batch.id && s.programId === program.id);
          const batchData = {
            batchId: batch.id,
            batchName: batch.name,
            totalStudents: studentsInBatch.length,
            semesters: [] as any[],
          };

          const studentsBySemester = studentsInBatch.reduce((acc, student) => {
            const sem = student.currentSemester;
            acc[sem] = (acc[sem] || 0) + 1;
            return acc;
          }, {} as Record<number, number>);

          Object.entries(studentsBySemester).forEach(([sem, count]) => {
            batchData.semesters.push({ semester: parseInt(sem), totalStudents: count });
          });
          batchData.semesters.sort((a,b) => a.semester - b.semester);

          programData.batches.push(batchData);
          programData.totalStudents += studentsInBatch.length;
        });

        instituteData.programs.push(programData);
        instituteData.totalStudents += programData.totalStudents;
      });
      reportData.byInstitute.push(instituteData);
      reportData.overallTotal += instituteData.totalStudents;
    });

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error generating student strength report:", error);
    return NextResponse.json({ message: "Error generating student strength report", error: (error as Error).message }, { status: 500 });
  }
}
