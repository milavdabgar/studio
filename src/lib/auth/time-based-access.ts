import type { UserRole as UserRoleCode } from '@/types/entities';
import { auditLogger } from '@/lib/audit/audit-logger';

export interface TimeBasedRule {
  id: string;
  name: string;
  description?: string;
  ruleType: 'allow' | 'deny' | 'restrict';
  target: {
    userIds?: string[];
    roles?: UserRoleCode[];
    departments?: string[];
    committees?: string[];
    resources?: string[];
    permissions?: string[];
  };
  timeConstraints: TimeConstraint[];
  exceptions?: TimeException[];
  priority: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface TimeConstraint {
  type: 'daily' | 'weekly' | 'monthly' | 'date_range' | 'custom';
  schedule: {
    // Daily constraints
    startTime?: string; // HH:MM format
    endTime?: string;   // HH:MM format
    
    // Weekly constraints
    daysOfWeek?: number[]; // 0-6, Sunday = 0
    
    // Monthly constraints
    daysOfMonth?: number[]; // 1-31
    months?: number[]; // 1-12
    
    // Date range constraints
    startDate?: Date;
    endDate?: Date;
    
    // Custom cron-like expressions
    cronExpression?: string;
  };
  timezone?: string; // IANA timezone identifier
  recurrence?: {
    enabled: boolean;
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number; // Every N days/weeks/months/years
    endDate?: Date;
    maxOccurrences?: number;
  };
}

export interface TimeException {
  id: string;
  name: string;
  type: 'grant' | 'revoke' | 'extend' | 'emergency';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  timeRange?: {
    startTime: string;
    endTime: string;
  };
  reason: string;
  approvedBy?: string;
  approvedAt?: Date;
  isActive: boolean;
}

export interface AccessWindow {
  isAccessible: boolean;
  nextAccessTime?: Date;
  nextRestrictedTime?: Date;
  currentRule?: TimeBasedRule;
  applicableRules: TimeBasedRule[];
  exceptions: TimeException[];
}

export interface TimeBasedAccessQuery {
  userId: string;
  userRole?: UserRoleCode;
  department?: string;
  committee?: string;
  resource?: string;
  permission?: string;
  checkTime?: Date;
  timezone?: string;
  context?: Record<string, any>;
}

export interface EmergencyAccess {
  id: string;
  userId: string;
  grantedBy: string;
  reason: string;
  permissions: string[];
  resources?: string[];
  duration: number; // in milliseconds
  grantedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  usageLog: {
    accessTime: Date;
    resource: string;
    permission: string;
  }[];
}

class TimeBasedAccessManager {
  private rules: Map<string, TimeBasedRule> = new Map();
  private emergencyAccess: Map<string, EmergencyAccess> = new Map();
  private accessCache: Map<string, { result: AccessWindow; expires: number }> = new Map();

