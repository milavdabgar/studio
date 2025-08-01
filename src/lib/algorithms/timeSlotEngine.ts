/**
 * Advanced Time Slot Management Engine - Phase 3
 * 
 * Provides sophisticated time slot management for timetable generation:
 * - Flexible time slot configuration
 * - Break and lunch management
 * - Time constraint validation  
 * - Optimal time distribution
 * - Faculty availability tracking
 */

import type {
  DayOfWeek,
  FacultyPreference,
  TimetableEntry,
  Timestamp
} from '@/types/entities';

export interface TimeSlot {
  id: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  duration: number;  // minutes
  type: 'lecture' | 'break' | 'lunch' | 'lab' | 'tutorial' | 'practical';
  isBookable: boolean;
  isCore: boolean; // Core academic hours
  priority: number; // 1-10, higher is better
}

export interface TimeSlotConfiguration {
  workingDays: DayOfWeek[];
  timeSlots: TimeSlot[];
  breaks: BreakSlot[];
  constraints: TimeConstraints;
  preferences: TimePreferences;
}

export interface BreakSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  type: 'short_break' | 'lunch_break' | 'tea_break';
  mandatory: boolean;
  affectedDays: DayOfWeek[];
}

export interface TimeConstraints {
  minGapBetweenClasses: number; // minutes
  maxConsecutiveHours: number;
  maxDailyHours: number;
  minLunchBreak: number; // minutes
  noClassBefore: string; // HH:MM
  noClassAfter: string;  // HH:MM
  preferredSlotTypes: ('morning' | 'afternoon' | 'evening')[];
}

export interface TimePreferences {
  preferMorningSlots: boolean;
  avoidLateEvening: boolean;
  maximizeCompactness: boolean;
  respectBreakTimes: boolean;
  allowBackToBackClasses: boolean;
}

export interface TimeSlotAvailability {
  dayOfWeek: DayOfWeek;
  timeSlot: TimeSlot;
  isAvailable: boolean;
  conflictReasons: string[];
  facultyAvailability: Map<string, boolean>; // facultyId -> available
  roomAvailability: Map<string, boolean>;    // roomId -> available
  utilizationScore: number; // 0-100
}

export interface OptimalTimeSlotResult {
  success: boolean;
  timeSlot?: TimeSlot;
  dayOfWeek?: DayOfWeek;
  score: number;
  alternatives: Array<{
    timeSlot: TimeSlot;
    dayOfWeek: DayOfWeek;
    score: number;
    reasons: string[];
  }>;
  conflicts: string[];
  recommendations: string[];
}

export interface WeeklyScheduleAnalysis {
  totalSlots: number;
  utilizationRate: number;
  peakHours: string[];
  underutilizedSlots: string[];
  breakCompliance: number;
  facultyWorkloadDistribution: Map<string, number>;
  recommendations: {
    efficiency: string[];
    balance: string[];
    quality: string[];
  };
}

export class TimeSlotEngine {
  private config: TimeSlotConfiguration;
  private occupiedSlots: Map<string, TimetableEntry[]> = new Map(); // key: day_time -> entries
  private facultyPreferences: FacultyPreference[] = [];

  constructor(
    config: TimeSlotConfiguration,
    facultyPreferences: FacultyPreference[] = []
  ) {
    this.config = config;
    this.facultyPreferences = facultyPreferences;
    this.initializeSlotTracking();
  }

  /**
   * Find optimal time slot for a course
   */
  async findOptimalTimeSlot(
    facultyId: string,
    duration: number, // minutes
    preferredDays?: DayOfWeek[],
    requiredFacilities?: string[],
    excludeSlots?: Array<{ day: DayOfWeek; time: string }>
  ): Promise<OptimalTimeSlotResult> {
    try {
      const candidates = this.generateTimeSlotCandidates(
        facultyId,
        duration,
        preferredDays,
        excludeSlots
      );

      if (candidates.length === 0) {
        return {
          success: false,
          score: 0,
          alternatives: [],
          conflicts: ['No available time slots found'],
          recommendations: [
            'Consider extending working hours',
            'Review faculty availability constraints',
            'Check for scheduling conflicts'
          ]
        };
      }

      // Score and rank candidates
      const scoredCandidates = await Promise.all(
        candidates.map(candidate => this.scoreTimeSlotCandidate(candidate, facultyId, duration))
      );

      // Sort by score (highest first) 
      scoredCandidates.sort((a, b) => b.score - a.score);

      const bestCandidate = scoredCandidates[0];
      const alternatives = scoredCandidates.slice(1, 4).map(sc => ({
        timeSlot: sc.timeSlot,
        dayOfWeek: sc.dayOfWeek,
        score: sc.score,
        reasons: sc.reasons
      }));

      return {
        success: true,
        timeSlot: bestCandidate.timeSlot,
        dayOfWeek: bestCandidate.dayOfWeek,
        score: bestCandidate.score,
        alternatives,
        conflicts: bestCandidate.conflicts,
        recommendations: bestCandidate.recommendations
      };

    } catch (error) {
      return {
        success: false,
        score: 0,
        alternatives: [],
        conflicts: [`Time slot selection failed: ${(error as Error).message}`],
        recommendations: ['Contact system administrator']
      };
    }
  }

