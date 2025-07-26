import { connectMongoose, disconnectMongoDB } from '@/lib/mongodb';
import { CourseModel, DepartmentModel, ProgramModel } from '@/lib/models';
import { GTU_SUBJECT_MAPPINGS, getGTUSubjectDetails } from './gtu-subject-mapping';
import * as fs from 'fs';
import * as path from 'path';

// Enhanced branch mapping with department info
const BRANCH_MAPPING = {
  '06': { code: 'CE', name: 'Civil Engineering', deptId: 'dept_ce_gpp', progId: 'prog_dce_gpp' },
  '09': { code: 'EE', name: 'Electrical Engineering', deptId: 'dept_ee_gpp', progId: 'prog_dee_gpp' },
  '11': { code: 'EC', name: 'Electronics & Communication', deptId: 'dept_ec_gpp', progId: 'prog_dec_gpp' },
  '16': { code: 'IT', name: 'Information Technology', deptId: 'dept_it_gpp', progId: 'prog_dit_gpp' },
  '19': { code: 'ME', name: 'Mechanical Engineering', deptId: 'dept_me_gpp', progId: 'prog_dme_gpp' },
  '32': { code: 'CS', name: 'Computer Engineering', deptId: 'dept_cs_gpp', progId: 'prog_dcs_gpp' }
};

