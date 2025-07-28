'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  User,
  MessageSquare,
  FileText,
  Filter,
  RefreshCw,
  Eye,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getApprovalWorkflowService } from '@/lib/services/approvalWorkflowService';
import { NotificationService } from '@/lib/services/notificationService';

interface ApprovalRequest {
  id: string;
  timetableId: string;
  requestedBy: string;
  requestedAt: Date;
  currentStep: number;
  status: 'pending' | 'approved' | 'rejected' | 'timeout' | 'cancelled';
  completedAt?: Date;
  steps: ApprovalStepStatus[];
  comments: ApprovalComment[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: Date;
  metadata: {
    batchId: string;
    academicYear: string;
    semester: number;
    changes?: string[];
  };
}

interface ApprovalStepStatus {
  stepId: string;
  assignedTo: string;
  status: 'pending' | 'approved' | 'rejected' | 'delegated' | 'timeout';
  processedAt?: Date;
  processedBy?: string;
  comments?: string;
  delegatedTo?: string;
  timeoutAt?: Date;
}

interface ApprovalComment {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: Date;
  isInternal: boolean;
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Mock current user - in real app this would come from auth context
  const currentUser = {
    id: 'user1',
    name: 'Dr. John Smith',
    role: 'hod', // or 'principal'
    department: 'Computer Science'
  };

  const { toast } = useToast();

  useEffect(() => {
    fetchApprovalRequests();
  }, [filter, priorityFilter]);

