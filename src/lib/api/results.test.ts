import { resultService } from './results';
import type { Result, UploadBatch, BranchAnalysis, ResultFilterParams, ResultsResponse, ResultDetailResponse, BatchesResponse, ResultImportResponse, ResultDeleteBatchResponse, AnalysisResponse, Program } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const createMockResponse = (options: { ok: boolean; status?: number; json?: () => Promise<unknown>; text?: () => Promise<string>, blob?: () => Promise<Blob> }): Response => {
  return {
    ok: options.ok,
    status: options.status || (options.ok ? 200 : 500),
    statusText: options.ok ? 'OK' : 'Error',
    json: options.json || (async () => ({})),
    text: options.text || (async () => JSON.stringify(await (options.json ? options.json() : {}))),
    blob: options.blob || (async () => new Blob([JSON.stringify(await (options.json ? options.json() : {}))], { type: 'application/json' })),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => createMockResponse(options),
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    bodyUsed: false,
  } as Response;
};

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('ResultService API Tests', () => {
  const now = new Date().toISOString();
  const mockResult: Result = {
    _id: "res1", st_id: "s1", enrollmentNo: "E001", name: "John Doe", branchName: "CS", semester: 1,
    subjects: [{ code: "CS101", name: "Intro", credits: 4, grade: "AA", isBacklog: false }],
    spi: 10, cpi: 10, result: "PASS", uploadBatch: "batch1", createdAt: now, updatedAt: now, totalCredits: 4, earnedCredits: 4,
  };
  const mockResultsResponse: ResultsResponse = { status: 'success', data: { results: [mockResult], pagination: { total: 1, page: 1, limit: 10, pages: 1 }}};
  const mockResultDetailResponse: ResultDetailResponse = { status: 'success', data: { result: mockResult }};
  const mockBatches: UploadBatch[] = [{ _id: 'batch1', count: 1, latestUpload: now }];
  const mockBatchesResponse: BatchesResponse = { status: 'success', data: { batches: mockBatches }};
  const mockBranchAnalysis: BranchAnalysis[] = [{ _id: { branchName: "CS", semester: 1 }, totalStudents: 1, passCount: 1, distinctionCount: 1, firstClassCount: 0, secondClassCount: 0, passPercentage: 100, avgSpi: 10, avgCpi: 10 }];
  const mockAnalysisResponse: AnalysisResponse = { status: 'success', data: { analysis: mockBranchAnalysis }};
  const mockPrograms: Program[] = [{ id: 'prog1', name: 'CS Program', code: 'CS', departmentId: 'dept1', instituteId: 'inst1', status: 'active' }];


  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getAllResults', () => {
    it('should fetch all results successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockResultsResponse }));
      const result = await resultService.getAllResults();
      expect(fetch).toHaveBeenCalledWith('/api/results?');
      expect(result).toEqual(mockResultsResponse);
    });

    it('should handle query parameters correctly', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockResultsResponse }));
      const params: ResultFilterParams = {
        branchName: 'CS',
        semester: 1,
        academicYear: '2024-25',
        search: 'John'
      };
      await resultService.getAllResults(params);
      expect(fetch).toHaveBeenCalledWith('/api/results?branchName=CS&semester=1&academicYear=2024-25&search=John');
    });

    it('should filter out empty parameters', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockResultsResponse }));
      const params: ResultFilterParams = {
        branchName: 'CS',
        semester: undefined,
        academicYear: undefined,
        search: ''
      };
      await resultService.getAllResults(params);
      expect(fetch).toHaveBeenCalledWith('/api/results?branchName=CS');
    });

    it('should handle errors when fetching results', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Fetch error' }) }));
      await expect(resultService.getAllResults()).rejects.toThrow('Fetch error');
    });

    it('should handle errors without message when fetching results', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(resultService.getAllResults()).rejects.toThrow('Failed to fetch results');
    });

    it('should handle error response without message property', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(resultService.getAllResults()).rejects.toThrow('Failed to fetch results');
    });
  });

  describe('getResultById', () => {
    it('should fetch a result by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockResultDetailResponse }));
      const result = await resultService.getResultById('res1');
      expect(fetch).toHaveBeenCalledWith('/api/results/res1');
      expect(result).toEqual(mockResultDetailResponse);
    });

    it('should handle errors when fetching result by ID', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Result not found' }) }));
      await expect(resultService.getResultById('res999')).rejects.toThrow('Result not found');
    });

    it('should handle errors without message when fetching result by ID', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(resultService.getResultById('res1')).rejects.toThrow('Failed to fetch result with id res1');
    });

    it('should handle error response without message property when fetching result by ID', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(resultService.getResultById('res1')).rejects.toThrow('Failed to fetch result with id res1');
    });
  });

  describe('getStudentResults', () => {
    it('should fetch results for a student successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockResultsResponse }));
      const result = await resultService.getStudentResults('E001');
      expect(fetch).toHaveBeenCalledWith('/api/results/student/E001');
      expect(result).toEqual(mockResultsResponse);
    });

    it('should handle errors when fetching student results', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Student not found' }) }));
      await expect(resultService.getStudentResults('E999')).rejects.toThrow('Student not found');
    });

    it('should handle errors without message when fetching student results', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(resultService.getStudentResults('E001')).rejects.toThrow('Failed to fetch student results');
    });

    it('should handle error response without message property when fetching student results', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(resultService.getStudentResults('E001')).rejects.toThrow('Failed to fetch student results');
    });
  });

  describe('getUploadBatches', () => {
    it('should fetch upload batches successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockBatchesResponse }));
      const result = await resultService.getUploadBatches();
      expect(fetch).toHaveBeenCalledWith('/api/results/batches');
      expect(result).toEqual(mockBatchesResponse);
    });

    it('should handle errors when fetching upload batches', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Failed to fetch batches' }) }));
      await expect(resultService.getUploadBatches()).rejects.toThrow('Failed to fetch batches');
    });

    it('should handle errors without message when fetching upload batches', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(resultService.getUploadBatches()).rejects.toThrow('Failed to fetch upload batches');
    });

    it('should handle error response without message property when fetching upload batches', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(resultService.getUploadBatches()).rejects.toThrow('Failed to fetch upload batches');
    });
  });

  describe('createResult', () => {
    const newResultData = {
      st_id: "s2", 
      enrollmentNo: "E002", 
      name: "Jane Doe", 
      branchName: "IT", 
      semester: 2,
      subjects: [{ code: "IT201", name: "Data Structures", credits: 4, grade: "AB", isBacklog: false }],
      spi: 9, 
      cpi: 9, 
      result: "PASS" as const, 
      uploadBatch: "batch2", 
      totalCredits: 4, 
      earnedCredits: 4
    };
    const createdResult = { _id: 'res2', ...newResultData, createdAt: now, updatedAt: now };

    it('should create a result successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => createdResult }));
      const result = await resultService.createResult(newResultData);
      expect(fetch).toHaveBeenCalledWith('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResultData),
      });
      expect(result).toEqual(createdResult);
    });

    it('should handle errors when creating result', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Validation failed' }) }));
      await expect(resultService.createResult(newResultData)).rejects.toThrow('Validation failed');
    });

    it('should handle errors without message when creating result', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(resultService.createResult(newResultData)).rejects.toThrow('Failed to create result entry');
    });

    it('should handle error response without message property when creating result', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(resultService.createResult(newResultData)).rejects.toThrow('Failed to create result entry');
    });
  });

  describe('updateResult', () => {
    const updateData = { spi: 9.5, cpi: 9.2 };
    const updatedResult = { ...mockResult, ...updateData, updatedAt: now };

    it('should update a result successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => updatedResult }));
      const result = await resultService.updateResult('res1', updateData);
      expect(fetch).toHaveBeenCalledWith('/api/results/res1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      expect(result).toEqual(updatedResult);
    });

    it('should handle errors when updating result', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Result not found' }) }));
      await expect(resultService.updateResult('res999', updateData)).rejects.toThrow('Result not found');
    });

    it('should handle errors without message when updating result', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(resultService.updateResult('res1', updateData)).rejects.toThrow('Failed to update result entry');
    });

    it('should handle error response without message property when updating result', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(resultService.updateResult('res1', updateData)).rejects.toThrow('Failed to update result entry');
    });
  });

  describe('importResults (Standard)', () => {
    const mockFile = new File(['csv content'], 'results.csv', { type: 'text/csv' });
    const mockImportResponse: ResultImportResponse = { status: 'success', data: { batchId: 'batchImp1', importedCount: 10, totalRows: 10 }};
    
    it('should import standard results successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockImportResponse }));
      const result = await resultService.importResults(mockFile);
      expect(fetch).toHaveBeenCalledWith('/api/results/import-standard-placeholder', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
      expect(result).toEqual(mockImportResponse);
    });

    it('should handle errors when importing standard results with message', async () => {
      const errorResponse = { message: 'Import failed', error: 'Invalid format' };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => errorResponse }));
      
      try {
        await resultService.importResults(mockFile);
        fail('Should have thrown an error');
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(error.message).toBe('Invalid format');
        expect(error.data).toEqual(errorResponse);
      }
    });

    it('should handle errors when importing standard results without error property', async () => {
      const errorResponse = { message: 'Import failed' };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => errorResponse }));
      
      try {
        await resultService.importResults(mockFile);
        fail('Should have thrown an error');
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(error.message).toBe('Import failed');
        expect(error.data).toEqual(errorResponse);
      }
    });

    it('should handle errors when importing standard results without message', async () => {
      const errorResponse = { error: 'Some error' };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => errorResponse }));
      
      try {
        await resultService.importResults(mockFile);
        fail('Should have thrown an error');
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(error.message).toBe('Some error'); // responseData.error overwrites the default message
        expect(error.data).toEqual(errorResponse);
      }
    });
  });

  describe('importGtuResults', () => {
    const mockFile = new File(['csv content'], 'gtu_results.csv', { type: 'text/csv' });
    const mockGtuImportResponse: ResultImportResponse = { status: 'success', data: { batchId: 'gtuBatch1', importedCount: 10, totalRows: 10 }, newCount: 10, updatedCount: 0, skippedCount: 0 };
    
    it('should import GTU results successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockGtuImportResponse }));
      const result = await resultService.importGtuResults(mockFile, mockPrograms);
      expect(fetch).toHaveBeenCalledWith('/api/results/import-gtu', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
      expect(result).toEqual(mockGtuImportResponse);
    });

    it('should handle errors when importing GTU results with detailed errors', async () => {
      const errorResponse = {
        message: 'GTU Import failed',
        error: 'Invalid format',
        errors: [
          { message: 'Row 1: Missing enrollment', data: { row: 1 } },
          { message: 'Row 2: Invalid grade', data: { row: 2 } },
          { message: 'Row 3: Missing program', data: { row: 3 } },
          { message: 'Row 4: Invalid semester', data: { row: 4 } }
        ]
      };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => errorResponse }));
      
      try {
        await resultService.importGtuResults(mockFile, mockPrograms);
        fail('Should have thrown an error');
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(error.message).toBe('Invalid format Specific issues: Row 1: Missing enrollment; Row 2: Invalid grade; Row 3: Missing program...');
        expect(error.data).toEqual(errorResponse);
      }
    });

    it('should handle errors when importing GTU results with few errors', async () => {
      const errorResponse = {
        message: 'GTU Import failed',
        error: 'Invalid format',
        errors: [
          { message: 'Row 1: Missing enrollment', data: { row: 1 } },
          { message: 'Row 2: Invalid grade', data: { row: 2 } }
        ]
      };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => errorResponse }));
      
      try {
        await resultService.importGtuResults(mockFile, mockPrograms);
        fail('Should have thrown an error');
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(error.message).toBe('Invalid format Specific issues: Row 1: Missing enrollment; Row 2: Invalid grade');
        expect(error.data).toEqual(errorResponse);
      }
    });

    it('should handle errors when importing GTU results without error property', async () => {
      const errorResponse = {
        message: 'GTU Import failed',
        errors: [{ message: 'Some error', data: null }]
      };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => errorResponse }));
      
      try {
        await resultService.importGtuResults(mockFile, mockPrograms);
        fail('Should have thrown an error');
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(error.message).toBe('GTU Import failed Specific issues: Some error');
        expect(error.data).toEqual(errorResponse);
      }
    });

    it('should handle errors when importing GTU results with errors missing message', async () => {
      const errorResponse = {
        message: 'GTU Import failed',
        error: 'Invalid format',
        errors: [
          { data: { row: 1, issue: 'missing field' } },
          { message: 'Row 2: Valid error', data: { row: 2 } }
        ]
      };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => errorResponse }));
      
      try {
        await resultService.importGtuResults(mockFile, mockPrograms);
        fail('Should have thrown an error');
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(error.message).toBe('Invalid format Specific issues: {"row":1,"issue":"missing field"}; Row 2: Valid error');
        expect(error.data).toEqual(errorResponse);
      }
    });

    it('should handle errors when importing GTU results without message', async () => {
      const errorResponse = { error: 'Some error' };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => errorResponse }));
      
      try {
        await resultService.importGtuResults(mockFile, mockPrograms);
        fail('Should have thrown an error');
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        expect(error.message).toBe('Some error'); // responseData.error overwrites the default message
        expect(error.data).toEqual(errorResponse);
      }
    });
  });
  
  describe('exportResults', () => {
    it('should export results to CSV successfully', async () => {
      const mockBlob = new Blob(["csv data"], {type: 'text/csv'});
      const mockResponse = createMockResponse({ ok: true, blob: async () => mockBlob });
      mockFetch.mockResolvedValueOnce(mockResponse);
      const response = await resultService.exportResults();
      expect(fetch).toHaveBeenCalledWith('/api/results/export?');
      expect(response).toBe(mockResponse); // Check that it returns the Response object
      const blobData = await response.blob();
      expect(blobData.type).toBe('text/csv');
    });

    it('should handle query parameters correctly for export', async () => {
      const mockBlob = new Blob(["csv data"], {type: 'text/csv'});
      const mockResponse = createMockResponse({ ok: true, blob: async () => mockBlob });
      mockFetch.mockResolvedValueOnce(mockResponse);
      const params: ResultFilterParams = {
        branchName: 'CS',
        semester: 1,
        academicYear: '2024-25'
      };
      await resultService.exportResults(params);
      expect(fetch).toHaveBeenCalledWith('/api/results/export?branchName=CS&semester=1&academicYear=2024-25');
    });

    it('should filter out empty parameters for export', async () => {
      const mockBlob = new Blob(["csv data"], {type: 'text/csv'});
      const mockResponse = createMockResponse({ ok: true, blob: async () => mockBlob });
      mockFetch.mockResolvedValueOnce(mockResponse);
      const params: ResultFilterParams = {
        branchName: 'CS',
        semester: undefined,
        academicYear: undefined,
        search: ''
      };
      await resultService.exportResults(params);
      expect(fetch).toHaveBeenCalledWith('/api/results/export?branchName=CS');
    });

    it('should handle errors when exporting results', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, text: async () => 'Export failed' }));
      await expect(resultService.exportResults()).rejects.toThrow('Export failed');
    });

    it('should handle errors without text when exporting results', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, text: async () => { throw new Error('Invalid text'); } }));
      await expect(resultService.exportResults()).rejects.toThrow('Failed to export results and could not parse error.');
    });
  });

  describe('deleteResult', () => {
    it('should delete a result successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));
      await resultService.deleteResult('res1');
      expect(fetch).toHaveBeenCalledWith('/api/results/res1', expect.objectContaining({ method: 'DELETE' }));
    });

    it('should handle errors when deleting result', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Result not found' }) }));
      await expect(resultService.deleteResult('res999')).rejects.toThrow('Result not found');
    });

    it('should handle errors without message when deleting result', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(resultService.deleteResult('res1')).rejects.toThrow('Failed to delete result with id res1');
    });

    it('should handle error response without message property when deleting result', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(resultService.deleteResult('res1')).rejects.toThrow('Failed to delete result with id res1');
    });
  });

  describe('deleteResultsByBatch', () => {
    const mockDeleteBatchResponse: ResultDeleteBatchResponse = { status: 'success', data: { deletedCount: 5 }};
    
    it('should delete results by batch successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockDeleteBatchResponse }));
      const result = await resultService.deleteResultsByBatch('batch1');
      expect(fetch).toHaveBeenCalledWith('/api/results/batch/batch1', expect.objectContaining({ method: 'DELETE' }));
      expect(result).toEqual(mockDeleteBatchResponse);
    });

    it('should handle errors when deleting results by batch', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Batch not found' }) }));
      await expect(resultService.deleteResultsByBatch('batch999')).rejects.toThrow('Batch not found');
    });

    it('should handle errors without message when deleting results by batch', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(resultService.deleteResultsByBatch('batch1')).rejects.toThrow('Failed to delete results by batch');
    });

    it('should handle error response without message property when deleting results by batch', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(resultService.deleteResultsByBatch('batch1')).rejects.toThrow('Failed to delete results by batch');
    });
  });
  
  describe('getBranchAnalysis', () => {
    it('should fetch branch analysis successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockAnalysisResponse }));
      const result = await resultService.getBranchAnalysis();
      expect(fetch).toHaveBeenCalledWith('/api/results/analysis?');
      expect(result).toEqual(mockAnalysisResponse);
    });

    it('should handle parameters correctly for branch analysis', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockAnalysisResponse }));
      const params = { academicYear: '2024-25', examid: 101 };
      await resultService.getBranchAnalysis(params);
      expect(fetch).toHaveBeenCalledWith('/api/results/analysis?academicYear=2024-25&examid=101');
    });

    it('should handle partial parameters for branch analysis', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockAnalysisResponse }));
      const params = { academicYear: '2024-25' };
      await resultService.getBranchAnalysis(params);
      expect(fetch).toHaveBeenCalledWith('/api/results/analysis?academicYear=2024-25');
    });

    it('should handle examid parameter only for branch analysis', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockAnalysisResponse }));
      const params = { examid: 101 };
      await resultService.getBranchAnalysis(params);
      expect(fetch).toHaveBeenCalledWith('/api/results/analysis?examid=101');
    });

    it('should handle errors when fetching branch analysis', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Analysis failed' }) }));
      await expect(resultService.getBranchAnalysis()).rejects.toThrow('Analysis failed');
    });

    it('should handle errors without message when fetching branch analysis', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(resultService.getBranchAnalysis()).rejects.toThrow('Failed to fetch branch analysis');
    });

    it('should handle error response without message property when fetching branch analysis', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ error: 'Some other error format' }) }));
      await expect(resultService.getBranchAnalysis()).rejects.toThrow('Failed to fetch branch analysis');
    });
  });

});
