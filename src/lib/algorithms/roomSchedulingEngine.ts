/**
 * Advanced Room Scheduling Engine - Phase 3
 * 
 * Provides intelligent room allocation for timetable generation with:
 * - Capacity-based allocation
 * - Resource requirement matching
 * - Room utilization optimization
 * - Conflict detection and resolution
 * - Equipment and facility matching
 */

import type { 
  Room, 
  RoomAllocation,
  RoomType,
  RoomStatus,
  CourseOffering,
  TimetableEntry,
  DayOfWeek,
  Timestamp,
  RoomAlert,
  RoomIssue,
  MaintenanceEntry
} from '@/types/entities';

export interface RoomRequirement {
  capacity: number;
  type: RoomType;
  requiredFacilities?: string[];
  preferredFacilities?: string[];
  accessibility?: boolean;
  allowPartialCapacity?: boolean;
  minCapacityUtilization?: number; // 0-1, minimum room utilization required
}

export interface RoomSuitabilityScore {
  roomId: string;
  score: number;
  breakdown: {
    capacityScore: number;
    typeMatch: number;
    facilityScore: number;
    utilizationScore: number;
    proximityScore: number;
    availabilityScore: number;
  };
  conflicts: string[];
  recommendations: string[];
}

export interface RoomSchedulingResult {
  success: boolean;
  allocatedRoom?: Room;
  score: number;
  conflicts: string[];
  alternatives: Room[];
  recommendations: string[];
}

export interface RoomUtilizationMetrics {
  roomId: string;
  utilizationRate: number; // 0-1
  hoursScheduled: number;
  hoursAvailable: number;
  peakTimeSlots: string[];
  underutilizedSlots: string[];
  maintenanceImpact: number;
  overallRating: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
}

export interface RoomSchedulingConfig {
  prioritizeCapacityMatch: boolean;
  allowOvercapacity: boolean;
  maxOvercapacityRatio: number; // Default 1.2 (20% over)
  preferUnderutilizedRooms: boolean;
  considerMaintenance: boolean;
  proximityWeight: number; // 0-1
  facilityMatchWeight: number; // 0-1
  utilizationWeight: number; // 0-1
}

export class RoomSchedulingEngine {
  private rooms: Room[] = [];
  private allocations: RoomAllocation[] = [];
  private maintenanceSchedule: MaintenanceEntry[] = [];
  private roomIssues: RoomIssue[] = [];
  private config: RoomSchedulingConfig;

  constructor(
    rooms: Room[],
    allocations: RoomAllocation[] = [],
    maintenanceSchedule: MaintenanceEntry[] = [],
    roomIssues: RoomIssue[] = [],
    config?: Partial<RoomSchedulingConfig>
  ) {
    this.rooms = rooms;
    this.allocations = allocations;
    this.maintenanceSchedule = maintenanceSchedule;
    this.roomIssues = roomIssues;
    this.config = {
      prioritizeCapacityMatch: true,
      allowOvercapacity: false,
      maxOvercapacityRatio: 1.2,
      preferUnderutilizedRooms: true,
      considerMaintenance: true,
      proximityWeight: 0.2,
      facilityMatchWeight: 0.3,
      utilizationWeight: 0.3,
      ...config
    };
  }

  /**
   * Find the best room for a specific time slot and requirements
   */
  async findOptimalRoom(
    requirement: RoomRequirement,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    academicYear: string,
    excludeRooms: string[] = []
  ): Promise<RoomSchedulingResult> {
    try {
      // Filter available rooms
      const availableRooms = this.getAvailableRooms(
        dayOfWeek, 
        startTime, 
        endTime, 
        academicYear,
        excludeRooms
      );

      if (availableRooms.length === 0) {
        return {
          success: false,
          score: 0,
          conflicts: ['No rooms available for the specified time slot'],
          alternatives: [],
          recommendations: [
            'Consider changing the time slot',
            'Check for rooms under maintenance that could be made available',
            'Consider splitting the class if capacity allows'
          ]
        };
      }

      // Score each available room
      const roomScores = await Promise.all(
        availableRooms.map(room => this.scoreRoom(room, requirement, dayOfWeek, startTime, endTime))
      );

      // Sort by score (highest first)
      roomScores.sort((a, b) => b.score - a.score);

      const bestRoom = roomScores[0];
      const allocatedRoom = this.rooms.find(r => r.id === bestRoom.roomId);

      if (!allocatedRoom) {
        throw new Error('Room not found after scoring');
      }

      // Get alternatives (top 3 excluding the best)
      const alternatives = roomScores
        .slice(1, 4)
        .map(rs => this.rooms.find(r => r.id === rs.roomId))
        .filter(Boolean) as Room[];

      return {
        success: true,
        allocatedRoom,
        score: bestRoom.score,
        conflicts: bestRoom.conflicts,
        alternatives,
        recommendations: bestRoom.recommendations
      };

    } catch (error) {
      return {
        success: false,
        score: 0,
        conflicts: [`Error in room scheduling: ${(error as Error).message}`],
        alternatives: [],
        recommendations: ['Please contact system administrator']
      };
    }
  }

