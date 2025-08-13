import type { UserRole as UserRoleCode } from '@/types/entities';
import { auditLogger } from '@/lib/audit/audit-logger';

export interface IPAccessRule {
  id: string;
  name: string;
  description?: string;
  ruleType: 'allow' | 'deny' | 'restrict' | 'monitor';
  target: {
    userIds?: string[];
    roles?: UserRoleCode[];
    departments?: string[];
    committees?: string[];
    resources?: string[];
    permissions?: string[];
  };
  ipRestrictions: IPRestriction[];
  geoRestrictions?: GeoRestriction[];
  schedule?: {
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[];
    timezone?: string;
  };
  exceptions?: IPException[];
  priority: number;
  isActive: boolean;
  bypassMethods?: BypassMethod[];
  alertingEnabled: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface IPRestriction {
  type: 'single' | 'range' | 'cidr' | 'whitelist' | 'blacklist';
  value: string | string[];
  description?: string;
  
  // Single IP: "192.168.1.100"
  // Range: "192.168.1.1-192.168.1.255"
  // CIDR: "192.168.1.0/24"
  // Whitelist/Blacklist: ["192.168.1.100", "10.0.0.0/8"]
}

export interface GeoRestriction {
  type: 'country' | 'region' | 'city' | 'continent';
  allowed: string[]; // ISO country codes, region names, etc.
  denied: string[];
  description?: string;
}

export interface IPException {
  id: string;
  name: string;
  ipAddresses: string[];
  reason: string;
  startDate: Date;
  endDate: Date;
  approvedBy: string;
  approvedAt: Date;
  isActive: boolean;
}

export interface BypassMethod {
  type: 'vpn_detection' | 'trusted_proxy' | 'emergency_code' | 'admin_override';
  config: Record<string, any>;
  enabled: boolean;
}

export interface IPAccessQuery {
  userId: string;
  userRole?: UserRoleCode;
  department?: string;
  committee?: string;
  resource?: string;
  permission?: string;
  ipAddress: string;
  userAgent?: string;
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    continent?: string;
  };
  context?: Record<string, any>;
}

export interface IPAccessResult {
  allowed: boolean;
  ruleApplied?: IPAccessRule;
  restrictionType?: string;
  bypassUsed?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresAdditionalAuth?: boolean;
  alertGenerated: boolean;
  details: {
    matchedRestrictions: string[];
    geoLocation?: any;
    vpnDetected?: boolean;
    proxyDetected?: boolean;
    threatIntelligence?: any;
  };
}

export interface IPThreatIntelligence {
  ipAddress: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  categories: string[]; // ['malware', 'botnet', 'tor', 'proxy', 'vpn']
  reputation: number; // 0-100, lower is worse
  lastSeen: Date;
  sources: string[];
  details: Record<string, any>;
}

export interface IPAccessLog {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  permission: string;
  allowed: boolean;
  ruleId?: string;
  riskLevel: string;
  geolocation?: any;
  timestamp: Date;
  sessionId?: string;
}

class IPBasedAccessManager {
  private rules: Map<string, IPAccessRule> = new Map();
  private threatIntelligence: Map<string, IPThreatIntelligence> = new Map();
  private accessLogs: IPAccessLog[] = [];
  private trustedProxies: Set<string> = new Set();
  private suspiciousIPCache: Map<string, { riskLevel: string; expires: number }> = new Map();

  constructor() {
    // Initialize trusted proxies (Cloudflare, common CDNs)
    this.initializeTrustedProxies();
    
    // Clean up old logs and cache every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
    
    // Update threat intelligence every 4 hours
    setInterval(() => this.updateThreatIntelligence(), 4 * 60 * 60 * 1000);
  }