  constructor() {
    // Clean up expired emergency access and cache every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Create a time-based access rule
   */
  async createTimeRule(
    rule: Omit<TimeBasedRule, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<TimeBasedRule> {
    const ruleId = this.generateId('time_rule');
    
    const timeRule: TimeBasedRule = {
      id: ruleId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...rule
    };

    this.rules.set(ruleId, timeRule);
    this.invalidateCache();

    // Audit log
    await auditLogger.logAction({
      userId: createdBy,
      userEmail: createdBy,
      userRole: 'admin',
      action: 'CREATE_TIME_RULE',
      resource: 'time_based_access',
      resourceId: ruleId,
      status: 'success',
      details: {
        ruleName: rule.name,
        ruleType: rule.ruleType,
        target: rule.target,
        timeConstraints: rule.timeConstraints.length
      }
    });

    return timeRule;
  }

  /**
   * Update a time-based access rule
   */
  async updateTimeRule(
    ruleId: string,
    updates: Partial<Omit<TimeBasedRule, 'id' | 'createdAt' | 'createdBy'>>,
    updatedBy: string
  ): Promise<{ success: boolean; message: string }> {
    const existingRule = this.rules.get(ruleId);
    
    if (!existingRule) {
      return { success: false, message: 'Time rule not found' };
    }

    const updatedRule: TimeBasedRule = {
      ...existingRule,
      ...updates,
      updatedAt: new Date()
    };

    this.rules.set(ruleId, updatedRule);
    this.invalidateCache();

    // Audit log
    await auditLogger.logAction({
      userId: updatedBy,
      userEmail: updatedBy,
      userRole: 'admin',
      action: 'UPDATE_TIME_RULE',
      resource: 'time_based_access',
      resourceId: ruleId,
      status: 'success',
      details: {
        ruleName: updatedRule.name,
        changes: Object.keys(updates)
      }
    });

    return { success: true, message: 'Time rule updated successfully' };
  }

  /**
   * Check if access is allowed at a specific time
   */
  async checkTimeBasedAccess(query: TimeBasedAccessQuery): Promise<AccessWindow> {
    const cacheKey = this.getCacheKey(query);
    const cached = this.accessCache.get(cacheKey);
    
    // Return cached result if valid (cache for 1 minute)
    if (cached && Date.now() < cached.expires) {
      return cached.result;
    }

    const result = await this.evaluateTimeBasedAccess(query);
    
    // Cache result for 1 minute
    this.accessCache.set(cacheKey, {
      result,
      expires: Date.now() + 60 * 1000
    });

    return result;
  }

  /**
   * Grant emergency access
   */
  async grantEmergencyAccess(
    userId: string,
    permissions: string[],
    duration: number,
    reason: string,
    grantedBy: string,
    resources?: string[]
  ): Promise<{ success: boolean; emergencyId: string }> {
    const emergencyId = this.generateId('emergency');
    
    const emergency: EmergencyAccess = {
      id: emergencyId,
      userId,
      grantedBy,
      reason,
      permissions,
      resources,
      duration,
      grantedAt: new Date(),
      expiresAt: new Date(Date.now() + duration),
      isActive: true,
      usageLog: []
    };

    this.emergencyAccess.set(emergencyId, emergency);

    // Audit log
    await auditLogger.logAction({
      userId: grantedBy,
      userEmail: grantedBy,
      userRole: 'admin',
      action: 'GRANT_EMERGENCY_ACCESS',
      resource: 'emergency_access',
      resourceId: emergencyId,
      status: 'success',
      details: {
        targetUserId: userId,
        permissions,
        resources,
        duration,
        reason
      }
    });

    return { success: true, emergencyId };
  }

  /**
   * Check emergency access
   */
  checkEmergencyAccess(
    userId: string,
    permission: string,
    resource?: string
  ): { hasAccess: boolean; emergencyId?: string } {
    for (const emergency of this.emergencyAccess.values()) {
      if (
        emergency.userId === userId &&
        emergency.isActive &&
        emergency.expiresAt > new Date() &&
        emergency.permissions.includes(permission) &&
        (!emergency.resources || !resource || emergency.resources.includes(resource))
      ) {
        // Log usage
        emergency.usageLog.push({
          accessTime: new Date(),
          resource: resource || 'unknown',
          permission
        });

        return { hasAccess: true, emergencyId: emergency.id };
      }
    }

    return { hasAccess: false };
  }

  /**
   * Revoke emergency access
   */
  async revokeEmergencyAccess(
    emergencyId: string,
    revokedBy: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const emergency = this.emergencyAccess.get(emergencyId);
    
    if (!emergency) {
      return { success: false, message: 'Emergency access not found' };
    }

    emergency.isActive = false;

    // Audit log
    await auditLogger.logAction({
      userId: revokedBy,
      userEmail: revokedBy,
      userRole: 'admin',
      action: 'REVOKE_EMERGENCY_ACCESS',
      resource: 'emergency_access',
      resourceId: emergencyId,
      status: 'success',
      details: {
        targetUserId: emergency.userId,
        originalGrantedBy: emergency.grantedBy,
        reason
      }
    });

    return { success: true, message: 'Emergency access revoked successfully' };
  }

  /**
   * Get applicable time rules
   */
  getApplicableRules(query: TimeBasedAccessQuery): TimeBasedRule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.isActive && this.isRuleApplicable(rule, query))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Add time exception to a rule
   */
  async addTimeException(
    ruleId: string,
    exception: Omit<TimeException, 'id'>,
    addedBy: string
  ): Promise<{ success: boolean; exceptionId: string }> {
    const rule = this.rules.get(ruleId);
    
    if (!rule) {
      return { success: false, exceptionId: '' };
    }

    const exceptionId = this.generateId('exception');
    const timeException: TimeException = {
      id: exceptionId,
      ...exception
    };

    if (!rule.exceptions) {
      rule.exceptions = [];
    }
    rule.exceptions.push(timeException);
    rule.updatedAt = new Date();

    this.invalidateCache();

    // Audit log
    await auditLogger.logAction({
      userId: addedBy,
      userEmail: addedBy,
      userRole: 'admin',
      action: 'ADD_TIME_EXCEPTION',
      resource: 'time_based_access',
      resourceId: ruleId,
      status: 'success',
      details: {
        exceptionId,
        exceptionType: exception.type,
        dateRange: exception.dateRange,
        reason: exception.reason
      }
    });

    return { success: true, exceptionId };
  }

  /**
   * Get time-based access analytics
   */
  getTimeAccessAnalytics(dateRange?: { start: Date; end: Date }): {
    totalRules: number;
    activeRules: number;
    rulesByType: Record<string, number>;
    emergencyAccessCount: number;
    activeEmergencyCount: number;
    mostRestrictiveHours: { hour: number; restrictionCount: number }[];
    departmentAccess: Record<string, { allowed: number; denied: number }>;
  } {
    const totalRules = this.rules.size;
    const activeRules = Array.from(this.rules.values()).filter(r => r.isActive).length;
    
    const rulesByType: Record<string, number> = {};
    this.rules.forEach(rule => {
      rulesByType[rule.ruleType] = (rulesByType[rule.ruleType] || 0) + 1;
    });

    const emergencyAccessCount = this.emergencyAccess.size;
    const activeEmergencyCount = Array.from(this.emergencyAccess.values())
      .filter(e => e.isActive && e.expiresAt > new Date()).length;

    // Analyze restrictive hours (simplified)
    const hourRestrictions: Record<number, number> = {};
    this.rules.forEach(rule => {
      if (rule.ruleType === 'deny' || rule.ruleType === 'restrict') {
        rule.timeConstraints.forEach(constraint => {
          if (constraint.schedule.startTime && constraint.schedule.endTime) {
            const startHour = parseInt(constraint.schedule.startTime.split(':')[0]);
            const endHour = parseInt(constraint.schedule.endTime.split(':')[0]);
            for (let hour = startHour; hour <= endHour; hour++) {
              hourRestrictions[hour] = (hourRestrictions[hour] || 0) + 1;
            }
          }
        });
      }
    });

    const mostRestrictiveHours = Object.entries(hourRestrictions)
      .map(([hour, count]) => ({ hour: parseInt(hour), restrictionCount: count }))
      .sort((a, b) => b.restrictionCount - a.restrictionCount)
      .slice(0, 5);

    // Department access analysis (simplified)
    const departmentAccess: Record<string, { allowed: number; denied: number }> = {};
    this.rules.forEach(rule => {
      rule.target.departments?.forEach(dept => {
        if (!departmentAccess[dept]) {
          departmentAccess[dept] = { allowed: 0, denied: 0 };
        }
        if (rule.ruleType === 'allow') {
          departmentAccess[dept].allowed++;
        } else {
          departmentAccess[dept].denied++;
        }
      });
    });

    return {
      totalRules,
      activeRules,
      rulesByType,
      emergencyAccessCount,
      activeEmergencyCount,
      mostRestrictiveHours,
      departmentAccess
    };
  }

  private async evaluateTimeBasedAccess(query: TimeBasedAccessQuery): Promise<AccessWindow> {
    const checkTime = query.checkTime || new Date();
    const applicableRules = this.getApplicableRules(query);
    const exceptions: TimeException[] = [];
    
    let isAccessible = true;
    let currentRule: TimeBasedRule | undefined;
    let nextAccessTime: Date | undefined;
    let nextRestrictedTime: Date | undefined;

    // Collect all applicable exceptions
    applicableRules.forEach(rule => {
      if (rule.exceptions) {
        exceptions.push(...rule.exceptions.filter(ex => 
          ex.isActive && this.isExceptionActive(ex, checkTime)
        ));
      }
    });

    // Evaluate rules in priority order
    for (const rule of applicableRules) {
      const ruleResult = await this.evaluateRule(rule, query, checkTime);
      
      if (ruleResult.applies) {
        currentRule = rule;
        
        if (rule.ruleType === 'deny') {
          isAccessible = false;
          nextAccessTime = ruleResult.nextChange;
          break;
        } else if (rule.ruleType === 'restrict') {
          // Additional restrictions can be applied here
          nextRestrictedTime = ruleResult.nextChange;
        } else if (rule.ruleType === 'allow') {
          isAccessible = true;
          nextRestrictedTime = ruleResult.nextChange;
        }
      }
    }

    // Check for emergency access override
    if (!isAccessible && query.permission) {
      const emergencyAccess = this.checkEmergencyAccess(
        query.userId,
        query.permission,
        query.resource
      );
      if (emergencyAccess.hasAccess) {
        isAccessible = true;
      }
    }

    return {
      isAccessible,
      nextAccessTime,
      nextRestrictedTime,
      currentRule,
      applicableRules,
      exceptions
    };
  }

  private async evaluateRule(
    rule: TimeBasedRule,
    query: TimeBasedAccessQuery,
    checkTime: Date
  ): Promise<{ applies: boolean; nextChange?: Date }> {
    for (const constraint of rule.timeConstraints) {
      const constraintResult = await this.evaluateTimeConstraint(constraint, checkTime, query.timezone);
      if (constraintResult.matches) {
        return { applies: true, nextChange: constraintResult.nextChange };
      }
    }
    
    return { applies: false };
  }

  private async evaluateTimeConstraint(
    constraint: TimeConstraint,
    checkTime: Date,
    userTimezone?: string
  ): Promise<{ matches: boolean; nextChange?: Date }> {
    const timezone = constraint.timezone || userTimezone || 'UTC';
    const localTime = new Date(checkTime.toLocaleString('en-US', { timeZone: timezone }));
    
    switch (constraint.type) {
      case 'daily':
        return this.evaluateDailyConstraint(constraint, localTime);
      case 'weekly':
        return this.evaluateWeeklyConstraint(constraint, localTime);
      case 'monthly':
        return this.evaluateMonthlyConstraint(constraint, localTime);
      case 'date_range':
        return this.evaluateDateRangeConstraint(constraint, checkTime);
      case 'custom':
        return this.evaluateCustomConstraint(constraint, checkTime);
      default:
        return { matches: false };
    }
  }

  private evaluateDailyConstraint(
    constraint: TimeConstraint,
    localTime: Date
  ): { matches: boolean; nextChange?: Date } {
    const { startTime, endTime } = constraint.schedule;
    if (!startTime || !endTime) return { matches: false };

    const currentTimeStr = localTime.toTimeString().substring(0, 5);
    const isInTimeWindow = currentTimeStr >= startTime && currentTimeStr <= endTime;

    // Calculate next change time
    const today = new Date(localTime);
    const nextChange = new Date(today);
    
    if (isInTimeWindow && endTime) {
      const [endHour, endMinute] = endTime.split(':').map(Number);
      nextChange.setHours(endHour, endMinute, 0, 0);
    } else if (!isInTimeWindow && startTime) {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      nextChange.setHours(startHour, startMinute, 0, 0);
      if (nextChange <= localTime) {
        nextChange.setDate(nextChange.getDate() + 1);
      }
    }

    return { matches: isInTimeWindow, nextChange };
  }

  private evaluateWeeklyConstraint(
    constraint: TimeConstraint,
    localTime: Date
  ): { matches: boolean; nextChange?: Date } {
    const { daysOfWeek, startTime, endTime } = constraint.schedule;
    if (!daysOfWeek) return { matches: false };

    const currentDayOfWeek = localTime.getDay();
    const isDayMatch = daysOfWeek.includes(currentDayOfWeek);

    if (!isDayMatch) {
      return { matches: false };
    }

    if (startTime && endTime) {
      return this.evaluateDailyConstraint(constraint, localTime);
    }

    return { matches: true };
  }

  private evaluateMonthlyConstraint(
    constraint: TimeConstraint,
    localTime: Date
  ): { matches: boolean; nextChange?: Date } {
    const { daysOfMonth, months } = constraint.schedule;
    const currentDay = localTime.getDate();
    const currentMonth = localTime.getMonth() + 1;

    const isDayMatch = !daysOfMonth || daysOfMonth.includes(currentDay);
    const isMonthMatch = !months || months.includes(currentMonth);

    return { matches: isDayMatch && isMonthMatch };
  }

  private evaluateDateRangeConstraint(
    constraint: TimeConstraint,
    checkTime: Date
  ): { matches: boolean; nextChange?: Date } {
    const { startDate, endDate } = constraint.schedule;
    if (!startDate || !endDate) return { matches: false };

    const isInRange = checkTime >= startDate && checkTime <= endDate;
    const nextChange = isInRange ? endDate : startDate;

    return { matches: isInRange, nextChange };
  }

  private evaluateCustomConstraint(
    constraint: TimeConstraint,
    checkTime: Date
  ): { matches: boolean; nextChange?: Date } {
    // This would implement cron expression evaluation
    // For now, return false as a placeholder
    return { matches: false };
  }

  private isRuleApplicable(rule: TimeBasedRule, query: TimeBasedAccessQuery): boolean {
    const { target } = rule;
    
    // Check user ID match
    if (target.userIds && !target.userIds.includes(query.userId)) {
      return false;
    }
    
    // Check role match
    if (target.roles && query.userRole && !target.roles.includes(query.userRole)) {
      return false;
    }
    
    // Check department match
    if (target.departments && query.department && !target.departments.includes(query.department)) {
      return false;
    }
    
    // Check committee match
    if (target.committees && query.committee && !target.committees.includes(query.committee)) {
      return false;
    }
    
    // Check resource match
    if (target.resources && query.resource && !target.resources.includes(query.resource)) {
      return false;
    }
    
    // Check permission match
    if (target.permissions && query.permission && !target.permissions.includes(query.permission)) {
      return false;
    }
    
    return true;
  }

  private isExceptionActive(exception: TimeException, checkTime: Date): boolean {
    if (!exception.isActive) return false;
    
    const isInDateRange = checkTime >= exception.dateRange.startDate && 
                         checkTime <= exception.dateRange.endDate;
    
    if (!isInDateRange) return false;
    
    if (exception.timeRange) {
      const currentTimeStr = checkTime.toTimeString().substring(0, 5);
      return currentTimeStr >= exception.timeRange.startTime && 
             currentTimeStr <= exception.timeRange.endTime;
    }
    
    return true;
  }

  private getCacheKey(query: TimeBasedAccessQuery): string {
    return JSON.stringify({
      userId: query.userId,
      userRole: query.userRole,
      department: query.department,
      committee: query.committee,
      resource: query.resource,
      permission: query.permission,
      checkTime: query.checkTime?.toISOString(),
      timezone: query.timezone
    });
  }

  private invalidateCache(): void {
    this.accessCache.clear();
  }

  private cleanup(): void {
    const now = new Date();
    
    // Remove expired emergency access
    for (const [id, emergency] of this.emergencyAccess.entries()) {
      if (emergency.expiresAt <= now) {
        this.emergencyAccess.delete(id);
      }
    }
    
    // Clear expired cache entries
    for (const [key, cached] of this.accessCache.entries()) {
      if (Date.now() >= cached.expires) {
        this.accessCache.delete(key);
      }
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Singleton instance
export const timeBasedAccessManager = new TimeBasedAccessManager();

// Utility functions for integration
export const timeAccessUtils = {
  /**
   * Create a business hours rule
   */
  async createBusinessHoursRule(
    name: string,
    startTime: string,
    endTime: string,
    daysOfWeek: number[],
    target: TimeBasedRule['target'],
    createdBy: string,
    ruleType: 'allow' | 'deny' = 'allow'
  ): Promise<TimeBasedRule> {
    return timeBasedAccessManager.createTimeRule({
      name,
      ruleType,
      target,
      timeConstraints: [{
        type: 'weekly',
        schedule: {
          startTime,
          endTime,
          daysOfWeek
        }
      }],
      priority: 1,
      isActive: true,
      createdBy
    }, createdBy);
  },

  /**
   * Create a maintenance window rule
   */
  async createMaintenanceWindow(
    name: string,
    startDate: Date,
    endDate: Date,
    reason: string,
    createdBy: string
  ): Promise<TimeBasedRule> {
    return timeBasedAccessManager.createTimeRule({
      name,
      description: `Maintenance window: ${reason}`,
      ruleType: 'deny',
      target: {}, // Apply to all users
      timeConstraints: [{
        type: 'date_range',
        schedule: {
          startDate,
          endDate
        }
      }],
      priority: 10, // High priority
      isActive: true,
      createdBy
    }, createdBy);
  },

  /**
   * Check if user can access resource at specific time
   */
  async canAccessAtTime(
    userId: string,
    resource: string,
    permission: string,
    checkTime?: Date,
    userRole?: UserRoleCode,
    department?: string
  ): Promise<boolean> {
    const result = await timeBasedAccessManager.checkTimeBasedAccess({
      userId,
      userRole,
      department,
      resource,
      permission,
      checkTime
    });
    
    return result.isAccessible;
  },

  /**
   * Get access schedule for user
   */
  async getAccessSchedule(
    userId: string,
    resource?: string,
    permission?: string,
    days = 7
  ): Promise<{
    date: string;
    accessWindows: { start: string; end: string; allowed: boolean }[];
  }[]> {
    const schedule = [];
    const startDate = new Date();
    
    for (let i = 0; i < days; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() + i);
      
      const accessWindows = [];
      // Check access every hour
      for (let hour = 0; hour < 24; hour++) {
        const checkTime = new Date(checkDate);
        checkTime.setHours(hour, 0, 0, 0);
        
        const result = await timeBasedAccessManager.checkTimeBasedAccess({
          userId,
          resource,
          permission,
          checkTime
        });
        
        accessWindows.push({
          start: `${hour.toString().padStart(2, '0')}:00`,
          end: `${(hour + 1).toString().padStart(2, '0')}:00`,
          allowed: result.isAccessible
        });
      }
      
      schedule.push({
        date: checkDate.toISOString().split('T')[0],
        accessWindows
      });
    }
    
    return schedule;
  }
};

export default timeBasedAccessManager;