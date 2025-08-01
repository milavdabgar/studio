/**
 * Advanced Conflict Resolution Engine - Phase 2 Enhancement
 * 
 * Provides intelligent conflict detection, analysis, and automated resolution suggestions
 * for the course allocation system.
 */

import type { 
  AllocationConflict,
  CourseAllocation,
  Faculty,
  FacultyPreference,
  CourseOffering,
  AllocationSession
} from '@/types/entities';
import type { FacultyWithWorkload, CourseOfferingWithRequirements } from './allocationEngine';

export interface ConflictResolutionConfig {
  enableAutoResolution: boolean;
  maxAutoResolutionAttempts: number;
  prioritizeHighSeverity: boolean;
  considerFacultyPreferences: boolean;
}

export interface ResolutionResult {
  success: boolean;
  action: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  newAllocations?: CourseAllocation[];
  modifiedAllocations?: Partial<CourseAllocation>[];
  reasonsForFailure?: string[];
}

export class ConflictResolutionEngine {
  private config: ConflictResolutionConfig;
  private faculties: FacultyWithWorkload[] = [];
  private courseOfferings: CourseOfferingWithRequirements[] = [];
  private allocations: CourseAllocation[] = [];
  private preferences: FacultyPreference[] = [];

  constructor(config: ConflictResolutionConfig) {
    this.config = config;
  }

  /**
   * Initialize the resolution engine with current data
   */
  initialize(
    faculties: FacultyWithWorkload[],
    courseOfferings: CourseOfferingWithRequirements[],
    allocations: CourseAllocation[],
    preferences: FacultyPreference[]
  ): void {
    this.faculties = faculties;
    this.courseOfferings = courseOfferings;
    this.allocations = allocations;
    this.preferences = preferences;
  }

