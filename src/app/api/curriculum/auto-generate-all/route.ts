import { NextResponse } from 'next/server';
import type { Course, Program, Curriculum } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { CurriculumModel, CourseModel, ProgramModel } from '@/lib/models';

const generateId = (): string => `curr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

interface CurriculumGenerationRule {
  academicYear: string;
  versionName: string;
  semesterRules: Record<number, {
    useNewSyllabus: boolean; // True for DI*, false for old codes
    effectiveFromPattern: string; // Pattern to match effective dates
  }>;
}

export async function POST() {
  try {
    await connectMongoose();
    
    // Get all programs and courses
    const [allPrograms, allCourses] = await Promise.all([
      ProgramModel.find({}).lean(),
      CourseModel.find({}).lean()
    ]);

    // Filter for diploma programs - check both degreeType and name patterns
    const programs = allPrograms.filter(program => 
      program.degreeType === 'Diploma' || 
      program.name?.toLowerCase().includes('diploma') ||
      program.code?.toLowerCase().includes('d')
    );

    console.log(`Found ${allPrograms.length} total programs, ${programs.length} diploma programs`);
    console.log('Diploma programs:', programs.map(p => ({ name: p.name, code: p.code, degreeType: p.degreeType })));

    if (programs.length === 0) {
      return NextResponse.json({ 
        message: 'No diploma programs found.',
        debug: {
          totalPrograms: allPrograms.length,
          samplePrograms: allPrograms.slice(0, 3).map(p => ({ name: p.name, code: p.code, degreeType: p.degreeType }))
        }
      }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    const currentAcademicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
    
    // Define curriculum generation rules for different batches
    const curriculumRules: CurriculumGenerationRule[] = [
      {
        academicYear: currentAcademicYear,
        versionName: `${currentAcademicYear}-New`,
        semesterRules: {
          1: { useNewSyllabus: true, effectiveFromPattern: '2024-25|2025-26' },
          2: { useNewSyllabus: true, effectiveFromPattern: '2024-25|2025-26' },
          3: { useNewSyllabus: true, effectiveFromPattern: '2024-25|2025-26' },
          4: { useNewSyllabus: false, effectiveFromPattern: '2011-12|2012-13|2013-14|2021-22|2022-23|2023-24' },
          5: { useNewSyllabus: false, effectiveFromPattern: '2011-12|2012-13|2013-14|2021-22|2022-23|2023-24' },
          6: { useNewSyllabus: false, effectiveFromPattern: '2011-12|2012-13|2013-14|2021-22|2022-23|2023-24' }
        }
      },
      {
        academicYear: `${currentYear + 1}-${(currentYear + 2).toString().slice(-2)}`,
        versionName: `${currentYear + 1}-${(currentYear + 2).toString().slice(-2)}-Transition`,
        semesterRules: {
          1: { useNewSyllabus: true, effectiveFromPattern: '2024-25|2025-26' },
          2: { useNewSyllabus: true, effectiveFromPattern: '2024-25|2025-26' },
          3: { useNewSyllabus: true, effectiveFromPattern: '2024-25|2025-26' },
          4: { useNewSyllabus: true, effectiveFromPattern: '2024-25|2025-26' }, // Transition starts
          5: { useNewSyllabus: false, effectiveFromPattern: '2011-12|2012-13|2013-14|2021-22|2022-23|2023-24' },
          6: { useNewSyllabus: false, effectiveFromPattern: '2011-12|2012-13|2013-14|2021-22|2022-23|2023-24' }
        }
      },
      {
        academicYear: `${currentYear + 2}-${(currentYear + 3).toString().slice(-2)}`,
        versionName: `${currentYear + 2}-${(currentYear + 3).toString().slice(-2)}-Full-New`,
        semesterRules: {
          1: { useNewSyllabus: true, effectiveFromPattern: '2024-25|2025-26' },
          2: { useNewSyllabus: true, effectiveFromPattern: '2024-25|2025-26' },
          3: { useNewSyllabus: true, effectiveFromPattern: '2024-25|2025-26' },
          4: { useNewSyllabus: true, effectiveFromPattern: '2024-25|2025-26' },
          5: { useNewSyllabus: true, effectiveFromPattern: '2024-25|2025-26' },
          6: { useNewSyllabus: true, effectiveFromPattern: '2024-25|2025-26' }
        }
      }
    ];

    const generatedCurricula: Curriculum[] = [];
    let totalGenerated = 0;
    let totalReplaced = 0;
    
    for (const program of programs) {
      // Get courses for this program - use _id since that's what programId references
      const programCourses = allCourses.filter(course => course.programId === (program.id || program._id?.toString()));
      
      console.log(`Program: ${program.name} (${program.id})`);
      console.log(`- Total courses found: ${programCourses.length}`);
      console.log(`- DI courses: ${programCourses.filter(c => c.subcode.startsWith('DI')).length}`);
      console.log(`- Non-DI courses: ${programCourses.filter(c => !c.subcode.startsWith('DI')).length}`);
      console.log(`- Sample courses:`, programCourses.slice(0, 3).map(c => ({ subcode: c.subcode, semester: c.semester, effFrom: c.effFrom })));
      
      if (programCourses.length === 0) {
        console.log(`No courses found for program: ${program.name}`);
        continue;
      }

      for (const rule of curriculumRules) {
        const curriculumCourses: Curriculum['courses'] = [];
        
        // Process each semester according to the rule
        for (let semester = 1; semester <= 6; semester++) {
          const semesterRule = rule.semesterRules[semester];
          if (!semesterRule) continue;
          
          let semesterCourses: Course[];
          
          if (semesterRule.useNewSyllabus) {
            // Use DI* courses with matching effective dates
            semesterCourses = programCourses.filter(course => 
              course.semester === semester &&
              course.subcode.startsWith('DI') &&
              new RegExp(semesterRule.effectiveFromPattern).test(course.effFrom || '')
            );
          } else {
            // Use old curriculum courses (non-DI)
            semesterCourses = programCourses.filter(course => 
              course.semester === semester &&
              !course.subcode.startsWith('DI') &&
              new RegExp(semesterRule.effectiveFromPattern).test(course.effFrom || '')
            );
          }
          
          // Add courses to curriculum
          semesterCourses.forEach(course => {
            curriculumCourses.push({
              courseId: course.id,
              semester: course.semester,
              isElective: course.isElective,
              isActive: true
            });
          });
        }
        
        console.log(`\nCurriculum: ${program.name} - ${rule.versionName}`);
        console.log(`Total courses found: ${curriculumCourses.length}`);
        
        if (curriculumCourses.length === 0) {
          console.log(`No courses found for ${program.name} - ${rule.versionName}`);
          continue;
        }
        
        // Check if curriculum already exists
        const existingCurriculum = await CurriculumModel.findOne({
          programId: program.id || program._id?.toString(),
          version: rule.versionName
        });
        
        if (existingCurriculum) {
          // Replace if it's auto-generated
          if (existingCurriculum.isAutoGenerated) {
            await CurriculumModel.deleteOne({ _id: existingCurriculum._id });
            totalReplaced++;
          } else {
            console.log(`Skipping manual curriculum: ${program.name} - ${rule.versionName}`);
            continue;
          }
        }
        
        // Create new curriculum
        const curriculumData = {
          id: generateId(),
          programId: program.id || program._id?.toString(),
          version: rule.versionName,
          effectiveDate: `${rule.academicYear.split('-')[0]}-07-01`, // July 1st of academic year
          courses: curriculumCourses,
          status: 'draft' as const,
          isAutoGenerated: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const newCurriculum = new CurriculumModel(curriculumData);
        await newCurriculum.save();
        
        generatedCurricula.push(curriculumData);
        totalGenerated++;
        
        console.log(`Generated curriculum: ${program.name} - ${rule.versionName} (${curriculumCourses.length} courses)`);
      }
    }
    
    return NextResponse.json({
      message: `Smart curriculum generation completed successfully!`,
      summary: {
        totalCurriculaGenerated: totalGenerated,
        totalCurriculaReplaced: totalReplaced,
        programsProcessed: programs.length,
        curriculumRulesApplied: curriculumRules.length
      },
      details: {
        curriculumRules: curriculumRules.map(rule => ({
          academicYear: rule.academicYear,
          versionName: rule.versionName,
          description: generateRuleDescription(rule)
        })),
        generatedCurricula: generatedCurricula.map(curr => ({
          programId: curr.programId,
          version: curr.version,
          courseCount: curr.courses.length,
          effectiveDate: curr.effectiveDate
        }))
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error in smart curriculum generation:', error);
    return NextResponse.json({ 
      message: 'Error generating curricula automatically',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateRuleDescription(rule: CurriculumGenerationRule): string {
  const newSems = Object.entries(rule.semesterRules)
    .filter(([_, semRule]) => semRule.useNewSyllabus)
    .map(([sem]) => sem);
  const oldSems = Object.entries(rule.semesterRules)
    .filter(([_, semRule]) => !semRule.useNewSyllabus)
    .map(([sem]) => sem);
  
  if (oldSems.length === 0) {
    return `Full new curriculum (DI* courses for all semesters)`;
  } else if (newSems.length === 0) {
    return `Full old curriculum (legacy courses for all semesters)`;
  } else {
    return `Hybrid: New curriculum for semesters ${newSems.join(', ')}, old curriculum for semesters ${oldSems.join(', ')}`;
  }
}