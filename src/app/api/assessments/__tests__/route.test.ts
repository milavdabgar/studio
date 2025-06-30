import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock the database service
jest.mock('@/lib/db', () => ({
  assessment: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
}));

const mockRequest = (method: string, body?: any) => {
  return new NextRequest('http://localhost:3000/api/assessments', {
    method,
    ...(body && { body: JSON.stringify(body) }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

describe('Assessments API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/assessments', () => {
    it('should return a list of assessments', async () => {
      const mockAssessments = [
        { id: 1, name: 'Midterm Exam', maxScore: 100 },
        { id: 2, name: 'Final Exam', maxScore: 200 },
      ];
      
      require('@/lib/db').assessment.findMany.mockResolvedValue(mockAssessments);
      
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual(mockAssessments);
    });
  });

  describe('POST /api/assessments', () => {
    it('should create a new assessment', async () => {
      const newAssessment = {
        name: 'Quiz 1',
        maxScore: 50,
        courseId: 'course-123',
      };
      
      const createdAssessment = { id: 3, ...newAssessment };
      require('@/lib/db').assessment.create.mockResolvedValue(createdAssessment);
      
      const req = mockRequest('POST', newAssessment);
      const response = await POST(req);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data).toEqual(createdAssessment);
      expect(require('@/lib/db').assessment.create).toHaveBeenCalledWith({
        data: newAssessment,
      });
    });
  });
});
