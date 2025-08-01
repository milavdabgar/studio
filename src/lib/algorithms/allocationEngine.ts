/**
 * Course Allocation Engine - Phase 2
 * 
 * Implements preference-based course allocation algorithm with:
 * - Faculty preference matching
 * - Seniority-based priority
 * - Workload balancing
 * - Conflict detection and resolution
 */

import type { 
  FacultyPreference, 
  CourseOffering, 
  Faculty, 
  AllocationSession,
  CourseAllocation,
  AllocationConflict
} from '@/types/entities';
import { createConflictResolutionEngine } from './conflictResolution';

// Algorithm configuration interface
export interface AllocationConfig {
  prioritizeSeniority: boolean;
  expertiseWeightage: number; // 0-1
  preferencePriorityWeightage: number; // 0-1
  workloadBalanceWeightage: number; // 0-1
  minimizeConflicts: boolean;
  maxHoursPerFaculty: number;
  minHoursPerFaculty: number;
}

// Faculty with seniority and current workload
export interface FacultyWithWorkload extends Faculty {
  seniorityScore: number; // 0-100 (higher = more senior)
  currentWorkload: number; // Hours already allocated
  preferences: FacultyPreference[];
  availableHours: number; // Remaining capacity
}

// Course offering with allocation requirements and course details
export interface CourseOfferingWithRequirements extends CourseOffering {
  requiredHours: number;
  assignmentType: 'theory' | 'lab' | 'tutorial' | 'project';
  priorityLevel: number; // 1-5 (5 = highest priority)
  // Course details from joined Course entity
  subjectName?: string;
  subcode?: string;
  category?: string;
  lectureHours?: number;
  tutorialHours?: number;
  practicalHours?: number;
  department?: string;
}

// Allocation candidate scoring
export interface AllocationCandidate {
  facultyId: string;
  courseOfferingId: string;
  score: number;
  breakdown: {
    preferenceScore: number;
    expertiseScore: number;
    workloadScore: number;
    seniorityScore: number;
    conflictPenalty: number;
  };
  conflicts: string[];
}

export class AllocationEngine {
  private config: AllocationConfig;
  private faculties: FacultyWithWorkload[] = [];
  private courseOfferings: CourseOfferingWithRequirements[] = [];
  private allocations: CourseAllocation[] = [];
  private conflicts: AllocationConflict[] = [];

  constructor(config: AllocationConfig) {
    this.config = config;
  }

  /**
   * Main allocation method
   */
  async allocateCourses(
    session: AllocationSession,
    faculties: Faculty[],
    courseOfferings: CourseOfferingWithRequirements[],
    facultyPreferences: FacultyPreference[]
  ): Promise<{
    allocations: CourseAllocation[];
    conflicts: AllocationConflict[];
    statistics: AllocationSession['statistics'];
  }> {
    // Initialize data structures
    this.initializeFaculties(faculties, facultyPreferences);
    this.initializeCourseOfferings(courseOfferings);
    this.allocations = [];
    this.conflicts = [];

    // Sort course offerings by priority and difficulty
    const sortedCourses = this.prioritizeCourses();

    // Allocate each course
    for (const course of sortedCourses) {
      await this.allocateSingleCourse(session.id, course);
    }

    // Detect remaining conflicts
    await this.detectConflicts(session.id);

    // Calculate statistics
    const statistics = this.calculateStatistics();

    return {
      allocations: this.allocations,
      conflicts: this.conflicts,
      statistics
    };
  }

  /**
   * Initialize faculty data with workload and seniority
   */
  private initializeFaculties(faculties: Faculty[], preferences: FacultyPreference[]): void {
    this.faculties = faculties.map(faculty => {
      const facultyPreferences = preferences.filter(p => p.facultyId === faculty.id);
      const seniorityScore = this.calculateSeniorityScore(faculty);
      const maxHours = facultyPreferences[0]?.maxHoursPerWeek || this.config.maxHoursPerFaculty;

      return {
        ...faculty,
        seniorityScore,
        currentWorkload: 0,
        preferences: facultyPreferences,
        availableHours: maxHours
      };
    });
  }

