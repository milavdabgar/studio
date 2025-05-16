
import { NextResponse, type NextRequest } from 'next/server';
import type { Student, Program, Batch, Institute } from '@/types/entities';

// Assume these global stores are populated as in other API routes
declare global {
  // eslint-disable-next-line no-var
  var __API_STUDENTS_STORE__: Student[] | undefined;
  // eslint-disable-next-line no-var
  var __API_PROGRAMS_STORE__: Program[] | undefined;
  // eslint-disable-next-line no-var
  var __API_BATCHES_STORE__: Batch[] | undefined;
  // eslint-disable-next-line no-var
  var __API_INSTITUTES_STORE__: Institute[] | undefined;
}

const ensureStore = (storeName: string, defaultData: any[] = []) => {
  if (!global[storeName as keyof typeof global] || !Array.isArray(global[storeName as keyof typeof global])) {
    console.warn(`${storeName} API Store was not an array or undefined. Initializing.`);
    global[storeName as keyof typeof global] = [...defaultData] as any;
  }
};

ensureStore('__API_STUDENTS_STORE__');
ensureStore('__API_PROGRAMS_STORE__');
ensureStore('__API_BATCHES_STORE__');
ensureStore('__API_INSTITUTES_STORE__');


export async function GET(request: NextRequest) {
  try {
    const studentsStore: Student[] = global.__API_STUDENTS_STORE__!;
    const programsStore: Program[] = global.__API_PROGRAMS_STORE__!;
    const batchesStore: Batch[] = global.__API_BATCHES_STORE__!;
    const institutesStore: Institute[] = global.__API_INSTITUTES_STORE__!;

    const { searchParams } = new URL(request.url);
    const filterInstituteId = searchParams.get('instituteId');
    // const filterAcademicYear = searchParams.get('academicYear'); // Not directly used on student, would need to filter batches/programs first

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
