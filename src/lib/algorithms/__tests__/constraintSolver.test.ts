import { ConstraintSolver } from '../constraintSolver';
import type { 
  CourseOffering, 
  Faculty, 
  Room, 
  Batch,
  FacultyPreference,
  TimetableConstraints,
  AutoGenerationRequest 
} from '@/types/entities';

describe('ConstraintSolver', () => {
  let solver: ConstraintSolver;
  let mockCourseOfferings: CourseOffering[];
  let mockFaculties: Faculty[];
  let mockRooms: Room[];
  let mockBatches: Batch[];
  let mockFacultyPreferences: FacultyPreference[];
  let mockConstraints: TimetableConstraints;

  beforeEach(() => {
    // Mock data setup (similar to optimizer tests)
    mockCourseOfferings = [
      {
        id: 'co1',
        courseId: 'course1',
        batchId: 'batch1',
        academicYear: '2024-25',
        semester: 1,
        facultyIds: ['faculty1', 'faculty2'],
        roomIds: ['room1', 'room2'],
        status: 'scheduled',
        academicTermId: 'test_term_123'
      },
      {
        id: 'co2',
        courseId: 'course2',
        batchId: 'batch1',
        academicYear: '2024-25',
        semester: 1,
        facultyIds: ['faculty2'],
        roomIds: ['room2'],
        status: 'scheduled',
        academicTermId: 'test_term_123'
      }
    ];

    mockFaculties = [
      {
        id: 'faculty1',
        staffCode: 'F001',
        instituteEmail: 'faculty1@test.com',
        gtuName: 'Dr. John Doe',
        firstName: 'John',
        lastName: 'Doe',
        department: 'Computer Science',
        status: 'active'
      },
      {
        id: 'faculty2',
        staffCode: 'F002',
        instituteEmail: 'faculty2@test.com',
        gtuName: 'Dr. Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        department: 'Computer Science',
        status: 'active'
      }
    ];

    mockRooms = [
      {
        id: 'room1',
        roomNumber: '101',
        name: 'Lecture Hall 1',
        buildingId: 'building1',
        type: 'Lecture Hall',
        capacity: 60,
        status: 'available'
      },
      {
        id: 'room2',
        roomNumber: '102',
        name: 'Lecture Hall 2',
        buildingId: 'building1',
        type: 'Lecture Hall',
        capacity: 80,
        status: 'available'
      }
    ];

    mockBatches = [
      {
        id: 'batch1',
        name: 'CSE 2024 Batch A',
        programId: 'program1',
        academicYear: '2024-25',
        semester: 1,
        startAcademicYear: 2024,
        status: 'active',
        strength: 60
      }
    ];

    mockFacultyPreferences = [
      {
        id: 'pref1',
        facultyId: 'faculty1',
        academicYear: '2024-25',
        semester: 1,
        preferredCourses: [
          {
            courseId: 'course1',
            preference: 'high',
            expertise: 9,
            previouslyTaught: true
          }
        ],
        timePreferences: [
          {
            dayOfWeek: 'Monday',
            startTime: '09:00',
            endTime: '12:00',
            preference: 'preferred'
          }
        ],
        roomPreferences: ['room1'],
        maxHoursPerWeek: 20,
        maxConsecutiveHours: 3,
        unavailableSlots: [
          {
            dayOfWeek: 'Friday',
            startTime: '14:00',
            endTime: '17:00'
          }
        ],
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        priority: 8
      }
    ];

    mockConstraints = {
      noFacultyConflicts: true,
      noRoomConflicts: true,
      noStudentConflicts: true,
      respectFacultyUnavailability: true,
      respectRoomCapacity: true,
      respectFacultyPreferences: true,
      balanceWorkload: true,
      minimizeGaps: true,
      preferMorningSlots: true,
      groupSimilarCourses: false,
      maxConsecutiveHours: 3,
      maxDailyHours: 6,
      lunchBreakRequired: true,
      lunchBreakStart: '12:00',
      lunchBreakEnd: '13:00'
    };

    solver = new ConstraintSolver(
      mockCourseOfferings,
      mockFaculties,
      mockRooms,
      mockBatches,
      mockFacultyPreferences,
      mockConstraints
    );
  });

  describe('CSP Generation', () => {
    it('should generate valid timetables using constraint satisfaction', async () => {
      const request: AutoGenerationRequest = {
        academicYear: '2024-25',
        semester: 1,
        batchIds: ['batch1'],
        algorithm: 'constraint_satisfaction',
        constraints: mockConstraints,
        considerPreferences: true
      };

      const result = await solver.generateTimetablesCSP(request);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(result.timetables).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.conflicts).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should respect hard constraints in CSP solutions', async () => {
      const request: AutoGenerationRequest = {
        academicYear: '2024-25',
        semester: 1,
        batchIds: ['batch1'],
        algorithm: 'constraint_satisfaction',
        constraints: mockConstraints,
        considerPreferences: false
      };

      const result = await solver.generateTimetablesCSP(request);

      if (result.success && result.timetables.length > 0) {
        const timetable = result.timetables[0];
        
        // Verify no critical conflicts exist
        const criticalConflicts = result.conflicts.filter(c => c.severity === 'critical');
        expect(criticalConflicts.length).toBe(0);

        // Verify entries have valid assignments
        for (const entry of timetable.entries) {
          expect(entry.facultyId).toBeTruthy();
          expect(entry.roomId).toBeTruthy();
          expect(entry.courseId).toBeTruthy();
          expect(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(entry.dayOfWeek)).toBe(true);
        }
      }
    });

    it('should handle faculty unavailability constraints', async () => {
      // Add unavailable slot for faculty1 on Friday afternoon
      const request: AutoGenerationRequest = {
        academicYear: '2024-25',
        semester: 1,
        batchIds: ['batch1'],
        algorithm: 'constraint_satisfaction',
        constraints: mockConstraints,
        considerPreferences: true
      };

      const result = await solver.generateTimetablesCSP(request);

      if (result.success && result.timetables.length > 0) {
        const timetable = result.timetables[0];
        
        // Check that faculty1 is not scheduled during unavailable slots
        const faculty1Entries = timetable.entries.filter(e => e.facultyId === 'faculty1');
        const fridayAfternoonEntries = faculty1Entries.filter(e => 
          e.dayOfWeek === 'Friday' && 
          parseInt(e.startTime.split(':')[0]) >= 14
        );
        
        expect(fridayAfternoonEntries.length).toBe(0);
      }
    });

    it('should handle empty course offerings', async () => {
      const emptySolver = new ConstraintSolver(
        [],
        mockFaculties,
        mockRooms,
        mockBatches,
        mockFacultyPreferences,
        mockConstraints
      );

      const request: AutoGenerationRequest = {
        academicYear: '2024-25',
        semester: 1,
        batchIds: ['batch1'],
        algorithm: 'constraint_satisfaction',
        constraints: mockConstraints,
        considerPreferences: false
      };

      const result = await emptySolver.generateTimetablesCSP(request);
      
      expect(result.success).toBe(false);
      expect(result.timetables.length).toBe(0);
    });

    it('should generate appropriate recommendations', async () => {
      const request: AutoGenerationRequest = {
        academicYear: '2024-25',
        semester: 1,
        batchIds: ['batch1'],
        algorithm: 'constraint_satisfaction',
        constraints: mockConstraints,
        considerPreferences: true
      };

      const result = await solver.generateTimetablesCSP(request);
      
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(typeof result.recommendations[0]).toBe('string');
    });
  });

  describe('Constraint Handling', () => {
    it('should initialize constraints correctly', () => {
      expect(solver).toBeDefined();
      
      // Test that hard constraints are properly set up
      const hardConstraints = (solver as any).hardConstraints;
      expect(hardConstraints).toBeDefined();
      expect(Array.isArray(hardConstraints)).toBe(true);
      
      // Test that soft constraints are properly set up
      const softConstraints = (solver as any).softConstraints;
      expect(softConstraints).toBeDefined();
      expect(Array.isArray(softConstraints)).toBe(true);
    });

    it('should validate faculty availability correctly', () => {
      const isFacultyAvailable = (solver as any).isFacultyAvailable.bind(solver);
      
      // Faculty1 should be available on Monday morning (preferred time)
      expect(isFacultyAvailable(
        'faculty1', 
        'Monday', 
        { startTime: '09:00', endTime: '10:00' }, 
        '2024-25', 
        1
      )).toBe(true);

      // Faculty1 should not be available on Friday afternoon (unavailable slot)
      expect(isFacultyAvailable(
        'faculty1', 
        'Friday', 
        { startTime: '14:00', endTime: '15:00' }, 
        '2024-25', 
        1
      )).toBe(false);

      // Faculty1 should not be available on Sunday (not a working day)
      expect(isFacultyAvailable(
        'faculty1', 
        'Sunday', 
        { startTime: '09:00', endTime: '10:00' }, 
        '2024-25', 
        1
      )).toBe(false);
    });

    it('should detect time overlaps correctly', () => {
      const timeOverlaps = (solver as any).timeOverlaps.bind(solver);
      
      const slot1 = { startTime: '09:00', endTime: '10:00' };
      const slot2 = { startTime: '09:30', endTime: '10:30' };
      const slot3 = { startTime: '10:00', endTime: '11:00' };
      
      expect(timeOverlaps(slot1, slot2)).toBe(true);
      expect(timeOverlaps(slot1, slot3)).toBe(false);
    });

    it('should convert time to minutes correctly', () => {
      const timeToMinutes = (solver as any).timeToMinutes.bind(solver);
      
      expect(timeToMinutes('09:00')).toBe(540);
      expect(timeToMinutes('12:30')).toBe(750);
      expect(timeToMinutes('15:45')).toBe(945);
    });
  });

  describe('Domain Generation', () => {
    it('should generate valid domains for course offerings', () => {
      const generateDomain = (solver as any).generateDomain.bind(solver);
      const courseOffering = mockCourseOfferings[0];
      
      const domain = generateDomain(courseOffering);
      
      expect(Array.isArray(domain)).toBe(true);
      expect(domain.length).toBeGreaterThan(0);
      
      // Check that each assignment in domain has required properties
      for (const assignment of domain) {
        expect(assignment.dayOfWeek).toBeDefined();
        expect(assignment.timeSlot).toBeDefined();
        expect(assignment.facultyId).toBeDefined();
        expect(assignment.roomId).toBeDefined();
        expect(assignment.timeSlot.startTime).toBeDefined();
        expect(assignment.timeSlot.endTime).toBeDefined();
      }
    });

    it('should filter domain based on faculty availability', () => {
      const generateDomain = (solver as any).generateDomain.bind(solver);
      const courseOffering = {
        ...mockCourseOfferings[0],
        facultyIds: ['faculty1'] // Only faculty1 who has availability constraints
      };
      
      const domain = generateDomain(courseOffering);
      
      // Should not contain Friday afternoon slots for faculty1
      const fridayAfternoonSlots = domain.filter((assignment: any) => 
        assignment.dayOfWeek === 'Friday' && 
        assignment.facultyId === 'faculty1' &&
        parseInt(assignment.timeSlot.startTime.split(':')[0]) >= 14
      );
      
      expect(fridayAfternoonSlots.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid batch IDs gracefully', async () => {
      const request: AutoGenerationRequest = {
        academicYear: '2024-25',
        semester: 1,
        batchIds: ['nonexistent-batch'],
        algorithm: 'constraint_satisfaction',
        constraints: mockConstraints,
        considerPreferences: false
      };

      const result = await solver.generateTimetablesCSP(request);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.timetables.length).toBe(0);
    });

    it('should handle exceptions during solving', async () => {
      // Create a solver with invalid data to trigger errors
      const invalidSolver = new ConstraintSolver(
        mockCourseOfferings,
        [], // No faculties
        [], // No rooms
        mockBatches,
        mockFacultyPreferences,
        mockConstraints
      );

      const request: AutoGenerationRequest = {
        academicYear: '2024-25',
        semester: 1,
        batchIds: ['batch1'],
        algorithm: 'constraint_satisfaction',
        constraints: mockConstraints,
        considerPreferences: false
      };

      const result = await invalidSolver.generateTimetablesCSP(request);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.executionTime).toBe('number');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });
  });
});