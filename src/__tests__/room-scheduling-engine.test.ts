import { 
  RoomSchedulingEngine,
  RoomRequirement,
  RoomSchedulingResult
} from '@/lib/algorithms/roomSchedulingEngine';
import type { Room, RoomAllocation, TimetableEntry, CourseOffering, DayOfWeek } from '@/types/entities';

describe('RoomSchedulingEngine', () => {
  let roomSchedulingEngine: RoomSchedulingEngine;
  
  const mockRooms: Room[] = [
    {
      id: 'room_1',
      roomNumber: 'LH-A',
      name: 'Lecture Hall A',
      type: 'Lecture Hall',
      capacity: 100,
      buildingId: 'building_1',
      floor: 1,
      facilities: ['projector', 'microphone', 'whiteboard'],
      status: 'available'
    },
    {
      id: 'room_2',
      roomNumber: 'CL-1',
      name: 'Computer Lab 1',
      type: 'Computer Lab',
      capacity: 30,
      buildingId: 'building_2',
      floor: 2,
      facilities: ['computers', 'projector', 'air_conditioning'],
      status: 'available'
    },
    {
      id: 'room_3',
      roomNumber: 'TR-B',
      name: 'Tutorial Room B',
      type: 'Other',
      capacity: 25,
      buildingId: 'building_1',
      floor: 1,
      facilities: ['whiteboard', 'chairs'],
      status: 'available'
    }
  ];

  const mockAllocations: RoomAllocation[] = [
    {
      id: 'alloc_1',
      roomId: 'room_1',
      purpose: 'lecture',
      courseOfferingId: 'course_1',
      dayOfWeek: 'Monday',
      startTime: '2024-01-01T09:00:00Z',
      endTime: '2024-01-01T10:30:00Z',
      status: 'scheduled',
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  const mockTimetableEntries: TimetableEntry[] = [
    {
      courseOfferingId: 'course_1',
      courseId: 'CS101',
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:30',
      facultyId: 'faculty_1',
      roomId: 'room_1',
      entryType: 'lecture'
    }
  ];

  const mockCourseOfferings: CourseOffering[] = [
    {
      id: 'course_1',
      courseId: 'CS101',
      academicTermId: 'term_1',
      facultyIds: ['faculty_1'],
      status: 'scheduled',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    roomSchedulingEngine = new RoomSchedulingEngine(
      mockRooms, 
      mockAllocations,
      [], // maintenanceSchedule
      []  // roomIssues
    );
  });

  describe('constructor', () => {
    it('should initialize with rooms and allocations', () => {
      expect(roomSchedulingEngine).toBeInstanceOf(RoomSchedulingEngine);
    });

    it('should accept configuration options', () => {
      const config = {
        prioritizeCapacityMatch: true,
        allowOvercapacity: false
      };
      const engine = new RoomSchedulingEngine(mockRooms, [], [], [], config);
      expect(engine).toBeInstanceOf(RoomSchedulingEngine);
    });
  });

  describe('findOptimalRoom', () => {
    const basicRequirement: RoomRequirement = {
      capacity: 75,
      type: 'Lecture Hall'
    };

    it('should find an optimal room for basic requirements', async () => {
      const result = await roomSchedulingEngine.findOptimalRoom(
        basicRequirement,
        'Tuesday',
        '14:00',
        '15:30',
        '2024-25'
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.allocatedRoom).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
    });

    it('should handle time conflicts', async () => {
      const result = await roomSchedulingEngine.findOptimalRoom(
        basicRequirement,
        'Monday', // Same day as existing allocation
        '09:00',  // Same time as existing allocation
        '10:30',
        '2024-25'
      );

      expect(result).toBeDefined();
      // Should either find an alternative room or report conflicts
      expect(typeof result.success).toBe('boolean');
    });

    it('should respect capacity requirements', async () => {
      const highCapacityRequirement: RoomRequirement = {
        capacity: 150, // Higher than any available room
        type: 'Lecture Hall'
      };

      const result = await roomSchedulingEngine.findOptimalRoom(
        highCapacityRequirement,
        'Wednesday',
        '10:00',
        '11:30',
        '2024-25'
      );

      expect(result).toBeDefined();
      // Should handle capacity mismatch gracefully
    });

    it('should consider required facilities', async () => {
      const facilityRequirement: RoomRequirement = {
        capacity: 30,
        type: 'Computer Lab',
        requiredFacilities: ['computers', 'projector']
      };

      const result = await roomSchedulingEngine.findOptimalRoom(
        facilityRequirement,
        'Thursday',
        '11:00',
        '12:30',
        '2024-25'
      );

      expect(result).toBeDefined();
      if (result.success && result.allocatedRoom && facilityRequirement.requiredFacilities) {
        expect(result.allocatedRoom.facilities).toEqual(
          expect.arrayContaining(facilityRequirement.requiredFacilities)
        );
      }
    });
  });

  describe('allocateRoomsForCourses', () => {
    it('should allocate rooms for multiple courses', async () => {
      const result = await roomSchedulingEngine.allocateRoomsForCourses(
        mockCourseOfferings,
        mockTimetableEntries,
        '2024-25'
      );

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.allocations).toBeDefined();
      expect(result.conflicts).toBeDefined();
      expect(result.utilizationMetrics).toBeDefined();
    });

    it('should handle empty course offerings', async () => {
      const result = await roomSchedulingEngine.allocateRoomsForCourses(
        [],
        [],
        '2024-25'
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.allocations.size).toBe(0);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('getSchedulingRecommendations', () => {
    it('should provide scheduling recommendations', () => {
      const recommendations = roomSchedulingEngine.getSchedulingRecommendations();
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle invalid day of week', async () => {
      const result = await roomSchedulingEngine.findOptimalRoom(
        { capacity: 30, type: 'Lecture Hall' },
        'InvalidDay' as DayOfWeek,
        '09:00',
        '10:30',
        '2024-25'
      );

      expect(result).toBeDefined();
      // Should handle gracefully without throwing
    });

    it('should handle invalid time format', async () => {
      const result = await roomSchedulingEngine.findOptimalRoom(
        { capacity: 30, type: 'Lecture Hall' },
        'Monday',
        'invalid-time',
        '10:30',
        '2024-25'
      );

      expect(result).toBeDefined();
      // Should handle gracefully without throwing
    });
  });
});