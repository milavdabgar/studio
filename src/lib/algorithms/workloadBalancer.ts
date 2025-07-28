import type { 
  Faculty, 
  Timetable, 
  TimetableEntry, 
  FacultyPreference,
  CourseOffering 
} from '@/types/entities';

export interface FacultyWorkload {
  facultyId: string;
  totalHours: number;
  dailyHours: { [day: string]: number };
  consecutiveHours: number;
  courseLoad: number;
  utilizationScore: number;
  balanceScore: number;
  preferenceScore: number;
}

export interface WorkloadAnalysis {
  facultyWorkloads: FacultyWorkload[];
  averageWorkload: number;
  workloadVariance: number;
  balanceScore: number;
  recommendations: string[];
  alerts: WorkloadAlert[];
}

export interface WorkloadAlert {
  type: 'overload' | 'underload' | 'consecutive' | 'preference_violation';
  severity: 'high' | 'medium' | 'low';
  facultyId: string;
  message: string;
  suggestion: string;
}

export class WorkloadBalancer {
  private faculties: Faculty[] = [];
  private facultyPreferences: FacultyPreference[] = [];
  private courseOfferings: CourseOffering[] = [];

  constructor(
    faculties: Faculty[],
    facultyPreferences: FacultyPreference[],
    courseOfferings: CourseOffering[]
  ) {
    this.faculties = faculties;
    this.facultyPreferences = facultyPreferences;
    this.courseOfferings = courseOfferings;
  }

  analyzeWorkload(timetables: Timetable[]): WorkloadAnalysis {
    const facultyWorkloads = this.calculateFacultyWorkloads(timetables);
    const averageWorkload = this.calculateAverageWorkload(facultyWorkloads);
    const workloadVariance = this.calculateWorkloadVariance(facultyWorkloads, averageWorkload);
    const balanceScore = this.calculateBalanceScore(facultyWorkloads, workloadVariance);
    const recommendations = this.generateRecommendations(facultyWorkloads);
    const alerts = this.generateAlerts(facultyWorkloads);

    return {
      facultyWorkloads,
      averageWorkload,
      workloadVariance,
      balanceScore,
      recommendations,
      alerts
    };
  }

  private calculateFacultyWorkloads(timetables: Timetable[]): FacultyWorkload[] {
    const workloadMap = new Map<string, FacultyWorkload>();

    // Initialize workload for all faculties
    for (const faculty of this.faculties) {
      workloadMap.set(faculty.id, {
        facultyId: faculty.id,
        totalHours: 0,
        dailyHours: {
          Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0
        },
        consecutiveHours: 0,
        courseLoad: 0,
        utilizationScore: 0,
        balanceScore: 0,
        preferenceScore: 0
      });
    }

    // Calculate workload from all timetables
    for (const timetable of timetables) {
      for (const entry of timetable.entries) {
        const workload = workloadMap.get(entry.facultyId);
        if (workload) {
          const hours = this.calculateHours(entry.startTime, entry.endTime);
          workload.totalHours += hours;
          workload.dailyHours[entry.dayOfWeek] += hours;
        }
      }
    }

    // Calculate derived metrics
    for (const [facultyId, workload] of workloadMap) {
      workload.consecutiveHours = this.calculateMaxConsecutiveHours(timetables, facultyId);
      workload.courseLoad = this.calculateCourseLoad(timetables, facultyId);
      workload.utilizationScore = this.calculateUtilizationScore(workload);
      workload.balanceScore = this.calculateIndividualBalanceScore(workload);
      workload.preferenceScore = this.calculatePreferenceScore(timetables, facultyId);
    }

    return Array.from(workloadMap.values());
  }

