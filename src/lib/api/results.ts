import type { Result, ResultFilterParams, ResultsResponse, ResultDetailResponse, BatchesResponse, ResultImportResponse, ResultDeleteBatchResponse, AnalysisResponse, Program } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const resultService = {
  async getAllResults(params: ResultFilterParams = {}): Promise<ResultsResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const response = await fetch(`${API_BASE_URL}/results?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch results' }));
      throw new Error(errorData.message || 'Failed to fetch results');
    }
    return response.json();
  },

  async getResultById(id: string): Promise<ResultDetailResponse> {
    const response = await fetch(`${API_BASE_URL}/results/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch result with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch result with id ${id}`);
    }
    return response.json();
  },

  async getStudentResults(enrollmentNo: string): Promise<ResultsResponse> {
    const response = await fetch(`${API_BASE_URL}/results/student/${enrollmentNo}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch student results' }));
      throw new Error(errorData.message || 'Failed to fetch student results');
    }
    return response.json();
  },

  async getUploadBatches(): Promise<BatchesResponse> {
    const response = await fetch(`${API_BASE_URL}/results/batches`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch upload batches' }));
      throw new Error(errorData.message || 'Failed to fetch upload batches');
    }
    return response.json();
  },

  async importResults(file: File): Promise<ResultImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/results/import`, {
      method: 'POST',
      body: formData,
    });
    const responseData = await response.json();
    if (!response.ok) {
      let detailedMessage = responseData.message || 'Failed to import results (standard).';
      if(responseData.error) detailedMessage = responseData.error; // Prefer server's error message if available
      const error = new Error(detailedMessage) as Error & { data?: unknown };
      error.data = responseData;
      throw error;
    }
    return responseData;
  },

  async importGtuResults(file: File, programs: Program[]): Promise<ResultImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('programs', JSON.stringify(programs));

    const response = await fetch(`${API_BASE_URL}/results/import-gtu`, {
      method: 'POST',
      body: formData,
    });
    const responseData = await response.json();
     if (!response.ok) {
      let detailedMessage = responseData.message || 'Failed to import GTU results.';
       if(responseData.error) detailedMessage = responseData.error;
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        const errorSummary = responseData.errors.slice(0, 3).map((err: { message?: string; data?: unknown }) => err.message || JSON.stringify(err.data)).join('; ');
        detailedMessage += ` Specific issues: ${errorSummary}${responseData.errors.length > 3 ? '...' : ''}`;
      }
      const error = new Error(detailedMessage) as Error & { data?: unknown };
      error.data = responseData;
      throw error;
    }
    return responseData;
  },

  async exportResults(params: ResultFilterParams = {}): Promise<Response> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const response = await fetch(`${API_BASE_URL}/results/export?${queryParams.toString()}`);
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Failed to export results and could not parse error.');
      throw new Error(errorText || 'Failed to export results');
    }
    return response; // Return the raw response for blob handling
  },

  async deleteResult(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/results/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete result with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete result with id ${id}`);
    }
  },

  async deleteResultsByBatch(batchId: string): Promise<ResultDeleteBatchResponse> {
    const response = await fetch(`${API_BASE_URL}/results/batch/${batchId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete results by batch' }));
      throw new Error(errorData.message || 'Failed to delete results by batch');
    }
    return response.json();
  },

  async getBranchAnalysis(params: { academicYear?: string; examid?: number } = {}): Promise<AnalysisResponse> {
    const queryParams = new URLSearchParams();
    if (params.academicYear) queryParams.append('academicYear', params.academicYear);
    if (params.examid !== undefined) queryParams.append('examid', String(params.examid));
    
    const response = await fetch(`${API_BASE_URL}/results/analysis?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch branch analysis' }));
      throw new Error(errorData.message || 'Failed to fetch branch analysis');
    }
    return response.json();
  }
};

export default resultService;
