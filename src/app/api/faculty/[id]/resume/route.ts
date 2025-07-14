import { NextRequest, NextResponse } from 'next/server';
import { facultyResumeGenerator, type FacultyResumeData } from '@/lib/services/facultyResumeGenerator';
import { facultyService } from '@/lib/api/faculty';

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
    const validFormats = ['pdf', 'docx', 'html', 'txt', 'biodata', 'resume', 'cv'];
    if (!validFormats.includes(format)) {
      return NextResponse.json({ 
        error: `Invalid format. Supported formats: ${validFormats.join(', ')}` 
      }, { status: 400 });
    }

    // Get faculty data
    const allFaculty = await facultyService.getAllFaculty();
    const faculty = allFaculty.find(f => f.id === facultyId);

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // Generate resume data
    const resumeData = facultyResumeGenerator.generateResumeData(faculty);

    // Generate filename
    const safeName = faculty.fullName || 
      `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim() ||
      faculty.staffCode;
    const sanitizedName = safeName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    const filename = `${sanitizedName}_Faculty_Resume_${faculty.staffCode}.${format}`;

    // Generate content based on format
    let content: Buffer | string;
    let contentType: string;

    switch (format) {
      case 'pdf':
        content = await facultyResumeGenerator.generatePDF(resumeData);
        contentType = 'application/pdf';
        break;
      case 'docx':
        content = await facultyResumeGenerator.generateDOCX(resumeData);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'html':
        content = facultyResumeGenerator.generateHTML(resumeData);
        contentType = 'text/html';
        break;
      case 'txt':
        content = facultyResumeGenerator.generatePlainText(resumeData);
        contentType = 'text/plain';
        break;
      case 'biodata':
        // For faculty, biodata format uses PDF
        content = await facultyResumeGenerator.generatePDF(resumeData);
        contentType = 'application/pdf';
        break;
      case 'resume':
        // For faculty, resume format uses PDF
        content = await facultyResumeGenerator.generatePDF(resumeData);
        contentType = 'application/pdf';
        break;
      case 'cv':
        // For faculty, CV format uses PDF
        content = await facultyResumeGenerator.generatePDF(resumeData);
        contentType = 'application/pdf';
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

    // Get faculty data
    const allFaculty = await facultyService.getAllFaculty();
    const faculty = allFaculty.find(f => f.id === facultyId);

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // Generate base resume data
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