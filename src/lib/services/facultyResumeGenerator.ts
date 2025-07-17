import type { FacultyProfile, Qualification, FacultyAssignment } from '@/types/entities';
import { ContentConverterV2 } from '@/lib/content-converter-v2';
import { format } from 'date-fns';

export interface FacultyResumeData {
  // Personal Information
  fullName: string;
  title?: string;
  email: string;
  personalEmail?: string;
  contactNumber?: string;
  address?: string;
  
  // Professional Information
  staffCode: string;
  employeeId?: string;
  department: string;
  designation?: string;
  jobType?: string;
  staffCategory?: string;
  instituteEmail: string;
  
  // Academic Information
  specializations?: string[];
  qualifications?: Qualification[];
  
  // Additional Fields for Enhancement
  experience?: Array<{
    position: string;
    organization: string;
    duration: string;
    description?: string;
  }>;
  publications?: Array<{
    title: string;
    journal?: string;
    year?: string;
    type: 'journal' | 'conference' | 'book' | 'chapter';
    authors?: string[];
  }>;
  research?: Array<{
    title: string;
    description: string;
    status: 'ongoing' | 'completed';
    duration?: string;
    funding?: string;
  }>;
  achievements?: Array<{
    title: string;
    description: string;
    date?: string;
    category: 'award' | 'recognition' | 'certification' | 'other';
  }>;
  courses?: Array<{
    code: string;
    name: string;
    credits?: number;
    semester?: number;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date?: string;
    url?: string;
  }>;
}

export class FacultyResumeGenerator {
  private contentConverter: ContentConverterV2;

  constructor() {
    this.contentConverter = new ContentConverterV2();
  }

  /**
   * Generate faculty resume data from profile and related records
   */
  generateResumeData(
    faculty: FacultyProfile,
    assignments?: FacultyAssignment[]
  ): FacultyResumeData {
    const fullName = this.formatFullName(faculty);

    return {
      fullName,
      title: faculty.title,
      email: faculty.email || faculty.personalEmail || faculty.instituteEmail,
      personalEmail: faculty.personalEmail,
      contactNumber: faculty.contactNumber,
      address: faculty.address,
      staffCode: faculty.staffCode,
      employeeId: faculty.employeeId,
      department: faculty.department,
      designation: faculty.designation,
      jobType: faculty.jobType,
      staffCategory: faculty.staffCategory || faculty.category,
      instituteEmail: faculty.instituteEmail,
      specializations: faculty.specializations || (faculty.specialization ? [faculty.specialization] : []),
      qualifications: faculty.qualifications || [],
      // Default empty arrays for additional fields
      experience: [],
      publications: [],
      research: [],
      achievements: [],
      courses: [],
      certifications: []
    };
  }

  /**
   * Format faculty full name with title
   */
  private formatFullName(faculty: FacultyProfile): string {
    if (faculty.fullName) {
      return faculty.title ? `${faculty.title} ${faculty.fullName}` : faculty.fullName;
    }

    if (faculty.gtuName) {
      return faculty.title ? `${faculty.title} ${faculty.gtuName}` : faculty.gtuName;
    }

    const nameParts = [
      faculty.firstName,
      faculty.middleName,
      faculty.lastName
    ].filter(Boolean);

    const fullName = nameParts.length > 0 ? nameParts.join(' ') : faculty.staffCode;
    return faculty.title ? `${faculty.title} ${fullName}` : fullName;
  }

  /**
   * Generate professional resume HTML template for faculty
   */
  generateResumeHTML(resumeData: FacultyResumeData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${resumeData.fullName} - Faculty Resume</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            max-width: 850px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #1e3a8a;
        }
        
        .header h1 {
            font-size: 2.8em;
            color: #1e3a8a;
            margin-bottom: 8px;
            font-weight: 700;
        }
        
        .header .title {
            font-size: 1.3em;
            color: #3b82f6;
            margin-bottom: 15px;
            font-style: italic;
        }
        
        .header .contact-info {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 25px;
            margin-top: 15px;
            font-size: 1em;
        }
        
        .contact-info span {
            color: #4b5563;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 1.5em;
            color: #1e3a8a;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .professional-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-bottom: 25px;
        }
        
