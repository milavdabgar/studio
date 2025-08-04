'use client';

/**
 * RBAC Settings Component - System configuration and preferences
 * Provides comprehensive settings management for the RBAC system
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Shield, 
  Clock, 
  Bell, 
  Users, 
  Key, 
  Database,
  AlertTriangle,
  CheckCircle,
  Save,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  RefreshCw
} from 'lucide-react';

// Types
import type { UserRole } from '@/types/entities';

interface RBACSettingsProps {
  currentUser: {
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
  };
}

interface RBACConfig {
  general: {
    systemName: string;
    defaultRole: UserRole;
    autoApprovalThreshold: number;
    sessionTimeout: number;
    maxConcurrentSessions: number;
    requireMFAForAdmins: boolean;
    enableAuditLogging: boolean;
  };
  security: {
    passwordComplexity: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
    accountLockout: {
      enabled: boolean;
      maxAttempts: number;
      lockoutDuration: number;
    };
    riskThresholds: {
      low: number;
      medium: number;
      high: number;
    };
  };
  notifications: {
    emailEnabled: boolean;
    slackEnabled: boolean;
    webhookEnabled: boolean;
    alertThresholds: {
      securityEvents: number;
      complianceViolations: number;
      riskScoreIncrease: number;
    };
    emailSettings: {
      smtpServer: string;
      smtpPort: number;
      username: string;
      fromAddress: string;
    };
    webhookUrl: string;
  };
  compliance: {
    enabledFrameworks: string[];
    auditRetentionPeriod: number;
    automaticReporting: boolean;
    reportingSchedule: string;
  };
  performance: {
    cacheTimeout: number;
    batchSize: number;
    asyncProcessing: boolean;
    maxConcurrentOperations: number;
  };
}

export function RBACSettings({ currentUser }: RBACSettingsProps) {
  const [config, setConfig] = useState<RBACConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/rbac/settings');
      if (!response.ok) throw new Error('Failed to load settings');
      
      const settingsData = await response.json();
      setConfig(settingsData.config || getDefaultConfig());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      console.error('Settings loading error:', err);
      setConfig(getDefaultConfig()); // Fallback to defaults
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!config) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/rbac/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });

      if (!response.ok) throw new Error('Failed to save settings');
      
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      console.error('Settings save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setConfig(getDefaultConfig());
    setSuccess('Settings reset to defaults');
    setTimeout(() => setSuccess(null), 3000);
  };

  const exportSettings = () => {
    if (!config) return;
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `rbac-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // Permission checks
  const canManageSettings = currentUser.permissions.includes('rbac.settings.manage') || 
                           currentUser.role === 'super_admin';

  if (!canManageSettings) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
            <DialogDescription>
              You don't have permission to access RBAC settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (loading) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <RBACSettingsSkeleton />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            RBAC System Settings
          </DialogTitle>
          <DialogDescription>
            Configure system-wide RBAC settings, security policies, and preferences
          </DialogDescription>
        </DialogHeader>

        {config && (
          <div className="space-y-6">
            {/* Status Alerts */}
            {error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Settings Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general" className="flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  General
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  Alerts
                </TabsTrigger>
                <TabsTrigger value="compliance" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Compliance
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Performance
                </TabsTrigger>
              </TabsList>

              {/* General Settings */}
              <TabsContent value="general" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">General Configuration</CardTitle>
                    <CardDescription>Basic system settings and defaults</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="systemName">System Name</Label>
                        <Input
                          id="systemName"
                          value={config.general.systemName}
                          onChange={(e) => setConfig(prev => prev ? {
                            ...prev,
                            general: { ...prev.general, systemName: e.target.value }
                          } : prev)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="defaultRole">Default Role</Label>
                        <Select 
                          value={config.general.defaultRole} 
                          onValueChange={(value: UserRole) => setConfig(prev => prev ? {
                            ...prev,
                            general: { ...prev.general, defaultRole: value }
                          } : prev)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="faculty">Faculty</SelectItem>
                            <SelectItem value="hod">HOD</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                        <Input
                          id="sessionTimeout"
                          type="number"
                          value={config.general.sessionTimeout}
                          onChange={(e) => setConfig(prev => prev ? {
                            ...prev,
                            general: { ...prev.general, sessionTimeout: parseInt(e.target.value) || 0 }
                          } : prev)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="maxSessions">Max Concurrent Sessions</Label>
                        <Input
                          id="maxSessions"
                          type="number"
                          value={config.general.maxConcurrentSessions}
                          onChange={(e) => setConfig(prev => prev ? {
                            ...prev,
                            general: { ...prev.general, maxConcurrentSessions: parseInt(e.target.value) || 0 }
                          } : prev)}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Require MFA for Administrators</Label>
                          <p className="text-sm text-muted-foreground">
                            Enforce multi-factor authentication for admin accounts
                          </p>
                        </div>
                        <Switch
                          checked={config.general.requireMFAForAdmins}
                          onCheckedChange={(checked) => setConfig(prev => prev ? {
                            ...prev,
                            general: { ...prev.general, requireMFAForAdmins: checked }
                          } : prev)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Audit Logging</Label>
                          <p className="text-sm text-muted-foreground">
                            Log all RBAC operations for compliance and security
                          </p>
                        </div>
                        <Switch
                          checked={config.general.enableAuditLogging}
                          onCheckedChange={(checked) => setConfig(prev => prev ? {
                            ...prev,
                            general: { ...prev.general, enableAuditLogging: checked }
                          } : prev)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Settings */}
              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Password Policy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="minLength">Minimum Length</Label>
                      <Input
                        id="minLength"
                        type="number"
                        value={config.security.passwordComplexity.minLength}
                        onChange={(e) => setConfig(prev => prev ? {
                          ...prev,
                          security: {
                            ...prev.security,
                            passwordComplexity: {
                              ...prev.security.passwordComplexity,
                              minLength: parseInt(e.target.value) || 8
                            }
                          }
                        } : prev)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label>Require Uppercase</Label>
                        <Switch
                          checked={config.security.passwordComplexity.requireUppercase}
                          onCheckedChange={(checked) => setConfig(prev => prev ? {
                            ...prev,
                            security: {
                              ...prev.security,
                              passwordComplexity: {
                                ...prev.security.passwordComplexity,
                                requireUppercase: checked
                              }
                            }
                          } : prev)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Require Numbers</Label>
                        <Switch
                          checked={config.security.passwordComplexity.requireNumbers}
                          onCheckedChange={(checked) => setConfig(prev => prev ? {
                            ...prev,
                            security: {
                              ...prev.security,
                              passwordComplexity: {
                                ...prev.security.passwordComplexity,
                                requireNumbers: checked
                              }
                            }
                          } : prev)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Risk Thresholds</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="lowRisk">Low Risk (0-)</Label>
                        <Input
                          id="lowRisk"
                          type="number"
                          value={config.security.riskThresholds.low}
                          onChange={(e) => setConfig(prev => prev ? {
                            ...prev,
                            security: {
                              ...prev.security,
                              riskThresholds: {
                                ...prev.security.riskThresholds,
                                low: parseInt(e.target.value) || 30
                              }
                            }
                          } : prev)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="mediumRisk">Medium Risk (-)</Label>
                        <Input
                          id="mediumRisk"
                          type="number"
                          value={config.security.riskThresholds.medium}
                          onChange={(e) => setConfig(prev => prev ? {
                            ...prev,
                            security: {
                              ...prev.security,
                              riskThresholds: {
                                ...prev.security.riskThresholds,
                                medium: parseInt(e.target.value) || 70
                              }
                            }
                          } : prev)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="highRisk">High Risk (-100)</Label>
                        <Input
                          id="highRisk"
                          type="number"
                          value={config.security.riskThresholds.high}
                          onChange={(e) => setConfig(prev => prev ? {
                            ...prev,
                            security: {
                              ...prev.security,
                              riskThresholds: {
                                ...prev.security.riskThresholds,
                                high: parseInt(e.target.value) || 90
                              }
                            }
                          } : prev)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notification Settings */}
              <TabsContent value="notifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Alert Channels</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Send alerts via email</p>
                      </div>
                      <Switch
                        checked={config.notifications.emailEnabled}
                        onCheckedChange={(checked) => setConfig(prev => prev ? {
                          ...prev,
                          notifications: { ...prev.notifications, emailEnabled: checked }
                        } : prev)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Webhook Notifications</Label>
                        <p className="text-sm text-muted-foreground">Send alerts to webhook endpoint</p>
                      </div>
                      <Switch
                        checked={config.notifications.webhookEnabled}
                        onCheckedChange={(checked) => setConfig(prev => prev ? {
                          ...prev,
                          notifications: { ...prev.notifications, webhookEnabled: checked }
                        } : prev)}
                      />
                    </div>

                    {config.notifications.webhookEnabled && (
                      <div>
                        <Label htmlFor="webhookUrl">Webhook URL</Label>
                        <Input
                          id="webhookUrl"
                          value={config.notifications.webhookUrl}
                          onChange={(e) => setConfig(prev => prev ? {
                            ...prev,
                            notifications: { ...prev.notifications, webhookUrl: e.target.value }
                          } : prev)}
                          placeholder="https://example.com/webhook"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Compliance Settings */}
              <TabsContent value="compliance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Compliance Frameworks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Enabled Frameworks</Label>
                      <div className="mt-2 space-y-2">
                        {['SOX', 'GDPR', 'HIPAA', 'PCI-DSS', 'ISO27001'].map((framework) => (
                          <div key={framework} className="flex items-center space-x-2">
                            <Switch
                              id={framework}
                              checked={config.compliance.enabledFrameworks.includes(framework)}
                              onCheckedChange={(checked) => {
                                setConfig(prev => prev ? {
                                  ...prev,
                                  compliance: {
                                    ...prev.compliance,
                                    enabledFrameworks: checked
                                      ? [...prev.compliance.enabledFrameworks, framework]
                                      : prev.compliance.enabledFrameworks.filter(f => f !== framework)
                                  }
                                } : prev);
                              }}
                            />
                            <Label htmlFor={framework}>{framework}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="retentionPeriod">Audit Retention (days)</Label>
                        <Input
                          id="retentionPeriod"
                          type="number"
                          value={config.compliance.auditRetentionPeriod}
                          onChange={(e) => setConfig(prev => prev ? {
                            ...prev,
                            compliance: { ...prev.compliance, auditRetentionPeriod: parseInt(e.target.value) || 2555 }
                          } : prev)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="reportingSchedule">Reporting Schedule</Label>
                        <Select 
                          value={config.compliance.reportingSchedule} 
                          onValueChange={(value) => setConfig(prev => prev ? {
                            ...prev,
                            compliance: { ...prev.compliance, reportingSchedule: value }
                          } : prev)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performance Settings */}
              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Optimization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cacheTimeout">Cache Timeout (minutes)</Label>
                        <Input
                          id="cacheTimeout"
                          type="number"
                          value={config.performance.cacheTimeout}
                          onChange={(e) => setConfig(prev => prev ? {
                            ...prev,
                            performance: { ...prev.performance, cacheTimeout: parseInt(e.target.value) || 60 }
                          } : prev)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="batchSize">Batch Size</Label>
                        <Input
                          id="batchSize"
                          type="number"
                          value={config.performance.batchSize}
                          onChange={(e) => setConfig(prev => prev ? {
                            ...prev,
                            performance: { ...prev.performance, batchSize: parseInt(e.target.value) || 100 }
                          } : prev)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Async Processing</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable asynchronous processing for bulk operations
                        </p>
                      </div>
                      <Switch
                        checked={config.performance.asyncProcessing}
                        onCheckedChange={(checked) => setConfig(prev => prev ? {
                          ...prev,
                          performance: { ...prev.performance, asyncProcessing: checked }
                        } : prev)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportSettings}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={resetSettings}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Default configuration
function getDefaultConfig(): RBACConfig {
  return {
    general: {
      systemName: 'RBAC System',
      defaultRole: 'student',
      autoApprovalThreshold: 5,
      sessionTimeout: 480,
      maxConcurrentSessions: 3,
      requireMFAForAdmins: true,
      enableAuditLogging: true
    },
    security: {
      passwordComplexity: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false
      },
      accountLockout: {
        enabled: true,
        maxAttempts: 5,
        lockoutDuration: 30
      },
      riskThresholds: {
        low: 30,
        medium: 70,
        high: 90
      }
    },
    notifications: {
      emailEnabled: true,
      slackEnabled: false,
      webhookEnabled: false,
      alertThresholds: {
        securityEvents: 10,
        complianceViolations: 1,
        riskScoreIncrease: 20
      },
      emailSettings: {
        smtpServer: '',
        smtpPort: 587,
        username: '',
        fromAddress: ''
      },
      webhookUrl: ''
    },
    compliance: {
      enabledFrameworks: ['SOX', 'GDPR'],
      auditRetentionPeriod: 2555,
      automaticReporting: true,
      reportingSchedule: 'monthly'
    },
    performance: {
      cacheTimeout: 60,
      batchSize: 100,
      asyncProcessing: true,
      maxConcurrentOperations: 10
    }
  };
}

// Loading Skeleton
function RBACSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

export default RBACSettings;