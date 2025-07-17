import type { Student, Program, Batch, Result, Course } from '@/types/entities';
import { ContentConverterV2 } from '@/lib/content-converter-v2';
import { format, parseISO, isValid } from 'date-fns';
import path from 'path';

export interface ResumeData {
  // Personal Information
  fullName: string;
  email: string;
  personalEmail?: string;
  contactNumber?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  aadharNumber?: string;
  photoURL?: string;
  
  // Academic Information
  enrollmentNumber: string;
  program: string;
  programCode?: string;
  batch?: string;
  currentSemester: number;
  instituteEmail: string;
  
  // Academic Performance
  overallCPI?: number;
  earnedCredits?: number;
  totalCredits?: number;
  academicStatus?: string;
  
  // Semester Results
  semesterResults: Array<{
    semester: number;
    sgpa: number;
    credits: number;
    subjects: Array<{
      code: string;
      name: string;
      credits: number;
      grade: string;
    }>;
  }>;
  
  // Guardian Information
  guardianName?: string;
  guardianRelation?: string;
  guardianContact?: string;
  guardianOccupation?: string;
  guardianIncome?: number;
  
  // Profile Summary
  profileSummary?: string;
  
  // LinkedIn-like sections
  education?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
    grade?: string;
    description?: string;
  }>;
  
  experience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  
  skills?: Array<{
    name: string;
    category: string;
    proficiency: string;
  }>;
  
  projects?: Array<{
    title: string;
    description: string;
    technologies?: string[];
    duration?: string;
    role?: string;
  }>;
  
  achievements?: Array<{
    title: string;
    description: string;
    date?: string;
  }>;
  internships?: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date?: string;
    url?: string;
  }>;
  
  // Extended professional fields
  linkedinUrl?: string;
  portfolioWebsite?: string;
  careerObjective?: string;
  
  awards?: Array<{
    title: string;
    description: string;
    date?: string;
  }>;
  
  professionalMemberships?: Array<{
    organization: string;
    membershipType?: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  
  volunteerWork?: Array<{
    organization: string;
    role: string;
    startDate: string;
    endDate?: string;
    description: string;
  }>;
  
  publications?: Array<{
    title: string;
    journal?: string;
    conference?: string;
    authors: string;
    date?: string;
    doi?: string;
  }>;
  
  professionalDevelopment?: Array<{
    title: string;
    provider: string;
    date?: string;
    description: string;
    skills?: string[];
  }>;
}

export class ResumeGenerator {
  private contentConverter: ContentConverterV2;

  constructor() {
    this.contentConverter = new ContentConverterV2();
  }