        .info-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 10px;
            border-left: 5px solid #3b82f6;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .info-card h3 {
            color: #1e3a8a;
            margin-bottom: 12px;
            font-size: 1.1em;
            font-weight: 600;
        }
        
        .info-card p {
            margin-bottom: 8px;
            color: #4b5563;
        }
        
        .info-card strong {
            color: #1e3a8a;
        }
        
        .qualifications-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .qualification-item {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 18px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-left: 4px solid #10b981;
        }
        
        .qualification-item h4 {
            color: #1e3a8a;
            margin-bottom: 8px;
            font-size: 1.1em;
        }
        
        .qualification-item .details {
            color: #6b7280;
            font-size: 0.95em;
            line-height: 1.5;
        }
        
        .specializations {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .specialization-tag {
            background: #dbeafe;
            color: #1e40af;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
            border: 1px solid #bfdbfe;
        }
        
        .list-section ul {
            list-style: none;
            padding-left: 0;
        }
        
        .list-section li {
            background: #f8fafc;
            margin-bottom: 12px;
            padding: 15px 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .list-section .item-title {
            font-weight: 600;
            color: #1e3a8a;
            margin-bottom: 5px;
        }
        
        .list-section .item-details {
            color: #4b5563;
            font-size: 0.95em;
            line-height: 1.4;
        }
        
        .publication-item {
            border-left-color: #10b981;
        }
        
        .research-item {
            border-left-color: #f59e0b;
        }
        
        .achievement-item {
            border-left-color: #ef4444;
        }
        
        .experience-item {
            border-left-color: #8b5cf6;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 0.85em;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        
        @media print {
            body {
                padding: 0;
                margin: 0;
                font-size: 12pt;
            }
            
            .section {
                page-break-inside: avoid;
            }
            
            .header h1 {
                font-size: 24pt;
            }
        }
        
        @media (max-width: 768px) {
            .professional-info {
                grid-template-columns: 1fr;
            }
            
            .header .contact-info {
                flex-direction: column;
                align-items: center;
                gap: 15px;
            }
            
            .qualifications-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${resumeData.fullName}</h1>
        ${resumeData.designation ? `<div class="title">${resumeData.designation}</div>` : ''}
        <div class="contact-info">
            <span>📧 ${resumeData.email}</span>
            ${resumeData.contactNumber ? `<span>📞 ${resumeData.contactNumber}</span>` : ''}
            <span>🏢 ${resumeData.department}</span>
            ${resumeData.address ? `<span>📍 ${resumeData.address}</span>` : ''}
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Professional Information</h2>
        <div class="professional-info">
            <div class="info-card">
                <h3>Employment Details</h3>
                <p><strong>Staff Code:</strong> ${resumeData.staffCode}</p>
                ${resumeData.employeeId ? `<p><strong>Employee ID:</strong> ${resumeData.employeeId}</p>` : ''}
                <p><strong>Department:</strong> ${resumeData.department}</p>
                ${resumeData.designation ? `<p><strong>Designation:</strong> ${resumeData.designation}</p>` : ''}
            </div>
            <div class="info-card">
                <h3>Contact Information</h3>
                <p><strong>Institute Email:</strong> ${resumeData.instituteEmail}</p>
                ${resumeData.personalEmail ? `<p><strong>Personal Email:</strong> ${resumeData.personalEmail}</p>` : ''}
                ${resumeData.contactNumber ? `<p><strong>Phone:</strong> ${resumeData.contactNumber}</p>` : ''}
                ${resumeData.jobType ? `<p><strong>Job Type:</strong> ${resumeData.jobType}</p>` : ''}
            </div>
        </div>
    </div>

    ${resumeData.specializations && resumeData.specializations.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Areas of Specialization</h2>
        <div class="specializations">
            ${resumeData.specializations.map(spec => `
                <span class="specialization-tag">${spec}</span>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${resumeData.qualifications && resumeData.qualifications.length > 0 ? `
    <div class="section">
        <h2 class="section-title">Educational Qualifications</h2>
        <div class="qualifications-grid">
            ${resumeData.qualifications.map(qual => `
                <div class="qualification-item">
                    <h4>${qual.degree || 'Qualification'}</h4>
                    <div class="details">
                        ${qual.institution ? `<strong>Institution:</strong> ${qual.institution}<br>` : ''}
                        ${qual.field ? `<strong>Field:</strong> ${qual.field}<br>` : ''}
                        ${qual.year ? `<strong>Year:</strong> ${qual.year}<br>` : ''}
                        ${qual.grade ? `<strong>Grade:</strong> ${qual.grade}<br>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${resumeData.experience && resumeData.experience.length > 0 ? `
    <div class="section list-section">
        <h2 class="section-title">Professional Experience</h2>
        <ul>
            ${resumeData.experience.map(exp => `
                <li class="experience-item">
                    <div class="item-title">${exp.position} - ${exp.organization}</div>
                    <div class="item-details">
                        <strong>Duration:</strong> ${exp.duration}<br>
                        ${exp.description ? `${exp.description}` : ''}
                    </div>
                </li>
            `).join('')}
        </ul>
    </div>
    ` : ''}

    ${resumeData.publications && resumeData.publications.length > 0 ? `
    <div class="section list-section">
        <h2 class="section-title">Publications</h2>
        <ul>
            ${resumeData.publications.map(pub => `
                <li class="publication-item">
                    <div class="item-title">${pub.title}</div>
                    <div class="item-details">
                        ${pub.journal ? `<strong>Journal/Conference:</strong> ${pub.journal}<br>` : ''}
                        ${pub.year ? `<strong>Year:</strong> ${pub.year}<br>` : ''}
                        ${pub.authors ? `<strong>Authors:</strong> ${pub.authors.join(', ')}<br>` : ''}
                        <strong>Type:</strong> ${pub.type.charAt(0).toUpperCase() + pub.type.slice(1)}
                    </div>
                </li>
            `).join('')}
        </ul>
    </div>
    ` : ''}

    ${resumeData.research && resumeData.research.length > 0 ? `
    <div class="section list-section">
        <h2 class="section-title">Research Projects</h2>
        <ul>
            ${resumeData.research.map(research => `
                <li class="research-item">
                    <div class="item-title">${research.title}</div>
                    <div class="item-details">
                        ${research.description}<br>
                        <strong>Status:</strong> ${research.status.charAt(0).toUpperCase() + research.status.slice(1)}<br>
                        ${research.duration ? `<strong>Duration:</strong> ${research.duration}<br>` : ''}
                        ${research.funding ? `<strong>Funding:</strong> ${research.funding}` : ''}
                    </div>
                </li>
            `).join('')}
        </ul>
    </div>
    ` : ''}

    ${resumeData.achievements && resumeData.achievements.length > 0 ? `
    <div class="section list-section">
        <h2 class="section-title">Achievements & Awards</h2>
        <ul>
            ${resumeData.achievements.map(achievement => `
                <li class="achievement-item">
                    <div class="item-title">${achievement.title}</div>
                    <div class="item-details">
                        ${achievement.description}<br>
                        ${achievement.date ? `<strong>Date:</strong> ${achievement.date}<br>` : ''}
                        <strong>Category:</strong> ${achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1)}
                    </div>
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
                    <div class="item-title">${cert.name}</div>
                    <div class="item-details">
                        <strong>Issuer:</strong> ${cert.issuer}<br>
                        ${cert.date ? `<strong>Date:</strong> ${cert.date}<br>` : ''}
                        ${cert.url ? `<strong>URL:</strong> <a href="${cert.url}" target="_blank">${cert.url}</a>` : ''}
                    </div>
                </li>
            `).join('')}
        </ul>
    </div>
    ` : ''}

    <div class="footer">
        <p>Generated on ${format(new Date(), 'PPP')} | Faculty Resume</p>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate resume in PDF format
   */
  async generatePDF(resumeData: FacultyResumeData): Promise<Buffer> {
    const htmlContent = this.generateResumeHTML(resumeData);
    
    try {
      const result = await this.contentConverter.convert(htmlContent, 'pdf', {
        pdfOptions: {
          format: 'A4',
          margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm'
          }
        }
      });
      return result as Buffer;
    } catch (error) {
      console.error('Error generating faculty PDF resume:', error);
      throw new Error(`Failed to generate PDF resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate resume in PDF format using pandoc with XeLaTeX engine
   */
  async generatePDFPandoc(resumeData: FacultyResumeData): Promise<Buffer> {
    const markdownContent = this.generateResumeMarkdown(resumeData);
    
    try {
      const result = await this.contentConverter.convert(markdownContent, 'pdf-pandoc', {
        title: `${resumeData.fullName} - Resume`,
        author: resumeData.fullName
      });
      return result as Buffer;
    } catch (error) {
      console.error('Error generating faculty PDF resume with pandoc:', error);
      throw new Error(`Failed to generate PDF resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate biodata in PDF format using pandoc with XeLaTeX engine
   */
  async generateBiodataPDFPandoc(resumeData: FacultyResumeData): Promise<Buffer> {
    const markdownContent = this.generateBiodataMarkdown(resumeData);
    
    try {
      const result = await this.contentConverter.convert(markdownContent, 'pdf-pandoc', {
        title: `${resumeData.fullName} - Biodata`,
        author: resumeData.fullName
      });
      return result as Buffer;
    } catch (error) {
      console.error('Error generating faculty PDF biodata with pandoc:', error);
      throw new Error(`Failed to generate PDF biodata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate CV in PDF format using pandoc with XeLaTeX engine
   */
  async generateCVPDFPandoc(resumeData: FacultyResumeData): Promise<Buffer> {
    const markdownContent = this.generateCVMarkdown(resumeData);
    
    try {
      const result = await this.contentConverter.convert(markdownContent, 'pdf-pandoc', {
        title: `${resumeData.fullName} - CV`,
        author: resumeData.fullName
      });
      return result as Buffer;
    } catch (error) {
      console.error('Error generating faculty PDF CV with pandoc:', error);
      throw new Error(`Failed to generate PDF CV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate resume in DOCX format
   */
  async generateDOCX(resumeData: FacultyResumeData): Promise<Buffer> {
    const markdownContent = this.generateResumeMarkdown(resumeData);
    
    try {
      const result = await this.contentConverter.convert(markdownContent, 'docx', {
        title: `${resumeData.fullName} - Resume`,
        author: resumeData.fullName
      });
      return result as Buffer;
    } catch (error) {
      console.error('Error generating faculty DOCX resume:', error);
      throw new Error(`Failed to generate DOCX resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate resume in Markdown format for DOCX conversion
   */
  private generateResumeMarkdown(resumeData: FacultyResumeData): string {
    const sections: string[] = [];
    
    // Header
    sections.push(`# ${resumeData.fullName}\n`);
    
    if (resumeData.designation) {
      sections.push(`**${resumeData.designation}**\n`);
    }
    
    // Contact Information
    const contactInfo = [
      `**Email:** ${resumeData.email}`,
      resumeData.contactNumber ? `**Phone:** ${resumeData.contactNumber}` : null,
      `**Staff Code:** ${resumeData.staffCode}`,
      `**Department:** ${resumeData.department}`,
      resumeData.address ? `**Address:** ${resumeData.address}` : null
    ].filter(Boolean);
    
    sections.push(contactInfo.join(' | ') + '\n');
    
    // Specializations
    if (resumeData.specializations && resumeData.specializations.length > 0) {
      sections.push('## Specializations\n');
      resumeData.specializations.forEach(spec => {
        sections.push(`- ${spec}`);
      });
      sections.push('');
    }
    
    // Qualifications
    if (resumeData.qualifications && resumeData.qualifications.length > 0) {
      sections.push('## Qualifications\n');
      
      resumeData.qualifications.forEach(qual => {
        sections.push(`### ${qual.degree}`);
        sections.push(`**Institution:** ${qual.institution}`);
        if (qual.year) {
          sections.push(`**Year:** ${qual.year}`);
        }
        if (qual.grade) {
          sections.push(`**Grade:** ${qual.grade}`);
        }
        if (qual.description) {
          sections.push(`**Description:** ${qual.description}`);
        }
        sections.push('');
      });
    }
    
    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      sections.push('## Experience\n');
      
      resumeData.experience.forEach(exp => {
        sections.push(`### ${exp.position} at ${exp.organization}`);
        if (exp.duration) {
          sections.push(`**Duration:** ${exp.duration}`);
        }
        if (exp.description) {
          sections.push(`**Description:** ${exp.description}`);
        }
        sections.push('');
      });
    }
    
    // Publications
    if (resumeData.publications && resumeData.publications.length > 0) {
      sections.push('## Publications\n');
      
      resumeData.publications.forEach(pub => {
        sections.push(`### ${pub.title}`);
        if (pub.journal) {
          sections.push(`**Journal:** ${pub.journal}`);
        }
        if (pub.year) {
          sections.push(`**Year:** ${pub.year}`);
        }
        if (pub.authors && pub.authors.length > 0) {
          sections.push(`**Authors:** ${pub.authors.join(', ')}`);
        }
        sections.push('');
      });
    }
    
    
    
    
    return sections.join('\n');
  }

  /**
   * Generate resume in HTML format (for preview or direct download)
   */
  generateHTML(resumeData: FacultyResumeData): string {
    return this.generateResumeHTML(resumeData);
  }

  /**
   * Generate resume in plain text format
   */
  generatePlainText(resumeData: FacultyResumeData): string {
    const sections: string[] = [];

    // Header
    sections.push(`${resumeData.fullName}\n${'='.repeat(resumeData.fullName.length)}`);
    
    if (resumeData.designation) {
      sections.push(resumeData.designation);
    }
    
    const contactInfo = [
      `Email: ${resumeData.email}`,
      resumeData.contactNumber ? `Phone: ${resumeData.contactNumber}` : null,
      `Department: ${resumeData.department}`,
      resumeData.address ? `Address: ${resumeData.address}` : null
    ].filter(Boolean);
    
    sections.push(contactInfo.join(' | '));

    // Professional Information
    sections.push('\nPROFESSIONAL INFORMATION');
    sections.push('-'.repeat(25));
    sections.push(`Staff Code: ${resumeData.staffCode}`);
    if (resumeData.employeeId) sections.push(`Employee ID: ${resumeData.employeeId}`);
    if (resumeData.designation) sections.push(`Designation: ${resumeData.designation}`);
    sections.push(`Institute Email: ${resumeData.instituteEmail}`);

    // Specializations
    if (resumeData.specializations && resumeData.specializations.length > 0) {
      sections.push('\nSPECIALIZATIONS');
      sections.push('-'.repeat(15));
      sections.push(resumeData.specializations.join(', '));
    }

    // Qualifications
    if (resumeData.qualifications && resumeData.qualifications.length > 0) {
      sections.push('\nEDUCATIONAL QUALIFICATIONS');
      sections.push('-'.repeat(25));
      resumeData.qualifications.forEach(qual => {
        sections.push(`• ${qual.degree || 'Qualification'}`);
        if (qual.institution) sections.push(`  Institution: ${qual.institution}`);
        if (qual.field) sections.push(`  Field: ${qual.field}`);
        if (qual.year) sections.push(`  Year: ${qual.year}`);
        if (qual.grade) sections.push(`  Grade: ${qual.grade}`);
      });
    }

    // Additional sections if they exist
    if (resumeData.experience && resumeData.experience.length > 0) {
      sections.push('\nPROFESSIONAL EXPERIENCE');
      sections.push('-'.repeat(20));
      resumeData.experience.forEach(exp => {
        sections.push(`• ${exp.position} - ${exp.organization}`);
        sections.push(`  Duration: ${exp.duration}`);
        if (exp.description) sections.push(`  ${exp.description}`);
      });
    }

    if (resumeData.publications && resumeData.publications.length > 0) {
      sections.push('\nPUBLICATIONS');
      sections.push('-'.repeat(12));
      resumeData.publications.forEach(pub => {
        sections.push(`• ${pub.title}`);
        if (pub.journal) sections.push(`  Journal: ${pub.journal}`);
        if (pub.year) sections.push(`  Year: ${pub.year}`);
      });
    }

    sections.push(`\nGenerated on ${format(new Date(), 'PPP')}`);

    return sections.join('\n');
  }

  /**
   * Generate biodata in Markdown format for DOCX conversion
   */
  private generateBiodataMarkdown(resumeData: FacultyResumeData): string {
    const sections: string[] = [];
    
    // Header
    sections.push(`# ${resumeData.fullName}\n`);
    sections.push('**BIODATA**\n');
    
    if (resumeData.designation) {
      sections.push(`**${resumeData.designation}**\n`);
    }
    
    // Personal Information
    sections.push('## Personal Information\n');
    
    const personalInfo = [
      `**Full Name:** ${resumeData.fullName}`,
      `**Email:** ${resumeData.email}`,
      resumeData.contactNumber ? `**Phone:** ${resumeData.contactNumber}` : null,
      resumeData.address ? `**Address:** ${resumeData.address}` : null,
      `**Staff Code:** ${resumeData.staffCode}`,
      `**Department:** ${resumeData.department}`,
      `**Institute Email:** ${resumeData.instituteEmail}`
    ].filter(Boolean) as string[];
    
    personalInfo.forEach(info => sections.push(info));
    sections.push('');
    
    // Professional Information
    sections.push('## Professional Information\n');
    if (resumeData.employeeId) sections.push(`**Employee ID:** ${resumeData.employeeId}`);
    if (resumeData.designation) sections.push(`**Designation:** ${resumeData.designation}`);
    if (resumeData.jobType) sections.push(`**Job Type:** ${resumeData.jobType}`);
    if (resumeData.staffCategory) sections.push(`**Staff Category:** ${resumeData.staffCategory}`);
    sections.push('');
    
    // Specializations
    if (resumeData.specializations && resumeData.specializations.length > 0) {
      sections.push('## Specializations\n');
      resumeData.specializations.forEach(spec => {
        sections.push(`- ${spec}`);
      });
      sections.push('');
    }
    
    // Qualifications
    if (resumeData.qualifications && resumeData.qualifications.length > 0) {
      sections.push('## Qualifications\n');
      
      resumeData.qualifications.forEach(qual => {
        sections.push(`### ${qual.degree}`);
        sections.push(`**Institution:** ${qual.institution}`);
        if (qual.field) sections.push(`**Field:** ${qual.field}`);
        if (qual.year) sections.push(`**Year:** ${qual.year}`);
        if (qual.grade) sections.push(`**Grade:** ${qual.grade}`);
        if (qual.description) sections.push(`**Description:** ${qual.description}`);
        sections.push('');
      });
    }
    
    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      sections.push('## Experience\n');
      
      resumeData.experience.forEach(exp => {
        sections.push(`### ${exp.position} at ${exp.organization}`);
        sections.push(`**Duration:** ${exp.duration}`);
        if (exp.description) sections.push(`**Description:** ${exp.description}`);
        sections.push('');
      });
    }
    
    // Courses
    if (resumeData.courses && resumeData.courses.length > 0) {
      sections.push('## Courses Taught\n');
      
      resumeData.courses.forEach(course => {
        sections.push(`### ${course.name} (${course.code})`);
        if (course.credits) sections.push(`**Credits:** ${course.credits}`);
        if (course.semester) sections.push(`**Semester:** ${course.semester}`);
        sections.push('');
      });
    }
    
    // Achievements
    if (resumeData.achievements && resumeData.achievements.length > 0) {
      sections.push('## Achievements\n');
      
      resumeData.achievements.forEach(achievement => {
        sections.push(`### ${achievement.title}`);
        if (achievement.description) sections.push(`**Description:** ${achievement.description}`);
        sections.push(`**Category:** ${achievement.category}`);
        if (achievement.date) sections.push(`**Date:** ${achievement.date}`);
        sections.push('');
      });
    }
    
    return sections.join('\n');
  }

  /**
   * Generate CV in Markdown format for DOCX conversion
   */
  private generateCVMarkdown(resumeData: FacultyResumeData): string {
    const sections: string[] = [];
    
    // Header
    sections.push(`# ${resumeData.fullName}\n`);
    sections.push('**CURRICULUM VITAE**\n');
    
    if (resumeData.designation) {
      sections.push(`**${resumeData.designation}**\n`);
    }
    
    // Contact Information
    const contactInfo = [
      `**Email:** ${resumeData.email}`,
      resumeData.contactNumber ? `**Phone:** ${resumeData.contactNumber}` : null,
      `**Department:** ${resumeData.department}`,
      resumeData.address ? `**Address:** ${resumeData.address}` : null
    ].filter(Boolean);
    
    sections.push(contactInfo.join(' | ') + '\n');
    
    // Professional Information
    sections.push('## Professional Information\n');
    sections.push(`**Staff Code:** ${resumeData.staffCode}`);
    if (resumeData.employeeId) sections.push(`**Employee ID:** ${resumeData.employeeId}`);
    if (resumeData.designation) sections.push(`**Designation:** ${resumeData.designation}`);
    if (resumeData.jobType) sections.push(`**Job Type:** ${resumeData.jobType}`);
    if (resumeData.staffCategory) sections.push(`**Staff Category:** ${resumeData.staffCategory}`);
    sections.push(`**Institute Email:** ${resumeData.instituteEmail}`);
    sections.push('');
    
    // Specializations
    if (resumeData.specializations && resumeData.specializations.length > 0) {
      sections.push('## Specializations\n');
      resumeData.specializations.forEach(spec => {
        sections.push(`- ${spec}`);
      });
      sections.push('');
    }
    
    // Qualifications
    if (resumeData.qualifications && resumeData.qualifications.length > 0) {
      sections.push('## Educational Qualifications\n');
      
      resumeData.qualifications.forEach(qual => {
        sections.push(`### ${qual.degree}`);
        sections.push(`**Institution:** ${qual.institution}`);
        if (qual.field) sections.push(`**Field:** ${qual.field}`);
        if (qual.year) sections.push(`**Year:** ${qual.year}`);
        if (qual.grade) sections.push(`**Grade:** ${qual.grade}`);
        if (qual.description) sections.push(`**Description:** ${qual.description}`);
        sections.push('');
      });
    }
    
    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      sections.push('## Professional Experience\n');
      
      resumeData.experience.forEach(exp => {
        sections.push(`### ${exp.position} at ${exp.organization}`);
        sections.push(`**Duration:** ${exp.duration}`);
        if (exp.description) sections.push(`**Description:** ${exp.description}`);
        sections.push('');
      });
    }
    
    // Research
    if (resumeData.research && resumeData.research.length > 0) {
      sections.push('## Research Activities\n');
      
      resumeData.research.forEach(research => {
        sections.push(`### ${research.title}`);
        sections.push(`**Description:** ${research.description}`);
        sections.push(`**Status:** ${research.status}`);
        if (research.duration) sections.push(`**Duration:** ${research.duration}`);
        if (research.funding) sections.push(`**Funding:** ${research.funding}`);
        sections.push('');
      });
    }
    
    // Publications
    if (resumeData.publications && resumeData.publications.length > 0) {
      sections.push('## Publications\n');
      
      resumeData.publications.forEach(pub => {
        sections.push(`### ${pub.title}`);
        sections.push(`**Type:** ${pub.type}`);
        if (pub.journal) sections.push(`**Journal:** ${pub.journal}`);
        if (pub.year) sections.push(`**Year:** ${pub.year}`);
        if (pub.authors && pub.authors.length > 0) {
          sections.push(`**Authors:** ${pub.authors.join(', ')}`);
        }
        sections.push('');
      });
    }
    
    // Courses
    if (resumeData.courses && resumeData.courses.length > 0) {
      sections.push('## Courses Taught\n');
      
      resumeData.courses.forEach(course => {
        sections.push(`### ${course.name} (${course.code})`);
        if (course.credits) sections.push(`**Credits:** ${course.credits}`);
        if (course.semester) sections.push(`**Semester:** ${course.semester}`);
        sections.push('');
      });
    }
    
    // Achievements
    if (resumeData.achievements && resumeData.achievements.length > 0) {
      sections.push('## Achievements\n');
      
      resumeData.achievements.forEach(achievement => {
        sections.push(`### ${achievement.title}`);
        if (achievement.description) sections.push(`**Description:** ${achievement.description}`);
        sections.push(`**Category:** ${achievement.category}`);
        if (achievement.date) sections.push(`**Date:** ${achievement.date}`);
        sections.push('');
      });
    }
    
    // Certifications
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      sections.push('## Certifications\n');
      
      resumeData.certifications.forEach(cert => {
        sections.push(`### ${cert.name}`);
        sections.push(`**Issuer:** ${cert.issuer}`);
        if (cert.date) sections.push(`**Date:** ${cert.date}`);
        if (cert.url) sections.push(`**URL:** ${cert.url}`);
        sections.push('');
      });
    }
    
    return sections.join('\n');
  }
}

export const facultyResumeGenerator = new FacultyResumeGenerator();