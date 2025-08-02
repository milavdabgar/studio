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
  phone?: string; // Alias for contactNumber
  address?: string;
  city?: string;
  state?: string;
  nationality?: string;
  religion?: string;
  caste?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  aadharNumber?: string;
  photoURL?: string;
  languagesKnown?: string;
  hobbies?: string;
  
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
  educationHistory?: Array<{
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
    location?: string;
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
    title?: string; // Alias for name
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
            background: #f5f5f5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 20px;
        }
        
        .resume-container {
            background: white;
            max-width: 800px;
            margin: 0 auto;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .resume-container {
                max-width: 100%;
                border-radius: 0;
                box-shadow: none;
            }
            
            .header {
                flex-direction: column;
                text-align: center;
                padding: 20px;
            }
            
            .header-photo {
                margin-bottom: 15px;
            }
            
            .project-grid {
                grid-template-columns: 1fr;
            }
            
            .performance-stats {
                flex-direction: column;
                gap: 10px;
            }
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
                                ${Array.isArray(skills) ? skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('') : `<span class="skill-tag">${skills}</span>`}
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
    const htmlContent = this.generateBiodataHTMLContent(resumeData);
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
    const htmlContent = this.generateCVHTMLContent(resumeData);
    return this.generatePDFFromHTML(htmlContent);
  }

  /**
   * Convert relative photo URLs to absolute URLs for HTML export
   */
  private convertPhotoURLsForHTML(htmlContent: string): string {
    // For HTML export, convert relative URLs to absolute URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Handle both student photos (/uploads/photos/) and faculty photos (/uploads/faculty/)
    return htmlContent
      .replace(
        /src="\/uploads\/photos\/([^"]+)"/g,
        `src="${baseUrl}/uploads/photos/$1"`
      )
      .replace(
        /src="\/uploads\/faculty\/([^"]+)"/g,
        `src="${baseUrl}/uploads/faculty/$1"`
      );
  }

  /**
   * Convert relative photo URLs to absolute file paths for PDF generation
   */
  private convertPhotoURLsForPDF(htmlContent: string): string {
    const fs = require('fs');
    
    // Helper function to convert photo URL to base64
    const convertToBase64 = (match: string, folder: string, filename: string) => {
      const absolutePath = path.join(process.cwd(), 'public', 'uploads', folder, filename);
      
      // Check if file exists
      if (fs.existsSync(absolutePath)) {
        try {
          // Read the file and convert to base64
          const fileBuffer = fs.readFileSync(absolutePath);
          const base64Data = fileBuffer.toString('base64');
          
          // Determine MIME type based on file extension
          const extension = path.extname(filename).toLowerCase();
          let mimeType = 'image/jpeg'; // default
          if (extension === '.png') mimeType = 'image/png';
          else if (extension === '.gif') mimeType = 'image/gif';
          else if (extension === '.webp') mimeType = 'image/webp';
          
          const dataUrl = `data:${mimeType};base64,${base64Data}`;
          console.log(`Converting photo URL: ${match} -> base64 data URL (${Math.round(base64Data.length/1024)}KB)`);
          return `src="${dataUrl}"`;
        } catch (error) {
          console.error(`Error reading photo file ${absolutePath}:`, error);
          return match;
        }
      } else {
        console.log(`Photo file not found: ${absolutePath}`);
        // Return a placeholder or the original URL
        return match;
      }
    };
    
    // Convert both student and faculty photo URLs to base64 data URLs
    return htmlContent
      .replace(
        /src="\/uploads\/photos\/([^"]+)"/g,
        (match, filename) => convertToBase64(match, 'photos', filename)
      )
      .replace(
        /src="\/uploads\/faculty\/([^"]+)"/g,
        (match, filename) => convertToBase64(match, 'faculty', filename)
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
    const htmlContent = this.generateResumeHTML(resumeData);
    return this.convertPhotoURLsForHTML(htmlContent);
  }

  /**
   * Generate biodata in HTML format
   */
  generateBiodataHTML(resumeData: ResumeData): string {
    const htmlContent = this.generateBiodataHTMLContent(resumeData);
    return this.convertPhotoURLsForHTML(htmlContent);
  }

  /**
   * Generate CV in HTML format
   */
  generateCVHTML(resumeData: ResumeData): string {
    const htmlContent = this.generateCVHTMLContent(resumeData);
    return this.convertPhotoURLsForHTML(htmlContent);
  }

  /**
   * Generate biodata HTML with professional styling
   */
  generateBiodataHTMLContent(resumeData: ResumeData): string {
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
            background: #f5f5f5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .container {
                max-width: 100%;
                border-radius: 0;
                box-shadow: none;
            }
            
            .header {
                flex-direction: column;
                text-align: center;
                padding: 20px;
            }
            
            .photo-section {
                margin-bottom: 15px;
            }
            
            .biodata-table {
                font-size: 10pt;
            }
            
            .skills-grid {
                grid-template-columns: 1fr;
            }
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
            color: #1e3a8a;
            width: 35%;
            background-color: #eff6ff !important;
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
            color: #1e3a8a;
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
    <div class="container">
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
                        ${Array.isArray(skills) ? skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('') : `<span class="skill-tag">${skills}</span>`}
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
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate CV HTML with professional styling
   */
  generateCVHTMLContent(resumeData: ResumeData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${resumeData.fullName} - Curriculum Vitae</title>
    <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4;
            margin: 0.75in;
            @top-center {
                content: "${resumeData.fullName} - Curriculum Vitae";
                font-size: 8pt;
                color: #666;
                font-family: 'Inter', sans-serif;
            }
            @bottom-center {
                content: "Page " counter(page) " of " counter(pages);
                font-size: 8pt;
                color: #666;
                font-family: 'Inter', sans-serif;
            }
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Crimson Text', 'Times New Roman', serif;
            line-height: 1.6;
            color: #2c3e50;
            font-size: 11pt;
            background: #f5f5f5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
            padding: 0;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .container {
                max-width: 100%;
                border-radius: 0;
                box-shadow: none;
            }
            
            .header {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 20pt;
            }
            
            .info-table {
                font-size: 10pt;
            }
            
            .skills-grid {
                grid-template-columns: 1fr;
            }
            
            .performance-stats {
                flex-direction: column;
                gap: 10px;
            }
        }
        
        /* Header Section */
            .header {
                text-align: center;
                margin-bottom: 20pt;
                padding: 20pt;
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                color: white;
                page-break-inside: avoid;
                page-break-after: avoid;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }        .photo-section {
            margin-bottom: 16pt;
        }
        
        .photo {
            width: 90pt;
            height: 110pt;
            border-radius: 8pt;
            object-fit: cover;
            border: 3pt solid white;
            box-shadow: 0 4pt 8pt rgba(0,0,0,0.2);
            margin: 0 auto;
            display: block;
        }
        
        .photo-placeholder {
            width: 90pt;
            height: 110pt;
            border: 3pt solid white;
            border-radius: 8pt;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9pt;
            color: rgba(255,255,255,0.7);
            background: rgba(255,255,255,0.1);
            text-align: center;
            line-height: 1.2;
            margin: 0 auto;
        }
        
        .header h1 {
            font-family: 'Inter', sans-serif;
            font-size: 24pt;
            font-weight: 700;
            margin-bottom: 6pt;
            letter-spacing: 1pt;
            text-transform: uppercase;
        }
        
        .header-subtitle {
            font-size: 14pt;
            font-weight: 600;
            margin-bottom: 16pt;
            opacity: 0.9;
            letter-spacing: 0.5pt;
        }
        
        .contact-info {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 20pt;
            font-size: 10pt;
            font-weight: 500;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            opacity: 0.95;
        }
        
        .contact-item strong {
            margin-right: 6pt;
        }
        
        /* Section Styles */
        .section {
            margin-bottom: 24pt;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-family: 'Inter', sans-serif;
            background: #1e40af;
            color: white;
            padding: 10pt 14pt;
            font-size: 12pt;
            font-weight: 700;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1pt;
            margin-bottom: 16pt;
            page-break-after: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        /* Table Styles */
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16pt;
            border: 1pt solid #bdc3c7;
        }
        
        .info-table th {
            background: #1e40af;
            color: white;
            padding: 8pt 12pt;
            font-family: 'Inter', sans-serif;
            font-size: 10pt;
            text-align: center;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            border: 1pt solid #1e3a8a;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .info-table td {
            padding: 8pt 12pt;
            border: 1pt solid #bdc3c7;
            vertical-align: top;
            font-size: 10pt;
        }
        
        .info-table tr:nth-child(even) {
            background-color: #f8f9fa;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .label-col {
            font-weight: 600;
            color: #1e3a8a;
            width: 35%;
            background-color: #eff6ff !important;
            font-family: 'Inter', sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .value-col {
            color: #34495e;
            font-weight: 400;
        }
        
        /* Academic Performance */
        .academic-performance {
            background: #e0f2fe;
            color: #0c4a6e;
            padding: 16pt;
            margin: 16pt 0;
            text-align: center;
            border-radius: 8pt;
            border: 2pt solid #0ea5e9;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .performance-stats {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 16pt;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-value {
            font-size: 16pt;
            font-weight: 700;
            display: block;
            margin-bottom: 4pt;
            color: #0ea5e9;
        }
        
        .stat-label {
            font-size: 9pt;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
        }
        
        /* Education & Experience Items */
        .education-item, .experience-item, .project-item {
            margin-bottom: 16pt;
            padding: 12pt;
            background: #f8fafc;
            border-left: 4pt solid #0ea5e9;
            border-radius: 0 6pt 6pt 0;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        /* Timeline Layout */
        .timeline {
            position: relative;
            padding-left: 20pt;
        }
        
        .timeline-item {
            position: relative;
            margin-bottom: 20pt;
        }
        
        .timeline-item::before {
            content: '';
            position: absolute;
            left: -25pt;
            top: 5pt;
            width: 8pt;
            height: 8pt;
            background: #0ea5e9;
            border-radius: 50%;
            border: 2pt solid white;
            box-shadow: 0 0 0 2pt #0ea5e9;
        }
        
        .timeline-title {
            font-family: 'Inter', sans-serif;
            font-size: 12pt;
            font-weight: 600;
            color: #1e3a8a;
            margin-bottom: 4pt;
        }
        
        .item-title {
            font-family: 'Inter', sans-serif;
            font-size: 12pt;
            font-weight: 600;
            color: #1e3a8a;
            margin-bottom: 4pt;
        }
        
        .item-details {
            font-size: 10pt;
            color: #7f8c8d;
            margin-bottom: 6pt;
            font-weight: 500;
        }
        
        .item-description {
            font-size: 10pt;
            color: #34495e;
            line-height: 1.5;
        }
        
        .grade-highlight {
            color: #0ea5e9;
            font-weight: 600;
        }
        
        /* Skills Section */
        .skills-section {
            background: #f8f9fa;
            padding: 16pt;
            margin: 16pt 0;
            border-radius: 8pt;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150pt, 1fr));
            gap: 12pt;
        }
        
        .skill-category {
            background: white;
            padding: 10pt;
            border-left: 3pt solid #1e40af;
            border-radius: 0 4pt 4pt 0;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .skill-category h4 {
            font-family: 'Inter', sans-serif;
            color: #1e3a8a;
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
            background: #1e40af;
            color: white;
            padding: 2pt 6pt;
            border-radius: 10pt;
            font-size: 8pt;
            font-weight: 500;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        /* Achievements */
        .achievement-item {
            margin-bottom: 12pt;
            padding: 10pt;
            background: #ecfdf5;
            border-left: 4pt solid #10b981;
            border-radius: 0 4pt 4pt 0;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .achievement-title {
            font-family: 'Inter', sans-serif;
            font-size: 11pt;
            font-weight: 600;
            color: #1e3a8a;
            margin-bottom: 4pt;
        }
        
        .achievement-description {
            font-size: 10pt;
            color: #34495e;
            line-height: 1.4;
            margin-bottom: 4pt;
        }
        
        .achievement-date {
            font-size: 9pt;
            color: #059669;
            font-weight: 500;
        }
        
        /* Semester Results */
        .semester-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300pt, 1fr));
            gap: 16pt;
            margin-bottom: 24pt;
        }
        
        .semester-item, .semester-card {
            margin-bottom: 16pt;
            border: 1pt solid #bdc3c7;
            border-radius: 6pt;
            overflow: hidden;
            page-break-inside: avoid;
            transition: transform 0.2s;
        }
        
        .semester-card:hover {
            transform: translateY(-2px);
        }
        
        .semester-card .semester-item:hover {
            transform: translateY(-2px);
        }
        
        .semester-header {
            background: #1e40af;
            color: white;
            padding: 8pt 12pt;
            font-family: 'Inter', sans-serif;
            font-size: 10pt;
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .semester-title {
            text-transform: uppercase;
            letter-spacing: 0.5pt;
        }
        
        .semester-sgpa {
            font-size: 11pt;
            font-weight: 700;
        }
        
        .subjects-grid {
            padding: 12pt;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200pt, 1fr));
            gap: 6pt;
        }
        
        .subject-item {
            display: flex;
            justify-content: space-between;
            padding: 4pt 0;
            border-bottom: 1pt dotted #bdc3c7;
            font-size: 9pt;
        }
        
        .subject-item:last-child {
            border-bottom: none;
        }
        
        .subject-name {
            color: #1e3a8a;
            font-weight: 500;
        }
        
        .subject-grade {
            color: #0ea5e9;
            font-weight: 600;
        }
        
        /* Declaration */
        .declaration {
            background: #fff3cd;
            border: 2pt solid #f39c12;
            padding: 16pt;
            margin-top: 20pt;
            text-align: center;
            border-radius: 8pt;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .declaration p {
            font-size: 10pt;
            color: #856404;
            line-height: 1.5;
            margin-bottom: 10pt;
        }
        
        .declaration .signature {
            margin-top: 16pt;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .signature-left, .signature-right {
            font-size: 9pt;
            color: #856404;
        }
        
        .signature-line {
            border-top: 1pt solid #856404;
            width: 100pt;
            margin-top: 6pt;
        }
        
        /* Footer */
        .footer {
            margin-top: 24pt;
            text-align: center;
            font-size: 9pt;
            color: #6b7280;
            border-top: 1pt solid #e5e7eb;
            padding-top: 12pt;
        }
        
        /* Print optimizations */
        @media print {
            body {
                font-size: 10pt;
                line-height: 1.4;
            }
            
            .header h1 {
                font-size: 20pt;
            }
            
            .header-subtitle {
                font-size: 12pt;
            }
            
            .section-title {
                font-size: 11pt;
            }
            
            .item-title {
                font-size: 11pt;
            }
            
            .achievement-title {
                font-size: 10pt;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <div class="header">
            <div class="photo-section">
                ${resumeData.photoURL ? 
                    `<img src="${resumeData.photoURL}" alt="Profile Photo" class="photo">` :
                    `<div class="photo-placeholder">Photo</div>`
                }
            </div>
            <h1>${resumeData.fullName}</h1>
            <div class="header-subtitle">CURRICULUM VITAE</div>
            <div class="contact-info">
                <div class="contact-item">
                    <strong>Email:</strong> ${resumeData.email}
                </div>
                <div class="contact-item">
                    <strong>Phone:</strong> ${resumeData.phone || resumeData.contactNumber}
                </div>
                ${resumeData.linkedinUrl ? `<div class="contact-item"><strong>LinkedIn:</strong> ${resumeData.linkedinUrl}</div>` : ''}
                ${resumeData.portfolioWebsite ? `<div class="contact-item"><strong>Portfolio:</strong> ${resumeData.portfolioWebsite}</div>` : ''}
            </div>
        </div>

        <!-- Personal Information -->
        <div class="section">
            <h2 class="section-title">Personal Information</h2>
            <table class="info-table">
                <tr>
                    <td class="label-col">Full Name</td>
                    <td class="value-col">${resumeData.fullName}</td>
                </tr>
                <tr>
                    <td class="label-col">Enrollment Number</td>
                    <td class="value-col">${resumeData.enrollmentNumber}</td>
                </tr>
                <tr>
                    <td class="label-col">Date of Birth</td>
                    <td class="value-col">${resumeData.dateOfBirth ? format(new Date(resumeData.dateOfBirth), 'PPP') : 'N/A'}</td>
                </tr>
                <tr>
                    <td class="label-col">Gender</td>
                    <td class="value-col">${resumeData.gender || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="label-col">Address</td>
                    <td class="value-col">${resumeData.address || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="label-col">City</td>
                    <td class="value-col">${resumeData.city || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="label-col">State</td>
                    <td class="value-col">${resumeData.state || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="label-col">Nationality</td>
                    <td class="value-col">${resumeData.nationality || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="label-col">Caste</td>
                    <td class="value-col">${resumeData.caste || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="label-col">Religion</td>
                    <td class="value-col">${resumeData.religion || 'N/A'}</td>
                </tr>
            </table>
        </div>

        ${resumeData.careerObjective ? `
        <!-- Career Objective -->
        <div class="section">
            <h2 class="section-title">Career Objective</h2>
            <table class="info-table">
                <tr>
                    <td class="label-col">Objective</td>
                    <td class="value-col">${resumeData.careerObjective}</td>
                </tr>
            </table>
        </div>
        ` : ''}

        ${resumeData.profileSummary ? `
        <!-- Profile Summary -->
        <div class="section">
            <h2 class="section-title">Profile Summary</h2>
            <table class="info-table">
                <tr>
                    <td class="label-col">Summary</td>
                    <td class="value-col">${resumeData.profileSummary}</td>
                </tr>
            </table>
        </div>
        ` : ''}

        <!-- Academic Information -->
        <div class="section">
            <h2 class="section-title">Academic Information</h2>
            <table class="info-table">
                <tr>
                    <td class="label-col">Program</td>
                    <td class="value-col">${resumeData.program}${resumeData.programCode ? ` (${resumeData.programCode})` : ''}</td>
                </tr>
                <tr>
                    <td class="label-col">Current Semester</td>
                    <td class="value-col">${resumeData.currentSemester}</td>
                </tr>
                <tr>
                    <td class="label-col">Institute Email</td>
                    <td class="value-col">${resumeData.instituteEmail}</td>
                </tr>
                ${resumeData.batch ? `
                <tr>
                    <td class="label-col">Batch</td>
                    <td class="value-col">${resumeData.batch}</td>
                </tr>
                ` : ''}
            </table>
        </div>

        <!-- Academic Performance -->
        ${resumeData.overallCPI || resumeData.earnedCredits || resumeData.totalCredits ? `
        <div class="academic-stats">
            <div class="academic-performance">
                <div class="stats-grid">
                    <div class="performance-stats">
                        ${resumeData.overallCPI ? `
                        <div class="stat-item">
                            <span class="stat-value">${resumeData.overallCPI}</span>
                            <span class="stat-label">Overall CPI</span>
                        </div>
                        ` : ''}
                        ${resumeData.earnedCredits && resumeData.totalCredits ? `
                        <div class="stat-item">
                            <span class="stat-value">${resumeData.earnedCredits}/${resumeData.totalCredits}</span>
                            <span class="stat-label">Credits Earned</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Education -->
        ${resumeData.educationHistory && resumeData.educationHistory.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Educational Qualifications</h2>
            ${resumeData.educationHistory.map(edu => `
            <div class="education-item">
                <div class="item-title">${edu.degree}</div>
                <div class="item-details">
                    <strong>${edu.institution}</strong> | ${edu.startDate} - ${edu.endDate || 'Present'}
                </div>
                ${edu.grade ? `<div class="item-description">Grade: <span class="grade-highlight">${edu.grade}</span></div>` : ''}
                ${edu.description ? `<div class="item-description">${edu.description}</div>` : ''}
            </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Semester Results -->
        ${resumeData.semesterResults && resumeData.semesterResults.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Academic Performance</h2>
            <div class="semester-grid">
                ${resumeData.semesterResults.map(semester => `
                <div class="semester-card" style="transition: transform 0.2s;">
                    <div class="semester-item">
                        <div class="semester-header">
                            <span class="semester-title">Semester ${semester.semester}</span>
                            <span class="semester-sgpa">SGPA: ${semester.sgpa}</span>
                        </div>
                        ${semester.subjects && semester.subjects.length > 0 ? `
                        <div class="subjects-grid">
                            ${semester.subjects.map(subject => `
                            <div class="subject-item">
                                <span class="subject-name">${subject.name}</span>
                                <span class="subject-grade">${subject.grade}</span>
                            </div>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Professional Experience -->
        ${resumeData.experience && resumeData.experience.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Professional Experience</h2>
            <div class="timeline">
                ${resumeData.experience.map(exp => `
                <div class="timeline-item">
                    <div class="experience-item">
                        <div class="timeline-title">${exp.position}</div>
                        <div class="item-details">
                            <strong>${exp.company}</strong> | ${exp.startDate} - ${exp.endDate || 'Present'}
                        </div>
                        ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Projects -->
        ${resumeData.projects && resumeData.projects.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Projects</h2>
            ${resumeData.projects.map(project => `
            <div class="project-item">
                <div class="item-title">${project.title}</div>
                <div class="item-details">
                    ${project.duration ? `Duration: ${project.duration}` : ''}
                    ${project.role ? ` | Role: ${project.role}` : ''}
                </div>
                ${project.description ? `<div class="item-description">${project.description}</div>` : ''}
                ${project.technologies && project.technologies.length > 0 ? `
                <div class="item-details">Technologies: ${project.technologies.join(', ')}</div>
                ` : ''}
            </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Skills -->
        ${resumeData.skills && resumeData.skills.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Technical Expertise</h2>
            <div class="skills-section">
                <div class="skills-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150pt, 1fr)); gap: 12pt; flex-wrap: wrap;">
                    ${Object.entries(resumeData.skills.reduce((acc, skill) => {
                        if (!acc[skill.category]) acc[skill.category] = [];
                        acc[skill.category].push(skill.name);
                        return acc;
                    }, {} as Record<string, string[]>)).map(([category, skills]) => `
                    <div class="skill-category">
                        <h4>${category}</h4>
                        <div class="skill-tags">
                            ${Array.isArray(skills) ? skills.map(skill => `<span class="skill-item"><span class="skill-tag">${skill}</span></span>`).join('') : `<span class="skill-item"><span class="skill-tag">${skills}</span></span>`}
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Achievements -->
        ${resumeData.achievements && resumeData.achievements.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Achievements & Awards</h2>
            ${resumeData.achievements.map(achievement => `
            <div class="achievement-item">
                <div class="achievement-title">${achievement.title}</div>
                ${achievement.description ? `<div class="achievement-description">${achievement.description}</div>` : ''}
                <div class="achievement-date">${achievement.date ? format(new Date(achievement.date), 'PPP') : ''}</div>
            </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Certifications -->
        ${resumeData.certifications && resumeData.certifications.length > 0 ? `
        <div class="section">
            <h2 class="section-title">Certifications</h2>
            ${resumeData.certifications.map(cert => `
            <div class="achievement-item">
                <div class="achievement-title">${cert.title || cert.name}</div>
                <div class="achievement-description">Issuer: ${cert.issuer}</div>
                <div class="achievement-date">${cert.date ? format(new Date(cert.date), 'PPP') : ''}</div>
            </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Guardian Information -->
        ${resumeData.guardianName ? `
        <div class="section">
            <h2 class="section-title">Guardian Information</h2>
            <table class="info-table">
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
                    <td class="label-col">Contact</td>
                    <td class="value-col">${resumeData.guardianContact}</td>
                </tr>
                ` : ''}
                ${resumeData.guardianOccupation ? `
                <tr>
                    <td class="label-col">Occupation</td>
                    <td class="value-col">${resumeData.guardianOccupation}</td>
                </tr>
                ` : ''}
            </table>
        </div>
        ` : ''}

        <!-- Declaration -->
        <div class="declaration">
            <p><strong>DECLARATION</strong></p>
            <p>I hereby declare that the information provided in this Curriculum Vitae is true and correct to the best of my knowledge and belief. I understand that any false information may lead to rejection of my candidature or cancellation of admission.</p>
            <div class="signature">
                <div class="signature-left">
                    <div>Date: ${format(new Date(), 'PPP')}</div>
                    <div>Place: ${resumeData.city || '_____________'}</div>
                </div>
                <div class="signature-right">
                    <div class="signature-line"></div>
                    <div>${resumeData.fullName}</div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Generated on ${format(new Date(), 'PPP')} | Professional Curriculum Vitae</p>
        </div>
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

  /**
   * Generate Resume LaTeX template
   */
  generateResumeLatex(resumeData: ResumeData): string {
    const skillsText = resumeData.skills && resumeData.skills.length > 0 
      ? resumeData.skills.map(skill => `${skill.name} (${skill.proficiency})`).join(', ')
      : 'Not specified';

    const experienceItems = resumeData.experience && resumeData.experience.length > 0
      ? resumeData.experience.map(exp => `
\\resumeSubheading
{${this.escapeLatex(exp.position)}}{${this.escapeLatex(exp.startDate)} -- ${this.escapeLatex(exp.endDate || 'Present')}}
{${this.escapeLatex(exp.company)}}{${this.escapeLatex(exp.location || '')}}
\\resumeItemListStart
\\resumeItem{${this.escapeLatex(exp.description || '')}}
\\resumeItemListEnd`).join('')
      : '';

    const projectItems = resumeData.projects && resumeData.projects.length > 0
      ? resumeData.projects.map(project => `
\\resumeProjectHeading
{\\textbf{${this.escapeLatex(project.title)}} \\textit{| ${project.technologies ? project.technologies.join(', ') : ''}}}{${this.escapeLatex(project.duration || '')}}
\\resumeItemListStart
\\resumeItem{${this.escapeLatex(project.description || '')}}
\\resumeItemListEnd`).join('')
      : '';

    const educationItems = resumeData.education && resumeData.education.length > 0
      ? resumeData.education.map(edu => `
\\resumeSubheading
{${this.escapeLatex(edu.degree)} in ${this.escapeLatex(edu.fieldOfStudy)}}{${this.escapeLatex(edu.startDate)} -- ${this.escapeLatex(edu.endDate || 'Present')}}
{${this.escapeLatex(edu.institution)}}{${this.escapeLatex(edu.grade || '')}}
${edu.description ? `\\resumeItemListStart\\resumeItem{${this.escapeLatex(edu.description)}}\\resumeItemListEnd` : ''}`).join('')
      : '';

    return `%-------------------------
% Professional Resume
% Generated with GPP Studio
% Compiled with XeLaTeX for best results
%-------------------------

\\documentclass[11pt,a4paper]{article}

% Packages for XeLaTeX
\\usepackage{fontspec}
\\usepackage{xunicode}
\\usepackage{xltxtra}

% Modern fonts
\\setmainfont{Liberation Serif}[Scale=1.0]
\\setsansfont{Liberation Sans}[Scale=1.0]
\\setmonofont{Liberation Mono}[Scale=1.0]

% Packages
\\usepackage[top=0.5in, bottom=0.5in, left=0.6in, right=0.6in]{geometry}
\\usepackage{xcolor}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{multicol}
\\usepackage{fontawesome5}
\\usepackage{hyperref}
\\usepackage{tikz}
\\usepackage{array}

% Colors
\\definecolor{primary}{RGB}{0, 79, 144}
\\definecolor{secondary}{RGB}{45, 45, 45}
\\definecolor{lightgray}{RGB}{248, 248, 248}
\\definecolor{mediumgray}{RGB}{128, 128, 128}

% Hyperref setup
\\hypersetup{
    colorlinks=true,
    linkcolor=primary,
    urlcolor=primary,
    pdfauthor={${this.escapeLatex(resumeData.fullName)}},
    pdftitle={Resume - ${this.escapeLatex(resumeData.fullName)}},
    pdfsubject={Professional Resume}
}

% Remove page numbers
\\pagestyle{empty}

% Custom section formatting
\\titleformat{\\section}
    {\\color{primary}\\large\\sffamily\\bfseries}
    {}
    {0em}
    {}[{\\color{primary}\\titlerule[1pt]\\vspace{-2pt}}]

% Improved spacing
\\titlespacing*{\\section}{0pt}{8pt}{4pt}

% Custom commands
\\newcommand{\\resumeItem}[1]{
    \\item\\footnotesize{#1 \\vspace{-1pt}}
}

\\newcommand{\\resumeSubheading}[4]{
    \\vspace{-1pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
        \\textbf{\\footnotesize\\color{secondary}#1} & \\textbf{\\color{mediumgray}\\footnotesize #2} \\\\
        \\textit{\\footnotesize\\color{primary}#3} & \\textit{\\footnotesize\\color{mediumgray} #4} \\\\
    \\end{tabular*}\\vspace{-2pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\vspace{-1pt}\\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
        \\footnotesize\\textbf{\\color{secondary}#1} & \\textbf{\\color{mediumgray}\\footnotesize #2} \\\\
    \\end{tabular*}\\vspace{-2pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}[leftmargin=0.25in]}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-3pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%
%-------------------------------------------

\\begin{document}

% Header
\\begin{center}
    {\\Large\\sffamily\\bfseries\\color{primary} ${this.escapeLatex(resumeData.fullName)}}
    
    \\vspace{3pt}
    {\\normalsize\\sffamily\\color{secondary} ${this.escapeLatex(resumeData.program || 'Student')}}
    
    \\vspace{3pt}
    \\footnotesize
    \\faIcon{envelope}\\,\\href{mailto:${resumeData.email}}{\\color{primary}${resumeData.email}} \\$\\bullet\\$
    \\faIcon{phone}\\,${resumeData.contactNumber || 'N/A'} \\$\\bullet\\$
    ${resumeData.linkedinUrl ? `\\faIcon{linkedin}\\,\\href{${resumeData.linkedinUrl}}{\\color{primary}LinkedIn} \\$\\bullet\\$` : ''}
    ${resumeData.portfolioWebsite ? `\\faIcon{globe}\\,\\href{${resumeData.portfolioWebsite}}{\\color{primary}Portfolio}` : ''}
    
    \\vspace{2pt}
    \\footnotesize\\color{mediumgray}
    ${resumeData.city || 'Location'}, ${resumeData.state || 'State'} \\$\\bullet\\$ ${resumeData.enrollmentNumber || 'N/A'}
\\end{center}

\\vspace{-8pt}

${resumeData.profileSummary ? `
%----------- PROFESSIONAL SUMMARY -----------
\\section{Professional Summary}
\\footnotesize
${this.escapeLatex(resumeData.profileSummary)}

\\vspace{-2pt}
` : ''}

${resumeData.experience && resumeData.experience.length > 0 ? `
%----------- PROFESSIONAL EXPERIENCE -----------
\\section{Professional Experience}
\\resumeSubHeadingListStart
${experienceItems}
\\resumeSubHeadingListEnd

\\vspace{-2pt}
` : ''}

%----------- EDUCATION -----------
\\section{Education}
\\resumeSubHeadingListStart

\\resumeSubheading
{${this.escapeLatex(resumeData.program || 'Program')}}{${this.escapeLatex(resumeData.currentSemester ? `Semester ${resumeData.currentSemester}` : 'Current')}}
{Government Polytechnic Palanpur}{${resumeData.overallCPI ? `CPI: ${resumeData.overallCPI}` : 'In Progress'}}
${educationItems}

\\resumeSubHeadingListEnd

\\vspace{-2pt}

%----------- TECHNICAL SKILLS -----------
\\section{Technical Skills}
\\footnotesize
${skillsText}

\\vspace{-2pt}

${resumeData.projects && resumeData.projects.length > 0 ? `
%----------- KEY PROJECTS -----------
\\section{Key Projects}
\\resumeSubHeadingListStart
${projectItems}
\\resumeSubHeadingListEnd

\\vspace{-2pt}
` : ''}

${resumeData.achievements && resumeData.achievements.length > 0 ? `
%----------- ACHIEVEMENTS -----------
\\section{Achievements}
\\footnotesize
\\begin{itemize}[leftmargin=0.15in, label={}, itemsep=1pt]
${resumeData.achievements.map(achievement => `    \\item ${this.escapeLatex(achievement.title)}: ${this.escapeLatex(achievement.description)}`).join('\n')}
\\end{itemize}
` : ''}

\\end{document}`;
  }

  /**
   * Generate Biodata LaTeX template
   */
  generateBiodataLatex(resumeData: ResumeData): string {
    return `%-------------------------
% Professional Biodata
% Generated with GPP Studio
% Compiled with XeLaTeX for best results
%-------------------------

\\documentclass[11pt,a4paper]{article}

% Packages for XeLaTeX
\\usepackage{fontspec}
\\usepackage{xunicode}
\\usepackage{xltxtra}

% Modern fonts
\\setmainfont{Liberation Serif}[Scale=1.0]
\\setsansfont{Liberation Sans}[Scale=1.0]

% Packages
\\usepackage[top=0.8in, bottom=0.8in, left=0.8in, right=0.8in]{geometry}
\\usepackage{xcolor}
\\usepackage{fontawesome5}
\\usepackage{hyperref}
\\usepackage{tikz}
\\usepackage{tabularx}
\\usepackage{array}
\\usepackage{colortbl}

% Colors
\\definecolor{primary}{RGB}{0, 79, 144}
\\definecolor{secondary}{RGB}{45, 45, 45}
\\definecolor{lightgray}{RGB}{240, 240, 240}

% Hyperref setup
\\hypersetup{
    colorlinks=true,
    linkcolor=primary,
    urlcolor=primary,
    pdfauthor={${this.escapeLatex(resumeData.fullName)}},
    pdftitle={Biodata - ${this.escapeLatex(resumeData.fullName)}},
    pdfsubject={Professional Biodata}
}

% Remove page numbers
\\pagestyle{empty}

%-------------------------------------------
%%%%%%  BIODATA STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%
%-------------------------------------------

\\begin{document}

% Header with photo
\\begin{center}
    \\begin{tabular}{c}
        % Profile photo placeholder
        ${resumeData.photoURL ? `
        \\begin{tikzpicture}
            \\clip (0,0) circle (1.5cm);
            \\node at (0,0) {\\includegraphics[width=3cm, height=3cm, keepaspectratio]{${resumeData.photoURL}}};
            \\draw[primary, line width=2pt] (0,0) circle (1.5cm);
        \\end{tikzpicture} \\\\[10pt]
        ` : `
        \\begin{tikzpicture}
            \\draw[primary, line width=2pt] (0,0) circle (1.5cm);
            \\node at (0,0) {\\footnotesize Photo};
        \\end{tikzpicture} \\\\[10pt]
        `}
        
        {\\Large\\sffamily\\bfseries\\color{primary} BIODATA} \\\\[5pt]
        {\\huge\\sffamily\\bfseries\\color{secondary} ${this.escapeLatex(resumeData.fullName)}}
    \\end{tabular}
\\end{center}

\\vspace{15pt}

% Personal Information Table
\\renewcommand{\\arraystretch}{1.5}
\\begin{tabularx}{\\textwidth}{|>{\\bfseries}p{4cm}|X|}
\\hline
\\rowcolor{lightgray}
\\multicolumn{2}{|c|}{\\large\\bfseries PERSONAL INFORMATION} \\\\
\\hline
Full Name & ${this.escapeLatex(resumeData.fullName)} \\\\
\\hline
Date of Birth & ${resumeData.dateOfBirth ? this.escapeLatex(resumeData.dateOfBirth) : 'N/A'} \\\\
\\hline
Gender & ${this.escapeLatex(resumeData.gender || 'N/A')} \\\\
\\hline
Nationality & ${this.escapeLatex(resumeData.nationality || 'Indian')} \\\\
\\hline
Religion & ${this.escapeLatex(resumeData.religion || 'N/A')} \\\\
\\hline
Caste & ${this.escapeLatex(resumeData.caste || 'N/A')} \\\\
\\hline
Blood Group & ${this.escapeLatex(resumeData.bloodGroup || 'N/A')} \\\\
\\hline
Languages Known & ${this.escapeLatex(resumeData.languagesKnown || 'English, Hindi, Gujarati')} \\\\
\\hline
\\end{tabularx}

\\vspace{10pt}

% Contact Information
\\begin{tabularx}{\\textwidth}{|>{\\bfseries}p{4cm}|X|}
\\hline
\\rowcolor{lightgray}
\\multicolumn{2}{|c|}{\\large\\bfseries CONTACT INFORMATION} \\\\
\\hline
Mobile Number & ${resumeData.contactNumber || 'N/A'} \\\\
\\hline
Email Address & \\href{mailto:${resumeData.email}}{${resumeData.email}} \\\\
\\hline
${resumeData.portfolioWebsite ? `Website & \\href{${resumeData.portfolioWebsite}}{${resumeData.portfolioWebsite}} \\\\\\hline` : ''}
${resumeData.linkedinUrl ? `LinkedIn & \\href{${resumeData.linkedinUrl}}{${resumeData.linkedinUrl}} \\\\\\hline` : ''}
Current Address & ${this.escapeLatex(resumeData.address || 'N/A')} \\\\
\\hline
City & ${this.escapeLatex(resumeData.city || 'N/A')} \\\\
\\hline
State & ${this.escapeLatex(resumeData.state || 'N/A')} \\\\
\\hline
\\end{tabularx}

\\vspace{10pt}

% Educational Qualifications
\\begin{tabularx}{\\textwidth}{|>{\\bfseries}p{4cm}|X|}
\\hline
\\rowcolor{lightgray}
\\multicolumn{2}{|c|}{\\large\\bfseries EDUCATIONAL QUALIFICATIONS} \\\\
\\hline
Current Studies & ${this.escapeLatex(resumeData.program || 'N/A')} \\\\
 & Enrollment: ${resumeData.enrollmentNumber || 'N/A'} \\\\
 & Current Semester: ${resumeData.currentSemester || 'N/A'} \\\\
 & Overall CPI: ${resumeData.overallCPI || 'N/A'} \\\\
\\hline
${resumeData.education && resumeData.education.length > 0 ? 
  resumeData.education.map(edu => `
${this.escapeLatex(edu.degree)} & ${this.escapeLatex(edu.institution)} (${this.escapeLatex(edu.startDate)} - ${this.escapeLatex(edu.endDate || 'Present')}) \\\\
 & ${edu.grade ? `Grade: ${this.escapeLatex(edu.grade)}` : ''} \\\\
\\hline`).join('') : ''}
\\end{tabularx}

\\vspace{10pt}

${resumeData.guardianName ? `
% Guardian Information
\\begin{tabularx}{\\textwidth}{|>{\\bfseries}p{4cm}|X|}
\\hline
\\rowcolor{lightgray}
\\multicolumn{2}{|c|}{\\large\\bfseries GUARDIAN INFORMATION} \\\\
\\hline
Guardian Name & ${this.escapeLatex(resumeData.guardianName)} \\\\
\\hline
Relation & ${this.escapeLatex(resumeData.guardianRelation || 'N/A')} \\\\
\\hline
Contact Number & ${resumeData.guardianContact || 'N/A'} \\\\
\\hline
Occupation & ${this.escapeLatex(resumeData.guardianOccupation || 'N/A')} \\\\
\\hline
\\end{tabularx}

\\vspace{10pt}
` : ''}

% Additional Information
\\begin{tabularx}{\\textwidth}{|>{\\bfseries}p{4cm}|X|}
\\hline
\\rowcolor{lightgray}
\\multicolumn{2}{|c|}{\\large\\bfseries ADDITIONAL INFORMATION} \\\\
\\hline
${resumeData.skills && resumeData.skills.length > 0 ? `
Technical Skills & ${resumeData.skills.map(skill => `${skill.name} (${skill.proficiency})`).join(', ')} \\\\
\\hline` : ''}
${resumeData.achievements && resumeData.achievements.length > 0 ? `
Achievements & ${resumeData.achievements.map(achievement => achievement.title).join(', ')} \\\\
\\hline` : ''}
${resumeData.hobbies ? `
Hobbies & ${this.escapeLatex(resumeData.hobbies)} \\\\
\\hline` : ''}
References & Available upon request \\\\
\\hline
\\end{tabularx}

\\vspace{20pt}

% Declaration
\\begin{center}
\\begin{tabular}{c}
\\textbf{DECLARATION} \\\\[10pt]
\\begin{minipage}{0.8\\textwidth}
\\centering
I hereby declare that the information furnished above is true and correct to the best of my knowledge and belief.
\\end{minipage} \\\\[20pt]
\\textbf{Date:} \\underline{\\hspace{3cm}} \\hfill \\textbf{Signature:} \\underline{\\hspace{4cm}} \\\\[10pt]
\\textbf{Place:} \\underline{\\hspace{3cm}} \\hfill \\textbf{(${this.escapeLatex(resumeData.fullName)})}
\\end{tabular}
\\end{center}

\\end{document}`;
  }

  /**
   * Generate CV LaTeX template
   */
  generateCVLatex(resumeData: ResumeData): string {
    const skillsSection = resumeData.skills && resumeData.skills.length > 0 
      ? Object.entries(resumeData.skills.reduce((acc, skill) => {
          if (!acc[skill.category]) acc[skill.category] = [];
          acc[skill.category].push(`${skill.name} (${skill.proficiency})`);
          return acc;
        }, {} as Record<string, string[]>))
        .map(([category, skills]) => `
\\textbf{${this.escapeLatex(category)}:}
\\begin{itemize}[leftmargin=15pt, noitemsep, topsep=1pt]
${skills.map(skill => `    \\item ${this.escapeLatex(skill)}`).join('\n')}
\\end{itemize}
`).join('')
      : '';

    const experienceSection = resumeData.experience && resumeData.experience.length > 0
      ? resumeData.experience.map(exp => `
\\resumeSubheading
{${this.escapeLatex(exp.position)}}{${this.escapeLatex(exp.startDate)} -- ${this.escapeLatex(exp.endDate || 'Present')}}
{${this.escapeLatex(exp.company)}}{${this.escapeLatex(exp.location || '')}}
\\resumeItemListStart
\\resumeItem{${this.escapeLatex(exp.description || '')}}
\\resumeItemListEnd`).join('')
      : '';

    const projectsSection = resumeData.projects && resumeData.projects.length > 0
      ? resumeData.projects.map(project => `
\\resumeProjectHeading
{\\textbf{${this.escapeLatex(project.title)}} \\textit{| ${project.technologies ? project.technologies.join(', ') : ''}}}{${this.escapeLatex(project.duration || '')}}
\\resumeItemListStart
\\resumeItem{${this.escapeLatex(project.description || '')}}
${project.role ? `\\resumeItem{\\textbf{Role:} ${this.escapeLatex(project.role)}}` : ''}
\\resumeItemListEnd`).join('')
      : '';

    const educationSection = resumeData.education && resumeData.education.length > 0
      ? resumeData.education.map(edu => `
\\resumeSubheading
{${this.escapeLatex(edu.degree)} in ${this.escapeLatex(edu.fieldOfStudy)}}{${this.escapeLatex(edu.startDate)} -- ${this.escapeLatex(edu.endDate || 'Present')}}
{${this.escapeLatex(edu.institution)}}{${this.escapeLatex(edu.grade || '')}}
${edu.description ? `\\resumeItemListStart\\resumeItem{${this.escapeLatex(edu.description)}}\\resumeItemListEnd` : ''}`).join('')
      : '';

    return `%-------------------------
% Enhanced Modern Professional CV
% Generated with GPP Studio
% Compiled with XeLaTeX for best results
%-------------------------

\\documentclass[11pt,a4paper]{article}

% Packages for XeLaTeX
\\usepackage{fontspec}
\\usepackage{xunicode}
\\usepackage{xltxtra}

% Modern fonts
\\setmainfont{Liberation Serif}[Scale=1.0]
\\setsansfont{Liberation Sans}[Scale=1.0]
\\setmonofont{Liberation Mono}[Scale=1.0]

% Packages
\\usepackage[top=0.6in, bottom=0.6in, left=0.6in, right=0.6in]{geometry}
\\usepackage{xcolor}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{multicol}
\\usepackage{graphicx}
\\usepackage{fontawesome5}
\\usepackage{hyperref}
\\usepackage{tikz}
\\usepackage{array}
\\usepackage{tabularx}
\\usepackage{ragged2e}
\\usepackage{setspace}

% Colors - Enhanced palette
\\definecolor{primary}{RGB}{0, 79, 144}
\\definecolor{secondary}{RGB}{45, 45, 45}
\\definecolor{accent}{RGB}{0, 122, 204}
\\definecolor{lightgray}{RGB}{248, 248, 248}
\\definecolor{mediumgray}{RGB}{128, 128, 128}
\\definecolor{success}{RGB}{40, 167, 69}

% Hyperref setup
\\hypersetup{
    colorlinks=true,
    linkcolor=primary,
    urlcolor=primary,
    pdfauthor={${this.escapeLatex(resumeData.fullName)}},
    pdftitle={CV - ${this.escapeLatex(resumeData.fullName)}},
    pdfsubject={Professional Curriculum Vitae}
}

% Remove page numbers
\\pagestyle{empty}

% Custom section formatting with enhanced styling
\\titleformat{\\section}
    {\\color{primary}\\Large\\sffamily\\bfseries}
    {}
    {0em}
    {}[{\\color{primary}\\titlerule[1pt]\\vspace{-3pt}}]

\\titleformat{\\subsection}
    {\\color{secondary}\\large\\sffamily\\bfseries}
    {}
    {0em}
    {}

% Improved spacing
\\titlespacing*{\\section}{0pt}{12pt}{8pt}
\\titlespacing*{\\subsection}{0pt}{8pt}{4pt}

% Custom commands with better formatting
\\newcommand{\\resumeItem}[1]{
    \\item\\small{#1 \\vspace{-1pt}}
}

\\newcommand{\\resumeSubheading}[4]{
    \\vspace{-1pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
        \\textbf{\\color{secondary}#1} & \\textbf{\\color{mediumgray}\\small #2} \\\\
        \\textit{\\small\\color{primary}#3} & \\textit{\\small\\color{mediumgray} #4} \\\\
    \\end{tabular*}\\vspace{-3pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\vspace{-1pt}\\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
        \\small\\textbf{\\color{secondary}#1} & \\textbf{\\color{mediumgray}\\small #2} \\\\
    \\end{tabular*}\\vspace{-3pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-3pt}}

\\renewcommand\\labelitemii{\\$\\vcenter{\\hbox{\\tiny\\$\\bullet\\$}}\\$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}[leftmargin=0.3in]}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-4pt}}

% Enhanced header design
\\newcommand{\\makeheader}{
    \\begin{center}
        % Header background with subtle styling
        \\begin{tikzpicture}[remember picture, overlay]
            \\fill[lightgray] (current page.north west) rectangle ([yshift=-3cm]current page.north east);
        \\end{tikzpicture}
        
        \\vspace{0.3cm}
        \\begin{minipage}[t]{0.7\\textwidth}
            \\raggedright
            {\\Huge\\sffamily\\bfseries\\color{primary} ${this.escapeLatex(resumeData.fullName)}}
            
            \\vspace{6pt}
            {\\Large\\sffamily\\color{secondary} ${this.escapeLatex(resumeData.program || 'Student')}}
            
            \\vspace{8pt}
            {\\small\\color{secondary} ${this.escapeLatex(resumeData.profileSummary || 'Professional Summary')}}
            
            \\vspace{12pt}
            \\begin{tabular}{@{}l@{\\hspace{20pt}}l@{}}
                \\faIcon{envelope}\\,\\href{mailto:${resumeData.email}}{\\color{primary}${resumeData.email}} &
                \\faIcon{phone}\\,\\color{secondary}${resumeData.contactNumber || 'N/A'} \\\\[2pt]
                ${resumeData.linkedinUrl ? `\\faIcon{linkedin}\\,\\href{${resumeData.linkedinUrl}}{\\color{primary}LinkedIn} &` : ''}
                ${resumeData.portfolioWebsite ? `\\faIcon{globe}\\,\\href{${resumeData.portfolioWebsite}}{\\color{primary}Portfolio} \\\\[2pt]` : ''}
                \\faIcon{map-marker-alt}\\,\\color{secondary}${resumeData.city || 'Location'}, ${resumeData.state || 'State'} &
                \\faIcon{id-card}\\,\\color{secondary}${resumeData.enrollmentNumber || 'N/A'}
            \\end{tabular}
        \\end{minipage}
        \\hfill
        \\begin{minipage}[t]{0.25\\textwidth}
            \\raggedleft
            \\vspace{0.2cm}
            ${resumeData.photoURL ? `
            \\begin{tikzpicture}
                \\clip (0,0) circle (1.8cm);
                \\node at (0,0) {\\includegraphics[width=3.6cm, height=3.6cm, keepaspectratio]{${resumeData.photoURL}}};
                \\draw[primary, line width=3pt] (0,0) circle (1.8cm);
            \\end{tikzpicture}
            ` : `
            \\begin{tikzpicture}
                \\draw[primary, line width=3pt] (0,0) circle (1.8cm);
                \\node at (0,0) {\\footnotesize Professional\\\\Photo};
            \\end{tikzpicture}
            `}
        \\end{minipage}
    \\end{center}
    \\vspace{0.3cm}
}

%-------------------------------------------
%%%%%%  CV STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%
%-------------------------------------------

\\begin{document}

\\makeheader

${resumeData.profileSummary ? `
%----------- EXECUTIVE SUMMARY -----------
\\section{Executive Summary}
\\justifying
\\small ${this.escapeLatex(resumeData.profileSummary)}
` : ''}

${resumeData.experience && resumeData.experience.length > 0 ? `
%----------- PROFESSIONAL EXPERIENCE -----------
\\section{Professional Experience}
\\resumeSubHeadingListStart
${experienceSection}
\\resumeSubHeadingListEnd
` : ''}

%----------- EDUCATION -----------
\\section{Education}
\\resumeSubHeadingListStart

\\resumeSubheading
{${this.escapeLatex(resumeData.program || 'Current Program')}}{${this.escapeLatex(resumeData.currentSemester ? `Semester ${resumeData.currentSemester}` : 'Current')}}
{Government Polytechnic Palanpur}{${resumeData.overallCPI ? `CPI: ${resumeData.overallCPI}` : 'In Progress'}}
\\resumeItemListStart
\\resumeItem{Enrollment Number: ${resumeData.enrollmentNumber || 'N/A'}}
${resumeData.earnedCredits && resumeData.totalCredits ? `\\resumeItem{Credits: ${resumeData.earnedCredits}/${resumeData.totalCredits}}` : ''}
\\resumeItemListEnd
${educationSection}

\\resumeSubHeadingListEnd

${skillsSection ? `
%----------- TECHNICAL EXPERTISE -----------
\\section{Technical Expertise}
\\begin{multicols}{2}
\\small
${skillsSection}
\\end{multicols}
` : ''}

${resumeData.projects && resumeData.projects.length > 0 ? `
%----------- KEY PROJECTS & INNOVATIONS -----------
\\section{Key Projects \\& Innovations}
\\resumeSubHeadingListStart
${projectsSection}
\\resumeSubHeadingListEnd
` : ''}

${resumeData.achievements && resumeData.achievements.length > 0 ? `
%----------- ACHIEVEMENTS & RECOGNITION -----------
\\section{Achievements \\& Recognition}
\\resumeSubHeadingListStart
${resumeData.achievements.map(achievement => `
\\resumeProjectHeading
{\\textbf{${this.escapeLatex(achievement.title)}}}{${achievement.date ? this.escapeLatex(achievement.date) : ''}}
\\resumeItemListStart
\\resumeItem{${this.escapeLatex(achievement.description || '')}}
\\resumeItemListEnd`).join('')}
\\resumeSubHeadingListEnd
` : ''}

${resumeData.certifications && resumeData.certifications.length > 0 ? `
%----------- CERTIFICATIONS -----------
\\section{Professional Certifications}
\\resumeSubHeadingListStart
${resumeData.certifications.map(cert => `
\\resumeProjectHeading
{\\textbf{${this.escapeLatex(cert.name)}}}{${cert.date ? this.escapeLatex(cert.date) : ''}}
\\resumeItemListStart
\\resumeItem{Issuer: ${this.escapeLatex(cert.issuer || '')}}
\\resumeItemListEnd`).join('')}
\\resumeSubHeadingListEnd
` : ''}

\\end{document}`;
  }

  /**
   * Escape LaTeX special characters
   */
  private escapeLatex(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\$/g, '\\$')
      .replace(/&/g, '\\&')
      .replace(/%/g, '\\%')
      .replace(/#/g, '\\#')
      .replace(/\^/g, '\\textasciicircum{}')
      .replace(/_/g, '\\_')
      .replace(/~/g, '\\textasciitilde{}');
  }
}

export const resumeGenerator = new ResumeGenerator();