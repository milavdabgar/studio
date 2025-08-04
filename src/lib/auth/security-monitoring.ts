import type { UserRole as UserRoleCode } from '@/types/entities';
import { auditLogger } from '@/lib/audit/audit-logger';

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  eventType: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: 'authentication' | 'authorization' | 'data_access' | 'system' | 'network' | 'user_behavior';
  userId?: string;
  userRole?: UserRoleCode;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  details: SecurityEventDetails;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolvedAt?: Date;
  tags: string[];
  relatedEvents: string[];
  riskScore: number;
  metadata?: Record<string, unknown>;
}

export type SecurityEventType = 
  | 'suspicious_login' | 'multiple_failed_logins' | 'unusual_access_pattern' | 'privilege_escalation'
  | 'unauthorized_access_attempt' | 'data_exfiltration' | 'malicious_ip' | 'anomalous_behavior'
  | 'policy_violation' | 'compliance_breach' | 'insider_threat' | 'brute_force_attack'
  | 'session_hijacking' | 'credential_stuffing' | 'time_anomaly' | 'geographic_anomaly'
  | 'device_anomaly' | 'permission_abuse' | 'role_mining' | 'lateral_movement';

export interface SecurityEventDetails {
  description: string;
  indicators: SecurityIndicator[];
  context: Record<string, any>;
  evidence: Evidence[];
  impact: {
    scope: 'user' | 'department' | 'system' | 'organization';
    affectedEntities: string[];
    dataAtRisk?: string[];
    businessImpact: 'none' | 'minimal' | 'moderate' | 'significant' | 'severe';
  };
  recommendations: string[];
  automatedActions: AutomatedAction[];
}

export interface SecurityIndicator {
  type: 'ip_reputation' | 'geolocation' | 'time_pattern' | 'access_frequency' | 'privilege_usage' | 'device_fingerprint';
  value: any;
  threshold: any;
  confidence: number; // 0-1
  description: string;
}

export interface Evidence {
  type: 'log_entry' | 'network_traffic' | 'user_behavior' | 'system_state' | 'external_intelligence';
  source: string;
  timestamp: Date;
  data: any;
  integrity: 'verified' | 'unverified' | 'tampered';
}

export interface AutomatedAction {
  action: 'block_ip' | 'disable_user' | 'revoke_session' | 'escalate_alert' | 'isolate_resource' | 'notify_admin';
  executed: boolean;
  executedAt?: Date;
  result?: string;
  error?: string;
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  category: 'detection' | 'prevention' | 'response' | 'compliance';
  eventTypes: SecurityEventType[];
  conditions: SecurityCondition[];
  actions: RuleAction[];
  threshold: {
    count: number;
    timeWindow: number; // in milliseconds
    aggregationField?: string;
  };
  isActive: boolean;
  priority: number;
  suppressionRules?: SuppressionRule[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  triggeredCount: number;
  lastTriggered?: Date;
}

export interface SecurityCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'regex';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  type: 'create_alert' | 'send_notification' | 'execute_script' | 'update_user_status' | 'block_access' | 'log_event';
  config: Record<string, any>;
  delay?: number; // in milliseconds
  condition?: string; // Additional condition for action execution
}

export interface SuppressionRule {
  field: string;
  value: any;
  duration: number; // in milliseconds
  reason: string;
}

export interface SecurityAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  events: string[]; // Event IDs
  severity: SecurityEvent['severity'];
  status: 'open' | 'investigating' | 'resolved' | 'suppressed';
  createdAt: Date;
  assignedTo?: string;
  resolvedAt?: Date;
  resolution?: string;
  escalationLevel: 0 | 1 | 2 | 3; // 0 = no escalation, 3 = highest
  notificationsSent: NotificationRecord[];
  tags: string[];
  relatedAlerts: string[];
  responseActions: ResponseAction[];
}

export interface NotificationRecord {
  type: 'email' | 'sms' | 'slack' | 'webhook' | 'dashboard';
  recipient: string;
  sentAt: Date;
  success: boolean;
  error?: string;
}

export interface ResponseAction {
  action: string;
  executedBy?: string;
  executedAt: Date;
  success: boolean;
  result?: string;
  error?: string;
}

