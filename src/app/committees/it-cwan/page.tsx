"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CommitteeBaseLayout from '@/components/committee/CommitteeBaseLayout';
import { 
  Monitor,
  Wifi,
  Server,
  Shield,
  Database,
  Users,
  Calendar,
  FileText,
  Search,
  Download,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Zap,
  Loader2,
  HardDrive,
  Globe,
  Lock,
  Activity,
  Settings,
  Wrench,
  Eye,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SystemStatus {
  id: string;
  name: string;
  type: 'server' | 'network' | 'database' | 'application' | 'security';
  status: 'online' | 'offline' | 'maintenance' | 'warning' | 'critical';
  uptime: number;
  lastCheck: Date;
  location: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  description: string;
}

interface NetworkDevice {
  id: string;
  name: string;
  type: 'router' | 'switch' | 'firewall' | 'access_point' | 'server';
  ipAddress: string;
  macAddress: string;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
  lastSeen: Date;
  bandwidth: {
    upload: number;
    download: number;
  };
  connectedUsers: number;
}

interface SecurityIncident {
  id: string;
  title: string;
  type: 'malware' | 'unauthorized_access' | 'data_breach' | 'phishing' | 'ddos' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reportedBy: string;
  reportedAt: Date;
  description: string;
  affectedSystems: string[];
  assignedTo: string;
  estimatedResolution: Date;
}

interface ITStats {
  totalSystems: number;
  onlineSystems: number;
  offlineSystems: number;
  systemsInMaintenance: number;
  networkUptime: number;
  totalUsers: number;
  activeUsers: number;
  dataBackupStatus: number;
  securityIncidents: number;
  resolvedIncidents: number;
  averageResponseTime: number;
  storageUtilization: number;
}

const ITCWANDashboard = () => {
  const [itStats, setITStats] = useState<ITStats | null>(null);
  const [systemStatuses, setSystemStatuses] = useState<SystemStatus[]>([]);
  const [networkDevices, setNetworkDevices] = useState<NetworkDevice[]>([]);
  const [securityIncidents, setSecurityIncidents] = useState<SecurityIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const { toast } = useToast();

  useEffect(() => {
    fetchITData();
  }, []);

  const fetchITData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockStats: ITStats = {
        totalSystems: 45,
        onlineSystems: 42,
        offlineSystems: 1,
        systemsInMaintenance: 2,
        networkUptime: 99.7,
        totalUsers: 1200,
        activeUsers: 850,
        dataBackupStatus: 95,
        securityIncidents: 8,
        resolvedIncidents: 6,
        averageResponseTime: 2.3,
        storageUtilization: 72
      };

      const mockSystems: SystemStatus[] = [
        {
          id: '1',
          name: 'Main Database Server',
          type: 'database',
          status: 'online',
          uptime: 99.8,
          lastCheck: new Date(),
          location: 'Data Center - Rack A1',
          cpu: 45,
          memory: 68,
          disk: 82,
          network: 35,
          description: 'Primary MySQL database server for student management system'
        },
        {
          id: '2',
          name: 'Web Application Server',
          type: 'application',
          status: 'online',
          uptime: 99.5,
          lastCheck: new Date(),
          location: 'Data Center - Rack A2',
          cpu: 32,
          memory: 55,
          disk: 45,
          network: 28,
          description: 'Main web application hosting server'
        },
        {
          id: '3',
          name: 'Backup Storage System',
          type: 'server',
          status: 'warning',
          uptime: 98.2,
          lastCheck: new Date(),
          location: 'Data Center - Rack B1',
          cpu: 78,
          memory: 85,
          disk: 92,
          network: 15,
          description: 'Automated backup and disaster recovery system'
        }
      ];

      const mockNetworkDevices: NetworkDevice[] = [
        {
          id: '1',
          name: 'Core Router',
          type: 'router',
          ipAddress: '192.168.1.1',
          macAddress: '00:1B:44:11:3A:B7',
          location: 'Network Operations Center',
          status: 'active',
          lastSeen: new Date(),
          bandwidth: {
            upload: 850,
            download: 920
          },
          connectedUsers: 450
        },
        {
          id: '2',
          name: 'Library WiFi Access Point',
          type: 'access_point',
          ipAddress: '192.168.10.15',
          macAddress: '00:1B:44:11:3A:C8',
          location: 'Central Library',
          status: 'active',
          lastSeen: new Date(),
          bandwidth: {
            upload: 45,
            download: 78
          },
          connectedUsers: 35
        }
      ];

      const mockIncidents: SecurityIncident[] = [
        {
          id: '1',
          title: 'Suspicious login attempts detected',
          type: 'unauthorized_access',
          severity: 'medium',
          status: 'investigating',
          reportedBy: 'Security System',
          reportedAt: new Date('2024-07-26'),
          description: 'Multiple failed login attempts from external IP addresses',
          affectedSystems: ['Web Application Server', 'Student Portal'],
          assignedTo: 'Security Team',
          estimatedResolution: new Date('2024-08-02')
        },
        {
          id: '2',
          title: 'Phishing email campaign',
          type: 'phishing',
          severity: 'high',
          status: 'resolved',
          reportedBy: 'Faculty Member',
          reportedAt: new Date('2024-07-24'),
          description: 'Fake email mimicking official college communication',
          affectedSystems: ['Email Server'],
          assignedTo: 'IT Security Lead',
          estimatedResolution: new Date('2024-07-25')
        }
      ];

      setITStats(mockStats);
      setSystemStatuses(mockSystems);
      setNetworkDevices(mockNetworkDevices);
      setSecurityIncidents(mockIncidents);

    } catch (error) {
      console.error("Error fetching IT data:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load IT infrastructure data." });
    }
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'offline':
      case 'inactive':
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'maintenance': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'investigating': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getSystemIcon = (type: SystemStatus['type']) => {
    switch (type) {
      case 'server': return Server;
      case 'network': return Wifi;
      case 'database': return Database;
      case 'application': return Monitor;
      case 'security': return Shield;
      default: return Monitor;
    }
  };

  if (isLoading || !itStats) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mx-auto mb-4" />
          <p>Loading IT/CWAN Dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "System Monitor",
      description: "Check system health",
      icon: Monitor,
      action: () => toast({ title: "System Monitor", description: "Opening system monitoring..." }),
    },
    {
      title: "Network Status",
      description: "Network diagnostics",
      icon: Wifi,
      action: () => toast({ title: "Network Status", description: "Opening network diagnostics..." }),
    },
    {
      title: "Security Center",
      description: "Security incidents",
      icon: Shield,
      action: () => toast({ title: "Security Center", description: "Opening security management..." }),
    },
    {
      title: "Backup & Recovery",
      description: "Data backup status",
      icon: Database,
      action: () => toast({ title: "Backup & Recovery", description: "Opening backup management..." }),
    }
  ];

  const recentTasks = [
    {
      id: '1',
      title: 'Investigate security incident',
      description: 'Analyze suspicious login attempts from external sources',
      priority: 'high' as const,
      status: 'in_progress' as const,
      assignedTo: 'Security Administrator',
      dueDate: new Date('2024-08-02')
    },
    {
      id: '2',
      title: 'Server maintenance window',
      description: 'Scheduled maintenance for backup storage system',
      priority: 'medium' as const,
      status: 'pending' as const,
      assignedTo: 'System Administrator',
      dueDate: new Date('2024-08-05')
    },
    {
      id: '3',
      title: 'Network performance optimization',
      description: 'Optimize bandwidth allocation for academic periods',
      priority: 'medium' as const,
      status: 'pending' as const,
      assignedTo: 'Network Engineer',
      dueDate: new Date('2024-08-08')
    }
  ];

  const members = [
    {
      id: '1',
      name: 'Mr. Rahul Singh',
      role: 'convener' as const,
      email: 'rahul.singh@college.edu',
      department: 'Computer Science & Engineering',
      joinDate: new Date('2022-08-01'),
      status: 'active' as const
    },
    {
      id: '2',
      name: 'Ms. Pooja Patel',
      role: 'co_convener' as const,
      email: 'pooja.patel@college.edu',
      department: 'Information Technology',
      joinDate: new Date('2023-01-15'),
      status: 'active' as const
    },
    {
      id: '3',
      name: 'Mr. Sunil Kumar',
      role: 'secretary' as const,
      email: 'sunil.kumar@college.edu',
      department: 'IT Support',
      joinDate: new Date('2022-08-01'),
      status: 'active' as const
    }
  ];

  const metrics = {
    totalMembers: members.length,
    activeTasks: 12,
    completedTasks: 25,
    pendingApprovals: 2,
    upcomingMeetings: 1,
    monthlyProgress: 92,
    budget: {
      allocated: 2000000,
      utilized: 1650000,
      remaining: 350000
    }
  };

  return (
    <CommitteeBaseLayout
      committeeName="IT & Computer Network Administration (CWAN)"
      committeeType="it_cwan"
      description="Managing IT infrastructure and network security"
      icon={Monitor}
      color="blue"
      metrics={metrics}
      recentTasks={recentTasks}
      members={members}
      quickActions={quickActions}
    >
      {/* IT/CWAN-specific content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="systems">Systems</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Infrastructure Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Network Uptime</p>
                    <p className="text-2xl font-bold">{itStats.networkUptime.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">{itStats.activeUsers}</p>
                    <p className="text-xs text-muted-foreground">of {itStats.totalUsers} total</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                    <p className="text-2xl font-bold">{itStats.averageResponseTime.toFixed(1)}s</p>
                    <p className="text-xs text-muted-foreground">Average response</p>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                    <p className="text-2xl font-bold">{itStats.storageUtilization}%</p>
                    <p className="text-xs text-muted-foreground">Disk utilization</p>
                  </div>
                  <HardDrive className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-bold text-lg text-green-600">{itStats.onlineSystems}</div>
                    <div className="text-sm text-muted-foreground">Online Systems</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-red-600">{itStats.offlineSystems}</div>
                    <div className="text-sm text-muted-foreground">Offline Systems</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-blue-600">{itStats.systemsInMaintenance}</div>
                    <div className="text-sm text-muted-foreground">In Maintenance</div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>System Availability</span>
                    <span>{((itStats.onlineSystems / itStats.totalSystems) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(itStats.onlineSystems / itStats.totalSystems) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="systems" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Status Monitor</CardTitle>
              <CardDescription>Real-time infrastructure monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {systemStatuses.map((system) => {
                  const SystemIcon = getSystemIcon(system.type);
                  return (
                    <div key={system.id} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <SystemIcon className="h-8 w-8 text-blue-500" />
                          <div>
                            <h3 className="font-semibold text-lg">{system.name}</h3>
                            <p className="text-muted-foreground text-sm">{system.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(system.status)}>
                            {system.status.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {system.uptime.toFixed(1)}% uptime
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-muted-foreground">CPU Usage</span>
                          <div className="mt-1">
                            <Progress value={system.cpu} className="h-2 mb-1" />
                            <span className="text-xs font-medium">{system.cpu}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Memory</span>
                          <div className="mt-1">
                            <Progress value={system.memory} className="h-2 mb-1" />
                            <span className="text-xs font-medium">{system.memory}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Disk Usage</span>
                          <div className="mt-1">
                            <Progress value={system.disk} className="h-2 mb-1" />
                            <span className="text-xs font-medium">{system.disk}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Network</span>
                          <div className="mt-1">
                            <Progress value={system.network} className="h-2 mb-1" />
                            <span className="text-xs font-medium">{system.network}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Location: {system.location}</span>
                        <span className="text-muted-foreground">Last Check: {system.lastCheck.toLocaleTimeString()}</span>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <Activity className="h-4 w-4 mr-2" />
                          Monitor
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <div className="text-center py-8">
            <Wifi className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Network Management</h3>
            <p className="text-muted-foreground">Network device monitoring and bandwidth management.</p>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Incidents</CardTitle>
              <CardDescription>Active security threats and incident management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {securityIncidents.map((incident) => (
                  <div key={incident.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{incident.title}</h3>
                        <p className="text-muted-foreground text-sm">{incident.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Reported By</span>
                        <div className="font-medium">{incident.reportedBy}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Assigned To</span>
                        <div className="font-medium">{incident.assignedTo}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Reported At</span>
                        <div className="font-medium">{incident.reportedAt.toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Est. Resolution</span>
                        <div className="font-medium">{incident.estimatedResolution.toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-sm text-muted-foreground">Affected Systems:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {incident.affectedSystems.map((system, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {system}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Investigate
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Report
                      </Button>
                      {incident.status === 'investigating' && (
                        <Button variant="outline" size="sm">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </CommitteeBaseLayout>
  );
};

export default ITCWANDashboard;