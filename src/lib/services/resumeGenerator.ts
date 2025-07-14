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
  gender?: string;
  bloodGroup?: string;
  aadharNumber?: string;
  
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
            ${resumeData.skills.map(skill => `<li>${skill.name} (${skill.proficiency})</li>`).join('')}
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
   * Generate PDF from plain text content
   */
  async generatePDFFromText(textContent: string): Promise<Buffer> {
    // Create a simple HTML wrapper for the text content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Document</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              margin: 20px;
              color: #333;
            }
            pre {
              white-space: pre-wrap;
              font-family: 'Courier New', monospace;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <pre>${textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </body>
      </html>
    `;

    const puppeteer = await import('puppeteer');
    let browser;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true
      });

      return Buffer.from(pdfBuffer);

    } finally {
      if (browser) {
        await browser.close();
      }
    }
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
   * Generate PDF from HTML content with professional styling
   */
  private async generatePDFFromHTML(htmlContent: string): Promise<Buffer> {
    const puppeteer = await import('puppeteer');
    let browser;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true
      });

      return Buffer.from(pdfBuffer);

    } finally {
      if (browser) {
        await browser.close();
      }
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
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.5;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 30px;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #1a365d;
        }
        
        .header h1 {
            font-size: 2.5em;
            color: #1a365d;
            margin-bottom: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .subtitle {
            font-size: 1.2em;
            color: #4a5568;
            margin-bottom: 15px;
        }
        
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 1.3em;
            color: #1a365d;
            margin-bottom: 15px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 5px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 200px 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .info-label {
            font-weight: bold;
            color: #2d3748;
        }
        
        .info-value {
            color: #4a5568;
        }
        
        .contact-info {
            background: #f7fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .education-item, .experience-item, .project-item, .achievement-item {
            margin-bottom: 20px;
            padding: 15px;
            border-left: 4px solid #1a365d;
            background: #f8f9fa;
        }
        
        .item-title {
            font-weight: bold;
            color: #1a365d;
            margin-bottom: 5px;
        }
        
        .item-subtitle {
            color: #4a5568;
            font-style: italic;
            margin-bottom: 8px;
        }
        
        .item-dates {
            color: #718096;
            font-size: 0.9em;
            margin-bottom: 8px;
        }
        
        .skills-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .skill-badge {
            background: #1a365d;
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.9em;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 0.9em;
        }
        
        @media print {
            body { font-size: 12px; }
            .header h1 { font-size: 2em; }
            .section { margin-bottom: 20px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${resumeData.fullName}</h1>
        <div class="subtitle">BIODATA</div>
        <div class="subtitle">${resumeData.program} Student - ${resumeData.enrollmentNumber}</div>
    </div>

    <div class="contact-info">
        <div class="info-grid">
            <div class="info-label">Personal Email:</div>
            <div class="info-value">${resumeData.personalEmail || 'N/A'}</div>
            <div class="info-label">Institute Email:</div>
            <div class="info-value">${resumeData.instituteEmail}</div>
            <div class="info-label">Contact Number:</div>
            <div class="info-value">${resumeData.contactNumber || 'N/A'}</div>
            <div class="info-label">Address:</div>
            <div class="info-value">${resumeData.address || 'N/A'}</div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Personal Information</h2>
        <div class="info-grid">
            <div class="info-label">Date of Birth:</div>
            <div class="info-value">${resumeData.dateOfBirth || 'N/A'}</div>
            <div class="info-label">Gender:</div>
            <div class="info-value">${resumeData.gender || 'N/A'}</div>
            <div class="info-label">Blood Group:</div>
            <div class="info-value">${resumeData.bloodGroup || 'N/A'}</div>
            ${resumeData.aadharNumber ? `
            <div class="info-label">Aadhar Number:</div>
            <div class="info-value">${resumeData.aadharNumber}</div>
            ` : ''}
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Academic Information</h2>
        <div class="info-grid">
            <div class="info-label">Program:</div>
            <div class="info-value">${resumeData.program}</div>
            <div class="info-label">Current Semester:</div>
            <div class="info-value">${resumeData.currentSemester}</div>
            ${resumeData.batch ? `
            <div class="info-label">Batch:</div>
            <div class="info-value">${resumeData.batch}</div>
            ` : ''}
            ${resumeData.overallCPI ? `
            <div class="info-label">Overall CPI:</div>
            <div class="info-value">${resumeData.overallCPI.toFixed(2)}</div>
            ` : ''}
        </div>
    </div>

    ${resumeData.guardianName ? `
    <div class="section">
        <h2 class="section-title">Family Information</h2>
        <div class="info-grid">
            <div class="info-label">Guardian Name:</div>
            <div class="info-value">${resumeData.guardianName}</div>
            ${resumeData.guardianRelation ? `
            <div class="info-label">Relation:</div>
            <div class="info-value">${resumeData.guardianRelation}</div>
            ` : ''}
            ${resumeData.guardianContact ? `
            <div class="info-label">Guardian Contact:</div>
            <div class="info-value">${resumeData.guardianContact}</div>
            ` : ''}
            ${resumeData.guardianOccupation ? `
            <div class="info-label">Guardian Occupation:</div>
            <div class="info-value">${resumeData.guardianOccupation}</div>
            ` : ''}
        </div>
    </div>
    ` : ''}

    ${resumeData.profileSummary ? `
    <div class="section">
        <h2 class="section-title">About Me</h2>
        <p style="text-align: justify; line-height: 1.6;">${resumeData.profileSummary}</p>
    </div>
    ` : ''}

    ${resumeData.education && resumeData.education.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Educational Background</h2>
        ${resumeData.education.map(edu => `
            <div class="education-item">
                <div class="item-title">${edu.degree} in ${edu.fieldOfStudy}</div>
                <div class="item-subtitle">${edu.institution}</div>
                <div class="item-dates">${edu.startDate} - ${edu.endDate || 'Present'}</div>
                ${edu.grade ? `<div class="info-value">Grade: ${edu.grade}</div>` : ''}
                ${edu.description ? `<div class="info-value">${edu.description}</div>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${resumeData.skills && resumeData.skills.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Skills</h2>
        <div class="skills-list">
            ${resumeData.skills.map(skill => `
                <span class="skill-badge">${skill.name}</span>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${resumeData.achievements && resumeData.achievements.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Achievements</h2>
        ${resumeData.achievements.map(achievement => `
            <div class="achievement-item">
                <div class="item-title">${achievement.title}</div>
                <div class="info-value">${achievement.description}</div>
                ${achievement.date ? `<div class="item-dates">${achievement.date}</div>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="footer">
        <p>Generated on ${format(new Date(), 'PPP')} | Biodata Document</p>
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
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            color: #2c3e50;
            max-width: 800px;
            margin: 0 auto;
            padding: 30px;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px double #34495e;
        }
        
        .header h1 {
            font-size: 2.8em;
            color: #2c3e50;
            margin-bottom: 10px;
            font-weight: 300;
            letter-spacing: 2px;
        }
        
        .header .title {
            font-size: 1.5em;
            color: #7f8c8d;
            margin-bottom: 15px;
            font-style: italic;
        }
        
        .contact-line {
            font-size: 1em;
            color: #34495e;
            margin: 5px 0;
        }
        
        .section {
            margin-bottom: 35px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 1.4em;
            color: #2c3e50;
            margin-bottom: 20px;
            font-weight: 500;
            text-transform: uppercase;
            border-bottom: 2px solid #bdc3c7;
            padding-bottom: 8px;
            letter-spacing: 1px;
        }
        
        .cv-item {
            margin-bottom: 25px;
            padding-left: 20px;
            border-left: 3px solid #3498db;
            position: relative;
        }
        
        .cv-item::before {
            content: '';
            position: absolute;
            left: -6px;
            top: 8px;
            width: 9px;
            height: 9px;
            background: #3498db;
            border-radius: 50%;
        }
        
        .cv-item-title {
            font-size: 1.2em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .cv-item-subtitle {
            font-size: 1.1em;
            color: #e74c3c;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .cv-item-dates {
            color: #7f8c8d;
            font-size: 0.95em;
            margin-bottom: 10px;
            font-style: italic;
        }
        
        .cv-item-description {
            color: #34495e;
            text-align: justify;
            line-height: 1.7;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .skill-category {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        
        .skill-category-title {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
            text-transform: uppercase;
            font-size: 0.9em;
        }
        
        .skill-list {
            color: #34495e;
        }
        
        .academic-performance {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .performance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .performance-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 5px;
            border: 1px solid #bdc3c7;
        }
        
        .performance-value {
            font-size: 1.8em;
            font-weight: bold;
            color: #27ae60;
        }
        
        .performance-label {
            color: #7f8c8d;
            font-size: 0.9em;
            margin-top: 5px;
        }
        
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #bdc3c7;
            color: #7f8c8d;
            font-size: 0.9em;
            font-style: italic;
        }
        
        @media print {
            body { font-size: 11px; }
            .header h1 { font-size: 2.2em; }
            .section { margin-bottom: 25px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${resumeData.fullName}</h1>
        <div class="title">CURRICULUM VITAE</div>
        <div class="contact-line">${resumeData.program} Student</div>
        <div class="contact-line">Enrollment: ${resumeData.enrollmentNumber}</div>
        <div class="contact-line">${resumeData.personalEmail || resumeData.email} | ${resumeData.contactNumber || 'N/A'}</div>
        ${resumeData.address ? `<div class="contact-line">${resumeData.address}</div>` : ''}
    </div>

    ${resumeData.profileSummary ? `
    <div class="section">
        <h2 class="section-title">Objective</h2>
        <p style="text-align: justify; line-height: 1.7; font-size: 1.1em; color: #34495e;">${resumeData.profileSummary}</p>
    </div>
    ` : ''}

    <div class="section">
        <h2 class="section-title">Educational Qualifications</h2>
        
        <div class="cv-item">
            <div class="cv-item-title">Current Education</div>
            <div class="cv-item-subtitle">${resumeData.program}</div>
            <div class="cv-item-subtitle">Government Polytechnic Palanpur</div>
            <div class="cv-item-dates">Enrollment: ${resumeData.enrollmentNumber} | Current Semester: ${resumeData.currentSemester}</div>
            ${resumeData.overallCPI ? `<div class="cv-item-description">Overall CPI: ${resumeData.overallCPI.toFixed(2)}</div>` : ''}
        </div>

        ${resumeData.education && resumeData.education.length > 0 ? resumeData.education.map(edu => `
            <div class="cv-item">
                <div class="cv-item-title">${edu.degree}</div>
                <div class="cv-item-subtitle">${edu.institution}</div>
                <div class="cv-item-dates">${edu.startDate} - ${edu.endDate || 'Present'}</div>
                ${edu.grade ? `<div class="cv-item-description">Grade: ${edu.grade}</div>` : ''}
                ${edu.description ? `<div class="cv-item-description">${edu.description}</div>` : ''}
            </div>
        `).join('') : ''}
    </div>

    ${resumeData.overallCPI && resumeData.semesterResults && resumeData.semesterResults.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Academic Performance</h2>
        <div class="academic-performance">
            <div class="performance-grid">
                <div class="performance-item">
                    <div class="performance-value">${resumeData.overallCPI.toFixed(2)}</div>
                    <div class="performance-label">Overall CPI</div>
                </div>
                ${resumeData.earnedCredits && resumeData.totalCredits ? `
                <div class="performance-item">
                    <div class="performance-value">${resumeData.earnedCredits}/${resumeData.totalCredits}</div>
                    <div class="performance-label">Credits Earned</div>
                </div>
                ` : ''}
            </div>
        </div>
    </div>
    ` : ''}

    ${resumeData.experience && resumeData.experience.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Professional Experience</h2>
        ${resumeData.experience.map(exp => `
            <div class="cv-item">
                <div class="cv-item-title">${exp.position}</div>
                <div class="cv-item-subtitle">${exp.company}</div>
                <div class="cv-item-dates">${exp.startDate} - ${exp.endDate || 'Present'}</div>
                ${exp.description ? `<div class="cv-item-description">${exp.description}</div>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${resumeData.projects && resumeData.projects.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Projects</h2>
        ${resumeData.projects.map(project => `
            <div class="cv-item">
                <div class="cv-item-title">${project.title}</div>
                ${project.role ? `<div class="cv-item-subtitle">Role: ${project.role}</div>` : ''}
                ${project.duration ? `<div class="cv-item-dates">${project.duration}</div>` : ''}
                <div class="cv-item-description">${project.description}</div>
                ${project.technologies ? `<div class="cv-item-description"><strong>Technologies:</strong> ${project.technologies.join(', ')}</div>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${resumeData.skills && resumeData.skills.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Technical Skills</h2>
        <div class="skills-grid">
            ${Object.entries(resumeData.skills.reduce((acc, skill) => {
                if (!acc[skill.category]) acc[skill.category] = [];
                acc[skill.category].push(`${skill.name} (${skill.proficiency})`);
                return acc;
            }, {} as Record<string, string[]>)).map(([category, skills]) => `
                <div class="skill-category">
                    <div class="skill-category-title">${category}</div>
                    <div class="skill-list">${skills.join(', ')}</div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${resumeData.achievements && resumeData.achievements.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Achievements & Awards</h2>
        ${resumeData.achievements.map(achievement => `
            <div class="cv-item">
                <div class="cv-item-title">${achievement.title}</div>
                ${achievement.date ? `<div class="cv-item-dates">${achievement.date}</div>` : ''}
                <div class="cv-item-description">${achievement.description}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="footer">
        <p>Generated on ${format(new Date(), 'PPP')} | Curriculum Vitae</p>
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
}

export const resumeGenerator = new ResumeGenerator();