export interface SecurityMetrics {
  timeRange: { start: Date; end: Date };
  eventCounts: Record<SecurityEventType, number>;
  severityDistribution: Record<string, number>;
  topRiskUsers: { userId: string; riskScore: number; eventCount: number }[];
  topThreats: { type: SecurityEventType; count: number; trend: 'increasing' | 'decreasing' | 'stable' }[];
  responseMetrics: {
    averageResponseTime: number;
    resolutionRate: number;
    falsePositiveRate: number;
    escalationRate: number;
  };
  complianceMetrics: {
    policyViolations: number;
    dataBreaches: number;
    accessViolations: number;
    auditFindings: number;
  };
}

export interface ThreatIntelligence {
  ipAddress?: string;
  domain?: string;
  hash?: string;
  threatType: 'malware' | 'botnet' | 'phishing' | 'c2' | 'tor' | 'proxy' | 'spam' | 'scanner';
  reputation: number; // 0-100, lower is worse
  confidence: number; // 0-1
  sources: string[];
  firstSeen: Date;
  lastSeen: Date;
  tags: string[];
  attributes: Record<string, any>;
}

class SecurityMonitoringEngine {
  private events: Map<string, SecurityEvent> = new Map();
  private rules: Map<string, SecurityRule> = new Map();
  private alerts: Map<string, SecurityAlert> = new Map();
  private threatIntelligence: Map<string, ThreatIntelligence> = new Map();
  private eventBuffer: SecurityEvent[] = [];
  private isProcessing = false;

  constructor() {
    // Initialize default security rules
    this.initializeDefaultRules();
    
    // Process events every 10 seconds
    setInterval(() => this.processEventBuffer(), 10 * 1000);
    
    // Update threat intelligence every hour
    setInterval(() => this.updateThreatIntelligence(), 60 * 60 * 1000);
    
    // Clean up old events daily
    setInterval(() => this.cleanup(), 24 * 60 * 60 * 1000);
    
    // Generate metrics every 5 minutes
    setInterval(() => this.updateMetrics(), 5 * 60 * 1000);
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    eventType: SecurityEventType,
    severity: SecurityEvent['severity'],
    source: SecurityEvent['source'],
    details: SecurityEventDetails,
    context: {
      userId?: string;
      userRole?: UserRoleCode;
      ipAddress?: string;
      userAgent?: string;
      resource?: string;
      action?: string;
    } = {}
  ): Promise<SecurityEvent> {
    const eventId = this.generateId('security_event');
    const riskScore = this.calculateRiskScore(eventType, severity, details, context);
    
    const event: SecurityEvent = {
      id: eventId,
      timestamp: new Date(),
      eventType,
      severity,
      source,
      riskScore,
      status: 'new',
      tags: this.generateEventTags(eventType, source, context),
      relatedEvents: [],
      details: details,
      ...context
    };

    // Add to buffer for processing
    this.eventBuffer.push(event);
    this.events.set(eventId, event);

    // Immediate processing for critical events
    if (severity === 'critical') {
      await this.processEvent(event);
    }

    // Audit log
    await auditLogger.logAction({
      userId: context.userId || 'system',
      userEmail: context.userId || 'system',
      userRole: context.userRole || 'system',
      action: 'LOG_SECURITY_EVENT',
      resource: 'security_monitoring',
      resourceId: eventId,
      status: 'success',
      details: {
        eventType,
        severity,
        riskScore,
        source
      }
    });

    return event;
  }

  /**
   * Create security rule
   */
  async createSecurityRule(
    rule: Omit<SecurityRule, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount'>,
    createdBy: string
  ): Promise<SecurityRule> {
    const ruleId = this.generateId('security_rule');
    
    const securityRule: SecurityRule = {
      id: ruleId,
      createdAt: new Date(),
      updatedAt: new Date(),
      triggeredCount: 0,
      ...rule
    };

    this.rules.set(ruleId, securityRule);

    // Audit log
    await auditLogger.logAction({
      userId: createdBy,
      userEmail: createdBy,
      userRole: 'admin',
      action: 'CREATE_SECURITY_RULE',
      resource: 'security_monitoring',
      resourceId: ruleId,
      status: 'success',
      details: {
        ruleName: rule.name,
        category: rule.category,
        eventTypes: rule.eventTypes,
        priority: rule.priority
      }
    });

    return securityRule;
  }