  /**
   * Create an IP access rule
   */
  async createIPRule(
    rule: Omit<IPAccessRule, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<IPAccessRule> {
    const ruleId = this.generateId('ip_rule');
    
    const ipRule: IPAccessRule = {
      id: ruleId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...rule
    };

    this.rules.set(ruleId, ipRule);

    // Audit log
    await auditLogger.logAction({
      userId: createdBy,
      userEmail: createdBy,
      userRole: 'admin',
      action: 'CREATE_IP_RULE',
      resource: 'ip_based_access',
      resourceId: ruleId,
      status: 'success',
      details: {
        ruleName: rule.name,
        ruleType: rule.ruleType,
        target: rule.target,
        ipRestrictions: rule.ipRestrictions.length
      }
    });

    return ipRule;
  }

  /**
   * Check IP-based access
   */
  async checkIPAccess(query: IPAccessQuery): Promise<IPAccessResult> {
    const clientIP = this.extractClientIP(query.ipAddress);
    const applicableRules = this.getApplicableRules(query);
    
    let allowed = true;
    let ruleApplied: IPAccessRule | undefined;
    let restrictionType: string | undefined;
    let bypassUsed: string | undefined;
    let riskLevel: IPAccessResult['riskLevel'] = 'low';
    let requiresAdditionalAuth = false;
    let alertGenerated = false;
    
    const matchedRestrictions: string[] = [];
    
    // Check threat intelligence
    const threatInfo = await this.checkThreatIntelligence(clientIP);
    if (threatInfo && threatInfo.threatLevel !== 'low') {
      riskLevel = threatInfo.threatLevel;
      matchedRestrictions.push(`Threat intelligence: ${threatInfo.categories.join(', ')}`);
    }

    // Evaluate rules in priority order
    for (const rule of applicableRules) {
      const ruleResult = await this.evaluateIPRule(rule, query, clientIP);
      
      if (ruleResult.matches) {
        ruleApplied = rule;
        
        switch (rule.ruleType) {
          case 'deny':
            allowed = false;
            restrictionType = 'IP_DENIED';
            matchedRestrictions.push(`Denied by rule: ${rule.name}`);
            break;
            
          case 'allow':
            allowed = true;
            restrictionType = 'IP_ALLOWED';
            matchedRestrictions.push(`Allowed by rule: ${rule.name}`);
            break;
            
          case 'restrict':
            requiresAdditionalAuth = true;
            restrictionType = 'IP_RESTRICTED';
            matchedRestrictions.push(`Restricted by rule: ${rule.name}`);
            break;
            
          case 'monitor':
            restrictionType = 'IP_MONITORED';
            matchedRestrictions.push(`Monitored by rule: ${rule.name}`);
            break;
        }
        
        // Check for bypass methods if access would be denied
        if (!allowed && rule.bypassMethods) {
          const bypass = await this.checkBypassMethods(rule.bypassMethods, query);
          if (bypass.allowed) {
            allowed = true;
            bypassUsed = bypass.method;
            requiresAdditionalAuth = true;
          }
        }
        
        break; // First matching rule wins
      }
    }

    // Check for suspicious patterns
    const suspiciousActivity = await this.detectSuspiciousActivity(clientIP, query);
    if (suspiciousActivity.detected) {
      riskLevel = suspiciousActivity.riskLevel as IPAccessResult['riskLevel'];
      matchedRestrictions.push(...suspiciousActivity.reasons);
    }

    // Generate alerts if needed
    if (ruleApplied?.alertingEnabled && (!allowed || riskLevel === 'high' || riskLevel === 'critical')) {
      alertGenerated = true;
      await this.generateSecurityAlert(query, ruleApplied, riskLevel, matchedRestrictions);
    }

    // Log access attempt
    await this.logIPAccess({
      userId: query.userId,
      ipAddress: clientIP,
      userAgent: query.userAgent || '',
      resource: query.resource || '',
      permission: query.permission || '',
      allowed,
      ruleId: ruleApplied?.id,
      riskLevel,
      geolocation: query.geolocation,
      timestamp: new Date()
    });

    return {
      allowed,
      ruleApplied,
      restrictionType,
      bypassUsed,
      riskLevel,
      requiresAdditionalAuth,
      alertGenerated,
      details: {
        matchedRestrictions,
        geoLocation: query.geolocation,
        vpnDetected: threatInfo?.categories.includes('vpn'),
        proxyDetected: threatInfo?.categories.includes('proxy'),
        threatIntelligence: threatInfo
      }
    };
  }

  /**
   * Add IP exception
   */
  async addIPException(
    ruleId: string,
    exception: Omit<IPException, 'id' | 'approvedAt'>,
    approvedBy: string
  ): Promise<{ success: boolean; exceptionId: string }> {
    const rule = this.rules.get(ruleId);
    
    if (!rule) {
      return { success: false, exceptionId: '' };
    }

    const exceptionId = this.generateId('ip_exception');
    const ipException: IPException = {
      id: exceptionId,
      approvedAt: new Date(),
      ...exception
    };

    if (!rule.exceptions) {
      rule.exceptions = [];
    }
    rule.exceptions.push(ipException);
    rule.updatedAt = new Date();

    // Audit log
    await auditLogger.logAction({
      userId: approvedBy,
      userEmail: approvedBy,
      userRole: 'admin',
      action: 'ADD_IP_EXCEPTION',
      resource: 'ip_based_access',
      resourceId: ruleId,
      status: 'success',
      details: {
        exceptionId,
        ipAddresses: exception.ipAddresses,
        reason: exception.reason
      }
    });

    return { success: true, exceptionId };
  }

  /**
   * Update threat intelligence for an IP
   */
  updateIPThreatIntelligence(
    ipAddress: string,
    threatInfo: Omit<IPThreatIntelligence, 'ipAddress' | 'lastSeen'>
  ): void {
    this.threatIntelligence.set(ipAddress, {
      ipAddress,
      lastSeen: new Date(),
      ...threatInfo
    });
  }

  /**
   * Get IP access analytics
   */
  getIPAccessAnalytics(hours = 24): {
    totalAttempts: number;
    allowedAttempts: number;
    deniedAttempts: number;
    uniqueIPs: number;
    topDeniedIPs: { ip: string; count: number; riskLevel: string }[];
    geographicDistribution: Record<string, number>;
    riskLevelDistribution: Record<string, number>;
    bypassUsage: Record<string, number>;
  } {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentLogs = this.accessLogs.filter(log => log.timestamp >= cutoffTime);
    
    const totalAttempts = recentLogs.length;
    const allowedAttempts = recentLogs.filter(log => log.allowed).length;
    const deniedAttempts = totalAttempts - allowedAttempts;
    const uniqueIPs = new Set(recentLogs.map(log => log.ipAddress)).size;
    
    // Top denied IPs
    const deniedIPCounts: Record<string, { count: number; riskLevel: string }> = {};
    recentLogs.filter(log => !log.allowed).forEach(log => {
      if (!deniedIPCounts[log.ipAddress]) {
        deniedIPCounts[log.ipAddress] = { count: 0, riskLevel: log.riskLevel };
      }
      deniedIPCounts[log.ipAddress].count++;
    });
    
    const topDeniedIPs = Object.entries(deniedIPCounts)
      .map(([ip, data]) => ({ ip, count: data.count, riskLevel: data.riskLevel }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Geographic distribution
    const geographicDistribution: Record<string, number> = {};
    recentLogs.forEach(log => {
      if (log.geolocation?.country) {
        geographicDistribution[log.geolocation.country] = 
          (geographicDistribution[log.geolocation.country] || 0) + 1;
      }
    });
    
    // Risk level distribution
    const riskLevelDistribution: Record<string, number> = {};
    recentLogs.forEach(log => {
      riskLevelDistribution[log.riskLevel] = (riskLevelDistribution[log.riskLevel] || 0) + 1;
    });
    
    // Bypass usage (simplified)
    const bypassUsage: Record<string, number> = {};
    
    return {
      totalAttempts,
      allowedAttempts,
      deniedAttempts,
      uniqueIPs,
      topDeniedIPs,
      geographicDistribution,
      riskLevelDistribution,
      bypassUsage
    };
  }

  private async evaluateIPRule(
    rule: IPAccessRule,
    query: IPAccessQuery,
    clientIP: string
  ): Promise<{ matches: boolean }> {
    // Check if rule applies to this user/resource
    if (!this.isRuleApplicable(rule, query)) {
      return { matches: false };
    }

    // Check schedule if specified
    if (rule.schedule && !this.isWithinSchedule(rule.schedule)) {
      return { matches: false };
    }

    // Check IP restrictions
    for (const restriction of rule.ipRestrictions) {
      if (await this.matchesIPRestriction(restriction, clientIP)) {
        return { matches: true };
      }
    }

    // Check geo restrictions
    if (rule.geoRestrictions && query.geolocation) {
      for (const geoRestriction of rule.geoRestrictions) {
        if (this.matchesGeoRestriction(geoRestriction, query.geolocation)) {
          return { matches: true };
        }
      }
    }

    // Check exceptions
    if (rule.exceptions) {
      for (const exception of rule.exceptions) {
        if (this.matchesIPException(exception, clientIP)) {
          return { matches: false }; // Exception overrides rule
        }
      }
    }

    return { matches: false };
  }

  private async matchesIPRestriction(restriction: IPRestriction, clientIP: string): Promise<boolean> {
    switch (restriction.type) {
      case 'single':
        return clientIP === restriction.value;
        
      case 'range':
        return this.isIPInRange(clientIP, restriction.value as string);
        
      case 'cidr':
        return this.isIPInCIDR(clientIP, restriction.value as string);
        
      case 'whitelist':
        return (restriction.value as string[]).some(ip => 
          this.isIPMatch(clientIP, ip)
        );
        
      case 'blacklist':
        return (restriction.value as string[]).some(ip => 
          this.isIPMatch(clientIP, ip)
        );
        
      default:
        return false;
    }
  }

  private matchesGeoRestriction(restriction: GeoRestriction, geolocation: any): boolean {
    const value = geolocation[restriction.type];
    if (!value) return false;
    
    if (restriction.allowed.length > 0) {
      return restriction.allowed.includes(value);
    }
    
    if (restriction.denied.length > 0) {
      return restriction.denied.includes(value);
    }
    
    return false;
  }

  private matchesIPException(exception: IPException, clientIP: string): boolean {
    if (!exception.isActive) return false;
    
    const now = new Date();
    if (now < exception.startDate || now > exception.endDate) return false;
    
    return exception.ipAddresses.some(ip => this.isIPMatch(clientIP, ip));
  }

  private isIPMatch(clientIP: string, pattern: string): boolean {
    if (pattern.includes('/')) {
      return this.isIPInCIDR(clientIP, pattern);
    }
    if (pattern.includes('-')) {
      return this.isIPInRange(clientIP, pattern);
    }
    return clientIP === pattern;
  }

  private isIPInRange(ip: string, range: string): boolean {
    const [start, end] = range.split('-');
    return this.ipToNumber(ip) >= this.ipToNumber(start) && 
           this.ipToNumber(ip) <= this.ipToNumber(end);
  }

  private isIPInCIDR(ip: string, cidr: string): boolean {
    const [network, prefixLength] = cidr.split('/');
    const mask = (0xffffffff << (32 - parseInt(prefixLength))) >>> 0;
    
    return (this.ipToNumber(ip) & mask) === (this.ipToNumber(network) & mask);
  }

  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => acc * 256 + parseInt(octet), 0);
  }

  private extractClientIP(ipAddress: string): string {
    // Handle X-Forwarded-For header format
    if (ipAddress.includes(',')) {
      return ipAddress.split(',')[0].trim();
    }
    return ipAddress;
  }

  private getApplicableRules(query: IPAccessQuery): IPAccessRule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.isActive && this.isRuleApplicable(rule, query))
      .sort((a, b) => b.priority - a.priority);
  }

  private isRuleApplicable(rule: IPAccessRule, query: IPAccessQuery): boolean {
    const { target } = rule;
    
    if (target.userIds && !target.userIds.includes(query.userId)) return false;
    if (target.roles && query.userRole && !target.roles.includes(query.userRole)) return false;
    if (target.departments && query.department && !target.departments.includes(query.department)) return false;
    if (target.committees && query.committee && !target.committees.includes(query.committee)) return false;
    if (target.resources && query.resource && !target.resources.includes(query.resource)) return false;
    if (target.permissions && query.permission && !target.permissions.includes(query.permission)) return false;
    
    return true;
  }

  private isWithinSchedule(schedule: NonNullable<IPAccessRule['schedule']>): boolean {
    const now = new Date();
    
    if (schedule.daysOfWeek && !schedule.daysOfWeek.includes(now.getDay())) {
      return false;
    }
    
    if (schedule.startTime && schedule.endTime) {
      const currentTime = now.toTimeString().substring(0, 5);
      if (currentTime < schedule.startTime || currentTime > schedule.endTime) {
        return false;
      }
    }
    
    return true;
  }

  private async checkThreatIntelligence(ipAddress: string): Promise<IPThreatIntelligence | null> {
    return this.threatIntelligence.get(ipAddress) || null;
  }

  private async detectSuspiciousActivity(
    ipAddress: string,
    query: IPAccessQuery
  ): Promise<{ detected: boolean; riskLevel: string; reasons: string[] }> {
    const reasons: string[] = [];
    let riskLevel = 'low';
    
    // Check for multiple failed attempts from same IP
    const recentLogs = this.accessLogs.filter(log => 
      log.ipAddress === ipAddress && 
      log.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );
    
    const failedAttempts = recentLogs.filter(log => !log.allowed).length;
    if (failedAttempts > 5) {
      reasons.push(`Multiple failed attempts: ${failedAttempts}`);
      riskLevel = failedAttempts > 10 ? 'high' : 'medium';
    }
    
    // Check for unusual geographic location
    if (query.geolocation?.country) {
      const userLogs = this.accessLogs.filter(log => log.userId === query.userId);
      const commonCountries = this.getMostCommonCountries(userLogs, 3);
      
      if (!commonCountries.includes(query.geolocation.country)) {
        reasons.push(`Unusual geographic location: ${query.geolocation.country}`);
        riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
      }
    }
    
    return {
      detected: reasons.length > 0,
      riskLevel,
      reasons
    };
  }

  private getMostCommonCountries(logs: IPAccessLog[], limit: number): string[] {
    const countryCounts: Record<string, number> = {};
    
    logs.forEach(log => {
      if (log.geolocation?.country) {
        countryCounts[log.geolocation.country] = 
          (countryCounts[log.geolocation.country] || 0) + 1;
      }
    });
    
    return Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([country]) => country);
  }

  private async checkBypassMethods(
    bypassMethods: BypassMethod[],
    query: IPAccessQuery
  ): Promise<{ allowed: boolean; method?: string }> {
    for (const method of bypassMethods) {
      if (!method.enabled) continue;
      
      switch (method.type) {
        case 'emergency_code':
          // Check if emergency code is provided in context
          if (query.context?.emergencyCode === method.config.code) {
            return { allowed: true, method: 'emergency_code' };
          }
          break;
          
        case 'admin_override':
          // Check if admin override is active
          if (query.context?.adminOverride === true) {
            return { allowed: true, method: 'admin_override' };
          }
          break;
          
        case 'trusted_proxy':
          // Check if request comes through trusted proxy
          if (this.isTrustedProxy(query.ipAddress)) {
            return { allowed: true, method: 'trusted_proxy' };
          }
          break;
      }
    }
    
    return { allowed: false };
  }

  private isTrustedProxy(ipAddress: string): boolean {
    return this.trustedProxies.has(ipAddress);
  }

  private async generateSecurityAlert(
    query: IPAccessQuery,
    rule: IPAccessRule,
    riskLevel: string,
    reasons: string[]
  ): Promise<void> {
    await auditLogger.logAction({
      userId: query.userId,
      userEmail: query.userId,
      userRole: query.userRole || 'unknown',
      action: 'SECURITY_ALERT_IP_ACCESS',
      resource: 'ip_security',
      resourceId: rule.id,
      status: 'success',
      details: {
        ipAddress: query.ipAddress,
        riskLevel,
        reasons,
        rule: rule.name,
        geolocation: query.geolocation
      }
    });
  }

  private async logIPAccess(log: Omit<IPAccessLog, 'id'>): Promise<void> {
    const accessLog: IPAccessLog = {
      id: this.generateId('ip_access'),
      ...log
    };
    
    this.accessLogs.push(accessLog);
    
    // Keep only last 10000 logs in memory
    if (this.accessLogs.length > 10000) {
      this.accessLogs = this.accessLogs.slice(-10000);
    }
  }

  private initializeTrustedProxies(): void {
    // Common trusted proxy ranges (Cloudflare, AWS, etc.)
    const trustedRanges = [
      '173.245.48.0/20',
      '103.21.244.0/22',
      '103.22.200.0/22',
      '103.31.4.0/22',
      '141.101.64.0/18',
      '108.162.192.0/18',
      '190.93.240.0/20'
    ];
    
    // This would be expanded to include actual CIDR range checking
    trustedRanges.forEach(range => this.trustedProxies.add(range));
  }

  private async updateThreatIntelligence(): Promise<void> {
    // This would integrate with external threat intelligence feeds
    // For now, it's a placeholder
  }

  private cleanup(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Remove old access logs
    this.accessLogs = this.accessLogs.filter(log => log.timestamp > oneDayAgo);
    
    // Clean up suspicious IP cache
    const now = Date.now();
    for (const [ip, cached] of this.suspiciousIPCache.entries()) {
      if (now >= cached.expires) {
        this.suspiciousIPCache.delete(ip);
      }
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Singleton instance
export const ipBasedAccessManager = new IPBasedAccessManager();

// Utility functions for integration
export const ipAccessUtils = {
  /**
   * Create a simple IP whitelist rule
   */
  async createIPWhitelist(
    name: string,
    allowedIPs: string[],
    target: IPAccessRule['target'],
    createdBy: string
  ): Promise<IPAccessRule> {
    return ipBasedAccessManager.createIPRule({
      name,
      ruleType: 'allow',
      target,
      ipRestrictions: [{
        type: 'whitelist',
        value: allowedIPs,
        description: 'Allowed IP addresses'
      }],
      priority: 1,
      isActive: true,
      alertingEnabled: false,
      createdBy
    }, createdBy);
  },

  /**
   * Create a geographic restriction rule
   */
  async createGeoRestriction(
    name: string,
    allowedCountries: string[],
    target: IPAccessRule['target'],
    createdBy: string
  ): Promise<IPAccessRule> {
    return ipBasedAccessManager.createIPRule({
      name,
      ruleType: 'allow',
      target,
      ipRestrictions: [],
      geoRestrictions: [{
        type: 'country',
        allowed: allowedCountries,
        denied: [],
        description: 'Geographic access restriction'
      }],
      priority: 2,
      isActive: true,
      alertingEnabled: true,
      createdBy
    }, createdBy);
  },

  /**
   * Block suspicious IP addresses
   */
  async blockSuspiciousIPs(
    suspiciousIPs: string[],
    reason: string,
    createdBy: string
  ): Promise<IPAccessRule> {
    return ipBasedAccessManager.createIPRule({
      name: `Suspicious IP Block - ${reason}`,
      description: `Automatically generated rule to block suspicious IPs: ${reason}`,
      ruleType: 'deny',
      target: {}, // Apply to all users
      ipRestrictions: [{
        type: 'blacklist',
        value: suspiciousIPs,
        description: `Suspicious IPs blocked for: ${reason}`
      }],
      priority: 10, // High priority
      isActive: true,
      alertingEnabled: true,
      createdBy
    }, createdBy);
  },

  /**
   * Check if IP address is allowed
   */
  async isIPAllowed(
    userId: string,
    ipAddress: string,
    resource?: string,
    permission?: string,
    userRole?: UserRoleCode
  ): Promise<boolean> {
    const result = await ipBasedAccessManager.checkIPAccess({
      userId,
      userRole,
      resource,
      permission,
      ipAddress
    });
    
    return result.allowed;
  }
};

export default ipBasedAccessManager;