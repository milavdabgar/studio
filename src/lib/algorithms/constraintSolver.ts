import type { 
  Timetable, 
  TimetableEntry, 
  CourseOffering, 
  Faculty, 
  Room, 
  Batch,
  FacultyPreference,
  TimetableConstraints,
  AutoGenerationRequest,
  AutoGenerationResult,
  DayOfWeek 
} from '@/types/entities';

interface Variable {
  id: string;
  courseOfferingId: string;
  domain: Assignment[];
}

interface Assignment {
  dayOfWeek: DayOfWeek;
  timeSlot: { startTime: string; endTime: string };
  facultyId: string;
  roomId: string;
}

interface Constraint {
  type: 'hard' | 'soft';
  weight: number;
  check: (assignment1: Assignment, assignment2: Assignment, var1: Variable, var2: Variable) => boolean;
  description: string;
}

export class ConstraintSolver {
  private courseOfferings: CourseOffering[] = [];
  private faculties: Faculty[] = [];
  private rooms: Room[] = [];
  private batches: Batch[] = [];
  private facultyPreferences: FacultyPreference[] = [];
  private constraints: TimetableConstraints;
  private hardConstraints: Constraint[] = [];
  private softConstraints: Constraint[] = [];

  private timeSlots = [
    { startTime: '08:00', endTime: '09:00' },
    { startTime: '09:00', endTime: '10:00' },
    { startTime: '10:00', endTime: '11:00' },
    { startTime: '11:00', endTime: '12:00' },
    { startTime: '13:00', endTime: '14:00' }, // Skip lunch
    { startTime: '14:00', endTime: '15:00' },
    { startTime: '15:00', endTime: '16:00' },
    { startTime: '16:00', endTime: '17:00' },
  ];

  private workingDays: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  constructor(
    courseOfferings: CourseOffering[],
    faculties: Faculty[],
    rooms: Room[],
    batches: Batch[],
    facultyPreferences: FacultyPreference[],
    constraints: TimetableConstraints
  ) {
    this.courseOfferings = courseOfferings;
    this.faculties = faculties;
    this.rooms = rooms;
    this.batches = batches;
    this.facultyPreferences = facultyPreferences;
    this.constraints = constraints;
    
    this.initializeConstraints();
  }

  async generateTimetablesCSP(request: AutoGenerationRequest): Promise<AutoGenerationResult> {
    const startTime = Date.now();
    
    try {
      const timetables: Timetable[] = [];
      
      for (const batchId of request.batchIds) {
        const batch = this.batches.find(b => b.id === batchId);
        if (!batch) continue;

        const batchCourseOfferings = this.courseOfferings.filter(co => co.batchId === batchId);
        if (batchCourseOfferings.length === 0) continue;

        const variables = this.createVariables(batchCourseOfferings);
        const solution = await this.backtrackSearch(variables, new Map());

        if (solution) {
          const timetable = this.solutionToTimetable(solution, batch, batchCourseOfferings[0]);
          timetables.push(timetable);
        }
      }

      const executionTime = Date.now() - startTime;
      const conflicts = timetables.length > 0 ? 
        timetables.flatMap(t => this.detectConflicts(t)) : [];

      const averageScore = timetables.length > 0 ?
        timetables.reduce((sum, t) => sum + (t.optimizationScore || 0), 0) / timetables.length : 0;

      return {
        success: timetables.length > 0,
        timetables,
        optimizationScore: averageScore,
        executionTime,
        iterations: 1,
        conflicts,
        recommendations: this.generateRecommendations(conflicts, averageScore)
      };

    } catch (error) {
      return {
        success: false,
        timetables: [],
        optimizationScore: 0,
        executionTime: Date.now() - startTime,
        iterations: 0,
        conflicts: [],
        recommendations: [`CSP solving failed: ${(error as Error).message}`]
      };
    }
  }

  private initializeConstraints(): void {
    // Hard constraints
    if (this.constraints.noFacultyConflicts) {
      this.hardConstraints.push({
        type: 'hard',
        weight: 1000,
        check: (a1, a2, v1, v2) => {
          if (v1.id === v2.id) return true;
          return !(a1.dayOfWeek === a2.dayOfWeek && 
                  a1.timeSlot.startTime === a2.timeSlot.startTime && 
                  a1.facultyId === a2.facultyId);
        },
        description: 'No faculty conflicts'
      });
    }

    if (this.constraints.noRoomConflicts) {
      this.hardConstraints.push({
        type: 'hard',
        weight: 1000,
        check: (a1, a2, v1, v2) => {
          if (v1.id === v2.id) return true;
          return !(a1.dayOfWeek === a2.dayOfWeek && 
                  a1.timeSlot.startTime === a2.timeSlot.startTime && 
                  a1.roomId === a2.roomId);
        },
        description: 'No room conflicts'
      });
    }

    // Soft constraints
    if (this.constraints.respectFacultyPreferences) {
      this.softConstraints.push({
        type: 'soft',
        weight: 10,
        check: (a1, a2) => this.checkFacultyPreference(a1),
        description: 'Respect faculty preferences'
      });
    }

    if (this.constraints.preferMorningSlots) {
      this.softConstraints.push({
        type: 'soft',
        weight: 5,
        check: (a1) => {
          const hour = parseInt(a1.timeSlot.startTime.split(':')[0]);
          return hour >= 9 && hour <= 11;
        },
        description: 'Prefer morning slots'
      });
    }
  }

