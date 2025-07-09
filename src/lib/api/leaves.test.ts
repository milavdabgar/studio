import { 
  leaveService,
  getLeaveRequests,
  getLeaveRequest,
  getLeaveBalance,
  createLeaveRequest,
  updateLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  deleteLeaveRequest,
  getLeaveRequestsForManagement,
  getFacultyLeaveRequests,
  cancelLeaveRequestByFaculty
} from './leaves';
import { describe, it, expect } from '@jest/globals';

describe('LeaveService Tests', () => {
  describe('getLeaveRequests', () => {
    it('should return all leave requests when no userId provided', async () => {
      const requests = await getLeaveRequests();
      expect(requests).toHaveLength(2);
      expect(requests[0]).toMatchObject({
        id: '1',
        userId: 'FAC001',
        type: 'sick',
        status: 'approved'
      });
      expect(requests[1]).toMatchObject({
        id: '2',
        userId: 'FAC002',
        type: 'earned',
        status: 'pending'
      });
    });

    it('should filter requests by userId when provided', async () => {
      const requests = await getLeaveRequests('FAC001');
      expect(requests).toHaveLength(1);
      expect(requests[0].userId).toBe('FAC001');
      expect(requests[0].id).toBe('1');
    });

    it('should return empty array for non-existent userId', async () => {
      const requests = await getLeaveRequests('NONEXISTENT');
      expect(requests).toHaveLength(0);
    });

    it('should return requests with correct structure', async () => {
      const requests = await getLeaveRequests();
      requests.forEach(request => {
        expect(request).toHaveProperty('id');
        expect(request).toHaveProperty('userId');
        expect(request).toHaveProperty('type');
        expect(request).toHaveProperty('startDate');
        expect(request).toHaveProperty('endDate');
        expect(request).toHaveProperty('totalDays');
        expect(request).toHaveProperty('reason');
        expect(request).toHaveProperty('status');
        expect(request).toHaveProperty('appliedAt');
        expect(typeof request.totalDays).toBe('number');
      });
    });
  });

  describe('getLeaveRequest', () => {
    it('should return leave request by ID', async () => {
      const request = await getLeaveRequest('1');
      expect(request).not.toBeNull();
      expect(request?.id).toBe('1');
      expect(request?.userId).toBe('FAC001');
      expect(request?.type).toBe('sick');
      expect(request?.status).toBe('approved');
    });

    it('should return null for non-existent request', async () => {
      const request = await getLeaveRequest('nonexistent');
      expect(request).toBeNull();
    });

    it('should return approved request with review details', async () => {
      const request = await getLeaveRequest('1');
      expect(request?.actionTakenBy).toBe('ADM001');
      expect(request?.actionTakenAt).toBeDefined();
      expect(request?.status).toBe('approved');
    });

    it('should return pending request without review details', async () => {
      const request = await getLeaveRequest('2');
      expect(request?.actionTakenBy).toBeUndefined();
      expect(request?.actionTakenAt).toBeUndefined();
      expect(request?.status).toBe('pending');
    });
  });

  describe('getLeaveBalance', () => {
    it('should return leave balance for user and year', async () => {
      const balance = await getLeaveBalance('FAC001', 2025);
      expect(balance).not.toBeNull();
      expect(balance?.userId).toBe('FAC001');
      expect(balance?.year).toBe(2025);
      expect(balance?.sick).toMatchObject({
        total: 12,
        used: 3,
        remaining: 9
      });
      expect(balance?.casual).toMatchObject({
        total: 8,
        used: 2,
        remaining: 6
      });
      expect(balance?.vacation).toMatchObject({
        total: 20,
        used: 5,
        remaining: 15
      });
    });

    it('should return leave balance for current year when year not specified', async () => {
      const currentYear = new Date().getFullYear();
      const balance = await getLeaveBalance('FAC001');
      expect(balance?.year).toBe(currentYear);
    });

    it('should return null for non-existent user', async () => {
      const balance = await getLeaveBalance('NONEXISTENT', 2025);
      expect(balance).toBeNull();
    });

    it('should return null for non-existent year', async () => {
      const balance = await getLeaveBalance('FAC001', 2023);
      expect(balance).toBeNull();
    });

    it('should return balance with correct structure', async () => {
      const balance = await getLeaveBalance('FAC002', 2025);
      expect(balance?.sick).toHaveProperty('total');
      expect(balance?.sick).toHaveProperty('used');
      expect(balance?.sick).toHaveProperty('remaining');
      expect(balance?.casual).toHaveProperty('total');
      expect(balance?.casual).toHaveProperty('used');
      expect(balance?.casual).toHaveProperty('remaining');
      expect(balance?.vacation).toHaveProperty('total');
      expect(balance?.vacation).toHaveProperty('used');
      expect(balance?.vacation).toHaveProperty('remaining');
    });
  });

  describe('createLeaveRequest', () => {
    it('should create new leave request', async () => {
      const newRequestData = {
        userId: 'FAC003',
        type: 'casual' as const,
        startDate: '2025-08-01',
        endDate: '2025-08-02',
        totalDays: 2,
        reason: 'Personal work'
      };

      const createdRequest = await createLeaveRequest(newRequestData);
      
      expect(createdRequest).toMatchObject(newRequestData);
      expect(createdRequest.id).toBeDefined();
      expect(createdRequest.status).toBe('pending');
      expect(createdRequest.appliedAt).toBeDefined();
      expect(createdRequest.createdAt).toBeDefined();
      expect(createdRequest.updatedAt).toBeDefined();
      expect(new Date(createdRequest.appliedAt)).toBeInstanceOf(Date);
    });

    it('should set default status to pending', async () => {
      const newRequestData = {
        userId: 'FAC004',
        type: 'unpaid' as const,
        startDate: '2025-08-05',
        endDate: '2025-08-05',
        totalDays: 1,
        reason: 'Emergency'
      };

      const createdRequest = await createLeaveRequest(newRequestData);
      expect(createdRequest.status).toBe('pending');
    });
  });

  describe('updateLeaveRequest', () => {
    it('should update existing leave request', async () => {
      const updates = {
        reason: 'Updated reason',
        totalDays: 4
      };

      const updatedRequest = await updateLeaveRequest('1', updates);
      
      expect(updatedRequest).not.toBeNull();
      expect(updatedRequest?.reason).toBe('Updated reason');
      expect(updatedRequest?.totalDays).toBe(4);
      expect(updatedRequest?.id).toBe('1');
      expect(updatedRequest?.userId).toBe('FAC001'); // unchanged fields should remain
    });

    it('should return null for non-existent request', async () => {
      const updates = { reason: 'New reason' };
      const result = await updateLeaveRequest('nonexistent', updates);
      
      expect(result).toBeNull();
    });

    it('should handle partial updates', async () => {
      const updates = { status: 'cancelled' as const };
      const updatedRequest = await updateLeaveRequest('2', updates);
      
      expect(updatedRequest?.status).toBe('cancelled');
      expect(updatedRequest?.reason).toBe('Family vacation'); // other fields unchanged
    });
  });

  describe('approveLeaveRequest', () => {
    it('should approve leave request with reviewer details', async () => {
      const approvedRequest = await approveLeaveRequest('2', 'ADM001', 'Approved by manager');
      
      expect(approvedRequest).not.toBeNull();
      expect(approvedRequest?.status).toBe('approved');
      expect(approvedRequest?.actionTakenBy).toBe('ADM001');
      expect(approvedRequest?.actionTakenAt).toBeDefined();
      expect(approvedRequest?.remarks).toBe('Approved by manager');
      expect(new Date(approvedRequest!.actionTakenAt!)).toBeInstanceOf(Date);
    });

    it('should approve leave request without comments', async () => {
      const approvedRequest = await approveLeaveRequest('2', 'ADM002');
      
      expect(approvedRequest?.status).toBe('approved');
      expect(approvedRequest?.actionTakenBy).toBe('ADM002');
      expect(approvedRequest?.remarks).toBeUndefined();
    });

    it('should return null for non-existent request', async () => {
      const result = await approveLeaveRequest('nonexistent', 'ADM001');
      expect(result).toBeNull();
    });
  });

  describe('rejectLeaveRequest', () => {
    it('should reject leave request with reviewer details', async () => {
      const rejectedRequest = await rejectLeaveRequest('2', 'ADM001', 'Insufficient leave balance');
      
      expect(rejectedRequest).not.toBeNull();
      expect(rejectedRequest?.status).toBe('rejected');
      expect(rejectedRequest?.actionTakenBy).toBe('ADM001');
      expect(rejectedRequest?.actionTakenAt).toBeDefined();
      expect(rejectedRequest?.rejectionReason).toBe('Insufficient leave balance');
    });

    it('should reject leave request without comments', async () => {
      const rejectedRequest = await rejectLeaveRequest('2', 'ADM002');
      
      expect(rejectedRequest?.status).toBe('rejected');
      expect(rejectedRequest?.actionTakenBy).toBe('ADM002');
      expect(rejectedRequest?.rejectionReason).toBeUndefined();
    });

    it('should return null for non-existent request', async () => {
      const result = await rejectLeaveRequest('nonexistent', 'ADM001');
      expect(result).toBeNull();
    });
  });

  describe('cancelLeaveRequest', () => {
    it('should cancel leave request', async () => {
      const cancelledRequest = await cancelLeaveRequest('2');
      
      expect(cancelledRequest).not.toBeNull();
      expect(cancelledRequest?.status).toBe('cancelled');
      expect(cancelledRequest?.id).toBe('2');
    });

    it('should return null for non-existent request', async () => {
      const result = await cancelLeaveRequest('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('deleteLeaveRequest', () => {
    it('should delete leave request successfully', async () => {
      const result = await deleteLeaveRequest('1');
      expect(result).toBe(true);
    });

    it('should return true even for non-existent request', async () => {
      const result = await deleteLeaveRequest('nonexistent');
      expect(result).toBe(true);
    });
  });

  describe('getLeaveRequestsForManagement', () => {
    it('should return all leave requests for management', async () => {
      const requests = await getLeaveRequestsForManagement();
      expect(requests).toHaveLength(2);
    });

    it('should return all requests regardless of parameters', async () => {
      const requests = await getLeaveRequestsForManagement({ 
        facultyId: 'FAC001', 
        status: 'pending' 
      });
      expect(requests).toHaveLength(2); // Currently returns all, could be filtered in real implementation
    });
  });

  describe('getFacultyLeaveRequests', () => {
    it('should return leave requests for specific faculty', async () => {
      const requests = await getFacultyLeaveRequests('FAC001');
      expect(requests).toHaveLength(1);
      expect(requests[0].userId).toBe('FAC001');
    });

    it('should return empty array for faculty with no requests', async () => {
      const requests = await getFacultyLeaveRequests('FAC999');
      expect(requests).toHaveLength(0);
    });
  });

  describe('cancelLeaveRequestByFaculty', () => {
    it('should cancel leave request by faculty', async () => {
      const cancelledRequest = await cancelLeaveRequestByFaculty('2', 'FAC002');
      
      expect(cancelledRequest).not.toBeNull();
      expect(cancelledRequest?.status).toBe('cancelled');
      expect(cancelledRequest?.id).toBe('2');
    });

    it('should return null for non-existent request', async () => {
      const result = await cancelLeaveRequestByFaculty('nonexistent', 'FAC001');
      expect(result).toBeNull();
    });
  });

  describe('leaveService object', () => {
    it('should expose all leave service methods', () => {
      expect(leaveService).toHaveProperty('getLeaveRequests');
      expect(leaveService).toHaveProperty('getLeaveRequest');
      expect(leaveService).toHaveProperty('getLeaveBalance');
      expect(leaveService).toHaveProperty('createLeaveRequest');
      expect(leaveService).toHaveProperty('updateLeaveRequest');
      expect(leaveService).toHaveProperty('approveLeaveRequest');
      expect(leaveService).toHaveProperty('rejectLeaveRequest');
      expect(leaveService).toHaveProperty('cancelLeaveRequest');
      expect(leaveService).toHaveProperty('deleteLeaveRequest');
      expect(leaveService).toHaveProperty('getLeaveRequestsForManagement');
      expect(leaveService).toHaveProperty('getFacultyLeaveRequests');
      expect(leaveService).toHaveProperty('cancelLeaveRequestByFaculty');
    });

    it('should have methods that are functions', () => {
      Object.values(leaveService).forEach(method => {
        expect(typeof method).toBe('function');
      });
    });

    it('should work through service object methods', async () => {
      const requests = await leaveService.getLeaveRequests();
      expect(requests).toHaveLength(2);

      const balance = await leaveService.getLeaveBalance('FAC001', 2025);
      expect(balance?.userId).toBe('FAC001');
    });
  });
});