  /**
   * Bulk time slot allocation for multiple entries
   */
  async allocateTimeSlots(
    requests: Array<{
      id: string;
      facultyId: string;
      duration: number;
      priority: number;
      preferredDays?: DayOfWeek[];
      constraints?: string[];
    }>
  ): Promise<{
    success: boolean;
    allocations: Map<string, { day: DayOfWeek; timeSlot: TimeSlot }>;
    conflicts: Array<{ requestId: string; conflicts: string[] }>;
    utilization: WeeklyScheduleAnalysis;
  }> {
    const allocations = new Map<string, { day: DayOfWeek; timeSlot: TimeSlot }>();
    const conflicts: Array<{ requestId: string; conflicts: string[] }> = [];

    // Sort requests by priority (higher first)
    const sortedRequests = [...requests].sort((a, b) => b.priority - a.priority);

    for (const request of sortedRequests) {
      const result = await this.findOptimalTimeSlot(
        request.facultyId,
        request.duration,
        request.preferredDays
      );

      if (result.success && result.timeSlot && result.dayOfWeek) {
        allocations.set(request.id, {
          day: result.dayOfWeek,
          timeSlot: result.timeSlot
        });

                // Mark slot as occupied
        this.markSlotAsOccupied(result.dayOfWeek, result.timeSlot, {
          facultyId: request.facultyId,
          courseOfferingId: request.id,
          courseId: '',
          dayOfWeek: result.dayOfWeek,
          startTime: result.timeSlot.startTime,
          endTime: result.timeSlot.endTime,
          roomId: '',
          entryType: 'lecture'
        });
      } else {
        conflicts.push({
          requestId: request.id,
          conflicts: result.conflicts
        });
      }
    }

    const utilization = await this.analyzeWeeklySchedule();

    return {
      success: conflicts.length === 0,
      allocations,
      conflicts,
      utilization
    };
  }

  /**
   * Validate time slot availability
   */
  validateTimeSlotAvailability(
    dayOfWeek: DayOfWeek,
    timeSlot: TimeSlot,
    facultyIds: string[],
    roomIds: string[] = []
  ): TimeSlotAvailability {
    const conflicts: string[] = [];
    const facultyAvailability = new Map<string, boolean>();
    const roomAvailability = new Map<string, boolean>();

    // Check if slot is bookable
    if (!timeSlot.isBookable) {
      conflicts.push('Time slot is not bookable');
    }

    // Check break conflicts
    if (this.conflictsWithBreaks(timeSlot)) {
      conflicts.push('Time slot conflicts with mandatory break');
    }

    // Check faculty availability
    for (const facultyId of facultyIds) {
      const isAvailable = this.isFacultyAvailable(facultyId, dayOfWeek, timeSlot);
      facultyAvailability.set(facultyId, isAvailable);
      
      if (!isAvailable) {
        conflicts.push(`Faculty ${facultyId} is not available`);
      }
    }

    // Check existing occupancy
    const slotKey = `${dayOfWeek}_${timeSlot.startTime}`;
    const existingEntries = this.occupiedSlots.get(slotKey) || [];
    
    if (existingEntries.length > 0) {
      conflicts.push(`Time slot already has ${existingEntries.length} booking(s)`);
    }

    // Calculate utilization score
    const utilizationScore = this.calculateSlotUtilizationScore(dayOfWeek, timeSlot);

    return {
      dayOfWeek,
      timeSlot,
      isAvailable: conflicts.length === 0,
      conflictReasons: conflicts,
      facultyAvailability,
      roomAvailability,
      utilizationScore
    };
  }

