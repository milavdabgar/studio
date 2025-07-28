"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  MessageSquare, 
  Filter,
  Calendar,
  ArrowRight,
  ChevronDown,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Timetable } from '@/types/entities';

interface ApprovalWorkflow {
  id: string;
  timetableId: string;
  currentStage: 'hod' | 'dean' | 'registrar' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: Date;
  hodApproval?: {
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: Date;
    comments?: string;
  };
  deanApproval?: {
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: Date;
    comments?: string;
  };
  registrarApproval?: {
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: Date;
    comments?: string;
  };
  history: ApprovalHistoryItem[];
}

interface ApprovalHistoryItem {
  id: string;
  stage: string;
  action: 'submitted' | 'approved' | 'rejected' | 'commented';
  by: string;
  at: Date;
  comments?: string;
}

interface EnrichedTimetable extends Timetable {
  workflow?: ApprovalWorkflow;
  departmentName?: string;
  programName?: string;
  batchName?: string;
}

interface UserCookie {
  email: string;
  name: string;
  activeRole: string;
  availableRoles: string[];
  id?: string;
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookiePart = parts.pop();
    if (cookiePart) {
        return cookiePart.split(';').shift();
    }
  }
  return undefined;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

const getStageIcon = (stage: string, status?: string) => {
  if (status === 'approved') return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status === 'rejected') return <XCircle className="h-4 w-4 text-red-600" />;
  if (status === 'pending') return <Clock className="h-4 w-4 text-yellow-600" />;
  return <User className="h-4 w-4 text-gray-400" />;
};