  private calculateHours(startTime: string, endTime: string): number {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    return (end - start) / 60;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private calculateMaxConsecutiveHours(timetables: Timetable[], facultyId: string): number {
    const daySchedules = new Map<string, { startTime: string; endTime: string }[]>();

    // Group entries by day
    for (const timetable of timetables) {
      for (const entry of timetable.entries) {
        if (entry.facultyId === facultyId) {
          const dayEntries = daySchedules.get(entry.dayOfWeek) || [];
          dayEntries.push({ startTime: entry.startTime, endTime: entry.endTime });
          daySchedules.set(entry.dayOfWeek, dayEntries);
        }
      }
    }

    let maxConsecutive = 0;

    for (const [day, entries] of daySchedules) {
      // Sort entries by start time
      const sortedEntries = entries.sort((a, b) => 
        this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
      );

      let currentConsecutive = 0;
      let lastEndTime = '';

      for (const entry of sortedEntries) {
        if (lastEndTime === '' || entry.startTime === lastEndTime) {
          // Consecutive or first entry
          currentConsecutive += this.calculateHours(entry.startTime, entry.endTime);
        } else {
          // Gap found, reset
          maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
          currentConsecutive = this.calculateHours(entry.startTime, entry.endTime);
        }
        lastEndTime = entry.endTime;
      }

      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    }

    return maxConsecutive;
  }

  private calculateCourseLoad(timetables: Timetable[], facultyId: string): number {
    const courses = new Set<string>();
    
    for (const timetable of timetables) {
      for (const entry of timetable.entries) {
        if (entry.facultyId === facultyId) {
          courses.add(entry.courseId);
        }
      }
    }

    return courses.size;
  }

  private calculateUtilizationScore(workload: FacultyWorkload): number {
    const idealHours = 20; // Assuming 20 hours per week is ideal
    const utilizationRatio = workload.totalHours / idealHours;
    
    if (utilizationRatio >= 0.8 && utilizationRatio <= 1.2) {
      return 100; // Optimal utilization
    } else if (utilizationRatio < 0.8) {
      return utilizationRatio * 125; // Underutilized
    } else {
      return Math.max(0, 100 - (utilizationRatio - 1.2) * 100); // Overutilized
    }
  }

  private calculateIndividualBalanceScore(workload: FacultyWorkload): number {
    const dailyHours = Object.values(workload.dailyHours).filter(h => h > 0);
    if (dailyHours.length === 0) return 0;

    const mean = dailyHours.reduce((sum, h) => sum + h, 0) / dailyHours.length;
    const variance = dailyHours.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / dailyHours.length;
    
    return Math.max(0, 100 - variance * 10);
  }

  private calculatePreferenceScore(timetables: Timetable[], facultyId: string): number {
    const preferences = this.facultyPreferences.find(fp => fp.facultyId === facultyId);
    if (!preferences) return 50; // Neutral score if no preferences

    let score = 0;
    let totalEntries = 0;

    for (const timetable of timetables) {
      if (timetable.academicYear !== preferences.academicYear || 
          timetable.semester !== preferences.semester) {
        continue;
      }

      for (const entry of timetable.entries) {
        if (entry.facultyId === facultyId) {
          totalEntries++;

          // Check time preferences
          const timeMatch = preferences.timePreferences.find(tp =>
            tp.dayOfWeek === entry.dayOfWeek &&
            this.timeInRange(entry.startTime, tp.startTime, tp.endTime)
          );
          
          if (timeMatch) {
            switch (timeMatch.preference) {
              case 'preferred': score += 10; break;
              case 'available': score += 5; break;
              case 'avoid': score -= 10; break;
            }
          }

          // Check course preferences
          const courseMatch = preferences.preferredCourses.find(cp => cp.courseId === entry.courseId);
          if (courseMatch) {
            switch (courseMatch.preference) {
              case 'high': score += 8; break;
              case 'medium': score += 4; break;
              case 'low': score += 1; break;
            }
          }
        }
      }
    }

    return totalEntries > 0 ? Math.max(0, Math.min(100, 50 + (score / totalEntries) * 5)) : 50;
  }

  private timeInRange(timeToCheck: string, startTime: string, endTime: string): boolean {
    const check = this.timeToMinutes(timeToCheck);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    return check >= start && check <= end;
  }

  private calculateAverageWorkload(workloads: FacultyWorkload[]): number {
    if (workloads.length === 0) return 0;
    return workloads.reduce((sum, w) => sum + w.totalHours, 0) / workloads.length;
  }

  private calculateWorkloadVariance(workloads: FacultyWorkload[], averageWorkload: number): number {
    if (workloads.length === 0) return 0;
    return workloads.reduce((sum, w) => sum + Math.pow(w.totalHours - averageWorkload, 2), 0) / workloads.length;
  }

  private calculateBalanceScore(workloads: FacultyWorkload[], variance: number): number {
    // Lower variance means better balance
    const normalizedVariance = Math.min(variance / 100, 1); // Normalize to 0-1
    return Math.max(0, 100 - normalizedVariance * 100);
  }

  private generateRecommendations(workloads: FacultyWorkload[]): string[] {
    const recommendations: string[] = [];
    const averageHours = workloads.reduce((sum, w) => sum + w.totalHours, 0) / workloads.length;

    // Identify overloaded and underloaded faculty
    const overloaded = workloads.filter(w => w.totalHours > averageHours * 1.3);
    const underloaded = workloads.filter(w => w.totalHours < averageHours * 0.7);

    if (overloaded.length > 0) {
      recommendations.push(`${overloaded.length} faculty members are overloaded. Consider redistributing courses.`);
    }

    if (underloaded.length > 0) {
      recommendations.push(`${underloaded.length} faculty members are underutilized. Consider assigning additional courses.`);
    }

    // Check for consecutive hours violations
    const consecutiveViolations = workloads.filter(w => w.consecutiveHours > 4);
    if (consecutiveViolations.length > 0) {
      recommendations.push(`${consecutiveViolations.length} faculty have excessive consecutive hours. Add breaks or redistribute.`);
    }

    // Check for low preference scores
    const lowPreferenceScores = workloads.filter(w => w.preferenceScore < 30);
    if (lowPreferenceScores.length > 0) {
      recommendations.push(`${lowPreferenceScores.length} faculty have low preference satisfaction. Review course assignments.`);
    }

    // Overall balance recommendations
    const variance = this.calculateWorkloadVariance(workloads, averageHours);
    if (variance > 25) {
      recommendations.push("High workload variance detected. Consider better distribution of teaching hours.");
    }

    if (recommendations.length === 0) {
      recommendations.push("Workload distribution appears balanced. No major issues detected.");
    }

    return recommendations;
  }

  private generateAlerts(workloads: FacultyWorkload[]): WorkloadAlert[] {
    const alerts: WorkloadAlert[] = [];

    for (const workload of workloads) {
      const faculty = this.faculties.find(f => f.id === workload.facultyId);
      const facultyName = faculty?.gtuName || faculty?.firstName || 'Unknown Faculty';

      // Overload alerts
      if (workload.totalHours > 30) {
        alerts.push({
          type: 'overload',
          severity: 'high',
          facultyId: workload.facultyId,
          message: `${facultyName} is severely overloaded with ${workload.totalHours} hours/week`,
          suggestion: 'Reduce course assignments or redistribute to other faculty'
        });
      } else if (workload.totalHours > 25) {
        alerts.push({
          type: 'overload',
          severity: 'medium',
          facultyId: workload.facultyId,
          message: `${facultyName} has high workload with ${workload.totalHours} hours/week`,
          suggestion: 'Monitor workload and consider redistribution if needed'
        });
      }

      // Underload alerts
      if (workload.totalHours < 10) {
        alerts.push({
          type: 'underload',
          severity: 'medium',
          facultyId: workload.facultyId,
          message: `${facultyName} is underutilized with only ${workload.totalHours} hours/week`,
          suggestion: 'Consider assigning additional courses or responsibilities'
        });
      }

      // Consecutive hours alerts
      if (workload.consecutiveHours > 5) {
        alerts.push({
          type: 'consecutive',
          severity: 'high',
          facultyId: workload.facultyId,
          message: `${facultyName} has ${workload.consecutiveHours} consecutive teaching hours`,
          suggestion: 'Add breaks or split the schedule across different days'
        });
      } else if (workload.consecutiveHours > 3) {
        alerts.push({
          type: 'consecutive',
          severity: 'medium',
          facultyId: workload.facultyId,
          message: `${facultyName} has ${workload.consecutiveHours} consecutive teaching hours`,
          suggestion: 'Consider adding short breaks between classes'
        });
      }

      // Preference violation alerts
      if (workload.preferenceScore < 20) {
        alerts.push({
          type: 'preference_violation',
          severity: 'medium',
          facultyId: workload.facultyId,
          message: `${facultyName} has very low preference satisfaction (${workload.preferenceScore.toFixed(1)}%)`,
          suggestion: 'Review course assignments against faculty preferences'
        });
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  // Method to suggest workload redistribution
  suggestRedistribution(timetables: Timetable[]): {
    suggestions: WorkloadRedistributionSuggestion[];
    estimatedImprovement: number;
  } {
    const analysis = this.analyzeWorkload(timetables);
    const suggestions: WorkloadRedistributionSuggestion[] = [];

    // Find overloaded and underloaded faculty
    const overloaded = analysis.facultyWorkloads
      .filter(w => w.totalHours > analysis.averageWorkload * 1.2)
      .sort((a, b) => b.totalHours - a.totalHours);

    const underloaded = analysis.facultyWorkloads
      .filter(w => w.totalHours < analysis.averageWorkload * 0.8)
      .sort((a, b) => a.totalHours - b.totalHours);

    // Generate redistribution suggestions
    for (const overloadedFaculty of overloaded) {
      for (const underloadedFaculty of underloaded) {
        const commonCourses = this.findCommonCourseCapabilities(
          overloadedFaculty.facultyId, 
          underloadedFaculty.facultyId
        );

        if (commonCourses.length > 0) {
          const hoursToTransfer = Math.min(
            (overloadedFaculty.totalHours - analysis.averageWorkload) / 2,
            (analysis.averageWorkload - underloadedFaculty.totalHours) / 2
          );

          if (hoursToTransfer > 1) {
            suggestions.push({
              fromFacultyId: overloadedFaculty.facultyId,
              toFacultyId: underloadedFaculty.facultyId,
              suggestedCourses: commonCourses.slice(0, 2),
              estimatedHours: hoursToTransfer,
              reason: 'Balance workload distribution',
              priority: this.calculateRedistributionPriority(overloadedFaculty, underloadedFaculty)
            });
          }
        }
      }
    }

    const estimatedImprovement = this.estimateRedistributionImprovement(suggestions, analysis);

    return {
      suggestions: suggestions.sort((a, b) => b.priority - a.priority).slice(0, 10),
      estimatedImprovement
    };
  }

  private findCommonCourseCapabilities(facultyId1: string, facultyId2: string): string[] {
    const faculty1Courses = new Set<string>();
    const faculty2Courses = new Set<string>();

    // Find courses both faculty can teach based on course offerings
    for (const offering of this.courseOfferings) {
      if (offering.facultyIds.includes(facultyId1)) {
        faculty1Courses.add(offering.courseId);
      }
      if (offering.facultyIds.includes(facultyId2)) {
        faculty2Courses.add(offering.courseId);
      }
    }

    return Array.from(faculty1Courses).filter(courseId => faculty2Courses.has(courseId));
  }

  private calculateRedistributionPriority(
    overloaded: FacultyWorkload, 
    underloaded: FacultyWorkload
  ): number {
    let priority = 0;
    
    // Higher priority for more severe overload
    priority += Math.max(0, overloaded.totalHours - 25) * 2;
    
    // Higher priority for more severe underload
    priority += Math.max(0, 15 - underloaded.totalHours);
    
    // Consider preference scores
    priority += (100 - overloaded.preferenceScore) * 0.1;
    priority += (100 - underloaded.preferenceScore) * 0.1;

    return priority;
  }

  private estimateRedistributionImprovement(
    suggestions: WorkloadRedistributionSuggestion[], 
    currentAnalysis: WorkloadAnalysis
  ): number {
    if (suggestions.length === 0) return 0;

    // Simulate the effect of applying all suggestions
    const hoursTransferred = suggestions.reduce((sum, s) => sum + s.estimatedHours, 0);
    const facultiesAffected = new Set([
      ...suggestions.map(s => s.fromFacultyId),
      ...suggestions.map(s => s.toFacultyId)
    ]).size;

    // Estimate improvement in balance score
    const currentVariance = currentAnalysis.workloadVariance;
    const estimatedVarianceReduction = hoursTransferred * 0.5; // Rough estimate
    const newVariance = Math.max(0, currentVariance - estimatedVarianceReduction);
    
    const currentBalanceScore = currentAnalysis.balanceScore;
    const newBalanceScore = Math.max(0, 100 - newVariance);
    
    return Math.min(100, Math.max(0, newBalanceScore - currentBalanceScore));
  }
}

export interface WorkloadRedistributionSuggestion {
  fromFacultyId: string;
  toFacultyId: string;
  suggestedCourses: string[];
  estimatedHours: number;
  reason: string;
  priority: number;
}