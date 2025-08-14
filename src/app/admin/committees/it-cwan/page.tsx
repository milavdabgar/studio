'use client';

import { useState, useEffect } from 'react';
import { getUserCookie, getUserAccessContext } from '@/lib/auth/role-access';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Server, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Monitor,
  Wifi,
  Shield,
  HardDrive,
  Clock,
  Wrench,
  Plus,
  Search,
  Activity,
  Network,
  Database
} from 'lucide-react';
import { DepartmentScopedPage } from '@/components/auth/PageAccessControl';
import { PageErrorBoundary, ApiErrorBoundary } from '@/components/error';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  requestedBy: string;
  department: string;
  category: 'hardware' | 'software' | 'network' | 'access' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  createdDate: string;
  lastUpdated: string;
  resolutionTime?: number; // in hours
}

interface NetworkDevice {
  id: string;
  name: string;
  type: 'switch' | 'router' | 'access_point' | 'server' | 'firewall';
  location: string;
  ipAddress: string;
  status: 'online' | 'offline' | 'warning' | 'maintenance';
  lastPing: string;
  uptime: number; // in hours
  bandwidth: { used: number; total: number }; // in Mbps
}

interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  accountType: 'student' | 'faculty' | 'staff' | 'admin';
  permissions: string[];
}

