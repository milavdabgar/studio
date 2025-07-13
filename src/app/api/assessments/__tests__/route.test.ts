import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock console methods to suppress expected error/warning messages during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock the dependencies
jest.mock('@/lib/mongodb', () => ({
  connectMongoose: jest.fn(),
}));

// Create shared mock functions
const mockSave = jest.fn();
const mockToJSON = jest.fn();

// Mock the modules first
jest.mock('@/lib/models', () => {
  const MockAssessmentModel = jest.fn().mockImplementation(() => ({
    save: mockSave,
    toJSON: mockToJSON,
  }));
  
  MockAssessmentModel.find = jest.fn();
  MockAssessmentModel.findOne = jest.fn();
  MockAssessmentModel.countDocuments = jest.fn();
  MockAssessmentModel.insertMany = jest.fn();
  
  return {
    AssessmentModel: MockAssessmentModel,
  };
});

const { connectMongoose } = require('@/lib/mongodb');

// Get references to the mocked functions
const { AssessmentModel } = require('@/lib/models');
const mockFind = AssessmentModel.find as jest.MockedFunction<any>;
const mockFindOne = AssessmentModel.findOne as jest.MockedFunction<any>;
const mockCountDocuments = AssessmentModel.countDocuments as jest.MockedFunction<any>;
const mockInsertMany = AssessmentModel.insertMany as jest.MockedFunction<any>;
const mockAssessmentModel = AssessmentModel;

// Instance mocks are already defined above and shared