  /**
   * Initialize course offerings with requirements
   */
  private initializeCourseOfferings(courseOfferings: CourseOfferingWithRequirements[]): void {
    this.courseOfferings = courseOfferings.map(course => ({
      ...course,
      requiredHours: this.calculateRequiredHours(course),
      assignmentType: this.determineAssignmentType(course),
      priorityLevel: this.calculateCoursePriority(course)
    }));
  }

  /**
   * Calculate seniority score based on faculty designation and experience
   */
  private calculateSeniorityScore(faculty: Faculty): number {
    const designationWeights: Record<string, number> = {
      'Professor': 100,
      'Associate Professor': 85,
      'Assistant Professor': 70,
      'Principal': 95,
      'HOD': 90,
      'Lecturer': 60,
      'Lab Assistant': 40
    };

    const baseScore = designationWeights[faculty.designation || ''] || 50;
    
    // Add experience bonus (assuming joining date indicates experience)
    const currentYear = new Date().getFullYear();
    const joiningYear = faculty.joiningDate ? new Date(faculty.joiningDate).getFullYear() : currentYear;
    const experienceYears = Math.max(0, currentYear - joiningYear);
    const experienceBonus = Math.min(20, experienceYears * 2); // Max 20 points for experience

    return Math.min(100, baseScore + experienceBonus);
  }

  /**
   * Calculate required hours for a course
   */
  private calculateRequiredHours(course: CourseOfferingWithRequirements): number {
    // Use actual hours from course if available, otherwise defaults
    if (course.lectureHours && course.lectureHours > 0) {
      return course.lectureHours + (course.tutorialHours || 0) + (course.practicalHours || 0);
    }
    
    // GTU standard fallback: Theory = 4 hours, Lab = 3 hours per week
    const category = course.category?.toLowerCase() || 'theory';
    
    switch (category) {
      case 'theory':
        return 4;
      case 'lab':
      case 'practical':
        return 3;
      case 'tutorial':
        return 2;
      case 'project':
        return 2;
      default:
        return 4;
    }
  }

  /**
   * Determine assignment type from course
   */
  private determineAssignmentType(course: CourseOfferingWithRequirements): 'theory' | 'lab' | 'tutorial' | 'project' {
    const category = course.category?.toLowerCase() || 'theory';
    
    if (category.includes('lab') || category.includes('practical')) return 'lab';
    if (category.includes('tutorial')) return 'tutorial';
    if (category.includes('project')) return 'project';
    
    return 'theory';
  }

  /**
   * Calculate course priority (higher for core subjects, lower semesters)
   */
  private calculateCoursePriority(course: CourseOfferingWithRequirements): number {
    let priority = 3; // Base priority
    
    // Higher priority for lower semesters
    if (course.semester && course.semester <= 2) priority += 2;
    else if (course.semester && course.semester <= 4) priority += 1;
    
    // Core subjects get higher priority
    if (course.category?.toLowerCase().includes('core')) priority += 1;
    
    return Math.min(5, priority);
  }

  /**
   * Prioritize courses for allocation
   */
  private prioritizeCourses(): CourseOfferingWithRequirements[] {
    return [...this.courseOfferings].sort((a, b) => {
      // First by priority level
      if (a.priorityLevel !== b.priorityLevel) {
        return b.priorityLevel - a.priorityLevel;
      }
      
      // Then by semester (lower first)
      if ((a.semester || 0) !== (b.semester || 0)) {
        return (a.semester || 0) - (b.semester || 0);
      }
      
      // Then by required hours (higher first - harder to allocate)
      return b.requiredHours - a.requiredHours;
    });
  }