  /**
   * Generate resume data from student profile and academic records
   */
  generateResumeData(
    student: Student,
    program?: Program,
    batch?: Batch,
    results?: Result[],
    courses?: Course[]
  ): ResumeData {
    const fullName = student.fullNameGtuFormat || 
      `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim() ||
      student.enrollmentNumber;

    // Calculate academic performance
    const academicPerformance = this.calculateAcademicPerformance(student, results || [], courses || []);

    return {
      // Personal Information
      fullName,
      email: student.personalEmail || student.instituteEmail,
      personalEmail: student.personalEmail,
      contactNumber: student.contactNumber,
      address: student.address,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      bloodGroup: student.bloodGroup,
      aadharNumber: student.aadharNumber,
      photoURL: student.photoURL,
      
      // Academic Information
      enrollmentNumber: student.enrollmentNumber,
      program: program?.name || 'Unknown Program',
      programCode: program?.code,
      batch: batch?.name,
      currentSemester: student.currentSemester,
      instituteEmail: student.instituteEmail,
      overallCPI: academicPerformance.latestCPI,
      earnedCredits: academicPerformance.earnedCredits,
      totalCredits: program?.totalCredits,
      academicStatus: academicPerformance.status,
      semesterResults: academicPerformance.semesterResults,
      
      // Guardian Information
      guardianName: student.guardianDetails?.name,
      guardianRelation: student.guardianDetails?.relation,
      guardianContact: student.guardianDetails?.contactNumber,
      guardianOccupation: student.guardianDetails?.occupation,
      guardianIncome: student.guardianDetails?.annualIncome,
      
      // Profile Summary
      profileSummary: student.profileSummary,
      
      // LinkedIn-like sections
      education: student.education?.map(edu => ({
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: edu.startDate,
        endDate: edu.endDate,
        grade: edu.grade,
        description: edu.description
      })) || [],
      
      experience: student.experience?.map(exp => ({
        company: exp.company,
        position: exp.position,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description
      })) || [],
      
      skills: student.skills?.map(skill => ({
        name: skill.name,
        category: skill.category,
        proficiency: skill.proficiency
      })) || [],
      
      projects: student.projects?.map(project => ({
        title: project.title,
        description: project.description,
        technologies: project.technologies,
        duration: project.startDate + (project.endDate ? ' - ' + project.endDate : ' - Present'),
        role: project.role
      })) || [],
      
      achievements: student.achievements?.map(achievement => ({
        title: achievement.title,
        description: achievement.description,
        date: achievement.date
      })) || [],
      
      // Legacy fields for backward compatibility
      internships: [],
      certifications: []
    };
  }

  /**
   * Calculate academic performance metrics
   */
  private calculateAcademicPerformance(
    student: Student,
    results: Result[],
    courses: Course[]
  ) {
    if (!results.length) {
      return {
        latestCPI: 0,
        earnedCredits: 0,
        status: 'Insufficient academic data',
        semesterResults: []
      };
    }

    let earnedCredits = 0;
    const semesterResults: ResumeData['semesterResults'] = [];

    results.forEach(result => {
      let semesterCredits = 0;
      let semesterCreditPoints = 0;
      const subjectDetails: ResumeData['semesterResults'][0]['subjects'] = [];

      result.subjects.forEach(subject => {
        const courseDetail = courses.find(c => 
          c.subcode === subject.code && 
          c.programId === student.programId && 
          c.semester === result.semester
        );
        
        const credits = courseDetail?.credits || subject.credits || 0;
        semesterCredits += credits;

        if (subject.grade && subject.grade.toUpperCase() !== 'FF' && !subject.isBacklog) {
          earnedCredits += credits;
          semesterCreditPoints += this.getGradePoint(subject.grade) * credits;
        }

        subjectDetails.push({
          code: subject.code,
          name: subject.name,
          credits,
          grade: subject.grade
        });
      });

      const sgpa = semesterCredits > 0 ? semesterCreditPoints / semesterCredits : 0;

      semesterResults.push({
        semester: result.semester,
        sgpa: parseFloat(sgpa.toFixed(2)),
        credits: semesterCredits,
        subjects: subjectDetails
      });
    });

    // Sort semester results by semester number
    semesterResults.sort((a, b) => a.semester - b.semester);

    const latestResult = results
      .sort((a, b) => (b.semester - a.semester) || 
        (new Date(b.declarationDate || 0).getTime() - new Date(a.declarationDate || 0).getTime()))[0];

    const backlogs = this.calculateBacklogs(results);
    const status = backlogs.length > 0 ? 
      `${backlogs.length} Active Backlog(s)` : 
      'Good Academic Standing';

    return {
      latestCPI: latestResult?.cpi || 0,
      earnedCredits,
      status,
      semesterResults
    };
  }

  /**
   * Calculate current backlogs
   */
  private calculateBacklogs(results: Result[]) {
    const backlogs: Array<{ code: string; name: string; semester: number }> = [];

    results.forEach(result => {
      result.subjects.forEach(subject => {
        if (subject.grade === 'FF' || subject.isBacklog) {
          // Check if this backlog was cleared in a later semester
          const wasCleared = results.some(laterResult => 
            laterResult.semester > result.semester &&
            laterResult.subjects.some(laterSubject => 
              laterSubject.code === subject.code && 
              laterSubject.grade !== 'FF' && 
              !laterSubject.isBacklog
            )
          );

          if (!wasCleared && !backlogs.some(b => b.code === subject.code)) {
            backlogs.push({
              code: subject.code,
              name: subject.name,
              semester: result.semester
            });
          }
        }
      });
    });

    return backlogs;
  }

  /**
   * Get grade points for CGPA calculation
   */
  private getGradePoint(grade?: string): number {
    if (!grade) return 0;
    switch (grade.toUpperCase()) {
      case 'AA': return 10;
      case 'AB': return 9;
      case 'BB': return 8;
      case 'BC': return 7;
      case 'CC': return 6;
      case 'CD': return 5;
      case 'DD': return 4;
      case 'FF': return 0;
      default: return 0;
    }
  }

  /**
   * Generate professional resume HTML template
   */
  generateResumeHTML(resumeData: ResumeData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${resumeData.fullName} - Resume</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Source+Sans+Pro:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4;
            margin: 0.75in;
            @bottom-center {
                content: counter(page) " of " counter(pages);
                font-size: 9pt;
                color: #666;
            }
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.5;
            color: #2d3748;
            font-size: 11pt;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .resume-container {
            background: white;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 24pt;
            margin-bottom: 16pt;
            page-break-inside: avoid;
            page-break-after: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            display: flex;
            align-items: center;
            gap: 20pt;
        }
        
        .header-photo {
            flex-shrink: 0;
        }
        
        .header-photo img {
            width: 80pt;
            height: 100pt;
            border-radius: 8pt;
            object-fit: cover;
            border: 2pt solid white;
            box-shadow: 0 4pt 8pt rgba(0,0,0,0.2);
        }
        
        .header-photo-placeholder {
            width: 80pt;
            height: 100pt;
            border: 2pt solid white;
            border-radius: 8pt;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8pt;
            color: white;
            background: rgba(255,255,255,0.1);
            text-align: center;
            line-height: 1.2;
        }
        
        .header-content {
            flex: 1;
            text-align: left;
        }
        
        .header h1 {
            font-size: 22pt;
            font-weight: 600;
            margin-bottom: 4pt;
            letter-spacing: 0.5pt;
        }
        
        .header .tagline {
            font-size: 12pt;
            margin-bottom: 12pt;
            opacity: 0.95;
            font-weight: 400;
        }
        
        .contact-grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 16pt;
            font-size: 10pt;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            font-weight: 400;
            opacity: 0.95;
        }
        
        .contact-icon {
            margin-right: 4pt;
            font-weight: 600;
        }
        
        .content {
            padding: 0;
        }
        
        .section {
            margin-bottom: 18pt;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 13pt;
            color: #667eea;
            margin-bottom: 10pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            position: relative;
            padding-bottom: 4pt;
            page-break-after: avoid;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 40pt;
            height: 2pt;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 1pt;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180pt, 1fr));
            gap: 12pt;
            margin-bottom: 16pt;
        }
        
        .info-card {
            background: #f8fafc;
            padding: 12pt;
            border-radius: 6pt;
            border-left: 3pt solid #667eea;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .info-card strong {
            color: #4a5568;
            display: block;
            margin-bottom: 4pt;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            font-weight: 600;
        }
        
        .info-card .value {
            color: #2d3748;
            font-size: 11pt;
            font-weight: 500;
        }
        
        .performance-stats {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 16pt;
            margin: 16pt 0;
            color: white;
            text-align: center;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80pt, 1fr));
            gap: 16pt;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-value {
            font-size: 20pt;
            font-weight: 700;
            display: block;
            margin-bottom: 4pt;
            font-family: 'Playfair Display', serif;
        }
        
        .stat-label {
            font-size: 8pt;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            font-weight: 400;
        }
        
        /* Print-specific styles */
        @media print {
            body {
                font-size: 11pt;
                line-height: 1.4;
                background: white;
            }
            
            .resume-container {
                box-shadow: none;
                border-radius: 0;
            }
            
            .header {
                margin-bottom: 12pt;
                padding: 20pt;
            }
            
            .header h1 {
                font-size: 20pt;
            }
            
            .header .tagline {
                font-size: 11pt;
            }
            
            .section {
                margin-bottom: 14pt;
            }
            
            .section-title {
                font-size: 12pt;
                margin-bottom: 8pt;
            }
            
            .info-grid {
                grid-template-columns: repeat(auto-fit, minmax(160pt, 1fr));
                gap: 10pt;
            }
            
            .info-card {
                padding: 10pt;
            }
            
            .performance-stats {
                padding: 12pt;
                margin: 12pt 0;
            }
            
            .stats-grid {
                gap: 12pt;
            }
            
            /* Remove hover effects in print */
            .info-card:hover,
            .semester-card:hover {
                transform: none;
                box-shadow: none;
            }
            
            /* Ensure good contrast for colored backgrounds */
            .header, .performance-stats, .section-title::after {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
        
        .semester-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200pt, 1fr));
            gap: 12pt;
            margin-top: 12pt;
        }
        
        .semester-card {
            background: white;
            border: 1pt solid #e2e8f0;
            padding: 12pt;
            page-break-inside: avoid;
            position: relative;
            border-left: 3pt solid #667eea;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .semester-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8pt;
            padding-bottom: 6pt;
            border-bottom: 1pt solid #e2e8f0;
        }
        
        .semester-title {
            font-weight: 600;
            color: #2d3748;
            font-size: 10pt;
        }
        
        .semester-sgpa {
            background: #48bb78;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.85em;
        }
        
        .subjects-preview {
            font-size: 0.9em;
            color: #718096;
            line-height: 1.5;
        }
        
        .subject-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            border-bottom: 1px dotted #e2e8f0;
        }
        
        .subject-row:last-child {
            border-bottom: none;
        }
        
        .grade {
            font-weight: 600;
            color: #667eea;
        }
        
        .skills-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .skill-category {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            transition: transform 0.3s ease;
        }
        
        .skill-category:hover {
            transform: translateY(-3px);
        }
        
        .skill-category-title {
            font-weight: 700;
            color: #4a5568;
            margin-bottom: 15px;
            text-transform: uppercase;
            font-size: 0.9em;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 8px;
        }
        
        .skill-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .skill-tag {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
        }
        
        .project-grid {
            display: grid;
            gap: 20px;
        }
        
        .project-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border-left: 5px solid #667eea;
        }
        
        .project-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .project-title {
            font-size: 1.3em;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 10px;
        }
        
        .project-description {
            color: #4a5568;
            margin-bottom: 15px;
            line-height: 1.6;
        }
        
        .project-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            font-size: 0.9em;
            color: #718096;
        }
        
        .meta-item {
            display: flex;
            align-items: center;
        }
        
        .meta-item strong {
            color: #4a5568;
            margin-right: 5px;
        }
        
        .achievement-list {
            display: grid;
            gap: 15px;
        }
        
        .achievement-item {
            background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
            border: 1px solid #9ae6b4;
            border-radius: 12px;
            padding: 20px;
            border-left: 5px solid #48bb78;
        }
        
        .achievement-title {
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 8px;
            font-size: 1.1em;
        }
        
        .achievement-description {
            color: #4a5568;
            margin-bottom: 8px;
            line-height: 1.5;
        }
        
        .achievement-date {
            color: #718096;
            font-size: 0.9em;
            font-style: italic;
        }
        
        .certification-list {
            display: grid;
            gap: 15px;
        }
        
        .certification-item {
            background: linear-gradient(135deg, #f0f9ff 0%, #e6f3ff 100%);
            border: 1px solid #93c5fd;
            border-radius: 12px;
            padding: 20px;
            border-left: 5px solid #3b82f6;
        }
        
        .certification-title {
            font-weight: 700;
            color: #2d3748;
            font-size: 1.1em;
            margin-bottom: 6px;
        }
        
        .certification-issuer {
            color: #4a5568;
            font-size: 0.95em;
            margin-bottom: 6px;
        }
        
        .certification-date {
            color: #718096;
            font-size: 0.9em;
            font-style: italic;
        }
        
        .footer {
            background: #2d3748;
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 0.9em;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .resume-container {
                box-shadow: none;
                border-radius: 0;
            }
            .header {
                background: #667eea !important;
                -webkit-print-color-adjust: exact;
            }
            .performance-stats {
                background: #667eea !important;
                -webkit-print-color-adjust: exact;
            }
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2.2em;
            }
            .contact-grid {
                grid-template-columns: 1fr;
            }
            .info-grid {
                grid-template-columns: 1fr;
            }
            .skills-container {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <div class="header">
            <div class="header-photo">
                ${resumeData.photoURL ? `
                <img src="${resumeData.photoURL}" alt="${resumeData.fullName}">
                ` : `
                <div class="header-photo-placeholder">
                    PROFESSIONAL<br>PHOTO
                </div>
                `}
            </div>
            <div class="header-content">
                <h1>${resumeData.fullName}</h1>
                <div class="tagline">${resumeData.program} Student</div>
                <div class="contact-grid">
                    <div class="contact-item">
                        <span class="contact-icon">📧</span> ${resumeData.email}
                    </div>
                    ${resumeData.contactNumber ? `
                    <div class="contact-item">
                        <span class="contact-icon">📞</span> ${resumeData.contactNumber}
                    </div>
                    ` : ''}
                    <div class="contact-item">
                        <span class="contact-icon">🆔</span> ${resumeData.enrollmentNumber}
                    </div>
                    ${resumeData.address ? `
                    <div class="contact-item">
                        <span class="contact-icon">📍</span> ${resumeData.address}
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>

        <div class="content">
            ${resumeData.profileSummary ? `
            <div class="section">
                <h2 class="section-title">Professional Summary</h2>
                <p style="font-size: 1.1em; line-height: 1.7; color: #4a5568; text-align: justify;">${resumeData.profileSummary}</p>
            </div>
            ` : ''}

            <div class="section">
                <h2 class="section-title">Academic Information</h2>
                <div class="info-grid">
                    <div class="info-card">
                        <strong>Program</strong>
                        <div class="value">${resumeData.program}${resumeData.programCode ? ` (${resumeData.programCode})` : ''}</div>
                    </div>
                    <div class="info-card">
                        <strong>Current Semester</strong>
                        <div class="value">Semester ${resumeData.currentSemester}</div>
                    </div>
                    <div class="info-card">
                        <strong>Enrollment Number</strong>
                        <div class="value">${resumeData.enrollmentNumber}</div>
                    </div>
                    <div class="info-card">
                        <strong>Institute Email</strong>
                        <div class="value">${resumeData.instituteEmail}</div>
                    </div>
                </div>
            </div>

            ${resumeData.overallCPI ? `
            <div class="performance-stats">
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-value">${resumeData.overallCPI.toFixed(2)}</span>
                        <span class="stat-label">Overall CPI</span>
                    </div>
                    ${resumeData.earnedCredits && resumeData.totalCredits ? `
                    <div class="stat-item">
                        <span class="stat-value">${resumeData.earnedCredits}/${resumeData.totalCredits}</span>
                        <span class="stat-label">Credits Earned</span>
                    </div>
                    ` : ''}
                    <div class="stat-item">
                        <span class="stat-value">${resumeData.currentSemester}</span>
                        <span class="stat-label">Current Semester</span>
                    </div>
                </div>
            </div>
            ` : ''}

            ${resumeData.semesterResults && resumeData.semesterResults.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Academic Performance</h2>
                <div class="semester-grid">
                    ${resumeData.semesterResults.map(semester => `
                        <div class="semester-card">
                            <div class="semester-header">
                                <span class="semester-title">Semester ${semester.semester}</span>
                                <span class="semester-sgpa">SGPA: ${semester.sgpa}</span>
                            </div>
                            <div class="subjects-preview">
                                ${semester.subjects.slice(0, 4).map(subject => `
                                    <div class="subject-row">
                                        <span>${subject.name} (${subject.code})</span>
                                        <span class="grade">${subject.grade}</span>
                                    </div>
                                `).join('')}
                                ${semester.subjects.length > 4 ? `<div style="text-align: center; color: #a0aec0; margin-top: 8px; font-style: italic;">... and ${semester.subjects.length - 4} more subjects</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${resumeData.skills && resumeData.skills.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Technical Skills</h2>
                <div class="skills-container">
                    ${Object.entries(resumeData.skills.reduce((acc, skill) => {
                        if (!acc[skill.category]) acc[skill.category] = [];
                        acc[skill.category].push(skill.name);
                        return acc;
                    }, {} as Record<string, string[]>)).map(([category, skills]) => `
                        <div class="skill-category">
                            <div class="skill-category-title">${category}</div>
                            <div class="skill-tags">
                                ${skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${resumeData.projects && resumeData.projects.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Projects</h2>
                <div class="project-grid">
                    ${resumeData.projects.map(project => `
                        <div class="project-card">
                            <div class="project-title">${project.title}</div>
                            <div class="project-description">${project.description}</div>
                            <div class="project-meta">
                                ${project.technologies ? `
                                <div class="meta-item">
                                    <strong>Technologies:</strong> ${project.technologies.join(', ')}
                                </div>
                                ` : ''}
                                ${project.duration ? `
                                <div class="meta-item">
                                    <strong>Duration:</strong> ${project.duration}
                                </div>
                                ` : ''}
                                ${project.role ? `
                                <div class="meta-item">
                                    <strong>Role:</strong> ${project.role}
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${resumeData.achievements && resumeData.achievements.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Achievements</h2>
                <div class="achievement-list">
                    ${resumeData.achievements.map(achievement => `
                        <div class="achievement-item">
                            <div class="achievement-title">${achievement.title}</div>
                            <div class="achievement-description">${achievement.description}</div>
                            ${achievement.date ? `<div class="achievement-date">${achievement.date}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${resumeData.certifications && resumeData.certifications.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Certifications</h2>
                <div class="certification-list">
                    ${resumeData.certifications.map(cert => `
                        <div class="certification-item">
                            <div class="certification-title">${cert.name}</div>
                            <div class="certification-issuer">${cert.issuer}</div>
                            ${cert.date ? `<div class="certification-date">${cert.date}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${resumeData.awards && resumeData.awards.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Awards & Honors</h2>
                <div class="achievement-list">
                    ${resumeData.awards.map(award => `
                        <div class="achievement-item">
                            <div class="achievement-title">${award.title}</div>
                            <div class="achievement-description">${award.description}</div>
                            ${award.date ? `<div class="achievement-date">${award.date}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${resumeData.experience && resumeData.experience.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Professional Experience</h2>
                <div class="achievement-list">
                    ${resumeData.experience.map(exp => `
                        <div class="achievement-item">
                            <div class="achievement-title">${exp.position}</div>
                            <div class="achievement-description">${exp.company}</div>
                            <div class="achievement-date">${exp.startDate} - ${exp.endDate || 'Present'}</div>
                            ${exp.description ? `<div class="achievement-description">${exp.description}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${resumeData.professionalMemberships && resumeData.professionalMemberships.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Professional Memberships</h2>
                <div class="achievement-list">
                    ${resumeData.professionalMemberships.map(membership => `
                        <div class="achievement-item">
                            <div class="achievement-title">${membership.organization}</div>
                            <div class="achievement-description">${membership.membershipType || 'Member'}</div>
                            <div class="achievement-date">Since ${membership.startDate}</div>
                            ${membership.description ? `<div class="achievement-description">${membership.description}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${resumeData.volunteerWork && resumeData.volunteerWork.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Volunteer Experience</h2>
                <div class="achievement-list">
                    ${resumeData.volunteerWork.map(volunteer => `
                        <div class="achievement-item">
                            <div class="achievement-title">${volunteer.role}</div>
                            <div class="achievement-description">${volunteer.organization}</div>
                            <div class="achievement-date">${volunteer.startDate}${volunteer.endDate ? ` - ${volunteer.endDate}` : ' - Present'}</div>
                            <div class="achievement-description">${volunteer.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${resumeData.publications && resumeData.publications.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Publications</h2>
                <div class="achievement-list">
                    ${resumeData.publications.map(pub => `
                        <div class="achievement-item">
                            <div class="achievement-title">${pub.title}</div>
                            <div class="achievement-description">${pub.journal || pub.conference}</div>
                            <div class="achievement-date">${pub.date}</div>
                            <div class="achievement-description">${pub.authors}</div>
                            ${pub.doi ? `<div class="achievement-description"><strong>DOI:</strong> ${pub.doi}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${resumeData.professionalDevelopment && resumeData.professionalDevelopment.length > 0 ? `
            <div class="section">
                <h2 class="section-title">Professional Development</h2>
                <div class="achievement-list">
                    ${resumeData.professionalDevelopment.map(dev => `
                        <div class="achievement-item">
                            <div class="achievement-title">${dev.title}</div>
                            <div class="achievement-description">${dev.provider}</div>
                            ${dev.date ? `<div class="achievement-date">${dev.date}</div>` : ''}
                            <div class="achievement-description">${dev.description}</div>
                            ${dev.skills ? `<div class="achievement-description"><strong>Skills:</strong> ${dev.skills.join(', ')}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>

        <div class="footer">
            Generated on ${format(new Date(), 'PPP')} | Professional Resume
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate only the content portion of the resume (without HTML wrapper)
   */
  generateResumeContentOnly(resumeData: ResumeData): string {
    return `
<div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif;">
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #2563eb;">
        <h1 style="font-size: 2.5em; color: #1e40af; margin-bottom: 10px; font-weight: 700;">${resumeData.fullName}</h1>
        <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; margin-top: 15px; font-size: 0.95em;">
            <span style="color: #4b5563;">📧 ${resumeData.email}</span>
            ${resumeData.contactNumber ? `<span style="color: #4b5563;">📞 ${resumeData.contactNumber}</span>` : ''}
            <span style="color: #4b5563;">🆔 ${resumeData.enrollmentNumber}</span>
            ${resumeData.address ? `<span style="color: #4b5563;">📍 ${resumeData.address}</span>` : ''}
        </div>
    </div>

    <div style="margin-bottom: 25px;">
        <h2 style="font-size: 1.4em; color: #1e40af; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Academic Information</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
                <strong style="color: #1e40af; display: block; margin-bottom: 5px;">Program</strong>
                ${resumeData.program}${resumeData.programCode ? ` (${resumeData.programCode})` : ''}
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
                <strong style="color: #1e40af; display: block; margin-bottom: 5px;">Current Semester</strong>
                Semester ${resumeData.currentSemester}
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
                <strong style="color: #1e40af; display: block; margin-bottom: 5px;">Enrollment Number</strong>
                ${resumeData.enrollmentNumber}
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
                <strong style="color: #1e40af; display: block; margin-bottom: 5px;">Institute Email</strong>
                ${resumeData.instituteEmail}
            </div>
        </div>
    </div>

    ${resumeData.overallCPI ? `
    <div style="margin-bottom: 25px;">
        <h2 style="font-size: 1.4em; color: #1e40af; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Academic Performance</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #bae6fd;">
                <span style="font-size: 1.8em; font-weight: bold; color: #1e40af; display: block;">${resumeData.overallCPI.toFixed(2)}</span>
                <div style="color: #4b5563; font-size: 0.9em; margin-top: 5px;">Overall CPI</div>
            </div>
            ${resumeData.earnedCredits && resumeData.totalCredits ? `
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #bae6fd;">
                <span style="font-size: 1.8em; font-weight: bold; color: #1e40af; display: block;">${resumeData.earnedCredits}/${resumeData.totalCredits}</span>
                <div style="color: #4b5563; font-size: 0.9em; margin-top: 5px;">Credits Earned</div>
            </div>
            ` : ''}
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #bae6fd;">
                <span style="font-size: 1.8em; font-weight: bold; color: #1e40af; display: block;">${resumeData.academicStatus || 'N/A'}</span>
                <div style="color: #4b5563; font-size: 0.9em; margin-top: 5px;">Academic Status</div>
            </div>
        </div>
    </div>
    ` : ''}

    ${resumeData.semesterResults && resumeData.semesterResults.length > 0 ? `
    <div style="margin-bottom: 25px;">
        <h2 style="font-size: 1.4em; color: #1e40af; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Semester-wise Performance</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
            ${resumeData.semesterResults.map(semester => `
                <div style="background: #fefefe; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6;">
                        <span style="font-weight: 600; color: #1e40af;">Semester ${semester.semester}</span>
                        <span style="font-weight: bold; color: #059669;">SGPA: ${semester.sgpa}</span>
                    </div>
                    <div style="font-size: 0.85em; color: #4b5563;">
                        ${semester.subjects.slice(0, 5).map(subject => `
                            <div style="display: flex; justify-content: space-between; padding: 2px 0;">
                                <span>${subject.name} (${subject.code})</span>
                                <span style="font-weight: 600; color: #1e40af;">${subject.grade}</span>
                            </div>
                        `).join('')}
                        ${semester.subjects.length > 5 ? `<div style="text-align: center; color: #6b7280; font-style: italic;">... and ${semester.subjects.length - 5} more subjects</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${resumeData.skills && resumeData.skills.length > 0 ? `
    <div style="margin-bottom: 25px;">
        <h2 style="font-size: 1.4em; color: #1e40af; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Technical Skills</h2>
        <ul style="list-style: none; padding-left: 0;">
            ${resumeData.skills.map(skill => `<li style="background: #f8fafc; margin-bottom: 8px; padding: 10px 15px; border-radius: 6px; border-left: 3px solid #2563eb;">${skill}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    ${resumeData.projects && resumeData.projects.length > 0 ? `
    <div style="margin-bottom: 25px;">
        <h2 style="font-size: 1.4em; color: #1e40af; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Projects</h2>
        ${resumeData.projects.map(project => `
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 15px;">
                <strong style="color: #1e40af; display: block; margin-bottom: 5px;">${project.title}</strong>
                <div style="margin-top: 5px; color: #4b5563;">${project.description}</div>
                ${project.technologies ? `<div style="margin-top: 8px; font-size: 0.9em; color: #059669;"><strong>Technologies:</strong> ${project.technologies.join(', ')}</div>` : ''}
                ${project.duration ? `<div style="margin-top: 5px; font-size: 0.9em; color: #6b7280;"><strong>Duration:</strong> ${project.duration}</div>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${resumeData.achievements && resumeData.achievements.length > 0 ? `
    <div style="margin-bottom: 25px;">
        <h2 style="font-size: 1.4em; color: #1e40af; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Achievements</h2>
        <ul style="list-style: none; padding-left: 0;">
            ${resumeData.achievements.map(achievement => `
                <li style="background: #f8fafc; margin-bottom: 8px; padding: 10px 15px; border-radius: 6px; border-left: 3px solid #2563eb;">
                    <strong>${achievement.title}</strong>
                    ${achievement.description ? `<div style="margin-top: 5px; font-size: 0.9em; color: #4b5563;">${achievement.description}</div>` : ''}
                    ${achievement.date ? `<div style="margin-top: 5px; font-size: 0.85em; color: #6b7280;">${achievement.date}</div>` : ''}
                </li>
            `).join('')}
        </ul>
    </div>
    ` : ''}

    ${resumeData.certifications && resumeData.certifications.length > 0 ? `
    <div style="margin-bottom: 25px;">
        <h2 style="font-size: 1.4em; color: #1e40af; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Certifications</h2>
        <ul style="list-style: none; padding-left: 0;">
            ${resumeData.certifications.map(cert => `
                <li style="background: #f8fafc; margin-bottom: 8px; padding: 10px 15px; border-radius: 6px; border-left: 3px solid #2563eb;">
                    <strong>${cert.name}</strong> - ${cert.issuer}
                    ${cert.date ? `<div style="margin-top: 5px; font-size: 0.85em; color: #6b7280;">${cert.date}</div>` : ''}
                </li>
            `).join('')}
        </ul>
    </div>
    ` : ''}

    <div style="margin-top: 40px; text-align: center; font-size: 0.8em; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p>Generated on ${format(new Date(), 'PPP')} | Academic Resume</p>
    </div>
</div>
    `.trim();
  }

  /**
   * Generate resume in PDF format using Puppeteer directly
   */
  async generatePDF(resumeData: ResumeData): Promise<Buffer> {
    const htmlContent = this.generateResumeHTML(resumeData);
    return this.generatePDFFromHTML(htmlContent);
  }

  /**
   * Generate resume in PDF format using pandoc with XeLaTeX engine
   */
  async generatePDFPandoc(resumeData: ResumeData): Promise<Buffer> {
    const markdownContent = this.generateResumeMarkdown(resumeData);
    
    try {
      const result = await this.contentConverter.convert(markdownContent, 'pdf-pandoc', {
        title: `${resumeData.fullName} - Resume`,
        author: resumeData.fullName
      });
      return result as Buffer;
    } catch (error) {
      console.error('Error generating PDF resume with pandoc:', error);
      throw new Error(`Failed to generate PDF resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate biodata in PDF format using pandoc with XeLaTeX engine
   */
  async generateBiodataPDFPandoc(resumeData: ResumeData): Promise<Buffer> {
    const markdownContent = this.generateBiodataMarkdown(resumeData);
    
    try {
      const result = await this.contentConverter.convert(markdownContent, 'pdf-pandoc', {
        title: `${resumeData.fullName} - Biodata`,
        author: resumeData.fullName
      });
      return result as Buffer;
    } catch (error) {
      console.error('Error generating PDF biodata with pandoc:', error);
      throw new Error(`Failed to generate PDF biodata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate CV in PDF format using pandoc with XeLaTeX engine
   */
  async generateCVPDFPandoc(resumeData: ResumeData): Promise<Buffer> {
    const markdownContent = this.generateCVMarkdown(resumeData);
    
    try {
      const result = await this.contentConverter.convert(markdownContent, 'pdf-pandoc', {
        title: `${resumeData.fullName} - CV`,
        author: resumeData.fullName
      });
      return result as Buffer;
    } catch (error) {
      console.error('Error generating PDF CV with pandoc:', error);
      throw new Error(`Failed to generate PDF CV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate PDF from plain text content
   */
  async generatePDFFromText(textContent: string): Promise<Buffer> {
    // Create a professional HTML wrapper for the text content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Document</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 11px;
              line-height: 1.5;
              margin: 0;
              padding: 20px;
              color: #333;
              background: white;
            }
            
            .text-container {
              max-width: 100%;
              margin: 0 auto;
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            pre {
              white-space: pre-wrap;
              font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
              font-size: 10px;
              line-height: 1.4;
              background: #f8f9fa;
              padding: 15px;
              border-radius: 4px;
              border-left: 4px solid #007bff;
              overflow-wrap: break-word;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 10px;
                font-size: 10px;
              }
              .text-container {
                box-shadow: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="text-container">
            <pre>${textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </div>
        </body>
      </html>
    `;

    return this.generatePDFFromHTML(htmlContent);
  }

  /**
   * Generate biodata as professional PDF
   */
  async generateBiodataPDF(resumeData: ResumeData): Promise<Buffer> {
    const htmlContent = this.generateBiodataHTML(resumeData);
    return this.generatePDFFromHTML(htmlContent);
  }

  /**
   * Generate resume as professional PDF
   */
  async generateResumePDF(resumeData: ResumeData): Promise<Buffer> {
    const htmlContent = this.generateResumeHTML(resumeData);
    return this.generatePDFFromHTML(htmlContent);
  }

  /**
   * Generate CV as professional PDF
   */
  async generateCVPDF(resumeData: ResumeData): Promise<Buffer> {
    const htmlContent = this.generateCVHTML(resumeData);
    return this.generatePDFFromHTML(htmlContent);
  }

  /**
   * Convert relative photo URLs to absolute file paths for PDF generation
   */
  private convertPhotoURLsForPDF(htmlContent: string): string {
    const fs = require('fs');
    
    // Convert relative photo URLs to absolute file paths
    return htmlContent.replace(
      /src="\/uploads\/photos\/([^"]+)"/g,
      (match, filename) => {
        const absolutePath = path.join(process.cwd(), 'public', 'uploads', 'photos', filename);
        
        // Check if file exists
        if (fs.existsSync(absolutePath)) {
          console.log(`Converting photo URL: ${match} -> file://${absolutePath}`);
          return `src="file://${absolutePath}"`;
        } else {
          console.log(`Photo file not found: ${absolutePath}`);
          // Return a placeholder or the original URL
          return match;
        }
      }
    );
  }

  /**
   * Generate PDF from HTML content with professional styling
   */
  private async generatePDFFromHTML(htmlContent: string): Promise<Buffer> {
    let puppeteer: any;
    try {
      puppeteer = require('puppeteer');
    } catch {
      throw new Error('Puppeteer not available for PDF generation');
    }

    let browser;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-extensions',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });

      const page = await browser.newPage();
      
      // Set viewport for better rendering
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2
      });
      
      // Convert photo URLs to absolute paths for PDF generation
      const processedHTML = this.convertPhotoURLsForPDF(htmlContent);
      console.log('Processed HTML for PDF (first 1000 chars):', processedHTML.substring(0, 1000));
      
      // Enhanced content loading with better timeout handling
      await page.setContent(processedHTML, { 
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000
      });

      // Wait for fonts and images to load
      await page.evaluateHandle('document.fonts.ready');
      
      // Wait for images to load
      await page.evaluate(() => {
        const images = Array.from(document.images);
        return Promise.all(images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }));
      });
      
      // Generate PDF with enhanced options
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '15mm',
          right: '12mm',
          bottom: '15mm',
          left: '12mm'
        },
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        quality: 100
      });

      return Buffer.from(pdfBuffer);

    } catch (error) {
      console.error('Error in PDF generation:', error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
    }
  }

  /**
   * Generate resume in DOCX format
   */
  async generateDOCX(resumeData: ResumeData): Promise<Buffer> {
    const markdownContent = this.generateResumeMarkdown(resumeData);
    
    try {
      const result = await this.contentConverter.convert(markdownContent, 'docx', {
        title: `${resumeData.fullName} - Resume`,
        author: resumeData.fullName
      });
      return result as Buffer;
    } catch (error) {
      console.error('Error generating DOCX resume:', error);
      throw new Error(`Failed to generate DOCX resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate resume in Markdown format for DOCX conversion
   */
  private generateResumeMarkdown(resumeData: ResumeData): string {
    const sections: string[] = [];
    
    // Header
    sections.push(`# ${resumeData.fullName}\n`);
    
    // Contact Information
    const contactInfo = [
      `**Email:** ${resumeData.email}`,
      resumeData.contactNumber ? `**Phone:** ${resumeData.contactNumber}` : null,
      `**Enrollment:** ${resumeData.enrollmentNumber}`,
      resumeData.address ? `**Address:** ${resumeData.address}` : null
    ].filter(Boolean);
    
    sections.push(contactInfo.join(' | ') + '\n');
    
    // Academic Information
    sections.push('## Academic Information\n');
    sections.push(`**Program:** ${resumeData.program}`);
    sections.push(`**Current Semester:** ${resumeData.currentSemester}`);
    sections.push(`**Institute Email:** ${resumeData.instituteEmail}`);
    
    // Academic Performance
    if (resumeData.overallCPI) {
      sections.push(`**Overall CPI:** ${resumeData.overallCPI}`);
    }
    
    if (resumeData.earnedCredits && resumeData.totalCredits) {
      sections.push(`**Credits:** ${resumeData.earnedCredits}/${resumeData.totalCredits}`);
    }
    
    sections.push('');
    
    // Profile Summary
    if (resumeData.profileSummary) {
      sections.push('## Profile Summary\n');
      sections.push(resumeData.profileSummary + '\n');
    }
    
    // Skills
    if (resumeData.skills && resumeData.skills.length > 0) {
      sections.push('## Skills\n');
      
      // Group skills by category
      const skillsByCategory = resumeData.skills.reduce((acc, skill) => {
        const category = skill.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(skill);
        return acc;
      }, {} as Record<string, typeof resumeData.skills>);
      
      Object.entries(skillsByCategory).forEach(([category, skills]) => {
        sections.push(`### ${category}`);
        skills.forEach(skill => {
          const proficiency = this.getSkillProficiencyIndicator(skill.proficiency);
          sections.push(`- **${skill.name}** ${proficiency}`);
        });
        sections.push('');
      });
    }
    
    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      sections.push('## Experience\n');
      
      resumeData.experience.forEach(exp => {
        sections.push(`### ${exp.position} at ${exp.company}`);
        const duration = exp.endDate ? 
          `${this.formatDate(exp.startDate)} - ${this.formatDate(exp.endDate)}` : 
          `${this.formatDate(exp.startDate)} - Present`;
        sections.push(`**Duration:** ${duration}`);
        if (exp.description) {
          sections.push(`**Description:** ${exp.description}`);
        }
        sections.push('');
      });
    }
    
    // Education
    if (resumeData.education && resumeData.education.length > 0) {
      sections.push('## Education\n');
      
      resumeData.education.forEach(edu => {
        sections.push(`### ${edu.degree} in ${edu.fieldOfStudy}`);
        sections.push(`**Institution:** ${edu.institution}`);
        const duration = `${this.formatDate(edu.startDate)} - ${this.formatDate(edu.endDate)}`;
        sections.push(`**Duration:** ${duration}`);
        if (edu.grade) {
          sections.push(`**Grade:** ${edu.grade}`);
        }
        if (edu.description) {
          sections.push(`**Description:** ${edu.description}`);
        }
        sections.push('');
      });
    }
    
    // Projects
    if (resumeData.projects && resumeData.projects.length > 0) {
      sections.push('## Projects\n');
      
      resumeData.projects.forEach(project => {
        sections.push(`### ${project.title}`);
        if (project.description) {
          sections.push(`**Description:** ${project.description}`);
        }
        if (project.technologies && project.technologies.length > 0) {
          sections.push(`**Technologies:** ${project.technologies.join(', ')}`);
        }
        if (project.duration) {
          sections.push(`**Duration:** ${project.duration}`);
        }
        if (project.role) {
          sections.push(`**Role:** ${project.role}`);
        }
        sections.push('');
      });
    }
    
    // Achievements
    if (resumeData.achievements && resumeData.achievements.length > 0) {
      sections.push('## Achievements\n');
      
      resumeData.achievements.forEach(achievement => {
        sections.push(`### ${achievement.title}`);
        if (achievement.description) {
          sections.push(`**Description:** ${achievement.description}`);
        }
        sections.push(`**Date:** ${this.formatDate(achievement.date)}`);
        sections.push('');
      });
    }
    
    // Semester Results
    if (resumeData.semesterResults && resumeData.semesterResults.length > 0) {
      sections.push('## Academic Performance\n');
      
      resumeData.semesterResults.forEach(result => {
        sections.push(`### Semester ${result.semester}`);
        sections.push(`**SGPA:** ${result.sgpa}`);
        sections.push(`**Credits:** ${result.credits}`);
        
        if (result.subjects && result.subjects.length > 0) {
          sections.push('**Subjects:**');
          result.subjects.forEach(subject => {
            sections.push(`- ${subject.name} (${subject.code}): ${subject.grade}`);
          });
        }
        sections.push('');
      });
    }
    
    // Guardian Information
    if (resumeData.guardianName) {
      sections.push('## Guardian Information\n');
      sections.push(`**Name:** ${resumeData.guardianName}`);
      if (resumeData.guardianRelation) {
        sections.push(`**Relation:** ${resumeData.guardianRelation}`);
      }
      if (resumeData.guardianContact) {
        sections.push(`**Contact:** ${resumeData.guardianContact}`);
      }
      if (resumeData.guardianOccupation) {
        sections.push(`**Occupation:** ${resumeData.guardianOccupation}`);
      }
    }
    
    return sections.join('\n');
  }

  /**
   * Generate biodata in Markdown format for DOCX conversion
   */
  private generateBiodataMarkdown(resumeData: ResumeData): string {
    const sections: string[] = [];
    
    // Header
    sections.push(`# ${resumeData.fullName}\n`);
    sections.push('**BIODATA**\n');
    
    // Personal Information
    sections.push('## Personal Information\n');
    
    const personalInfo = [
      `**Full Name:** ${resumeData.fullName}`,
      `**Email:** ${resumeData.email}`,
      resumeData.contactNumber ? `**Phone:** ${resumeData.contactNumber}` : null,
      resumeData.address ? `**Address:** ${resumeData.address}` : null,
      resumeData.dateOfBirth ? `**Date of Birth:** ${this.formatDate(resumeData.dateOfBirth)}` : null,
      resumeData.gender ? `**Gender:** ${resumeData.gender}` : null,
      resumeData.bloodGroup ? `**Blood Group:** ${resumeData.bloodGroup}` : null,
      resumeData.aadharNumber ? `**Aadhar Number:** ${resumeData.aadharNumber}` : null
    ].filter(Boolean);
    
    personalInfo.forEach(info => info && sections.push(info));
    sections.push('');
    
    // Academic Information
    sections.push('## Academic Information\n');
    sections.push(`**Program:** ${resumeData.program}`);
    sections.push(`**Enrollment Number:** ${resumeData.enrollmentNumber}`);
    sections.push(`**Current Semester:** ${resumeData.currentSemester}`);
    sections.push(`**Institute Email:** ${resumeData.instituteEmail}`);
    
    if (resumeData.overallCPI) {
      sections.push(`**Overall CPI:** ${resumeData.overallCPI}`);
    }
    
    if (resumeData.earnedCredits && resumeData.totalCredits) {
      sections.push(`**Credits:** ${resumeData.earnedCredits}/${resumeData.totalCredits}`);
    }
    
    sections.push('');
    
    // Guardian Information
    if (resumeData.guardianName) {
      sections.push('## Guardian Information\n');
      sections.push(`**Name:** ${resumeData.guardianName}`);
      if (resumeData.guardianRelation) {
        sections.push(`**Relation:** ${resumeData.guardianRelation}`);
      }
      if (resumeData.guardianContact) {
        sections.push(`**Contact:** ${resumeData.guardianContact}`);
      }
      if (resumeData.guardianOccupation) {
        sections.push(`**Occupation:** ${resumeData.guardianOccupation}`);
      }
      if (resumeData.guardianIncome) {
        sections.push(`**Income:** ₹${resumeData.guardianIncome.toLocaleString()}`);
      }
      sections.push('');
    }
    
    // Academic Performance
    if (resumeData.semesterResults && resumeData.semesterResults.length > 0) {
      sections.push('## Academic Performance\n');
      
      resumeData.semesterResults.forEach(result => {
        sections.push(`### Semester ${result.semester}`);
        sections.push(`**SGPA:** ${result.sgpa}`);
        sections.push(`**Credits:** ${result.credits}`);
        sections.push('');
      });
    }
    
    // Skills
    if (resumeData.skills && resumeData.skills.length > 0) {
      sections.push('## Skills\n');
      
      // Group skills by category
      const skillsByCategory = resumeData.skills.reduce((acc, skill) => {
        const category = skill.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(skill);
        return acc;
      }, {} as Record<string, typeof resumeData.skills>);
      
      Object.entries(skillsByCategory).forEach(([category, skills]) => {
        sections.push(`### ${category}`);
        skills.forEach(skill => {
          const proficiency = this.getSkillProficiencyIndicator(skill.proficiency);
          sections.push(`- **${skill.name}** ${proficiency}`);
        });
        sections.push('');
      });
    }
    
    // Achievements
    if (resumeData.achievements && resumeData.achievements.length > 0) {
      sections.push('## Achievements\n');
      
      resumeData.achievements.forEach(achievement => {
        sections.push(`### ${achievement.title}`);
        if (achievement.description) {
          sections.push(`**Description:** ${achievement.description}`);
        }
        sections.push(`**Date:** ${this.formatDate(achievement.date)}`);
        sections.push('');
      });
    }
    
    return sections.join('\n');
  }

  /**
   * Generate CV in Markdown format for DOCX conversion
   */
  private generateCVMarkdown(resumeData: ResumeData): string {
    const sections: string[] = [];
    
    // Header
    sections.push(`# ${resumeData.fullName}\n`);
    sections.push('**CURRICULUM VITAE**\n');
    
    // Contact Information
    const contactInfo = [
      `**Email:** ${resumeData.email}`,
      resumeData.contactNumber ? `**Phone:** ${resumeData.contactNumber}` : null,
      resumeData.address ? `**Address:** ${resumeData.address}` : null
    ].filter(Boolean);
    
    sections.push(contactInfo.join(' | ') + '\n');
    
    // Profile Summary
    if (resumeData.profileSummary) {
      sections.push('## Profile Summary\n');
      sections.push(resumeData.profileSummary + '\n');
    }
    
    // Education
    if (resumeData.education && resumeData.education.length > 0) {
      sections.push('## Education\n');
      
      resumeData.education.forEach(edu => {
        sections.push(`### ${edu.degree} in ${edu.fieldOfStudy}`);
        sections.push(`**Institution:** ${edu.institution}`);
        const duration = `${this.formatDate(edu.startDate)} - ${this.formatDate(edu.endDate)}`;
        sections.push(`**Duration:** ${duration}`);
        if (edu.grade) {
          sections.push(`**Grade:** ${edu.grade}`);
        }
        if (edu.description) {
          sections.push(`**Description:** ${edu.description}`);
        }
        sections.push('');
      });
    }
    
    // Current Academic Information
    sections.push('## Current Academic Information\n');
    sections.push(`**Program:** ${resumeData.program}`);
    sections.push(`**Enrollment Number:** ${resumeData.enrollmentNumber}`);
    sections.push(`**Current Semester:** ${resumeData.currentSemester}`);
    sections.push(`**Institute Email:** ${resumeData.instituteEmail}`);
    
    if (resumeData.overallCPI) {
      sections.push(`**Overall CPI:** ${resumeData.overallCPI}`);
    }
    
    sections.push('');
    
    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      sections.push('## Professional Experience\n');
      
      resumeData.experience.forEach(exp => {
        sections.push(`### ${exp.position} at ${exp.company}`);
        const duration = exp.endDate ? 
          `${this.formatDate(exp.startDate)} - ${this.formatDate(exp.endDate)}` : 
          `${this.formatDate(exp.startDate)} - Present`;
        sections.push(`**Duration:** ${duration}`);
        if (exp.description) {
          sections.push(`**Description:** ${exp.description}`);
        }
        sections.push('');
      });
    }
    
    // Projects
    if (resumeData.projects && resumeData.projects.length > 0) {
      sections.push('## Projects\n');
      
      resumeData.projects.forEach(project => {
        sections.push(`### ${project.title}`);
        if (project.description) {
          sections.push(`**Description:** ${project.description}`);
        }
        if (project.technologies && project.technologies.length > 0) {
          sections.push(`**Technologies:** ${project.technologies.join(', ')}`);
        }
        if (project.duration) {
          sections.push(`**Duration:** ${project.duration}`);
        }
        if (project.role) {
          sections.push(`**Role:** ${project.role}`);
        }
        sections.push('');
      });
    }
    
    // Skills
    if (resumeData.skills && resumeData.skills.length > 0) {
      sections.push('## Skills\n');
      
      // Group skills by category
      const skillsByCategory = resumeData.skills.reduce((acc, skill) => {
        const category = skill.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(skill);
        return acc;
      }, {} as Record<string, typeof resumeData.skills>);
      
      Object.entries(skillsByCategory).forEach(([category, skills]) => {
        sections.push(`### ${category}`);
        skills.forEach(skill => {
          const proficiency = this.getSkillProficiencyIndicator(skill.proficiency);
          sections.push(`- **${skill.name}** ${proficiency}`);
        });
        sections.push('');
      });
    }
    
    // Achievements
    if (resumeData.achievements && resumeData.achievements.length > 0) {
      sections.push('## Achievements\n');
      
      resumeData.achievements.forEach(achievement => {
        sections.push(`### ${achievement.title}`);
        if (achievement.description) {
          sections.push(`**Description:** ${achievement.description}`);
        }
        sections.push(`**Date:** ${this.formatDate(achievement.date)}`);
        sections.push('');
      });
    }
    
    // Certifications
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      sections.push('## Certifications\n');
      
      resumeData.certifications.forEach(cert => {
        sections.push(`### ${cert.name}`);
        sections.push(`**Issuer:** ${cert.issuer}`);
        if (cert.date) {
          sections.push(`**Date:** ${this.formatDate(cert.date)}`);
        }
        if (cert.url) {
          sections.push(`**URL:** ${cert.url}`);
        }
        sections.push('');
      });
    }
    
    // Semester Results (detailed)
    if (resumeData.semesterResults && resumeData.semesterResults.length > 0) {
      sections.push('## Academic Performance\n');
      
      resumeData.semesterResults.forEach(result => {
        sections.push(`### Semester ${result.semester}`);
        sections.push(`**SGPA:** ${result.sgpa}`);
        sections.push(`**Credits:** ${result.credits}`);
        
        if (result.subjects && result.subjects.length > 0) {
          sections.push('**Subjects:**');
          result.subjects.forEach(subject => {
            sections.push(`- ${subject.name} (${subject.code}): ${subject.grade} (${subject.credits} credits)`);
          });
        }
        sections.push('');
      });
    }
    
    return sections.join('\n');
  }

  /**
   * Generate resume in HTML format (for preview or direct download)
   */
  generateHTML(resumeData: ResumeData): string {
    return this.generateResumeHTML(resumeData);
  }

  /**
   * Generate biodata HTML with professional styling
   */
  generateBiodataHTML(resumeData: ResumeData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${resumeData.fullName} - Biodata</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Crimson+Text:wght@400;600&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4;
            margin: 0.75in;
            @bottom-center {
                content: counter(page) " of " counter(pages);
                font-size: 9pt;
                color: #666;
            }
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Crimson Text', 'Times New Roman', serif;
            line-height: 1.5;
            color: #2c3e50;
            font-size: 11pt;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 18pt;
            padding: 16pt;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            page-break-inside: avoid;
            page-break-after: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .header-content {
            flex: 1;
            text-align: center;
        }
        
        .photo-section {
            width: 80pt;
            height: 100pt;
            margin-right: 20pt;
            flex-shrink: 0;
        }
        
        .photo-section img {
            width: 80pt;
            height: 100pt;
            border: 2pt solid white;
            border-radius: 8pt;
            object-fit: cover;
            box-shadow: 0 4pt 8pt rgba(0,0,0,0.2);
        }
        
        .photo-placeholder {
            width: 80pt;
            height: 100pt;
            border: 2pt solid white;
            border-radius: 8pt;
            background: rgba(255,255,255,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8pt;
            color: rgba(255,255,255,0.7);
            text-align: center;
            line-height: 1.2;
        }
        
        .header h1 {
            font-family: 'Inter', sans-serif;
            font-size: 20pt;
            margin-bottom: 4pt;
            font-weight: 600;
            letter-spacing: 0.5pt;
        }
        
        .header .subtitle {
            font-size: 11pt;
            opacity: 0.95;
            font-weight: 400;
            margin-bottom: 2pt;
        }
        
        .biodata-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16pt;
            page-break-inside: avoid;
            border: 1pt solid #bdc3c7;
        }
        
        .biodata-table th {
            background: #34495e;
            color: white;
            padding: 8pt 12pt;
            font-family: 'Inter', sans-serif;
            font-size: 10pt;
            text-align: center;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            border: 1pt solid #2c3e50;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .biodata-table td {
            padding: 8pt 12pt;
            border: 1pt solid #bdc3c7;
            vertical-align: top;
            font-size: 10pt;
        }
        
        .biodata-table tr:nth-child(even) {
            background-color: #f8f9fa;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .label-col {
            font-weight: 600;
            color: #2c3e50;
            width: 35%;
            background-color: #ecf0f1 !important;
            font-family: 'Inter', sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .value-col {
            color: #34495e;
            font-weight: 400;
        }
        
        .section-header {
            background: #34495e !important;
            color: white;
            padding: 8pt 12pt;
            font-family: 'Inter', sans-serif;
            font-size: 10pt;
            font-weight: 600;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .academic-performance {
            background: #27ae60;
            color: white;
            padding: 12pt;
            margin: 12pt 0;
            text-align: center;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .performance-item {
            display: inline-block;
            margin: 0 12pt;
        }
        
        .performance-value {
            font-size: 14pt;
            font-weight: 600;
            display: block;
            margin-bottom: 2pt;
        }
        
        .performance-label {
            font-size: 9pt;
            opacity: 0.9;
            font-weight: 400;
        }
        
        .skills-section {
            background: #f8f9fa;
            padding: 12pt;
            margin: 12pt 0;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120pt, 1fr));
            gap: 10pt;
        }
        
        .skill-category {
            background: white;
            padding: 10pt;
            border-left: 3pt solid #34495e;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .skill-category h4 {
            font-family: 'Inter', sans-serif;
            color: #2c3e50;
            margin-bottom: 6pt;
            font-size: 10pt;
            font-weight: 600;
        }
        
        .skill-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 4pt;
        }
        
        .skill-tag {
            background: #34495e;
            color: white;
            padding: 3pt 8pt;
            border-radius: 12pt;
            font-size: 8pt;
            font-weight: 500;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .declaration {
            background: #fff3cd;
            border: 2pt solid #f39c12;
            padding: 12pt;
            margin-top: 16pt;
            text-align: center;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .declaration h3 {
            font-family: 'Inter', sans-serif;
            color: #856404;
            margin-bottom: 8pt;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            font-size: 11pt;
            font-weight: 600;
        }
        
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 20pt;
            padding-top: 12pt;
            border-top: 1pt solid #bdc3c7;
            page-break-inside: avoid;
        }
        
        .signature-item {
            text-align: center;
        }
        
        .signature-line {
            border-bottom: 1pt solid #2c3e50;
            width: 120pt;
            margin: 8pt 0;
        }
        
        @media print {
            body { 
                font-size: 10pt;
                line-height: 1.4;
            }
            
            .header {
                margin-bottom: 14pt;
                padding: 12pt;
            }
            
            .header h1 {
                font-size: 18pt;
            }
            
            .biodata-table {
                margin-bottom: 12pt;
            }
            
            .biodata-table th {
                padding: 6pt 10pt;
                font-size: 9pt;
            }
            
            .biodata-table td {
                padding: 6pt 10pt;
                font-size: 9pt;
            }
            
            .academic-performance {
                padding: 10pt;
                margin: 10pt 0;
            }
            
            .skills-section {
                padding: 10pt;
                margin: 10pt 0;
            }
            
            .skills-grid {
                grid-template-columns: repeat(auto-fit, minmax(100pt, 1fr));
                gap: 8pt;
            }
            
            .skill-category {
                padding: 8pt;
            }
            
            .declaration {
                padding: 10pt;
                margin-top: 12pt;
            }
            
            .signature-section {
                margin-top: 16pt;
                padding-top: 10pt;
            }
            
            .signature-line {
                width: 100pt;
                margin: 6pt 0;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="photo-section">
            ${resumeData.photoURL ? `
            <img src="${resumeData.photoURL}" alt="${resumeData.fullName}">
            ` : `
            <div class="photo-placeholder">
                PROFESSIONAL<br>PHOTO
            </div>
            `}
        </div>
        <div class="header-content">
            <h1>${resumeData.fullName}</h1>
            <div class="subtitle">BIODATA</div>
            <div class="subtitle">${resumeData.program} • ${resumeData.enrollmentNumber}</div>
        </div>
    </div>

    <!-- Personal Information -->
    <table class="biodata-table">
        <tr>
            <th colspan="2" class="section-header">Personal Information</th>
        </tr>
        <tr>
            <td class="label-col">Full Name</td>
            <td class="value-col">${resumeData.fullName}</td>
        </tr>
        <tr>
            <td class="label-col">Date of Birth</td>
            <td class="value-col">${resumeData.dateOfBirth || 'Not Provided'}</td>
        </tr>
        <tr>
            <td class="label-col">Gender</td>
            <td class="value-col">${resumeData.gender || 'Not Provided'}</td>
        </tr>
        <tr>
            <td class="label-col">Blood Group</td>
            <td class="value-col">${resumeData.bloodGroup || 'Not Provided'}</td>
        </tr>
        ${resumeData.aadharNumber ? `
        <tr>
            <td class="label-col">Aadhar Number</td>
            <td class="value-col">${resumeData.aadharNumber}</td>
        </tr>
        ` : ''}
    </table>

    <!-- Contact Information -->
    <table class="biodata-table">
        <tr>
            <th colspan="2" class="section-header">Contact Information</th>
        </tr>
        <tr>
            <td class="label-col">Personal Email</td>
            <td class="value-col">${resumeData.personalEmail || 'Not Provided'}</td>
        </tr>
        <tr>
            <td class="label-col">Institute Email</td>
            <td class="value-col">${resumeData.instituteEmail}</td>
        </tr>
        <tr>
            <td class="label-col">Contact Number</td>
            <td class="value-col">${resumeData.contactNumber || 'Not Provided'}</td>
        </tr>
        <tr>
            <td class="label-col">Address</td>
            <td class="value-col">${resumeData.address || 'Not Provided'}</td>
        </tr>
    </table>

    <!-- Academic Information -->
    <table class="biodata-table">
        <tr>
            <th colspan="2" class="section-header">Academic Information</th>
        </tr>
        <tr>
            <td class="label-col">Program</td>
            <td class="value-col">${resumeData.program}</td>
        </tr>
        <tr>
            <td class="label-col">Enrollment Number</td>
            <td class="value-col">${resumeData.enrollmentNumber}</td>
        </tr>
        <tr>
            <td class="label-col">Current Semester</td>
            <td class="value-col">${resumeData.currentSemester}</td>
        </tr>
        ${resumeData.batch ? `
        <tr>
            <td class="label-col">Batch</td>
            <td class="value-col">${resumeData.batch}</td>
        </tr>
        ` : ''}
        ${resumeData.overallCPI ? `
        <tr>
            <td class="label-col">Overall CPI</td>
            <td class="value-col">${resumeData.overallCPI.toFixed(2)}</td>
        </tr>
        ` : ''}
    </table>

    ${resumeData.guardianName ? `
    <!-- Family Information -->
    <table class="biodata-table">
        <tr>
            <th colspan="2" class="section-header">Family Information</th>
        </tr>
        <tr>
            <td class="label-col">Guardian Name</td>
            <td class="value-col">${resumeData.guardianName}</td>
        </tr>
        ${resumeData.guardianRelation ? `
        <tr>
            <td class="label-col">Relation</td>
            <td class="value-col">${resumeData.guardianRelation}</td>
        </tr>
        ` : ''}
        ${resumeData.guardianContact ? `
        <tr>
            <td class="label-col">Guardian Contact</td>
            <td class="value-col">${resumeData.guardianContact}</td>
        </tr>
        ` : ''}
        ${resumeData.guardianOccupation ? `
        <tr>
            <td class="label-col">Guardian Occupation</td>
            <td class="value-col">${resumeData.guardianOccupation}</td>
        </tr>
        ` : ''}
    </table>
    ` : ''}

    ${resumeData.overallCPI ? `
    <!-- Academic Performance -->
    <div class="academic-performance">
        <div class="performance-item">
            <span class="performance-value">${resumeData.overallCPI.toFixed(2)}</span>
            <span class="performance-label">Overall CPI</span>
        </div>
        ${resumeData.earnedCredits && resumeData.totalCredits ? `
        <div class="performance-item">
            <span class="performance-value">${resumeData.earnedCredits}/${resumeData.totalCredits}</span>
            <span class="performance-label">Credits</span>
        </div>
        ` : ''}
    </div>
    ` : ''}

    ${resumeData.profileSummary ? `
    <!-- About Me -->
    <table class="biodata-table">
        <tr>
            <th class="section-header">About Me</th>
        </tr>
        <tr>
            <td class="value-col" style="text-align: justify; padding: 20px;">${resumeData.profileSummary}</td>
        </tr>
    </table>
    ` : ''}

    ${resumeData.skills && resumeData.skills.length > 0 ? `
    <!-- Skills -->
    <div class="skills-section">
        <h3 style="color: #1565c0; margin-bottom: 20px; text-align: center;">Technical Skills</h3>
        <div class="skills-grid">
            ${Object.entries(resumeData.skills.reduce((acc, skill) => {
                if (!acc[skill.category]) acc[skill.category] = [];
                acc[skill.category].push(skill.name);
                return acc;
            }, {} as Record<string, string[]>)).map(([category, skills]) => `
                <div class="skill-category">
                    <h4>${category}</h4>
                    <div class="skill-tags">
                        ${skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${resumeData.achievements && resumeData.achievements.length > 0 ? `
    <!-- Achievements -->
    <table class="biodata-table">
        <tr>
            <th class="section-header">Achievements</th>
        </tr>
        ${resumeData.achievements.map(achievement => `
        <tr>
            <td class="value-col" style="padding: 15px;">
                <strong style="color: #1565c0;">${achievement.title}</strong><br>
                ${achievement.description}
                ${achievement.date ? `<br><em style="color: #666; font-size: 0.9em;">Date: ${achievement.date}</em>` : ''}
            </td>
        </tr>
        `).join('')}
    </table>
    ` : ''}

    ${resumeData.certifications && resumeData.certifications.length > 0 ? `
    <!-- Certifications -->
    <table class="biodata-table">
        <tr>
            <th class="section-header">Certifications</th>
        </tr>
        ${resumeData.certifications.map(cert => `
        <tr>
            <td class="value-col" style="padding: 15px;">
                <strong style="color: #1565c0;">${cert.name}</strong><br>
                Issued by: ${cert.issuer}
                ${cert.date ? `<br><em style="color: #666; font-size: 0.9em;">Date: ${cert.date}</em>` : ''}
                ${cert.url ? `<br><a href="${cert.url}" style="color: #1565c0; text-decoration: none;">View Certificate</a>` : ''}
            </td>
        </tr>
        `).join('')}
    </table>
    ` : ''}

    ${resumeData.awards && resumeData.awards.length > 0 ? `
    <!-- Awards & Honors -->
    <table class="biodata-table">
        <tr>
            <th class="section-header">Awards & Honors</th>
        </tr>
        ${resumeData.awards.map(award => `
        <tr>
            <td class="value-col" style="padding: 15px;">
                <strong style="color: #1565c0;">${award.title}</strong><br>
                ${award.description}
                ${award.date ? `<br><em style="color: #666; font-size: 0.9em;">Date: ${award.date}</em>` : ''}
            </td>
        </tr>
        `).join('')}
    </table>
    ` : ''}

    ${resumeData.experience && resumeData.experience.length > 0 ? `
    <!-- Professional Experience -->
    <table class="biodata-table">
        <tr>
            <th class="section-header">Professional Experience</th>
        </tr>
        ${resumeData.experience.map(exp => `
        <tr>
            <td class="value-col" style="padding: 15px;">
                <strong style="color: #1565c0;">${exp.position}</strong><br>
                ${exp.company}<br>
                Duration: ${exp.startDate} - ${exp.endDate || 'Present'}
                ${exp.description ? `<br><br>${exp.description}` : ''}
            </td>
        </tr>
        `).join('')}
    </table>
    ` : ''}

    ${resumeData.projects && resumeData.projects.length > 0 ? `
    <!-- Projects -->
    <table class="biodata-table">
        <tr>
            <th class="section-header">Projects</th>
        </tr>
        ${resumeData.projects.map(project => `
        <tr>
            <td class="value-col" style="padding: 15px;">
                <strong style="color: #1565c0;">${project.title}</strong><br>
                ${project.role ? `Role: ${project.role}<br>` : ''}
                ${project.duration ? `Duration: ${project.duration}<br>` : ''}
                ${project.description}<br>
                ${project.technologies ? `<br><strong>Technologies:</strong> ${project.technologies.join(', ')}` : ''}
            </td>
        </tr>
        `).join('')}
    </table>
    ` : ''}

    ${resumeData.professionalMemberships && resumeData.professionalMemberships.length > 0 ? `
    <!-- Professional Memberships -->
    <table class="biodata-table">
        <tr>
            <th class="section-header">Professional Memberships</th>
        </tr>
        ${resumeData.professionalMemberships.map(membership => `
        <tr>
            <td class="value-col" style="padding: 15px;">
                <strong style="color: #1565c0;">${membership.organization}</strong><br>
                ${membership.membershipType || 'Member'} since ${membership.startDate}
                ${membership.description ? `<br><br>${membership.description}` : ''}
            </td>
        </tr>
        `).join('')}
    </table>
    ` : ''}

    ${resumeData.volunteerWork && resumeData.volunteerWork.length > 0 ? `
    <!-- Volunteer Experience -->
    <table class="biodata-table">
        <tr>
            <th class="section-header">Volunteer Experience</th>
        </tr>
        ${resumeData.volunteerWork.map(volunteer => `
        <tr>
            <td class="value-col" style="padding: 15px;">
                <strong style="color: #1565c0;">${volunteer.role}</strong><br>
                ${volunteer.organization}<br>
                Duration: ${volunteer.startDate}${volunteer.endDate ? ` - ${volunteer.endDate}` : ' - Present'}<br>
                ${volunteer.description}
            </td>
        </tr>
        `).join('')}
    </table>
    ` : ''}

    ${resumeData.publications && resumeData.publications.length > 0 ? `
    <!-- Publications -->
    <table class="biodata-table">
        <tr>
            <th class="section-header">Publications</th>
        </tr>
        ${resumeData.publications.map(pub => `
        <tr>
            <td class="value-col" style="padding: 15px;">
                <strong style="color: #1565c0;">${pub.title}</strong><br>
                ${pub.journal || pub.conference}<br>
                Authors: ${pub.authors}
                ${pub.date ? `<br>Date: ${pub.date}` : ''}
                ${pub.doi ? `<br><strong>DOI:</strong> ${pub.doi}` : ''}
            </td>
        </tr>
        `).join('')}
    </table>
    ` : ''}

    ${resumeData.professionalDevelopment && resumeData.professionalDevelopment.length > 0 ? `
    <!-- Professional Development -->
    <table class="biodata-table">
        <tr>
            <th class="section-header">Professional Development</th>
        </tr>
        ${resumeData.professionalDevelopment.map(dev => `
        <tr>
            <td class="value-col" style="padding: 15px;">
                <strong style="color: #1565c0;">${dev.title}</strong><br>
                Provider: ${dev.provider}
                ${dev.date ? `<br>Date: ${dev.date}` : ''}
                <br><br>${dev.description}
                ${dev.skills ? `<br><br><strong>Skills Developed:</strong> ${dev.skills.join(', ')}` : ''}
            </td>
        </tr>
        `).join('')}
    </table>
    ` : ''}

    <!-- Declaration -->
    <div class="declaration">
        <h3>Declaration</h3>
        <p>I hereby declare that the information furnished above is true and correct to the best of my knowledge and belief.</p>
        
        <div class="signature-section">
            <div class="signature-item">
                <strong>Date:</strong>
                <div class="signature-line"></div>
                <small>Date</small>
            </div>
            <div class="signature-item">
                <strong>Signature:</strong>
                <div class="signature-line"></div>
                <small>(${resumeData.fullName})</small>
            </div>
        </div>
    </div>

    <div style="text-align: center; margin-top: 30px; color: #666; font-size: 0.9em;">
        Generated on ${format(new Date(), 'PPP')} | Professional Biodata
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate CV HTML with professional styling
   */
  generateCVHTML(resumeData: ResumeData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${resumeData.fullName} - Curriculum Vitae</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4;
            margin: 0.7in 0.8in;
            @top-center {
                content: "${resumeData.fullName} - Curriculum Vitae";
                font-size: 8pt;
                color: #666;
                font-family: 'Source Sans Pro', sans-serif;
                font-weight: 400;
            }
            @bottom-center {
                content: "Page " counter(page) " of " counter(pages);
                font-size: 8pt;
                color: #666;
                font-family: 'Source Sans Pro', sans-serif;
            }
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Source Sans Pro', Arial, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            font-size: 10pt;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .container {
            max-width: 8.0in;
            margin: 0 auto;
            padding: 0;
        }
        
        .header {
            margin-bottom: 35pt;
            padding-bottom: 28pt;
            border-bottom: 3pt solid #0f172a;
            text-align: center;
            page-break-inside: avoid;
            page-break-after: avoid;
            position: relative;
            background: #ffffff;
            padding: 28pt 20pt;
            margin: -20pt -20pt 35pt -20pt;
            border-radius: 0 0 15pt 15pt;
        }
        
        .photo-section {
            margin-bottom: 15pt;
        }
        
        .photo {
            width: 100pt;
            height: 120pt;
            border-radius: 12pt;
            object-fit: cover;
            border: 3pt solid #ffffff;
            box-shadow: 0 8pt 24pt rgba(0,0,0,0.2), 0 4pt 8pt rgba(0,0,0,0.1);
            margin: 0 auto;
            display: block;
            transition: transform 0.3s ease;
        }
        
        .photo-placeholder {
            width: 100pt;
            height: 120pt;
            border: 3pt solid #ffffff;
            border-radius: 12pt;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9pt;
            color: #64748b;
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            text-align: center;
            line-height: 1.2;
            margin: 0 auto;
            box-shadow: 0 8pt 24pt rgba(0,0,0,0.2), 0 4pt 8pt rgba(0,0,0,0.1);
            font-weight: 500;
        }
        
        .header h1 {
            font-family: 'Playfair Display', 'Times New Roman', serif;
            font-size: 36pt;
            font-weight: 700;
            margin-bottom: 10pt;
            letter-spacing: 0.8pt;
            color: #0f172a;
            text-transform: none;
            line-height: 1.1;
            text-shadow: 0 1pt 2pt rgba(0,0,0,0.1);
        }
        
        .header-subtitle {
            font-size: 15pt;
            color: #475569;
            margin-bottom: 18pt;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 2pt;
            font-family: 'Source Sans Pro', Arial, sans-serif;
        }
        
        .contact-info {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 24pt;
            margin-top: 20pt;
            padding: 16pt;
            background: #f8fafc;
            border-radius: 8pt;
            border: 1pt solid #e2e8f0;
        }
        
        .contact-item {
            font-size: 10pt;
            color: #475569;
            display: flex;
            align-items: center;
            font-weight: 500;
            font-family: 'Source Sans Pro', Arial, sans-serif;
        }
        
        .contact-item strong {
            font-weight: 700;
            margin-right: 6pt;
            color: #0f172a;
        }
        
        .contact-grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 16pt;
            font-size: 10pt;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            font-weight: 400;
            opacity: 0.95;
        }
        
        .contact-icon {
            margin-right: 4pt;
            font-weight: 600;
        }
        
        .section {
            margin-bottom: 25pt;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-family: 'Playfair Display', 'Times New Roman', serif;
            color: #ffffff;
            font-size: 18pt;
            font-weight: 700;
            text-transform: none;
            letter-spacing: 0.5pt;
            margin: 0 0 20pt 0;
            page-break-after: avoid;
            border-bottom: 2pt solid #0f172a;
            padding-bottom: 8pt;
            position: relative;
            background: #475569;
            padding: 12pt 16pt 8pt 16pt;
            margin: 0 -16pt 20pt -16pt;
            border-radius: 8pt 8pt 0 0;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -2pt;
            left: 16pt;
            width: 60pt;
            height: 2pt;
            background: #ffffff;
            border-radius: 1pt;
        }
        
        .section-content {
            padding: 0;
            margin-top: 0;
            background: #fefefe;
            border-radius: 0 0 8pt 8pt;
            border: 1pt solid #e2e8f0;
            border-top: none;
            padding: 16pt;
            margin: 0 -16pt 0 -16pt;
        }
        
        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24pt;
            margin-top: 20pt;
        }
        
        .left-column {
            padding-right: 12pt;
        }
        
        .right-column {
            padding-left: 12pt;
        }
        
        .professional-summary {
            font-style: italic;
            text-align: justify;
            margin-bottom: 24pt;
            padding: 20pt;
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
            border: 1pt solid #e2e8f0;
            border-left: 4pt solid #3b82f6;
            font-size: 11pt;
            line-height: 1.7;
            border-radius: 8pt;
            box-shadow: 0 2pt 4pt rgba(0,0,0,0.05);
            position: relative;
        }
        
        .entry-item {
            margin-bottom: 22pt;
            page-break-inside: avoid;
            padding: 16pt;
            background: #ffffff;
            border: 1pt solid #e2e8f0;
            border-radius: 8pt;
            box-shadow: 0 2pt 4pt rgba(0,0,0,0.05);
            position: relative;
        }
        
        .entry-item:last-child {
            margin-bottom: 0;
        }
        
        .entry-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8pt;
        }
        
        .entry-title {
            font-family: 'Source Sans Pro', Arial, sans-serif;
            font-size: 13pt;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4pt;
            letter-spacing: 0.2pt;
        }
        
        .entry-subtitle {
            font-size: 11pt;
            color: #475569;
            font-weight: 600;
            margin-bottom: 4pt;
            font-style: normal;
            letter-spacing: 0.1pt;
        }
        
        .entry-date {
            font-size: 10pt;
            color: #64748b;
            font-weight: 600;
            text-align: right;
            flex-shrink: 0;
            margin-left: 15pt;
            background: linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%);
            padding: 4pt 12pt;
            border-radius: 6pt;
            border: 1pt solid #cbd5e1;
            font-family: 'Source Sans Pro', Arial, sans-serif;
            letter-spacing: 0.1pt;
        }
        
        .entry-description {
            font-size: 10pt;
            color: #475569;
            line-height: 1.7;
            text-align: justify;
            margin-top: 8pt;
            font-family: 'Source Sans Pro', Arial, sans-serif;
        }
        
        .entry-list {
            margin-top: 8pt;
        }
        
        .entry-list ul {
            margin: 0;
            padding-left: 16pt;
        }
        
        .entry-list li {
            margin-bottom: 4pt;
            font-size: 10pt;
            line-height: 1.4;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120pt, 1fr));
            gap: 12pt;
            margin-top: 8pt;
        }
        
        .skill-category {
            background: #f8f9fa;
            padding: 10pt;
            border-radius: 4pt;
            border-left: 3pt solid #e74c3c;
            page-break-inside: avoid;
        }
        
        .skill-category-title {
            font-family: 'Source Sans Pro', 'Arial', sans-serif;
            font-weight: 600;
            color: #1a252f;
            margin-bottom: 6pt;
            font-size: 10pt;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
        }
        
        .skill-items {
            display: flex;
            flex-wrap: wrap;
            gap: 4pt;
        }
        
        .skill-item {
            background: #1a252f;
            color: white;
            padding: 2pt 6pt;
            border-radius: 8pt;
            font-size: 8pt;
            font-weight: 500;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .publication-item {
            margin-bottom: 12pt;
            page-break-inside: avoid;
        }
        
        .publication-title {
            font-weight: 600;
            color: #1a252f;
            margin-bottom: 4pt;
        }
        
        .publication-details {
            font-size: 10pt;
            color: #34495e;
            font-style: italic;
            margin-bottom: 4pt;
        }
        
        .award-item {
            margin-bottom: 12pt;
            padding: 8pt;
            background: #fff9f0;
            border-left: 3pt solid #f39c12;
            page-break-inside: avoid;
        }
        
        .award-title {
            font-weight: 600;
            color: #1a252f;
            margin-bottom: 2pt;
        }
        
        .award-issuer {
            font-size: 10pt;
            color: #e74c3c;
            font-weight: 500;
        }
        
        .award-date {
            font-size: 9pt;
            color: #7f8c8d;
            font-style: italic;
            float: right;
        }
        
        /* Print-specific styles for CV */
        @media print {
            body {
                font-size: 10pt;
                line-height: 1.4;
            }
            
            .header {
                margin-bottom: 16pt;
                padding-bottom: 12pt;
            }
            
            .header h1 {
                font-size: 24pt;
            }
            
            .header-subtitle {
                font-size: 12pt;
            }
            
            .contact-info {
                grid-template-columns: repeat(auto-fit, minmax(180pt, 1fr));
                gap: 6pt;
            }
            
            .contact-item {
                font-size: 9pt;
            }
            
            .section {
                margin-bottom: 16pt;
            }
            
            .section-title {
                font-size: 12pt;
                margin-bottom: 10pt;
            }
            
            .two-column {
                gap: 20pt;
            }
            
            .entry-item {
                margin-bottom: 12pt;
                padding-bottom: 10pt;
            }
            
            .entry-title {
                font-size: 11pt;
            }
            
            .entry-subtitle {
                font-size: 9pt;
            }
            
            .entry-date {
                font-size: 8pt;
            }
            
            .entry-description {
                font-size: 9pt;
                line-height: 1.4;
            }
            
            .skills-grid {
                grid-template-columns: repeat(auto-fit, minmax(100pt, 1fr));
                gap: 10pt;
            }
            
            .skill-category {
                padding: 8pt;
            }
            
            .skill-category-title {
                font-size: 9pt;
            }
            
            .skill-item {
                font-size: 7pt;
            }
            
            .professional-summary {
                font-size: 9pt;
                padding: 10pt;
                margin-bottom: 12pt;
            }
            
            .photo {
                width: 70pt;
                height: 90pt;
            }
            
            .photo-placeholder {
                width: 70pt;
                height: 90pt;
                font-size: 7pt;
            }
            
            .photo-section {
                margin-right: 20pt;
            }
            
            /* Ensure all colored elements print properly */
            .photo, .photo-placeholder, .skill-item, .award-item, .skill-category, .professional-summary {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
        
        .skills-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180pt, 1fr));
            gap: 16pt;
            margin-top: 0;
        }
        
        .skill-category {
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
            padding: 16pt;
            border-radius: 8pt;
            border: 1pt solid #e2e8f0;
            border-left: 4pt solid #3b82f6;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            box-shadow: 0 2pt 4pt rgba(0,0,0,0.05);
        }
        
        .skill-category-title {
            font-family: 'Source Sans Pro', 'Arial', sans-serif;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 10pt;
            text-transform: uppercase;
            font-size: 11pt;
            letter-spacing: 0.8pt;
            border-bottom: 2pt solid #3b82f6;
            padding-bottom: 6pt;
        }
        
        .skill-items {
            display: flex;
            flex-wrap: wrap;
            gap: 4pt;
        }
        
        .skill-item {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 4pt 10pt;
            border-radius: 16pt;
            font-size: 9pt;
            font-weight: 600;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            box-shadow: 0 2pt 4pt rgba(59, 130, 246, 0.3);
            font-family: 'Source Sans Pro', Arial, sans-serif;
            letter-spacing: 0.1pt;
        }
        
        .academic-stats {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 24pt;
            margin: 20pt 0;
            text-align: center;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            border-radius: 12pt;
            box-shadow: 0 4pt 8pt rgba(16, 185, 129, 0.3);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100pt, 1fr));
            gap: 20pt;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-value {
            font-size: 20pt;
            font-weight: 700;
            display: block;
            margin-bottom: 4pt;
            font-family: 'Playfair Display', serif;
        }
        
        .stat-label {
            font-size: 8pt;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            font-weight: 400;
        }
        
        /* Print-specific styles */
        @media print {
            body {
                font-size: 11pt;
                line-height: 1.4;
            }
            
            .header {
                margin-bottom: 14pt;
                padding: 20pt 16pt;
            }
            
            .section {
                margin-bottom: 14pt;
            }
            
            .section-title {
                padding: 6pt 10pt;
                font-size: 11pt;
            }
            
            .section-content {
                padding: 10pt;
            }
            
            .timeline-item {
                margin-bottom: 12pt;
            }
            
            .skills-container {
                grid-template-columns: repeat(auto-fit, minmax(140pt, 1fr));
                gap: 10pt;
            }
            
            .skill-category {
                padding: 10pt;
            }
            
            .academic-stats {
                padding: 12pt;
                margin: 10pt 0;
            }
            
            .stats-grid {
                gap: 10pt;
            }
            
            /* Remove hover effects in print */
            .skill-category:hover,
            .semester-card:hover {
                transform: none;
            }
            
            /* Ensure good contrast */
            .header, .section-title, .academic-stats {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
        
        .semester-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .semester-card {
            background: white;
            border: 1px solid #bdc3c7;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .semester-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.15);
        }
        
        .semester-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #ecf0f1;
        }
        
        .semester-title {
            font-weight: bold;
            color: #2c3e50;
            font-size: 1.1em;
        }
        
        .semester-sgpa {
            background: #27ae60;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-weight: bold;
            font-size: 0.9em;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: #34495e;
            color: white;
            border-radius: 10px;
            font-style: italic;
        }
        
        @media print {
            body { 
                font-size: 11px;
                padding: 10px;
            }
            .header {
                background: #2c3e50 !important;
                -webkit-print-color-adjust: exact;
            }
            .section-title {
                background: #34495e !important;
                -webkit-print-color-adjust: exact;
            }
            .academic-stats {
                background: #27ae60 !important;
                -webkit-print-color-adjust: exact;
            }
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2.2em;
            }
            .contact-grid {
                grid-template-columns: 1fr;
            }
            .skills-container {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="photo-section">
                ${resumeData.photoURL ? `
                <img src="${resumeData.photoURL}" alt="${resumeData.fullName}" class="photo">
                ` : `
                <div class="photo-placeholder">
                    PROFESSIONAL<br>PHOTO
                </div>
                `}
            </div>
            <h1>${resumeData.fullName}</h1>
            <div class="header-subtitle">Curriculum Vitae</div>
            <div class="contact-info">
                <div class="contact-item">
                    <strong>Program:</strong> ${resumeData.program}
                </div>
                <div class="contact-item">
                    <strong>Enrollment:</strong> ${resumeData.enrollmentNumber}
                </div>
                <div class="contact-item">
                    <strong>Email:</strong> ${resumeData.personalEmail || resumeData.email}
                </div>
                <div class="contact-item">
                    <strong>Phone:</strong> ${resumeData.contactNumber || 'Available upon request'}
                </div>
                ${resumeData.address ? `
                <div class="contact-item">
                    <strong>Address:</strong> ${resumeData.address}
                </div>
                ` : ''}
                ${resumeData.linkedinUrl ? `
                <div class="contact-item">
                    <strong>LinkedIn:</strong> ${resumeData.linkedinUrl}
                </div>
                ` : ''}
                ${resumeData.portfolioWebsite ? `
                <div class="contact-item">
                    <strong>Portfolio:</strong> ${resumeData.portfolioWebsite}
                </div>
                ` : ''}
            </div>
        </div>

        ${resumeData.profileSummary ? `
        <div class="professional-summary">
            <strong>Professional Summary:</strong> ${resumeData.profileSummary}
        </div>
        ` : ''}

        ${resumeData.careerObjective ? `
        <div class="professional-summary">
            <strong>Career Objective:</strong> ${resumeData.careerObjective}
        </div>
        ` : ''}

        <div class="section">
            <h2 class="section-title">Educational Qualifications</h2>
            <div class="section-content">
                <div class="entry-item">
                    <div class="entry-header">
                        <div>
                            <div class="entry-title">Current Education</div>
                            <div class="entry-subtitle">${resumeData.program}</div>
                            <div class="entry-subtitle">Government Polytechnic Palanpur</div>
                        </div>
                        <div class="entry-date">Current Semester: ${resumeData.currentSemester}</div>
                    </div>
                    ${resumeData.overallCPI ? `<div class="entry-description"><strong>Overall CPI:</strong> ${resumeData.overallCPI.toFixed(2)}</div>` : ''}
                </div>

                ${resumeData.education && resumeData.education.length > 0 ? resumeData.education.map(edu => `
                    <div class="entry-item">
                        <div class="entry-header">
                            <div>
                                <div class="entry-title">${edu.degree}</div>
                                <div class="entry-subtitle">${edu.institution}</div>
                            </div>
                            <div class="entry-date">${edu.startDate} - ${edu.endDate || 'Present'}</div>
                        </div>
                        ${edu.grade ? `<div class="entry-description"><strong>Grade:</strong> ${edu.grade}</div>` : ''}
                        ${edu.description ? `<div class="entry-description">${edu.description}</div>` : ''}
                    </div>
                `).join('') : ''}
            </div>
        </div>

    ${resumeData.overallCPI ? `
    <div class="academic-stats">
        <div class="stats-grid">
            <div class="stat-item">
                <span class="stat-value">${resumeData.overallCPI.toFixed(2)}</span>
                <span class="stat-label">Overall CPI</span>
            </div>
            ${resumeData.earnedCredits && resumeData.totalCredits ? `
            <div class="stat-item">
                <span class="stat-value">${resumeData.earnedCredits}/${resumeData.totalCredits}</span>
                <span class="stat-label">Credits Earned</span>
            </div>
            ` : ''}
            <div class="stat-item">
                <span class="stat-value">${resumeData.currentSemester}</span>
                <span class="stat-label">Current Semester</span>
            </div>
        </div>
    </div>
    ` : ''}

    ${resumeData.semesterResults && resumeData.semesterResults.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Academic Performance</h2>
        <div class="section-content">
            <div class="semester-grid">
                ${resumeData.semesterResults.map(semester => `
                    <div class="semester-card">
                        <div class="semester-header">
                            <span class="semester-title">Semester ${semester.semester}</span>
                            <span class="semester-sgpa">SGPA: ${semester.sgpa}</span>
                        </div>
                        <div style="color: #7f8c8d; font-size: 0.9em;">
                            ${semester.credits} Credits • ${semester.subjects.length} Subjects
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
    ` : ''}

        ${resumeData.experience && resumeData.experience.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Professional Experience</h2>
            <div class="section-content">
                ${resumeData.experience.map(exp => `
                    <div class="entry-item">
                        <div class="entry-header">
                            <div>
                                <div class="entry-title">${exp.position}</div>
                                <div class="entry-subtitle">${exp.company}</div>
                            </div>
                            <div class="entry-date">${exp.startDate} - ${exp.endDate || 'Present'}</div>
                        </div>
                        ${exp.description ? `<div class="entry-description">${exp.description}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${resumeData.projects && resumeData.projects.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Projects & Research</h2>
            <div class="section-content">
                ${resumeData.projects.map(project => `
                    <div class="entry-item">
                        <div class="entry-header">
                            <div>
                                <div class="entry-title">${project.title}</div>
                                ${project.role ? `<div class="entry-subtitle">Role: ${project.role}</div>` : ''}
                            </div>
                            ${project.duration ? `<div class="entry-date">${project.duration}</div>` : ''}
                        </div>
                        <div class="entry-description">${project.description}</div>
                        ${project.technologies ? `<div class="entry-description"><strong>Technologies:</strong> ${project.technologies.join(', ')}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

    ${resumeData.skills && resumeData.skills.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Technical Expertise</h2>
        <div class="section-content">
            <div class="skills-container">
                ${Object.entries(resumeData.skills.reduce((acc, skill) => {
                    if (!acc[skill.category]) acc[skill.category] = [];
                    acc[skill.category].push(skill.name);
                    return acc;
                }, {} as Record<string, string[]>)).map(([category, skills]) => `
                    <div class="skill-category">
                        <div class="skill-category-title">${category}</div>
                        <div class="skill-items">
                            ${skills.map(skill => `<span class="skill-item">${skill}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
    ` : ''}

        ${resumeData.achievements && resumeData.achievements.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Achievements & Recognition</h2>
            <div class="section-content">
                ${resumeData.achievements.map(achievement => `
                    <div class="entry-item">
                        <div class="entry-header">
                            <div>
                                <div class="entry-title">${achievement.title}</div>
                            </div>
                            ${achievement.date ? `<div class="entry-date">${achievement.date}</div>` : ''}
                        </div>
                        <div class="entry-description">${achievement.description}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${resumeData.certifications && resumeData.certifications.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Certifications</h2>
            <div class="section-content">
                ${resumeData.certifications.map(cert => `
                    <div class="entry-item">
                        <div class="entry-header">
                            <div>
                                <div class="entry-title">${cert.name}</div>
                                <div class="entry-subtitle">Issued by ${cert.issuer}</div>
                            </div>
                            ${cert.date ? `<div class="entry-date">${cert.date}</div>` : ''}
                        </div>
                        ${cert.url ? `<div class="entry-description"><strong>Credential URL:</strong> ${cert.url}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${resumeData.awards && resumeData.awards.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Awards & Honors</h2>
            <div class="section-content">
                ${resumeData.awards.map(award => `
                    <div class="entry-item">
                        <div class="entry-header">
                            <div>
                                <div class="entry-title">${award.title}</div>
                                <div class="entry-subtitle">Award / Recognition</div>
                            </div>
                            ${award.date ? `<div class="entry-date">${award.date}</div>` : ''}
                        </div>
                        <div class="entry-description">${award.description}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${resumeData.professionalMemberships && resumeData.professionalMemberships.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Professional Memberships</h2>
            <div class="section-content">
                ${resumeData.professionalMemberships.map(membership => `
                    <div class="entry-item">
                        <div class="entry-header">
                            <div>
                                <div class="entry-title">${membership.organization}</div>
                                <div class="entry-subtitle">Member since ${membership.startDate}</div>
                            </div>
                            ${membership.membershipType ? `<div class="entry-date">${membership.membershipType}</div>` : ''}
                        </div>
                        ${membership.description ? `<div class="entry-description">${membership.description}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${resumeData.volunteerWork && resumeData.volunteerWork.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Volunteer Experience</h2>
            <div class="section-content">
                ${resumeData.volunteerWork.map(volunteer => `
                    <div class="entry-item">
                        <div class="entry-header">
                            <div>
                                <div class="entry-title">${volunteer.role}</div>
                                <div class="entry-subtitle">${volunteer.organization}</div>
                            </div>
                            <div class="entry-date">${volunteer.startDate}${volunteer.endDate ? ` - ${volunteer.endDate}` : ' - Present'}</div>
                        </div>
                        <div class="entry-description">${volunteer.description}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${resumeData.publications && resumeData.publications.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Publications</h2>
            <div class="section-content">
                ${resumeData.publications.map(pub => `
                    <div class="entry-item">
                        <div class="entry-header">
                            <div>
                                <div class="entry-title">${pub.title}</div>
                                <div class="entry-subtitle">${pub.journal || pub.conference}</div>
                            </div>
                            ${pub.date ? `<div class="entry-date">${pub.date}</div>` : ''}
                        </div>
                        <div class="entry-description">${pub.authors}</div>
                        ${pub.doi ? `<div class="entry-description"><strong>DOI:</strong> ${pub.doi}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${resumeData.professionalDevelopment && resumeData.professionalDevelopment.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Professional Development</h2>
            <div class="section-content">
                ${resumeData.professionalDevelopment.map(dev => `
                    <div class="entry-item">
                        <div class="entry-header">
                            <div>
                                <div class="entry-title">${dev.title}</div>
                                <div class="entry-subtitle">${dev.provider}</div>
                            </div>
                            ${dev.date ? `<div class="entry-date">${dev.date}</div>` : ''}
                        </div>
                        <div class="entry-description">${dev.description}</div>
                        ${dev.skills ? `<div class="entry-description"><strong>Skills Developed:</strong> ${dev.skills.join(', ')}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <p>Generated on ${format(new Date(), 'PPP')} | Comprehensive Curriculum Vitae</p>
        </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate resume in plain text format
   */
  generatePlainText(resumeData: ResumeData): string {
    const sections: string[] = [];

    // Header
    sections.push(`${resumeData.fullName}\n${'='.repeat(resumeData.fullName.length)}`);
    
    const contactInfo = [
      `Email: ${resumeData.email}`,
      resumeData.contactNumber ? `Phone: ${resumeData.contactNumber}` : null,
      `Enrollment: ${resumeData.enrollmentNumber}`,
      resumeData.address ? `Address: ${resumeData.address}` : null
    ].filter(Boolean);
    
    sections.push(contactInfo.join(' | '));

    // Academic Information
    sections.push('\nACADEMIC INFORMATION');
    sections.push('-'.repeat(20));
    sections.push(`Program: ${resumeData.program}`);
    sections.push(`Current Semester: ${resumeData.currentSemester}`);
    sections.push(`Institute Email: ${resumeData.instituteEmail}`);

    // Academic Performance
    if (resumeData.overallCPI) {
      sections.push('\nACADEMIC PERFORMANCE');
      sections.push('-'.repeat(20));
      sections.push(`Overall CPI: ${resumeData.overallCPI.toFixed(2)}`);
      if (resumeData.earnedCredits && resumeData.totalCredits) {
        sections.push(`Credits: ${resumeData.earnedCredits}/${resumeData.totalCredits}`);
      }
      sections.push(`Status: ${resumeData.academicStatus || 'N/A'}`);
    }

    // Semester Results
    if (resumeData.semesterResults && resumeData.semesterResults.length > 0) {
      sections.push('\nSEMESTER PERFORMANCE');
      sections.push('-'.repeat(20));
      resumeData.semesterResults.forEach(semester => {
        sections.push(`Semester ${semester.semester}: SGPA ${semester.sgpa} (${semester.credits} credits)`);
      });
    }

    // Additional sections if they exist
    if (resumeData.skills && resumeData.skills.length > 0) {
      sections.push('\nTECHNICAL SKILLS');
      sections.push('-'.repeat(20));
      sections.push(resumeData.skills.map(skill => skill.name).join(', '));
    }

    if (resumeData.projects && resumeData.projects.length > 0) {
      sections.push('\nPROJECTS');
      sections.push('-'.repeat(20));
      resumeData.projects.forEach(project => {
        sections.push(`• ${project.title}`);
        sections.push(`  ${project.description}`);
        if (project.technologies) {
          sections.push(`  Technologies: ${project.technologies.join(', ')}`);
        }
      });
    }

    sections.push(`\nGenerated on ${format(new Date(), 'PPP')}`);

    return sections.join('\n');
  }

  // Template functions for different document types
  generateBiodata(resumeData: ResumeData): string {
    const sections = [];
    
    // Header
    sections.push('BIODATA');
    sections.push('=' .repeat(50));
    sections.push('');
    
    // Personal Information
    sections.push('PERSONAL INFORMATION');
    sections.push('-'.repeat(25));
    sections.push(`Full Name: ${resumeData.fullName}`);
    sections.push(`Date of Birth: ${resumeData.dateOfBirth || 'N/A'}`);
    sections.push(`Gender: ${resumeData.gender || 'N/A'}`);
    sections.push(`Blood Group: ${resumeData.bloodGroup || 'N/A'}`);
    sections.push(`Aadhar Number: ${resumeData.aadharNumber || 'N/A'}`);
    sections.push('');
    
    // Contact Information
    sections.push('CONTACT INFORMATION');
    sections.push('-'.repeat(25));
    sections.push(`Personal Email: ${resumeData.personalEmail || 'N/A'}`);
    sections.push(`Institute Email: ${resumeData.instituteEmail}`);
    sections.push(`Contact Number: ${resumeData.contactNumber || 'N/A'}`);
    sections.push(`Address: ${resumeData.address || 'N/A'}`);
    sections.push('');
    
    // Family Information
    sections.push('FAMILY INFORMATION');
    sections.push('-'.repeat(25));
    sections.push(`Guardian Name: ${resumeData.guardianName || 'N/A'}`);
    sections.push(`Relation: ${resumeData.guardianRelation || 'N/A'}`);
    sections.push(`Guardian Contact: ${resumeData.guardianContact || 'N/A'}`);
    sections.push(`Guardian Occupation: ${resumeData.guardianOccupation || 'N/A'}`);
    if (resumeData.guardianIncome) {
      sections.push(`Annual Income: ₹${resumeData.guardianIncome.toLocaleString()}`);
    }
    sections.push('');
    
    // Academic Information
    sections.push('ACADEMIC INFORMATION');
    sections.push('-'.repeat(25));
    sections.push(`Enrollment Number: ${resumeData.enrollmentNumber}`);
    sections.push(`Program: ${resumeData.program}`);
    sections.push(`Current Semester: ${resumeData.currentSemester}`);
    if (resumeData.batch) {
      sections.push(`Batch: ${resumeData.batch}`);
    }
    sections.push('');
    
    // Academic Performance
    if (resumeData.overallCPI) {
      sections.push('ACADEMIC PERFORMANCE');
      sections.push('-'.repeat(25));
      sections.push(`Overall CPI: ${resumeData.overallCPI.toFixed(2)}`);
      if (resumeData.earnedCredits && resumeData.totalCredits) {
        sections.push(`Credits: ${resumeData.earnedCredits}/${resumeData.totalCredits}`);
      }
      sections.push('');
    }
    
    // Professional Summary
    if (resumeData.profileSummary) {
      sections.push('ABOUT ME');
      sections.push('-'.repeat(15));
      sections.push(resumeData.profileSummary);
      sections.push('');
    }
    
    // Additional Education
    if (resumeData.education && resumeData.education.length > 0) {
      sections.push('ADDITIONAL EDUCATION');
      sections.push('-'.repeat(25));
      resumeData.education.forEach(edu => {
        sections.push(`${edu.degree} in ${edu.fieldOfStudy}`);
        sections.push(`${edu.institution} (${edu.startDate} - ${edu.endDate || 'Present'})`);
        if (edu.grade) sections.push(`Grade: ${edu.grade}`);
        if (edu.description) sections.push(edu.description);
        sections.push('');
      });
    }
    
    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      sections.push('WORK EXPERIENCE');
      sections.push('-'.repeat(20));
      resumeData.experience.forEach(exp => {
        sections.push(`${exp.position} at ${exp.company}`);
        sections.push(`${exp.startDate} - ${exp.endDate || 'Present'}`);
        if (exp.description) sections.push(exp.description);
        sections.push('');
      });
    }
    
    // Skills
    if (resumeData.skills && resumeData.skills.length > 0) {
      sections.push('SKILLS');
      sections.push('-'.repeat(10));
      const skillsByCategory = resumeData.skills.reduce((acc, skill) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(`${skill.name} (${skill.proficiency})`);
        return acc;
      }, {} as Record<string, string[]>);
      
      Object.entries(skillsByCategory).forEach(([category, skills]) => {
        sections.push(`${category.toUpperCase()}: ${skills.join(', ')}`);
      });
      sections.push('');
    }
    
    // Projects
    if (resumeData.projects && resumeData.projects.length > 0) {
      sections.push('PROJECTS');
      sections.push('-'.repeat(15));
      resumeData.projects.forEach(project => {
        sections.push(`• ${project.title}`);
        sections.push(`  ${project.description}`);
        if (project.technologies) {
          sections.push(`  Technologies: ${project.technologies.join(', ')}`);
        }
        if (project.role) sections.push(`  Role: ${project.role}`);
        sections.push('');
      });
    }
    
    // Achievements
    if (resumeData.achievements && resumeData.achievements.length > 0) {
      sections.push('ACHIEVEMENTS');
      sections.push('-'.repeat(15));
      resumeData.achievements.forEach(achievement => {
        sections.push(`• ${achievement.title}`);
        sections.push(`  ${achievement.description}`);
        if (achievement.date) sections.push(`  Date: ${achievement.date}`);
        sections.push('');
      });
    }
    
    sections.push(`Generated on ${format(new Date(), 'PPP')}`);
    return sections.join('\n');
  }

  generateResume(resumeData: ResumeData): string {
    const sections = [];
    
    // Header
    sections.push(`${resumeData.fullName.toUpperCase()}`);
    sections.push('='.repeat(resumeData.fullName.length));
    sections.push('');
    
    // Contact Information
    const contactInfo = [];
    if (resumeData.personalEmail) contactInfo.push(`Email: ${resumeData.personalEmail}`);
    if (resumeData.contactNumber) contactInfo.push(`Phone: ${resumeData.contactNumber}`);
    if (resumeData.address) contactInfo.push(`Address: ${resumeData.address}`);
    sections.push(contactInfo.join(' | '));
    sections.push('');
    
    // Professional Summary
    if (resumeData.profileSummary) {
      sections.push('PROFESSIONAL SUMMARY');
      sections.push('-'.repeat(25));
      sections.push(resumeData.profileSummary);
      sections.push('');
    }
    
    // Education
    sections.push('EDUCATION');
    sections.push('-'.repeat(15));
    sections.push(`${resumeData.program} - ${resumeData.enrollmentNumber}`);
    sections.push(`Government Polytechnic Palanpur`);
    sections.push(`Current Semester: ${resumeData.currentSemester}`);
    if (resumeData.overallCPI) {
      sections.push(`CPI: ${resumeData.overallCPI.toFixed(2)}`);
    }
    sections.push('');
    
    // Additional Education
    if (resumeData.education && resumeData.education.length > 0) {
      resumeData.education.forEach(edu => {
        sections.push(`${edu.degree} in ${edu.fieldOfStudy}`);
        sections.push(`${edu.institution} (${edu.startDate} - ${edu.endDate || 'Present'})`);
        if (edu.grade) sections.push(`Grade: ${edu.grade}`);
        sections.push('');
      });
    }
    
    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      sections.push('EXPERIENCE');
      sections.push('-'.repeat(15));
      resumeData.experience.forEach(exp => {
        sections.push(`${exp.position} at ${exp.company}`);
        sections.push(`${exp.startDate} - ${exp.endDate || 'Present'}`);
        if (exp.description) sections.push(exp.description);
        sections.push('');
      });
    }
    
    // Skills
    if (resumeData.skills && resumeData.skills.length > 0) {
      sections.push('TECHNICAL SKILLS');
      sections.push('-'.repeat(20));
      const skillsByCategory = resumeData.skills.reduce((acc, skill) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(`${skill.name} (${skill.proficiency})`);
        return acc;
      }, {} as Record<string, string[]>);
      
      Object.entries(skillsByCategory).forEach(([category, skills]) => {
        sections.push(`${category.toUpperCase()}: ${skills.join(', ')}`);
      });
      sections.push('');
    }
    
    // Projects
    if (resumeData.projects && resumeData.projects.length > 0) {
      sections.push('PROJECTS');
      sections.push('-'.repeat(15));
      resumeData.projects.forEach(project => {
        sections.push(`• ${project.title}`);
        sections.push(`  ${project.description}`);
        if (project.technologies) {
          sections.push(`  Technologies: ${project.technologies.join(', ')}`);
        }
        if (project.role) sections.push(`  Role: ${project.role}`);
        sections.push('');
      });
    }
    
    // Achievements
    if (resumeData.achievements && resumeData.achievements.length > 0) {
      sections.push('ACHIEVEMENTS');
      sections.push('-'.repeat(15));
      resumeData.achievements.forEach(achievement => {
        sections.push(`• ${achievement.title}`);
        sections.push(`  ${achievement.description}`);
        if (achievement.date) sections.push(`  Date: ${achievement.date}`);
        sections.push('');
      });
    }
    
    sections.push(`Generated on ${format(new Date(), 'PPP')}`);
    return sections.join('\n');
  }

  generateCV(resumeData: ResumeData): string {
    const sections = [];
    
    // Header
    sections.push('CURRICULUM VITAE');
    sections.push('='.repeat(30));
    sections.push('');
    sections.push(`${resumeData.fullName.toUpperCase()}`);
    sections.push(`${resumeData.program} Student`);
    sections.push(`Enrollment Number: ${resumeData.enrollmentNumber}`);
    sections.push('');
    
    // Personal Information
    sections.push('PERSONAL INFORMATION');
    sections.push('-'.repeat(25));
    sections.push(`Full Name: ${resumeData.fullName}`);
    sections.push(`Date of Birth: ${resumeData.dateOfBirth || 'N/A'}`);
    sections.push(`Gender: ${resumeData.gender || 'N/A'}`);
    sections.push(`Email: ${resumeData.personalEmail || resumeData.email}`);
    sections.push(`Contact: ${resumeData.contactNumber || 'N/A'}`);
    sections.push(`Address: ${resumeData.address || 'N/A'}`);
    sections.push('');
    
    // Objective/Summary
    if (resumeData.profileSummary) {
      sections.push('OBJECTIVE');
      sections.push('-'.repeat(15));
      sections.push(resumeData.profileSummary);
      sections.push('');
    }
    
    // Education
    sections.push('EDUCATIONAL QUALIFICATIONS');
    sections.push('-'.repeat(30));
    sections.push(`Current Education:`);
    sections.push(`• ${resumeData.program}`);
    sections.push(`  Government Polytechnic Palanpur`);
    sections.push(`  Enrollment: ${resumeData.enrollmentNumber}`);
    sections.push(`  Current Semester: ${resumeData.currentSemester}`);
    if (resumeData.overallCPI) {
      sections.push(`  CPI: ${resumeData.overallCPI.toFixed(2)}`);
    }
    sections.push('');
    
    // Additional Education
    if (resumeData.education && resumeData.education.length > 0) {
      sections.push('Previous Education:');
      resumeData.education.forEach(edu => {
        sections.push(`• ${edu.degree} in ${edu.fieldOfStudy}`);
        sections.push(`  ${edu.institution}`);
        sections.push(`  Duration: ${edu.startDate} - ${edu.endDate || 'Present'}`);
        if (edu.grade) sections.push(`  Grade: ${edu.grade}`);
        if (edu.description) sections.push(`  ${edu.description}`);
        sections.push('');
      });
    }
    
    // Academic Performance
    if (resumeData.semesterResults && resumeData.semesterResults.length > 0) {
      sections.push('ACADEMIC PERFORMANCE');
      sections.push('-'.repeat(25));
      resumeData.semesterResults.forEach(semester => {
        sections.push(`Semester ${semester.semester}: SGPA ${semester.sgpa} (${semester.credits} credits)`);
      });
      sections.push('');
    }
    
    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      sections.push('PROFESSIONAL EXPERIENCE');
      sections.push('-'.repeat(25));
      resumeData.experience.forEach(exp => {
        sections.push(`${exp.position}`);
        sections.push(`${exp.company} | ${exp.startDate} - ${exp.endDate || 'Present'}`);
        if (exp.description) sections.push(exp.description);
        sections.push('');
      });
    }
    
    // Projects
    if (resumeData.projects && resumeData.projects.length > 0) {
      sections.push('PROJECTS');
      sections.push('-'.repeat(15));
      resumeData.projects.forEach(project => {
        sections.push(`${project.title}`);
        sections.push(`${project.description}`);
        if (project.technologies) {
          sections.push(`Technologies: ${project.technologies.join(', ')}`);
        }
        if (project.role) sections.push(`Role: ${project.role}`);
        if (project.duration) sections.push(`Duration: ${project.duration}`);
        sections.push('');
      });
    }
    
    // Skills
    if (resumeData.skills && resumeData.skills.length > 0) {
      sections.push('TECHNICAL SKILLS');
      sections.push('-'.repeat(20));
      const skillsByCategory = resumeData.skills.reduce((acc, skill) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(`${skill.name} (${skill.proficiency})`);
        return acc;
      }, {} as Record<string, string[]>);
      
      Object.entries(skillsByCategory).forEach(([category, skills]) => {
        sections.push(`${category.charAt(0).toUpperCase() + category.slice(1)}:`);
        skills.forEach(skill => sections.push(`  • ${skill}`));
        sections.push('');
      });
    }
    
    // Achievements
    if (resumeData.achievements && resumeData.achievements.length > 0) {
      sections.push('ACHIEVEMENTS & AWARDS');
      sections.push('-'.repeat(25));
      resumeData.achievements.forEach(achievement => {
        sections.push(`• ${achievement.title}`);
        sections.push(`  ${achievement.description}`);
        if (achievement.date) sections.push(`  Date: ${achievement.date}`);
        sections.push('');
      });
    }
    
    sections.push(`Generated on ${format(new Date(), 'PPP')}`);
    return sections.join('\n');
  }

  /**
   * Utility function to escape HTML entities
   */
  private escapeHtml(text: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    return text.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
  }

  /**
   * Utility function to format dates consistently
   */
  private formatDate(dateString?: string): string {
    if (!dateString) return 'Present';
    
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'MMM yyyy');
      }
    } catch {
      // If parsing fails, return the original string
    }
    
    return dateString;
  }

  /**
   * Utility function to generate skill proficiency indicators
   */
  private getSkillProficiencyIndicator(proficiency: string): string {
    const level = proficiency.toLowerCase();
    switch (level) {
      case 'expert':
      case 'advanced':
        return '⭐⭐⭐⭐⭐';
      case 'intermediate':
        return '⭐⭐⭐⭐';
      case 'beginner':
      case 'basic':
        return '⭐⭐⭐';
      default:
        return '⭐⭐⭐⭐';
    }
  }

  /**
   * Utility function to truncate text with ellipsis
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Utility function to clean and validate URLs
   */
  private formatUrl(url?: string): string {
    if (!url) return '';
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    
    return url;
  }
}

export const resumeGenerator = new ResumeGenerator();