  /**
   * Get optimal time distribution for weekly schedule
   */
  getOptimalTimeDistribution(
    totalHours: number,
    facultyId?: string
  ): {
    distribution: Map<DayOfWeek, number>; // day -> hours
    timeSlots: Map<DayOfWeek, TimeSlot[]>;
    efficiency: number;
    compactness: number;
    recommendations: string[];
  } {
    const distribution = new Map<DayOfWeek, number>();
    const timeSlots = new Map<DayOfWeek, TimeSlot[]>();
    const recommendations: string[] = [];

    // Get faculty preferences if available
    const facultyPref = facultyId ? 
      this.facultyPreferences.find(fp => fp.facultyId === facultyId) : null;

    const workingDays = facultyPref?.workingDays || this.config.workingDays;
    const dailyAverage = totalHours / workingDays.length;

    // Distribute hours optimally
    for (const day of workingDays) {
      const dayHours = Math.min(dailyAverage, this.config.constraints.maxDailyHours);
      distribution.set(day, dayHours);

      // Select optimal time slots for this day
      const daySlots = this.selectOptimalSlotsForDay(day, dayHours, facultyId);
      timeSlots.set(day, daySlots);
    }

    // Calculate efficiency and compactness
    const efficiency = this.calculateDistributionEfficiency(distribution, timeSlots);
    const compactness = this.calculateScheduleCompactness(timeSlots);

    // Generate recommendations
    if (efficiency < 0.7) {
      recommendations.push('Consider redistributing hours for better efficiency');
    }
    
    if (compactness < 0.6) {
      recommendations.push('Schedule can be made more compact to reduce gaps');
    }

    const underutilizedDays = Array.from(distribution.entries())
      .filter(([_, hours]) => hours < dailyAverage * 0.7)
      .map(([day]) => day);

    if (underutilizedDays.length > 0) {
      recommendations.push(`Consider utilizing ${underutilizedDays.join(', ')} more effectively`);
    }

    return {
      distribution,
      timeSlots,
      efficiency,
      compactness,
      recommendations
    };
  }

  /**
   * Generate time slot candidates
   */
  private generateTimeSlotCandidates(
    facultyId: string,
    duration: number,
    preferredDays?: DayOfWeek[],
    excludeSlots?: Array<{ day: DayOfWeek; time: string }>
  ): Array<{ dayOfWeek: DayOfWeek; timeSlot: TimeSlot }> {
    const candidates: Array<{ dayOfWeek: DayOfWeek; timeSlot: TimeSlot }> = [];
    const targetDays = preferredDays || this.config.workingDays;

    for (const day of targetDays) {
      for (const slot of this.config.timeSlots) {
        // Skip non-bookable slots
        if (!slot.isBookable) continue;
        
        // Skip if duration doesn't fit
        if (slot.duration < duration) continue;

        // Skip excluded slots
        if (excludeSlots?.some(ex => ex.day === day && ex.time === slot.startTime)) {
          continue;
        }

        // Check basic availability
        const availability = this.validateTimeSlotAvailability(day, slot, [facultyId]);
        if (availability.isAvailable) {
          candidates.push({ dayOfWeek: day, timeSlot: slot });
        }
      }
    }

    return candidates;
  }