export default function ITCWANDashboard() {
  // Role-based access control
  const user = getUserCookie();
  const accessContext = getUserAccessContext(user);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [, setUsers] = useState<UserAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    devicesOnline: 0,
    totalDevices: 0,
    activeUsers: 0,
    networkUptime: 0
  });

  useEffect(() => {
    // Mock data - in production, fetch from APIs
    const mockTickets: SupportTicket[] = [
      {
        id: '1',
        title: 'Wi-Fi connectivity issues in CS Lab 1',
        description: 'Students unable to connect to Wi-Fi network during lab sessions',
        requestedBy: 'Dr. Amit Patel',
        department: 'Computer Engineering',
        category: 'network',
        priority: 'high',
        status: 'in_progress',
        assignedTo: 'Rajesh Kumar',
        createdDate: '2024-03-10',
        lastUpdated: '2024-03-12',
        resolutionTime: 48
      },
      {
        id: '2',
        title: 'Projector not working in Room 201',
        description: 'Projector display flickering and showing distorted images',
        requestedBy: 'Prof. Priya Shah',
        department: 'Electrical Engineering',
        category: 'hardware',
        priority: 'medium',
        status: 'open',
        createdDate: '2024-03-11',
        lastUpdated: '2024-03-11'
      }
    ];

    const mockDevices: NetworkDevice[] = [
      {
        id: '1',
        name: 'Core Switch - Main Building',
        type: 'switch',
        location: 'Server Room - Ground Floor',
        ipAddress: '192.168.1.1',
        status: 'online',
        lastPing: '2024-03-12T10:30:00Z',
        uptime: 720, // 30 days
        bandwidth: { used: 450, total: 1000 }
      },
      {
        id: '2',
        name: 'CS Department Router',
        type: 'router',
        location: 'CS Building - 2nd Floor',
        ipAddress: '192.168.10.1',
        status: 'warning',
        lastPing: '2024-03-12T10:25:00Z',
        uptime: 168, // 7 days
        bandwidth: { used: 180, total: 500 }
      },
      {
        id: '3',
        name: 'Library Access Point',
        type: 'access_point',
        location: 'Library - Reading Hall',
        ipAddress: '192.168.20.5',
        status: 'offline',
        lastPing: '2024-03-12T08:00:00Z',
        uptime: 0,
        bandwidth: { used: 0, total: 300 }
      }
    ];

    const mockUsers: UserAccount[] = [
      {
        id: '1',
        username: 'rahul.kumar',
        fullName: 'Rahul Kumar',
        email: 'rahul.kumar@gppalanpur.ac.in',
        role: 'student',
        department: 'Computer Engineering',
        status: 'active',
        lastLogin: '2024-03-12T09:15:00Z',
        accountType: 'student',
        permissions: ['email', 'wifi', 'portal']
      },
      {
        id: '2',
        username: 'dr.amit.patel',
        fullName: 'Dr. Amit Patel',
        email: 'amit.patel@gppalanpur.ac.in',
        role: 'faculty',
        department: 'Computer Engineering',
        status: 'active',
        lastLogin: '2024-03-12T08:30:00Z',
        accountType: 'faculty',
        permissions: ['email', 'wifi', 'portal', 'admin_tools', 'grade_system']
      }
    ];

    setTickets(mockTickets);
    setDevices(mockDevices);
    setUsers(mockUsers);
    
    // Calculate stats
    setStats({
      totalTickets: mockTickets.length,
      openTickets: mockTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
      devicesOnline: mockDevices.filter(d => d.status === 'online').length,
      totalDevices: mockDevices.length,
      activeUsers: mockUsers.filter(u => u.status === 'active').length,
      networkUptime: 99.5 // Mock percentage
    });
    
    setLoading(false);
  }, []);

  const getStatusBadge = (status: string, type: 'ticket' | 'device' | 'user' = 'ticket') => {
    const variants = {
      ticket: {
        'open': 'bg-blue-100 text-blue-800',
        'in_progress': 'bg-yellow-100 text-yellow-800',
        'resolved': 'bg-green-100 text-green-800',
        'closed': 'bg-gray-100 text-gray-800'
      },
      device: {
        'online': 'bg-green-100 text-green-800',
        'offline': 'bg-red-100 text-red-800',
        'warning': 'bg-yellow-100 text-yellow-800',
        'maintenance': 'bg-blue-100 text-blue-800'
      },
      user: {
        'active': 'bg-green-100 text-green-800',
        'inactive': 'bg-gray-100 text-gray-800',
        'suspended': 'bg-red-100 text-red-800'
      }
    };
    
    return (
      <Badge className={variants[type][status as keyof typeof variants[typeof type]] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'critical': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={variants[priority as keyof typeof variants]}>
        {priority}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'hardware': <Monitor className="w-4 h-4" />,
      'software': <Database className="w-4 h-4" />,
      'network': <Network className="w-4 h-4" />,
      'access': <Shield className="w-4 h-4" />,
      'maintenance': <Wrench className="w-4 h-4" />
    };
    
    return icons[category as keyof typeof icons] || <Activity className="w-4 h-4" />;
  };

  const getDeviceIcon = (type: string) => {
    const icons = {
      'switch': <Network className="w-4 h-4" />,
      'router': <Wifi className="w-4 h-4" />,
      'access_point': <Wifi className="w-4 h-4" />,
      'server': <Server className="w-4 h-4" />,
      'firewall': <Shield className="w-4 h-4" />
    };
    
    return icons[type as keyof typeof icons] || <Monitor className="w-4 h-4" />;
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageErrorBoundary pageName="IT/CWAN Dashboard" showDetails={process.env.NODE_ENV === 'development'}>
      <DepartmentScopedPage pageName="IT/CWAN dashboard">
        <div className="container mx-auto py-4 px-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Server className="h-6 w-6 sm:h-8 sm:w-8" />
              <span className="hidden sm:inline">IT/CWAN Management Dashboard</span>
              <span className="sm:hidden">IT/CWAN Dashboard</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">Campus-wide area network and IT infrastructure management</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {accessContext.featurePermissions.canCreateRecords && (
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">New Ticket</span>
              <span className="sm:hidden">Ticket</span>
            </Button>
            )}
            {accessContext.featurePermissions.canCreateRecords && (
            <Button variant="outline" className="w-full sm:w-auto">
              <Monitor className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add Device</span>
              <span className="sm:hidden">Device</span>
            </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Open Tickets</CardTitle>
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.openTickets}</div>
              <p className="text-xs text-muted-foreground">of {stats.totalTickets} total</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Devices Online</CardTitle>
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.devicesOnline}</div>
              <p className="text-xs text-muted-foreground">of {stats.totalDevices} devices</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active Users</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="text-xl sm:text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">logged in today</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Network Uptime</CardTitle>
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="text-xl sm:text-2xl font-bold">{stats.networkUptime}%</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="text-xl sm:text-2xl font-bold">73%</div>
              <p className="text-xs text-muted-foreground">2.1TB available</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Avg Response</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-1 sm:pt-2">
              <div className="text-xl sm:text-2xl font-bold">4.2h</div>
              <p className="text-xs text-muted-foreground">ticket resolution</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Recent Support Tickets */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                Recent Support Tickets
              </CardTitle>
              <CardDescription className="text-sm">Latest IT support requests</CardDescription>
            </CardHeader>
            <CardContent>
              <ApiErrorBoundary 
                fallbackTitle="Failed to load tickets"
                fallbackMessage="Unable to load support tickets. Please try again."
              >
                <div className="space-y-4">
                  {tickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getCategoryIcon(ticket.category)}
                        <div className="font-medium">{ticket.title}</div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        {ticket.requestedBy} • {ticket.department}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(ticket.createdDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(ticket.status)}
                      <div className="mt-1">
                        {getPriorityBadge(ticket.priority)}
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              </ApiErrorBoundary>
            </CardContent>
          </Card>

          {/* Network Device Status */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Network className="h-4 w-4 sm:h-5 sm:w-5" />
                Network Device Status
              </CardTitle>
              <CardDescription className="text-sm">Critical infrastructure monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <ApiErrorBoundary 
                fallbackTitle="Failed to load devices"
                fallbackMessage="Unable to load network device status. Please try again."
              >
                <div className="space-y-4">
                  {devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(device.type)}
                      <div>
                        <div className="font-medium">{device.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {device.location} • {device.ipAddress}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Bandwidth: {device.bandwidth.used}/{device.bandwidth.total} Mbps
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(device.status, 'device')}
                      <div className="text-sm text-muted-foreground mt-1">
                        {device.uptime > 0 ? `${Math.floor(device.uptime / 24)}d uptime` : 'Offline'}
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              </ApiErrorBoundary>
            </CardContent>
          </Card>
        </div>

        {/* Support Tickets Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Support Tickets</CardTitle>
            <CardDescription>All IT support and maintenance requests</CardDescription>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search tickets by title, requester, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket Details</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {ticket.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.requestedBy}</div>
                        <div className="text-sm text-muted-foreground">{ticket.department}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(ticket.category)}
                        <span className="capitalize">{ticket.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>
                      {ticket.assignedTo || (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(ticket.createdDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Network Infrastructure Table */}
        <Card>
          <CardHeader>
            <CardTitle>Network Infrastructure</CardTitle>
            <CardDescription>Campus network devices and their current status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Bandwidth</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.type)}
                        <span className="capitalize">{device.type.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>{device.location}</TableCell>
                    <TableCell className="font-mono">{device.ipAddress}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{device.bandwidth.used}/{device.bandwidth.total} Mbps</div>
                        <div className="text-muted-foreground">
                          {Math.round((device.bandwidth.used / device.bandwidth.total) * 100)}% used
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {device.uptime > 0 ? `${Math.floor(device.uptime / 24)} days` : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(device.status, 'device')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </div>
      </DepartmentScopedPage>
    </PageErrorBoundary>
  );
}