  /**
   * Bulk room allocation for multiple course offerings
   */
  async allocateRoomsForCourses(
    courseOfferings: CourseOffering[],
    timetableEntries: TimetableEntry[],
    academicYear: string
  ): Promise<{
    success: boolean;
    allocations: Map<string, Room>;
    conflicts: Array<{ entryId: string; conflicts: string[] }>;
    utilizationMetrics: RoomUtilizationMetrics[];
  }> {
    const allocations = new Map<string, Room>();
    const conflicts: Array<{ entryId: string; conflicts: string[] }> = [];
    const usedRooms = new Set<string>();

    // Process entries sorted by priority (can be customized)
    const sortedEntries = [...timetableEntries].sort((a, b) => {
      // Prioritize by day and time for logical progression
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
      if (dayDiff !== 0) return dayDiff;
      
      return a.startTime.localeCompare(b.startTime);
    });

    for (const entry of sortedEntries) {
      const courseOffering = courseOfferings.find(co => co.id === entry.courseOfferingId);
      if (!courseOffering) continue;

      const requirement = this.createRoomRequirement(courseOffering, entry);
      const excludeRooms = Array.from(usedRooms); // Exclude rooms already used at this time

      const result = await this.findOptimalRoom(
        requirement,
        entry.dayOfWeek,
        entry.startTime,
        entry.endTime,
        academicYear,
        excludeRooms
      );

      if (result.success && result.allocatedRoom) {
        allocations.set(entry.courseOfferingId + '_' + entry.startTime, result.allocatedRoom);
        usedRooms.add(result.allocatedRoom.id);
      } else {
        conflicts.push({
          entryId: entry.courseOfferingId + '_' + entry.startTime,
          conflicts: result.conflicts
        });
      }
    }

    // Calculate utilization metrics
    const utilizationMetrics = await this.calculateUtilizationMetrics(academicYear);

    return {
      success: conflicts.length === 0,
      allocations,
      conflicts,
      utilizationMetrics
    };
  }

  /**
   * Get rooms available for a specific time slot
   */
  private getAvailableRooms(
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    academicYear: string,
    excludeRooms: string[] = []
  ): Room[] {
    return this.rooms.filter(room => {
      // Exclude specified rooms
      if (excludeRooms.includes(room.id)) return false;

      // Check room status
      if (room.status !== 'available' && room.status !== 'active') return false;

      // Check for conflicts with existing allocations
      if (this.hasRoomConflict(room.id, dayOfWeek, startTime, endTime)) return false;

      // Check maintenance schedule
      if (this.config.considerMaintenance && this.isRoomUnderMaintenance(room.id, dayOfWeek, startTime, endTime)) {
        return false;
      }

      // Check for critical issues
      const criticalIssues = this.roomIssues.filter(
        issue => issue.type === 'equipment' && 
        issue.severity === 'critical' && 
        issue.status === 'open'
      );
      if (criticalIssues.length > 0) return false;

      return true;
    });
  }