  private createVariables(courseOfferings: CourseOffering[]): Variable[] {
    const variables: Variable[] = [];

    for (const courseOffering of courseOfferings) {
      const sessionsNeeded = this.calculateSessionsNeeded(courseOffering);
      
      for (let session = 0; session < sessionsNeeded; session++) {
        const variable: Variable = {
          id: `${courseOffering.id}_session_${session}`,
          courseOfferingId: courseOffering.id,
          domain: this.generateDomain(courseOffering)
        };
        variables.push(variable);
      }
    }

    return variables;
  }

  private calculateSessionsNeeded(courseOffering: CourseOffering): number {
    // Default to 4 sessions per course per week
    return 4;
  }

  private generateDomain(courseOffering: CourseOffering): Assignment[] {
    const domain: Assignment[] = [];
    
    const availableFaculties = this.faculties.filter(f => 
      courseOffering.facultyIds.includes(f.id)
    );
    
    const availableRooms = this.rooms.filter(r => 
      !courseOffering.roomIds || courseOffering.roomIds.includes(r.id)
    );

    for (const day of this.workingDays) {
      for (const timeSlot of this.timeSlots) {
        for (const faculty of availableFaculties) {
          for (const room of availableRooms) {
            // Check faculty availability
            if (this.isFacultyAvailable(faculty.id, day, timeSlot, courseOffering.academicYear || '', courseOffering.semester || 0)) {
              domain.push({
                dayOfWeek: day,
                timeSlot,
                facultyId: faculty.id,
                roomId: room.id
              });
            }
          }
        }
      }
    }

    return domain;
  }

  private isFacultyAvailable(
    facultyId: string, 
    day: DayOfWeek, 
    timeSlot: { startTime: string; endTime: string },
    academicYear: string,
    semester: number
  ): boolean {
    const preference = this.facultyPreferences.find(fp => 
      fp.facultyId === facultyId && 
      fp.academicYear === academicYear && 
      fp.semester === semester
    );

    if (!preference) return true;

    // Check unavailable slots
    const isUnavailable = preference.unavailableSlots.some(slot =>
      slot.dayOfWeek === day &&
      this.timeOverlaps(
        { startTime: timeSlot.startTime, endTime: timeSlot.endTime },
        { startTime: slot.startTime, endTime: slot.endTime }
      )
    );

    if (isUnavailable) return false;

    // Check working days
    if (!preference.workingDays.includes(day)) return false;

    return true;
  }

