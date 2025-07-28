import type { Timetable, TimetableEntry, TimetableConflict } from '@/types/entities';
import { TimetableNotificationService } from './timetableNotificationService';
import { NotificationService } from './notificationService';

interface ApprovalStep {
  id: string;
  name: string;
  role: 'hod' | 'principal' | 'admin';
  order: number;
  isRequired: boolean;
  canDelegate: boolean;
  timeoutHours?: number;
}

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
  attachments: ApprovalAttachment[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: Date;
  metadata: {
    batchId: string;
    academicYear: string;
    semester: number;
    changes?: string[];
    conflicts?: TimetableConflict[];
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
  attachments?: string[];
}

interface ApprovalAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

interface ApprovalAction {
  action: 'approve' | 'reject' | 'delegate' | 'request_changes';
  comments?: string;
  delegateTo?: string;
  changes?: string[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: ApprovalStep[];
  isDefault: boolean;
  applicableFor: {
    batchTypes?: string[];
    departments?: string[];
    semesters?: number[];
  };
}

export class ApprovalWorkflowService {
  private workflows: Map<string, WorkflowTemplate> = new Map();
  private activeRequests: Map<string, ApprovalRequest> = new Map();
  private notificationService: TimetableNotificationService;

  constructor(private baseNotificationService: NotificationService) {
    this.notificationService = new TimetableNotificationService(baseNotificationService);
    this.initializeDefaultWorkflows();
  }

  private initializeDefaultWorkflows() {
    const defaultWorkflow: WorkflowTemplate = {
      id: 'standard-approval',
      name: 'Standard Timetable Approval',
      description: 'Standard approval workflow: HOD → Principal',
      isDefault: true,
      applicableFor: {},
      steps: [
        {
          id: 'hod-review',
          name: 'HOD Review & Approval',
          role: 'hod',
          order: 1,
          isRequired: true,
          canDelegate: true,
          timeoutHours: 48
        },
        {
          id: 'principal-approval',
          name: 'Principal Final Approval',
          role: 'principal',
          order: 2,
          isRequired: true,
          canDelegate: false,
          timeoutHours: 24
        }
      ]
    };

    const urgentWorkflow: WorkflowTemplate = {
      id: 'urgent-approval',
      name: 'Urgent Timetable Approval',
      description: 'Fast-track approval for urgent timetable changes',
      isDefault: false,
      applicableFor: {},
      steps: [
        {
          id: 'principal-urgent',
          name: 'Principal Urgent Approval',
          role: 'principal',
          order: 1,
          isRequired: true,
          canDelegate: false,
          timeoutHours: 12
        }
      ]
    };

    this.workflows.set(defaultWorkflow.id, defaultWorkflow);
    this.workflows.set(urgentWorkflow.id, urgentWorkflow);
  }

  // Create approval request
  async createApprovalRequest(
    timetable: Timetable,
    requestedBy: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    workflowId?: string,
    deadline?: Date,
    changes?: string[]
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      // Select appropriate workflow
      const workflow = this.selectWorkflow(timetable, priority, workflowId);
      if (!workflow) {
        return { success: false, error: 'No suitable workflow found' };
      }

      // Generate request ID
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create approval steps
      const steps: ApprovalStepStatus[] = workflow.steps.map(step => ({
        stepId: step.id,
        assignedTo: this.getStepAssignee(step, timetable),
        status: 'pending',
        timeoutAt: step.timeoutHours ? 
          new Date(Date.now() + step.timeoutHours * 60 * 60 * 1000) : undefined
      }));

      // Create approval request
      const request: ApprovalRequest = {
        id: requestId,
        timetableId: timetable.id,
        requestedBy,
        requestedAt: new Date(),
        currentStep: 0,
        status: 'pending',
        steps,
        comments: [],
        attachments: [],
        priority,
        deadline,
        metadata: {
          batchId: timetable.batchId || '',
          academicYear: timetable.academicYear,
          semester: timetable.semester,
          changes
        }
      };

      this.activeRequests.set(requestId, request);

      // Notify first approver
      await this.notifyNextApprover(request);

      // Schedule timeout check
      this.scheduleTimeoutCheck(request);

      return { success: true, requestId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create approval request' 
      };
    }
  }

  // Process approval action
  async processApproval(
    requestId: string,
    userId: string,
    action: ApprovalAction
  ): Promise<{ success: boolean; nextStep?: string; completed?: boolean; error?: string }> {
    try {
      const request = this.activeRequests.get(requestId);
      if (!request) {
        return { success: false, error: 'Approval request not found' };
      }

      if (request.status !== 'pending') {
        return { success: false, error: 'Request is no longer pending' };
      }

      const currentStep = request.steps[request.currentStep];
      if (!currentStep || currentStep.assignedTo !== userId) {
        return { success: false, error: 'User not authorized for this step' };
      }

      // Process the action
      const now = new Date();
      
      switch (action.action) {
        case 'approve':
          currentStep.status = 'approved';
          currentStep.processedAt = now;
          currentStep.processedBy = userId;
          currentStep.comments = action.comments;
          break;

        case 'reject':
          currentStep.status = 'rejected';
          currentStep.processedAt = now;
          currentStep.processedBy = userId;
          currentStep.comments = action.comments;
          request.status = 'rejected';
          request.completedAt = now;
          break;

        case 'delegate':
          if (!currentStep.delegatedTo && action.delegateTo) {
            currentStep.status = 'delegated';
            currentStep.delegatedTo = action.delegateTo;
            currentStep.assignedTo = action.delegateTo;
            currentStep.comments = action.comments;
          } else {
            return { success: false, error: 'Cannot delegate this step' };
          }
          break;

        case 'request_changes':
          currentStep.status = 'rejected';
          currentStep.processedAt = now;
          currentStep.processedBy = userId;
          currentStep.comments = action.comments;
          // Don't mark as fully rejected, allow resubmission
          break;

        default:
          return { success: false, error: 'Invalid action' };
      }

      // Add comment if provided
      if (action.comments) {
        this.addComment(request, userId, action.comments, false);
      }

      // Check if we can proceed to next step
      if (action.action === 'approve') {
        const nextStepIndex = request.currentStep + 1;
        
        if (nextStepIndex < request.steps.length) {
          // Move to next step
          request.currentStep = nextStepIndex;
          await this.notifyNextApprover(request);
          
          const nextStep = request.steps[nextStepIndex];
          return { 
            success: true, 
            nextStep: nextStep.stepId, 
            completed: false 
          };
        } else {
          // Approval completed
          request.status = 'approved';
          request.completedAt = now;
          
          await this.handleApprovalCompleted(request);
          
          return { 
            success: true, 
            completed: true 
          };
        }
      }

      // Save updated request
      this.activeRequests.set(requestId, request);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process approval' 
      };
    }
  }

  // Get approval request details
  getApprovalRequest(requestId: string): ApprovalRequest | null {
    return this.activeRequests.get(requestId) || null;
  }

  // Get pending requests for user
  getPendingRequestsForUser(userId: string, role: string): ApprovalRequest[] {
    return Array.from(this.activeRequests.values()).filter(request => {
      if (request.status !== 'pending') return false;
      
      const currentStep = request.steps[request.currentStep];
      return currentStep && 
             currentStep.status === 'pending' && 
             (currentStep.assignedTo === userId || this.canUserApproveStep(userId, role, currentStep));
    });
  }

  // Get all requests with filters
  getApprovalRequests(filters: {
    status?: string;
    requestedBy?: string;
    batchId?: string;
    priority?: string;
    fromDate?: Date;
    toDate?: Date;
  } = {}): ApprovalRequest[] {
    let requests = Array.from(this.activeRequests.values());

    if (filters.status) {
      requests = requests.filter(r => r.status === filters.status);
    }

    if (filters.requestedBy) {
      requests = requests.filter(r => r.requestedBy === filters.requestedBy);
    }

    if (filters.batchId) {
      requests = requests.filter(r => r.metadata.batchId === filters.batchId);
    }

    if (filters.priority) {
      requests = requests.filter(r => r.priority === filters.priority);
    }

    if (filters.fromDate) {
      requests = requests.filter(r => r.requestedAt >= filters.fromDate!);
    }

    if (filters.toDate) {
      requests = requests.filter(r => r.requestedAt <= filters.toDate!);
    }

    return requests.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  // Add comment to request
  addComment(
    request: ApprovalRequest,
    userId: string,
    message: string,
    isInternal: boolean = false
  ): void {
    const comment: ApprovalComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName: 'User Name', // Would be fetched from user service
      message,
      createdAt: new Date(),
      isInternal
    };

    request.comments.push(comment);
    this.activeRequests.set(request.id, request);
  }

  // Cancel approval request
  async cancelApprovalRequest(
    requestId: string,
    userId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const request = this.activeRequests.get(requestId);
      if (!request) {
        return { success: false, error: 'Request not found' };
      }

      if (request.requestedBy !== userId) {
        return { success: false, error: 'Only the requester can cancel the request' };
      }

      if (request.status !== 'pending') {
        return { success: false, error: 'Request is no longer pending' };
      }

      request.status = 'cancelled';
      request.completedAt = new Date();
      
      this.addComment(request, userId, `Request cancelled: ${reason}`, false);

      // Notify stakeholders
      await this.notifyRequestCancelled(request);

      this.activeRequests.set(requestId, request);

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to cancel request' 
      };
    }
  }

  // Private helper methods
  private selectWorkflow(
    timetable: Timetable,
    priority: string,
    workflowId?: string
  ): WorkflowTemplate | null {
    if (workflowId) {
      return this.workflows.get(workflowId) || null;
    }

    // Select workflow based on priority and timetable properties
    if (priority === 'urgent') {
      return this.workflows.get('urgent-approval') || null;
    }

    // Return default workflow
    return Array.from(this.workflows.values()).find(w => w.isDefault) || null;
  }

  private getStepAssignee(step: ApprovalStep, timetable: Timetable): string {
    // This would normally fetch from a user directory or assignment service
    // For now, return placeholder based on role and batch
    switch (step.role) {
      case 'hod':
        return `hod_${timetable.batchId}`;
      case 'principal':
        return `principal_main`;
      case 'admin':
        return `admin_timetable`;
      default:
        return 'system';
    }
  }

  private canUserApproveStep(userId: string, userRole: string, step: ApprovalStepStatus): boolean {
    // Check if user has permission to approve this step
    // This would integrate with your authorization system
    return step.assignedTo === userId;
  }

  private async notifyNextApprover(request: ApprovalRequest): Promise<void> {
    try {
      const currentStep = request.steps[request.currentStep];
      if (!currentStep) return;

      // Send notification to assigned approver
      await this.baseNotificationService.sendNotification({
        userId: currentStep.assignedTo,
        type: 'approval_required',
        title: '📋 Timetable Approval Required',
        message: `Timetable approval required for ${request.metadata.batchId} (${request.metadata.academicYear} Semester ${request.metadata.semester})`,
        channels: ['email', 'push'],
        priority: request.priority === 'urgent' ? 'urgent' : 'high',
        data: {
          requestId: request.id,
          timetableId: request.timetableId,
          batchId: request.metadata.batchId,
          deadline: request.deadline?.toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to notify approver:', error);
    }
  }

  private async handleApprovalCompleted(request: ApprovalRequest): Promise<void> {
    try {
      // Update timetable status
      // This would typically call your timetable service to publish the timetable
      
      // Notify requester
      await this.baseNotificationService.sendNotification({
        userId: request.requestedBy,
        type: 'approval_completed',
        title: '✅ Timetable Approved',
        message: `Your timetable for ${request.metadata.batchId} has been approved and will be published.`,
        channels: ['email', 'push'],
        priority: 'high',
        data: {
          requestId: request.id,
          timetableId: request.timetableId,
          batchId: request.metadata.batchId
        }
      });

      // Notify all stakeholders affected by the timetable
      // This would integrate with your stakeholder notification system
      
    } catch (error) {
      console.error('Failed to handle approval completion:', error);
    }
  }

  private async notifyRequestCancelled(request: ApprovalRequest): Promise<void> {
    try {
      // Notify current approver that request was cancelled
      const currentStep = request.steps[request.currentStep];
      if (currentStep && currentStep.status === 'pending') {
        await this.baseNotificationService.sendNotification({
          userId: currentStep.assignedTo,
          type: 'approval_cancelled',
          title: '❌ Approval Request Cancelled',
          message: `Timetable approval request for ${request.metadata.batchId} has been cancelled.`,
          channels: ['email'],
          priority: 'medium',
          data: {
            requestId: request.id,
            timetableId: request.timetableId,
            batchId: request.metadata.batchId
          }
        });
      }
    } catch (error) {
      console.error('Failed to notify request cancellation:', error);
    }
  }

  private scheduleTimeoutCheck(request: ApprovalRequest): void {
    const currentStep = request.steps[request.currentStep];
    if (!currentStep.timeoutAt) return;

    const timeoutMs = currentStep.timeoutAt.getTime() - Date.now();
    if (timeoutMs <= 0) return;

    setTimeout(async () => {
      try {
        const latestRequest = this.activeRequests.get(request.id);
        if (!latestRequest || latestRequest.status !== 'pending') return;

        const latestStep = latestRequest.steps[latestRequest.currentStep];
        if (latestStep.status !== 'pending') return;

        // Mark step as timeout
        latestStep.status = 'timeout';
        
        // Move to next step or escalate
        await this.handleStepTimeout(latestRequest);
        
      } catch (error) {
        console.error('Failed to handle timeout:', error);
      }
    }, timeoutMs);
  }

  private async handleStepTimeout(request: ApprovalRequest): Promise<void> {
    // Implementation would depend on business rules
    // Could escalate to next approver or notify administrators
    console.log(`Step timeout for request ${request.id}`);
  }

  // Workflow analytics
  getWorkflowAnalytics(timeframe: { start: Date; end: Date }) {
    const requests = this.getApprovalRequests({
      fromDate: timeframe.start,
      toDate: timeframe.end
    });

    const totalRequests = requests.length;
    const approvedRequests = requests.filter(r => r.status === 'approved').length;
    const rejectedRequests = requests.filter(r => r.status === 'rejected').length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;

    const averageApprovalTime = this.calculateAverageApprovalTime(
      requests.filter(r => r.status === 'approved')
    );

    const bottlenecks = this.identifyBottlenecks(requests);

    return {
      totalRequests,
      approvedRequests,
      rejectedRequests,
      pendingRequests,
      approvalRate: totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0,
      averageApprovalTime,
      bottlenecks
    };
  }

  private calculateAverageApprovalTime(approvedRequests: ApprovalRequest[]): number {
    const times = approvedRequests
      .filter(r => r.completedAt)
      .map(r => r.completedAt!.getTime() - r.requestedAt.getTime());
    
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
  }

  private identifyBottlenecks(requests: ApprovalRequest[]): { step: string; averageTime: number }[] {
    // Analyze which steps take the longest
    const stepTimes: { [stepId: string]: number[] } = {};
    
    requests.forEach(request => {
      request.steps.forEach((step, index) => {
        if (step.processedAt) {
          const stepTime = step.processedAt.getTime() - request.requestedAt.getTime();
          if (!stepTimes[step.stepId]) {
            stepTimes[step.stepId] = [];
          }
          stepTimes[step.stepId].push(stepTime);
        }
      });
    });

    return Object.entries(stepTimes)
      .map(([stepId, times]) => ({
        step: stepId,
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length
      }))
      .sort((a, b) => b.averageTime - a.averageTime);
  }
}

// Global singleton instance
let approvalServiceInstance: ApprovalWorkflowService | null = null;

export const getApprovalWorkflowService = (notificationService?: NotificationService): ApprovalWorkflowService => {
  if (!approvalServiceInstance && notificationService) {
    approvalServiceInstance = new ApprovalWorkflowService(notificationService);
  }
  return approvalServiceInstance!;
};

export default ApprovalWorkflowService;