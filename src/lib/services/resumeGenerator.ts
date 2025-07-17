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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
            line-height: 1.6;
            color: #2d3748;
            max-width: 850px;
            margin: 0 auto;
            padding: 20px;
            background: #f8fafc;
        }
        
        .resume-container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -20%;
            width: 100%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            transform: rotate(15deg);
        }
        
        .header h1 {
            font-size: 2.8em;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }
        
        .header .tagline {
            font-size: 1.2em;
            margin-bottom: 20px;
            opacity: 0.9;
            font-weight: 300;
            position: relative;
            z-index: 1;
        }
        
        .contact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            position: relative;
            z-index: 1;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.95em;
            opacity: 0.95;
        }
        
        .contact-icon {
            margin-right: 8px;
            font-weight: bold;
        }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 35px;
        }
        
        .section-title {
            font-size: 1.5em;
            color: #667eea;
            margin-bottom: 20px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            position: relative;
            padding-bottom: 10px;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 2px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 25px;
        }
        
        .info-card {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 20px;
            border-radius: 12px;
            border-left: 5px solid #667eea;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .info-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 15px rgba(0,0,0,0.1);
        }
        
        .info-card strong {
            color: #4a5568;
            display: block;
            margin-bottom: 8px;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        
        .info-card .value {
            color: #2d3748;
            font-size: 1.1em;
            font-weight: 500;
        }
        
        .performance-stats {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 15px;
            margin: 25px 0;
            color: white;
            text-align: center;
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 25px;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            display: block;
            margin-bottom: 5px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .semester-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        }
        
        .semester-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .semester-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .semester-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2);
        }
        
        .semester-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .semester-title {
            font-weight: 700;
            color: #2d3748;
            font-size: 1.1em;
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
      
      // Enhanced content loading with better timeout handling
      await page.setContent(htmlContent, { 
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000
      });

      // Wait for fonts and images to load
      await page.evaluateHandle('document.fonts.ready');
      
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
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 15px;
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 8px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .biodata-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            border-radius: 10px;
            overflow: hidden;
        }
        
        .biodata-table th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            font-size: 1.2em;
            text-align: center;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .biodata-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e0e0e0;
            vertical-align: top;
        }
        
        .biodata-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .biodata-table tr:hover {
            background-color: #e3f2fd;
            transition: background-color 0.3s ease;
        }
        
        .label-col {
            font-weight: bold;
            color: #1565c0;
            width: 35%;
            background-color: #f5f5f5 !important;
        }
        
        .value-col {
            color: #424242;
        }
        
        .section-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px;
            font-size: 1.1em;
            font-weight: bold;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .academic-performance {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
        
        .performance-item {
            display: inline-block;
            margin: 0 20px;
        }
        
        .performance-value {
            font-size: 2em;
            font-weight: bold;
            display: block;
        }
        
        .performance-label {
            font-size: 0.9em;
            opacity: 0.9;
        }
        
        .skills-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .skill-category {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .skill-category h4 {
            color: #1565c0;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        
        .skill-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .skill-tag {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 500;
        }
        
        .declaration {
            background: #fff3cd;
            border: 2px solid #ffeaa7;
            border-radius: 10px;
            padding: 20px;
            margin-top: 30px;
            text-align: center;
        }
        
        .declaration h3 {
            color: #856404;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }
        
        .signature-item {
            text-align: center;
        }
        
        .signature-line {
            border-bottom: 2px solid #333;
            width: 200px;
            margin: 10px 0;
        }
        
        @media print {
            body { 
                font-size: 12px;
                padding: 10px;
            }
            .header {
                background: #667eea !important;
                -webkit-print-color-adjust: exact;
            }
            .biodata-table th {
                background: #667eea !important;
                -webkit-print-color-adjust: exact;
            }
        }
        
        @media (max-width: 768px) {
            .biodata-table {
                font-size: 0.9em;
            }
            .label-col {
                width: 40%;
            }
            .skills-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${resumeData.fullName}</h1>
        <div class="subtitle">BIODATA</div>
        <div class="subtitle">${resumeData.program} • ${resumeData.enrollmentNumber}</div>
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
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            color: white;
            padding: 40px;
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            pointer-events: none;
        }
        
        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            font-weight: 300;
            letter-spacing: 2px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }
        
        .header .title {
            font-size: 1.3em;
            margin-bottom: 20px;
            font-style: italic;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }
        
        .contact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 10px;
            position: relative;
            z-index: 1;
        }
        
        .contact-item {
            font-size: 0.95em;
            opacity: 0.95;
        }
        
        .section {
            margin-bottom: 35px;
            page-break-inside: avoid;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            overflow: hidden;
        }
        
        .section-title {
            background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
            color: white;
            padding: 15px 25px;
            font-size: 1.3em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0;
            position: relative;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, #3498db, #e74c3c, #f39c12);
        }
        
        .section-content {
            padding: 25px;
        }
        
        .timeline {
            position: relative;
            margin-left: 30px;
        }
        
        .timeline::before {
            content: '';
            position: absolute;
            left: -15px;
            top: 0;
            bottom: 0;
            width: 3px;
            background: linear-gradient(to bottom, #3498db, #e74c3c);
        }
        
        .timeline-item {
            position: relative;
            margin-bottom: 30px;
            padding-left: 25px;
        }
        
        .timeline-item::before {
            content: '';
            position: absolute;
            left: -27px;
            top: 8px;
            width: 12px;
            height: 12px;
            background: #3498db;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 0 3px #3498db;
        }
        
        .timeline-title {
            font-size: 1.3em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .timeline-subtitle {
            font-size: 1.1em;
            color: #e74c3c;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .timeline-date {
            color: #7f8c8d;
            font-size: 0.95em;
            margin-bottom: 10px;
            font-style: italic;
            background: #ecf0f1;
            display: inline-block;
            padding: 3px 10px;
            border-radius: 15px;
        }
        
        .timeline-description {
            color: #34495e;
            text-align: justify;
            line-height: 1.7;
        }
        
        .skills-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        }
        
        .skill-category {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 20px;
            border-radius: 10px;
            border-left: 5px solid #3498db;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .skill-category:hover {
            transform: translateY(-5px);
        }
        
        .skill-category-title {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 15px;
            text-transform: uppercase;
            font-size: 1em;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 8px;
        }
        
        .skill-items {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .skill-item {
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 500;
            box-shadow: 0 2px 5px rgba(52, 152, 219, 0.3);
        }
        
        .academic-stats {
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 8px 16px rgba(39, 174, 96, 0.3);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            display: block;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
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
    <div class="header">
        <h1>${resumeData.fullName}</h1>
        <div class="title">CURRICULUM VITAE</div>
        <div class="contact-grid">
            <div class="contact-item">${resumeData.program} Student</div>
            <div class="contact-item">Enrollment: ${resumeData.enrollmentNumber}</div>
            <div class="contact-item">${resumeData.personalEmail || resumeData.email}</div>
            <div class="contact-item">${resumeData.contactNumber || 'Contact Available'}</div>
            ${resumeData.address ? `<div class="contact-item">${resumeData.address}</div>` : ''}
        </div>
    </div>

    ${resumeData.profileSummary ? `
    <div class="section">
        <h2 class="section-title">Professional Objective</h2>
        <div class="section-content">
            <p style="text-align: justify; line-height: 1.8; font-size: 1.1em; color: #2c3e50;">${resumeData.profileSummary}</p>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <h2 class="section-title">Educational Qualifications</h2>
        <div class="section-content">
            <div class="timeline">
                <div class="timeline-item">
                    <div class="timeline-title">Current Education</div>
                    <div class="timeline-subtitle">${resumeData.program}</div>
                    <div class="timeline-subtitle">Government Polytechnic Palanpur</div>
                    <div class="timeline-date">Current Semester: ${resumeData.currentSemester}</div>
                    ${resumeData.overallCPI ? `<div class="timeline-description"><strong>Overall CPI:</strong> ${resumeData.overallCPI.toFixed(2)}</div>` : ''}
                </div>

                ${resumeData.education && resumeData.education.length > 0 ? resumeData.education.map(edu => `
                    <div class="timeline-item">
                        <div class="timeline-title">${edu.degree}</div>
                        <div class="timeline-subtitle">${edu.institution}</div>
                        <div class="timeline-date">${edu.startDate} - ${edu.endDate || 'Present'}</div>
                        ${edu.grade ? `<div class="timeline-description"><strong>Grade:</strong> ${edu.grade}</div>` : ''}
                        ${edu.description ? `<div class="timeline-description">${edu.description}</div>` : ''}
                    </div>
                `).join('') : ''}
            </div>
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
            <div class="timeline">
                ${resumeData.experience.map(exp => `
                    <div class="timeline-item">
                        <div class="timeline-title">${exp.position}</div>
                        <div class="timeline-subtitle">${exp.company}</div>
                        <div class="timeline-date">${exp.startDate} - ${exp.endDate || 'Present'}</div>
                        ${exp.description ? `<div class="timeline-description">${exp.description}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
    ` : ''}

    ${resumeData.projects && resumeData.projects.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Projects & Research</h2>
        <div class="section-content">
            <div class="timeline">
                ${resumeData.projects.map(project => `
                    <div class="timeline-item">
                        <div class="timeline-title">${project.title}</div>
                        ${project.role ? `<div class="timeline-subtitle">Role: ${project.role}</div>` : ''}
                        ${project.duration ? `<div class="timeline-date">${project.duration}</div>` : ''}
                        <div class="timeline-description">${project.description}</div>
                        ${project.technologies ? `<div class="timeline-description"><strong>Technologies:</strong> ${project.technologies.join(', ')}</div>` : ''}
                    </div>
                `).join('')}
            </div>
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
            <div class="timeline">
                ${resumeData.achievements.map(achievement => `
                    <div class="timeline-item">
                        <div class="timeline-title">${achievement.title}</div>
                        ${achievement.date ? `<div class="timeline-date">${achievement.date}</div>` : ''}
                        <div class="timeline-description">${achievement.description}</div>
                    </div>
                `).join('')}
            </div>
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