  /**
   * Enhance conflicts with detailed resolution suggestions
   */
  async enhanceConflicts(conflicts: AllocationConflict[]): Promise<AllocationConflict[]> {
    const enhancedConflicts: AllocationConflict[] = [];

    for (const conflict of conflicts) {
      const enhanced = await this.enhanceConflict(conflict);
      enhancedConflicts.push(enhanced);
    }

    // Sort by priority (highest first)
    return enhancedConflicts.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Enhance a single conflict with resolution suggestions
   */
  private async enhanceConflict(conflict: AllocationConflict): Promise<AllocationConflict> {
    const suggestions = this.generateResolutionSuggestions(conflict);
    const alternatives = this.generateAlternativeSolutions(conflict);
    const priority = this.calculateConflictPriority(conflict);
    const autoResolvable = this.isAutoResolvable(conflict);
    const recommendedAction = this.getRecommendedAction(conflict);

    return {
      ...conflict,
      resolutionSuggestions: suggestions,
      alternativeSolutions: alternatives,
      priority,
      autoResolvable,
      recommendedAction
    };
  }

  /**
   * Generate resolution suggestions based on conflict type
   */
  private generateResolutionSuggestions(conflict: AllocationConflict): string[] {
    const suggestions: string[] = [];

    switch (conflict.conflictType) {
      case 'overload':
        suggestions.push(
          'Reduce faculty workload by reassigning some courses to other faculty',
          'Split course hours between multiple faculty members',
          'Increase faculty maximum hours limit if justified',
          'Defer some course offerings to next semester'
        );
        break;

      case 'underload':
        suggestions.push(
          'Assign additional courses to utilize faculty capacity',
          'Combine multiple course sections if possible',
          'Consider cross-department course assignments',
          'Adjust minimum workload requirements if appropriate'
        );
        break;

      case 'time_overlap':
        suggestions.push(
          'Reschedule one of the conflicting courses to a different time slot',
          'Reassign one course to a different faculty member',
          'Use team teaching approach with shared responsibilities',
          'Modify course delivery format (e.g., online vs in-person)'
        );
        break;

      case 'expertise_mismatch':
        suggestions.push(
          'Reassign course to faculty with relevant expertise',
          'Provide professional development training to current faculty',
          'Implement team teaching with an expert as co-instructor',
          'Consider hiring adjunct faculty with required expertise'
        );
        break;

      case 'preference_violation':
        suggestions.push(
          'Honor faculty preferences by reassigning course',
          'Negotiate with faculty to accept course with incentives',
          'Review and adjust preference weighting in algorithm',
          'Consider preference patterns for future semester planning'
        );
        break;

      case 'department_mismatch':
        suggestions.push(
          'Reassign course to faculty from the correct department',
          'Establish inter-departmental teaching agreements',
          'Review course-department mappings for accuracy',
          'Consider creating interdisciplinary teaching opportunities'
        );
        break;

      case 'room_conflict':
        suggestions.push(
          'Reschedule courses to avoid room conflicts',
          'Find alternative rooms with similar capabilities',
          'Modify course format to reduce room requirements',
          'Implement hybrid delivery to reduce space needs'
        );
        break;

      case 'consecutive_hours_violation':
        suggestions.push(
          'Redistribute course schedule across different days',
          'Introduce breaks between consecutive classes',
          'Reassign some courses to other faculty',
          'Review and adjust consecutive hours policy'
        );
        break;

      case 'unavailable_time_slot':
        suggestions.push(
          'Reschedule course to faculty available time slots',
          'Reassign course to faculty available during that time',
          'Review and update faculty availability preferences',
          'Consider flexible scheduling options'
        );
        break;

      case 'prerequisite_conflict':
        suggestions.push(
          'Ensure prerequisite courses are scheduled in correct order',
          'Modify course sequencing to resolve dependencies',
          'Consider waiving prerequisites in exceptional cases',
          'Review curriculum structure for logical flow'
        );
        break;

      case 'capacity_exceeded':
        suggestions.push(
          'Split large sections into multiple smaller sections',
          'Find larger rooms to accommodate more students',
          'Implement waiting lists and enrollment management',
          'Consider alternative delivery methods to increase capacity'
        );
        break;

      default:
        suggestions.push(
          'Review conflict details and implement manual resolution',
          'Consult with department heads for guidance',
          'Consider adjusting allocation algorithm parameters'
        );
    }

    return suggestions;
  }

  /**
   * Generate alternative solutions with impact and feasibility analysis
   */
  private generateAlternativeSolutions(conflict: AllocationConflict): Array<{
    action: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    feasibility: 'easy' | 'moderate' | 'difficult';
  }> {
    const solutions: Array<{
      action: string;
      description: string;
      impact: 'low' | 'medium' | 'high';
      feasibility: 'easy' | 'moderate' | 'difficult';
    }> = [];

    const faculty = conflict.facultyId ? this.faculties.find(f => f.id === conflict.facultyId) : null;
    const courses = conflict.courseOfferingIds.map(id => 
      this.courseOfferings.find(c => c.id === id)
    ).filter(Boolean);

    switch (conflict.conflictType) {
      case 'overload':
        solutions.push(
          {
            action: 'Reassign lowest priority course',
            description: 'Move the course with lowest priority to another faculty member',
            impact: 'low',
            feasibility: 'easy'
          },
          {
            action: 'Split course teaching',
            description: 'Divide course responsibilities between multiple faculty',
            impact: 'medium',
            feasibility: 'moderate'
          },
          {
            action: 'Increase workload limit',
            description: 'Temporarily increase faculty maximum hours',
            impact: 'high',
            feasibility: 'difficult'
          }
        );
        break;

      case 'expertise_mismatch':
        const expertFaculty = this.findFacultyWithExpertise(courses[0]);
        solutions.push(
          {
            action: 'Reassign to expert faculty',
            description: expertFaculty 
              ? `Assign course to ${expertFaculty.displayName || expertFaculty.fullName} who has relevant expertise`
              : 'Find faculty member with relevant subject expertise',
            impact: 'low',
            feasibility: expertFaculty ? 'easy' : 'moderate'
          },
          {
            action: 'Team teaching arrangement',
            description: 'Pair current faculty with subject matter expert',
            impact: 'medium',
            feasibility: 'moderate'
          }
        );
        break;

      case 'time_overlap':
        solutions.push(
          {
            action: 'Reschedule to available slot',
            description: 'Move one course to a time slot without conflicts',
            impact: 'low',
            feasibility: 'easy'
          },
          {
            action: 'Reassign to available faculty',
            description: 'Move course to faculty member available at that time',
            impact: 'medium',
            feasibility: 'moderate'
          }
        );
        break;

      case 'underload':
        const availableCourses = this.findUnallocatedCourses();
        solutions.push(
          {
            action: 'Assign additional courses',
            description: `Add ${availableCourses.length} available courses to reach minimum workload`,
            impact: 'low',
            feasibility: availableCourses.length > 0 ? 'easy' : 'difficult'
          },
          {
            action: 'Combine with part-time duties',
            description: 'Add administrative or research responsibilities',
            impact: 'medium',
            feasibility: 'moderate'
          }
        );
        break;

      default:
        solutions.push(
          {
            action: 'Manual review required',
            description: 'Complex conflict requiring human decision',
            impact: 'medium',
            feasibility: 'difficult'
          }
        );
    }

    return solutions;
  }

  /**
   * Calculate conflict priority based on type, severity, and impact
   */
  private calculateConflictPriority(conflict: AllocationConflict): number {
    let priority = 5; // Base priority

    // Severity impact
    const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    priority += severityWeights[conflict.severity];

    // Conflict type impact
    const typeWeights = {
      overload: 3,
      expertise_mismatch: 3,
      time_overlap: 2,
      room_conflict: 2,
      preference_violation: 1,
      underload: 1,
      department_mismatch: 2,
      consecutive_hours_violation: 2,
      unavailable_time_slot: 2,
      prerequisite_conflict: 3,
      capacity_exceeded: 3
    };
    priority += typeWeights[conflict.conflictType] || 1;

    // Ensure priority is within bounds
    return Math.min(10, Math.max(1, priority));
  }

  /**
   * Determine if a conflict can be automatically resolved
   */
  private isAutoResolvable(conflict: AllocationConflict): boolean {
    if (!this.config.enableAutoResolution) return false;

    const autoResolvableTypes = [
      'underload',
      'time_overlap',
      'preference_violation'
    ];

    return autoResolvableTypes.includes(conflict.conflictType) && 
           conflict.severity !== 'critical';
  }

  /**
   * Get recommended action for conflict resolution
   */
  private getRecommendedAction(conflict: AllocationConflict): 'reassign' | 'adjust_hours' | 'change_time' | 'add_faculty' | 'manual_review' {
    switch (conflict.conflictType) {
      case 'overload':
        return 'reassign';
      case 'underload':
        return 'adjust_hours';
      case 'time_overlap':
        return 'change_time';
      case 'expertise_mismatch':
        return 'reassign';
      case 'department_mismatch':
        return 'reassign';
      case 'room_conflict':
        return 'change_time';
      case 'capacity_exceeded':
        return 'add_faculty';
      default:
        return 'manual_review';
    }
  }

  /**
   * Find faculty with expertise in a specific course
   */
  private findFacultyWithExpertise(course: CourseOfferingWithRequirements | undefined): FacultyWithWorkload | null {
    if (!course) return null;

    // Find faculty who have preferences for this course with high expertise
    for (const faculty of this.faculties) {
      const preference = faculty.preferences.find(p => 
        p.academicYear === course.academicYear && 
        p.semester === course.semester
      );

      if (preference) {
        const coursePreference = preference.preferredCourses.find(cp => 
          cp.courseId === course.courseId
        );

        if (coursePreference && coursePreference.expertise >= 8) {
          return faculty;
        }
      }
    }

    // Fallback: find faculty from same department
    return this.faculties.find(f => 
      f.department === course.department && 
      f.availableHours >= course.requiredHours
    ) || null;
  }

  /**
   * Find unallocated courses
   */
  private findUnallocatedCourses(): CourseOfferingWithRequirements[] {
    const allocatedCourseIds = this.allocations.map(a => a.courseOfferingId);
    return this.courseOfferings.filter(course => !allocatedCourseIds.includes(course.id));
  }

  /**
   * Attempt to automatically resolve a conflict
   */
  async resolveConflict(conflict: AllocationConflict): Promise<ResolutionResult> {
    if (!conflict.autoResolvable) {
      return {
        success: false,
        action: 'manual_review',
        description: 'Conflict requires manual intervention',
        impact: 'medium',
        reasonsForFailure: ['Conflict is not auto-resolvable']
      };
    }

    try {
      switch (conflict.conflictType) {
        case 'underload':
          return await this.resolveUnderloadConflict(conflict);
        case 'time_overlap':
          return await this.resolveTimeOverlapConflict(conflict);
        case 'preference_violation':
          return await this.resolvePreferenceViolationConflict(conflict);
        default:
          return {
            success: false,
            action: 'manual_review',
            description: 'No automatic resolution available for this conflict type',
            impact: 'medium',
            reasonsForFailure: ['Unsupported conflict type for auto-resolution']
          };
      }
    } catch (error) {
      return {
        success: false,
        action: 'manual_review',
        description: 'Error during automatic resolution',
        impact: 'medium',
        reasonsForFailure: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Resolve underload conflicts by assigning additional courses
   */
  private async resolveUnderloadConflict(conflict: AllocationConflict): Promise<ResolutionResult> {
    if (!conflict.facultyId) {
      return {
        success: false,
        action: 'manual_review',
        description: 'No faculty ID specified for underload conflict',
        impact: 'medium',
        reasonsForFailure: ['Missing faculty information']
      };
    }

    const faculty = this.faculties.find(f => f.id === conflict.facultyId);
    if (!faculty) {
      return {
        success: false,
        action: 'manual_review',
        description: 'Faculty not found',
        impact: 'medium',
        reasonsForFailure: ['Faculty does not exist']
      };
    }

    const unallocatedCourses = this.findUnallocatedCourses();
    const suitableCourses = unallocatedCourses.filter(course => 
      course.requiredHours <= faculty.availableHours &&
      (!course.department || course.department === faculty.department)
    );

    if (suitableCourses.length === 0) {
      return {
        success: false,
        action: 'manual_review',
        description: 'No suitable courses available for assignment',
        impact: 'low',
        reasonsForFailure: ['No compatible unallocated courses']
      };
    }

    // Select the best course based on faculty preferences
    const bestCourse = this.selectBestCourseForFaculty(faculty, suitableCourses);
    
    return {
      success: true,
      action: 'adjust_hours',
      description: `Assigned ${bestCourse.subjectName} to ${faculty.displayName || faculty.fullName} to meet minimum workload`,
      impact: 'low',
      newAllocations: [{
        id: this.generateId('ca'),
        sessionId: conflict.sessionId,
        courseOfferingId: bestCourse.id,
        facultyId: faculty.id,
        assignmentType: bestCourse.assignmentType || 'theory',
        hoursPerWeek: bestCourse.requiredHours,
        allocationScore: 75, // Default score for auto-resolution
        preferenceMatch: 'medium',
        expertiseLevel: 7,
        conflictLevel: 'none',
        isManualAssignment: false,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]
    };
  }

  /**
   * Resolve time overlap conflicts by rescheduling
   */
  private async resolveTimeOverlapConflict(conflict: AllocationConflict): Promise<ResolutionResult> {
    // This is a simplified implementation - in a real system, you'd need
    // access to actual time slot data and scheduling constraints
    return {
      success: false,
      action: 'manual_review',
      description: 'Time conflict resolution requires manual schedule adjustment',
      impact: 'medium',
      reasonsForFailure: ['Complex scheduling constraints require human intervention']
    };
  }

  /**
   * Resolve preference violation conflicts
   */
  private async resolvePreferenceViolationConflict(conflict: AllocationConflict): Promise<ResolutionResult> {
    // Find a better faculty match for the course
    if (conflict.courseOfferingIds.length === 0) {
      return {
        success: false,
        action: 'manual_review',
        description: 'No course information available',
        impact: 'medium',
        reasonsForFailure: ['Missing course data']
      };
    }

    const courseId = conflict.courseOfferingIds[0];
    const course = this.courseOfferings.find(c => c.id === courseId);
    if (!course) {
      return {
        success: false,
        action: 'manual_review',
        description: 'Course not found',
        impact: 'medium',
        reasonsForFailure: ['Course does not exist']
      };
    }

    const betterFaculty = this.findFacultyWithExpertise(course);
    if (!betterFaculty || betterFaculty.availableHours < course.requiredHours) {
      return {
        success: false,
        action: 'manual_review',
        description: 'No better faculty match available',
        impact: 'low',
        reasonsForFailure: ['No alternative faculty with capacity and expertise']
      };
    }

    return {
      success: true,
      action: 'reassign',
      description: `Reassigned ${course.subjectName} to ${betterFaculty.displayName || betterFaculty.fullName} based on preferences`,
      impact: 'low',
      modifiedAllocations: [{
        courseOfferingId: courseId,
        facultyId: betterFaculty.id,
        allocationScore: 90, // Higher score for preference match
        preferenceMatch: 'high',
        updatedAt: new Date().toISOString()
      }]
    };
  }

  /**
   * Select the best course for a faculty member based on preferences and expertise
   */
  private selectBestCourseForFaculty(
    faculty: FacultyWithWorkload, 
    courses: CourseOfferingWithRequirements[]
  ): CourseOfferingWithRequirements {
    // Score each course based on faculty preferences
    const scoredCourses = courses.map(course => {
      let score = 50; // Base score

      // Check preferences
      const preference = faculty.preferences.find(p => 
        p.academicYear === course.academicYear && 
        p.semester === course.semester
      );

      if (preference) {
        const coursePreference = preference.preferredCourses.find(cp => 
          cp.courseId === course.courseId
        );

        if (coursePreference) {
          score += coursePreference.expertise * 5; // Convert 1-10 to 5-50
          if (coursePreference.preference === 'high') score += 30;
          else if (coursePreference.preference === 'medium') score += 15;
          if (coursePreference.previouslyTaught) score += 20;
        }
      }

      // Department match bonus
      if (faculty.department === course.department) score += 20;

      return { course, score };
    });

    // Return the highest scoring course
    scoredCourses.sort((a, b) => b.score - a.score);
    return scoredCourses[0].course;
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Default conflict resolution configuration
 */
export const DEFAULT_CONFLICT_RESOLUTION_CONFIG: ConflictResolutionConfig = {
  enableAutoResolution: true,
  maxAutoResolutionAttempts: 3,
  prioritizeHighSeverity: true,
  considerFacultyPreferences: true
};

/**
 * Factory function to create conflict resolution engine
 */
export function createConflictResolutionEngine(
  config?: Partial<ConflictResolutionConfig>
): ConflictResolutionEngine {
  const fullConfig = { ...DEFAULT_CONFLICT_RESOLUTION_CONFIG, ...config };
  return new ConflictResolutionEngine(fullConfig);
}