  /**
   * Score a time slot candidate
   */
  private async scoreTimeSlotCandidate(
    candidate: { dayOfWeek: DayOfWeek; timeSlot: TimeSlot },
    facultyId: string,
    duration: number
  ): Promise<{
    dayOfWeek: DayOfWeek;
    timeSlot: TimeSlot;
    score: number;
    reasons: string[];
    conflicts: string[];
    recommendations: string[];
  }> {
    let score = 0;
    const reasons: string[] = [];
    const conflicts: string[] = [];
    const recommendations: string[] = [];

    // Base score from slot priority
    score += candidate.timeSlot.priority * 10;
    reasons.push(`Base priority: ${candidate.timeSlot.priority}`);

    // Faculty preference scoring
    const facultyPref = this.facultyPreferences.find(fp => fp.facultyId === facultyId);
    if (facultyPref) {
      const timeMatch = facultyPref.timePreferences.find(tp =>
        tp.dayOfWeek === candidate.dayOfWeek &&
        this.timeOverlaps(candidate.timeSlot.startTime, candidate.timeSlot.endTime, tp.startTime, tp.endTime)
      );

      if (timeMatch) {
        switch (timeMatch.preference) {
          case 'preferred':
            score += 50;
            reasons.push('Matches faculty preferred time');
            break;
          case 'available':
            score += 20;
            reasons.push('Faculty is available at this time');
            break;
          case 'avoid':
            score -= 30;
            conflicts.push('Faculty prefers to avoid this time');
            break;
        }
      }
    }

    // Time slot type preferences
    if (this.config.preferences.preferMorningSlots && this.isMorningSlot(candidate.timeSlot)) {
      score += 25;
      reasons.push('Morning slot preference');
    }

    // Core hours bonus
    if (candidate.timeSlot.isCore) {
      score += 15;
      reasons.push('Core academic hours');
    }

    // Utilization scoring
    const utilizationScore = this.calculateSlotUtilizationScore(candidate.dayOfWeek, candidate.timeSlot);
    score += utilizationScore * 0.3;
    reasons.push(`Utilization score: ${utilizationScore.toFixed(1)}`);

    // Break compliance
    if (this.hasAdequateBreaks(candidate.dayOfWeek, candidate.timeSlot)) {
      score += 10;
      reasons.push('Adequate break time available');
    } else {
      score -= 10;
      conflicts.push('May not have adequate break time');
    }

    // Compactness bonus (if there are adjacent classes)
    const compactnessBonus = this.calculateCompactnessBonus(candidate.dayOfWeek, candidate.timeSlot, facultyId);
    score += compactnessBonus;
    if (compactnessBonus > 0) {
      reasons.push(`Schedule compactness bonus: ${compactnessBonus}`);
    }

    // Generate recommendations
    if (score < 50) {
      recommendations.push('Consider alternative time slots for better fit');
    }
    
    if (conflicts.length > 0) {
      recommendations.push('Address conflicts before finalizing this slot');
    }

    return {
      dayOfWeek: candidate.dayOfWeek,
      timeSlot: candidate.timeSlot,
      score: Math.max(0, score),
      reasons,
      conflicts,
      recommendations
    };
  }

  /**
   * Initialize slot tracking
   */
  private initializeSlotTracking(): void {
    this.occupiedSlots.clear();
    
    for (const day of this.config.workingDays) {
      for (const slot of this.config.timeSlots) {
        const key = `${day}_${slot.startTime}`;
        this.occupiedSlots.set(key, []);
      }
    }
  }

  /**
   * Mark slot as occupied
   */
  private markSlotAsOccupied(day: DayOfWeek, timeSlot: TimeSlot, entry: TimetableEntry): void {
    const key = `${day}_${timeSlot.startTime}`;
    const entries = this.occupiedSlots.get(key) || [];
    entries.push(entry);
    this.occupiedSlots.set(key, entries);
  }

  /**
   * Check if faculty is available at specific time
   */
  private isFacultyAvailable(facultyId: string, day: DayOfWeek, timeSlot: TimeSlot): boolean {
    const facultyPref = this.facultyPreferences.find(fp => fp.facultyId === facultyId);
    
    if (!facultyPref) return true; // No preference data means available

    // Check working days
    if (!facultyPref.workingDays.includes(day)) return false;

    // Check unavailable slots
    const isUnavailable = facultyPref.unavailableSlots.some(unavailable =>
      unavailable.dayOfWeek === day &&
      this.timeOverlaps(timeSlot.startTime, timeSlot.endTime, unavailable.startTime, unavailable.endTime)
    );

    return !isUnavailable;
  }

  /**
   * Check if time slot conflicts with breaks
   */
  private conflictsWithBreaks(timeSlot: TimeSlot): boolean {
    return this.config.breaks.some(breakSlot =>
      breakSlot.mandatory &&
      this.timeOverlaps(timeSlot.startTime, timeSlot.endTime, breakSlot.startTime, breakSlot.endTime)
    );
  }

  /**
   * Calculate slot utilization score
   */
  private calculateSlotUtilizationScore(day: DayOfWeek, timeSlot: TimeSlot): number {
    const key = `${day}_${timeSlot.startTime}`;
    const occupancy = this.occupiedSlots.get(key)?.length || 0;
    
    // Lower occupancy = higher score (prefer less utilized slots)
    return Math.max(0, 100 - occupancy * 20);
  }

