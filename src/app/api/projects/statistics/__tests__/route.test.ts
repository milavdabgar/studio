import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock console methods to suppress expected error/warning messages during tests
beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

// Mock the modules
jest.mock('@/lib/models', () => ({
  ProjectModel: {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([])
    }),
  },
  ProjectEventModel: {
    findOne: jest.fn().mockResolvedValue(null),
  },
  DepartmentModel: {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([])
    }),
  },
}));

jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(undefined),
}));

describe('/api/projects/statistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mongoose mock
    const mongoose = require('mongoose');
    mongoose.connect.mockResolvedValue(undefined);
  });

  test('should return empty statistics when no projects found', async () => {
    const { ProjectModel, DepartmentModel } = require('@/lib/models');
    
    ProjectModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([])
    });
    DepartmentModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([])
    });

    const request = new NextRequest('http://localhost:3000/api/projects/statistics');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.total).toBe(0);
    expect(data.data.evaluated).toBe(0);
    expect(data.data.pending).toBe(0);
    expect(data.data.averageScore).toBe(0);
    expect(data.data.departmentWise).toEqual({});
  });

  test('should handle valid eventId filter and use correct query pattern', async () => {
    const { ProjectModel, ProjectEventModel, DepartmentModel } = require('@/lib/models');
    const eventId = 'event_techfest_2024_gpp';

    const mockEvent = { _id: 'event1', id: eventId, name: 'Techfest 2024' };
    const mockProjects = [
      {
        _id: 'proj1',
        title: 'Project 1',
        department: 'dept1',
        eventId: eventId,
        deptEvaluation: { completed: true, score: 85 },
        centralEvaluation: { completed: false }
      }
    ];
    const mockDepartments = [
      { _id: 'dept1', id: 'dept1', name: 'Computer Engineering', code: 'CE' }
    ];

    ProjectEventModel.findOne.mockResolvedValue(mockEvent);
    ProjectModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockProjects)
    });
    DepartmentModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockDepartments)
    });

    const request = new NextRequest(`http://localhost:3000/api/projects/statistics?eventId=${eventId}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.total).toBe(1);
    
    // CRITICAL: Verify that eventId query uses correct field (not $or with _id)
    expect(ProjectEventModel.findOne).toHaveBeenCalledWith({ id: eventId });
    expect(ProjectModel.find).toHaveBeenCalledWith({ eventId: eventId });
    
    // CRITICAL: Verify that findOne was NOT called with problematic $or query that caused ObjectId casting error
    expect(ProjectEventModel.findOne).not.toHaveBeenCalledWith({
      $or: [{ id: eventId }, { _id: eventId }]
    });
  });

  test('should handle string-based eventId without ObjectId casting errors', async () => {
    const { ProjectEventModel, ProjectModel, DepartmentModel } = require('@/lib/models');
    
    // This test specifically covers the bug that was fixed
    // Previously, queries like { $or: [{ id: eventId }, { _id: eventId }] } 
    // would cause MongoDB to attempt ObjectId casting on string IDs
    const stringEventId = 'event_with_string_id_not_objectid';
    const mockEvent = { _id: 'event1', id: stringEventId, name: 'Event With String ID' };

    ProjectEventModel.findOne.mockResolvedValue(mockEvent);
    ProjectModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([])
    });
    DepartmentModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([])
    });

    const request = new NextRequest(`http://localhost:3000/api/projects/statistics?eventId=${stringEventId}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    
    // CRITICAL: Ensure the query pattern that caused ObjectId casting error is not used
    expect(ProjectEventModel.findOne).toHaveBeenCalledWith({ id: stringEventId });
    expect(ProjectEventModel.findOne).not.toHaveBeenCalledWith({
      $or: [{ id: stringEventId }, { _id: stringEventId }]
    });
  });

  test('should return 404 when eventId does not exist', async () => {
    const { ProjectEventModel } = require('@/lib/models');
    const nonExistentEventId = 'non_existent_event';

    ProjectEventModel.findOne.mockResolvedValue(null);

    const request = new NextRequest(`http://localhost:3000/api/projects/statistics?eventId=${nonExistentEventId}`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe('Event not found.');
    
    // Verify the correct query was used
    expect(ProjectEventModel.findOne).toHaveBeenCalledWith({ id: nonExistentEventId });
  });

  test('should calculate correct statistics with mixed projects', async () => {
    const { ProjectModel, DepartmentModel } = require('@/lib/models');
    
    const mockProjects = [
      {
        _id: 'proj1',
        title: 'CE Project 1',
        department: 'dept_ce',
        eventId: 'event1',
        deptEvaluation: { completed: true, score: 85 },
        centralEvaluation: { completed: false }
      },
      {
        _id: 'proj2',
        title: 'CE Project 2', 
        department: 'dept_ce',
        eventId: 'event1',
        deptEvaluation: { completed: false },
        centralEvaluation: { completed: true, score: 90 }
      },
      {
        _id: 'proj3',
        title: 'IT Project 1',
        department: 'dept_it',
        eventId: 'event1',
        deptEvaluation: { completed: true, score: 75 },
        centralEvaluation: { completed: false }
      }
    ];

    const mockDepartments = [
      { _id: 'dept_ce', id: 'dept_ce', name: 'Computer Engineering', code: 'CE' },
      { _id: 'dept_it', id: 'dept_it', name: 'Information Technology', code: 'IT' }
    ];

    ProjectModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockProjects)
    });
    DepartmentModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockDepartments)
    });

    const request = new NextRequest('http://localhost:3000/api/projects/statistics');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('success');
    expect(data.data.total).toBe(3);
    expect(data.data.evaluated).toBe(3);
    expect(data.data.pending).toBe(0);
    expect(data.data.averageScore).toBe(83.33); // (85 + 90 + 75) / 3
    
    // Check department-wise statistics
    expect(data.data.departmentWise['Computer Engineering']).toEqual({
      total: 2,
      evaluated: 2,
      averageScore: 87.5 // (85 + 90) / 2
    });
    expect(data.data.departmentWise['Information Technology']).toEqual({
      total: 1,
      evaluated: 1,
      averageScore: 75
    });
  });

  test('should handle database connection errors gracefully', async () => {
    const mongoose = require('mongoose');
    const errorMessage = 'Database connection failed';
    
    mongoose.connect.mockRejectedValue(new Error(errorMessage));

    const request = new NextRequest('http://localhost:3000/api/projects/statistics');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Error fetching project statistics');
    expect(data.error).toBe(errorMessage);
  });

  test('should prioritize central evaluation scores over department scores', async () => {
    const { ProjectModel, DepartmentModel } = require('@/lib/models');
    
    const mockProjects = [
      {
        _id: 'proj1',
        title: 'Project with both evaluations',
        department: 'dept1',
        eventId: 'event1',
        deptEvaluation: { completed: true, score: 70 },
        centralEvaluation: { completed: true, score: 95 } // This should be used
      }
    ];

    const mockDepartments = [
      { _id: 'dept1', id: 'dept1', name: 'Computer Engineering', code: 'CE' }
    ];

    ProjectModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockProjects)
    });
    DepartmentModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockDepartments)
    });

    const request = new NextRequest('http://localhost:3000/api/projects/statistics');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.averageScore).toBe(95); // Central evaluation score should be used
    expect(data.data.departmentWise['Computer Engineering'].averageScore).toBe(95);
  });
});
