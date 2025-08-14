'use client';

import { useState, useEffect } from 'react';
import { getUserCookie, getUserAccessContext } from '@/lib/auth/role-access';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  BriefcaseIcon, 
  Users, 
  TrendingUp, 
  Calendar,
  Building,
  Target,
  Award,
  FileText,
  Plus
} from 'lucide-react';
import { DepartmentScopedPage } from '@/components/auth/PageAccessControl';

interface PlacementData {
  id: string;
  studentName: string;
  enrollmentNumber: string;
  department: string;
  program: string;
  company: string;
  package: number;
  offerType: 'full-time' | 'internship' | 'ppo';
  status: 'offered' | 'accepted' | 'rejected';
  placementDate: string;
}

interface CompanyData {
  id: string;
  name: string;
  type: 'core' | 'it' | 'consulting' | 'startup';
  tier: 'tier1' | 'tier2' | 'tier3';
  eligibleDepartments: string[];
  minCGPA: number;
  packageRange: { min: number; max: number };
  visitDate?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export default function TPODashboard() {
  // Role-based access control
  const user = getUserCookie();
  const accessContext = getUserAccessContext(user);

  const [placements, setPlacements] = useState<PlacementData[]>([]);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlacements: 0,
    averagePackage: 0,
    placementRate: 0,
    companiesVisited: 0
  });

  useEffect(() => {
    // Mock data - in production, fetch from APIs
    const mockPlacements: PlacementData[] = [
      {
        id: '1',
        studentName: 'Rahul Kumar',
        enrollmentNumber: '20IT001',
        department: 'Computer Engineering',
        program: 'B.Tech',
        company: 'TCS',
        package: 350000,
        offerType: 'full-time',
        status: 'accepted',
        placementDate: '2024-03-15'
      },
      {
        id: '2',
        studentName: 'Priya Patel',
        enrollmentNumber: '20CE002',
        department: 'Civil Engineering',
        program: 'B.Tech',
        company: 'L&T Construction',
        package: 420000,
        offerType: 'full-time',
        status: 'offered',
        placementDate: '2024-03-20'
      }
    ];

    const mockCompanies: CompanyData[] = [
      {
        id: '1',
        name: 'Infosys',
        type: 'it',
        tier: 'tier1',
        eligibleDepartments: ['Computer Engineering', 'Electronics & Communication'],
        minCGPA: 7.0,
        packageRange: { min: 350000, max: 450000 },
        visitDate: '2024-04-10',
        status: 'upcoming'
      },
      {
        id: '2',
        name: 'Adani Group',
        type: 'core',
        tier: 'tier1',
        eligibleDepartments: ['Mechanical Engineering', 'Electrical Engineering'],
        minCGPA: 6.5,
        packageRange: { min: 400000, max: 600000 },
        visitDate: '2024-04-15',
        status: 'upcoming'
      }
    ];

    setPlacements(mockPlacements);
    setCompanies(mockCompanies);
    
    // Calculate stats
    setStats({
      totalPlacements: mockPlacements.length,
      averagePackage: mockPlacements.reduce((sum, p) => sum + p.package, 0) / mockPlacements.length,
      placementRate: 85.5, // Mock percentage
      companiesVisited: 12 // Mock count
    });
    
    setLoading(false);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      'offered': 'bg-blue-100 text-blue-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'upcoming': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      'tier1': 'bg-purple-100 text-purple-800',
      'tier2': 'bg-blue-100 text-blue-800',
      'tier3': 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge className={colors[tier as keyof typeof colors]}>
        {tier.toUpperCase()}
      </Badge>
    );
  };

  return (
    <DepartmentScopedPage pageName="TPO dashboard">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BriefcaseIcon className="h-8 w-8" />
              Training & Placement Dashboard
            </h1>
            <p className="text-muted-foreground">Manage campus placements and company visits</p>
          </div>
          <div className="flex gap-2">
            {accessContext.featurePermissions.canCreateRecords && (
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
            )}
            {accessContext.featurePermissions.canExportData && (
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Placements</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlacements}</div>
              <p className="text-xs text-muted-foreground">This academic year</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Package</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(stats.averagePackage / 100000).toFixed(1)}L</div>
              <p className="text-xs text-muted-foreground">Per annum</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Placement Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.placementRate}%</div>
              <p className="text-xs text-muted-foreground">Eligible students</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companies Visited</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.companiesVisited}</div>
              <p className="text-xs text-muted-foreground">This year</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Placements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Recent Placements
              </CardTitle>
              <CardDescription>Latest student placements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {placements.map((placement) => (
                  <div key={placement.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{placement.studentName}</div>
                      <div className="text-sm text-muted-foreground">
                        {placement.enrollmentNumber} • {placement.department}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {placement.company} • ₹{(placement.package / 100000).toFixed(1)}L
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(placement.status)}
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(placement.placementDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Company Visits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Company Visits
              </CardTitle>
              <CardDescription>Scheduled campus recruitment drives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {companies.filter(c => c.status === 'upcoming').map((company) => (
                  <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {company.name}
                        {getTierBadge(company.tier)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {company.type.toUpperCase()} • Min CGPA: {company.minCGPA}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ₹{(company.packageRange.min / 100000).toFixed(1)}L - ₹{(company.packageRange.max / 100000).toFixed(1)}L
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(company.status)}
                      {company.visitDate && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {new Date(company.visitDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <div className="mt-6 space-y-6">
          {/* All Placements Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Placements</CardTitle>
              <CardDescription>Complete placement records</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {placements.map((placement) => (
                    <TableRow key={placement.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{placement.studentName}</div>
                          <div className="text-sm text-muted-foreground">{placement.enrollmentNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>{placement.department}</TableCell>
                      <TableCell>{placement.company}</TableCell>
                      <TableCell>₹{(placement.package / 100000).toFixed(1)}L</TableCell>
                      <TableCell>
                        <Badge variant="outline">{placement.offerType}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(placement.status)}</TableCell>
                      <TableCell>{new Date(placement.placementDate).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Companies Table */}
          <Card>
            <CardHeader>
              <CardTitle>Company Database</CardTitle>
              <CardDescription>All registered companies and their requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Eligible Departments</TableHead>
                    <TableHead>Min CGPA</TableHead>
                    <TableHead>Package Range</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{company.type}</Badge>
                      </TableCell>
                      <TableCell>{getTierBadge(company.tier)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {company.eligibleDepartments.slice(0, 2).map(dept => (
                            <div key={dept}>{dept}</div>
                          ))}
                          {company.eligibleDepartments.length > 2 && (
                            <div className="text-muted-foreground">
                              +{company.eligibleDepartments.length - 2} more
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{company.minCGPA}</TableCell>
                      <TableCell>
                        ₹{(company.packageRange.min / 100000).toFixed(1)}L - ₹{(company.packageRange.max / 100000).toFixed(1)}L
                      </TableCell>
                      <TableCell>{getStatusBadge(company.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DepartmentScopedPage>
  );
}