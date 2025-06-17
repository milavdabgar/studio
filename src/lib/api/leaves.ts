// src/lib/api/leaves.ts

export interface LeaveRequest {
  id: string;
  userId: string;
  type: 'sick' | 'casual' | 'vacation' | 'maternity' | 'paternity' | 'emergency';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comments?: string;
  attachments?: string[];
}

export interface LeaveBalance {
  userId: string;
  year: number;
  sick: {
    total: number;
    used: number;
    remaining: number;
  };
  casual: {
    total: number;
    used: number;
    remaining: number;
  };
  vacation: {
    total: number;
    used: number;
    remaining: number;
  };
}

// Mock data for development
const mockLeaveRequests: LeaveRequest[] = [
  {
    id: '1',
    userId: 'FAC001',
    type: 'sick',
    startDate: '2025-06-20',
    endDate: '2025-06-22',
    days: 3,
    reason: 'Fever and flu symptoms',
    status: 'approved',
    appliedAt: '2025-06-18T09:00:00Z',
    reviewedBy: 'ADM001',
    reviewedAt: '2025-06-18T14:00:00Z',
  },
  {
    id: '2',
    userId: 'FAC002',
    type: 'vacation',
    startDate: '2025-07-01',
    endDate: '2025-07-05',
    days: 5,
    reason: 'Family vacation',
    status: 'pending',
    appliedAt: '2025-06-17T10:00:00Z',
  },
];

const mockLeaveBalances: LeaveBalance[] = [
  {
    userId: 'FAC001',
    year: 2025,
    sick: { total: 12, used: 3, remaining: 9 },
    casual: { total: 8, used: 2, remaining: 6 },
    vacation: { total: 20, used: 5, remaining: 15 },
  },
  {
    userId: 'FAC002',
    year: 2025,
    sick: { total: 12, used: 0, remaining: 12 },
    casual: { total: 8, used: 1, remaining: 7 },
    vacation: { total: 20, used: 0, remaining: 20 },
  },
];

export async function getLeaveRequests(userId?: string): Promise<LeaveRequest[]> {
  let requests = mockLeaveRequests;
  if (userId) {
    requests = requests.filter(r => r.userId === userId);
  }
  return Promise.resolve(requests);
}

export async function getLeaveRequest(id: string): Promise<LeaveRequest | null> {
  const request = mockLeaveRequests.find(r => r.id === id);
  return Promise.resolve(request || null);
}

export async function getLeaveBalance(userId: string, year: number = new Date().getFullYear()): Promise<LeaveBalance | null> {
  const balance = mockLeaveBalances.find(b => b.userId === userId && b.year === year);
  return Promise.resolve(balance || null);
}

export async function createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>): Promise<LeaveRequest> {
  const newRequest: LeaveRequest = {
    ...request,
    id: Date.now().toString(),
    status: 'pending',
    appliedAt: new Date().toISOString(),
  };
  return Promise.resolve(newRequest);
}

export async function updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest | null> {
  const request = mockLeaveRequests.find(r => r.id === id);
  if (!request) return null;
  
  const updatedRequest = {
    ...request,
    ...updates,
  };
  return Promise.resolve(updatedRequest);
}

export async function approveLeaveRequest(id: string, reviewerId: string, comments?: string): Promise<LeaveRequest | null> {
  return updateLeaveRequest(id, {
    status: 'approved',
    reviewedBy: reviewerId,
    reviewedAt: new Date().toISOString(),
    comments,
  });
}

export async function rejectLeaveRequest(id: string, reviewerId: string, comments?: string): Promise<LeaveRequest | null> {
  return updateLeaveRequest(id, {
    status: 'rejected',
    reviewedBy: reviewerId,
    reviewedAt: new Date().toISOString(),
    comments,
  });
}

export async function cancelLeaveRequest(id: string): Promise<LeaveRequest | null> {
  return updateLeaveRequest(id, {
    status: 'cancelled',
  });
}

export async function deleteLeaveRequest(id: string): Promise<boolean> {
  return Promise.resolve(true);
}

// Additional service functions
export async function getLeaveRequestsForManagement(params: { facultyId?: string; status?: string; department?: string } = {}): Promise<LeaveRequest[]> {
  // Get all leave requests, could filter by params in real implementation
  return getLeaveRequests();
}

export async function getFacultyLeaveRequests(facultyId: string): Promise<LeaveRequest[]> {
  return getLeaveRequests(facultyId);
}

export async function cancelLeaveRequestByFaculty(leaveId: string, facultyId: string): Promise<LeaveRequest | null> {
  // Could add faculty validation logic here
  return cancelLeaveRequest(leaveId);
}

// Service object that groups all leave-related functions
export const leaveService = {
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
  cancelLeaveRequestByFaculty,
};