  private timeOverlaps(
    slot1: { startTime: string; endTime: string },
    slot2: { startTime: string; endTime: string }
  ): boolean {
    const start1 = this.timeToMinutes(slot1.startTime);
    const end1 = this.timeToMinutes(slot1.endTime);
    const start2 = this.timeToMinutes(slot2.startTime);
    const end2 = this.timeToMinutes(slot2.endTime);

    return !(end1 <= start2 || start1 >= end2);
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async backtrackSearch(
    variables: Variable[], 
    assignment: Map<string, Assignment>
  ): Promise<Map<string, Assignment> | null> {
    if (assignment.size === variables.length) {
      return assignment; // Complete assignment found
    }

    const variable = this.selectUnassignedVariable(variables, assignment);
    if (!variable) return null;

    const orderedDomain = this.orderDomainValues(variable, assignment);

    for (const value of orderedDomain) {
      if (this.isConsistent(variable, value, assignment, variables)) {
        assignment.set(variable.id, value);
        
        const result = await this.backtrackSearch(variables, assignment);
        if (result) return result;
        
        assignment.delete(variable.id); // Backtrack
      }
    }

    return null;
  }

  private selectUnassignedVariable(
    variables: Variable[], 
    assignment: Map<string, Assignment>
  ): Variable | null {
    // Most Constrained Variable (MCV) heuristic
    const unassigned = variables.filter(v => !assignment.has(v.id));
    if (unassigned.length === 0) return null;

    return unassigned.reduce((best, current) => {
      const currentValidDomain = current.domain.filter(value =>
        this.isConsistent(current, value, assignment, variables)
      );
      const bestValidDomain = best.domain.filter(value =>
        this.isConsistent(best, value, assignment, variables)
      );
      
      return currentValidDomain.length < bestValidDomain.length ? current : best;
    });
  }

  private orderDomainValues(
    variable: Variable, 
    assignment: Map<string, Assignment>
  ): Assignment[] {
    // Least Constraining Value (LCV) heuristic
    return variable.domain
      .filter(value => this.isConsistent(variable, value, assignment, []))
      .sort((a, b) => {
        const scoreA = this.evaluateAssignment(a);
        const scoreB = this.evaluateAssignment(b);
        return scoreB - scoreA; // Higher score first
      });
  }

  private evaluateAssignment(assignment: Assignment): number {
    let score = 0;

    // Apply soft constraints
    for (const constraint of this.softConstraints) {
      if (constraint.check(assignment, assignment, null as any, null as any)) {
        score += constraint.weight;
      }
    }

    return score;
  }

  private isConsistent(
    variable: Variable, 
    value: Assignment, 
    assignment: Map<string, Assignment>,
    allVariables: Variable[]
  ): boolean {
    // Check hard constraints against all existing assignments
    for (const [varId, existingValue] of assignment) {
      const existingVar = allVariables.find(v => v.id === varId);
      if (!existingVar) continue;

      for (const constraint of this.hardConstraints) {
        if (!constraint.check(value, existingValue, variable, existingVar)) {
          return false;
        }
      }
    }

    return true;
  }

  private checkFacultyPreference(assignment: Assignment): boolean {
    const preference = this.facultyPreferences.find(fp => 
      fp.facultyId === assignment.facultyId
    );

    if (!preference) return true;

    const timeMatch = preference.timePreferences.find(tp =>
      tp.dayOfWeek === assignment.dayOfWeek &&
      this.timeInRange(assignment.timeSlot.startTime, tp.startTime, tp.endTime)
    );

    return timeMatch?.preference === 'preferred' || timeMatch?.preference === 'available';
  }

  private timeInRange(timeToCheck: string, startTime: string, endTime: string): boolean {
    const check = this.timeToMinutes(timeToCheck);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    return check >= start && check <= end;
  }

  private solutionToTimetable(
    solution: Map<string, Assignment>, 
    batch: Batch,
    sampleCourseOffering: CourseOffering
  ): Timetable {
    const entries: TimetableEntry[] = [];
    
    for (const [variableId, assignment] of solution) {
      const courseOfferingId = variableId.split('_session_')[0];
      const courseOffering = this.courseOfferings.find(co => co.id === courseOfferingId);
      
      if (courseOffering) {
        entries.push({
          dayOfWeek: assignment.dayOfWeek,
          startTime: assignment.timeSlot.startTime,
          endTime: assignment.timeSlot.endTime,
          courseOfferingId: courseOffering.id,
          courseId: courseOffering.courseId,
          facultyId: assignment.facultyId,
          roomId: assignment.roomId,
          entryType: 'lecture'
        });
      }
    }

    const timetable: Timetable = {
      id: `csp_${Date.now()}_${Math.random()}`,
      name: `${batch.name} - CSP Generated`,
      academicYear: sampleCourseOffering.academicYear || '',
      semester: sampleCourseOffering.semester || 0,
      programId: batch.programId,
      batchId: batch.id,
      version: '1.0',
      status: 'draft',
      effectiveDate: new Date().toISOString(),
      entries,
      generationType: 'auto_constraint',
      optimizationScore: this.calculateOptimizationScore(entries)
    };

    return timetable;
  }

  private calculateOptimizationScore(entries: TimetableEntry[]): number {
    let score = 100; // Base score
    
    // Apply soft constraint bonuses
    for (const entry of entries) {
      for (const constraint of this.softConstraints) {
        const assignment: Assignment = {
          dayOfWeek: entry.dayOfWeek,
          timeSlot: { startTime: entry.startTime, endTime: entry.endTime },
          facultyId: entry.facultyId,
          roomId: entry.roomId
        };
        
        if (constraint.check(assignment, assignment, null as any, null as any)) {
          score += constraint.weight;
        }
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  private detectConflicts(timetable: Timetable): any[] {
    // Reuse conflict detection from genetic algorithm
    const conflicts: any[] = [];
    const entries = timetable.entries;

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const entry1 = entries[i];
        const entry2 = entries[j];

        if (entry1.dayOfWeek === entry2.dayOfWeek && 
            entry1.startTime === entry2.startTime) {
          
          if (entry1.facultyId === entry2.facultyId) {
            conflicts.push({
              type: 'faculty',
              severity: 'critical',
              description: `Faculty conflict at ${entry1.dayOfWeek} ${entry1.startTime}`,
              affectedEntries: [i, j]
            });
          }

          if (entry1.roomId === entry2.roomId) {
            conflicts.push({
              type: 'room',
              severity: 'critical',
              description: `Room conflict at ${entry1.dayOfWeek} ${entry1.startTime}`,
              affectedEntries: [i, j]
            });
          }
        }
      }
    }

    return conflicts;
  }

  private generateRecommendations(conflicts: any[], score: number): string[] {
    const recommendations: string[] = [];

    if (conflicts.length === 0) {
      recommendations.push("CSP solution found with no conflicts!");
    } else {
      recommendations.push(`${conflicts.length} conflicts detected in CSP solution.`);
      recommendations.push("Consider relaxing constraints or adding more resources.");
    }

    if (score > 80) {
      recommendations.push("High-quality solution generated using constraint satisfaction.");
    } else if (score > 60) {
      recommendations.push("Good solution with room for optimization.");
    } else {
      recommendations.push("Solution meets hard constraints but violates many soft constraints.");
    }

    return recommendations;
  }
}