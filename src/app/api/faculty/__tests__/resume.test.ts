import { NextRequest } from 'next/server';
import { GET, POST } from '../[id]/resume/route';
import { facultyResumeGenerator } from '@/lib/services/facultyResumeGenerator';

// Mock all dependencies
jest.mock('@/lib/services/facultyResumeGenerator', () => ({
  facultyResumeGenerator: {
    generateResumeData: jest.fn(),
    generatePDF: jest.fn(),
    generateDOCX: jest.fn(),
    generateHTML: jest.fn(),
    generatePlainText: jest.fn()
  }
}));

jest.mock('@/lib/api/faculty', () => ({
  facultyService: {
    getAllFaculty: jest.fn()
  }
}));

import { facultyService } from '@/lib/api/faculty';

const mockFacultyService = facultyService as jest.Mocked<typeof facultyService>;
const mockFacultyResumeGenerator = facultyResumeGenerator as jest.Mocked<typeof facultyResumeGenerator>;

describe('/api/faculty/[id]/resume', () => {
  const mockFaculty = {
    id: 'faculty-123',
    userId: 'user-123',
    staffCode: 'FAC001',
    employeeId: 'EMP001',
    title: 'Dr.',
    firstName: 'John',
    middleName: 'Michael',
    lastName: 'Doe',
    fullName: 'John Michael Doe',
    email: 'john.doe@gpp.edu',
    personalEmail: 'john.doe@gmail.com',
    instituteEmail: 'john.doe@gppalanpur..ac.in',
    contactNumber: '+91-9876543210',
    address: '123 Faculty Colony, Palanpur, Gujarat',
    department: 'Computer Engineering',
    designation: 'Assistant Professor',
    jobType: 'Regular' as const,
    staffCategory: 'Academic',
    specializations: ['Machine Learning', 'Data Science'],
    qualifications: [
      {
        degree: 'Ph.D.',
        field: 'Computer Science',
        institution: 'IIT Bombay',
        year: 2020
      }
    ],
    status: 'active' as const,
    createdAt: '2021-07-01T00:00:00.000Z',
    updatedAt: '2024-07-01T00:00:00.000Z'
  };

  const mockResumeData = {
    fullName: 'Dr. John Michael Doe',
    title: 'Dr.',
    email: 'john.doe@gpp.edu',
    staffCode: 'FAC001',
    department: 'Computer Engineering',
    designation: 'Assistant Professor',
    instituteEmail: 'john.doe@gppalanpur..ac.in',
    specializations: [],
    qualifications: [],
    experience: [],
    publications: [],
    research: [],
    achievements: [],
    courses: [],
    certifications: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockFacultyService.getAllFaculty.mockResolvedValue([mockFaculty]);
    mockFacultyResumeGenerator.generateResumeData.mockReturnValue(mockResumeData);
  });

  describe('GET method', () => {
    it('should generate PDF resume successfully', async () => {
      const mockPdfBuffer = Buffer.from('mock-pdf-content');
      mockFacultyResumeGenerator.generatePDF.mockResolvedValue(mockPdfBuffer);

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume?format=pdf');
      const response = await GET(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('Content-Disposition')).toContain('.pdf');

      expect(mockFacultyResumeGenerator.generateResumeData).toHaveBeenCalledWith(mockFaculty);
      expect(mockFacultyResumeGenerator.generatePDF).toHaveBeenCalledWith(mockResumeData);
    });

    it('should generate DOCX resume successfully', async () => {
      const mockDocxBuffer = Buffer.from('mock-docx-content');
      mockFacultyResumeGenerator.generateDOCX.mockResolvedValue(mockDocxBuffer);

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume?format=docx');
      const response = await GET(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(response.headers.get('Content-Disposition')).toContain('.docx');

      expect(mockFacultyResumeGenerator.generateDOCX).toHaveBeenCalledWith(mockResumeData);
    });

    it('should generate HTML resume successfully', async () => {
      const mockHtmlContent = '<html><body>Mock HTML Resume</body></html>';
      mockFacultyResumeGenerator.generateHTML.mockReturnValue(mockHtmlContent);

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume?format=html');
      const response = await GET(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      expect(response.headers.get('Content-Disposition')).toContain('.html');

      const responseText = await response.text();
      expect(responseText).toBe(mockHtmlContent);

      expect(mockFacultyResumeGenerator.generateHTML).toHaveBeenCalledWith(mockResumeData);
    });

    it('should generate TXT resume successfully', async () => {
      const mockTxtContent = 'Mock Plain Text Resume';
      mockFacultyResumeGenerator.generatePlainText.mockReturnValue(mockTxtContent);

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume?format=txt');
      const response = await GET(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain');
      expect(response.headers.get('Content-Disposition')).toContain('.txt');

      const responseText = await response.text();
      expect(responseText).toBe(mockTxtContent);

      expect(mockFacultyResumeGenerator.generatePlainText).toHaveBeenCalledWith(mockResumeData);
    });

    it('should default to PDF format when no format specified', async () => {
      const mockPdfBuffer = Buffer.from('mock-pdf-content');
      mockFacultyResumeGenerator.generatePDF.mockResolvedValue(mockPdfBuffer);

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume');
      const response = await GET(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(mockFacultyResumeGenerator.generatePDF).toHaveBeenCalled();
    });

    it('should return 400 for missing faculty ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/faculty//resume');
      const response = await GET(request, { params: Promise.resolve({ id: '' }) });

      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData.error).toBe('Faculty ID is required');
    });

    it('should return 400 for invalid format', async () => {
      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume?format=invalid');
      const response = await GET(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData.error).toContain('Invalid format');
    });

    it('should return 404 for non-existent faculty', async () => {
      mockFacultyService.getAllFaculty.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/faculty/non-existent/resume');
      const response = await GET(request, { params: Promise.resolve({ id: 'non-existent' }) });

      expect(response.status).toBe(404);
      const errorData = await response.json();
      expect(errorData.error).toBe('Faculty not found');
    });

    it('should handle PDF generation errors', async () => {
      mockFacultyResumeGenerator.generatePDF.mockRejectedValue(new Error('PDF generation failed'));

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume');
      const response = await GET(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(500);
      const errorData = await response.json();
      expect(errorData.error).toBe('Failed to generate resume');
      expect(errorData.details).toBe('PDF generation failed');
    });

    it('should generate proper filename with faculty name and staff code', async () => {
      const mockPdfBuffer = Buffer.from('mock-pdf-content');
      mockFacultyResumeGenerator.generatePDF.mockResolvedValue(mockPdfBuffer);

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume?format=pdf');
      const response = await GET(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      const contentDisposition = response.headers.get('Content-Disposition');
      expect(contentDisposition).toContain('John_Michael_Doe_Faculty_Resume_FAC001.pdf');
    });

    it('should handle faculty without proper names in filename', async () => {
      const facultyWithoutName = {
        ...mockFaculty,
        fullName: undefined,
        firstName: undefined,
        lastName: undefined,
        status: 'active' as const
      };
      
      mockFacultyService.getAllFaculty.mockResolvedValue([facultyWithoutName]);
      
      const mockPdfBuffer = Buffer.from('mock-pdf-content');
      mockFacultyResumeGenerator.generatePDF.mockResolvedValue(mockPdfBuffer);

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume?format=pdf');
      const response = await GET(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      const contentDisposition = response.headers.get('Content-Disposition');
      expect(contentDisposition).toContain('FAC001_Faculty_Resume_FAC001.pdf');
    });
  });

  describe('POST method', () => {
    it('should generate custom resume with additional data', async () => {
      const customData = {
        format: 'pdf',
        experience: [
          {
            position: 'Software Engineer',
            organization: 'Tech Corp',
            duration: '2018-2021',
            description: 'Developed web applications'
          }
        ],
        publications: [
          {
            title: 'Machine Learning in Education',
            journal: 'IEEE Transactions',
            year: '2023',
            type: 'journal',
            authors: ['John Doe', 'Jane Smith']
          }
        ],
        research: [
          {
            title: 'AI in Healthcare',
            description: 'Research on AI applications in medical diagnosis',
            status: 'ongoing',
            duration: '2022-2024'
          }
        ],
        achievements: [
          {
            title: 'Best Paper Award',
            description: 'Received for outstanding research paper',
            date: '2023-06-15',
            category: 'award'
          }
        ],
        certifications: [
          {
            name: 'AWS Certified Developer',
            issuer: 'Amazon Web Services',
            date: '2023-01-15'
          }
        ]
      };

      const enhancedResumeData = {
        ...mockResumeData,
        experience: customData.experience,
        publications: customData.publications,
        research: customData.research,
        achievements: customData.achievements,
        certifications: customData.certifications
      };

      const mockPdfBuffer = Buffer.from('enhanced-pdf-content');
      mockFacultyResumeGenerator.generatePDF.mockResolvedValue(mockPdfBuffer);

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume', {
        method: 'POST',
        body: JSON.stringify(customData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');

      expect(mockFacultyResumeGenerator.generatePDF).toHaveBeenCalledWith(enhancedResumeData);
    });

    it('should use base resume data when custom data is not provided', async () => {
      const requestData = { format: 'html' };

      const mockHtmlContent = '<html><body>Base Resume</body></html>';
      mockFacultyResumeGenerator.generateHTML.mockReturnValue(mockHtmlContent);

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(200);
      expect(mockFacultyResumeGenerator.generateHTML).toHaveBeenCalledWith(mockResumeData);
    });

    it('should default to PDF format in POST requests', async () => {
      const requestData = {
        experience: [
          {
            position: 'Researcher',
            organization: 'University',
            duration: '2020-2023'
          }
        ]
      };

      const mockPdfBuffer = Buffer.from('custom-pdf-content');
      mockFacultyResumeGenerator.generatePDF.mockResolvedValue(mockPdfBuffer);

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(mockFacultyResumeGenerator.generatePDF).toHaveBeenCalled();
    });

    it('should return 400 for missing faculty ID in POST', async () => {
      const request = new NextRequest('http://localhost:3000/api/faculty//resume', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request, { params: Promise.resolve({ id: '' }) });

      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData.error).toBe('Faculty ID is required');
    });

    it('should return 404 for non-existent faculty in POST', async () => {
      mockFacultyService.getAllFaculty.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/faculty/non-existent/resume', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'non-existent' }) });

      expect(response.status).toBe(404);
      const errorData = await response.json();
      expect(errorData.error).toBe('Faculty not found');
    });

    it('should handle invalid JSON in POST request', async () => {
      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(500);
      const errorData = await response.json();
      expect(errorData.error).toBe('Failed to generate custom resume');
    });

    it('should handle generation errors in POST requests', async () => {
      mockFacultyResumeGenerator.generateDOCX.mockRejectedValue(new Error('DOCX generation failed'));

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume', {
        method: 'POST',
        body: JSON.stringify({ format: 'docx' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(500);
      const errorData = await response.json();
      expect(errorData.error).toBe('Failed to generate custom resume');
      expect(errorData.details).toBe('DOCX generation failed');
    });

    it('should generate enhanced filename for custom resume', async () => {
      const customData = { format: 'pdf', experience: [] };

      const mockPdfBuffer = Buffer.from('enhanced-pdf-content');
      mockFacultyResumeGenerator.generatePDF.mockResolvedValue(mockPdfBuffer);

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume', {
        method: 'POST',
        body: JSON.stringify(customData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      const contentDisposition = response.headers.get('Content-Disposition');
      expect(contentDisposition).toContain('John_Michael_Doe_Enhanced_Resume_FAC001.pdf');
    });
  });

  describe('POST format coverage tests', () => {
    it('should handle unsupported format error', async () => {
      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume', {
        method: 'POST',
        body: JSON.stringify({ format: 'unsupported' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData.error).toBe('Unsupported format');
    });

    it('should handle TXT format generation', async () => {
      const customData = { format: 'txt', experience: [] };
      const mockTxtContent = 'John Doe\nFaculty\nExperience: ...';
      mockFacultyResumeGenerator.generatePlainText.mockReturnValue(mockTxtContent);

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume', {
        method: 'POST',
        body: JSON.stringify(customData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/plain');
      expect(mockFacultyResumeGenerator.generatePlainText).toHaveBeenCalledWith(expect.objectContaining({
        fullName: 'Dr. John Michael Doe',
        staffCode: 'FAC001'
      }));
    });

    it('should handle HTML format generation', async () => {
      const customData = { format: 'html', experience: [] };
      const mockHtmlContent = '<html><body><h1>John Doe</h1></body></html>';
      mockFacultyResumeGenerator.generateHTML.mockReturnValue(mockHtmlContent);

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume', {
        method: 'POST',
        body: JSON.stringify(customData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      expect(mockFacultyResumeGenerator.generateHTML).toHaveBeenCalledWith(expect.objectContaining({
        fullName: 'Dr. John Michael Doe',
        staffCode: 'FAC001'
      }));
    });

    it('should handle general error during faculty profile fetch', async () => {
      // Mock faculty service to throw a general error
      mockFacultyService.getAllFaculty.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume');
      const response = await GET(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(500);
      const errorData = await response.json();
      expect(errorData.error).toBe('Failed to generate resume');
      expect(errorData.details).toBe('Database connection failed');
    });

    it('should handle outer catch block for POST custom resume generation', async () => {
      // Mock an error that occurs before the inner try-catch
      mockFacultyService.getAllFaculty.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume', {
        method: 'POST',
        body: JSON.stringify({ format: 'pdf' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.status).toBe(500);
      const errorData = await response.json();
      expect(errorData.error).toBe('Failed to generate custom resume');
      expect(errorData.details).toBe('Database connection failed');
    });
  });

  describe('caching and headers', () => {
    it('should set appropriate cache control headers', async () => {
      const mockPdfBuffer = Buffer.from('mock-pdf-content');
      mockFacultyResumeGenerator.generatePDF.mockResolvedValue(mockPdfBuffer);

      const request = new NextRequest('http://localhost:3000/api/faculty/faculty-123/resume');
      const response = await GET(request, { params: Promise.resolve({ id: 'faculty-123' }) });

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });
  });
});