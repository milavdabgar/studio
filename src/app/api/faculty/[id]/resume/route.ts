import { NextRequest, NextResponse } from 'next/server';
import { resumeGenerator } from '@/lib/services/resumeGenerator';
import { FacultyResumeGenerator, type FacultyResumeData } from '@/lib/services/facultyResumeGenerator';
import { connectMongoose } from '@/lib/mongodb';
import { FacultyModel } from '@/lib/models';

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
    const facultyId = resolvedParams.id;

    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID is required' }, { status: 400 });
    }

    // Validate format
    const validFormats = ['pdf', 'pdf-latex', 'docx', 'html', 'txt', 'biodata', 'resume', 'cv', 'biodata-html', 'resume-html', 'cv-html', 'latex', 'biodata-latex', 'resume-latex', 'cv-latex'];
    if (!validFormats.includes(format)) {
      return NextResponse.json({ 
        error: `Invalid format. Supported formats: ${validFormats.join(', ')}` 
      }, { status: 400 });
    }

    // Get faculty data directly from database
    await connectMongoose();
    const faculty = await FacultyModel.findOne({ id: facultyId });

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // Add debugging to see what faculty data looks like
    console.log('Faculty data for resume generation:', {
      id: faculty.id,
      staffCode: faculty.staffCode,
      firstName: faculty.firstName,
      lastName: faculty.lastName,
      fullName: faculty.fullName,
      gtuName: faculty.gtuName,
      department: faculty.department,
      designation: faculty.designation,
      hasName: !!(faculty.firstName || faculty.lastName || faculty.fullName || faculty.gtuName)
    });

    // Convert faculty data to student-like structure for resume generator
    const facultyAsStudent = {
      id: faculty.id,
      enrollmentNumber: faculty.staffCode || faculty.id,
      firstName: faculty.firstName || '',
      lastName: faculty.lastName || '',
      fullNameGtuFormat: faculty.fullName || faculty.gtuName || `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim() || faculty.staffCode,
      personalEmail: faculty.personalEmail || faculty.email,
      instituteEmail: faculty.instituteEmail || faculty.email,
      contactNumber: faculty.contactNumber,
      address: faculty.address,
      department: faculty.department,
      // Add faculty-specific data
      designation: faculty.designation,
      jobType: faculty.jobType,
      // Education and experience from faculty profile
      education: faculty.education || [],
      experience: faculty.experience || [],
      skills: faculty.skills || [],
      projects: faculty.projects || [],
      achievements: faculty.achievements || [],
      certifications: faculty.certifications || [],
      publications: faculty.publications || []
    };

    console.log('Faculty converted to student-like data:', {
      fullNameGtuFormat: facultyAsStudent.fullNameGtuFormat,
      department: facultyAsStudent.department,
      email: facultyAsStudent.personalEmail,
      hasBasicData: !!(facultyAsStudent.fullNameGtuFormat && facultyAsStudent.department)
    });

    // Generate resume data using the working student generator
    const resumeData = resumeGenerator.generateResumeData(
      facultyAsStudent as any,
      undefined, // no program needed for faculty
      undefined, // no batch needed for faculty
      [], // no results for faculty
      [] // no courses needed for this
    );

    // Generate resume in requested format (using student generator approach)
    let content: Buffer | string;
    let contentType: string;
    let filename: string;

    const baseFilename = `${facultyAsStudent.fullNameGtuFormat || 'Faculty'}_${faculty.staffCode}`;

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

    // Set response headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    return new NextResponse(content, { headers });

  } catch (error) {
    console.error('Error generating faculty resume:', error);
    return NextResponse.json({ 
      error: 'Failed to generate resume',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const facultyId = resolvedParams.id;

    if (!facultyId) {
      return NextResponse.json({ error: 'Faculty ID is required' }, { status: 400 });
    }

    // Parse request body for custom data
    let customData: any = {};
    try {
      customData = await request.json();
    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to generate custom resume',
        details: 'Invalid JSON in request body'
      }, { status: 500 });
    }

    const format = customData.format || 'pdf';

    // Get faculty data from database
    await connectMongoose();
    const faculty = await FacultyModel.findOne({ id: facultyId });

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // Generate base resume data
    const facultyResumeGenerator = new FacultyResumeGenerator();
    const baseResumeData = facultyResumeGenerator.generateResumeData(faculty);

    // Enhance with custom data
    const enhancedResumeData: FacultyResumeData = {
      ...baseResumeData,
      experience: customData.experience || baseResumeData.experience,
      publications: customData.publications || baseResumeData.publications,
      research: customData.research || baseResumeData.research,
      achievements: customData.achievements || baseResumeData.achievements,
      courses: customData.courses || baseResumeData.courses,
      certifications: customData.certifications || baseResumeData.certifications
    };

    // Generate filename
    const safeName = faculty.fullName || 
      `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim() ||
      faculty.staffCode;
    const sanitizedName = safeName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    const filename = `${sanitizedName}_Enhanced_Resume_${faculty.staffCode}.${format}`;

    // Generate content based on format
    let content: Buffer | string;
    let contentType: string;

    try {
      switch (format) {
        case 'pdf':
          content = await facultyResumeGenerator.generatePDF(enhancedResumeData);
          contentType = 'application/pdf';
          break;
        case 'docx':
          content = await facultyResumeGenerator.generateDOCX(enhancedResumeData);
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'html':
          content = facultyResumeGenerator.generateHTML(enhancedResumeData);
          contentType = 'text/html';
          break;
        case 'txt':
          content = facultyResumeGenerator.generatePlainText(enhancedResumeData);
          contentType = 'text/plain';
          break;
        default:
          return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ 
        error: 'Failed to generate custom resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Set response headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    return new NextResponse(content, { headers });

  } catch (error) {
    console.error('Error generating custom faculty resume:', error);
    return NextResponse.json({ 
      error: 'Failed to generate custom resume',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}