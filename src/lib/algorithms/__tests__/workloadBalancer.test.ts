import { WorkloadBalancer } from '../workloadBalancer';
import type { 
  Faculty, 
  FacultyPreference,
  CourseOffering,
  Timetable,
  TimetableEntry 
} from '@/types/entities';

describe('WorkloadBalancer', () => {
  let balancer: WorkloadBalancer;
  let mockFaculties: Faculty[];
  let mockFacultyPreferences: FacultyPreference[];
  let mockCourseOfferings: CourseOffering[];
  let mockTimetables: Timetable[];

  beforeEach(() => {
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
      },
      {
        id: 'faculty3',
        staffCode: 'F003',
        instituteEmail: 'faculty3@test.com',
        gtuName: 'Dr. Bob Wilson',
        firstName: 'Bob',
        lastName: 'Wilson',
        department: 'Computer Science',
        status: 'active'
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
        unavailableSlots: [],
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        priority: 8
      }
    ];

    mockCourseOfferings = [
      {
        id: 'co1',
        courseId: 'course1',
        batchId: 'batch1',
        academicYear: '2024-25',
        semester: 1,
        facultyIds: ['faculty1', 'faculty2'],
        status: 'scheduled',
        academicTermId: 'test_term_123'
      },
      {
        id: 'co2',
        courseId: 'course2',
        batchId: 'batch1',
        academicYear: '2024-25',
        semester: 1,
        facultyIds: ['faculty2', 'faculty3'],
        status: 'scheduled',
        academicTermId: 'test_term_123'
      }
    ];

    mockTimetables = [
      {
        id: 'tt1',
        name: 'Test Timetable 1',
        academicYear: '2024-25',
        semester: 1,
        programId: 'program1',
        batchId: 'batch1',
        version: '1.0',
        status: 'published',
        effectiveDate: new Date().toISOString(),
        entries: [
          {
            dayOfWeek: 'Monday',
            startTime: '09:00',
            endTime: '10:00',
            courseOfferingId: 'co1',
            courseId: 'course1',
            facultyId: 'faculty1',
            roomId: 'room1',
            entryType: 'lecture'
          },
          {
            dayOfWeek: 'Monday',
            startTime: '10:00',
            endTime: '11:00',
            courseOfferingId: 'co1',
            courseId: 'course1',
            facultyId: 'faculty1',
            roomId: 'room1',
            entryType: 'lecture'
          },
          {
            dayOfWeek: 'Tuesday',
            startTime: '09:00',
            endTime: '10:00',
            courseOfferingId: 'co2',
            courseId: 'course2',
            facultyId: 'faculty2',
            roomId: 'room2',
            entryType: 'lecture'
          },
          {
            dayOfWeek: 'Wednesday',
            startTime: '14:00',
            endTime: '15:00',
            courseOfferingId: 'co2',
            courseId: 'course2',
            facultyId: 'faculty3',
            roomId: 'room3',
            entryType: 'lecture'
          }
        ]
      }
    ];

    balancer = new WorkloadBalancer(
      mockFaculties,
      mockFacultyPreferences,
      mockCourseOfferings
    );
  });

  describe('Workload Analysis', () => {
    it('should analyze faculty workloads correctly', () => {
      const analysis = balancer.analyzeWorkload(mockTimetables);

      expect(analysis).toBeDefined();
      expect(analysis.facultyWorkloads).toBeDefined();
      expect(analysis.facultyWorkloads.length).toBe(mockFaculties.length);
      expect(analysis.averageWorkload).toBeGreaterThanOrEqual(0);
      expect(analysis.workloadVariance).toBeGreaterThanOrEqual(0);
      expect(analysis.balanceScore).toBeGreaterThanOrEqual(0);
      expect(analysis.balanceScore).toBeLessThanOrEqual(100);
      expect(analysis.recommendations).toBeDefined();
      expect(analysis.alerts).toBeDefined();
    });

    it('should calculate faculty total hours correctly', () => {
      const analysis = balancer.analyzeWorkload(mockTimetables);
      
      const faculty1Workload = analysis.facultyWorkloads.find(w => w.facultyId === 'faculty1');
      const faculty2Workload = analysis.facultyWorkloads.find(w => w.facultyId === 'faculty2');
      const faculty3Workload = analysis.facultyWorkloads.find(w => w.facultyId === 'faculty3');

      expect(faculty1Workload?.totalHours).toBe(2); // 2 hours (2 x 1-hour slots)
      expect(faculty2Workload?.totalHours).toBe(1); // 1 hour
      expect(faculty3Workload?.totalHours).toBe(1); // 1 hour
    });

    it('should calculate daily hours distribution correctly', () => {
      const analysis = balancer.analyzeWorkload(mockTimetables);
      
      const faculty1Workload = analysis.facultyWorkloads.find(w => w.facultyId === 'faculty1');
      
      expect(faculty1Workload?.dailyHours.Monday).toBe(2);
      expect(faculty1Workload?.dailyHours.Tuesday).toBe(0);
      expect(faculty1Workload?.dailyHours.Wednesday).toBe(0);
    });

    it('should calculate consecutive hours correctly', () => {
      const analysis = balancer.analyzeWorkload(mockTimetables);
      
      const faculty1Workload = analysis.facultyWorkloads.find(w => w.facultyId === 'faculty1');
      
      // Faculty1 has 2 consecutive hours on Monday (9-10, 10-11)
      expect(faculty1Workload?.consecutiveHours).toBe(2);
    });

    it('should calculate course load correctly', () => {
      const analysis = balancer.analyzeWorkload(mockTimetables);
      
      const faculty1Workload = analysis.facultyWorkloads.find(w => w.facultyId === 'faculty1');
      const faculty2Workload = analysis.facultyWorkloads.find(w => w.facultyId === 'faculty2');
      
      expect(faculty1Workload?.courseLoad).toBe(1); // Teaching 1 unique course
      expect(faculty2Workload?.courseLoad).toBe(1); // Teaching 1 unique course
    });

    it('should calculate utilization scores appropriately', () => {
      const analysis = balancer.analyzeWorkload(mockTimetables);
      
      for (const workload of analysis.facultyWorkloads) {
        expect(workload.utilizationScore).toBeGreaterThanOrEqual(0);
        expect(workload.utilizationScore).toBeLessThanOrEqual(100);
      }
    });

    it('should calculate preference scores when preferences exist', () => {
      const analysis = balancer.analyzeWorkload(mockTimetables);
      
      const faculty1Workload = analysis.facultyWorkloads.find(w => w.facultyId === 'faculty1');
      
      // Faculty1 has preferences and is scheduled in preferred time/course
      expect(faculty1Workload?.preferenceScore).toBeGreaterThan(50);
    });

    it('should handle empty timetables', () => {
      const analysis = balancer.analyzeWorkload([]);
      
      expect(analysis.facultyWorkloads.length).toBe(mockFaculties.length);
      expect(analysis.averageWorkload).toBe(0);
      expect(analysis.workloadVariance).toBe(0);
      
      for (const workload of analysis.facultyWorkloads) {
        expect(workload.totalHours).toBe(0);
        expect(workload.courseLoad).toBe(0);
      }
    });
  });

  describe('Alert Generation', () => {
    it('should generate overload alerts for excessive hours', () => {
      // Create timetable with overloaded faculty
      const overloadedTimetable: Timetable = {
        ...mockTimetables[0],
        entries: Array.from({ length: 35 }, (_, i) => ({
          dayOfWeek: 'Monday' as const,
          startTime: '09:00',
          endTime: '10:00',
          courseOfferingId: 'co1',
          courseId: 'course1',
          facultyId: 'faculty1',
          roomId: 'room1',
          entryType: 'lecture' as const
        }))
      };

      const analysis = balancer.analyzeWorkload([overloadedTimetable]);
      
      const overloadAlerts = analysis.alerts.filter(a => 
        a.type === 'overload' && a.facultyId === 'faculty1'
      );
      
      expect(overloadAlerts.length).toBeGreaterThan(0);
      expect(overloadAlerts[0].severity).toBe('high');
    });

    it('should generate underload alerts for insufficient hours', () => {
      // Create timetable with minimal assignments
      const underloadedTimetable: Timetable = {
        ...mockTimetables[0],
        entries: [
          {
            dayOfWeek: 'Monday',
            startTime: '09:00',
            endTime: '10:00',
            courseOfferingId: 'co1',
            courseId: 'course1',
            facultyId: 'faculty1',
            roomId: 'room1',
            entryType: 'lecture'
          }
        ]
      };

      const analysis = balancer.analyzeWorkload([underloadedTimetable]);
      
      const underloadAlerts = analysis.alerts.filter(a => 
        a.type === 'underload' && a.facultyId === 'faculty1'
      );
      
      expect(underloadAlerts.length).toBeGreaterThan(0);
    });

    it('should generate consecutive hours alerts', () => {
      // Create timetable with excessive consecutive hours
      const consecutiveTimetable: Timetable = {
        ...mockTimetables[0],
        entries: Array.from({ length: 6 }, (_, i) => ({
          dayOfWeek: 'Monday' as const,
          startTime: `${9 + i}:00`,
          endTime: `${10 + i}:00`,
          courseOfferingId: 'co1',
          courseId: 'course1',
          facultyId: 'faculty1',
          roomId: 'room1',
          entryType: 'lecture' as const
        }))
      };

      const analysis = balancer.analyzeWorkload([consecutiveTimetable]);
      
      const consecutiveAlerts = analysis.alerts.filter(a => 
        a.type === 'consecutive' && a.facultyId === 'faculty1'
      );
      
      expect(consecutiveAlerts.length).toBeGreaterThan(0);
    });

    it('should sort alerts by severity', () => {
      // Create mixed severity scenario
      const mixedTimetable: Timetable = {
        ...mockTimetables[0],
        entries: [
          // Overload faculty1
          ...Array.from({ length: 35 }, (_, i) => ({
            dayOfWeek: 'Monday' as const,
            startTime: '09:00',
            endTime: '10:00',
            courseOfferingId: 'co1',
            courseId: 'course1',
            facultyId: 'faculty1',
            roomId: 'room1',
            entryType: 'lecture' as const
          })),
          // Underload faculty2
          {
            dayOfWeek: 'Tuesday' as const,
            startTime: '09:00',
            endTime: '10:00',
            courseOfferingId: 'co2',
            courseId: 'course2',
            facultyId: 'faculty2',
            roomId: 'room2',
            entryType: 'lecture' as const
          }
        ]
      };

      const analysis = balancer.analyzeWorkload([mixedTimetable]);
      
      // Check that high severity alerts come first
      if (analysis.alerts.length > 1) {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        for (let i = 0; i < analysis.alerts.length - 1; i++) {
          const currentSeverity = severityOrder[analysis.alerts[i].severity];
          const nextSeverity = severityOrder[analysis.alerts[i + 1].severity];
          expect(currentSeverity).toBeGreaterThanOrEqual(nextSeverity);
        }
      }
    });
  });

  describe('Redistribution Suggestions', () => {
    it('should suggest redistribution for imbalanced workloads', () => {
      // Create imbalanced scenario
      const imbalancedTimetable: Timetable = {
        ...mockTimetables[0],
        entries: [
          // Overload faculty1
          ...Array.from({ length: 30 }, (_, i) => ({
            dayOfWeek: 'Monday' as const,
            startTime: '09:00',
            endTime: '10:00',
            courseOfferingId: 'co1',
            courseId: 'course1',
            facultyId: 'faculty1',
            roomId: 'room1',
            entryType: 'lecture' as const
          })),
          // Minimal load for faculty2
          {
            dayOfWeek: 'Tuesday' as const,
            startTime: '09:00',
            endTime: '10:00',
            courseOfferingId: 'co2',
            courseId: 'course2',
            facultyId: 'faculty2',
            roomId: 'room2',
            entryType: 'lecture' as const
          }
        ]
      };

      const result = balancer.suggestRedistribution([imbalancedTimetable]);
      
      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.estimatedImprovement).toBeGreaterThanOrEqual(0);
      expect(result.estimatedImprovement).toBeLessThanOrEqual(100);
    });

    it('should prioritize suggestions correctly', () => {
      const imbalancedTimetable: Timetable = {
        ...mockTimetables[0],
        entries: [
          ...Array.from({ length: 25 }, (_, i) => ({
            dayOfWeek: 'Monday' as const,
            startTime: '09:00',
            endTime: '10:00',
            courseOfferingId: 'co1',
            courseId: 'course1',
            facultyId: 'faculty1',
            roomId: 'room1',
            entryType: 'lecture' as const
          }))
        ]
      };

      const result = balancer.suggestRedistribution([imbalancedTimetable]);
      
      if (result.suggestions.length > 1) {
        // Check that suggestions are ordered by priority (descending)
        for (let i = 0; i < result.suggestions.length - 1; i++) {
          expect(result.suggestions[i].priority).toBeGreaterThanOrEqual(
            result.suggestions[i + 1].priority
          );
        }
      }
    });

    it('should handle balanced workloads appropriately', () => {
      // Create balanced scenario
      const balancedTimetable: Timetable = {
        ...mockTimetables[0],
        entries: [
          {
            dayOfWeek: 'Monday',
            startTime: '09:00',
            endTime: '10:00',
            courseOfferingId: 'co1',
            courseId: 'course1',
            facultyId: 'faculty1',
            roomId: 'room1',
            entryType: 'lecture'
          },
          {
            dayOfWeek: 'Tuesday',
            startTime: '09:00',
            endTime: '10:00',
            courseOfferingId: 'co2',
            courseId: 'course2',
            facultyId: 'faculty2',
            roomId: 'room2',
            entryType: 'lecture'
          }
        ]
      };

      const result = balancer.suggestRedistribution([balancedTimetable]);
      
      // Should have fewer or no suggestions for balanced workloads
      expect(result.suggestions.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Utility Functions', () => {
    it('should calculate hours from time strings correctly', () => {
      const calculateHours = (balancer as any).calculateHours.bind(balancer);
      
      expect(calculateHours('09:00', '10:00')).toBe(1);
      expect(calculateHours('09:00', '10:30')).toBe(1.5);
      expect(calculateHours('14:00', '16:00')).toBe(2);
    });

    it('should convert time to minutes correctly', () => {
      const timeToMinutes = (balancer as any).timeToMinutes.bind(balancer);
      
      expect(timeToMinutes('09:00')).toBe(540);
      expect(timeToMinutes('10:30')).toBe(630);
      expect(timeToMinutes('14:15')).toBe(855);
    });

    it('should generate appropriate recommendations', () => {
      const analysis = balancer.analyzeWorkload(mockTimetables);
      
      expect(analysis.recommendations).toBeDefined();
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      
      for (const recommendation of analysis.recommendations) {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(0);
      }
    });
  });
});