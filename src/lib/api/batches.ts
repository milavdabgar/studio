import type { Batch, Program } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const batchService = {
  async getAllBatches(): Promise<Batch[]> {
    const response = await fetch(`${API_BASE_URL}/batches`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch batches' }));
      throw new Error(errorData.message || 'Failed to fetch batches');
    }
    return response.json();
  },

  async getBatchById(id: string): Promise<Batch> {
    const response = await fetch(`${API_BASE_URL}/batches/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch batch with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch batch with id ${id}`);
    }
    return response.json();
  },

  async createBatch(batchData: Omit<Batch, 'id' | 'createdAt' | 'updatedAt'>): Promise<Batch> {
    const response = await fetch(`${API_BASE_URL}/batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create batch' }));
      throw new Error(errorData.message || 'Failed to create batch');
    }
    return response.json();
  },

  async updateBatch(id: string, batchData: Partial<Omit<Batch, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Batch> {
    const response = await fetch(`${API_BASE_URL}/batches/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update batch' }));
      throw new Error(errorData.message || 'Failed to update batch');
    }
    return response.json();
  },

  async deleteBatch(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/batches/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete batch with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete batch with id ${id}`);
    }
  },

  async importBatches(file: File, programs: Program[]): Promise<{ newCount: number; updatedCount: number; skippedCount: number; errors?: Array<{ message?: string; data?: unknown; row?: number }> }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('programs', JSON.stringify(programs));

    const response = await fetch(`${API_BASE_URL}/batches/import`, {
      method: 'POST',
      body: formData,
    });

    const responseData = await response.json();
    if (!response.ok) {
      let detailedMessage = responseData.message || 'Failed to import batches.';
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        const errorSummary = responseData.errors.slice(0, 3).map((err: { message?: string; data?: unknown }) => err.message || JSON.stringify(err.data)).join('; ');
        detailedMessage += ` Specific issues: ${errorSummary}${responseData.errors.length > 3 ? '...' : ''}`;
      } else if (response.status === 500 && !responseData.message && !responseData.errors) {
        detailedMessage = 'Critical error during batch import process. Please check server logs.';
      }
      const error = new Error(detailedMessage) as Error & { data?: unknown };
      error.data = responseData; 
      throw error;
    }
    return responseData;
  }
};