import { batchService } from './batches';
import type { Batch, Program } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Create a proper mock for the Response object
const createMockResponse = (options: { ok: boolean; status?: number; statusText?: string; json?: () => Promise<unknown> }): Response => {
  const { ok, status = 200, statusText = '', json = async () => ({}) } = options;
  return {
    ok,
    status,
    statusText,
    json,
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => createMockResponse(options),
    text: async () => '',
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    bodyUsed: false,
  } as Response;
};

// Mock fetch with proper return type
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Batch API', () => {
  const mockBatch: Batch = {
    id: '1',
    name: 'Batch 1',
    programId: "program1",
    status: 'active',
    startAcademicYear: 2023,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockBatches = [mockBatch];
  
  // Create a mock batch data without id for creating new batches
  const newBatchData: Omit<Batch, 'id' | 'createdAt' | 'updatedAt'> = {
    name: 'Batch 1',
    programId: "program1",
    status: 'active',
    startAcademicYear: 2023
  };

  it('should create a batch', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: true,
      json: async () => mockBatch
    }));

    const newBatch = await batchService.createBatch(newBatchData);
    
    expect(fetch).toHaveBeenCalledWith('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBatchData)
    });
    expect(newBatch).toEqual(mockBatch);
  });

  it('should get a batch', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: true,
      json: async () => mockBatch
    }));

    const batch = await batchService.getBatchById('1');
    
    expect(fetch).toHaveBeenCalledWith('/api/batches/1');
    expect(batch).toEqual(mockBatch);
  });

  it('should get all batches', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: true,
      json: async () => mockBatches
    }));

    const batches = await batchService.getAllBatches();
    
    expect(fetch).toHaveBeenCalledWith('/api/batches');
    expect(batches).toEqual(mockBatches);
  });

  it('should update a batch', async () => {
    const updatedMockBatch = { ...mockBatch, name: 'Updated Batch' };
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: true,
      json: async () => updatedMockBatch
    }));

    const updatedBatch = await batchService.updateBatch('1', { name: 'Updated Batch' });
    
    expect(fetch).toHaveBeenCalledWith('/api/batches/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Batch' })
    });
    expect(updatedBatch).toEqual(updatedMockBatch);
  });

  it('should delete a batch', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: true,
      json: async () => ({})
    }));

    await batchService.deleteBatch('1');
    
    expect(fetch).toHaveBeenCalledWith('/api/batches/1', {
      method: 'DELETE'
    });
  });

  it('should import batches', async () => {
    const successResponse = { 
      newCount: 5, 
      updatedCount: 2, 
      skippedCount: 0 
    };
    
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: true,
      json: async () => successResponse
    }));
    
    const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
    const mockPrograms: Program[] = [];
    
    const result = await batchService.importBatches(mockFile, mockPrograms);
    
    // Check that fetch was called with the correct FormData
    expect(fetch).toHaveBeenCalledWith('/api/batches/import', expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData)
    }));
    expect(result).toEqual(successResponse);
  });
  
  it('should handle errors when creating a batch', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Error' })
    }));
    
    await expect(batchService.createBatch(newBatchData)).rejects.toThrow('Internal Server Error');
  });

  it('should handle JSON parsing errors when creating a batch', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 500,
      json: async () => { throw new Error('Invalid JSON'); }
    }));
    
    await expect(batchService.createBatch(newBatchData)).rejects.toThrow('Failed to create batch');
  });
  
  it('should handle errors when getting a batch', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Batch not found' })
    }));
    
    await expect(batchService.getBatchById('1')).rejects.toThrow('Batch not found');
  });

  it('should handle JSON parsing errors when getting a batch', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 404,
      json: async () => { throw new Error('Invalid JSON'); }
    }));
    
    await expect(batchService.getBatchById('1')).rejects.toThrow('Failed to fetch batch with id 1');
  });

  it('should handle errors when getting all batches', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Error' })
    }));

    await expect(batchService.getAllBatches()).rejects.toThrow('Internal Server Error');
  });

  it('should handle JSON parsing errors when getting all batches', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 500,
      json: async () => { throw new Error('Invalid JSON'); }
    }));

    await expect(batchService.getAllBatches()).rejects.toThrow('Failed to fetch batches');
  });

  it('should handle errors when updating a batch', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Error' })
    }));

    await expect(batchService.updateBatch('1', { name: 'Updated Batch' })).rejects.toThrow('Internal Server Error');
  });

  it('should handle JSON parsing errors when updating a batch', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 500,
      json: async () => { throw new Error('Invalid JSON'); }
    }));

    await expect(batchService.updateBatch('1', { name: 'Updated Batch' })).rejects.toThrow('Failed to update batch');
  });

  it('should handle errors when deleting a batch', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Error' })
    }));

    await expect(batchService.deleteBatch('1')).rejects.toThrow('Internal Server Error');
  });

  it('should handle JSON parsing errors when deleting a batch', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 500,
      json: async () => { throw new Error('Invalid JSON'); }
    }));

    await expect(batchService.deleteBatch('1')).rejects.toThrow('Failed to delete batch with id 1');
  });

  it('should handle errors when importing batches', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Error' })
    }));
    
    const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
    const mockPrograms: Program[] = [];
    await expect(batchService.importBatches(mockFile, mockPrograms)).rejects.toThrow('Internal Server Error');
  });

  it('should handle errors with specific issues when importing batches', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 400,
      json: async () => ({ 
        message: 'Validation errors', 
        errors: [
          { message: 'Invalid batch name', data: { row: 1, field: 'name' } },
          { message: 'Invalid program ID', data: { row: 2, field: 'programId' } },
          { message: 'Missing status', data: { row: 3, field: 'status' } },
          { message: 'Invalid year', data: { row: 4, field: 'startAcademicYear' } }
        ] 
      })
    }));
    
    const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
    const mockPrograms: Program[] = [];
    
    await expect(batchService.importBatches(mockFile, mockPrograms))
      .rejects.toThrow('Validation errors Specific issues: Invalid batch name; Invalid program ID; Missing status...');
    
    // Mock the fetch again for the second call in the try/catch block
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 400,
      json: async () => ({ 
        message: 'Validation errors', 
        errors: [
          { message: 'Invalid batch name', data: { row: 1, field: 'name' } },
          { message: 'Invalid program ID', data: { row: 2, field: 'programId' } },
          { message: 'Missing status', data: { row: 3, field: 'status' } },
          { message: 'Invalid year', data: { row: 4, field: 'startAcademicYear' } }
        ] 
      })
    }));
    
    // Verify the error contains the expected data
    try {
      await batchService.importBatches(mockFile, mockPrograms);
      fail('Should have thrown an error');
    } catch (error: unknown) {
      expect((error as Error).message).toContain('Validation errors');
      expect((error as any).data).toBeDefined(); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect((error as any).data.errors.length).toBe(4); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  });

  it('should handle server errors (500) with no message when importing batches', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 500,
      json: async () => ({}) // No message or errors
    }));
    
    const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
    const mockPrograms: Program[] = [];
    
    await expect(batchService.importBatches(mockFile, mockPrograms))
      .rejects.toThrow('Critical error during batch import process. Please check server logs.');
  });

  it('should handle few errors when importing batches', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 400,
      json: async () => ({ 
        message: 'Validation errors', 
        errors: [
          { message: 'Invalid batch name', data: { row: 1, field: 'name' } },
          { message: 'Invalid program ID', data: { row: 2, field: 'programId' } }
        ] 
      })
    }));
    
    const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
    const mockPrograms: Program[] = [];
    
    await expect(batchService.importBatches(mockFile, mockPrograms))
      .rejects.toThrow('Validation errors Specific issues: Invalid batch name; Invalid program ID');
  });

  it('should handle errors with no specific issues when importing batches', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({
      ok: false,
      status: 400,
      json: async () => ({ 
        message: 'Validation errors',
        errors: [] // Empty errors array
      })
    }));
    
    const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
    const mockPrograms: Program[] = [];
    
    await expect(batchService.importBatches(mockFile, mockPrograms))
      .rejects.toThrow('Validation errors');
  });
});