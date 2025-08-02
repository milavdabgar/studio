import { 
  RoomSchedulingEngine,
  RoomRequirement,
  RoomSuitabilityScore,
  SchedulingOptions
} from '@/lib/algorithms/roomSchedulingEngine';
import type { Room, RoomAllocation, TimetableEntry, RoomType } from '@/types/entities';

describe('RoomSchedulingEngine', () => {
  let roomSchedulingEngine: RoomSchedulingEngine;
  
  const mockRooms: Room[] = [
    {
      id: 'room_1',
      name: 'Lecture Hall A',
      type: 'lecture_hall',
      capacity: 100,
      building: 'Main Building',
      floor: 1,
      facilities: ['projector', 'microphone', 'whiteboard'],
      isActive: true,
      isAccessible: true
    },
    {
      id: 'room_2',
      name: 'Computer Lab 1',
      type: 'computer_lab',
      capacity: 30,
      building: 'CS Building',
      floor: 2,
      facilities: ['computers', 'projector', 'air_conditioning'],
      isActive: true,
      isAccessible: false
    },
    {
      id: 'room_3',
      name: 'Tutorial Room B',
      type: 'tutorial_room',
      capacity: 25,
      building: 'Main Building',
      floor: 1,
      facilities: ['whiteboard', 'chairs'],
      isActive: true,
      isAccessible: true
    },
    {
      id: 'room_4',
      name: 'Laboratory A',
      type: 'laboratory',
      capacity: 20,
      building: 'Science Building',
      floor: 1,
      facilities: ['lab_equipment', 'safety_shower', 'ventilation'],
      isActive: false, // Inactive room
      isAccessible: true
    }
  ];

  const mockAllocations: RoomAllocation[] = [
    {
      id: 'alloc_1',
      roomId: 'room_1',
      timetableEntryId: 'entry_1',
      dayOfWeek: 'monday',
      startTime: '09:00',
      endTime: '10:30',
      status: 'confirmed',
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    roomSchedulingEngine = new RoomSchedulingEngine(mockRooms, mockAllocations);
  });

  describe('constructor', () => {
    it('should initialize with rooms and allocations', () => {
      expect(roomSchedulingEngine).toBeInstanceOf(RoomSchedulingEngine);
    });

    it('should filter active rooms only', () => {
      const availableRooms = roomSchedulingEngine['rooms'];
      expect(availableRooms).toHaveLength(3); // Excludes inactive room_4
      expect(availableRooms.find(r => r.id === 'room_4')).toBeUndefined();
    });
  });

  describe('findSuitableRooms', () => {
    const basicRequirement: RoomRequirement = {
      capacity: 25,
      type: 'lecture_hall'
    };

    it('should find rooms that meet basic capacity and type requirements', () => {
      const suitableRooms = roomSchedulingEngine.findSuitableRooms(
        basicRequirement,
        'monday',
        '14:00',
        '15:30'
      );

      expect(suitableRooms).toHaveLength(1);
      expect(suitableRooms[0].roomId).toBe('room_1');
      expect(suitableRooms[0].score).toBeGreaterThan(0);
    });

    it('should consider facility requirements', () => {
      const requirementWithFacilities: RoomRequirement = {
        capacity: 25,
        type: 'computer_lab',
        requiredFacilities: ['computers', 'projector']
      };

      const suitableRooms = roomSchedulingEngine.findSuitableRooms(
        requirementWithFacilities,
        'tuesday',
        '10:00',
        '11:30'
      );

      expect(suitableRooms).toHaveLength(1);
      expect(suitableRooms[0].roomId).toBe('room_2');
    });

    it('should consider accessibility requirements', () => {
      const accessibilityRequirement: RoomRequirement = {
        capacity: 20,
        type: 'tutorial_room',
        accessibility: true
      };

      const suitableRooms = roomSchedulingEngine.findSuitableRooms(
        accessibilityRequirement,
        'wednesday',
        '09:00',
        '10:30'
      );

      expect(suitableRooms).toHaveLength(1);
      expect(suitableRooms[0].roomId).toBe('room_3');
    });

    it('should exclude rooms that are already allocated', () => {
      const requirement: RoomRequirement = {
        capacity: 50,
        type: 'lecture_hall'
      };

      const suitableRooms = roomSchedulingEngine.findSuitableRooms(
        requirement,
        'monday', // Same day as existing allocation
        '09:00',  // Overlapping time
        '10:00'
      );

      // Should exclude room_1 due to conflict
      expect(suitableRooms.find(r => r.roomId === 'room_1')).toBeUndefined();
    });

    it('should allow partial capacity utilization when specified', () => {
      const partialCapacityRequirement: RoomRequirement = {
        capacity: 150, // More than any room's capacity
        type: 'lecture_hall',
        allowPartialCapacity: true,
        minCapacityUtilization: 0.6
      };

      const suitableRooms = roomSchedulingEngine.findSuitableRooms(
        partialCapacityRequirement,
        'friday',
        '14:00',
        '15:30'
      );

      expect(suitableRooms).toHaveLength(1);
      expect(suitableRooms[0].roomId).toBe('room_1'); // 100 capacity >= 150 * 0.6
    });

    it('should return empty array when no rooms meet requirements', () => {
      const impossibleRequirement: RoomRequirement = {
        capacity: 500, // Too large
        type: 'lecture_hall'
      };

      const suitableRooms = roomSchedulingEngine.findSuitableRooms(
        impossibleRequirement,
        'monday',
        '11:00',
        '12:30'
      );

      expect(suitableRooms).toHaveLength(0);
    });

    it('should sort rooms by suitability score', () => {
      const requirement: RoomRequirement = {
        capacity: 20,
        type: 'tutorial_room',
        preferredFacilities: ['whiteboard', 'projector']
      };

      const suitableRooms = roomSchedulingEngine.findSuitableRooms(
        requirement,
        'thursday',
        '10:00',
        '11:30'
      );

      if (suitableRooms.length > 1) {
        // Should be sorted by score in descending order
        for (let i = 0; i < suitableRooms.length - 1; i++) {
          expect(suitableRooms[i].score).toBeGreaterThanOrEqual(suitableRooms[i + 1].score);
        }
      }
    });
  });

  describe('allocateRoom', () => {
    const mockTimetableEntry: TimetableEntry = {
      id: 'entry_2',
      courseId: 'course_1',
      courseName: 'Data Structures',
      facultyId: 'faculty_1',
      facultyName: 'Dr. Johnson',
      roomId: '', // To be allocated
      roomName: '',
      dayOfWeek: 'tuesday',
      startTime: '10:00',
      endTime: '11:30',
      type: 'lecture',
      duration: 90
    };

    it('should allocate the best suitable room', () => {
      const requirement: RoomRequirement = {
        capacity: 30,
        type: 'lecture_hall'
      };

      const allocation = roomSchedulingEngine.allocateRoom(
        mockTimetableEntry,
        requirement
      );

      expect(allocation.success).toBe(true);
      expect(allocation.roomId).toBe('room_1');
      expect(allocation.conflicts).toHaveLength(0);
    });

    it('should detect conflicts when room is already allocated', () => {
      const conflictingEntry: TimetableEntry = {
        ...mockTimetableEntry,
        dayOfWeek: 'monday',
        startTime: '09:30', // Overlaps with existing allocation
        endTime: '11:00'
      };

      const requirement: RoomRequirement = {
        capacity: 80,
        type: 'lecture_hall'
      };

      const allocation = roomSchedulingEngine.allocateRoom(
        conflictingEntry,
        requirement
      );

      expect(allocation.success).toBe(false);
      expect(allocation.conflicts.length).toBeGreaterThan(0);
    });

    it('should provide alternative suggestions when primary allocation fails', () => {
      const requirement: RoomRequirement = {
        capacity: 500, // Too large for any room
        type: 'lecture_hall'
      };

      const allocation = roomSchedulingEngine.allocateRoom(
        mockTimetableEntry,
        requirement
      );

      expect(allocation.success).toBe(false);
      expect(allocation.alternatives.length).toBeGreaterThan(0);
    });

    it('should respect scheduling options', () => {
      const options: SchedulingOptions = {
        allowPartialCapacity: true,
        preferSameBuilding: true,
        maxDistanceMeters: 100
      };

      const requirement: RoomRequirement = {
        capacity: 150,
        type: 'lecture_hall'
      };

      const allocation = roomSchedulingEngine.allocateRoom(
        mockTimetableEntry,
        requirement,
        options
      );

      expect(allocation.success).toBe(true);
    });
  });

  describe('scheduleMultipleEntries', () => {
    const mockEntries: TimetableEntry[] = [
      {
        id: 'entry_3',
        courseId: 'course_1',
        courseName: 'Programming',
        facultyId: 'faculty_1',
        facultyName: 'Dr. Smith',
        roomId: '',
        roomName: '',
        dayOfWeek: 'monday',
        startTime: '11:00',
        endTime: '12:30',
        type: 'lecture',
        duration: 90
      },
      {
        id: 'entry_4',
        courseId: 'course_2',
        courseName: 'Database Systems',
        facultyId: 'faculty_2',
        facultyName: 'Dr. Jones',
        roomId: '',
        roomName: '',
        dayOfWeek: 'tuesday',
        startTime: '14:00',
        endTime: '15:30',
        type: 'practical',
        duration: 90
      }
    ];

    const mockRequirements: RoomRequirement[] = [
      { capacity: 50, type: 'lecture_hall' },
      { capacity: 30, type: 'computer_lab', requiredFacilities: ['computers'] }
    ];

    it('should schedule multiple entries successfully', () => {
      const result = roomSchedulingEngine.scheduleMultipleEntries(
        mockEntries,
        mockRequirements
      );

      expect(result.success).toBe(true);
      expect(result.allocations).toHaveLength(2);
      expect(result.failures).toHaveLength(0);
    });

    it('should handle partial failures gracefully', () => {
      const impossibleRequirements: RoomRequirement[] = [
        { capacity: 50, type: 'lecture_hall' },
        { capacity: 1000, type: 'lecture_hall' } // Impossible requirement
      ];

      const result = roomSchedulingEngine.scheduleMultipleEntries(
        mockEntries,
        impossibleRequirements
      );

      expect(result.success).toBe(false);
      expect(result.allocations).toHaveLength(1); // One successful
      expect(result.failures).toHaveLength(1); // One failed
    });

    it('should optimize for minimal conflicts', () => {
      const options: SchedulingOptions = {
        optimizeForMinimalConflicts: true,
        allowPartialCapacity: true
      };

      const result = roomSchedulingEngine.scheduleMultipleEntries(
        mockEntries,
        mockRequirements,
        options
      );

      expect(result.success).toBe(true);
      expect(result.totalConflicts).toBe(0);
    });
  });

  describe('calculateRoomSuitability', () => {
    const requirement: RoomRequirement = {
      capacity: 30,
      type: 'lecture_hall',
      requiredFacilities: ['projector'],
      preferredFacilities: ['microphone']
    };

    it('should calculate suitability score with all factors', () => {
      const room = mockRooms[0]; // Lecture Hall A
      const score = roomSchedulingEngine.calculateRoomSuitability(room, requirement);

      expect(score.score).toBeGreaterThan(0);
      expect(score.breakdown.capacityScore).toBeGreaterThan(0);
      expect(score.breakdown.typeMatch).toBeGreaterThan(0);
      expect(score.breakdown.facilityScore).toBeGreaterThan(0);
    });

    it('should penalize rooms that dont match type', () => {
      const room = mockRooms[1]; // Computer Lab (wrong type)
      const score = roomSchedulingEngine.calculateRoomSuitability(room, requirement);

      expect(score.breakdown.typeMatch).toBe(0);
      expect(score.score).toBeLessThan(1);
    });

    it('should penalize rooms missing required facilities', () => {
      const requirementWithMissingFacility: RoomRequirement = {
        capacity: 25,
        type: 'tutorial_room',
        requiredFacilities: ['laboratory_equipment'] // Not available in tutorial room
      };

      const room = mockRooms[2]; // Tutorial Room B
      const score = roomSchedulingEngine.calculateRoomSuitability(room, requirementWithMissingFacility);

      expect(score.breakdown.facilityScore).toBe(0);
      expect(score.conflicts).toContain('Missing required facility: laboratory_equipment');
    });

    it('should provide recommendations for improvements', () => {
      const room = mockRooms[2]; // Tutorial Room B (small capacity)
      const largeCapacityRequirement: RoomRequirement = {
        capacity: 50,
        type: 'tutorial_room'
      };

      const score = roomSchedulingEngine.calculateRoomSuitability(room, largeCapacityRequirement);

      expect(score.recommendations.length).toBeGreaterThan(0);
      expect(score.recommendations[0]).toContain('capacity');
    });
  });

  describe('checkRoomAvailability', () => {
    it('should return true for available time slots', () => {
      const isAvailable = roomSchedulingEngine.checkRoomAvailability(
        'room_2',
        'tuesday',
        '14:00',
        '15:30'
      );

      expect(isAvailable).toBe(true);
    });

    it('should return false for conflicting time slots', () => {
      const isAvailable = roomSchedulingEngine.checkRoomAvailability(
        'room_1',
        'monday',
        '09:30', // Overlaps with existing allocation
        '10:00'
      );

      expect(isAvailable).toBe(false);
    });

    it('should handle exact time boundaries correctly', () => {
      // Test boundary conditions
      const isAvailableBefore = roomSchedulingEngine.checkRoomAvailability(
        'room_1',
        'monday',
        '08:00',
        '09:00' // Ends exactly when existing allocation starts
      );

      const isAvailableAfter = roomSchedulingEngine.checkRoomAvailability(
        'room_1',
        'monday',
        '10:30', // Starts exactly when existing allocation ends
        '12:00'
      );

      expect(isAvailableBefore).toBe(true);
      expect(isAvailableAfter).toBe(true);
    });
  });

  describe('getUtilizationReport', () => {
    it('should generate utilization report for all rooms', () => {
      const report = roomSchedulingEngine.getUtilizationReport();

      expect(report).toHaveProperty('totalRooms');
      expect(report).toHaveProperty('averageUtilization');
      expect(report).toHaveProperty('roomDetails');
      expect(report.roomDetails).toHaveLength(mockRooms.filter(r => r.isActive).length);
    });

    it('should calculate utilization percentages correctly', () => {
      const report = roomSchedulingEngine.getUtilizationReport();
      
      // Room 1 has one allocation (1.5 hours out of total possible hours)
      const room1Details = report.roomDetails.find(r => r.roomId === 'room_1');
      expect(room1Details).toBeDefined();
      expect(room1Details!.utilizationPercentage).toBeGreaterThan(0);
    });

    it('should identify underutilized and overutilized rooms', () => {
      const report = roomSchedulingEngine.getUtilizationReport();
      
      expect(report).toHaveProperty('underutilizedRooms');
      expect(report).toHaveProperty('highDemandRooms');
      expect(Array.isArray(report.underutilizedRooms)).toBe(true);
      expect(Array.isArray(report.highDemandRooms)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle invalid time formats gracefully', () => {
      const requirement: RoomRequirement = {
        capacity: 30,
        type: 'lecture_hall'
      };

      expect(() => {
        roomSchedulingEngine.findSuitableRooms(
          requirement,
          'monday',
          'invalid-time',
          '10:30'
        );
      }).not.toThrow();
    });

    it('should handle empty rooms array', () => {
      const emptyEngine = new RoomSchedulingEngine([], []);
      
      const requirement: RoomRequirement = {
        capacity: 30,
        type: 'lecture_hall'
      };

      const result = emptyEngine.findSuitableRooms(
        requirement,
        'monday',
        '09:00',
        '10:30'
      );

      expect(result).toHaveLength(0);
    });

    it('should handle mismatched entries and requirements arrays', () => {
      const entries = [mockTimetableEntry];
      const requirements: RoomRequirement[] = []; // Empty requirements

      const result = roomSchedulingEngine.scheduleMultipleEntries(entries, requirements);

      expect(result.success).toBe(false);
      expect(result.failures).toHaveLength(1);
    });
  });

  describe('optimization strategies', () => {
    it('should prefer rooms in the same building when optimizing for proximity', () => {
      const options: SchedulingOptions = {
        preferSameBuilding: true,
        buildingPreference: 'Main Building'
      };

      const requirement: RoomRequirement = {
        capacity: 25,
        type: 'tutorial_room'
      };

      const suitableRooms = roomSchedulingEngine.findSuitableRooms(
        requirement,
        'wednesday',
        '14:00',
        '15:30',
        options
      );

      // Should prefer room_3 (Main Building) over others
      expect(suitableRooms[0].roomId).toBe('room_3');
    });

    it('should balance capacity utilization when optimizing', () => {
      const requirement: RoomRequirement = {
        capacity: 20,
        type: 'tutorial_room',
        minCapacityUtilization: 0.8 // Prefer rooms with good utilization
      };

      const suitableRooms = roomSchedulingEngine.findSuitableRooms(
        requirement,
        'friday',
        '11:00',
        '12:30'
      );

      if (suitableRooms.length > 0) {
        expect(suitableRooms[0].breakdown.utilizationScore).toBeGreaterThan(0.5);
      }
    });
  });
});