  const fetchApprovalRequests = async () => {
    setLoading(true);
    try {
      // Mock data - in real app this would fetch from API
      const mockRequests: ApprovalRequest[] = [
        {
          id: 'req1',
          timetableId: 'tt1',
          requestedBy: 'admin1',
          requestedAt: new Date('2024-07-26T10:00:00'),
          currentStep: 0,
          status: 'pending',
          steps: [
            {
              stepId: 'hod-review',
              assignedTo: currentUser.id,
              status: 'pending',
              timeoutAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
            },
            {
              stepId: 'principal-approval',
              assignedTo: 'principal1',
              status: 'pending'
            }
          ],
          comments: [
            {
              id: 'c1',
              userId: 'admin1',
              userName: 'Admin User',
              message: 'Please review the timetable for CS Batch A. Some changes made to accommodate new faculty.',
              createdAt: new Date('2024-07-26T10:05:00'),
              isInternal: false
            }
          ],
          priority: 'high',
          deadline: new Date('2024-07-30T17:00:00'),
          metadata: {
            batchId: 'CS-2024-A',
            academicYear: '2024-25',
            semester: 1,
            changes: ['Faculty assignment updated', 'Room allocation changed']
          }
        },
        {
          id: 'req2',
          timetableId: 'tt2',
          requestedBy: 'admin1',
          requestedAt: new Date('2024-07-25T14:00:00'),
          currentStep: 1,
          status: 'pending',
          steps: [
            {
              stepId: 'hod-review',
              assignedTo: currentUser.id,
              status: 'approved',
              processedAt: new Date('2024-07-25T16:30:00'),
              processedBy: currentUser.id,
              comments: 'Looks good, approved for principal review'
            },
            {
              stepId: 'principal-approval',
              assignedTo: 'principal1',
              status: 'pending',
              timeoutAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
            }
          ],
          comments: [],
          priority: 'medium',
          metadata: {
            batchId: 'IT-2024-B',
            academicYear: '2024-25',
            semester: 1
          }
        },
        {
          id: 'req3',
          timetableId: 'tt3',
          requestedBy: 'admin1',
          requestedAt: new Date('2024-07-24T09:00:00'),
          currentStep: 1,
          status: 'approved',
          completedAt: new Date('2024-07-24T18:00:00'),
          steps: [
            {
              stepId: 'hod-review',
              assignedTo: currentUser.id,
              status: 'approved',
              processedAt: new Date('2024-07-24T11:00:00'),
              processedBy: currentUser.id,
              comments: 'All requirements met'
            },
            {
              stepId: 'principal-approval',
              assignedTo: 'principal1',
              status: 'approved',
              processedAt: new Date('2024-07-24T18:00:00'),
              processedBy: 'principal1',
              comments: 'Final approval granted'
            }
          ],
          comments: [],
          priority: 'medium',
          metadata: {
            batchId: 'EC-2024-A',
            academicYear: '2024-25',
            semester: 1
          }
        }
      ];

      // Filter requests based on current user's pending actions
      const filteredRequests = mockRequests.filter(request => {
        if (filter === 'all') return true;
        if (filter === 'pending') {
          const currentStep = request.steps[request.currentStep];
          return request.status === 'pending' && currentStep?.assignedTo === currentUser.id;
        }
        return request.status === filter;
      });

      const pending = filteredRequests.filter(request => {
        const currentStep = request.steps[request.currentStep];
        return request.status === 'pending' && currentStep?.assignedTo === currentUser.id;
      });

      setRequests(filteredRequests);
      setPendingRequests(pending);
    } catch (error) {
      console.error('Failed to fetch approval requests:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load approval requests"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (
    requestId: string, 
    action: 'approve' | 'reject',
    comment?: string
  ) => {
    setActionLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const actionText = action === 'approve' ? 'approved' : 'rejected';
      toast({
        title: `Request ${actionText}`,
        description: `Timetable approval request has been ${actionText}`,
        variant: action === 'approve' ? 'default' : 'destructive'
      });

      // Refresh data
      await fetchApprovalRequests();
      setSelectedRequest(null);
      setComments('');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: `Failed to ${action} the request`
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">Rejected</Badge>;
      case 'timeout':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Timeout</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'hod-review':
        return <User className="h-4 w-4" />;
      case 'principal-approval':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const isCurrentUserStep = (request: ApprovalRequest): boolean => {
    const currentStep = request.steps[request.currentStep];
    return currentStep?.assignedTo === currentUser.id && currentStep?.status === 'pending';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Timetable Approvals</h1>
          <p className="text-gray-600">Review and approve timetable requests</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={fetchApprovalRequests}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Pending Actions</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Approved Today</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Urgent</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id} className={`${isCurrentUserStep(request) ? 'border-orange-200 bg-orange-50' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-lg font-semibold">
                      {request.metadata.batchId} Timetable
                    </h3>
                    {getStatusBadge(request.status)}
                    {getPriorityBadge(request.priority)}
                    {isCurrentUserStep(request) && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Action Required
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">Academic Year:</span> {request.metadata.academicYear}
                    </div>
                    <div>
                      <span className="font-medium">Semester:</span> {request.metadata.semester}
                    </div>
                    <div>
                      <span className="font-medium">Requested:</span> {request.requestedAt.toLocaleDateString()}
                    </div>
                  </div>

                  {request.metadata.changes && (
                    <div className="mb-4">
                      <span className="font-medium text-sm">Changes:</span>
                      <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                        {request.metadata.changes.map((change, index) => (
                          <li key={index}>{change}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Approval Steps */}
                  <div className="flex items-center gap-4 mb-4">
                    {request.steps.map((step, index) => (
                      <div key={step.stepId} className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                          step.status === 'approved' ? 'bg-green-100 text-green-800' :
                          step.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          step.status === 'pending' && index === request.currentStep ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {getStepIcon(step.stepId)}
                          <span>
                            {step.stepId === 'hod-review' ? 'HOD Review' : 'Principal Approval'}
                          </span>
                          {step.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                          {step.status === 'rejected' && <XCircle className="h-3 w-3" />}
                          {step.status === 'pending' && index === request.currentStep && <Clock className="h-3 w-3" />}
                        </div>
                        {index < request.steps.length - 1 && (
                          <div className="w-8 h-px bg-gray-300"></div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Comments Preview */}
                  {request.comments.length > 0 && (
                    <div className="text-sm">
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>{request.comments.length} comment(s)</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                        <p className="text-gray-700">{request.comments[request.comments.length - 1].message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          - {request.comments[request.comments.length - 1].userName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Timetable Approval Request</DialogTitle>
                        <DialogDescription>
                          {request.metadata.batchId} - {request.metadata.academicYear} Semester {request.metadata.semester}
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedRequest && (
                        <div className="space-y-6">
                          {/* Request Details */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Status:</span> {getStatusBadge(selectedRequest.status)}
                            </div>
                            <div>
                              <span className="font-medium">Priority:</span> {getPriorityBadge(selectedRequest.priority)}
                            </div>
                            <div>
                              <span className="font-medium">Requested by:</span> {selectedRequest.requestedBy}
                            </div>
                            <div>
                              <span className="font-medium">Requested on:</span> {selectedRequest.requestedAt.toLocaleString()}
                            </div>
                            {selectedRequest.deadline && (
                              <div className="col-span-2">
                                <span className="font-medium">Deadline:</span> {selectedRequest.deadline.toLocaleString()}
                              </div>
                            )}
                          </div>

                          {/* Changes */}
                          {selectedRequest.metadata.changes && (
                            <div>
                              <h4 className="font-medium mb-2">Changes Made:</h4>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {selectedRequest.metadata.changes.map((change, index) => (
                                  <li key={index}>{change}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Comments */}
                          <div>
                            <h4 className="font-medium mb-3">Comments & Discussion</h4>
                            <div className="space-y-3 max-h-40 overflow-y-auto">
                              {selectedRequest.comments.map((comment) => (
                                <div key={comment.id} className="bg-gray-50 p-3 rounded">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-sm">{comment.userName}</span>
                                    <span className="text-xs text-gray-500">
                                      {comment.createdAt.toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-sm">{comment.message}</p>
                                </div>
                              ))}
                              {selectedRequest.comments.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                              )}
                            </div>
                            
                            {/* Add Comment */}
                            <div className="mt-4">
                              <Textarea
                                placeholder="Add your comments..."
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                rows={3}
                              />
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {isCurrentUserStep(selectedRequest) && (
                            <div className="flex gap-2 pt-4 border-t">
                              <Button
                                onClick={() => handleApprovalAction(selectedRequest.id, 'approve', comments)}
                                disabled={actionLoading}
                                className="flex-1"
                              >
                                <ThumbsUp className="h-4 w-4 mr-2" />
                                {actionLoading ? 'Processing...' : 'Approve'}
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleApprovalAction(selectedRequest.id, 'reject', comments)}
                                disabled={actionLoading}
                                className="flex-1"
                              >
                                <ThumbsDown className="h-4 w-4 mr-2" />
                                {actionLoading ? 'Processing...' : 'Reject'}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {isCurrentUserStep(request) && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleApprovalAction(request.id, 'approve')}
                        disabled={actionLoading}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleApprovalAction(request.id, 'reject')}
                        disabled={actionLoading}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {requests.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Approval Requests</h3>
              <p className="text-gray-600">No timetable approval requests match your current filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}