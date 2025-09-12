import { NextRequest, NextResponse } from 'next/server';
import { resumeGenerator, type ResumeData } from '@/lib/services/resumeGenerator';
import { connectMongoose } from '@/lib/mongodb';
import { StudentModel, ProgramModel, BatchModel, CourseModel } from '@/lib/models';
import type { Student, Program, Batch, Course } from '@/types/entities';
import mongoose from 'mongoose';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Helper function to fetch program with multiple fallback strategies
async function fetchProgramWithFallbacks(programId: string): Promise<Program | null> {
  try {
    // Strategy 1: Try custom id field
    let program = await ProgramModel.findOne({ id: programId }).lean().exec() as unknown as Program | null;
    if (program) {
      console.log('Program found using custom id field:', program.name);
      return program;
    }

    // Strategy 2: Try MongoDB ObjectId if programId looks like one
    if (mongoose.Types.ObjectId.isValid(programId)) {
      program = await ProgramModel.findById(programId).lean().exec() as unknown as Program | null;
      if (program) {
        console.log('Program found using _id field:', program.name);
        return program;
      }
    }

    // Strategy 3: Try searching by program code
    program = await ProgramModel.findOne({ code: programId }).lean().exec() as unknown as Program | null;
    if (program) {
      console.log('Program found using code field:', program.name);
      return program;
    }

    console.log('Program not found with any strategy for programId:', programId);
    return null;
  } catch (error) {
    console.error('Error fetching program:', error);
    return null;
  }
}