describe('/api/assessments', () => {
  const mockAssessments = [
    {
      _id: '507f1f77bcf86cd799439011',
      id: 'asmnt_quiz1_cs101_gpp',
      name: 'Quiz 1: Basics of C',
      courseId: 'course_cs101_dce_gpp',
      programId: 'prog_dce_gpp',
      batchId: 'batch_dce_2022_gpp',
      type: 'Quiz',
      maxMarks: 20,
      status: 'Completed',
      assessmentDate: '2023-09-15T10:00:00.000Z',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      _id: '507f1f77bcf86cd799439012',
      id: 'asmnt_midterm_me101_gpp',
      name: 'Midterm Exam - Mechanics',
      courseId: 'course_me101_dme_gpp',
      programId: 'prog_dme_gpp',
      batchId: 'batch_dme_2023_gpp',
      type: 'Midterm',
      maxMarks: 50,
      passingMarks: 17,
      status: 'Published',
      assessmentDate: '2023-10-20T14:00:00.000Z',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (connectMongoose as jest.MockedFunction<any>).mockResolvedValue(undefined);
  });

  describe('GET /api/assessments', () => {
    it('should return all assessments with proper id mapping', async () => {
      mockCountDocuments.mockResolvedValue(2);
      const leanResult = Promise.resolve(mockAssessments);
      const mockQueryBuilder = {
        lean: () => mockQueryBuilder,
        limit: () => mockQueryBuilder,
        sort: () => leanResult
      };
      mockFind.mockReturnValue(mockQueryBuilder);
      
      const request = new Request('http://localhost/api/assessments');
      const response = await GET(request as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockFind).toHaveBeenCalledWith({});
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].id).toBe('asmnt_quiz1_cs101_gpp');
      expect(data[0].name).toBe('Quiz 1: Basics of C');
      expect(data[1].id).toBe('asmnt_midterm_me101_gpp');
      expect(data[1].name).toBe('Midterm Exam - Mechanics');
    });

    it('should initialize default assessments when none exist', async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockInsertMany.mockResolvedValue([]);
      const leanResult = Promise.resolve([]);
      const mockQueryBuilder = {
        lean: () => mockQueryBuilder,
        limit: () => mockQueryBuilder,
        sort: () => leanResult
      };
      mockFind.mockReturnValue(mockQueryBuilder);
      
      const request = new Request('http://localhost/api/assessments');
      const response = await GET(request as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockCountDocuments).toHaveBeenCalled();
      expect(mockInsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'asmnt_quiz1_cs101_gpp',
            name: 'Quiz 1: Basics of C',
            type: 'Quiz'
          }),
          expect.objectContaining({
            id: 'asmnt_midterm_me101_gpp',
            name: 'Midterm Exam - Mechanics',
            type: 'Midterm'
          })
        ])
      );
      expect(Array.isArray(data)).toBe(true);
    });

    it('should map _id to id when id field is missing', async () => {
      const assessmentsWithoutId = mockAssessments.map(assessment => {
        const { id, ...assessmentWithoutId } = assessment;
        void id; // Mark as used
        return assessmentWithoutId;
      });
      
      mockCountDocuments.mockResolvedValue(2);
      const leanResult = Promise.resolve(assessmentsWithoutId);
      const mockQueryBuilder = {
        lean: () => mockQueryBuilder,
        limit: () => mockQueryBuilder,
        sort: () => leanResult
      };
      mockFind.mockReturnValue(mockQueryBuilder);
      
      const request = new Request('http://localhost/api/assessments');
      const response = await GET(request as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data[0].id).toBe('507f1f77bcf86cd799439011');
      expect(data[1].id).toBe('507f1f77bcf86cd799439012');
    });

    it('should handle database errors', async () => {
      const errorMessage = 'Database connection failed';
      mockCountDocuments.mockRejectedValue(new Error(errorMessage));
      
      const request = new Request('http://localhost/api/assessments');
      const response = await GET(request as any);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error processing assessments request.');
      expect(data.error).toBe(errorMessage);
    });
  });

  describe('POST /api/assessments', () => {
    const validAssessmentData = {
      name: 'Final Exam - Computer Networks',
      courseId: 'course_cs201_dce_gpp',
      programId: 'prog_dce_gpp',
      batchId: 'batch_dce_2023_gpp',
      type: 'Final',
      maxMarks: 100,
      passingMarks: 35,
      weightage: 0.5,
      assessmentDate: '2024-05-15T10:00:00.000Z',
      status: 'Draft',
      description: 'Comprehensive final examination'
    };

    beforeEach(() => {
      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue(undefined);
      mockToJSON.mockReturnValue({
        ...validAssessmentData,
        id: 'asmnt_12345_abcdef',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    it('should create a new assessment with valid data', async () => {
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(validAssessmentData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.name).toBe('Final Exam - Computer Networks');
      expect(data.courseId).toBe('course_cs201_dce_gpp');
      expect(data.maxMarks).toBe(100);
      expect(data.id).toBeTruthy();
      expect(mockAssessmentModel).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Final Exam - Computer Networks',
          courseId: 'course_cs201_dce_gpp',
          programId: 'prog_dce_gpp',
          type: 'Final',
          maxMarks: 100,
          passingMarks: 35,
          weightage: 0.5
        })
      );
    });

    it('should return 400 for missing assessment name', async () => {
      const invalidData = { ...validAssessmentData };
      delete (invalidData as Record<string, unknown>).name;
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Assessment Name cannot be empty.');
    });

    it('should return 400 for empty assessment name', async () => {
      const invalidData = { ...validAssessmentData, name: '   ' };
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Assessment Name cannot be empty.');
    });

    it('should return 400 for missing course ID', async () => {
      const invalidData = { ...validAssessmentData };
      delete (invalidData as Record<string, unknown>).courseId;
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Course ID is required.');
    });

    it('should return 400 for missing program ID', async () => {
      const invalidData = { ...validAssessmentData };
      delete (invalidData as Record<string, unknown>).programId;
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Program ID is required.');
    });

    it('should return 400 for missing assessment type', async () => {
      const invalidData = { ...validAssessmentData };
      delete (invalidData as Record<string, unknown>).type;
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Assessment Type is required.');
    });

    it('should return 400 for invalid max marks (zero)', async () => {
      const invalidData = { ...validAssessmentData, maxMarks: 0 };
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Max Marks must be a positive number.');
    });

    it('should return 400 for invalid max marks (negative)', async () => {
      const invalidData = { ...validAssessmentData, maxMarks: -10 };
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Max Marks must be a positive number.');
    });

    it('should return 400 for invalid max marks (non-numeric)', async () => {
      const invalidData = { ...validAssessmentData, maxMarks: 'invalid' as unknown as number };
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Max Marks must be a positive number.');
    });

    it('should return 400 for passing marks exceeding max marks', async () => {
      const invalidData = { ...validAssessmentData, maxMarks: 50, passingMarks: 60 };
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Passing Marks must be a non-negative number and not exceed Max Marks.');
    });

    it('should return 400 for negative passing marks', async () => {
      const invalidData = { ...validAssessmentData, passingMarks: -5 };
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Passing Marks must be a non-negative number and not exceed Max Marks.');
    });

    it('should return 400 for invalid weightage (greater than 1)', async () => {
      const invalidData = { ...validAssessmentData, weightage: 1.5 };
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Weightage must be between 0 and 1 (e.g., 0.2 for 20%).');
    });

    it('should return 400 for invalid weightage (negative)', async () => {
      const invalidData = { ...validAssessmentData, weightage: -0.1 };
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.message).toBe('Weightage must be between 0 and 1 (e.g., 0.2 for 20%).');
    });

    it('should return 409 for duplicate assessment name in same course/program/batch', async () => {
      mockFindOne.mockResolvedValue({
        name: 'Final Exam - Computer Networks',
        courseId: 'course_cs201_dce_gpp'
      });
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(validAssessmentData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(409);
      expect(data.message).toContain("Assessment with name 'Final Exam - Computer Networks' already exists");
    });

    it('should create assessment without optional fields', async () => {
      const minimalData = {
        name: 'Simple Quiz',
        courseId: 'course_cs101_dce_gpp',
        programId: 'prog_dce_gpp',
        type: 'Quiz',
        maxMarks: 25
      };
      
      mockToJSON.mockReturnValue({
        ...minimalData,
        id: 'asmnt_12345_simple',
        status: 'Draft',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(minimalData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.name).toBe('Simple Quiz');
      expect(data.status).toBe('Draft');
      expect(mockAssessmentModel).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Simple Quiz',
          maxMarks: 25,
          status: 'Draft'
        })
      );
    });

    it('should handle database errors during assessment creation', async () => {
      mockSave.mockRejectedValue(new Error('Database save failed'));
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(validAssessmentData),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.message).toBe('Error creating assessment');
      expect(data.error).toBe('Database save failed');
    });

    it('should trim whitespace from name and description', async () => {
      const dataWithWhitespace = {
        ...validAssessmentData,
        name: '  Final Exam - Computer Networks  ',
        description: '  Comprehensive final examination  '
      };
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(dataWithWhitespace),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(201);
      expect(mockAssessmentModel).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Final Exam - Computer Networks',
          description: 'Comprehensive final examination'
        })
      );
    });

    it('should handle case-insensitive duplicate name checking', async () => {
      mockFindOne.mockReturnValue({
        exec: () => Promise.resolve({
          name: 'FINAL EXAM - COMPUTER NETWORKS',
          courseId: 'course_cs201_dce_gpp'
        })
      } as unknown as ReturnType<typeof AssessmentModel.findOne>);
      
      const dataWithDifferentCase = {
        ...validAssessmentData,
        name: 'final exam - computer networks'
      };
      
      const request = new NextRequest('http://localhost/api/assessments', {
        method: 'POST',
        body: JSON.stringify(dataWithDifferentCase),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(409);
      expect(data.message).toContain("Assessment with name 'final exam - computer networks' already exists");
    });
  });
});