function generateCourseId(): string {
  return `crs_gtu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function extractSubjectCodeFromUrl(url: string): string {
  const match = url.match(/([A-Z]{2}\d{8})\.pdf$/);
  return match ? match[1] : '';
}

async function ensureDepartmentsAndPrograms() {
  console.log('🏢 Ensuring departments and programs exist...');
  
  for (const [branchCode, info] of Object.entries(BRANCH_MAPPING)) {
    // Find or create department
    let department = await DepartmentModel.findOne({ 
      $or: [{ code: info.code }, { id: info.deptId }] 
    });
    
    if (!department) {
      department = await DepartmentModel.create({
        id: info.deptId,
        name: info.name,
        code: info.code,
        instituteId: 'inst1',
        status: 'active',
        establishmentYear: 1984,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log(`  ✅ Created department: ${info.name} (${info.code})`);
    }
    
    // Find or create program
    let program = await ProgramModel.findOne({ 
      $or: [{ code: branchCode }, { id: info.progId }] 
    });
    
    if (!program) {
      program = await ProgramModel.create({
        id: info.progId,
        name: `Diploma in ${info.name}`,
        code: branchCode,
        description: `3-year diploma program in ${info.name}`,
        departmentId: department.id,
        instituteId: 'inst1',
        degreeType: 'Diploma',
        durationYears: 3,
        totalSemesters: 6,
        totalCredits: 180,
        curriculumVersion: '2024-25',
        status: 'active',
        admissionCapacity: 60,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log(`  ✅ Created program: ${program.name} (${branchCode})`);
    }
  }
}

async function seedComprehensiveGTUCourses(): Promise<void> {
  try {
    console.log('🌱 Starting comprehensive GTU course seeding with proper names and PDF URLs...');
    
    // Connect to MongoDB
    await connectMongoose();
    console.log('✅ Connected to MongoDB');
    
    // Ensure departments and programs exist
    await ensureDepartmentsAndPrograms();
    
    // Clear existing courses
    console.log('🧹 Clearing existing course data...');
    await CourseModel.deleteMany({});
    
    // Load latest comprehensive data
    const jsonFile = path.join(process.cwd(), 'gtu_diploma_comprehensive_20250726_232434.json');
    console.log(`📚 Loading data from ${jsonFile}...`);
    
    const rawData = fs.readFileSync(jsonFile, 'utf-8');
    const gtuData: any[] = JSON.parse(rawData);
    
    console.log(`Found ${gtuData.length} course entries in GTU data`);
    
    let totalProcessed = 0;
    let newCoursesAdded = 0;
    const processedSubjects = new Set<string>();
    const subjectToPDFMap = new Map<string, string>(); // Map subject codes to PDF URLs
    
    // First pass: Build PDF URL mapping
    console.log('🔗 Building PDF URL mapping...');
    for (const entry of gtuData) {
      if (entry.pdf_links && entry.pdf_links.length > 0) {
        for (const pdfLink of entry.pdf_links) {
          const subcode = extractSubjectCodeFromUrl(pdfLink.url);
          if (subcode) {
            subjectToPDFMap.set(subcode, pdfLink.url);
          }
        }
      }
    }
    console.log(`📄 Found ${subjectToPDFMap.size} PDF links mapped to subject codes`);
    
    // Second pass: Create courses with proper data
    for (const entry of gtuData) {
      const branchCode = entry.branch_code;
      const semester = parseInt(entry.semester);
      const academicYear = entry.academic_year;
      
      // Skip if not our target branches or invalid data
      if (!Object.keys(BRANCH_MAPPING).includes(branchCode) || 
          isNaN(semester) || semester < 1 || semester > 6 ||
          academicYear !== '2024-25') {
        continue;
      }
      
      const branchInfo = BRANCH_MAPPING[branchCode as keyof typeof BRANCH_MAPPING];
      
      console.log(`📖 Processing ${entry.branch_name} Semester ${semester}...`);
      
      // Process PDF links to extract subject codes and create courses
      if (entry.pdf_links && entry.pdf_links.length > 0) {
        for (const pdfLink of entry.pdf_links) {
          const subcode = extractSubjectCodeFromUrl(pdfLink.url);
          
          if (!subcode || processedSubjects.has(`${subcode}_${branchCode}_${semester}`)) {
            continue;
          }
          
          processedSubjects.add(`${subcode}_${branchCode}_${semester}`);
          
          // Check if course already exists
          const existingCourse = await CourseModel.findOne({
            subcode: subcode,
            programId: branchInfo.progId,
            semester: semester
          });
          
          if (existingCourse) {
            console.log(`    ⚠️ Course already exists: ${subcode}`);
            continue;
          }
          
          // Get proper subject details from comprehensive mapping
          const subjectDetails = getGTUSubjectDetails(subcode, branchCode, semester);
          
          // Calculate credits and marks
          const credits = subjectDetails.lectureHours + subjectDetails.tutorialHours + subjectDetails.practicalHours;
          const theoryMarks = subjectDetails.isTheory ? 70 : 0;
          const practicalMarks = subjectDetails.practicalHours > 0 ? 30 : 0;
          const totalMarks = Math.max(100, theoryMarks + practicalMarks);
          
          // Create new course with comprehensive data
          const courseData = {
            id: generateCourseId(),
            subcode,
            subjectName: subjectDetails.name,
            category: subjectDetails.category,
            syllabusUrl: pdfLink.url, // Store the PDF URL
            departmentId: branchInfo.deptId,
            programId: branchInfo.progId,
            semester: semester,
            branchCode: branchCode,
            effFrom: academicYear,
            lectureHours: subjectDetails.lectureHours,
            tutorialHours: subjectDetails.tutorialHours,
            practicalHours: subjectDetails.practicalHours,
            credits: credits || 3,
            theoryEseMarks: theoryMarks,
            theoryPaMarks: subjectDetails.isTheory ? 30 : 0,
            practicalEseMarks: practicalMarks,
            practicalPaMarks: subjectDetails.practicalHours > 0 ? 20 : 0,
            totalMarks,
            isElective: subjectDetails.category.includes('Elective'),
            isTheory: subjectDetails.isTheory,
            isPractical: subjectDetails.practicalHours > 0,
            isFunctional: true,
            theoryExamDuration: subjectDetails.isTheory ? '3 Hrs' : '',
            practicalExamDuration: subjectDetails.practicalHours > 0 ? '2 Hrs' : '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await CourseModel.create(courseData);
          newCoursesAdded++;
          
          console.log(`    ✅ Added: ${subcode} - ${subjectDetails.name} (${subjectDetails.category}) [PDF: ✓]`);
        }
      }
      
      // If no PDF links but has subjects, create courses based on known patterns
      if ((!entry.pdf_links || entry.pdf_links.length === 0) && entry.total_subjects > 0) {
        console.log(`    📝 Creating subjects for Semester ${semester} (${entry.total_subjects} expected)`);
        
        // Generate subject codes based on common GTU patterns
        const commonSubjects = getCommonSubjectsForSemester(semester, branchCode);
        
        for (const subjectInfo of commonSubjects) {
          const subcode = subjectInfo.code;
          
          if (processedSubjects.has(`${subcode}_${branchCode}_${semester}`)) {
            continue;
          }
          
          processedSubjects.add(`${subcode}_${branchCode}_${semester}`);
          
          // Check if course already exists
          const existingCourse = await CourseModel.findOne({
            subcode: subcode,
            programId: branchInfo.progId,
            semester: semester
          });
          
          if (existingCourse) {
            continue;
          }
          
          // Get subject details
          const subjectDetails = getGTUSubjectDetails(subcode, branchCode, semester);
          const credits = subjectDetails.lectureHours + subjectDetails.tutorialHours + subjectDetails.practicalHours;
          
          const courseData = {
            id: generateCourseId(),
            subcode,
            subjectName: subjectDetails.name,
            category: subjectDetails.category,
            syllabusUrl: subjectToPDFMap.get(subcode) || undefined, // Add PDF URL if available
            departmentId: branchInfo.deptId,
            programId: branchInfo.progId,
            semester: semester,
            branchCode: branchCode,
            effFrom: academicYear,
            lectureHours: subjectDetails.lectureHours,
            tutorialHours: subjectDetails.tutorialHours,
            practicalHours: subjectDetails.practicalHours,
            credits: credits || 3,
            theoryEseMarks: subjectDetails.isTheory ? 70 : 0,
            theoryPaMarks: subjectDetails.isTheory ? 30 : 0,
            practicalEseMarks: subjectDetails.practicalHours > 0 ? 30 : 0,
            practicalPaMarks: subjectDetails.practicalHours > 0 ? 20 : 0,
            totalMarks: 100,
            isElective: false,
            isTheory: subjectDetails.isTheory,
            isPractical: subjectDetails.practicalHours > 0,
            isFunctional: true,
            theoryExamDuration: subjectDetails.isTheory ? '3 Hrs' : '',
            practicalExamDuration: subjectDetails.practicalHours > 0 ? '2 Hrs' : '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await CourseModel.create(courseData);
          newCoursesAdded++;
          
          const pdfStatus = subjectToPDFMap.has(subcode) ? '[PDF: ✓]' : '[PDF: ✗]';
          console.log(`    ✅ Added: ${subcode} - ${subjectDetails.name} (${subjectDetails.category}) ${pdfStatus}`);
        }
      }
      
      totalProcessed++;
    }
    
    // Final statistics
    console.log('🎉 Comprehensive GTU course seeding completed with proper names and PDFs!');
    console.log(`📊 Summary:`);
    console.log(`  - Total entries processed: ${totalProcessed}`);
    console.log(`  - New courses added: ${newCoursesAdded}`);
    console.log(`  - PDF URLs mapped: ${subjectToPDFMap.size}`);
    
    // Verify final database state
    const totalCourses = await CourseModel.countDocuments();
    const coursesWithPDF = await CourseModel.countDocuments({ syllabusUrl: { $exists: true, $ne: null } });
    const coursesByBranch = await CourseModel.aggregate([
      { $group: { _id: { branchCode: '$branchCode', semester: '$semester' }, count: { $sum: 1 }, withPDF: { $sum: { $cond: [{ $ne: ['$syllabusUrl', null] }, 1, 0] } } } },
      { $sort: { '_id.branchCode': 1, '_id.semester': 1 } }
    ]);
    
    console.log(`📚 Total courses in database: ${totalCourses}`);
    console.log(`🔗 Courses with PDF URLs: ${coursesWithPDF}`);
    console.log(`📊 Courses by branch and semester:`);
    for (const branch of coursesByBranch) {
      const branchInfo = BRANCH_MAPPING[branch._id.branchCode as keyof typeof BRANCH_MAPPING];
      const branchName = branchInfo ? `${branchInfo.name} (${branch._id.branchCode})` : branch._id.branchCode;
      console.log(`  - ${branchName} Sem ${branch._id.semester}: ${branch.count} courses (${branch.withPDF} with PDFs)`);
    }
    
    // Show sample subjects with proper names
    console.log('\n🎯 Sample subjects with proper names:');
    const sampleCourses = await CourseModel.find({}).limit(10).select('subcode subjectName category syllabusUrl');
    for (const course of sampleCourses) {
      const pdfStatus = course.syllabusUrl ? '✓' : '✗';
      console.log(`  ${course.subcode} - ${course.subjectName} (${course.category}) [PDF: ${pdfStatus}]`);
    }
    
  } catch (error) {
    console.error('❌ Error seeding comprehensive GTU data:', error);
    throw error;
  } finally {
    await disconnectMongoDB();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Helper function to get common subjects for each semester
function getCommonSubjectsForSemester(semester: number, branchCode: string): Array<{code: string}> {
  const commonSubjects: Record<number, Array<{code: string}>> = {
    1: [
      { code: 'DI01000011' }, // Applied Mathematics - I
      { code: 'DI01000021' }, // Applied Physics - I  
      { code: 'DI01000031' }, // Applied Chemistry
      { code: 'DI01000041' }, // Communication Skills in English
      { code: 'DI01000111' }, // Engineering Graphics
      { code: 'DI01000121' }, // Workshop Practice
    ],
    2: [
      { code: 'DI02000011' }, // Applied Mathematics - III
      { code: 'DI02000021' }, // Applied Physics - II
      { code: 'DI02000051' }, // Basic Civil Engineering
      { code: 'DI02000061' }, // Basic Mechanical Engineering
      { code: 'DI02000131' }, // Gujarati
      { code: 'DI02000141' }, // Principles of Economics
    ],
    3: [
      { code: 'DI03000111' }, // Network Analysis (for EC/CS)
      { code: 'DI03000121' }, // Electromagnetics
      { code: 'DI03000131' }, // Digital Electronics
    ]
  };
  
  // Add branch-specific subjects
  const branchSpecific: Record<string, Record<number, Array<{code: string}>>> = {
    '06': { // Civil Engineering
      1: [{ code: 'DI01006011' }, { code: 'DI01006021' }],
      3: [{ code: 'DI03006011' }, { code: 'DI03006021' }, { code: 'DI03006031' }]
    },
    '16': { // Information Technology
      1: [{ code: 'DI01016011' }, { code: 'DI01016021' }, { code: 'DI01016031' }],
      3: [{ code: 'DI03016011' }, { code: 'DI03016021' }, { code: 'DI03016031' }]
    },
    '32': { // Computer Engineering
      1: [{ code: 'DI01032011' }],
      3: [{ code: 'DI03032011' }, { code: 'DI03032021' }, { code: 'DI03032031' }]
    }
  };
  
  const subjects = commonSubjects[semester] || [];
  const branchSubjects = branchSpecific[branchCode]?.[semester] || [];
  
  return [...subjects, ...branchSubjects];
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedComprehensiveGTUCourses()
    .then(() => {
      console.log('Comprehensive GTU course seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Comprehensive GTU course seeding failed:', error);
      process.exit(1);
    });
}

export { seedComprehensiveGTUCourses };