  /**
   * Check if slot is in morning
   */
  private isMorningSlot(timeSlot: TimeSlot): boolean {
    const hour = parseInt(timeSlot.startTime.split(':')[0]);
    return hour >= 8 && hour < 12;
  }

  /**
   * Check if there are adequate breaks around the slot
   */
  private hasAdequateBreaks(day: DayOfWeek, timeSlot: TimeSlot): boolean {
    const slotStart = this.timeToMinutes(timeSlot.startTime);
    const slotEnd = this.timeToMinutes(timeSlot.endTime);

    // Check for breaks within 2 hours before or after
    return this.config.breaks.some(breakSlot => {
      if (!breakSlot.affectedDays.includes(day)) return false;
      
      const breakStart = this.timeToMinutes(breakSlot.startTime);
      const breakEnd = this.timeToMinutes(breakSlot.endTime);
      
      // Break is within 2 hours of the slot
      const twoHours = 120; // minutes
      return (breakStart >= slotEnd && breakStart <= slotEnd + twoHours) ||
             (breakEnd <= slotStart && breakEnd >= slotStart - twoHours);
    });
  }

  /**
   * Calculate compactness bonus for adjacent classes
   */
  private calculateCompactnessBonus(day: DayOfWeek, timeSlot: TimeSlot, facultyId: string): number {
    // Find adjacent slots for the same faculty
    const slotStart = this.timeToMinutes(timeSlot.startTime);
    const slotEnd = this.timeToMinutes(timeSlot.endTime);
    
    let bonus = 0;
    
    // Check for classes immediately before or after
    for (const [key, entries] of this.occupiedSlots) {
      if (!key.startsWith(day)) continue;
      
      for (const entry of entries) {
        if (entry.facultyId !== facultyId) continue;
        
        const entryStart = this.timeToMinutes(entry.startTime);
        const entryEnd = this.timeToMinutes(entry.endTime);
        
        // Adjacent classes (within 15 minutes)
        if (Math.abs(entryEnd - slotStart) <= 15 || Math.abs(slotEnd - entryStart) <= 15) {
          bonus += 15;
        }
      }
    }
    
    return Math.min(30, bonus); // Cap at 30 points
  }

  /**
   * Select optimal slots for a specific day
   */
  private selectOptimalSlotsForDay(
    day: DayOfWeek, 
    targetHours: number, 
    facultyId?: string
  ): TimeSlot[] {
    const availableSlots = this.config.timeSlots
      .filter(slot => slot.isBookable)
      .filter(slot => !facultyId || this.isFacultyAvailable(facultyId, day, slot));

    // Sort by priority and preference
    const sortedSlots = availableSlots.sort((a, b) => {
      let scoreA = a.priority;
      let scoreB = b.priority;
      
      // Morning preference
      if (this.config.preferences.preferMorningSlots) {
        if (this.isMorningSlot(a)) scoreA += 5;
        if (this.isMorningSlot(b)) scoreB += 5;
      }
      
      return scoreB - scoreA;
    });

    // Select slots to meet target hours
    const selectedSlots: TimeSlot[] = [];
    let totalMinutes = 0;
    const targetMinutes = targetHours * 60;

    for (const slot of sortedSlots) {
      if (totalMinutes >= targetMinutes) break;
      
      selectedSlots.push(slot);
      totalMinutes += slot.duration;
    }

    return selectedSlots;
  }

  /**
   * Calculate distribution efficiency
   */
  private calculateDistributionEfficiency(
    distribution: Map<DayOfWeek, number>,
    timeSlots: Map<DayOfWeek, TimeSlot[]>
  ): number {
    let totalEfficiency = 0;
    let dayCount = 0;

    for (const [day, hours] of distribution) {
      const slots = timeSlots.get(day) || [];
      const slotMinutes = slots.reduce((sum, slot) => sum + slot.duration, 0);
      const targetMinutes = hours * 60;
      
      const efficiency = targetMinutes > 0 ? Math.min(1, slotMinutes / targetMinutes) : 1;
      totalEfficiency += efficiency;
      dayCount++;
    }

    return dayCount > 0 ? totalEfficiency / dayCount : 0;
  }

