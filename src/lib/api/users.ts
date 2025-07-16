
import type { User, Institute, Role } from '@/types/entities'; 

// Use absolute URL for server-side calls, relative for client-side
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client side - use relative URL
    return '/api';
  }
  // Server side - use absolute URL
  return process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? 
    `${process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}`}/api` : 
    'http://localhost:3000/api';
};

const API_BASE_URL = getBaseUrl();

const userService = {
  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },

  async getUserById(id: string): Promise<Omit<User, 'password'>> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user with id ${id}`);
    }
    return response.json();
  },

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'authProviders' | 'isEmailVerified' | 'preferences'> & { password?: string }): Promise<Omit<User, 'password'>> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create user' }));
      throw new Error(errorData.message || 'Failed to create user');
    }
    return response.json();
  },

  async updateUser(id: string, userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> & { password?: string }): Promise<Omit<User, 'password'>> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update user' }));
      throw new Error(errorData.message || 'Failed to update user');
    }
    return response.json();
  },

  async deleteUser(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete user with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete user with id ${id}`);
    }
  },

  async removeUserRole(userId: string, roleToRemove: string): Promise<{ userDeleted: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/remove-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roleToRemove }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to remove role ${roleToRemove} from user ${userId}` }));
      throw new Error(errorData.message || `Failed to remove role ${roleToRemove} from user ${userId}`);
    }
    return response.json();
  },

  async deleteUserCompletely(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/complete-delete`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to completely delete user ${userId}` }));
      throw new Error(errorData.message || `Failed to completely delete user ${userId}`);
    }
  },

  async importUsers(file: File, institutes: Institute[], allSystemRoles: Role[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number; errors?: Array<{ message?: string; data?: unknown; row?: number }> }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('institutes', JSON.stringify(institutes)); 
    formData.append('allSystemRoles', JSON.stringify(allSystemRoles)); // Pass all roles

    const response = await fetch(`${API_BASE_URL}/users/import`, {
      method: 'POST',
      body: formData,
    });

    const responseData = await response.json();

    if (!response.ok) {
      let detailedMessage = responseData.message || 'Failed to import users.';
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        const errorSummary = responseData.errors.slice(0, 3).map((err: { message?: string; data?: unknown }) => err.message || JSON.stringify(err.data)).join('; ');
        detailedMessage += ` Specific issues: ${errorSummary}${responseData.errors.length > 3 ? '...' : ''}`;
      } else if(response.status === 500 && !responseData.message && !responseData.errors) {
        detailedMessage = 'Critical error during user import process. Please check server logs.';
      }
      const error = new Error(detailedMessage) as Error & { data?: unknown };
      error.data = responseData; 
      throw error;
    }
    return responseData;
  }
};

export { userService };