  /**
   * Allocate a single course to the best available faculty
   */
  private async allocateSingleCourse(
    sessionId: string, 
    course: CourseOfferingWithRequirements
  ): Promise<void> {
    const candidates = this.generateCandidates(course);
    
    if (candidates.length === 0) {
      // No suitable faculty found - create conflict
      await this.createConflict(sessionId, {
        conflictType: 'expertise_mismatch',
        severity: 'high',
        courseOfferingIds: [course.id],
        description: `No suitable faculty found for ${course.subjectName || 'Unknown Course'} (${course.subcode || 'N/A'})`
      });
      return;
    }

    // Sort candidates by score (highest first)
    candidates.sort((a, b) => b.score - a.score);
    
    const bestCandidate = candidates[0];
    const faculty = this.faculties.find(f => f.id === bestCandidate.facultyId)!;
    
    // Check if allocation would cause conflicts
    if (bestCandidate.conflicts.length > 0 && this.config.minimizeConflicts) {
      await this.createConflict(sessionId, {
        conflictType: 'time_overlap',
        severity: 'medium',
        facultyId: faculty.id,
        courseOfferingIds: [course.id, ...bestCandidate.conflicts],
        description: `Time conflict detected for ${faculty.displayName || faculty.fullName} with course ${course.subjectName || 'Unknown Course'}`
      });
    }

    // Create allocation
    const allocation: CourseAllocation = {
      id: this.generateId('ca'),
      sessionId,
      courseOfferingId: course.id,
      facultyId: faculty.id,
      assignmentType: course.assignmentType,
      hoursPerWeek: course.requiredHours,
      allocationScore: Math.round(bestCandidate.score),
      preferenceMatch: this.getPreferenceMatchLevel(bestCandidate.breakdown.preferenceScore),
      expertiseLevel: Math.round(bestCandidate.breakdown.expertiseScore),
      conflictLevel: bestCandidate.conflicts.length > 0 ? 'minor' : 'none',
      isManualAssignment: false,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.allocations.push(allocation);

    // Update faculty workload
    faculty.currentWorkload += course.requiredHours;
    faculty.availableHours -= course.requiredHours;
  }

  /**
   * Generate allocation candidates for a course
   */
  private generateCandidates(course: CourseOfferingWithRequirements): AllocationCandidate[] {
    const candidates: AllocationCandidate[] = [];

    for (const faculty of this.faculties) {
      // Skip if faculty has no available hours
      if (faculty.availableHours < course.requiredHours) continue;

      const candidate = this.evaluateCandidate(faculty, course);
      candidates.push(candidate);
    }

    return candidates.filter(c => c.score > 0);
  }

  /**
   * Evaluate a single faculty-course pairing
   */
  private evaluateCandidate(
    faculty: FacultyWithWorkload, 
    course: CourseOfferingWithRequirements
  ): AllocationCandidate {
    const preference = faculty.preferences.find(p => 
      p.academicYear === course.academicYear && 
      p.semester === course.semester
    );

    // Calculate component scores
    const preferenceScore = this.calculatePreferenceScore(faculty, course, preference);
    const expertiseScore = this.calculateExpertiseScore(faculty, course, preference);
    const workloadScore = this.calculateWorkloadScore(faculty, course);
    const seniorityScore = this.config.prioritizeSeniority ? faculty.seniorityScore : 50;
    
    // Detect conflicts
    const conflicts = this.detectTimeConflicts(faculty, course);
    const conflictPenalty = conflicts.length * 20; // 20 points penalty per conflict

    // Calculate weighted total score
    const totalScore = (
      preferenceScore * this.config.preferencePriorityWeightage +
      expertiseScore * this.config.expertiseWeightage +
      workloadScore * this.config.workloadBalanceWeightage +
      seniorityScore * 0.1 // Seniority has fixed 10% weight
    ) - conflictPenalty;

    return {
      facultyId: faculty.id,
      courseOfferingId: course.id,
      score: Math.max(0, totalScore),
      breakdown: {
        preferenceScore,
        expertiseScore,
        workloadScore,
        seniorityScore,
        conflictPenalty
      },
      conflicts
    };
  }

  /**
   * Calculate preference match score
   */
  private calculatePreferenceScore(
    faculty: FacultyWithWorkload,
    course: CourseOfferingWithRequirements,
    preference?: FacultyPreference
  ): number {
    if (!preference) return 0;

    const coursePreference = preference.preferredCourses.find(cp => cp.courseId === course.courseId);
    if (!coursePreference) return 10; // Small score for faculty who submitted preferences

    const priorityWeights = { high: 100, medium: 70, low: 40 };
    return priorityWeights[coursePreference.preference as keyof typeof priorityWeights] || 0;
  }

  /**
   * Calculate expertise score
   */
  private calculateExpertiseScore(
    faculty: FacultyWithWorkload,
    course: CourseOfferingWithRequirements,
    preference?: FacultyPreference
  ): number {
    if (!preference) return 50; // Default expertise

    const coursePreference = preference.preferredCourses.find(cp => cp.courseId === course.courseId);
    if (!coursePreference) {
      // Check department match as fallback
      if (faculty.department && course.department && faculty.department === course.department) return 60;
      return 30;
    }

    // Convert 1-10 expertise to 0-100 score
    const expertiseScore = coursePreference.expertise * 10;
    
    // Bonus for previously taught
    const experienceBonus = coursePreference.previouslyTaught ? 20 : 0;
    
    return Math.min(100, expertiseScore + experienceBonus);
  }

  /**
   * Calculate workload balance score
   */
  private calculateWorkloadScore(
    faculty: FacultyWithWorkload,
    course: CourseOfferingWithRequirements
  ): number {
    const maxHours = faculty.preferences[0]?.maxHoursPerWeek || this.config.maxHoursPerFaculty;
    const newWorkload = faculty.currentWorkload + course.requiredHours;
    const utilizationRatio = newWorkload / maxHours;

    // Optimal utilization is around 80-90%
    if (utilizationRatio >= 0.8 && utilizationRatio <= 0.9) return 100;
    if (utilizationRatio >= 0.7 && utilizationRatio < 0.8) return 90;
    if (utilizationRatio >= 0.9 && utilizationRatio <= 1.0) return 80;
    if (utilizationRatio > 1.0) return 0; // Overload
    
    // Under-utilization penalty
    return Math.max(20, 70 - (0.8 - utilizationRatio) * 100);
  }

  /**
   * Detect time conflicts for faculty
   */
  private detectTimeConflicts(
    faculty: FacultyWithWorkload,
    course: CourseOfferingWithRequirements
  ): string[] {
    const conflicts: string[] = [];
    
    // Check against existing allocations
    for (const allocation of this.allocations) {
      if (allocation.facultyId === faculty.id) {
        // Simple conflict detection - can be enhanced with actual time slot checking
        conflicts.push(allocation.courseOfferingId);
      }
    }
    
    return conflicts;
  }

  /**
   * Create allocation conflict record
   */
  private async createConflict(
    sessionId: string,
    conflictData: Partial<AllocationConflict>
  ): Promise<void> {
    const conflict: AllocationConflict = {
      id: this.generateId('ac'),
      sessionId,
      conflictType: conflictData.conflictType!,
      severity: conflictData.severity || 'medium',
      facultyId: conflictData.facultyId,
      courseOfferingIds: conflictData.courseOfferingIds || [],
      description: conflictData.description || 'Allocation conflict detected',
      status: 'unresolved',
      autoResolvable: conflictData.autoResolvable || false,
      priority: conflictData.priority || 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.conflicts.push(conflict);
  }

  /**
   * Detect conflicts after allocation
   */
  private async detectConflicts(sessionId: string): Promise<void> {
    // Check for faculty overload/underload
    for (const faculty of this.faculties) {
      const maxHours = faculty.preferences[0]?.maxHoursPerWeek || this.config.maxHoursPerFaculty;
      
      if (faculty.currentWorkload > maxHours) {
        await this.createConflict(sessionId, {
          conflictType: 'overload',
          severity: 'high',
          facultyId: faculty.id,
          courseOfferingIds: this.allocations
            .filter(a => a.facultyId === faculty.id)
            .map(a => a.courseOfferingId),
          description: `${faculty.displayName || faculty.fullName} has ${faculty.currentWorkload} hours (max: ${maxHours})`,
          autoResolvable: false,
          priority: 8
        });
      } else if (faculty.currentWorkload < this.config.minHoursPerFaculty) {
        await this.createConflict(sessionId, {
          conflictType: 'underload',
          severity: 'low',
          facultyId: faculty.id,
          courseOfferingIds: [],
          description: `${faculty.displayName || faculty.fullName} has only ${faculty.currentWorkload} hours (min: ${this.config.minHoursPerFaculty})`,
          autoResolvable: true,
          priority: 3
        });
      }

      // Check for department mismatches
      const facultyAllocations = this.allocations.filter(a => a.facultyId === faculty.id);
      for (const allocation of facultyAllocations) {
        const course = this.courseOfferings.find(c => c.id === allocation.courseOfferingId);
        if (course && course.department && faculty.department && 
            course.department !== faculty.department) {
          await this.createConflict(sessionId, {
            conflictType: 'department_mismatch',
            severity: 'medium',
            facultyId: faculty.id,
            courseOfferingIds: [allocation.courseOfferingId],
            description: `${faculty.displayName || faculty.fullName} (${faculty.department}) assigned to ${course.subjectName} (${course.department})`,
            autoResolvable: true,
            priority: 5
          });
        }
      }

      // Check for consecutive hours violations
      if (faculty.preferences[0]?.maxConsecutiveHours) {
        const maxConsecutive = faculty.preferences[0].maxConsecutiveHours;
        const totalHours = facultyAllocations.reduce((sum, a) => sum + a.hoursPerWeek, 0);
        
        // Simple check - in real implementation, you'd check actual time slots
        if (totalHours > maxConsecutive * 2) { // Assuming max 2 days of consecutive teaching
          await this.createConflict(sessionId, {
            conflictType: 'consecutive_hours_violation',
            severity: 'medium',
            facultyId: faculty.id,
            courseOfferingIds: facultyAllocations.map(a => a.courseOfferingId),
            description: `${faculty.displayName || faculty.fullName} may exceed consecutive hours limit (${maxConsecutive})`,
            autoResolvable: false,
            priority: 4
          });
        }
      }
    }

    // Use enhanced conflict resolution to add suggestions
    await this.enhanceConflictsWithResolutions(sessionId);
  }

  /**
   * Enhance conflicts with resolution suggestions using the conflict resolution engine
   */
  private async enhanceConflictsWithResolutions(sessionId: string): Promise<void> {
    const resolutionEngine = createConflictResolutionEngine();
    resolutionEngine.initialize(this.faculties, this.courseOfferings, this.allocations, []);
    
    const enhancedConflicts = await resolutionEngine.enhanceConflicts(this.conflicts);
    this.conflicts = enhancedConflicts;
  }

  /**
   * Calculate allocation statistics
   */
  private calculateStatistics(): AllocationSession['statistics'] {
    const totalCourses = this.courseOfferings.length;
    const allocatedCourses = this.allocations.length;
    const totalFaculty = this.faculties.length;
    const facultyWithFullLoad = this.faculties.filter(f => {
      const maxHours = f.preferences[0]?.maxHoursPerWeek || this.config.maxHoursPerFaculty;
      return f.currentWorkload >= maxHours * 0.8; // 80% considered full load
    }).length;

    const averageSatisfactionScore = this.allocations.length > 0 
      ? this.allocations.reduce((sum, a) => sum + a.allocationScore, 0) / this.allocations.length
      : 0;

    return {
      totalCourses,
      totalFaculty,
      allocatedCourses,
      unallocatedCourses: totalCourses - allocatedCourses,
      facultyWithFullLoad,
      conflictsDetected: this.conflicts.length,
      averageSatisfactionScore: Math.round(averageSatisfactionScore)
    };
  }

  /**
   * Get preference match level from score
   */
  private getPreferenceMatchLevel(score: number): 'high' | 'medium' | 'low' | 'none' {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 30) return 'low';
    return 'none';
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Default allocation configuration for GTU diploma engineering
 */
export const DEFAULT_ALLOCATION_CONFIG: AllocationConfig = {
  prioritizeSeniority: true,
  expertiseWeightage: 0.4,
  preferencePriorityWeightage: 0.3,
  workloadBalanceWeightage: 0.2,
  minimizeConflicts: true,
  maxHoursPerFaculty: 18,
  minHoursPerFaculty: 12
};

/**
 * Factory function to create allocation engine
 */
export function createAllocationEngine(config?: Partial<AllocationConfig>): AllocationEngine {
  const fullConfig = { ...DEFAULT_ALLOCATION_CONFIG, ...config };
  return new AllocationEngine(fullConfig);
}