  /**
   * Score a room based on requirements and constraints
   */
  private async scoreRoom(
    room: Room,
    requirement: RoomRequirement,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string
  ): Promise<RoomSuitabilityScore> {
    let totalScore = 0;
    const breakdown = {
      capacityScore: 0,
      typeMatch: 0,
      facilityScore: 0,
      utilizationScore: 0,
      proximityScore: 0,
      availabilityScore: 0
    };
    const conflicts: string[] = [];
    const recommendations: string[] = [];

    // Capacity scoring (0-100)
    if (room.capacity) {
      const capacityRatio = requirement.capacity / room.capacity;
      
      if (capacityRatio <= 1) {
        // Room has sufficient capacity
        breakdown.capacityScore = Math.max(0, 100 - (1 - capacityRatio) * 50);
        if (capacityRatio < (requirement.minCapacityUtilization || 0.5)) {
          recommendations.push('Room may be underutilized - consider smaller room if available');
        }
      } else if (this.config.allowOvercapacity && capacityRatio <= this.config.maxOvercapacityRatio) {
        // Overcapacity but within limits
        breakdown.capacityScore = Math.max(0, 100 - (capacityRatio - 1) * 100);
        conflicts.push(`Room capacity (${room.capacity}) is less than required (${requirement.capacity})`);
        recommendations.push('Consider splitting the class or finding a larger room');
      } else {
        // Significantly overcapacity
        breakdown.capacityScore = 0;
        conflicts.push(`Room capacity (${room.capacity}) is insufficient for ${requirement.capacity} students`);
      }
    } else {
      // No capacity information
      breakdown.capacityScore = 50;
      recommendations.push('Room capacity information not available - verify manually');
    }

    // Type matching (0-100)
    if (room.type === requirement.type) {
      breakdown.typeMatch = 100;
    } else {
      breakdown.typeMatch = this.getTypeCompatibilityScore(room.type, requirement.type);
      if (breakdown.typeMatch < 50) {
        conflicts.push(`Room type (${room.type}) may not be suitable for ${requirement.type}`);
      }
    }

    // Facility scoring (0-100)
    if (requirement.requiredFacilities && requirement.requiredFacilities.length > 0) {
      const roomFacilities = room.facilities || [];
      const requiredMatches = requirement.requiredFacilities.filter(f => 
        roomFacilities.includes(f)
      ).length;
      
      breakdown.facilityScore = (requiredMatches / requirement.requiredFacilities.length) * 100;
      
      const missingFacilities = requirement.requiredFacilities.filter(f => 
        !roomFacilities.includes(f)
      );
      
      if (missingFacilities.length > 0) {
        conflicts.push(`Missing required facilities: ${missingFacilities.join(', ')}`);
      }
    } else {
      breakdown.facilityScore = 100; // No specific requirements
    }

    // Utilization scoring (0-100)
    const utilizationMetric = await this.calculateRoomUtilization(room.id, dayOfWeek);
    breakdown.utilizationScore = this.config.preferUnderutilizedRooms ? 
      Math.max(0, 100 - utilizationMetric * 100) :
      Math.min(100, utilizationMetric * 100);

    // Availability scoring (considering maintenance and issues)
    breakdown.availabilityScore = 100;
    const roomIssues = this.roomIssues.filter(issue => 
      issue.id === room.id && issue.status === 'open'
    );
    
    roomIssues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          breakdown.availabilityScore -= 50;
          conflicts.push(`Critical issue: ${issue.description}`);
          break;
        case 'major':
          breakdown.availabilityScore -= 25;
          recommendations.push(`Major issue reported: ${issue.description}`);
          break;
        case 'moderate':
          breakdown.availabilityScore -= 10;
          break;
        case 'minor':
          breakdown.availabilityScore -= 5;
          break;
      }
    });

    // Calculate weighted total score
    totalScore = 
      breakdown.capacityScore * 0.3 +
      breakdown.typeMatch * 0.2 +
      breakdown.facilityScore * this.config.facilityMatchWeight +
      breakdown.utilizationScore * this.config.utilizationWeight +
      breakdown.proximityScore * this.config.proximityWeight +
      breakdown.availabilityScore * 0.2;

    return {
      roomId: room.id,
      score: Math.max(0, Math.min(100, totalScore)),
      breakdown,
      conflicts,
      recommendations
    };
  }

  /**
   * Create room requirement from course offering
   */
  private createRoomRequirement(courseOffering: CourseOffering, entry: TimetableEntry): RoomRequirement {
    const baseCapacity = courseOffering.maxEnrollments || 30; // Default capacity
    
    // Determine room type based on entry type
    let roomType: RoomType = 'Lecture Hall';
    const requiredFacilities: string[] = [];
    
    const entryType = entry.entryType;
    
    if (entryType === 'lab') {
      roomType = 'Laboratory';
      requiredFacilities.push('computers', 'equipment');
    } else if (entryType === 'tutorial') {
      roomType = 'Seminar Hall';
      requiredFacilities.push('whiteboard');
    }

    // Always prefer projector for lectures
    if (roomType === 'Lecture Hall') {
      requiredFacilities.push('projector', 'whiteboard');
    }

    return {
      capacity: baseCapacity,
      type: roomType,
      requiredFacilities,
      preferredFacilities: ['ac', 'wifi', 'sound_system'],
      minCapacityUtilization: 0.6 // Prefer 60%+ utilization
    };
  }

  /**
   * Check if room has conflicts at specified time
   */
  private hasRoomConflict(
    roomId: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string
  ): boolean {
    return this.allocations.some(allocation => {
      if (allocation.roomId !== roomId) return false;
      if (allocation.dayOfWeek !== dayOfWeek) return false;
      if (allocation.status === 'cancelled') return false;

      // Check time overlap
      return this.timeOverlaps(
        startTime,
        endTime,
        allocation.startTime.toString().substring(11, 16), // Extract time from timestamp
        allocation.endTime.toString().substring(11, 16)
      );
    });
  }

  /**
   * Check if room is under maintenance at specified time
   */
  private isRoomUnderMaintenance(
    roomId: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string
  ): boolean {
    return this.maintenanceSchedule.some(maintenance => {
      if (maintenance.roomId !== roomId) return false;
      if (maintenance.status === 'completed' || maintenance.status === 'cancelled') return false;

      // Check if maintenance overlaps with requested time
      const maintenanceStart = maintenance.scheduledAt.toString().substring(11, 16);
      const maintenanceEnd = this.addMinutesToTime(maintenanceStart, maintenance.duration);

      return this.timeOverlaps(startTime, endTime, maintenanceStart, maintenanceEnd);
    });
  }

  /**
   * Calculate room utilization for a specific day
   */
  private async calculateRoomUtilization(roomId: string, dayOfWeek: DayOfWeek): Promise<number> {
    const dayAllocations = this.allocations.filter(allocation =>
      allocation.roomId === roomId &&
      allocation.dayOfWeek === dayOfWeek &&
      allocation.status !== 'cancelled'
    );

    if (dayAllocations.length === 0) return 0;

    // Calculate total allocated hours
    const totalAllocatedMinutes = dayAllocations.reduce((total, allocation) => {
      const startTime = allocation.startTime.toString().substring(11, 16);
      const endTime = allocation.endTime.toString().substring(11, 16);
      return total + this.getTimeDifferenceInMinutes(startTime, endTime);
    }, 0);

    // Assume 8-hour working day (480 minutes)
    const workingDayMinutes = 480;
    
    return Math.min(1, totalAllocatedMinutes / workingDayMinutes);
  }

  /**
   * Calculate comprehensive utilization metrics for all rooms
   */
  private async calculateUtilizationMetrics(academicYear: string): Promise<RoomUtilizationMetrics[]> {
    const metrics: RoomUtilizationMetrics[] = [];

    for (const room of this.rooms) {
      const weeklyAllocations = this.allocations.filter(allocation =>
        allocation.roomId === room.id && allocation.status !== 'cancelled'
      );

      const totalMinutesScheduled = weeklyAllocations.reduce((total, allocation) => {
        const startTime = allocation.startTime.toString().substring(11, 16);
        const endTime = allocation.endTime.toString().substring(11, 16);
        return total + this.getTimeDifferenceInMinutes(startTime, endTime);
      }, 0);

      // Assume 6 working days × 8 hours = 48 hours = 2880 minutes per week
      const totalAvailableMinutes = 2880;
      const utilizationRate = totalMinutesScheduled / totalAvailableMinutes;

      // Determine peak and underutilized time slots
      const timeSlotUsage = new Map<string, number>();
      weeklyAllocations.forEach(allocation => {
        const startTime = allocation.startTime.toString().substring(11, 16);
        timeSlotUsage.set(startTime, (timeSlotUsage.get(startTime) || 0) + 1);
      });

      const peakTimeSlots = Array.from(timeSlotUsage.entries())
        .filter(([_, count]) => count >= 3)
        .map(([time]) => time);

      const underutilizedSlots = ['08:00', '09:00', '15:00', '16:00'].filter(
        time => !timeSlotUsage.has(time)
      );

      // Consider maintenance impact
      const maintenanceImpact = this.maintenanceSchedule
        .filter(m => m.roomId === room.id && m.status !== 'completed')
        .reduce((impact, m) => impact + m.duration, 0) / totalAvailableMinutes;

      // Determine overall rating
      let overallRating: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
      if (utilizationRate > 0.9) overallRating = 'excellent';
      else if (utilizationRate > 0.7) overallRating = 'good';
      else if (utilizationRate > 0.5) overallRating = 'average';
      else if (utilizationRate > 0.2) overallRating = 'poor';
      else overallRating = 'critical';

      metrics.push({
        roomId: room.id,
        utilizationRate,
        hoursScheduled: totalMinutesScheduled / 60,
        hoursAvailable: totalAvailableMinutes / 60,
        peakTimeSlots,
        underutilizedSlots,
        maintenanceImpact,
        overallRating
      });
    }

    return metrics.sort((a, b) => b.utilizationRate - a.utilizationRate);
  }

  /**
   * Get room type compatibility score
   */
  private getTypeCompatibilityScore(roomType: RoomType, requiredType: RoomType): number {
    // Define compatibility matrix
    const compatibilityMatrix: Record<RoomType, Partial<Record<RoomType, number>>> = {
      'Lecture Hall': {
        'Seminar Hall': 80,
        'Auditorium': 60,
        'Computer Lab': 40,
        'Laboratory': 20
      },
      'Laboratory': {
        'Computer Lab': 90,
        'Workshop': 70,
        'Lecture Hall': 30
      },
      'Computer Lab': {
        'Laboratory': 90,
        'Lecture Hall': 50,
        'Seminar Hall': 40
      },
      'Seminar Hall': {
        'Lecture Hall': 80,
        'Auditorium': 70,
        'Computer Lab': 40
      },
      'Workshop': {
        'Laboratory': 70,
        'Computer Lab': 30,
        'Lecture Hall': 20
      },
      'Auditorium': {
        'Seminar Hall': 70,
        'Lecture Hall': 60
      },
      'Office': {},
      'Staff Room': {},
      'Library': {
        'Seminar Hall': 30,
        'Lecture Hall': 20
      },
      'Store Room': {},
      'Lab': {
        'Laboratory': 100,
        'Computer Lab': 90,
        'Workshop': 70
      },
      'Other': {}
    };

    return compatibilityMatrix[roomType]?.[requiredType] || 0;
  }

  /**
   * Utility method to check time overlap
   */
  private timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);

    return !(e1 <= s2 || s1 >= e2);
  }

  /**
   * Convert time string to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get time difference in minutes
   */
  private getTimeDifferenceInMinutes(startTime: string, endTime: string): number {
    return this.timeToMinutes(endTime) - this.timeToMinutes(startTime);
  }

  /**
   * Add minutes to time string
   */
  private addMinutesToTime(time: string, minutes: number): string {
    const totalMinutes = this.timeToMinutes(time) + minutes;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Get room scheduling recommendations
   */
  getSchedulingRecommendations(): string[] {
    const recommendations: string[] = [];
    const utilizationMetrics = this.rooms.map(room => ({
      room,
      utilization: this.allocations.filter(a => a.roomId === room.id).length
    }));

    const underutilizedRooms = utilizationMetrics.filter(rm => rm.utilization < 3);
    const overutilizedRooms = utilizationMetrics.filter(rm => rm.utilization > 20);

    if (underutilizedRooms.length > 0) {
      recommendations.push(`${underutilizedRooms.length} rooms are underutilized. Consider consolidating classes or repurposing rooms.`);
    }

    if (overutilizedRooms.length > 0) {
      recommendations.push(`${overutilizedRooms.length} rooms are overutilized. Consider adding more rooms or adjusting schedules.`);
    }

    const criticalIssues = this.roomIssues.filter(issue => 
      issue.severity === 'critical' && issue.status === 'open'
    );
    
    if (criticalIssues.length > 0) {
      recommendations.push(`${criticalIssues.length} rooms have critical issues requiring immediate attention.`);
    }

    return recommendations;
  }
}

/**
 * Default room scheduling configuration for GTU diploma engineering
 */
export const DEFAULT_ROOM_SCHEDULING_CONFIG: RoomSchedulingConfig = {
  prioritizeCapacityMatch: true,
  allowOvercapacity: false,
  maxOvercapacityRatio: 1.2,
  preferUnderutilizedRooms: true,
  considerMaintenance: true,
  proximityWeight: 0.2,
  facilityMatchWeight: 0.3,
  utilizationWeight: 0.3
};

/**
 * Factory function to create room scheduling engine
 */
export function createRoomSchedulingEngine(
  rooms: Room[],
  allocations?: RoomAllocation[],
  maintenanceSchedule?: MaintenanceEntry[],
  roomIssues?: RoomIssue[],
  config?: Partial<RoomSchedulingConfig>
): RoomSchedulingEngine {
  return new RoomSchedulingEngine(
    rooms,
    allocations,
    maintenanceSchedule,
    roomIssues,
    config
  );
}