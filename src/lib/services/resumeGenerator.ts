import type { Student, Program, Batch, Result, Course } from '@/types/entities';
import { ContentConverterV2 } from '@/lib/content-converter-v2';
import { format, parseISO, isValid } from 'date-fns';

export interface ResumeData {
  // Personal Information
  fullName: string;
  email: string;
  personalEmail?: string;
  contactNumber?: string;
  address?: string;
  dateOfBirth?: string;
  
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
  
  // Additional Fields for Enhancement
  skills?: string[];
  projects?: Array<{
    title: string;
    description: string;
    technologies?: string[];
    duration?: string;
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
      fullName,
      email: student.personalEmail || student.instituteEmail,
      personalEmail: student.personalEmail,
      contactNumber: student.contactNumber,
      address: student.address,
      dateOfBirth: student.dateOfBirth,
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
      // Default empty arrays for additional fields
      skills: [],
      projects: [],
      achievements: [],
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
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
        }
        
        .header h1 {
            font-size: 2.5em;
            color: #1e40af;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header .contact-info {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 15px;
            font-size: 0.95em;
        }
        
        .contact-info span {
            color: #4b5563;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 1.4em;
            color: #1e40af;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e5e7eb;
            font-weight: 600;
        }
        
        .academic-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .info-item {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        
        .info-item strong {
            color: #1e40af;
            display: block;
            margin-bottom: 5px;
        }
        
        .academic-performance {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .performance-item {
            background: #f0f9ff;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #bae6fd;
        }
        
        .performance-item .value {
            font-size: 1.8em;
            font-weight: bold;
            color: #1e40af;
            display: block;
        }
        
        .performance-item .label {
            color: #4b5563;
            font-size: 0.9em;
            margin-top: 5px;
        }
        
        .semester-results {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .semester-card {
            background: #fefefe;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .semester-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .semester-title {
            font-weight: 600;
            color: #1e40af;
        }
        
        .semester-sgpa {
            font-weight: bold;
            color: #059669;
        }
        
        .subjects-list {
            font-size: 0.85em;
            color: #4b5563;
        }
        
        .subject-item {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
        }
        
        .grade {
            font-weight: 600;
            color: #1e40af;
        }
        
        .list-section ul {
            list-style: none;
            padding-left: 0;
        }
        
        .list-section li {
            background: #f8fafc;
            margin-bottom: 8px;
            padding: 10px 15px;
            border-radius: 6px;
            border-left: 3px solid #2563eb;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 0.8em;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        
        @media print {
            body {
                padding: 0;
                margin: 0;
            }
            
            .section {
                page-break-inside: avoid;
            }
        }
        
        @media (max-width: 768px) {
            .academic-info {
                grid-template-columns: 1fr;
            }
            
            .header .contact-info {
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${resumeData.fullName}</h1>
        <div class="contact-info">
            <span>📧 ${resumeData.email}</span>
            ${resumeData.contactNumber ? `<span>📞 ${resumeData.contactNumber}</span>` : ''}
            <span>🆔 ${resumeData.enrollmentNumber}</span>
            ${resumeData.address ? `<span>📍 ${resumeData.address}</span>` : ''}
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Academic Information</h2>
        <div class="academic-info">
            <div class="info-item">
                <strong>Program</strong>
                ${resumeData.program}${resumeData.programCode ? ` (${resumeData.programCode})` : ''}
            </div>
            <div class="info-item">
                <strong>Current Semester</strong>
                Semester ${resumeData.currentSemester}
            </div>
            <div class="info-item">
                <strong>Enrollment Number</strong>
                ${resumeData.enrollmentNumber}
            </div>
            <div class="info-item">
                <strong>Institute Email</strong>
                ${resumeData.instituteEmail}
            </div>
        </div>
    </div>

    ${resumeData.overallCPI ? `
    <div class="section">
        <h2 class="section-title">Academic Performance</h2>
        <div class="academic-performance">
            <div class="performance-item">
                <span class="value">${resumeData.overallCPI.toFixed(2)}</span>
                <div class="label">Overall CPI</div>
            </div>
            ${resumeData.earnedCredits && resumeData.totalCredits ? `
            <div class="performance-item">
                <span class="value">${resumeData.earnedCredits}/${resumeData.totalCredits}</span>
                <div class="label">Credits Earned</div>
            </div>
            ` : ''}
            <div class="performance-item">
                <span class="value">${resumeData.academicStatus || 'N/A'}</span>
                <div class="label">Academic Status</div>
            </div>
        </div>
    </div>
    ` : ''}

    ${resumeData.semesterResults && resumeData.semesterResults.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Semester-wise Performance</h2>
        <div class="semester-results">
            ${resumeData.semesterResults.map(semester => `
                <div class="semester-card">
                    <div class="semester-header">
                        <span class="semester-title">Semester ${semester.semester}</span>
                        <span class="semester-sgpa">SGPA: ${semester.sgpa}</span>
                    </div>
                    <div class="subjects-list">
                        ${semester.subjects.slice(0, 5).map(subject => `
                            <div class="subject-item">
                                <span>${subject.name} (${subject.code})</span>
                                <span class="grade">${subject.grade}</span>
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
    <div class="section list-section">
        <h2 class="section-title">Technical Skills</h2>
        <ul>
            ${resumeData.skills.map(skill => `<li>${skill}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    ${resumeData.projects && resumeData.projects.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Projects</h2>
        ${resumeData.projects.map(project => `
            <div class="info-item" style="margin-bottom: 15px;">
                <strong>${project.title}</strong>
                <div style="margin-top: 5px; color: #4b5563;">${project.description}</div>
                ${project.technologies ? `<div style="margin-top: 8px; font-size: 0.9em; color: #059669;"><strong>Technologies:</strong> ${project.technologies.join(', ')}</div>` : ''}
                ${project.duration ? `<div style="margin-top: 5px; font-size: 0.9em; color: #6b7280;"><strong>Duration:</strong> ${project.duration}</div>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${resumeData.achievements && resumeData.achievements.length > 0 ? `
    <div class="section list-section">
        <h2 class="section-title">Achievements</h2>
        <ul>
            ${resumeData.achievements.map(achievement => `
                <li>
                    <strong>${achievement.title}</strong>
                    ${achievement.description ? `<div style="margin-top: 5px; font-size: 0.9em; color: #4b5563;">${achievement.description}</div>` : ''}
                    ${achievement.date ? `<div style="margin-top: 5px; font-size: 0.85em; color: #6b7280;">${achievement.date}</div>` : ''}
                </li>
            `).join('')}
        </ul>
    </div>
    ` : ''}

    ${resumeData.certifications && resumeData.certifications.length > 0 ? `
    <div class="section list-section">
        <h2 class="section-title">Certifications</h2>
        <ul>
            ${resumeData.certifications.map(cert => `
                <li>
                    <strong>${cert.name}</strong> - ${cert.issuer}
                    ${cert.date ? `<div style="margin-top: 5px; font-size: 0.85em; color: #6b7280;">${cert.date}</div>` : ''}
                </li>
            `).join('')}
        </ul>
    </div>
    ` : ''}

    <div class="footer">
        <p>Generated on ${format(new Date(), 'PPP')} | Academic Resume</p>
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
    // Use the complete HTML template that's designed for PDFs
    const htmlContent = this.generateResumeHTML(resumeData);
    
    try {
      // Use Puppeteer directly to avoid double-wrapping
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
            '--disable-web-security'
          ]
        });

        const page = await browser.newPage();
        
        await page.setContent(htmlContent, { 
          waitUntil: 'networkidle0',
          timeout: 30000
        });

        // Generate PDF with proper options
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm'
          }
        });

        return Buffer.from(pdfBuffer);

      } finally {
        if (browser) {
          await browser.close();
        }
      }
    } catch (error) {
      console.error('Error generating PDF resume:', error);
      throw new Error(`Failed to generate PDF resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate resume in DOCX format
   */
  async generateDOCX(resumeData: ResumeData): Promise<Buffer> {
    const htmlContent = this.generateResumeHTML(resumeData);
    
    try {
      const result = await this.contentConverter.convert(htmlContent, 'docx', {});
      return result as Buffer;
    } catch (error) {
      console.error('Error generating DOCX resume:', error);
      throw new Error(`Failed to generate DOCX resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate resume in HTML format (for preview or direct download)
   */
  generateHTML(resumeData: ResumeData): string {
    return this.generateResumeHTML(resumeData);
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
      sections.push(resumeData.skills.join(', '));
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
}

export const resumeGenerator = new ResumeGenerator();