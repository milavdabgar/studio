import type { 
  Timetable, 
  TimetableEntry, 
  CourseOffering, 
  Faculty, 
  Room, 
  Batch,
  FacultyPreference,
  TimetableConstraints,
  TimetableConflict,
  AutoGenerationRequest,
  AutoGenerationResult,
  DayOfWeek 
} from '@/types/entities';

export class TimetableOptimizer {
  private courseOfferings: CourseOffering[] = [];
  private faculties: Faculty[] = [];
  private rooms: Room[] = [];
  private batches: Batch[] = [];
  private facultyPreferences: FacultyPreference[] = [];
  private constraints: TimetableConstraints;

  // Time slots configuration
  private timeSlots = [
    { startTime: '08:00', endTime: '09:00' },
    { startTime: '09:00', endTime: '10:00' },
    { startTime: '10:00', endTime: '11:00' },
    { startTime: '11:00', endTime: '12:00' },
    { startTime: '12:00', endTime: '13:00' }, // Lunch break
    { startTime: '13:00', endTime: '14:00' },
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
  }

  // Genetic Algorithm Implementation
  async generateTimetablesGenetic(request: AutoGenerationRequest): Promise<AutoGenerationResult> {
    const startTime = Date.now();
    const populationSize = request.populationSize || 50;
    const maxIterations = request.maxIterations || 100;
    const mutationRate = request.mutationRate || 0.1;
    const crossoverRate = request.crossoverRate || 0.8;

    try {
      // Step 1: Generate initial population
      let population = this.generateInitialPopulation(request.batchIds, populationSize);
      
      let bestTimetable = null;
      let bestScore = -Infinity;
      let generations = 0;

      // Step 2: Evolution loop
      for (let generation = 0; generation < maxIterations; generation++) {
        generations = generation + 1;

        // Evaluate fitness for each timetable
        const fitnessScores = population.map(timetable => 
          this.evaluateFitness(timetable, request.considerPreferences)
        );

        // Track best solution
        const currentBestIndex = fitnessScores.indexOf(Math.max(...fitnessScores));
        if (fitnessScores[currentBestIndex] > bestScore) {
          bestScore = fitnessScores[currentBestIndex];
          bestTimetable = JSON.parse(JSON.stringify(population[currentBestIndex]));
        }

        // Selection, crossover, and mutation
        const newPopulation: Timetable[] = [];
        
        // Elitism: Keep best 10% of population
        const eliteCount = Math.floor(populationSize * 0.1);
        const eliteIndices = fitnessScores
          .map((score, index) => ({ score, index }))
          .sort((a, b) => b.score - a.score)
          .slice(0, eliteCount)
          .map(item => item.index);
        
        eliteIndices.forEach(index => {
          newPopulation.push(JSON.parse(JSON.stringify(population[index])));
        });

        // Generate rest of population through crossover and mutation
        while (newPopulation.length < populationSize) {
          const parent1 = this.tournamentSelection(population, fitnessScores);
          const parent2 = this.tournamentSelection(population, fitnessScores);
          
          let offspring1, offspring2;
          if (Math.random() < crossoverRate) {
            [offspring1, offspring2] = this.crossover(parent1, parent2);
          } else {
            offspring1 = JSON.parse(JSON.stringify(parent1));
            offspring2 = JSON.parse(JSON.stringify(parent2));
          }

          if (Math.random() < mutationRate) {
            offspring1 = this.mutate(offspring1);
          }
          if (Math.random() < mutationRate) {
            offspring2 = this.mutate(offspring2);
          }

          newPopulation.push(offspring1);
          if (newPopulation.length < populationSize) {
            newPopulation.push(offspring2);
          }
        }

        population = newPopulation;

        // Early termination if good enough solution found
        if (bestScore > 0.95) break;
      }

      const executionTime = Date.now() - startTime;
      const conflicts = bestTimetable ? this.detectConflicts(bestTimetable) : [];

      return {
        success: bestTimetable !== null,
        timetables: bestTimetable ? [bestTimetable] : [],
        optimizationScore: bestScore,
        executionTime,
        iterations: generations,
        conflicts,
        recommendations: this.generateRecommendations(conflicts, bestScore)
      };

    } catch (error) {
      return {
        success: false,
        timetables: [],
        optimizationScore: 0,
        executionTime: Date.now() - startTime,
        iterations: 0,
        conflicts: [],
        recommendations: [`Error during optimization: ${(error as Error).message}`]
      };
    }
  }

  private generateInitialPopulation(batchIds: string[], populationSize: number): Timetable[] {
    const population: Timetable[] = [];
    
    for (let i = 0; i < populationSize; i++) {
      const timetables = this.generateRandomTimetables(batchIds);
      population.push(...timetables);
    }

    // If we have fewer timetables than needed, duplicate and mutate
    while (population.length < populationSize) {
      const randomIndex = Math.floor(Math.random() * population.length);
      const clone = JSON.parse(JSON.stringify(population[randomIndex]));
      population.push(this.mutate(clone));
    }

    return population.slice(0, populationSize);
  }

