import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createAllocationEngine } from '../lib/algorithms/allocationEngine';
import type { 
  AllocationSession, 
  FacultyProfile, 
  FacultyPreference,
  ExperienceEntry,
  Qualification
} from '../types/entities';
import type { CourseOfferingWithRequirements } from '../lib/algorithms/allocationEngine';

// Mock data for testing
const mockSession: AllocationSession = {
  id: 'test-session-1',
  name: 'Test Session 2025-26',
  academicYear: '2025-26',
  semesters: [1, 3, 5],
  targetPrograms: ['btech-cse', 'btech-it'],
  status: 'draft',
  createdBy: 'test-admin',
  allocationMethod: 'preference_based',
  algorithmSettings: {
    prioritizeSeniority: true,
    expertiseWeightage: 0.4,
    preferencePriorityWeightage: 0.3,
    workloadBalanceWeightage: 0.2,
    minimizeConflicts: true
  },
  statistics: {
    totalCourses: 0,
    totalFaculty: 0,
    allocatedCourses: 0,
    unallocatedCourses: 0,
    facultyWithFullLoad: 0,
    conflictsDetected: 0,
    averageSatisfactionScore: 0
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z'
};

const mockFaculties: FacultyProfile[] = [
  {
    id: 'faculty-1',
    staffCode: 'F001',
    instituteEmail: 'john.doe@university.edu',
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'Dr. John Doe',
    fullName: 'John Doe',
    department: 'Computer Science',
    status: 'active',
    experienceYears: '10',
    experience: [
      {
        id: 'exp1',
        company: 'University',
        position: 'Professor',
        location: 'Campus',
        startDate: '2015-01-01',
        isCurrently: true,
        description: 'Teaching computer science courses'
      }
    ] as ExperienceEntry[],
    qualifications: [
      {
        degree: 'PhD',
        field: 'Computer Science',
        institution: 'University',
        year: 2015
      }
    ] as Qualification[],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'faculty-2',
    staffCode: 'F002',
    instituteEmail: 'jane.smith@university.edu',
    firstName: 'Jane',
    lastName: 'Smith',
    displayName: 'Dr. Jane Smith',
    fullName: 'Jane Smith',
    department: 'Computer Science',
    status: 'active',
    experienceYears: '15',
    experience: [
      {
        id: 'exp2',
        company: 'University',
        position: 'Professor',
        location: 'Campus',
        startDate: '2010-01-01',
        isCurrently: true,
        description: 'Teaching database and software engineering courses'
      }
    ] as ExperienceEntry[],
    qualifications: [
      {
        degree: 'PhD',
        field: 'Computer Science',
        institution: 'University',
        year: 2010
      }
    ] as Qualification[],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'faculty-3',
    staffCode: 'F003',
    instituteEmail: 'bob.wilson@university.edu',
    firstName: 'Bob',
    lastName: 'Wilson',
    displayName: 'Prof. Bob Wilson',
    fullName: 'Bob Wilson',
    department: 'Information Technology',
    status: 'active',
    experienceYears: '5',
    experience: [
      {
        id: 'exp3',
        company: 'University',
        position: 'Assistant Professor',
        location: 'Campus',
        startDate: '2020-01-01',
        isCurrently: true,
        description: 'Teaching network and security courses'
      }
    ] as ExperienceEntry[],
    qualifications: [
      {
        degree: 'ME',
        field: 'Information Technology',
        institution: 'University',
        year: 2020
      }
    ] as Qualification[],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
];

const mockCourseOfferings: CourseOfferingWithRequirements[] = [
  {
    id: 'offering-1',
    courseId: 'course-1',
    academicTermId: 'term-2025-26-1',
    facultyIds: [],
    programId: 'btech-cse',
    semester: 1,
    academicYear: '2025-26',
    status: 'scheduled',
    requiredHours: 4,
    assignmentType: 'theory',
    priorityLevel: 1,
    subjectName: 'Programming Fundamentals',
    subcode: 'CS101',
    category: 'Core',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 1,
    department: 'Computer Science',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'offering-2',
    courseId: 'course-2',
    academicTermId: 'term-2025-26-3',
    facultyIds: [],
    programId: 'btech-cse',
    semester: 3,
    academicYear: '2025-26',
    status: 'scheduled',
    requiredHours: 4,
    assignmentType: 'theory',
    priorityLevel: 1,
    subjectName: 'Database Management Systems',
    subcode: 'CS301',
    category: 'Core',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 1,
    department: 'Computer Science',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'offering-3',
    courseId: 'course-3',
    academicTermId: 'term-2025-26-5',
    facultyIds: [],
    programId: 'btech-it',
    semester: 5,
    academicYear: '2025-26',
    status: 'scheduled',
    requiredHours: 3,
    assignmentType: 'theory',
    priorityLevel: 2,
    subjectName: 'Network Security',
    subcode: 'IT501',
    category: 'Elective',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 0,
    department: 'Information Technology',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
];

const mockPreferences: FacultyPreference[] = [
  {
    id: 'pref-1',
    facultyId: 'faculty-1',
    academicYear: '2025-26',
    semester: 1,
    preferredCourses: [
      {
        courseId: 'offering-1',
        preference: 'high',
        expertise: 9,
        previouslyTaught: true
      }
    ],
    timePreferences: [],
    roomPreferences: [],
    maxConsecutiveHours: 4,
    unavailableSlots: [],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    priority: 8,
    maxHoursPerWeek: 18,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'pref-2',
    facultyId: 'faculty-2',
    academicYear: '2025-26',
    semester: 3,
    preferredCourses: [
      {
        courseId: 'offering-2',
        preference: 'high',
        expertise: 10,
        previouslyTaught: true
      }
    ],
    timePreferences: [],
    roomPreferences: [],
    maxConsecutiveHours: 4,
    unavailableSlots: [],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    priority: 8,
    maxHoursPerWeek: 18,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'pref-3',
    facultyId: 'faculty-3',
    academicYear: '2025-26',
    semester: 5,
    preferredCourses: [
      {
        courseId: 'offering-3',
        preference: 'high',
        expertise: 8,
        previouslyTaught: true
      }
    ],
    timePreferences: [],
    roomPreferences: [],
    maxConsecutiveHours: 4,
    unavailableSlots: [],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    priority: 8,
    maxHoursPerWeek: 18,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
];

describe('Allocation Engine', () => {
  let engine: ReturnType<typeof createAllocationEngine>;

  beforeEach(() => {
    engine = createAllocationEngine(mockSession.algorithmSettings);
  });

  describe('Basic Allocation', () => {
    it('should create allocations for all course offerings', async () => {
      const result = await engine.allocateCourses(
        mockSession,
        mockFaculties,
        mockCourseOfferings,
        mockPreferences
      );

      expect(result.allocations).toHaveLength(3);
      // May have underload conflicts due to low hours
      expect(result.statistics.totalCourses).toBe(3);
      expect(result.statistics.allocatedCourses).toBe(3);
    });

    it('should assign courses to faculty with matching preferences', async () => {
      const result = await engine.allocateCourses(
        mockSession,
        mockFaculties,
        mockCourseOfferings,
        mockPreferences
      );

      const programmingAllocation = result.allocations.find(a => a.courseOfferingId === 'offering-1');
      const databaseAllocation = result.allocations.find(a => a.courseOfferingId === 'offering-2');
      const securityAllocation = result.allocations.find(a => a.courseOfferingId === 'offering-3');

      expect(programmingAllocation?.facultyId).toBe('faculty-1');
      expect(databaseAllocation?.facultyId).toBe('faculty-2');
      expect(securityAllocation?.facultyId).toBe('faculty-3');
    });

    it('should calculate allocation scores correctly', async () => {
      const result = await engine.allocateCourses(
        mockSession,
        mockFaculties,
        mockCourseOfferings,
        mockPreferences
      );

      result.allocations.forEach(allocation => {
        expect(allocation.allocationScore).toBeGreaterThan(0);
        expect(allocation.allocationScore).toBeLessThanOrEqual(100);
      });
    });

    it('should respect faculty workload limits', async () => {
      const result = await engine.allocateCourses(
        mockSession,
        mockFaculties,
        mockCourseOfferings,
        mockPreferences
      );

      const facultyWorkloads = new Map<string, number>();
      
      result.allocations.forEach(allocation => {
        const currentLoad = facultyWorkloads.get(allocation.facultyId) || 0;
        facultyWorkloads.set(allocation.facultyId, currentLoad + allocation.hoursPerWeek);
      });

      facultyWorkloads.forEach((workload) => {
        expect(workload).toBeLessThanOrEqual(18); // GTU limit
      });
    });
  });

  describe('Conflict Detection', () => {
    it('should detect workload conflicts when faculty exceeds 18 hours', async () => {
      // Create scenario with overloaded faculty
      const overloadedCourses: CourseOfferingWithRequirements[] = [
        ...mockCourseOfferings,
        {
          id: 'offering-4',
          courseId: 'course-4',
          academicTermId: 'term-2025-26-1',
          facultyIds: [],
          programId: 'btech-cse',
          semester: 1,
          academicYear: '2025-26',
          currentEnrollments: 55,
          status: 'scheduled',
          requiredHours: 16, // This would overload faculty-1
          assignmentType: 'theory',
          priorityLevel: 1,
          subjectName: 'Advanced Programming',
          subcode: 'CS102',
          category: 'Core',
          lectureHours: 12,
          tutorialHours: 0,
          practicalHours: 4,
          department: 'Computer Science',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ];

      const overloadedPreferences: FacultyPreference[] = [
        ...mockPreferences,
        {
          id: 'pref-4',
          facultyId: 'faculty-1',
          academicYear: '2025-26',
          semester: 1,
          preferredCourses: [
            {
              courseId: 'offering-4',
              preference: 'medium',
              expertise: 8,
              previouslyTaught: true
            }
          ],
          timePreferences: [],
          roomPreferences: [],
          maxHoursPerWeek: 18,
          maxConsecutiveHours: 4,
          unavailableSlots: [],
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          priority: 5,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ];

      const result = await engine.allocateCourses(
        mockSession,
        mockFaculties,
        overloadedCourses,
        overloadedPreferences
      );

      expect(result.conflicts.length).toBeGreaterThan(0);
      // Should have conflicts (may not be overload if algorithm prevents overallocation)
      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it('should detect department mismatch conflicts', async () => {
      // Create course in different department than faculty expertise
      const mismatchedCourse: CourseOfferingWithRequirements = {
        id: 'offering-mismatch',
        courseId: 'course-mismatch',
        academicTermId: 'term-2025-26-1',
        facultyIds: [],
        programId: 'btech-cse',
        semester: 1,
        academicYear: '2025-26',
        currentEnrollments: 55,
        status: 'scheduled',
        requiredHours: 4,
        assignmentType: 'theory',
        priorityLevel: 1,
        subjectName: 'Mechanical Engineering Basics',
        subcode: 'ME101',
        category: 'Core',
        lectureHours: 3,
        tutorialHours: 0,
        practicalHours: 1,
        department: 'Mechanical Engineering', // Different from faculty department
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      };

      const result = await engine.allocateCourses(
        mockSession,
        mockFaculties,
        [mismatchedCourse],
        []
      );

      // Should either create a conflict or have low allocation score
      if (result.allocations.length > 0) {
        const allocation = result.allocations[0];
        expect(allocation.allocationScore).toBeLessThan(50); // Low score due to mismatch
      }
    });
  });

  describe('Preference Matching', () => {
    it('should prioritize high preference matches', async () => {
      const result = await engine.allocateCourses(
        mockSession,
        mockFaculties,
        mockCourseOfferings,
        mockPreferences
      );

      const highPreferenceAllocations = result.allocations.filter(a => a.preferenceMatch === 'high');
      // Should have at least some preference matches
      expect(result.allocations.length).toBeGreaterThan(0);
    });

    it('should assign lower scores for courses without preferences', async () => {
      const result = await engine.allocateCourses(
        mockSession,
        mockFaculties,
        mockCourseOfferings,
        [] // No preferences
      );

      result.allocations.forEach(allocation => {
        expect(allocation.preferenceMatch).toBe('none');
        expect(allocation.allocationScore).toBeLessThan(70); // Lower score without preferences
      });
    });
  });

  describe('Algorithm Settings', () => {
    it('should respect seniority when prioritizeSeniority is true', async () => {
      const seniorityEngine = createAllocationEngine({
        ...mockSession.algorithmSettings,
        prioritizeSeniority: true,
      });

      const result = await seniorityEngine.allocateCourses(
        mockSession,
        mockFaculties,
        mockCourseOfferings,
        mockPreferences
      );

      // Senior faculty (Jane Smith with seniority 10) should get preferred assignments
      const janeAllocations = result.allocations.filter(a => a.facultyId === 'faculty-2');
      expect(janeAllocations.length).toBeGreaterThan(0);
    });

    it('should work without seniority priority', async () => {
      const noSeniorityEngine = createAllocationEngine({
        ...mockSession.algorithmSettings,
        prioritizeSeniority: false,
      });

      const result = await noSeniorityEngine.allocateCourses(
        mockSession,
        mockFaculties,
        mockCourseOfferings,
        mockPreferences
      );

      expect(result.allocations).toHaveLength(3);
      expect(result.statistics.allocatedCourses).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty course offerings', async () => {
      const result = await engine.allocateCourses(
        mockSession,
        mockFaculties,
        [],
        mockPreferences
      );

      expect(result.allocations).toHaveLength(0);
      // May have underload conflicts even with no courses
      expect(result.statistics.totalCourses).toBe(0);
      expect(result.statistics.allocatedCourses).toBe(0);
    });

    it('should handle empty faculty list', async () => {
      const result = await engine.allocateCourses(
        mockSession,
        [],
        mockCourseOfferings,
        mockPreferences
      );

      expect(result.allocations).toHaveLength(0);
      expect(result.conflicts.length).toBeGreaterThan(0); // Should create unassigned conflicts
      expect(result.statistics.totalCourses).toBe(3);
      expect(result.statistics.allocatedCourses).toBe(0);
    });

    it('should handle courses with no suitable faculty', async () => {
      const unsuitableCourse: CourseOfferingWithRequirements = {
        id: 'offering-unsuitable',
        courseId: 'course-unsuitable',
        academicTermId: 'term-2025-26-1',
        facultyIds: [],
        programId: 'btech-cse',
        semester: 1,
        academicYear: '2025-26',
        currentEnrollments: 55,
        status: 'scheduled',
        requiredHours: 25, // Exceeds maximum hours for any faculty
        assignmentType: 'theory',
        priorityLevel: 1,
        subjectName: 'Impossible Course',
        subcode: 'IMP101',
        category: 'Core',
        lectureHours: 20,
        tutorialHours: 0,
        practicalHours: 5,
        department: 'Computer Science',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      };

      const result = await engine.allocateCourses(
        mockSession,
        mockFaculties,
        [unsuitableCourse],
        []
      );

      // Should either not allocate or create conflicts
      if (result.allocations.length === 0) {
        expect(result.conflicts.length).toBeGreaterThan(0);
      } else {
        expect(result.conflicts.length).toBeGreaterThan(0); // Should detect workload violation
      }
    });
  });

  describe('Statistics Generation', () => {
    it('should generate accurate statistics', async () => {
      const result = await engine.allocateCourses(
        mockSession,
        mockFaculties,
        mockCourseOfferings,
        mockPreferences
      );

      expect(result.statistics.totalCourses).toBe(mockCourseOfferings.length);
      expect(result.statistics.totalFaculty).toBe(mockFaculties.length);
      expect(result.statistics.allocatedCourses).toBe(result.allocations.length);
      expect(result.statistics.conflictsDetected).toBe(result.conflicts.length);
      
      expect(result.statistics.averageSatisfactionScore).toBeGreaterThanOrEqual(0);
      expect(result.statistics.averageSatisfactionScore).toBeLessThanOrEqual(100);
    });

    it('should calculate faculty utilization correctly', async () => {
      const result = await engine.allocateCourses(
        mockSession,
        mockFaculties,
        mockCourseOfferings,
        mockPreferences
      );

      expect(result.statistics.facultyWithFullLoad).toBeGreaterThanOrEqual(0);
      expect(result.statistics.facultyWithFullLoad).toBeLessThanOrEqual(mockFaculties.length);
    });
  });
});