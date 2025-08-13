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
  BookOpen,
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
  Building2,
  Loader2,
  Database,
  Wifi,
  Monitor,
  Archive,
  Star,
  UserCheck,
  PlusCircle,
  Eye,
  Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LibraryResource {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: 'book' | 'journal' | 'ebook' | 'thesis' | 'magazine' | 'reference';
  type: 'physical' | 'digital' | 'both';
  totalCopies: number;
  availableCopies: number;
  location: string;
  acquisitionDate: Date;
  lastIssued: Date;
  status: 'available' | 'issued' | 'reserved' | 'maintenance' | 'lost';
  popularity: number;
  department: string[];
  language: string;
}

interface LibraryMember {
  id: string;
  name: string;
  memberType: 'student' | 'faculty' | 'staff' | 'guest';
  memberId: string;
  department: string;
  contactInfo: {
    email: string;
    phone: string;
  };
  joinDate: Date;
  booksIssued: number;
  overdueBooks: number;
  fineAmount: number;
  status: 'active' | 'suspended' | 'expired';
}

interface LibraryTransaction {
  id: string;
  memberId: string;
  memberName: string;
  resourceId: string;
  resourceTitle: string;
  transactionType: 'issue' | 'return' | 'renew' | 'reserve';
  issueDate: Date;
  dueDate: Date;
  returnDate?: Date;
  fineAmount: number;
  status: 'active' | 'overdue' | 'returned' | 'lost';
}

interface LibraryStats {
  totalResources: number;
  physicalBooks: number;
  digitalResources: number;
  totalMembers: number;
  activeMembers: number;
  booksIssued: number;
  overdueBooks: number;
  reservations: number;
  dailyVisitors: number;
  newAcquisitions: number;
  totalFines: number;
  utilizationRate: number;
}