  private generateRandomTimetables(batchIds: string[]): Timetable[] {
    const timetables: Timetable[] = [];

    for (const batchId of batchIds) {
      const batch = this.batches.find(b => b.id === batchId);
      if (!batch) continue;

      const batchCourseOfferings = this.courseOfferings.filter(co => co.batchId === batchId);
      const entries: TimetableEntry[] = [];

      for (const courseOffering of batchCourseOfferings) {
        // Generate random schedule entries for this course
        const hoursNeeded = this.calculateHoursNeeded(courseOffering);
        
        for (let hour = 0; hour < hoursNeeded; hour++) {
          const entry = this.generateRandomEntry(courseOffering);
          if (entry && !this.hasDirectConflict(entries, entry)) {
            entries.push(entry);
          }
        }
      }

      const timetable: Timetable = {
        id: `temp_${Date.now()}_${Math.random()}`,
        name: `${batch.name} - Auto Generated`,
        academicYear: batchCourseOfferings[0]?.academicYear || '2024-25',
        semester: batchCourseOfferings[0]?.semester || 1,
        programId: batch.programId,
        batchId: batch.id,
        version: '1.0',
        status: 'draft',
        effectiveDate: new Date().toISOString(),
        entries,
        generationType: 'auto_genetic',
        optimizationScore: 0
      };

      timetables.push(timetable);
    }

    return timetables;
  }

  private calculateHoursNeeded(courseOffering: CourseOffering): number {
    // Default to 4 hours per week per course, can be customized based on course type
    return 4;
  }

  private generateRandomEntry(courseOffering: CourseOffering): TimetableEntry | null {
    const availableFaculties = this.faculties.filter(f => 
      courseOffering.facultyIds.includes(f.id)
    );
    
    const availableRooms = this.rooms.filter(r => 
      !courseOffering.roomIds || courseOffering.roomIds.includes(r.id)
    );

    if (availableFaculties.length === 0 || availableRooms.length === 0) {
      return null;
    }

    const randomDay = this.workingDays[Math.floor(Math.random() * this.workingDays.length)];
    const randomTimeSlot = this.timeSlots[Math.floor(Math.random() * this.timeSlots.length)];
    const randomFaculty = availableFaculties[Math.floor(Math.random() * availableFaculties.length)];
    const randomRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];

