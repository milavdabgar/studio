import { batchService } from './batches';
import type { Batch, Program } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the fetch function
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

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
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => mockBatch
    } as Response);

    const newBatch = await batchService.createBatch(newBatchData);
    
    expect(fetch).toHaveBeenCalledWith('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBatchData)
    });
    expect(newBatch).toEqual(mockBatch);
  });

  it('should get a batch', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => mockBatch
    } as Response);

    const batch = await batchService.getBatchById('1');
    
    expect(fetch).toHaveBeenCalledWith('/api/batches/1');
    expect(batch).toEqual(mockBatch);
  });

  it('should get all batches', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => mockBatches
    } as Response);

    const batches = await batchService.getAllBatches();
    
    expect(fetch).toHaveBeenCalledWith('/api/batches');
    expect(batches).toEqual(mockBatches);
  });

  it('should update a batch', async () => {
    const updatedMockBatch = { ...mockBatch, name: 'Updated Batch' };
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => updatedMockBatch
    } as Response);

    const updatedBatch = await batchService.updateBatch('1', { name: 'Updated Batch' });
    
    expect(fetch).toHaveBeenCalledWith('/api/batches/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Batch' })
    });
    expect(updatedBatch).toEqual(updatedMockBatch);
  });

  it('should delete a batch', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({})
    } as Response);

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
    
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => successResponse
    } as Response);
    
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
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Error' })
    } as Response);
    
    await expect(batchService.createBatch(newBatchData)).rejects.toThrow('Internal Server Error');
  });
  
  it('should handle errors when getting a batch', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Batch not found' })
    } as Response);
    
    await expect(batchService.getBatchById('1')).rejects.toThrow('Batch not found');
  });

  it('should handle errors when getting all batches', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Error' })
    } as Response);

    await expect(batchService.getAllBatches()).rejects.toThrow('Internal Server Error');
  });

  it('should handle errors when updating a batch', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Error' })
    } as Response);

    await expect(batchService.updateBatch('1', { name: 'Updated Batch' })).rejects.toThrow('Internal Server Error');
  });

  it('should handle errors when deleting a batch', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Error' })
    } as Response);

    await expect(batchService.deleteBatch('1')).rejects.toThrow('Internal Server Error');
  });

  it('should handle errors when importing batches', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Error' })
    } as Response);
    
    const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
    const mockPrograms: Program[] = [];
    await expect(batchService.importBatches(mockFile, mockPrograms)).rejects.toThrow();
  });
});