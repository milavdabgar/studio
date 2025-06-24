import { studentAssessmentScoreService } from './studentAssessmentScores';
import type { StudentAssessmentScore } from '@/types/entities';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Helper to create mock responses
const createMockResponse = (options: { ok: boolean; status?: number; json?: () => Promise<any>; statusText?: string }): Response => {
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
  });

  describe('gradeStudentSubmission', () => {
    const gradeData = { score: 90, grade: "AA", remarks: "Excellent work" };
    const gradedScore: StudentAssessmentScore = { ...mockScore, ...gradeData, evaluatedAt: now, evaluatedBy: 'faculty1' };
    it('should grade a submission successfully', async () => {
      // Mock the getStudentScoreForAssessment call first
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockScore }));
      // Then mock the update call
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => gradedScore }));
      const result = await studentAssessmentScoreService.gradeStudentSubmission('student1', 'assessment1', gradeData);
      expect(fetch).toHaveBeenCalledWith('/api/student-scores?assessmentId=assessment1&studentId=student1');
      expect(fetch).toHaveBeenCalledWith('/api/student-scores/score1', expect.objectContaining({ method: 'PUT', body: JSON.stringify(gradeData) }));
      expect(result).toEqual(gradedScore);
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
  });

});