    return {
      dayOfWeek: randomDay,
      startTime: randomTimeSlot.startTime,
      endTime: randomTimeSlot.endTime,
      courseOfferingId: courseOffering.id,
      courseId: courseOffering.courseId,
      facultyId: randomFaculty.id,
      roomId: randomRoom.id,
      entryType: 'lecture'
    };
  }

  private hasDirectConflict(entries: TimetableEntry[], newEntry: TimetableEntry): boolean {
    return entries.some(entry => 
      entry.dayOfWeek === newEntry.dayOfWeek &&
      entry.startTime === newEntry.startTime &&
      (entry.facultyId === newEntry.facultyId || entry.roomId === newEntry.roomId)
    );
  }

  private evaluateFitness(timetable: Timetable, considerPreferences: boolean): number {
    let score = 0;
    const penalties: number[] = [];

    // Hard constraints (heavy penalties if violated)
    const conflicts = this.detectConflicts(timetable);
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical').length;
    const majorConflicts = conflicts.filter(c => c.severity === 'major').length;
    const minorConflicts = conflicts.filter(c => c.severity === 'minor').length;

    penalties.push(criticalConflicts * -100); // Critical conflicts heavily penalized
    penalties.push(majorConflicts * -20);     // Major conflicts moderately penalized
    penalties.push(minorConflicts * -5);      // Minor conflicts lightly penalized

    // Soft constraints (positive rewards for good solutions)
    if (considerPreferences) {
      score += this.evaluateFacultyPreferences(timetable);
    }
    
    score += this.evaluateWorkloadBalance(timetable);
    score += this.evaluateTimeDistribution(timetable);
    score += this.evaluateRoomUtilization(timetable);

    // Apply penalties
    const totalPenalty = penalties.reduce((sum, penalty) => sum + penalty, 0);
    score += totalPenalty;

    // Bonus for covering all required courses
    const coverageBonus = this.evaluateCourseCoverage(timetable);
    score += coverageBonus;

    return score;
  }

  private detectConflicts(timetable: Timetable): TimetableConflict[] {
    const conflicts: TimetableConflict[] = [];
    const entries = timetable.entries;

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const entry1 = entries[i];
        const entry2 = entries[j];

        // Check for time overlap
        if (entry1.dayOfWeek === entry2.dayOfWeek && this.timeOverlaps(entry1, entry2)) {
          // Faculty conflict
          if (entry1.facultyId === entry2.facultyId) {
            conflicts.push({
              type: 'faculty',
              severity: 'critical',
              description: `Faculty ${entry1.facultyId} has conflicting schedules`,
              affectedEntries: [i, j],
              suggestions: ['Assign different faculty', 'Change time slot']
            });
          }

          // Room conflict
          if (entry1.roomId === entry2.roomId) {
            conflicts.push({
              type: 'room',
              severity: 'critical',
              description: `Room ${entry1.roomId} is double-booked`,
              affectedEntries: [i, j],
              suggestions: ['Assign different room', 'Change time slot']
            });
          }
        }
      }
    }

    return conflicts;
  }

  private timeOverlaps(entry1: TimetableEntry, entry2: TimetableEntry): boolean {
    const start1 = this.timeToMinutes(entry1.startTime);
    const end1 = this.timeToMinutes(entry1.endTime);
    const start2 = this.timeToMinutes(entry2.startTime);
    const end2 = this.timeToMinutes(entry2.endTime);

    return !(end1 <= start2 || start1 >= end2);
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private evaluateFacultyPreferences(timetable: Timetable): number {
    let score = 0;
    
    for (const entry of timetable.entries) {
      const facultyPref = this.facultyPreferences.find(fp => 
        fp.facultyId === entry.facultyId &&
        fp.academicYear === timetable.academicYear &&
        fp.semester === timetable.semester
      );

      if (facultyPref) {
        // Check time preferences
        const timeMatch = facultyPref.timePreferences.find(tp =>
          tp.dayOfWeek === entry.dayOfWeek &&
          this.timeInRange(entry.startTime, tp.startTime, tp.endTime)
        );
        
        if (timeMatch) {
          switch (timeMatch.preference) {
            case 'preferred': score += 10; break;
            case 'available': score += 5; break;
            case 'avoid': score -= 15; break;
          }
        }

        // Check course preferences
        const courseMatch = facultyPref.preferredCourses.find(cp => cp.courseId === entry.courseId);
        if (courseMatch) {
          switch (courseMatch.preference) {
            case 'high': score += 15; break;
            case 'medium': score += 8; break;
            case 'low': score += 3; break;
          }
        }
      }
    }

    return score;
  }

  private timeInRange(timeToCheck: string, startTime: string, endTime: string): boolean {
    const check = this.timeToMinutes(timeToCheck);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    return check >= start && check <= end;
  }

  private evaluateWorkloadBalance(timetable: Timetable): number {
    const facultyWorkload = new Map<string, number>();
    
    for (const entry of timetable.entries) {
      const current = facultyWorkload.get(entry.facultyId) || 0;
      facultyWorkload.set(entry.facultyId, current + 1);
    }

    const workloads = Array.from(facultyWorkload.values());
    if (workloads.length === 0) return 0;

    const mean = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
    const variance = workloads.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / workloads.length;
    
    // Lower variance is better (more balanced)
    return Math.max(0, 50 - variance * 2);
  }

  private evaluateTimeDistribution(timetable: Timetable): number {
    let score = 0;
    
    // Prefer morning slots
    for (const entry of timetable.entries) {
      const startHour = parseInt(entry.startTime.split(':')[0]);
      if (startHour >= 9 && startHour <= 11) {
        score += 5; // Morning preference
      } else if (startHour >= 14 && startHour <= 16) {
        score += 2; // Afternoon acceptable
      }
    }

    return score;
  }

  private evaluateRoomUtilization(timetable: Timetable): number {
    const roomUsage = new Map<string, number>();
    
    for (const entry of timetable.entries) {
      const current = roomUsage.get(entry.roomId) || 0;
      roomUsage.set(entry.roomId, current + 1);
    }

    // Prefer balanced room utilization
    const usages = Array.from(roomUsage.values());
    const mean = usages.reduce((sum, u) => sum + u, 0) / usages.length;
    const variance = usages.reduce((sum, u) => sum + Math.pow(u - mean, 2), 0) / usages.length;
    
    return Math.max(0, 20 - variance);
  }

  private evaluateCourseCoverage(timetable: Timetable): number {
    const requiredCourses = this.courseOfferings
      .filter(co => co.batchId === timetable.batchId)
      .map(co => co.courseId);
    
    const coveredCourses = new Set(timetable.entries.map(e => e.courseId));
    const coverageRatio = coveredCourses.size / requiredCourses.length;
    
    return coverageRatio * 100; // Bonus for good coverage
  }

  private tournamentSelection(population: Timetable[], fitnessScores: number[]): Timetable {
    const tournamentSize = 3;
    let bestIndex = Math.floor(Math.random() * population.length);
    let bestScore = fitnessScores[bestIndex];

    for (let i = 1; i < tournamentSize; i++) {
      const candidateIndex = Math.floor(Math.random() * population.length);
      if (fitnessScores[candidateIndex] > bestScore) {
        bestIndex = candidateIndex;
        bestScore = fitnessScores[candidateIndex];
      }
    }

    return population[bestIndex];
  }

  private crossover(parent1: Timetable, parent2: Timetable): [Timetable, Timetable] {
    const offspring1 = JSON.parse(JSON.stringify(parent1));
    const offspring2 = JSON.parse(JSON.stringify(parent2));

    // Single-point crossover on entries
    const crossoverPoint = Math.floor(Math.random() * Math.min(parent1.entries.length, parent2.entries.length));
    
    offspring1.entries = [
      ...parent1.entries.slice(0, crossoverPoint),
      ...parent2.entries.slice(crossoverPoint)
    ];
    
    offspring2.entries = [
      ...parent2.entries.slice(0, crossoverPoint),
      ...parent1.entries.slice(crossoverPoint)
    ];

    return [offspring1, offspring2];
  }

  private mutate(timetable: Timetable): Timetable {
    const mutated = JSON.parse(JSON.stringify(timetable));
    
    if (mutated.entries.length === 0) return mutated;

    // Random mutation strategies
    const mutationStrategies = [
      () => this.mutateTime(mutated),
      () => this.mutateFaculty(mutated),
      () => this.mutateRoom(mutated),
      () => this.mutateDay(mutated)
    ];

    const strategy = mutationStrategies[Math.floor(Math.random() * mutationStrategies.length)];
    strategy();

    return mutated;
  }

  private mutateTime(timetable: Timetable): void {
    const entryIndex = Math.floor(Math.random() * timetable.entries.length);
    const newTimeSlot = this.timeSlots[Math.floor(Math.random() * this.timeSlots.length)];
    
    timetable.entries[entryIndex].startTime = newTimeSlot.startTime;
    timetable.entries[entryIndex].endTime = newTimeSlot.endTime;
  }

  private mutateFaculty(timetable: Timetable): void {
    const entryIndex = Math.floor(Math.random() * timetable.entries.length);
    const entry = timetable.entries[entryIndex];
    
    const courseOffering = this.courseOfferings.find(co => co.id === entry.courseOfferingId);
    if (courseOffering && courseOffering.facultyIds.length > 1) {
      const availableFaculties = courseOffering.facultyIds.filter(id => id !== entry.facultyId);
      if (availableFaculties.length > 0) {
        entry.facultyId = availableFaculties[Math.floor(Math.random() * availableFaculties.length)];
      }
    }
  }

  private mutateRoom(timetable: Timetable): void {
    const entryIndex = Math.floor(Math.random() * timetable.entries.length);
    const entry = timetable.entries[entryIndex];
    
    const courseOffering = this.courseOfferings.find(co => co.id === entry.courseOfferingId);
    if (courseOffering && courseOffering.roomIds && courseOffering.roomIds.length > 1) {
      const availableRooms = courseOffering.roomIds.filter(id => id !== entry.roomId);
      if (availableRooms.length > 0) {
        entry.roomId = availableRooms[Math.floor(Math.random() * availableRooms.length)];
      }
    }
  }

  private mutateDay(timetable: Timetable): void {
    const entryIndex = Math.floor(Math.random() * timetable.entries.length);
    const newDay = this.workingDays[Math.floor(Math.random() * this.workingDays.length)];
    
    timetable.entries[entryIndex].dayOfWeek = newDay;
  }

  private generateRecommendations(conflicts: TimetableConflict[], score: number): string[] {
    const recommendations: string[] = [];

    if (score < 0) {
      recommendations.push("Consider relaxing some constraints to improve optimization results");
    }

    if (conflicts.length > 0) {
      const criticalCount = conflicts.filter(c => c.severity === 'critical').length;
      if (criticalCount > 0) {
        recommendations.push(`${criticalCount} critical conflicts detected. Manual intervention required.`);
      }
      
      const facultyConflicts = conflicts.filter(c => c.type === 'faculty').length;
      if (facultyConflicts > 5) {
        recommendations.push("High number of faculty conflicts. Consider hiring additional faculty or adjusting course offerings.");
      }

      const roomConflicts = conflicts.filter(c => c.type === 'room').length;
      if (roomConflicts > 5) {
        recommendations.push("High number of room conflicts. Consider securing additional classroom space.");
      }
    }

    if (score > 80) {
      recommendations.push("Optimization successful! The generated timetable meets most constraints and preferences.");
    } else if (score > 50) {
      recommendations.push("Good optimization result with minor conflicts. Consider manual adjustments for improvement.");
    } else {
      recommendations.push("Optimization result needs improvement. Consider adjusting constraints or input data.");
    }

    return recommendations;
  }
}