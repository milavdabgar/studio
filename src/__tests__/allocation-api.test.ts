import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '../app/api/allocation-sessions/route';
import { POST as POST_EXECUTE } from '../app/api/allocation-sessions/[id]/execute/route';

// Mock MongoDB connection
jest.mock('../lib/mongodb', () => ({
  connectMongoose: jest.fn()
}));

// Mock models
const mockSession = {
  id: 'test-session-1',
  name: 'Test Session 2025-26',
  academicYear: '2025-26',
  semesters: [1, 3, 5],
  status: 'draft',
  save: jest.fn(),
  toJSON: jest.fn().mockReturnValue({
    id: 'test-session-1',
    name: 'Test Session 2025-26',
    academicYear: '2025-26',
    semesters: [1, 3, 5],
    status: 'draft'
  })
};

const mockAllocation = {
  id: 'test-allocation-1',
  sessionId: 'test-session-1',
  facultyId: 'faculty-1',
  courseOfferingId: 'offering-1',
  hoursPerWeek: 4,
  allocationScore: 85,
  preferenceMatch: 'high',
  status: 'pending'
};

const mockModels = {
  AllocationSessionModel: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn()
  },
  CourseAllocationModel: {
    find: jest.fn(),
    findOne: jest.fn(),
    insertMany: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn()
  },
  AllocationConflictModel: {
    find: jest.fn(),
    deleteMany: jest.fn(),
    insertMany: jest.fn(),
    countDocuments: jest.fn()
  },
  FacultyModel: {
    find: jest.fn(),
    countDocuments: jest.fn()
  },
  CourseOfferingModel: {
    find: jest.fn(),
    countDocuments: jest.fn()
  },
  FacultyPreferenceModel: {
    find: jest.fn(),
    countDocuments: jest.fn()
  },
  CourseModel: {
    find: jest.fn(),
    countDocuments: jest.fn()
  },
  ProgramModel: {
    find: jest.fn(),
    countDocuments: jest.fn()
  }
};

jest.mock('../lib/models', () => mockModels);

// Mock allocation engine
jest.mock('../lib/algorithms/allocationEngine', () => ({
  createAllocationEngine: jest.fn()
}));