// Helper function to fetch batch with multiple fallback strategies
async function fetchBatchWithFallbacks(batchId: string): Promise<Batch | null> {
  try {
    // Strategy 1: Try custom id field
    let batch = await BatchModel.findOne({ id: batchId }).lean().exec() as unknown as Batch | null;
    if (batch) {
      console.log('Batch found using custom id field:', batch.name);
      return batch;
    }

    // Strategy 2: Try MongoDB ObjectId if batchId looks like one
    if (mongoose.Types.ObjectId.isValid(batchId)) {
      batch = await BatchModel.findById(batchId).lean().exec() as unknown as Batch | null;
      if (batch) {
        console.log('Batch found using _id field:', batch.name);
        return batch;
      }
    }

    console.log('Batch not found with any strategy for batchId:', batchId);
    return null;
  } catch (error) {
    console.error('Error fetching batch:', error);
    return null;
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';
    const resolvedParams = await params;
    const studentId = resolvedParams.id;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Validate format
    const validFormats = ['pdf', 'pdf-latex', 'docx', 'html', 'txt', 'biodata', 'resume', 'cv', 'biodata-html', 'resume-html', 'cv-html', 'latex', 'biodata-latex', 'resume-latex', 'cv-latex'];
    if (!validFormats.includes(format)) {
      return NextResponse.json({ 
        error: `Invalid format. Supported formats: ${validFormats.join(', ')}` 
      }, { status: 400 });
    }

    // Connect to database
    await connectMongoose();

    // Fetch student data directly from database
    const student = await StudentModel.findOne({ id: studentId }).lean() as Student | null;

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch related data directly from database
    console.log('Fetching program for student:', { 
      studentId: student.id, 
      programId: student.programId,
      batchId: student.batchId 
    });
    
    const [program, batch, courses] = await Promise.all([
      student.programId ? fetchProgramWithFallbacks(student.programId) : Promise.resolve(null),
      student.batchId ? fetchBatchWithFallbacks(student.batchId) : Promise.resolve(null),
      CourseModel.find({}).lean().exec() as unknown as Promise<Course[]>
    ]);
    
    console.log('Database query results:', {
      programFound: !!program,
      programName: program?.name || 'Not found',
      batchFound: !!batch,
      batchName: batch?.name || 'Not found',
      coursesCount: courses.length
    });

    // Fetch student results (skip for now to avoid complexity)
    let results: any[] = [];
    // Note: Results would need proper database model and querying

    // Generate resume data
    const resumeData = resumeGenerator.generateResumeData(
      student,
      program || undefined,
      batch || undefined,
      results,
      courses
    );

    // Generate resume in requested format
    let content: Buffer | string;
    let contentType: string;
    let filename: string;

    const baseFilename = `${student.firstName || 'Student'}_${student.lastName || 'Resume'}_${student.enrollmentNumber}`;

    switch (format) {
      case 'pdf':
        content = await resumeGenerator.generatePDF(resumeData);
        contentType = 'application/pdf';
        filename = `${baseFilename}.pdf`;
        break;

      case 'pdf-latex':
        content = await resumeGenerator.generatePDFPandoc(resumeData);
        contentType = 'application/pdf';
        filename = `${baseFilename}_latex.pdf`;
        break;

      case 'docx':
        content = await resumeGenerator.generateDOCX(resumeData);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${baseFilename}.docx`;
        break;

      case 'html':
        content = resumeGenerator.generateHTML(resumeData);
        contentType = 'text/html';
        filename = `${baseFilename}.html`;
        break;

      case 'txt':
        content = resumeGenerator.generatePlainText(resumeData);
        contentType = 'text/plain';
        filename = `${baseFilename}.txt`;
        break;

      case 'biodata':
        // Generate biodata as professional PDF
        content = await resumeGenerator.generateBiodataPDF(resumeData);
        contentType = 'application/pdf';
        filename = `${baseFilename}_biodata.pdf`;
        break;

      case 'resume':
        // Generate resume as professional PDF
        content = await resumeGenerator.generateResumePDF(resumeData);
        contentType = 'application/pdf';
        filename = `${baseFilename}_resume.pdf`;
        break;

      case 'cv':
        // Generate CV as professional PDF
        content = await resumeGenerator.generateCVPDF(resumeData);
        contentType = 'application/pdf';
        filename = `${baseFilename}_cv.pdf`;
        break;

      case 'biodata-html':
        // Generate biodata as HTML
        content = resumeGenerator.generateBiodataHTML(resumeData);
        contentType = 'text/html';
        filename = `${baseFilename}_biodata.html`;
        break;

      case 'resume-html':
        // Generate resume as HTML
        content = resumeGenerator.generateHTML(resumeData);
        contentType = 'text/html';
        filename = `${baseFilename}_resume.html`;
        break;

      case 'cv-html':
        // Generate CV as HTML
        content = resumeGenerator.generateCVHTML(resumeData);
        contentType = 'text/html';
        filename = `${baseFilename}_cv.html`;
        break;

      case 'latex':
      case 'resume-latex':
        // Generate resume as LaTeX
        content = resumeGenerator.generateResumeLatex(resumeData);
        contentType = 'text/plain';
        filename = `${baseFilename}_resume.tex`;
        break;

      case 'biodata-latex':
        // Generate biodata as LaTeX
        content = resumeGenerator.generateBiodataLatex(resumeData);
        contentType = 'text/plain';
        filename = `${baseFilename}_biodata.tex`;
        break;

      case 'cv-latex':
        // Generate CV as LaTeX
        content = resumeGenerator.generateCVLatex(resumeData);
        contentType = 'text/plain';
        filename = `${baseFilename}_cv.tex`;
        break;

      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    // Create response with appropriate headers
    const response = new NextResponse(content as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    return response;

  } catch (error) {
    console.error('Error generating resume:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const studentId = resolvedParams.id;
    const requestData = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Connect to database
    await connectMongoose();

    // Get current student data directly from database
    const student = await StudentModel.findOne({ id: studentId }).lean() as Student | null;

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch related data directly from database
    console.log('Fetching program for student:', { 
      studentId: student.id, 
      programId: student.programId,
      batchId: student.batchId 
    });
    
    const [program, batch, courses] = await Promise.all([
      student.programId ? fetchProgramWithFallbacks(student.programId) : Promise.resolve(null),
      student.batchId ? fetchBatchWithFallbacks(student.batchId) : Promise.resolve(null),
      CourseModel.find({}).lean().exec() as unknown as Promise<Course[]>
    ]);
    
    console.log('Database query results:', {
      programFound: !!program,
      programName: program?.name || 'Not found',
      batchFound: !!batch,
      batchName: batch?.name || 'Not found',
      coursesCount: courses.length
    });

    // Fetch student results (skip for now to avoid complexity)
    let results: any[] = [];
    // Note: Results would need proper database model and querying

    // Generate base resume data
    const baseResumeData = resumeGenerator.generateResumeData(
      student,
      program || undefined,
      batch || undefined,
      results,
      courses
    );

    // Merge with custom data from request
    const enhancedResumeData: ResumeData = {
      ...baseResumeData,
      skills: requestData.skills || baseResumeData.skills,
      projects: requestData.projects || baseResumeData.projects,
      achievements: requestData.achievements || baseResumeData.achievements,
      internships: requestData.internships || baseResumeData.internships,
      certifications: requestData.certifications || baseResumeData.certifications
    };

    const format = requestData.format || 'pdf';

    // Generate resume in requested format
    let content: Buffer | string;
    let contentType: string;
    let filename: string;

    const baseFilename = `${student.firstName || 'Student'}_${student.lastName || 'Resume'}_${student.enrollmentNumber}`;

    switch (format) {
      case 'pdf':
        content = await resumeGenerator.generatePDF(enhancedResumeData);
        contentType = 'application/pdf';
        filename = `${baseFilename}.pdf`;
        break;

      case 'pdf-latex':
        content = await resumeGenerator.generatePDFPandoc(enhancedResumeData);
        contentType = 'application/pdf';
        filename = `${baseFilename}_latex.pdf`;
        break;

      case 'docx':
        content = await resumeGenerator.generateDOCX(enhancedResumeData);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${baseFilename}.docx`;
        break;

      case 'html':
        content = resumeGenerator.generateHTML(enhancedResumeData);
        contentType = 'text/html';
        filename = `${baseFilename}.html`;
        break;

      case 'txt':
        content = resumeGenerator.generatePlainText(enhancedResumeData);
        contentType = 'text/plain';
        filename = `${baseFilename}.txt`;
        break;

      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    // Create response with appropriate headers
    const response = new NextResponse(content as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    return response;

  } catch (error) {
    console.error('Error generating custom resume:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate custom resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}