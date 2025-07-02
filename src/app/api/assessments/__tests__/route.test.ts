import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { AssessmentModel } from '@/lib/models';
import { connectMongoose } from '@/lib/mongodb';

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
jest.mock('@/lib/mongodb');

// Create mock constructor and instance
const mockAssessmentInstance = {
  save: jest.fn(),
  toJSON: jest.fn(),
};

jest.mock('@/lib/models', () => {
  const MockAssessmentModelConstructor = jest.fn().mockImplementation(() => mockAssessmentInstance) as any;
  MockAssessmentModelConstructor.find = jest.fn();
  MockAssessmentModelConstructor.findOne = jest.fn();
  MockAssessmentModelConstructor.countDocuments = jest.fn();
  MockAssessmentModelConstructor.insertMany = jest.fn();
  return {
    AssessmentModel: MockAssessmentModelConstructor
  };
});

const mockConnectMongoose = connectMongoose as jest.MockedFunction<typeof connectMongoose>;
const mockAssessmentModel = AssessmentModel as any;

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
    mockConnectMongoose.mockResolvedValue(undefined);
    (mockAssessmentModel as any).mockClear();
    mockAssessmentInstance.save.mockClear();
    mockAssessmentInstance.toJSON.mockClear();
  });

  describe('GET /api/assessments', () => {
    it('should return all assessments with proper id mapping', async () => {
      mockAssessmentModel.countDocuments.mockResolvedValue(2);
      const leanResult = Promise.resolve(mockAssessments);
      mockAssessmentModel.find.mockReturnValue({ lean: () => leanResult } as any);
      
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockAssessmentModel.find).toHaveBeenCalledWith({});
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].id).toBe('asmnt_quiz1_cs101_gpp');
      expect(data[0].name).toBe('Quiz 1: Basics of C');
      expect(data[1].id).toBe('asmnt_midterm_me101_gpp');
      expect(data[1].name).toBe('Midterm Exam - Mechanics');
    });

    it('should initialize default assessments when none exist', async () => {
      mockAssessmentModel.countDocuments.mockResolvedValue(0);
      mockAssessmentModel.insertMany.mockResolvedValue([]);
      const leanResult = Promise.resolve([]);
      mockAssessmentModel.find.mockReturnValue({ lean: () => leanResult } as any);
      
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockAssessmentModel.countDocuments).toHaveBeenCalled();
      expect(mockAssessmentModel.insertMany).toHaveBeenCalledWith(
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
        return assessmentWithoutId;
      });
      
      mockAssessmentModel.countDocuments.mockResolvedValue(2);
      const leanResult = Promise.resolve(assessmentsWithoutId);
      mockAssessmentModel.find.mockReturnValue({ lean: () => leanResult } as any);
      
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data[0].id).toBe('507f1f77bcf86cd799439011');
      expect(data[1].id).toBe('507f1f77bcf86cd799439012');
    });

    it('should handle database errors', async () => {
      const errorMessage = 'Database connection failed';
      mockAssessmentModel.countDocuments.mockRejectedValue(new Error(errorMessage));
      
      const response = await GET();
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
      mockAssessmentModel.findOne.mockResolvedValue(null);
      mockAssessmentInstance.save.mockResolvedValue(undefined);
      mockAssessmentInstance.toJSON.mockReturnValue({
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
      delete (invalidData as any).name;
      
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
      delete (invalidData as any).courseId;
      
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
      delete (invalidData as any).programId;
      
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
      delete (invalidData as any).type;
      
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
      const invalidData = { ...validAssessmentData, maxMarks: 'invalid' as any };
      
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
      mockAssessmentModel.findOne.mockResolvedValue({
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
      
      mockAssessmentInstance.toJSON.mockReturnValue({
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
      mockAssessmentInstance.save.mockRejectedValue(new Error('Database save failed'));
      
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
      mockAssessmentModel.findOne.mockImplementation((query: any) => {
        // Simulate case-insensitive matching
        if (query?.name && query.name.$regex) {
          return Promise.resolve({
            name: 'FINAL EXAM - COMPUTER NETWORKS',
            courseId: 'course_cs201_dce_gpp'
          });
        }
        return Promise.resolve(null);
      });
      
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