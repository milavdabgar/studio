import { resultService } from './results';
import type { Result, UploadBatch, BranchAnalysis, ResultFilterParams, ResultsResponse, ResultDetailResponse, BatchesResponse, ResultImportResponse, ResultDeleteBatchResponse, AnalysisResponse, Program } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const createMockResponse = (options: { ok: boolean; status?: number; json?: () => Promise<any>; text?: () => Promise<string>, blob?: () => Promise<Blob> }): Response => {
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
    it('should handle errors when fetching results', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, json: async () => ({ message: 'Fetch error' }) }));
        await expect(resultService.getAllResults()).rejects.toThrow('Fetch error');
    });
  });

  describe('getResultById', () => {
    it('should fetch a result by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockResultDetailResponse }));
      const result = await resultService.getResultById('res1');
      expect(fetch).toHaveBeenCalledWith('/api/results/res1');
      expect(result).toEqual(mockResultDetailResponse);
    });
  });

  describe('getStudentResults', () => {
    it('should fetch results for a student successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockResultsResponse }));
      const result = await resultService.getStudentResults('E001');
      expect(fetch).toHaveBeenCalledWith('/api/results/student/E001');
      expect(result).toEqual(mockResultsResponse);
    });
  });

  describe('getUploadBatches', () => {
    it('should fetch upload batches successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockBatchesResponse }));
      const result = await resultService.getUploadBatches();
      expect(fetch).toHaveBeenCalledWith('/api/results/batches');
      expect(result).toEqual(mockBatchesResponse);
    });
  });

  describe('importResults (Standard)', () => {
    const mockFile = new File(['csv content'], 'results.csv', { type: 'text/csv' });
    const mockImportResponse: ResultImportResponse = { status: 'success', data: { batchId: 'batchImp1', importedCount: 10, totalRows: 10 }};
    it('should import standard results successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockImportResponse }));
      const result = await resultService.importResults(mockFile);
      expect(fetch).toHaveBeenCalledWith('/api/results/import', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
      expect(result).toEqual(mockImportResponse);
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
  });
  
  describe('exportResults', () => {
    it('should export results to CSV successfully', async () => {
      const mockBlob = new Blob(["csv data"], {type: 'text/csv'});
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, blob: async () => mockBlob }));
      const response = await resultService.exportResults();
      expect(fetch).toHaveBeenCalledWith('/api/results/export?');
      expect(response).toBeInstanceOf(Response); // Check that it returns a Response object
      const blobData = await response.blob();
      expect(blobData.type).toBe('text/csv');
    });
  });

  describe('deleteResult', () => {
    it('should delete a result successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));
      await resultService.deleteResult('res1');
      expect(fetch).toHaveBeenCalledWith('/api/results/res1', expect.objectContaining({ method: 'DELETE' }));
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
  });
  
  describe('getBranchAnalysis', () => {
    it('should fetch branch analysis successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockAnalysisResponse }));
      const result = await resultService.getBranchAnalysis();
      expect(fetch).toHaveBeenCalledWith('/api/results/analysis?');
      expect(result).toEqual(mockAnalysisResponse);
    });
  });

});