const LibraryDashboard = () => {
  const [libraryStats, setLibraryStats] = useState<LibraryStats | null>(null);
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [transactions, setTransactions] = useState<LibraryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const { toast } = useToast();

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const fetchLibraryData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockStats: LibraryStats = {
        totalResources: 25000,
        physicalBooks: 18500,
        digitalResources: 6500,
        totalMembers: 1200,
        activeMembers: 950,
        booksIssued: 450,
        overdueBooks: 85,
        reservations: 45,
        dailyVisitors: 250,
        newAcquisitions: 125,
        totalFines: 15000,
        utilizationRate: 78.5
      };

      const mockResources: LibraryResource[] = [
        {
          id: '1',
          title: 'Introduction to Algorithms',
          author: 'Thomas H. Cormen',
          isbn: '978-0262033848',
          category: 'book',
          type: 'both',
          totalCopies: 15,
          availableCopies: 8,
          location: 'CS Section - Shelf A2',
          acquisitionDate: new Date('2023-08-15'),
          lastIssued: new Date('2024-07-25'),
          status: 'available',
          popularity: 95,
          department: ['Computer Science', 'Information Technology'],
          language: 'English'
        },
        {
          id: '2',
          title: 'Database System Concepts',
          author: 'Abraham Silberschatz',
          isbn: '978-0073523323',
          category: 'book',
          type: 'physical',
          totalCopies: 10,
          availableCopies: 3,
          location: 'CS Section - Shelf B1',
          acquisitionDate: new Date('2023-07-20'),
          lastIssued: new Date('2024-07-26'),
          status: 'available',
          popularity: 88,
          department: ['Computer Science', 'Information Technology'],
          language: 'English'
        },
        {
          id: '3',
          title: 'IEEE Computer Society Digital Library',
          author: 'IEEE',
          isbn: 'DIGITAL-IEEE-001',
          category: 'journal',
          type: 'digital',
          totalCopies: 1,
          availableCopies: 1,
          location: 'Digital Collection',
          acquisitionDate: new Date('2024-01-01'),
          lastIssued: new Date('2024-07-26'),
          status: 'available',
          popularity: 76,
          department: ['All Departments'],
          language: 'English'
        }
      ];

      const mockMembers: LibraryMember[] = [
        {
          id: '1',
          name: 'Arjun Patel',
          memberType: 'student',
          memberId: 'LIB001',
          department: 'Computer Science',
          contactInfo: {
            email: 'arjun.patel@student.edu',
            phone: '+91 9876543210'
          },
          joinDate: new Date('2023-08-01'),
          booksIssued: 3,
          overdueBooks: 1,
          fineAmount: 150,
          status: 'active'
        }
      ];

      const mockTransactions: LibraryTransaction[] = [
        {
          id: '1',
          memberId: '1',
          memberName: 'Arjun Patel',
          resourceId: '1',
          resourceTitle: 'Introduction to Algorithms',
          transactionType: 'issue',
          issueDate: new Date('2024-07-10'),
          dueDate: new Date('2024-07-24'),
          fineAmount: 150,
          status: 'overdue'
        }
      ];

      setLibraryStats(mockStats);
      setResources(mockResources);
      setMembers(mockMembers);
      setTransactions(mockTransactions);

    } catch (error) {
      console.error("Error fetching library data:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load library data." });
    }
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'issued': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'reserved': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'maintenance': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'lost': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getCategoryColor = (category: LibraryResource['category']) => {
    switch (category) {
      case 'book': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'journal': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ebook': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'thesis': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'magazine': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'reference': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (isLoading || !libraryStats) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mx-auto mb-4" />
          <p>Loading Library Dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Issue Book",
      description: "Issue resource to member",
      icon: BookOpen,
      action: () => toast({ title: "Issue Book", description: "Opening book issue interface..." }),
    },
    {
      title: "Add Resource",
      description: "Catalog new resource",
      icon: PlusCircle,
      action: () => toast({ title: "Add Resource", description: "Opening resource cataloging..." }),
    },
    {
      title: "Member Management",
      description: "Manage library members",
      icon: Users,
      action: () => toast({ title: "Member Management", description: "Opening member management..." }),
    },
    {
      title: "Generate Reports",
      description: "Library analytics",
      icon: FileText,
      action: () => toast({ title: "Generate Reports", description: "Opening library reports..." }),
    }
  ];

  const recentTasks = [
    {
      id: '1',
      title: 'Process overdue book returns',
      description: 'Follow up with members having overdue books',
      priority: 'high' as const,
      status: 'in_progress' as const,
      assignedTo: 'Library Assistant',
      dueDate: new Date('2024-08-05')
    },
    {
      id: '2',
      title: 'Catalog new acquisitions',
      description: 'Add 125 new books to library system',
      priority: 'medium' as const,
      status: 'pending' as const,
      assignedTo: 'Cataloging Staff',
      dueDate: new Date('2024-08-10')
    },
    {
      id: '3',
      title: 'Digital collection maintenance',
      description: 'Update digital resource access permissions',
      priority: 'medium' as const,
      status: 'pending' as const,
      assignedTo: 'IT Support',
      dueDate: new Date('2024-08-12')
    }
  ];

  const libraryMembers = [
    {
      id: '1',
      name: 'Dr. Meera Shah',
      role: 'convener' as const,
      email: 'meera.shah@college.edu',
      department: 'Library Science',
      joinDate: new Date('2022-12-01'),
      status: 'active' as const
    },
    {
      id: '2',
      name: 'Ms. Kavita Joshi',
      role: 'co_convener' as const,
      email: 'kavita.joshi@college.edu',
      department: 'Information Technology',
      joinDate: new Date('2023-01-15'),
      status: 'active' as const
    },
    {
      id: '3',
      name: 'Mr. Suresh Kumar',
      role: 'secretary' as const,
      email: 'suresh.kumar@college.edu',
      department: 'Library Operations',
      joinDate: new Date('2022-12-01'),
      status: 'active' as const
    }
  ];

  const metrics = {
    totalMembers: libraryMembers.length,
    activeTasks: 6,
    completedTasks: 18,
    pendingApprovals: 4,
    upcomingMeetings: 2,
    monthlyProgress: 85,
    budget: {
      allocated: 1500000,
      utilized: 1100000,
      remaining: 400000
    }
  };

  return (
    <CommitteeBaseLayout
      committeeName="Library Committee"
      committeeType="library"
      description="Managing library resources and academic information services"
      icon={BookOpen}
      color="teal"
      metrics={metrics}
      recentTasks={recentTasks}
      members={libraryMembers}
      quickActions={quickActions}
    >
      {/* Library-specific content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Library Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Utilization Rate</p>
                    <p className="text-2xl font-bold">{libraryStats.utilizationRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Resource usage</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-teal-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Daily Visitors</p>
                    <p className="text-2xl font-bold">{libraryStats.dailyVisitors}</p>
                    <p className="text-xs text-muted-foreground">Average footfall</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Books Issued</p>
                    <p className="text-2xl font-bold">{libraryStats.booksIssued}</p>
                    <p className="text-xs text-muted-foreground">Currently active</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Overdue Books</p>
                    <p className="text-2xl font-bold">{libraryStats.overdueBooks}</p>
                    <p className="text-xs text-muted-foreground">Need attention</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Collection Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-bold text-lg text-blue-600">{libraryStats.totalResources.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Resources</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-green-600">{libraryStats.physicalBooks.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Physical Books</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-purple-600">{libraryStats.digitalResources.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Digital Resources</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Library Resources</CardTitle>
              <CardDescription>Academic books, journals, and digital collections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {resources.map((resource) => (
                  <div key={resource.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{resource.title}</h3>
                        <p className="text-muted-foreground">by {resource.author}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(resource.status)}>
                          {resource.status.toUpperCase()}
                        </Badge>
                        <Badge className={getCategoryColor(resource.category)}>
                          {resource.category.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">ISBN/ID</span>
                        <div className="font-medium">{resource.isbn}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Availability</span>
                        <div className="font-medium">{resource.availableCopies}/{resource.totalCopies}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Location</span>
                        <div className="font-medium">{resource.location}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Popularity</span>
                        <div className="font-medium">{resource.popularity}%</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Issue
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="text-center py-8">
            <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Member Management</h3>
            <p className="text-muted-foreground">Library membership and user account management system.</p>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <div className="text-center py-8">
            <FileText className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Transaction History</h3>
            <p className="text-muted-foreground">Book issue, return, and fine management system.</p>
          </div>
        </TabsContent>
      </Tabs>
    </CommitteeBaseLayout>
  );
};

export default LibraryDashboard;