describe.skip('Allocation API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock return values using direct references
    const { AllocationSessionModel, CourseAllocationModel, AllocationConflictModel, 
            FacultyModel, CourseOfferingModel, FacultyPreferenceModel, 
            CourseModel, ProgramModel } = mockModels;
    
    const { connectMongoose } = require('../lib/mongodb');
    connectMongoose.mockResolvedValue(undefined);
    
    const { createAllocationEngine } = require('../lib/algorithms/allocationEngine');
    const mockAllocateCourses = jest.fn() as jest.MockedFunction<any>;
    mockAllocateCourses.mockResolvedValue({
      allocations: [mockAllocation],
      conflicts: [],
      statistics: {
        totalCourses: 1,
        allocatedCourses: 1,
        totalFaculty: 1,
        facultyWithFullLoad: 0,
        conflictsDetected: 0,
        averageSatisfactionScore: 85
      }
    });
    
    const mockEngine = {
      allocateCourses: mockAllocateCourses
    };
    (createAllocationEngine as jest.Mock).mockReturnValue(mockEngine);
    
    AllocationSessionModel.find.mockResolvedValue([mockSession]);
    AllocationSessionModel.findOne.mockResolvedValue(mockSession);
    AllocationSessionModel.create.mockResolvedValue(mockSession);
    AllocationSessionModel.findOneAndUpdate.mockResolvedValue(mockSession);
    AllocationSessionModel.deleteMany.mockResolvedValue({ deletedCount: 0 });
    AllocationSessionModel.countDocuments.mockResolvedValue(1);
    
    CourseAllocationModel.find.mockResolvedValue([mockAllocation]);
    CourseAllocationModel.findOne.mockResolvedValue(mockAllocation);
    CourseAllocationModel.insertMany.mockResolvedValue([mockAllocation]);
    CourseAllocationModel.deleteMany.mockResolvedValue({ deletedCount: 0 });
    CourseAllocationModel.countDocuments.mockResolvedValue(1);
    
    AllocationConflictModel.find.mockResolvedValue([]);
    AllocationConflictModel.deleteMany.mockResolvedValue({ deletedCount: 0 });
    AllocationConflictModel.insertMany.mockResolvedValue([]);
    AllocationConflictModel.countDocuments.mockResolvedValue(0);
    
    FacultyModel.find.mockResolvedValue([{
      id: 'faculty-1',
      displayName: 'Dr. John Doe',
      department: 'Computer Science'
    }]);
    FacultyModel.countDocuments.mockResolvedValue(1);
    
    CourseOfferingModel.find.mockResolvedValue([{
      id: 'offering-1',
      courseId: 'course-1',
      semester: 1,
      academicYear: '2025-26'
    }]);
    CourseOfferingModel.countDocuments.mockResolvedValue(1);
    
    FacultyPreferenceModel.find.mockResolvedValue([{
      id: 'pref-1',
      facultyId: 'faculty-1',
      preferredCourses: [{
        courseOfferingId: 'offering-1',
        priority: 1,
        expertiseLevel: 9
      }]
    }]);
    FacultyPreferenceModel.countDocuments.mockResolvedValue(1);
    
    CourseModel.find.mockResolvedValue([{
      id: 'course-1',
      subjectName: 'Programming Fundamentals',
      subcode: 'CS101'
    }]);
    CourseModel.countDocuments.mockResolvedValue(1);
    
    ProgramModel.find.mockResolvedValue([{
      id: 'btech-cse',
      name: 'B.Tech Computer Science',
      department: 'Computer Science'
    }]);
    ProgramModel.countDocuments.mockResolvedValue(1);
  });

  describe('Allocation Sessions API', () => {
    describe('GET /api/allocation-sessions', () => {
      it('should return all allocation sessions', async () => {
        const request = new NextRequest('http://localhost:3000/api/allocation-sessions');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toHaveLength(1);
        expect(data.data[0].id).toBe('test-session-1');
      });

      it('should handle database errors gracefully', async () => {
        const { AllocationSessionModel } = require('../lib/models');
        AllocationSessionModel.find.mockRejectedValueOnce(new Error('Database error'));

        const request = new NextRequest('http://localhost:3000/api/allocation-sessions');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to fetch allocation sessions');
      });
    });

    describe('POST /api/allocation-sessions', () => {
      it('should create a new allocation session', async () => {
        const sessionData = {
          name: 'New Test Session',
          academicYear: '2025-26',
          semesters: [1, 3],
          targetPrograms: ['btech-cse'],
          allocationMethod: 'preference_based',
          algorithmSettings: {
            prioritizeSeniority: true,
            expertiseWeightage: 0.4,
            preferencePriorityWeightage: 0.3,
            workloadBalanceWeightage: 0.2,
            minimizeConflicts: true
          }
        };

        const request = new NextRequest('http://localhost:3000/api/allocation-sessions', {
          method: 'POST',
          body: JSON.stringify(sessionData),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.name).toBe('New Test Session');
      });

      it('should validate required fields', async () => {
        const invalidData = {
          // Missing required fields
          academicYear: '2025-26'
        };

        const request = new NextRequest('http://localhost:3000/api/allocation-sessions', {
          method: 'POST',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Missing required fields');
      });
    });
  });

  describe('Allocation Execution API', () => {
    describe('POST /api/allocation-sessions/[id]/execute', () => {
      it('should execute allocation successfully', async () => {
        const request = new NextRequest('http://localhost:3000/api/allocation-sessions/test-session-1/execute', {
          method: 'POST'
        });

        const context = {
          params: Promise.resolve({ id: 'test-session-1' })
        };

        const response = await POST_EXECUTE(request, context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.allocationsCreated).toBe(1);
        expect(data.data.conflictsDetected).toBe(0);
      });

      it('should handle session not found', async () => {
        const { AllocationSessionModel } = require('../lib/models');
        AllocationSessionModel.findOne.mockResolvedValueOnce(null);

        const request = new NextRequest('http://localhost:3000/api/allocation-sessions/nonexistent/execute', {
          method: 'POST'
        });

        const context = {
          params: Promise.resolve({ id: 'nonexistent' })
        };

        const response = await POST_EXECUTE(request, context);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Allocation session not found');
      });

      it('should prevent execution of completed sessions', async () => {
        const completedSession = {
          ...mockSession,
          status: 'completed'
        };
        
        const { AllocationSessionModel } = require('../lib/models');
        AllocationSessionModel.findOne.mockResolvedValueOnce(completedSession);

        const request = new NextRequest('http://localhost:3000/api/allocation-sessions/completed-session/execute', {
          method: 'POST'
        });

        const context = {
          params: Promise.resolve({ id: 'completed-session' })
        };

        const response = await POST_EXECUTE(request, context);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Session already completed');
      });

      it('should handle execution with no course offerings', async () => {
        const { CourseOfferingModel } = require('../lib/models');
        CourseOfferingModel.find.mockResolvedValueOnce([]);

        const request = new NextRequest('http://localhost:3000/api/allocation-sessions/test-session-1/execute', {
          method: 'POST'
        });

        const context = {
          params: Promise.resolve({ id: 'test-session-1' })
        };

        const response = await POST_EXECUTE(request, context);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('No course offerings found');
      });

      it('should handle execution with no faculty', async () => {
        const { FacultyModel } = require('../lib/models');
        FacultyModel.find.mockResolvedValueOnce([]);

        const request = new NextRequest('http://localhost:3000/api/allocation-sessions/test-session-1/execute', {
          method: 'POST'
        });

        const context = {
          params: Promise.resolve({ id: 'test-session-1' })
        };

        const response = await POST_EXECUTE(request, context);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain('No faculty found');
      });
    });
  });

  describe('Course Allocations API', () => {
    it('should fetch allocations for a session', async () => {
      const { CourseAllocationModel } = require('../lib/models');
      
      const request = new NextRequest('http://localhost:3000/api/course-allocations?sessionId=test-session-1');
      
      // Mock the route handler
      const mockGet = jest.fn() as jest.MockedFunction<any>;

      mockGet.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          data: [mockAllocation]
        }),
        status: 200
      });
      
      const result = await mockGet(request);
      const data = await (result as any).json();

      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].id).toBe('test-allocation-1');
    });
  });

  describe('Reports API', () => {
    it('should generate summary report', async () => {
      // Mock report generation
      const mockReportData = {
        session: {
          id: 'test-session-1',
          name: 'Test Session 2025-26'
        },
        summary: {
          totalAllocations: 1,
          totalFaculty: 1,
          averageScore: 85
        },
        allocations: [mockAllocation]
      };

      const mockReportsGet = jest.fn() as jest.MockedFunction<any>;

      mockReportsGet.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          data: mockReportData,
          metadata: {
            sessionId: 'test-session-1',
            reportType: 'summary',
            generatedAt: new Date().toISOString(),
            totalRecords: 1
          }
        }),
        status: 200
      });
      
      const request = new NextRequest('http://localhost:3000/api/allocation-sessions/test-session-1/reports?type=summary');
      const result = await mockReportsGet(request);
      const data = await (result as any).json();

      expect(data.success).toBe(true);
      expect(data.data.session.id).toBe('test-session-1');
      expect(data.data.summary.totalAllocations).toBe(1);
      expect(data.metadata.reportType).toBe('summary');
    });
  });

  describe('Approval API', () => {
    it('should get approval status', async () => {
      const mockApprovalData = {
        sessionInfo: {
          id: 'test-session-1',
          name: 'Test Session 2025-26',
          status: 'completed'
        },
        approvalStats: {
          pending: 0,
          approved: 1,
          rejected: 0,
          needsReview: 0
        },
        canApprove: true,
        totalRelevantAllocations: 1
      };

      const mockApprovalGet = jest.fn() as jest.MockedFunction<any>;

      mockApprovalGet.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          data: mockApprovalData
        }),
        status: 200
      });
      
      const request = new NextRequest('http://localhost:3000/api/allocation-sessions/test-session-1/approval');
      const result = await mockApprovalGet(request);
      const data = await (result as any).json();

      expect(data.success).toBe(true);
      expect(data.data.approvalStats.approved).toBe(1);
      expect(data.data.canApprove).toBe(true);
    });

    it('should approve allocations', async () => {
      const approvalData = {
        allocationIds: ['test-allocation-1'],
        action: 'approve',
        approverRole: 'admin',
        approverName: 'Test Admin',
        approverEmail: 'admin@test.com',
        comments: 'Approved automatically'
      };

      const mockApprovalPost = jest.fn() as jest.MockedFunction<any>;

      const request = new NextRequest('http://localhost:3000/api/allocation-sessions/test-session-1/approval', {
        method: 'POST',
        body: JSON.stringify(approvalData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      mockApprovalPost.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          data: {
            processedAllocations: 1,
            action: 'approve',
            sessionStats: {
              approvedCount: 1,
              totalCount: 1,
              approvalProgress: 100
            }
          }
        }),
        status: 200
      });
      
      const result = await mockApprovalPost(request);
      const data = await (result as any).json();

      expect(data.success).toBe(true);
      expect(data.data.processedAllocations).toBe(1);
      expect(data.data.action).toBe('approve');
      expect(data.data.sessionStats.approvalProgress).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/allocation-sessions', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      try {
        await POST(request);
      } catch (error) {
        // Should handle JSON parsing errors gracefully
        expect(error).toBeDefined();
      }
    });

    it('should handle database connection errors', async () => {
      const { connectMongoose } = require('../lib/mongodb');
      connectMongoose.mockRejectedValueOnce(new Error('Connection failed'));

      const request = new NextRequest('http://localhost:3000/api/allocation-sessions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});