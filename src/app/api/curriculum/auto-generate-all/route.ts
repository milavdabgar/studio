import { NextResponse } from 'next/server';
import type { Course, Program, Curriculum } from '@/types/entities';
import { connectMongoose } from '@/lib/mongodb';
import { CurriculumModel, CourseModel, ProgramModel } from '@/lib/models';

const generateId = (): string => `curr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

interface CurriculumGenerationRule {
  studentCategory: 'Regular' | 'C2D' | 'Legacy'; // Student category 
  versionName: string;
  effectiveDateRanges: string[]; // Multiple effective dates for progressive rollout
  subjectCodePattern: string; // Regex pattern for subject codes
  description: string;
  status: 'active' | 'archived'; // Status of the curriculum
  semesterMapping?: Record<number, string>; // Optional: which effective date for which semester
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

    // Define curriculum generation rules with progressive rollout logic
    const curriculumRules: CurriculumGenerationRule[] = [
      {
        studentCategory: 'Regular',
        versionName: '5G',
        effectiveDateRanges: ['2024-25', '2025-26', '2026-27'], // Progressive rollout
        subjectCodePattern: '^DI\\d{2}0\\d{5}$', // DI01000021 pattern (no C)
        description: '5th Generation curriculum for regular students (DI01000xxx, DI02000xxx, DI03000xxx patterns)',
        status: 'active',
        semesterMapping: {
          1: '2024-25', 2: '2024-25', // Sem 1-2 rolled out in 2024-25
          3: '2025-26', 4: '2025-26', // Sem 3-4 rolled out in 2025-26  
          5: '2026-27', 6: '2026-27'  // Sem 5-6 will roll out in 2026-27
        }
      },
      {
        studentCategory: 'C2D',
        versionName: '5G-C2D',
        effectiveDateRanges: ['2025-26', '2026-27'], // C2D starts later
        subjectCodePattern: '^DI\\d{2}C\\d{5}$', // DI01C00021 pattern (with C)
        description: '5th Generation curriculum for C2D students - ITI to Diploma (DI01C00xxx, DI02C00xxx patterns)',
        status: 'active',
        semesterMapping: {
          1: '2025-26', 2: '2025-26', // C2D Sem 1-2 in 2025-26
          3: '2026-27', 4: '2026-27', // C2D Sem 3-4 in 2026-27
          5: '2027-28', 6: '2027-28'  // C2D Sem 5-6 in 2027-28
        }
      },
      {
        studentCategory: 'Regular',
        versionName: '4G',
        effectiveDateRanges: ['2021-22', '2022-23', '2023-24'], // COGC progressive rollout
        subjectCodePattern: '^4\\d{6}$', // 4th generation: 4361930 (prefix with 4)
        description: '4th Generation (COGC-2021) curriculum for regular students - subject codes prefixed with 4 like 4361930',
        status: 'active',
        semesterMapping: {
          1: '2021-22', 2: '2021-22', // Sem 1-2 rolled out in 2021-22
          3: '2022-23', 4: '2022-23', // Sem 3-4 rolled out in 2022-23
          5: '2023-24', 6: '2023-24'  // Sem 5-6 rolled out in 2023-24
        }
      },
      {
        studentCategory: 'Regular',
        versionName: '4G-ICT',
        effectiveDateRanges: ['2022-23', '2023-24', '2024-25', '2025-26'], // ICT delayed rollout (one year later)
        subjectCodePattern: '^(13\\d{5}|4\\d{6})$', // ICT uses both 13xxxxx and 4xxxxxx patterns
        description: '4th Generation (COGC-2021) curriculum for ICT students - delayed rollout with subject codes 13xxxxx and 4xxxxxx',
        status: 'active',
        semesterMapping: {
          1: '2022-23', 2: '2022-23', // Sem 1-2 rolled out in 2022-23 (one year later)
          3: '2023-24', 4: '2023-24', // Sem 3-4 rolled out in 2023-24 (one year later)  
          5: '2024-25', 6: '2025-26'  // Sem 5 in 2024-25, Sem 6 in 2025-26
        }
      },
      {
        studentCategory: 'C2D',
        versionName: '4G-C2D',
        effectiveDateRanges: ['2022-23'], // C2D COGC started later
        subjectCodePattern: '^C4\\d{6}$', // C4361930 patterns (C prefix + 4)
        description: '4th Generation (COGC-2021) curriculum for C2D students - subject codes like C4361930',
        status: 'active',
        semesterMapping: {
          1: '2022-23', 2: '2022-23' // C2D Sem 1-2 in 2022-23
        }
      },
      {
        studentCategory: 'Legacy',
        versionName: '1G',
        effectiveDateRanges: ['2011-12'],
        subjectCodePattern: '^[0-9]{6}$', // 1st generation: 361930 (6 digits, no prefix)
        description: '1st Generation curriculum (2011-12) - 6-digit subject codes like 361930',
        status: 'archived'
      },
      {
        studentCategory: 'Legacy',
        versionName: '2G',
        effectiveDateRanges: ['2011-12'],
        subjectCodePattern: '^2[0-9]{6}$', // 2nd generation: 2361930 (prefix with 2)
        description: '2nd Generation curriculum (2011-12) - subject codes prefixed with 2 like 2361930',
        status: 'archived'
      },
      {
        studentCategory: 'Legacy',
        versionName: '3G',
        effectiveDateRanges: ['2012-13'],
        subjectCodePattern: '^3[0-9]{6}$', // 3rd generation: 3361930 (prefix with 3)
        description: '3rd Generation curriculum (2012-13) - subject codes prefixed with 3 like 3361930',
        status: 'archived'
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
        // Check if this rule is ICT-specific and apply only to ICT programs
        const isICTRule = rule.versionName.includes('ICT');
        const isICTProgram = program.name?.toLowerCase().includes('information') && 
                            program.name?.toLowerCase().includes('communication') ||
                            program.name?.toLowerCase().includes('ict') ||
                            program.code?.toLowerCase().includes('ict');
        
        // Skip ICT-specific rules for non-ICT programs, and skip non-ICT 4G rules for ICT programs
        if (isICTRule && !isICTProgram) continue;
        if (!isICTRule && rule.versionName.includes('4G') && !rule.versionName.includes('ICT') && isICTProgram) continue;
        
        // Filter courses by subject code pattern first
        const patternMatchedCourses = programCourses.filter(course => 
          new RegExp(rule.subjectCodePattern).test(course.subcode)
        );
        
        // Then filter by effective date ranges, using semester mapping if available
        let ruleCourses;
        if (rule.semesterMapping) {
          // Use semester mapping to determine which courses should be included
          ruleCourses = patternMatchedCourses.filter(course => {
            const expectedEffFrom = rule.semesterMapping![course.semester];
            // Include course if its effFrom matches the expected effFrom for its semester
            return expectedEffFrom && course.effFrom === expectedEffFrom;
          });
        } else {
          // Fallback to original logic for rules without semester mapping
          ruleCourses = patternMatchedCourses.filter(course => 
            rule.effectiveDateRanges.includes(course.effFrom || '')
          );
        }
        
        console.log(`\nRule: ${rule.versionName} (${rule.studentCategory})`);
        console.log(`- Effective Date Ranges: ${rule.effectiveDateRanges.join(', ')}`);
        console.log(`- Pattern: ${rule.subjectCodePattern}`);
        console.log(`- Courses matching pattern: ${patternMatchedCourses.length}`);
        console.log(`- Final courses after filtering: ${ruleCourses.length}`);
        console.log(`- Sample matched courses:`, ruleCourses.slice(0, 5).map(c => ({ subcode: c.subcode, semester: c.semester, effFrom: c.effFrom })));
        
        // Group courses by semester for progressive curriculum
        if (rule.semesterMapping) {
          console.log(`- Semester mapping:`, rule.semesterMapping);
          const semesterBreakdown = ruleCourses.reduce((acc, course) => {
            const sem = course.semester;
            if (!acc[sem]) acc[sem] = [];
            acc[sem].push(course);
            return acc;
          }, {} as Record<number, typeof ruleCourses>);
          
          Object.entries(semesterBreakdown).forEach(([sem, courses]) => {
            const expectedEffFrom = rule.semesterMapping![parseInt(sem)];
            console.log(`  - Semester ${sem}: ${courses.length} courses (expected effFrom: ${expectedEffFrom})`);
          });
        }
        
        // Create curriculum courses from all matching courses
        const curriculumCourses: Curriculum['courses'] = ruleCourses.map(course => ({
          courseId: course.id,
          semester: course.semester,
          isElective: course.isElective,
          isActive: true
        }));
        
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
        const firstEffectiveYear = rule.effectiveDateRanges[0].split('-')[0];
        const curriculumData = {
          id: generateId(),
          programId: program.id || program._id?.toString(),
          version: rule.versionName,
          effectiveDate: `${firstEffectiveYear}-07-01`, // July 1st of first effective year
          courses: curriculumCourses,
          status: rule.status, // Use status from rule (active or archived)
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
          effectiveDateRanges: rule.effectiveDateRanges,
          studentCategory: rule.studentCategory,
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
  return rule.description;
}