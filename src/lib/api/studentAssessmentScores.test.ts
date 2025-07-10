import { studentAssessmentScoreService } from './studentAssessmentScores';
import type { StudentAssessmentScore } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Helper to create mock responses
const createMockResponse = (options: { ok: boolean; status?: number; json?: () => Promise<unknown>; statusText?: string }): Response => {
  return {
    ok: options.ok,
    status: options.status || (options.ok ? 200 : 500),
    statusText: options.statusText || (options.ok ? 'OK' : 'Error'),
    json: options.json || (async () => ({})),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => createMockResponse(options),
    text: async () => JSON.stringify(await (options.json ? options.json() : {})),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    arrayBuffer: async () => new ArrayBuffer(0),
    bodyUsed: false,
  } as Response;
};

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('StudentAssessmentScoreService API Tests', () => {
  const now = new Date().toISOString();
  const mockScore: StudentAssessmentScore = {
    id: "score1",
    studentId: "student1",
    assessmentId: "assessment1",
    score: 85,
    grade: "A",
    submissionDate: now,
    createdAt: now,
    updatedAt: now,
  };
  const mockScores: StudentAssessmentScore[] = [mockScore];

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getScoresForAssessment', () => {
    it('should fetch scores for an assessment successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockScores }));
      const result = await studentAssessmentScoreService.getScoresForAssessment('assessment1');
      expect(fetch).toHaveBeenCalledWith('/api/student-scores?assessmentId=assessment1');
      expect(result).toEqual(mockScores);
    });

    it('should throw error if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 500, json: async () => ({message: "Server Error"}) }));
      await expect(studentAssessmentScoreService.getScoresForAssessment('assessment1')).rejects.toThrow("Server Error");
    });

    it('should handle error without message when fetching scores', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 500, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(studentAssessmentScoreService.getScoresForAssessment('assessment1')).rejects.toThrow('Failed to fetch scores for assessment');
    });

    it('should handle error response without message property when fetching scores', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 500, json: async () => ({ error: 'Some other error format' }) }));
      await expect(studentAssessmentScoreService.getScoresForAssessment('assessment1')).rejects.toThrow('Failed to fetch scores for assessment');
    });
  });

  describe('getStudentScoreForAssessment', () => {
    it('should fetch a specific student score successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockScore }));
      const result = await studentAssessmentScoreService.getStudentScoreForAssessment('assessment1', 'student1');
      expect(fetch).toHaveBeenCalledWith('/api/student-scores?assessmentId=assessment1&studentId=student1');
      expect(result).toEqual(mockScore);
    });

    it('should return null if no score found', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => null }));
      const result = await studentAssessmentScoreService.getStudentScoreForAssessment('assessmentX', 'studentY');
      expect(result).toBeNull();
    });

    it('should return null when 404 status is returned', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 404 }));
      const result = await studentAssessmentScoreService.getStudentScoreForAssessment('assessment1', 'student1');
      expect(result).toBeNull();
    });

    it('should throw error for non-404 error responses', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 500, json: async () => ({ message: 'Server error' }) }));
      await expect(studentAssessmentScoreService.getStudentScoreForAssessment('assessment1', 'student1')).rejects.toThrow('Server error');
    });

    it('should handle error without message when fetching student score', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 500, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(studentAssessmentScoreService.getStudentScoreForAssessment('assessment1', 'student1')).rejects.toThrow('Failed to fetch student score');
    });

    it('should handle error response without message property when fetching student score', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 500, json: async () => ({ error: 'Some other error format' }) }));
      await expect(studentAssessmentScoreService.getStudentScoreForAssessment('assessment1', 'student1')).rejects.toThrow('Failed to fetch student score');
    });
  });

  describe('submitStudentAssignment', () => {
    const submissionData = { assessmentId: "assessment1", studentId: "student1", comments: "My submission" };
    const createdScore: StudentAssessmentScore = { ...mockScore, ...submissionData, id: 'newScore1', score: undefined, grade: undefined };
    
    it('should submit an assignment successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => createdScore }));
      const result = await studentAssessmentScoreService.submitStudentAssignment(submissionData);
      expect(fetch).toHaveBeenCalledWith('/api/student-scores', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
      expect(result).toEqual(createdScore);
    });

    it('should submit assignment with files successfully', async () => {
      const file1 = new File(['content1'], 'file1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content2'], 'file2.txt', { type: 'text/plain' });
      const submissionWithFiles = { ...submissionData, files: [file1, file2] };
      
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => createdScore }));
      
      const result = await studentAssessmentScoreService.submitStudentAssignment(submissionWithFiles);
      
      expect(fetch).toHaveBeenCalledWith('/api/student-scores', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
      expect(result).toEqual(createdScore);
      
      // Verify FormData contains files
      const call = mockFetch.mock.calls[0];
      const formData = call[1]?.body as FormData;
      expect(formData.get('file0')).toBe(file1);
      expect(formData.get('file1')).toBe(file2);
    });

    it('should submit assignment without optional fields', async () => {
      const minimalData = { assessmentId: "assessment1", studentId: "student1" };
      
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, status: 201, json: async () => createdScore }));
      
      const result = await studentAssessmentScoreService.submitStudentAssignment(minimalData);
      
      expect(fetch).toHaveBeenCalledWith('/api/student-scores', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
      expect(result).toEqual(createdScore);
      
      // Verify FormData contains required fields only
      const call = mockFetch.mock.calls[0];
      const formData = call[1]?.body as FormData;
      expect(formData.get('assessmentId')).toBe('assessment1');
      expect(formData.get('studentId')).toBe('student1');
      expect(formData.get('comments')).toBeNull();
    });

    it('should handle errors when submitting assignment', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 400, json: async () => ({ message: 'Validation failed' }) }));
      await expect(studentAssessmentScoreService.submitStudentAssignment(submissionData)).rejects.toThrow('Validation failed');
    });

    it('should handle errors without message when submitting assignment', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 500, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(studentAssessmentScoreService.submitStudentAssignment(submissionData)).rejects.toThrow('Failed to submit assignment');
    });

    it('should handle error response without message property when submitting assignment', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 500, json: async () => ({ error: 'Some other error format' }) }));
      await expect(studentAssessmentScoreService.submitStudentAssignment(submissionData)).rejects.toThrow('Failed to submit assignment');
    });
  });

  describe('gradeStudentSubmission', () => {
    const gradeData = { score: 90, grade: "AA", remarks: "Excellent work" };
    const gradedScore: StudentAssessmentScore = { ...mockScore, ...gradeData, evaluatedAt: now, evaluatedBy: 'faculty1' };
    
    it('should grade a submission successfully when existing record found', async () => {
      // Mock the getStudentScoreForAssessment call first
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockScore }));
      // Then mock the update call
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => gradedScore }));
      
      const result = await studentAssessmentScoreService.gradeStudentSubmission('student1', 'assessment1', gradeData);
      
      expect(fetch).toHaveBeenCalledWith('/api/student-scores?assessmentId=assessment1&studentId=student1');
      expect(fetch).toHaveBeenCalledWith('/api/student-scores/score1', expect.objectContaining({ 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gradeData) 
      }));
      expect(result).toEqual(gradedScore);
    });

    it('should create new record when no existing submission found', async () => {
      // Mock the getStudentScoreForAssessment call to return null
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => null }));
      // Then mock the create call
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => gradedScore }));
      
      const result = await studentAssessmentScoreService.gradeStudentSubmission('student1', 'assessment1', gradeData);
      
      expect(fetch).toHaveBeenCalledWith('/api/student-scores?assessmentId=assessment1&studentId=student1');
      expect(fetch).toHaveBeenCalledWith('/api/student-scores', expect.objectContaining({ 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: 'student1',
          assessmentId: 'assessment1',
          ...gradeData
        }) 
      }));
      expect(result).toEqual(gradedScore);
    });

    it('should handle error when getting existing submission throws unexpected error', async () => {
      // Mock the getStudentScoreForAssessment to throw unexpected error
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 500, json: async () => ({ message: 'Database error' }) }));
      
      await expect(studentAssessmentScoreService.gradeStudentSubmission('student1', 'assessment1', gradeData))
        .rejects.toThrow('Database error');
    });

    it('should ignore expected errors when getting existing submission', async () => {
      // Mock the getStudentScoreForAssessment to throw expected error
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 404, json: async () => ({ message: 'Failed to fetch student score' }) }));
      // Then mock the create call
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => gradedScore }));
      
      const result = await studentAssessmentScoreService.gradeStudentSubmission('student1', 'assessment1', gradeData);
      
      expect(fetch).toHaveBeenCalledWith('/api/student-scores?assessmentId=assessment1&studentId=student1');
      expect(fetch).toHaveBeenCalledWith('/api/student-scores', expect.objectContaining({ method: 'POST' }));
      expect(result).toEqual(gradedScore);
    });

    it('should ignore 404 errors when getting existing submission', async () => {
      // Mock the getStudentScoreForAssessment to throw 404 error
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 404, json: async () => ({ message: '404' }) }));
      // Then mock the create call
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => gradedScore }));
      
      const result = await studentAssessmentScoreService.gradeStudentSubmission('student1', 'assessment1', gradeData);
      
      expect(fetch).toHaveBeenCalledWith('/api/student-scores', expect.objectContaining({ method: 'POST' }));
      expect(result).toEqual(gradedScore);
    });

    it('should handle errors when updating existing record', async () => {
      // Mock successful get
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockScore }));
      // Mock failed update
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 400, json: async () => ({ message: 'Update failed' }) }));
      
      await expect(studentAssessmentScoreService.gradeStudentSubmission('student1', 'assessment1', gradeData))
        .rejects.toThrow('Update failed');
    });

    it('should handle errors without message when updating existing record', async () => {
      // Mock successful get
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockScore }));
      // Mock failed update
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 500, json: async () => { throw new Error('Invalid JSON'); } }));
      
      await expect(studentAssessmentScoreService.gradeStudentSubmission('student1', 'assessment1', gradeData))
        .rejects.toThrow('Failed to update grade');
    });

    it('should handle error response without message property when updating', async () => {
      // Mock successful get
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockScore }));
      // Mock failed update
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 400, json: async () => ({ error: 'Some other error format' }) }));
      
      await expect(studentAssessmentScoreService.gradeStudentSubmission('student1', 'assessment1', gradeData))
        .rejects.toThrow('Failed to update grade');
    });

    it('should handle errors when creating new record', async () => {
      // Mock no existing record
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => null }));
      // Mock failed create
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 400, json: async () => ({ message: 'Create failed' }) }));
      
      await expect(studentAssessmentScoreService.gradeStudentSubmission('student1', 'assessment1', gradeData))
        .rejects.toThrow('Create failed');
    });

    it('should handle errors without message when creating new record', async () => {
      // Mock no existing record
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => null }));
      // Mock failed create
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 500, json: async () => { throw new Error('Invalid JSON'); } }));
      
      await expect(studentAssessmentScoreService.gradeStudentSubmission('student1', 'assessment1', gradeData))
        .rejects.toThrow('Failed to create grade entry');
    });

    it('should handle error response without message property when creating', async () => {
      // Mock no existing record
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => null }));
      // Mock failed create
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 400, json: async () => ({ error: 'Some other error format' }) }));
      
      await expect(studentAssessmentScoreService.gradeStudentSubmission('student1', 'assessment1', gradeData))
        .rejects.toThrow('Failed to create grade entry');
    });
  });

  describe('deleteStudentScore', () => {
    it('should delete a student score record successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));
      await studentAssessmentScoreService.deleteStudentScore('score1');
      expect(fetch).toHaveBeenCalledWith('/api/student-scores/score1', expect.objectContaining({ method: 'DELETE' }));
    });

    it('should throw error if deletion fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 404, json: async () => ({message: "Not found"}) }));
      await expect(studentAssessmentScoreService.deleteStudentScore('score1')).rejects.toThrow("Not found");
    });

    it('should handle errors without message when deleting', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 500, json: async () => { throw new Error('Invalid JSON'); } }));
      await expect(studentAssessmentScoreService.deleteStudentScore('score1')).rejects.toThrow('Failed to delete student score/submission');
    });

    it('should handle error response without message property when deleting', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: false, status: 500, json: async () => ({ error: 'Some other error format' }) }));
      await expect(studentAssessmentScoreService.deleteStudentScore('score1')).rejects.toThrow('Failed to delete student score/submission');
    });
  });

});