  /**
   * Calculate schedule compactness
   */
  private calculateScheduleCompactness(timeSlots: Map<DayOfWeek, TimeSlot[]>): number {
    let totalCompactness = 0;
    let dayCount = 0;

    for (const [day, slots] of timeSlots) {
      if (slots.length <= 1) {
        totalCompactness += 1; // Single slot is perfectly compact
        dayCount++;
        continue;
      }

      // Calculate gaps between slots
      const sortedSlots = [...slots].sort((a, b) => 
        this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
      );

      let totalGap = 0;
      for (let i = 1; i < sortedSlots.length; i++) {
        const prevEnd = this.timeToMinutes(sortedSlots[i-1].endTime);
        const currentStart = this.timeToMinutes(sortedSlots[i].startTime);
        totalGap += Math.max(0, currentStart - prevEnd);
      }

      // Convert to compactness score (less gap = higher score)
      const maxPossibleGap = 8 * 60; // 8 hours in minutes
      const compactness = Math.max(0, 1 - totalGap / maxPossibleGap);
      
      totalCompactness += compactness;
      dayCount++;
    }

    return dayCount > 0 ? totalCompactness / dayCount : 1;
  }

  /**
   * Analyze weekly schedule
   */
  private async analyzeWeeklySchedule(): Promise<WeeklyScheduleAnalysis> {
    const totalSlots = this.config.workingDays.length * this.config.timeSlots.length;
    let occupiedSlots = 0;
    const facultyWorkload = new Map<string, number>();
    const slotUsage = new Map<string, number>();

    // Analyze occupancy
    for (const [key, entries] of this.occupiedSlots) {
      if (entries.length > 0) {
        occupiedSlots++;
        
        for (const entry of entries) {
          const current = facultyWorkload.get(entry.facultyId) || 0;
          facultyWorkload.set(entry.facultyId, current + 1);
        }

        const timeSlot = key.split('_')[1];
        const current = slotUsage.get(timeSlot) || 0;
        slotUsage.set(timeSlot, current + 1);
      }
    }

    const utilizationRate = totalSlots > 0 ? occupiedSlots / totalSlots : 0;

    // Find peak and underutilized hours
    const peakHours = Array.from(slotUsage.entries())
      .filter(([_, usage]) => usage >= 3)
      .map(([time]) => time);

    const underutilizedSlots = Array.from(slotUsage.entries())
      .filter(([_, usage]) => usage === 0)
      .map(([time]) => time);

    // Check break compliance
    const breakCompliance = this.calculateBreakCompliance();

    return {
      totalSlots,
      utilizationRate,
      peakHours,
      underutilizedSlots,
      breakCompliance,
      facultyWorkloadDistribution: facultyWorkload,
      recommendations: {
        efficiency: this.generateEfficiencyRecommendations(utilizationRate, peakHours),
        balance: this.generateBalanceRecommendations(facultyWorkload),
        quality: this.generateQualityRecommendations(breakCompliance, underutilizedSlots)
      }
    };
  }

  /**
   * Utility methods
   */
  private timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);

    return !(e1 <= s2 || s1 >= e2);
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private calculateBreakCompliance(): number {
    // Calculate how well the schedule respects break times
    let compliance = 100;
    
    for (const breakSlot of this.config.breaks) {
      if (!breakSlot.mandatory) continue;
      
      for (const day of breakSlot.affectedDays) {
        const key = `${day}_${breakSlot.startTime}`;
        const entries = this.occupiedSlots.get(key) || [];
        
        if (entries.length > 0) {
          compliance -= 20; // Penalty for break violations
        }
      }
    }
    
    return Math.max(0, compliance);
  }

  private generateEfficiencyRecommendations(utilizationRate: number, peakHours: string[]): string[] {
    const recommendations: string[] = [];
    
    if (utilizationRate < 0.5) {
      recommendations.push('Low utilization detected. Consider consolidating schedules.');
    }
    
    if (utilizationRate > 0.9) {
      recommendations.push('High utilization. Consider adding more time slots or resources.');
    }
    
    if (peakHours.length > 3) {
      recommendations.push(`Peak hours (${peakHours.join(', ')}) are heavily utilized. Consider redistribution.`);
    }
    
    return recommendations;
  }

  private generateBalanceRecommendations(facultyWorkload: Map<string, number>): string[] {
    const recommendations: string[] = [];
    const workloads = Array.from(facultyWorkload.values());
    
    if (workloads.length === 0) return recommendations;
    
    const mean = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
    const max = Math.max(...workloads);
    const min = Math.min(...workloads);
    
    if (max - min > mean) {
      recommendations.push('Uneven faculty workload distribution detected. Consider rebalancing.');
    }
    
    const overloaded = Array.from(facultyWorkload.entries())
      .filter(([_, load]) => load > mean * 1.5)
      .map(([id]) => id);
    
    if (overloaded.length > 0) {
      recommendations.push(`Faculty ${overloaded.join(', ')} appear overloaded.`);
    }
    
    return recommendations;
  }

  private generateQualityRecommendations(breakCompliance: number, underutilizedSlots: string[]): string[] {
    const recommendations: string[] = [];
    
    if (breakCompliance < 80) {
      recommendations.push('Break time compliance is low. Review schedule for adequate breaks.');
    }
    
    if (underutilizedSlots.length > 5) {
      recommendations.push(`Many underutilized slots (${underutilizedSlots.length}). Consider schedule optimization.`);
    }
    
    return recommendations;
  }
}