export default function TimetableApprovalPage() {
  const [timetables, setTimetables] = useState<EnrichedTimetable[]>([]);
  const [filteredTimetables, setFilteredTimetables] = useState<EnrichedTimetable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserCookie | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedTimetable, setSelectedTimetable] = useState<EnrichedTimetable | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionComments, setActionComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const authUserCookie = getCookie('auth_user');
    if (authUserCookie) {
      try {
        const decodedCookie = decodeURIComponent(authUserCookie);
        const parsedUser = JSON.parse(decodedCookie) as UserCookie;
        setUser(parsedUser);
      } catch {
        toast({ variant: "destructive", title: "Authentication Error", description: "Could not load user data." });
      }
    }
  }, [toast]);

  useEffect(() => {
    const fetchTimetableData = async () => {
      setIsLoading(true);
      try {
        // Mock data - replace with actual API calls
        const mockTimetables: EnrichedTimetable[] = [
          {
            id: '1',
            name: 'CS Sem 3 Regular',
            programId: 'cs-prog-1',
            batchId: 'cs-batch-3',
            academicYear: '2024-25',
            semester: 3,
            status: 'pending_approval',
            version: '1.0',
            createdBy: 'faculty-1',
            createdAt: '2024-07-15T00:00:00.000Z',
            updatedAt: '2024-07-20T00:00:00.000Z',
            effectiveDate: '2024-07-15T00:00:00.000Z',
            entries: [],
            departmentName: 'Computer Science',
            programName: 'B.Tech CS',
            batchName: 'CS-A',
            workflow: {
              id: 'wf-1',
              timetableId: '1',
              currentStage: 'hod',
              submittedBy: 'Dr. Smith',
              submittedAt: new Date('2024-07-20'),
              hodApproval: { status: 'pending' },
              history: [
                {
                  id: 'h1',
                  stage: 'Submitted',
                  action: 'submitted',
                  by: 'Dr. Smith',
                  at: new Date('2024-07-20')
                }
              ]
            }
          },
          {
            id: '2',
            name: 'ECE Sem 5 Lab',
            programId: 'ece-prog-1',
            batchId: 'ece-batch-5',
            academicYear: '2024-25',
            semester: 5,
            status: 'pending_approval',
            version: '2.1',
            createdBy: 'faculty-2',
            createdAt: '2024-07-10T00:00:00.000Z',
            updatedAt: '2024-07-18T00:00:00.000Z',
            effectiveDate: '2024-07-10T00:00:00.000Z',
            entries: [],
            departmentName: 'Electronics & Communication',
            programName: 'B.Tech ECE',
            batchName: 'ECE-B',
            workflow: {
              id: 'wf-2',
              timetableId: '2',
              currentStage: 'dean',
              submittedBy: 'Prof. Johnson',
              submittedAt: new Date('2024-07-18'),
              hodApproval: { 
                status: 'approved', 
                approvedBy: 'Dr. Brown',
                approvedAt: new Date('2024-07-19'),
                comments: 'Approved with minor lab scheduling adjustments'
              },
              deanApproval: { status: 'pending' },
              history: [
                {
                  id: 'h2',
                  stage: 'Submitted',
                  action: 'submitted',
                  by: 'Prof. Johnson',
                  at: new Date('2024-07-18')
                },
                {
                  id: 'h3',
                  stage: 'HOD Review',
                  action: 'approved',
                  by: 'Dr. Brown',
                  at: new Date('2024-07-19'),
                  comments: 'Approved with minor lab scheduling adjustments'
                }
              ]
            }
          }
        ];

        setTimetables(mockTimetables);
        setFilteredTimetables(mockTimetables);
      } catch (error) {
        console.error("Error fetching timetable data:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load timetable data." });
      }
      setIsLoading(false);
    };

    fetchTimetableData();
  }, [toast]);

  const filterTimetables = useMemo(() => {
    if (!user) return [];
    
    return filteredTimetables.filter(tt => {
      const workflow = tt.workflow;
      if (!workflow) return false;

      switch (selectedFilter) {
        case 'pending_my_approval':
          if (user.activeRole === 'hod') return workflow.currentStage === 'hod';
          if (user.activeRole === 'dean') return workflow.currentStage === 'dean';
          if (user.activeRole === 'registrar') return workflow.currentStage === 'registrar';
          return false;
        case 'approved':
          return workflow.currentStage === 'approved';
        case 'rejected':
          return workflow.currentStage === 'rejected';
        case 'in_progress':
          return ['hod', 'dean', 'registrar'].includes(workflow.currentStage);
        default:
          return true;
      }
    });
  }, [filteredTimetables, selectedFilter, user]);

  const handleApprovalAction = async (action: 'approve' | 'reject', timetable: EnrichedTimetable) => {
    if (!user || !timetable.workflow) return;
    
    setIsSubmitting(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: `Timetable ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `${timetable.name} has been ${action === 'approve' ? 'approved' : 'rejected'} successfully.`
      });
      
      setIsDialogOpen(false);
      setActionComments('');
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${action} timetable. Please try again.`
      });
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-primary flex items-center gap-2">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6" /> 
            Timetable Approval Workflow
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Manage timetable approvals across departments and administrative levels.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Mobile-responsive filter tabs */}
          <div className="mb-4 sm:mb-6">
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-full sm:w-64">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter timetables" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Timetables</SelectItem>
                <SelectItem value="pending_my_approval">Pending My Approval</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile-responsive timetable grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filterTimetables.map((timetable) => (
              <Card key={timetable.id} className="border hover:shadow-lg transition-shadow">
                <CardHeader className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-sm sm:text-base font-semibold truncate">
                      {timetable.name}
                    </CardTitle>
                    <Badge 
                      className={`${getStatusColor(timetable.workflow?.currentStage || 'pending')} text-xs shrink-0`}
                    >
                      {timetable.workflow?.currentStage.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    {timetable.departmentName} • {timetable.programName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    {/* Workflow progress - mobile responsive */}
                    <div className="space-y-1 sm:space-y-2">
                      <div className="text-xs sm:text-sm font-medium">Approval Progress:</div>
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          {getStageIcon('hod', timetable.workflow?.hodApproval?.status)}
                          <span className="hidden sm:inline">HOD</span>
                          <span className="sm:hidden">H</span>
                        </div>
                        <ArrowRight className="h-3 w-3 text-gray-400 hidden sm:block" />
                        <div className="flex items-center gap-2 text-xs">
                          {getStageIcon('dean', timetable.workflow?.deanApproval?.status)}
                          <span className="hidden sm:inline">Dean</span>
                          <span className="sm:hidden">D</span>
                        </div>
                        <ArrowRight className="h-3 w-3 text-gray-400 hidden sm:block" />
                        <div className="flex items-center gap-2 text-xs">
                          {getStageIcon('registrar', timetable.workflow?.registrarApproval?.status)}
                          <span className="hidden sm:inline">Registrar</span>
                          <span className="sm:hidden">R</span>
                        </div>
                      </div>
                    </div>

                    {/* Details - responsive layout */}
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div>
                        <span className="text-muted-foreground">Version:</span>
                        <div className="font-medium">{timetable.version}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Submitted:</span>
                        <div className="font-medium">
                          {timetable.workflow?.submittedAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons - responsive */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Dialog open={isDialogOpen && selectedTimetable?.id === timetable.id} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-xs sm:text-sm"
                            onClick={() => {
                              setSelectedTimetable(timetable);
                              setIsDialogOpen(true);
                            }}
                          >
                            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-base sm:text-lg">
                              Review Timetable: {selectedTimetable?.name}
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                              Review and provide your approval decision for this timetable.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4 py-4">
                            {/* Timetable details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div>
                                <label className="font-medium">Department:</label>
                                <p>{selectedTimetable?.departmentName}</p>
                              </div>
                              <div>
                                <label className="font-medium">Program:</label>
                                <p>{selectedTimetable?.programName}</p>
                              </div>
                              <div>
                                <label className="font-medium">Batch:</label>
                                <p>{selectedTimetable?.batchName}</p>
                              </div>
                              <div>
                                <label className="font-medium">Version:</label>
                                <p>{selectedTimetable?.version}</p>
                              </div>
                            </div>

                            {/* Approval history */}
                            <div>
                              <label className="font-medium mb-2 block">Approval History:</label>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {selectedTimetable?.workflow?.history.map((item) => (
                                  <div key={item.id} className="flex items-start gap-2 p-2 bg-muted rounded text-xs sm:text-sm">
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {item.action.toUpperCase()} by {item.by}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {item.at.toLocaleString()}
                                      </div>
                                      {item.comments && (
                                        <div className="mt-1 text-muted-foreground italic">
                                          "{item.comments}"
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Comments */}
                            <div>
                              <label className="font-medium mb-2 block">Comments (Optional):</label>
                              <Textarea
                                placeholder="Add your comments or feedback..."
                                value={actionComments}
                                onChange={(e) => setActionComments(e.target.value)}
                                className="min-h-20"
                              />
                            </div>
                          </div>

                          <DialogFooter className="flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="destructive"
                              onClick={() => handleApprovalAction('reject', selectedTimetable!)}
                              disabled={isSubmitting}
                              className="flex-1 sm:flex-none"
                            >
                              {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-2" />
                              )}
                              Reject
                            </Button>
                            <Button
                              onClick={() => handleApprovalAction('approve', selectedTimetable!)}
                              disabled={isSubmitting}
                              className="flex-1 sm:flex-none"
                            >
                              {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Approve
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 text-xs sm:text-sm"
                      >
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filterTimetables.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm sm:text-base">
                No timetables found for the selected filter.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}