  /**
   * Update security event status
   */
  async updateEventStatus(
    eventId: string,
    status: SecurityEvent['status'],
    assignedTo?: string,
    updatedBy?: string
  ): Promise<{ success: boolean; message: string }> {
    const event = this.events.get(eventId);
    
    if (!event) {
      return { success: false, message: 'Event not found' };
    }

    event.status = status;
    if (assignedTo) event.assignedTo = assignedTo;
    if (status === 'resolved') event.resolvedAt = new Date();

    // Audit log
    if (updatedBy) {
      await auditLogger.logAction({
        userId: updatedBy,
        userEmail: updatedBy,
        userRole: 'admin',
        action: 'UPDATE_SECURITY_EVENT_STATUS',
        resource: 'security_monitoring',
        resourceId: eventId,
        status: 'success',
        details: {
          eventType: event.eventType,
          oldStatus: event.status,
          newStatus: status,
          assignedTo
        }
      });
    }

    return { success: true, message: 'Event status updated successfully' };
  }

  /**
   * Get security events
   */
  getSecurityEvents(
    filters?: {
      eventTypes?: SecurityEventType[];
      severity?: SecurityEvent['severity'][];
      status?: SecurityEvent['status'][];
      userId?: string;
      timeRange?: { start: Date; end: Date };
      riskScoreMin?: number;
    },
    limit = 100
  ): SecurityEvent[] {
    let events = Array.from(this.events.values());

    if (filters) {
      if (filters.eventTypes) {
        events = events.filter(e => filters.eventTypes!.includes(e.eventType));
      }
      if (filters.severity) {
        events = events.filter(e => filters.severity!.includes(e.severity));
      }
      if (filters.status) {
        events = events.filter(e => filters.status!.includes(e.status));
      }
      if (filters.userId) {
        events = events.filter(e => e.userId === filters.userId);
      }
      if (filters.timeRange) {
        events = events.filter(e => 
          e.timestamp >= filters.timeRange!.start && 
          e.timestamp <= filters.timeRange!.end
        );
      }
      if (filters.riskScoreMin) {
        events = events.filter(e => e.riskScore >= filters.riskScoreMin!);
      }
    }

    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get security alerts
   */
  getSecurityAlerts(
    status?: SecurityAlert['status'],
    severity?: SecurityEvent['severity']
  ): SecurityAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => {
        if (status && alert.status !== status) return false;
        if (severity && alert.severity !== severity) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(timeRange: { start: Date; end: Date }): Promise<SecurityMetrics> {
    const events = this.getSecurityEvents({ timeRange });
    
    // Count events by type
    const eventCounts: Record<SecurityEventType, number> = {} as any;
    events.forEach(event => {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    });

    // Severity distribution
    const severityDistribution: Record<string, number> = {};
    events.forEach(event => {
      severityDistribution[event.severity] = (severityDistribution[event.severity] || 0) + 1;
    });

    // Top risk users
    const userRiskScores: Record<string, { totalRisk: number; eventCount: number }> = {};
    events.forEach(event => {
      if (event.userId) {
        if (!userRiskScores[event.userId]) {
          userRiskScores[event.userId] = { totalRisk: 0, eventCount: 0 };
        }
        userRiskScores[event.userId].totalRisk += event.riskScore;
        userRiskScores[event.userId].eventCount++;
      }
    });

    const topRiskUsers = Object.entries(userRiskScores)
      .map(([userId, data]) => ({
        userId,
        riskScore: data.totalRisk / data.eventCount,
        eventCount: data.eventCount
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    // Top threats (simplified)
    const topThreats = Object.entries(eventCounts)
      .map(([type, count]) => ({
        type: type as SecurityEventType,
        count,
        trend: 'stable' as const // This would be calculated based on historical data
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Response metrics (would be calculated from actual alert data)
    const responseMetrics = {
      averageResponseTime: 45, // minutes
      resolutionRate: 0.85,
      falsePositiveRate: 0.15,
      escalationRate: 0.25
    };

    // Compliance metrics
    const complianceMetrics = {
      policyViolations: events.filter(e => e.eventType === 'policy_violation').length,
      dataBreaches: events.filter(e => e.eventType === 'data_exfiltration').length,
      accessViolations: events.filter(e => e.eventType === 'unauthorized_access_attempt').length,
      auditFindings: events.filter(e => e.eventType === 'compliance_breach').length
    };

    return {
      timeRange,
      eventCounts,
      severityDistribution,
      topRiskUsers,
      topThreats,
      responseMetrics,
      complianceMetrics
    };
  }

  /**
   * Execute automated response
   */
  async executeAutomatedResponse(
    eventId: string,
    actions: AutomatedAction[]
  ): Promise<{ success: boolean; results: any[] }> {
    const event = this.events.get(eventId);
    if (!event) {
      return { success: false, results: [] };
    }

    const results = [];

    for (const action of actions) {
      try {
        const result = await this.executeAction(action, event);
        action.executed = true;
        action.executedAt = new Date();
        action.result = result;
        results.push({ action: action.action, success: true, result });
      } catch (error) {
        action.executed = false;
        action.error = error instanceof Error ? error.message : 'Unknown error';
        results.push({ action: action.action, success: false, error: action.error });
      }
    }

    event.details.automatedActions = actions;

    return { success: true, results };
  }

  private async processEventBuffer(): Promise<void> {
    if (this.isProcessing || this.eventBuffer.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const eventsToProcess = [...this.eventBuffer];
      this.eventBuffer = [];

      for (const event of eventsToProcess) {
        await this.processEvent(event);
      }
    } catch (error) {
      console.error('Error processing security event buffer:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(event: SecurityEvent): Promise<void> {
    // Find related events
    event.relatedEvents = this.findRelatedEvents(event);

    // Check against security rules
    const matchingRules = this.findMatchingRules(event);

    for (const rule of matchingRules) {
      if (this.evaluateRuleConditions(rule, event)) {
        await this.triggerRule(rule, event);
      }
    }

    // Enhance event with threat intelligence
    await this.enrichWithThreatIntelligence(event);

    // Calculate risk score
    event.riskScore = this.calculateRiskScore(
      event.eventType,
      event.severity,
      event.details,
      event
    );
  }

  private findRelatedEvents(event: SecurityEvent): string[] {
    const relatedEvents = [];
    const timeWindow = 30 * 60 * 1000; // 30 minutes
    const startTime = event.timestamp.getTime() - timeWindow;
    const endTime = event.timestamp.getTime() + timeWindow;

    for (const [id, otherEvent] of this.events.entries()) {
      if (id === event.id) continue;
      
      const otherTime = otherEvent.timestamp.getTime();
      if (otherTime >= startTime && otherTime <= endTime) {
        // Check for correlation
        if (this.areEventsRelated(event, otherEvent)) {
          relatedEvents.push(id);
        }
      }
    }

    return relatedEvents;
  }

  private areEventsRelated(event1: SecurityEvent, event2: SecurityEvent): boolean {
    // Same user
    if (event1.userId && event1.userId === event2.userId) return true;
    
    // Same IP address
    if (event1.ipAddress && event1.ipAddress === event2.ipAddress) return true;
    
    // Same resource
    if (event1.resource && event1.resource === event2.resource) return true;
    
    // Related event types
    const relatedTypes: Record<SecurityEventType, SecurityEventType[]> = {
      'multiple_failed_logins': ['suspicious_login', 'brute_force_attack'],
      'suspicious_login': ['multiple_failed_logins', 'credential_stuffing'],
      'privilege_escalation': ['unauthorized_access_attempt', 'permission_abuse']
    } as any;
    
    return relatedTypes[event1.eventType]?.includes(event2.eventType) || false;
  }

  private findMatchingRules(event: SecurityEvent): SecurityRule[] {
    return Array.from(this.rules.values()).filter(rule => 
      rule.isActive && rule.eventTypes.includes(event.eventType)
    );
  }

  private evaluateRuleConditions(rule: SecurityRule, event: SecurityEvent): boolean {
    for (const condition of rule.conditions) {
      if (!this.evaluateCondition(condition, event)) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(condition: SecurityCondition, event: SecurityEvent): boolean {
    const fieldValue = this.getFieldValue(event, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return fieldValue > condition.value;
      case 'less_than':
        return fieldValue < condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'not_contains':
        return !String(fieldValue).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'regex':
        return new RegExp(condition.value).test(String(fieldValue));
      default:
        return false;
    }
  }

  private getFieldValue(event: SecurityEvent, field: string): any {
    const fieldPath = field.split('.');
    let value: any = event;
    
    for (const part of fieldPath) {
      value = value?.[part];
    }
    
    return value;
  }

  private async triggerRule(rule: SecurityRule, event: SecurityEvent): Promise<void> {
    rule.triggeredCount++;
    rule.lastTriggered = new Date();

    // Check threshold
    if (rule.threshold) {
      const recentEvents = this.getRecentEvents(
        event.eventType,
        rule.threshold.timeWindow,
        rule.threshold.aggregationField
      );
      
      if (recentEvents.length < rule.threshold.count) {
        return; // Threshold not met
      }
    }

    // Execute rule actions
    for (const action of rule.actions) {
      try {
        await this.executeRuleAction(action, rule, event);
      } catch (error) {
        console.error(`Failed to execute rule action ${action.type}:`, error);
      }
    }
  }

  private getRecentEvents(
    eventType: SecurityEventType,
    timeWindow: number,
    aggregationField?: string
  ): SecurityEvent[] {
    const cutoffTime = new Date(Date.now() - timeWindow);
    
    return Array.from(this.events.values()).filter(event =>
      event.eventType === eventType && event.timestamp >= cutoffTime
    );
  }

  private async executeRuleAction(
    action: RuleAction,
    rule: SecurityRule,
    event: SecurityEvent
  ): Promise<void> {
    switch (action.type) {
      case 'create_alert':
        await this.createAlert(rule, [event.id]);
        break;
      case 'send_notification':
        await this.sendNotification(action.config, event);
        break;
      case 'log_event':
        await this.logRuleExecution(rule, event, action);
        break;
      // Add more action types as needed
    }
  }

  private async createAlert(rule: SecurityRule, eventIds: string[]): Promise<void> {
    const alertId = this.generateId('security_alert');
    const events = eventIds.map(id => this.events.get(id)).filter(Boolean) as SecurityEvent[];
    const severity = this.calculateAlertSeverity(events);
    
    const alert: SecurityAlert = {
      id: alertId,
      ruleId: rule.id,
      ruleName: rule.name,
      events: eventIds,
      severity,
      status: 'open',
      createdAt: new Date(),
      escalationLevel: 0,
      notificationsSent: [],
      tags: [],
      relatedAlerts: [],
      responseActions: []
    };

    this.alerts.set(alertId, alert);
  }

  private calculateAlertSeverity(events: SecurityEvent[]): SecurityEvent['severity'] {
    const severityScores = { low: 1, medium: 2, high: 3, critical: 4 };
    const maxSeverity = Math.max(...events.map(e => severityScores[e.severity]));
    
    const severityMap = { 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' } as const;
    return severityMap[maxSeverity as keyof typeof severityMap];
  }

  private async sendNotification(config: Record<string, any>, event: SecurityEvent): Promise<void> {
    // Implementation would send actual notifications
    console.log('Notification would be sent:', config, event.eventType);
  }

  private async logRuleExecution(
    rule: SecurityRule,
    event: SecurityEvent,
    action: RuleAction
  ): Promise<void> {
    await auditLogger.logAction({
      userId: 'system',
      userEmail: 'system',
      userRole: 'system',
      action: 'EXECUTE_SECURITY_RULE',
      resource: 'security_monitoring',
      resourceId: rule.id,
      status: 'success',
      details: {
        ruleName: rule.name,
        eventId: event.id,
        eventType: event.eventType,
        actionType: action.type
      }
    });
  }

  private async executeAction(action: AutomatedAction, event: SecurityEvent): Promise<string> {
    switch (action.action) {
      case 'block_ip':
        return this.blockIPAddress(event.ipAddress || '');
      case 'disable_user':
        return this.disableUser(event.userId || '');
      case 'revoke_session':
        return this.revokeUserSession(event.userId || '');
      case 'escalate_alert':
        return this.escalateAlert(event);
      case 'notify_admin':
        return this.notifyAdmin(event);
      default:
        throw new Error(`Unknown action: ${action.action}`);
    }
  }

  private async blockIPAddress(ipAddress: string): Promise<string> {
    // Implementation would actually block the IP
    return `IP ${ipAddress} blocked`;
  }

  private async disableUser(userId: string): Promise<string> {
    // Implementation would disable the user
    return `User ${userId} disabled`;
  }

  private async revokeUserSession(userId: string): Promise<string> {
    // Implementation would revoke user sessions
    return `Sessions for user ${userId} revoked`;
  }

  private async escalateAlert(event: SecurityEvent): Promise<string> {
    // Implementation would escalate the alert
    return `Alert for event ${event.id} escalated`;
  }

  private async notifyAdmin(event: SecurityEvent): Promise<string> {
    // Implementation would notify administrators
    return `Admin notified about event ${event.id}`;
  }

  private async enrichWithThreatIntelligence(event: SecurityEvent): Promise<void> {
    if (event.ipAddress) {
      const threatInfo = this.threatIntelligence.get(event.ipAddress);
      if (threatInfo) {
        event.details.indicators.push({
          type: 'ip_reputation',
          value: threatInfo.reputation,
          threshold: 50,
          confidence: threatInfo.confidence,
          description: `IP reputation: ${threatInfo.reputation}/100`
        });
      }
    }
  }

  private calculateRiskScore(
    eventType: SecurityEventType,
    severity: SecurityEvent['severity'],
    details: SecurityEventDetails,
    context: any
  ): number {
    let score = 0;

    // Base score by event type
    const eventTypeScores: Record<SecurityEventType, number> = {
      'suspicious_login': 30,
      'multiple_failed_logins': 40,
      'unusual_access_pattern': 25,
      'privilege_escalation': 80,
      'unauthorized_access_attempt': 70,
      'data_exfiltration': 95,
      'malicious_ip': 60,
      'anomalous_behavior': 35,
      'policy_violation': 45,
      'compliance_breach': 85,
      'insider_threat': 90,
      'brute_force_attack': 75
    } as any;

    score += eventTypeScores[eventType] || 20;

    // Severity multiplier
    const severityMultipliers = { low: 1, medium: 1.5, high: 2, critical: 3 };
    score *= severityMultipliers[severity];

    // Context-based adjustments
    if (context.userRole === 'admin') score *= 1.5;
    if (details.impact.scope === 'organization') score *= 2;
    if (details.indicators.some(i => i.confidence > 0.8)) score *= 1.3;

    return Math.min(100, Math.round(score));
  }

  private generateEventTags(
    eventType: SecurityEventType,
    source: SecurityEvent['source'],
    context: any
  ): string[] {
    const tags = [eventType, source];
    
    if (context.userRole) tags.push(context.userRole);
    if (context.resource) tags.push(context.resource);
    
    return tags;
  }

  private initializeDefaultRules(): void {
    const defaultRules: Omit<SecurityRule, 'id' | 'createdAt' | 'updatedAt' | 'triggeredCount'>[] = [
      {
        name: 'Multiple Failed Logins',
        description: 'Detect multiple failed login attempts from same IP',
        category: 'detection',
        eventTypes: ['multiple_failed_logins'],
        conditions: [
          { field: 'severity', operator: 'in', value: ['medium', 'high', 'critical'] }
        ],
        actions: [
          { type: 'create_alert', config: {} },
          { type: 'send_notification', config: { type: 'email', recipients: ['security@example.com'] } }
        ],
        threshold: { count: 5, timeWindow: 15 * 60 * 1000 },
        isActive: true,
        priority: 1,
        createdBy: 'system'
      },
      {
        name: 'Privilege Escalation Detection',
        description: 'Detect unauthorized privilege escalation attempts',
        category: 'detection',
        eventTypes: ['privilege_escalation'],
        conditions: [
          { field: 'severity', operator: 'in', value: ['high', 'critical'] }
        ],
        actions: [
          { type: 'create_alert', config: {} },
          { type: 'send_notification', config: { type: 'email', recipients: ['security@example.com'] } }
        ],
        threshold: { count: 1, timeWindow: 5 * 60 * 1000 },
        isActive: true,
        priority: 2,
        createdBy: 'system'
      }
    ];

    defaultRules.forEach(rule => {
      const ruleWithId: SecurityRule = {
        id: this.generateId('security_rule'),
        createdAt: new Date(),
        updatedAt: new Date(),
        triggeredCount: 0,
        ...rule
      };
      this.rules.set(ruleWithId.id, ruleWithId);
    });
  }

  private async updateThreatIntelligence(): Promise<void> {
    // This would integrate with external threat intelligence feeds
    // For now, it's a placeholder
  }

  private updateMetrics(): void {
    // This would update real-time metrics
    // For now, it's a placeholder
  }

  private cleanup(): void {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Remove old events (keep for 7 days)
    for (const [id, event] of this.events.entries()) {
      if (event.timestamp < sevenDaysAgo && event.status === 'resolved') {
        this.events.delete(id);
      }
    }
    
    // Remove old resolved alerts (keep for 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.status === 'resolved' && alert.resolvedAt && alert.resolvedAt < thirtyDaysAgo) {
        this.alerts.delete(id);
      }
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Singleton instance
export const securityMonitoringEngine = new SecurityMonitoringEngine();

// Utility functions
export const securityMonitoringUtils = {
  /**
   * Quick security event creation
   */
  async logSuspiciousLogin(
    userId: string,
    ipAddress: string,
    reason: string,
    userRole?: UserRoleCode
  ): Promise<void> {
    await securityMonitoringEngine.logSecurityEvent(
      'suspicious_login',
      'medium',
      'authentication',
      {
        description: `Suspicious login detected: ${reason}`,
        indicators: [
          {
            type: 'geolocation',
            value: 'unknown',
            threshold: 'known_locations',
            confidence: 0.7,
            description: reason
          }
        ],
        context: { reason },
        evidence: [],
        impact: {
          scope: 'user',
          affectedEntities: [userId],
          businessImpact: 'minimal'
        },
        recommendations: [
          'Verify user identity',
          'Check for compromised credentials',
          'Monitor user activity'
        ],
        automatedActions: []
      },
      { userId, ipAddress, userRole }
    );
  },

  /**
   * Log privilege escalation attempt
   */
  async logPrivilegeEscalation(
    userId: string,
    fromRole: UserRoleCode,
    toRole: UserRoleCode,
    resource: string
  ): Promise<void> {
    await securityMonitoringEngine.logSecurityEvent(
      'privilege_escalation',
      'high',
      'authorization',
      {
        description: `User attempted to escalate privileges from ${fromRole} to ${toRole}`,
        indicators: [
          {
            type: 'privilege_usage',
            value: { fromRole, toRole },
            threshold: 'authorized_escalation',
            confidence: 0.9,
            description: 'Unauthorized privilege escalation attempt'
          }
        ],
        context: { fromRole, toRole, resource },
        evidence: [],
        impact: {
          scope: 'system',
          affectedEntities: [userId, resource],
          businessImpact: 'significant'
        },
        recommendations: [
          'Block user access immediately',
          'Review user permissions',
          'Investigate user activity'
        ],
        automatedActions: []
      },
      { userId, resource, userRole: fromRole }
    );
  },

  /**
   * Get security dashboard summary
   */
  async getSecurityDashboard(): Promise<{
    openAlerts: number;
    criticalEvents: number;
    highRiskUsers: number;
    activeThreats: number;
    recentEvents: SecurityEvent[];
  }> {
    const openAlerts = securityMonitoringEngine.getSecurityAlerts('open').length;
    const criticalEvents = securityMonitoringEngine.getSecurityEvents({ severity: ['critical'] }, 50);
    const recentEvents = securityMonitoringEngine.getSecurityEvents({}, 10);
    
    return {
      openAlerts,
      criticalEvents: criticalEvents.length,
      highRiskUsers: criticalEvents.filter(e => e.riskScore > 70).length,
      activeThreats: criticalEvents.filter(e => 
        ['malicious_ip', 'insider_threat', 'data_exfiltration'].includes(e.eventType)
      ).length,
      recentEvents
    };
  }
};

export default securityMonitoringEngine;