/**
 * Default time slot configuration for GTU diploma engineering
 */
export const DEFAULT_GTU_TIME_CONFIGURATION: TimeSlotConfiguration = {
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  timeSlots: [
    {
      id: 'slot_08_09',
      startTime: '08:00',
      endTime: '09:00',
      duration: 60,
      type: 'lecture',
      isBookable: true,
      isCore: true,
      priority: 8
    },
    {
      id: 'slot_09_10',
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      type: 'lecture',
      isBookable: true,
      isCore: true,
      priority: 9
    },
    {
      id: 'slot_10_11',
      startTime: '10:00',
      endTime: '11:00',
      duration: 60,
      type: 'lecture',
      isBookable: true,
      isCore: true,
      priority: 10
    },
    {
      id: 'slot_11_12',
      startTime: '11:00',
      endTime: '12:00',
      duration: 60,
      type: 'lecture',
      isBookable: true,
      isCore: true,
      priority: 9
    },
    {
      id: 'slot_12_13',
      startTime: '12:00',
      endTime: '13:00',
      duration: 60,
      type: 'lunch',
      isBookable: false,
      isCore: false,
      priority: 0
    },
    {
      id: 'slot_13_14',
      startTime: '13:00',
      endTime: '14:00',
      duration: 60,
      type: 'lecture',
      isBookable: true,
      isCore: true,
      priority: 7
    },
    {
      id: 'slot_14_15',
      startTime: '14:00',
      endTime: '15:00',
      duration: 60,
      type: 'lecture',
      isBookable: true,
      isCore: true,
      priority: 8
    },
    {
      id: 'slot_15_16',
      startTime: '15:00',
      endTime: '16:00',
      duration: 60,
      type: 'lecture',
      isBookable: true,
      isCore: false,
      priority: 6
    },
    {
      id: 'slot_16_17',
      startTime: '16:00',
      endTime: '17:00',
      duration: 60,
      type: 'lecture',
      isBookable: true,
      isCore: false,
      priority: 5
    }
  ],
  breaks: [
    {
      id: 'lunch_break',
      name: 'Lunch Break',
      startTime: '12:00',
      endTime: '13:00',
      type: 'lunch_break',
      mandatory: true,
      affectedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
  ],
  constraints: {
    minGapBetweenClasses: 0,
    maxConsecutiveHours: 4,
    maxDailyHours: 8,
    minLunchBreak: 60,
    noClassBefore: '08:00',
    noClassAfter: '17:00',
    preferredSlotTypes: ['morning', 'afternoon']
  },
  preferences: {
    preferMorningSlots: true,
    avoidLateEvening: true,
    maximizeCompactness: true,
    respectBreakTimes: true,
    allowBackToBackClasses: true
  }
};

/**
 * Factory function to create time slot engine
 */
export function createTimeSlotEngine(
  config?: Partial<TimeSlotConfiguration>,
  facultyPreferences?: FacultyPreference[]
): TimeSlotEngine {
  const fullConfig = {
    ...DEFAULT_GTU_TIME_CONFIGURATION,
    ...config,
    timeSlots: config?.timeSlots || DEFAULT_GTU_TIME_CONFIGURATION.timeSlots,
    breaks: config?.breaks || DEFAULT_GTU_TIME_CONFIGURATION.breaks
  };
  
  return new TimeSlotEngine(fullConfig, facultyPreferences);
}