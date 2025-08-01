import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createAllocationEngine } from '../lib/algorithms/allocationEngine';
import type { 
  AllocationSession, 
  FacultyProfile, 
  CourseOfferingWithRequirements, 
  FacultyPreference 
} from '../types/entities';

/**
 * Integration tests for the complete allocation workflow
 * These tests simulate real-world scenarios and verify end-to-end functionality
 */

describe('Allocation Workflow Integration Tests', () => {
  let testSession: AllocationSession;
  let testFaculties: FacultyProfile[];
  let testCourseOfferings: CourseOfferingWithRequirements[];
  let testPreferences: FacultyPreference[];

  beforeAll(() => {
    // Setup comprehensive test data that mirrors real university scenarios
    testSession = {
      id: 'session-2025-odd',
      name: '2025-26 Odd Semester Allocation',
      academicYear: '2025-26',
      semesters: [1, 3, 5],
      targetPrograms: ['btech-cse', 'btech-it', 'mtech-cse'],
      status: 'draft',
      createdBy: 'admin@university.edu',
      allocationMethod: 'preference_based',
      algorithmSettings: {
        prioritizeSeniority: true,
        expertiseWeightage: 0.4,
        preferencePriorityWeightage: 0.3,
        workloadBalanceWeightage: 0.2,
        seniorityWeightage: 0.1,
        minimizeConflicts: true
      },
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z'
    };

    testFaculties = [
      {
        id: 'fac-001',
        staffCode: 'CSE001',
        instituteEmail: 'ravi.sharma@university.edu',
        firstName: 'Ravi',
        lastName: 'Sharma',
        displayName: 'Dr. Ravi Sharma',
        fullName: 'Ravi Kumar Sharma',
        department: 'Computer Science',
        status: 'active',
        experience: 15,
        seniority: 12,
        maxHoursPerWeek: 18,
        currentWorkload: 0,
        expertise: ['Programming', 'Data Structures', 'Algorithms', 'Software Engineering'],
        qualifications: ['PhD Computer Science', 'M.Tech Software Engineering'],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'fac-002',
        staffCode: 'CSE002',
        instituteEmail: 'priya.patel@university.edu',
        firstName: 'Priya',
        lastName: 'Patel',
        displayName: 'Dr. Priya Patel',
        fullName: 'Priya Rajesh Patel',
        department: 'Computer Science',
        status: 'active',
        experience: 10,
        seniority: 8,
        maxHoursPerWeek: 18,
        currentWorkload: 0,
        expertise: ['Database Systems', 'Web Development', 'Cloud Computing', 'Big Data'],
        qualifications: ['PhD Computer Science', 'M.Tech Information Technology'],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'fac-003',
        staffCode: 'IT001',
        instituteEmail: 'amit.singh@university.edu',
        firstName: 'Amit',
        lastName: 'Singh',
        displayName: 'Prof. Amit Singh',
        fullName: 'Amit Kumar Singh',
        department: 'Information Technology',
        status: 'active',
        experience: 8,
        seniority: 6,
        maxHoursPerWeek: 18,
        currentWorkload: 0,
        expertise: ['Networks', 'Security', 'Operating Systems', 'Mobile Computing'],
        qualifications: ['M.Tech Information Technology', 'B.Tech Computer Science'],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'fac-004',
        staffCode: 'CSE003',
        instituteEmail: 'sneha.reddy@university.edu',
        firstName: 'Sneha',
        lastName: 'Reddy',
        displayName: 'Dr. Sneha Reddy',
        fullName: 'Sneha Lakshmi Reddy',
        department: 'Computer Science',
        status: 'active',
        experience: 12,
        seniority: 10,
        maxHoursPerWeek: 18,
        currentWorkload: 0,
        expertise: ['Machine Learning', 'Artificial Intelligence', 'Data Mining', 'Python'],
        qualifications: ['PhD Computer Science', 'M.Tech Computer Science'],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'fac-005',
        staffCode: 'IT002',
        instituteEmail: 'rahul.gupta@university.edu',
        firstName: 'Rahul',
        lastName: 'Gupta',
        displayName: 'Prof. Rahul Gupta',
        fullName: 'Rahul Kumar Gupta',
        department: 'Information Technology',
        status: 'active',
        experience: 6,
        seniority: 4,
        maxHoursPerWeek: 18,
        currentWorkload: 0,
        expertise: ['Web Technologies', 'JavaScript', 'React', 'Node.js'],
        qualifications: ['M.Tech Information Technology'],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      }
    ];

    testCourseOfferings = [
      // Semester 1 courses
      {
        id: 'offer-cs101',
        courseId: 'cs101',
        programId: 'btech-cse',
        semester: 1,
        academicYear: '2025-26',
        maxStudents: 60,
        currentEnrollment: 55,
        status: 'active',
        requiredHours: 5,
        assignmentType: 'theory',
        priorityLevel: 1,
        subjectName: 'Programming Fundamentals',
        subcode: 'CS101',
        category: 'Core',
        lectureHours: 3,
        tutorialHours: 1,
        practicalHours: 1,
        department: 'Computer Science',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'offer-cs102',
        courseId: 'cs102',
        programId: 'btech-cse',
        semester: 1,
        academicYear: '2025-26',
        maxStudents: 60,
        currentEnrollment: 52,
        status: 'active',
        requiredHours: 4,
        assignmentType: 'theory',
        priorityLevel: 1,
        subjectName: 'Mathematics for Computing',
        subcode: 'CS102',
        category: 'Core',
        lectureHours: 4,
        tutorialHours: 0,
        practicalHours: 0,
        department: 'Computer Science',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      // Semester 3 courses
      {
        id: 'offer-cs301',
        courseId: 'cs301',
        programId: 'btech-cse',
        semester: 3,
        academicYear: '2025-26',
        maxStudents: 55,
        currentEnrollment: 50,
        status: 'active',
        requiredHours: 5,
        assignmentType: 'theory',
        priorityLevel: 1,
        subjectName: 'Database Management Systems',
        subcode: 'CS301',
        category: 'Core',
        lectureHours: 3,
        tutorialHours: 1,
        practicalHours: 1,
        department: 'Computer Science',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'offer-cs302',
        courseId: 'cs302',
        programId: 'btech-cse',
        semester: 3,
        academicYear: '2025-26',
        maxStudents: 55,
        currentEnrollment: 48,
        status: 'active',
        requiredHours: 4,
        assignmentType: 'theory',
        priorityLevel: 1,
        subjectName: 'Data Structures and Algorithms',
        subcode: 'CS302',
        category: 'Core',
        lectureHours: 3,
        tutorialHours: 1,
        practicalHours: 0,
        department: 'Computer Science',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      // Semester 5 courses
      {
        id: 'offer-cs501',
        courseId: 'cs501',
        programId: 'btech-cse',
        semester: 5,
        academicYear: '2025-26',
        maxStudents: 50,
        currentEnrollment: 45,
        status: 'active',
        requiredHours: 4,
        assignmentType: 'theory',
        priorityLevel: 1,
        subjectName: 'Machine Learning',
        subcode: 'CS501',
        category: 'Elective',
        lectureHours: 3,
        tutorialHours: 1,
        practicalHours: 0,
        department: 'Computer Science',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      // IT courses
      {
        id: 'offer-it301',
        courseId: 'it301',
        programId: 'btech-it',
        semester: 3,
        academicYear: '2025-26',
        maxStudents: 45,
        currentEnrollment: 40,
        status: 'active',
        requiredHours: 4,
        assignmentType: 'theory',
        priorityLevel: 1,
        subjectName: 'Computer Networks',
        subcode: 'IT301',
        category: 'Core',
        lectureHours: 3,
        tutorialHours: 0,
        practicalHours: 1,
        department: 'Information Technology',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'offer-it501',
        courseId: 'it501',
        programId: 'btech-it',
        semester: 5,
        academicYear: '2025-26',
        maxStudents: 40,
        currentEnrollment: 35,
        status: 'active',
        requiredHours: 4,
        assignmentType: 'theory',
        priorityLevel: 2,
        subjectName: 'Web Technologies',
        subcode: 'IT501',
        category: 'Elective',
        lectureHours: 3,
        tutorialHours: 0,
        practicalHours: 1,
        department: 'Information Technology',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      }
    ];

    testPreferences = [
      // Dr. Ravi Sharma preferences
      {
        id: 'pref-fac001-sem1',
        facultyId: 'fac-001',
        academicYear: '2025-26',
        semester: 1,
        preferredCourses: [
          {
            courseOfferingId: 'offer-cs101',
            priority: 1,
            expertiseLevel: 10,
            previousExperience: true,
            notes: 'Expert in programming fundamentals, taught for 10 years'
          },
          {
            courseOfferingId: 'offer-cs102',
            priority: 2,
            expertiseLevel: 7,
            previousExperience: false,
            notes: 'Can teach mathematics if needed'
          }
        ],
        unavailableSlots: [],
        maxPreferredHours: 18,
        minPreferredHours: 12,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'pref-fac001-sem3',
        facultyId: 'fac-001',
        academicYear: '2025-26',
        semester: 3,
        preferredCourses: [
          {
            courseOfferingId: 'offer-cs302',
            priority: 1,
            expertiseLevel: 10,
            previousExperience: true,
            notes: 'DSA expert, written books on algorithms'
          }
        ],
        unavailableSlots: [],
        maxPreferredHours: 18,
        minPreferredHours: 12,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      // Dr. Priya Patel preferences
      {
        id: 'pref-fac002-sem3',
        facultyId: 'fac-002',
        academicYear: '2025-26',
        semester: 3,
        preferredCourses: [
          {
            courseOfferingId: 'offer-cs301',
            priority: 1,
            expertiseLevel: 10,
            previousExperience: true,
            notes: 'Database systems specialist, industry experience'
          }
        ],
        unavailableSlots: [],
        maxPreferredHours: 18,
        minPreferredHours: 12,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      // Prof. Amit Singh preferences
      {
        id: 'pref-fac003-sem3',
        facultyId: 'fac-003',
        academicYear: '2025-26',
        semester: 3,
        preferredCourses: [
          {
            courseOfferingId: 'offer-it301',
            priority: 1,
            expertiseLevel: 9,
            previousExperience: true,
            notes: 'Networks expert with CISCO certifications'
          }
        ],
        unavailableSlots: [],
        maxPreferredHours: 18,
        minPreferredHours: 12,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      // Dr. Sneha Reddy preferences
      {
        id: 'pref-fac004-sem5',
        facultyId: 'fac-004',
        academicYear: '2025-26',
        semester: 5,
        preferredCourses: [
          {
            courseOfferingId: 'offer-cs501',
            priority: 1,
            expertiseLevel: 10,
            previousExperience: true,
            notes: 'ML researcher with 50+ publications'
          }
        ],
        unavailableSlots: [],
        maxPreferredHours: 18,
        minPreferredHours: 12,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      },
      // Prof. Rahul Gupta preferences
      {
        id: 'pref-fac005-sem5',
        facultyId: 'fac-005',
        academicYear: '2025-26',
        semester: 5,
        preferredCourses: [
          {
            courseOfferingId: 'offer-it501',
            priority: 1,
            expertiseLevel: 9,
            previousExperience: true,
            notes: 'Full-stack web developer, industry background'
          }
        ],
        unavailableSlots: [],
        maxPreferredHours: 18,
        minPreferredHours: 12,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      }
    ];
  });

  describe('End-to-End Allocation Workflow', () => {
    it('should complete full allocation workflow successfully', async () => {
      const engine = createAllocationEngine(testSession.algorithmSettings);
      
      const result = await engine.allocateCourses(
        testSession,
        testFaculties,
        testCourseOfferings,
        testPreferences
      );

      // Verify all courses are allocated
      expect(result.allocations).toHaveLength(testCourseOfferings.length);
      expect(result.statistics.totalCourses).toBe(testCourseOfferings.length);
      expect(result.statistics.allocatedCourses).toBe(testCourseOfferings.length);
      
      // Verify no conflicts for this ideal scenario
      expect(result.conflicts).toHaveLength(0);
    });

    it('should prioritize faculty preferences correctly', async () => {
      const engine = createAllocationEngine(testSession.algorithmSettings);
      
      const result = await engine.allocateCourses(
        testSession,
        testFaculties,
        testCourseOfferings,
        testPreferences
      );

      // Verify high-preference matches
      const programmingAllocation = result.allocations.find(a => a.courseOfferingId === 'offer-cs101');
      const databaseAllocation = result.allocations.find(a => a.courseOfferingId === 'offer-cs301');
      const dsaAllocation = result.allocations.find(a => a.courseOfferingId === 'offer-cs302');
      const mlAllocation = result.allocations.find(a => a.courseOfferingId === 'offer-cs501');
      const networksAllocation = result.allocations.find(a => a.courseOfferingId === 'offer-it301');
      const webTechAllocation = result.allocations.find(a => a.courseOfferingId === 'offer-it501');

      expect(programmingAllocation?.facultyId).toBe('fac-001'); // Dr. Ravi Sharma
      expect(databaseAllocation?.facultyId).toBe('fac-002'); // Dr. Priya Patel
      expect(dsaAllocation?.facultyId).toBe('fac-001'); // Dr. Ravi Sharma
      expect(mlAllocation?.facultyId).toBe('fac-004'); // Dr. Sneha Reddy
      expect(networksAllocation?.facultyId).toBe('fac-003'); // Prof. Amit Singh
      expect(webTechAllocation?.facultyId).toBe('fac-005'); // Prof. Rahul Gupta

      // Verify preference match scores
      expect(programmingAllocation?.preferenceMatch).toBe('high');
      expect(databaseAllocation?.preferenceMatch).toBe('high');
      expect(mlAllocation?.preferenceMatch).toBe('high');
    });

    it('should respect faculty workload limits', async () => {
      const engine = createAllocationEngine(testSession.algorithmSettings);
      
      const result = await engine.allocateCourses(
        testSession,
        testFaculties,
        testCourseOfferings,
        testPreferences
      );

      // Calculate workload for each faculty
      const facultyWorkloads = new Map<string, number>();
      result.allocations.forEach(allocation => {
        const currentLoad = facultyWorkloads.get(allocation.facultyId) || 0;
        facultyWorkloads.set(allocation.facultyId, currentLoad + allocation.hoursPerWeek);
      });

      // Verify no faculty exceeds 18 hours
      facultyWorkloads.forEach((workload, facultyId) => {
        expect(workload).toBeLessThanOrEqual(18);
        console.log(`Faculty ${facultyId}: ${workload} hours`);
      });
    });

    it('should generate comprehensive statistics', async () => {
      const engine = createAllocationEngine(testSession.algorithmSettings);
      
      const result = await engine.allocateCourses(
        testSession,
        testFaculties,
        testCourseOfferings,
        testPreferences
      );

      expect(result.statistics.totalFaculty).toBe(testFaculties.length);
      expect(result.statistics.totalCourses).toBe(testCourseOfferings.length);
      expect(result.statistics.allocatedCourses).toBeGreaterThan(0);
      expect(result.statistics.averageSatisfactionScore).toBeGreaterThan(70); // Should be high due to good preferences
      expect(result.statistics.facultyWithFullLoad).toBeLessThanOrEqual(testFaculties.length);
    });
  });

  describe('Stress Testing Scenarios', () => {
    it('should handle high-load scenario with many courses', async () => {
      // Create additional courses to test scalability
      const additionalCourses: CourseOfferingWithRequirements[] = [];
      for (let i = 1; i <= 20; i++) {
        additionalCourses.push({
          id: `offer-extra-${i}`,
          courseId: `extra-${i}`,
          programId: 'btech-cse',
          semester: 1,
          academicYear: '2025-26',
          maxStudents: 30,
          currentEnrollment: 25,
          status: 'active',
          requiredHours: 3,
          assignmentType: 'theory',
          priorityLevel: 3,
          subjectName: `Additional Course ${i}`,
          subcode: `EXT${i.toString().padStart(3, '0')}`,
          category: 'Elective',
          lectureHours: 3,
          tutorialHours: 0,
          practicalHours: 0,
          department: 'Computer Science',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        });
      }

      const allCourses = [...testCourseOfferings, ...additionalCourses];
      const engine = createAllocationEngine(testSession.algorithmSettings);
      
      const result = await engine.allocateCourses(
        testSession,
        testFaculties,
        allCourses,
        testPreferences
      );

      expect(result.allocations.length).toBeGreaterThan(0);
      expect(result.statistics.totalCourses).toBe(allCourses.length);
      
      // With limited faculty, some courses may not be allocated
      // Verify the algorithm handles this gracefully
      const facultyWorkloads = new Map<string, number>();
      result.allocations.forEach(allocation => {
        const currentLoad = facultyWorkloads.get(allocation.facultyId) || 0;
        facultyWorkloads.set(allocation.facultyId, currentLoad + allocation.hoursPerWeek);
      });

      // No faculty should exceed the limit
      facultyWorkloads.forEach(workload => {
        expect(workload).toBeLessThanOrEqual(18);
      });
    });

    it('should handle scenario with conflicting preferences', async () => {
      // Create conflicting preferences where multiple faculty want the same course
      const conflictingPreferences: FacultyPreference[] = [
        {
          id: 'conflict-pref-1',
          facultyId: 'fac-001',
          academicYear: '2025-26',
          semester: 1,
          preferredCourses: [
            {
              courseOfferingId: 'offer-cs101',
              priority: 1,
              expertiseLevel: 10,
              previousExperience: true,
              notes: 'First choice'
            }
          ],
          unavailableSlots: [],
          maxPreferredHours: 18,
          minPreferredHours: 12,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 'conflict-pref-2',
          facultyId: 'fac-002',
          academicYear: '2025-26',
          semester: 1,
          preferredCourses: [
            {
              courseOfferingId: 'offer-cs101', // Same course!
              priority: 1,
              expertiseLevel: 9,
              previousExperience: true,
              notes: 'Also first choice'
            }
          ],
          unavailableSlots: [],
          maxPreferredHours: 18,
          minPreferredHours: 12,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ];

      const engine = createAllocationEngine(testSession.algorithmSettings);
      
      const result = await engine.allocateCourses(
        testSession,
        testFaculties,
        [testCourseOfferings[0]], // Only CS101
        conflictingPreferences
      );

      // Should allocate to one faculty (likely the one with higher seniority)
      expect(result.allocations).toHaveLength(1);
      const allocation = result.allocations[0];
      expect(['fac-001', 'fac-002']).toContain(allocation.facultyId);
    });

    it('should handle department capacity constraints', async () => {
      // Test with limited faculty in specific department
      const limitedFaculty = testFaculties.filter(f => f.department === 'Computer Science').slice(0, 2);
      const csCourses = testCourseOfferings.filter(c => c.department === 'Computer Science');

      const engine = createAllocationEngine(testSession.algorithmSettings);
      
      const result = await engine.allocateCourses(
        testSession,
        limitedFaculty,
        csCourses,
        testPreferences
      );

      // Verify reasonable allocation given constraints
      expect(result.allocations.length).toBeGreaterThan(0);
      expect(result.allocations.length).toBeLessThanOrEqual(csCourses.length);

      // Check if unallocated courses generate conflicts
      if (result.allocations.length < csCourses.length) {
        expect(result.conflicts.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Algorithm Configuration Impact', () => {
    it('should show different results with different algorithm settings', async () => {
      const highSenioritySettings = {
        ...testSession.algorithmSettings,
        prioritizeSeniority: true,
        seniorityWeightage: 0.4,
        expertiseWeightage: 0.3,
        preferencePriorityWeightage: 0.2,
        workloadBalanceWeightage: 0.1
      };

      const highExpertiseSettings = {
        ...testSession.algorithmSettings,
        prioritizeSeniority: false,
        seniorityWeightage: 0.1,
        expertiseWeightage: 0.5,
        preferencePriorityWeightage: 0.3,
        workloadBalanceWeightage: 0.1
      };

      const seniorityEngine = createAllocationEngine(highSenioritySettings);
      const expertiseEngine = createAllocationEngine(highExpertiseSettings);

      const seniorityResult = await seniorityEngine.allocateCourses(
        testSession,
        testFaculties,
        testCourseOfferings,
        testPreferences
      );

      const expertiseResult = await expertiseEngine.allocateCourses(
        testSession,
        testFaculties,
        testCourseOfferings,
        testPreferences
      );

      // Both should allocate all courses
      expect(seniorityResult.allocations).toHaveLength(testCourseOfferings.length);
      expect(expertiseResult.allocations).toHaveLength(testCourseOfferings.length);

      // But potentially with different faculty assignments or scores
      // This is more about verifying the algorithm respects different weightings
      expect(seniorityResult.statistics.averageSatisfactionScore).toBeGreaterThan(0);
      expect(expertiseResult.statistics.averageSatisfactionScore).toBeGreaterThan(0);
    });
  });

  describe('Data Validation and Error Handling', () => {
    it('should handle invalid course data gracefully', async () => {
      const invalidCourse: CourseOfferingWithRequirements = {
        ...testCourseOfferings[0],
        requiredHours: -5 // Invalid negative hours
      };

      const engine = createAllocationEngine(testSession.algorithmSettings);
      
      const result = await engine.allocateCourses(
        testSession,
        testFaculties,
        [invalidCourse],
        testPreferences
      );

      // Should handle gracefully, either by skipping or normalizing
      expect(result).toBeDefined();
      expect(result.statistics).toBeDefined();
    });

    it('should handle faculty with zero experience', async () => {
      const newFaculty: FacultyProfile = {
        ...testFaculties[0],
        id: 'fac-new',
        experience: 0,
        seniority: 0,
        expertise: []
      };

      const engine = createAllocationEngine(testSession.algorithmSettings);
      
      const result = await engine.allocateCourses(
        testSession,
        [newFaculty],
        [testCourseOfferings[0]],
        []
      );

      // Should still attempt allocation even with inexperienced faculty
      expect(result.allocations.length).toBeLessThanOrEqual(1);
      if (result.allocations.length > 0) {
        expect(result.allocations[0].allocationScore).toBeLessThan(70);
      }
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete allocation within reasonable time limits', async () => {
      const startTime = Date.now();
      
      const engine = createAllocationEngine(testSession.algorithmSettings);
      
      const result = await engine.allocateCourses(
        testSession,
        testFaculties,
        testCourseOfferings,
        testPreferences
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should complete within 5 seconds for this dataset size
      expect(executionTime).toBeLessThan(5000);
      expect(result.allocations).toHaveLength(testCourseOfferings.length);
      
      console.log(`Allocation completed in ${executionTime}ms`);
    });

    it('should maintain performance with larger datasets', async () => {
      // Create larger dataset
      const largeFacultySet: FacultyProfile[] = [];
      const largeCourseSet: CourseOfferingWithRequirements[] = [];
      
      for (let i = 0; i < 50; i++) {
        largeFacultySet.push({
          ...testFaculties[i % testFaculties.length],
          id: `large-fac-${i}`,
          staffCode: `LARGE${i.toString().padStart(3, '0')}`
        });
      }

      for (let i = 0; i < 100; i++) {
        largeCourseSet.push({
          ...testCourseOfferings[i % testCourseOfferings.length],
          id: `large-offer-${i}`,
          subcode: `LARGE${i.toString().padStart(3, '0')}`
        });
      }

      const startTime = Date.now();
      
      const engine = createAllocationEngine(testSession.algorithmSettings);
      
      const result = await engine.allocateCourses(
        testSession,
        largeFacultySet,
        largeCourseSet,
        testPreferences
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should still complete within reasonable time (30 seconds for large dataset)
      expect(executionTime).toBeLessThan(30000);
      expect(result.allocations.length).toBeGreaterThan(0);
      
      console.log(`Large dataset allocation completed in ${executionTime}ms with ${result.allocations.length} allocations`);
    });
  });
});