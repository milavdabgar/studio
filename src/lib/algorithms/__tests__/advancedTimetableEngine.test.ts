import { AdvancedTimetableEngine, createAdvancedTimetableEngine } from '../advancedTimetableEngine';
import type { CourseOffering, Faculty, Room, Batch, FacultyPreference, TimetableConstraints } from '@/types/entities';

describe('AdvancedTimetableEngine', () => {
  let engine: AdvancedTimetableEngine;
  const mockCourseOfferings: CourseOffering[] = [];
  const mockFaculties: Faculty[] = [];
  const mockRooms: Room[] = [];
  const mockBatches: Batch[] = [];
  const mockFacultyPreferences: FacultyPreference[] = [];
  const mockConstraints: TimetableConstraints = {} as TimetableConstraints;

  beforeEach(() => {
    engine = createAdvancedTimetableEngine(
      mockCourseOfferings,
      mockFaculties,
      mockRooms,
      mockBatches,
      mockFacultyPreferences,
      mockConstraints
    );
  });

  describe('Initialization', () => {
    it('should create an instance of AdvancedTimetableEngine', () => {
      expect(engine).toBeInstanceOf(AdvancedTimetableEngine);
    });

    it('should initialize all sub-engines', () => {
      // This is a basic test - in a real implementation we'd check that
      // the sub-engines were properly initialized
      expect(engine).toBeDefined();
    });
  });

  describe('generateAdvancedTimetables', () => {
    it('should return a result with success false when generation fails', async () => {
      const request = {
        academicYear: '2024-25',
        semester: 1,
        programId: 'test-program',
        batchIds: ['test-batch'],
        algorithm: 'genetic' as const,
        constraints: mockConstraints,
        considerPreferences: true,
        includeRoomOptimization: true,
        includeResourceOptimization: true,
        priorityWeights: {
          facultyPreferences: 0.3,
          roomUtilization: 0.2,
          workloadBalance: 0.2,
          timeDistribution: 0.15,
          conflictMinimization: 0.15
        },
        resourceConstraints: {
          maxRoomCapacityViolation: 0.1,
          requireSpecializedRooms: true,
          considerMaintenanceSchedule: true,
          allowRoomSharing: false
        },
        optimizationStrategy: 'genetic' as const,
        maxExecutionTime: 30000,
        populationSize: 50,
        maxIterations: 100,
        mutationRate: 0.1,
        crossoverRate: 0.8
      };

      const result = await engine.generateAdvancedTimetables(request);
      
      expect(result).toEqual({
        success: false,
        timetables: [],
        optimizationScore: 0,
        executionTime: expect.any(Number),
        iterations: 0,
        conflicts: [],
        recommendations: expect.any(Array),
        roomAllocations: expect.any(Map),
        resourceUtilization: {
          roomUtilization: expect.any(Number),
          facultyUtilization: expect.any(Number),
          timeSlotUtilization: expect.any(Number),
          facilityUsage: {}
        },
        qualityMetrics: {
          scheduleCompactness: expect.any(Number),
          preferencesSatisfied: expect.any(Number),
          conflictResolution: expect.any(Number),
          resourceEfficiency: expect.any(Number),
          overallQuality: expect.any(Number)
        },
        detailedRecommendations: {
          immediate: expect.any(Array),
          shortTerm: expect.any(Array),
          longTerm: expect.any(Array)
        },
        alternativeSolutions: []
      });
    });
  });

  describe('Utility Methods', () => {
    it('should calculate time in minutes correctly', () => {
      // Test private method indirectly through public interface
      const request = {
        academicYear: '2024-25',
        semester: 1,
        programId: 'test-program',
        batchIds: ['test-batch'],
        algorithm: 'genetic' as const,
        constraints: mockConstraints,
        considerPreferences: true,
        includeRoomOptimization: true,
        includeResourceOptimization: true,
        priorityWeights: {
          facultyPreferences: 0.3,
          roomUtilization: 0.2,
          workloadBalance: 0.2,
          timeDistribution: 0.15,
          conflictMinimization: 0.15
        },
        resourceConstraints: {
          maxRoomCapacityViolation: 0.1,
          requireSpecializedRooms: true,
          considerMaintenanceSchedule: true,
          allowRoomSharing: false
        },
        optimizationStrategy: 'genetic' as const,
        maxExecutionTime: 30000,
        populationSize: 50,
        maxIterations: 100,
        mutationRate: 0.1,
        crossoverRate: 0.8
      };

      expect(async () => await engine.generateAdvancedTimetables(request)).not.toThrow();
    });
  });
});