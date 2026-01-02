// src/lib/api/leaves.ts

import type { LeaveRequest as EntityLeaveRequest } from '@/types/entities';

export type LeaveRequest = EntityLeaveRequest;

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
    totalDays: 3,
    reason: 'Fever and flu symptoms',
    status: 'approved',
    appliedAt: '2025-06-18T09:00:00Z',
    actionTakenBy: 'ADM001',
    actionTakenAt: '2025-06-18T14:00:00Z',
    createdAt: '2025-06-18T09:00:00Z',
    updatedAt: '2025-06-18T14:00:00Z',
  },
  {
    id: '2',
    userId: 'FAC002',
    type: 'earned',
    startDate: '2025-07-01',
    endDate: '2025-07-05',
    totalDays: 5,
    reason: 'Family vacation',
    status: 'pending',
    appliedAt: '2025-06-17T10:00:00Z',
    createdAt: '2025-06-17T10:00:00Z',
    updatedAt: '2025-06-17T10:00:00Z',
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
  {
    userId: 'FAC001',
    year: 2026,
    sick: { total: 12, used: 0, remaining: 12 },
    casual: { total: 8, used: 0, remaining: 8 },
    vacation: { total: 20, used: 0, remaining: 20 },
  },
  {
    userId: 'FAC002',
    year: 2026,
    sick: { total: 12, used: 0, remaining: 12 },
    casual: { total: 8, used: 0, remaining: 8 },
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

export async function createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status' | 'createdAt' | 'updatedAt'>): Promise<LeaveRequest> {
  const now = new Date().toISOString();
  const newRequest: LeaveRequest = {
    ...request,
    id: Date.now().toString(),
    status: 'pending',
    appliedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  return Promise.resolve(newRequest);
}

export async function updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest | null> {
  const request = mockLeaveRequests.find(r => r.id === id);
  if (!request) return null;
  
  const updatedRequest = {
    ...request,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return Promise.resolve(updatedRequest);
}

export async function approveLeaveRequest(id: string, reviewerId: string, comments?: string): Promise<LeaveRequest | null> {
  return updateLeaveRequest(id, {
    status: 'approved',
    actionTakenBy: reviewerId,
    actionTakenAt: new Date().toISOString(),
    remarks: comments,
  });
}

export async function rejectLeaveRequest(id: string, reviewerId: string, comments?: string): Promise<LeaveRequest | null> {
  return updateLeaveRequest(id, {
    status: 'rejected',
    actionTakenBy: reviewerId,
    actionTakenAt: new Date().toISOString(),
    rejectionReason: comments,
  });
}

export async function cancelLeaveRequest(id: string): Promise<LeaveRequest | null> {
  return updateLeaveRequest(id, {
    status: 'cancelled',
  });
}

export async function deleteLeaveRequest(_id: string): Promise<boolean> {
  void _id; // Unused in mock implementation
  return Promise.resolve(true);
}

// Additional service functions
export async function getLeaveRequestsForManagement(params: { facultyId?: string; status?: string; department?: string } = {}): Promise<LeaveRequest[]> {
  // Get all leave requests, could filter by params in real implementation
  console.log('Mock get leave requests for management with params:', params);
  return getLeaveRequests();
}

export async function getFacultyLeaveRequests(facultyId: string): Promise<LeaveRequest[]> {
  return getLeaveRequests(facultyId);
}

export async function cancelLeaveRequestByFaculty(leaveId: string, facultyId: string): Promise<LeaveRequest | null> {
  // Could add faculty validation logic here
  console.log(`Faculty ${facultyId} cancelling leave ${leaveId}`);
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
