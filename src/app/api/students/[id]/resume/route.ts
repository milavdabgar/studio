import { NextRequest, NextResponse } from 'next/server';
import { resumeGenerator, type ResumeData } from '@/lib/services/resumeGenerator';
import { connectMongoose } from '@/lib/mongodb';
import { StudentModel, ProgramModel, BatchModel, CourseModel } from '@/lib/models';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
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
    const validFormats = ['pdf', 'docx', 'html', 'txt'];
    if (!validFormats.includes(format)) {
      return NextResponse.json({ 
        error: `Invalid format. Supported formats: ${validFormats.join(', ')}` 
      }, { status: 400 });
    }

    // Connect to database
    await connectMongoose();

    // Fetch student data directly from database
    const student = await StudentModel.findOne({ id: studentId }).lean();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch related data directly from database
    const [program, batch, courses] = await Promise.all([
      student.programId ? ProgramModel.findOne({ id: student.programId }).lean() : null,
      student.batchId ? BatchModel.findOne({ id: student.batchId }).lean() : null,
      CourseModel.find({}).lean()
    ]);

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

      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

    // Create response with appropriate headers
    const response = new NextResponse(content, {
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
    const student = await StudentModel.findOne({ id: studentId }).lean();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch related data directly from database
    const [program, batch, courses] = await Promise.all([
      student.programId ? ProgramModel.findOne({ id: student.programId }).lean() : null,
      student.batchId ? BatchModel.findOne({ id: student.batchId }).lean() : null,
      CourseModel.find({}).lean()
    ]);

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
    const response = new NextResponse(content, {
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