// src/lib/api/studentAssessmentScores.ts
import type { StudentAssessmentScore } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const studentAssessmentScoreService = {
  async getScoresForAssessment(assessmentId: string): Promise<StudentAssessmentScore[]> {
    const response = await fetch(`${API_BASE_URL}/student-scores?assessmentId=${assessmentId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch scores for assessment' }));
      throw new Error(errorData.message || 'Failed to fetch scores for assessment');
    }
    return response.json();
  },

  async getStudentScoreForAssessment(assessmentId: string, studentId: string): Promise<StudentAssessmentScore | null> {
    const response = await fetch(`${API_BASE_URL}/student-scores?assessmentId=${assessmentId}&studentId=${studentId}`);
    if (!response.ok) {
        if (response.status === 404) return null; // Or handle specific 404 if API returns it consistently
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch student score' }));
      throw new Error(errorData.message || 'Failed to fetch student score');
    }
    const data = await response.json();
    return data || null; // API might return empty body for no record, or null directly
  },

  async submitStudentAssignment(data: {
    assessmentId: string;
    studentId: string;
    files?: File[]; // Array of files for upload
    comments?: string;
  }): Promise<StudentAssessmentScore> {
    const formData = new FormData();
    formData.append('assessmentId', data.assessmentId);
    formData.append('studentId', data.studentId);
    if (data.comments) {
      formData.append('comments', data.comments);
    }
    if (data.files && data.files.length > 0) {
      data.files.forEach((file, index) => {
        formData.append(`file${index}`, file); // Backend needs to handle multiple files (e.g., file0, file1)
      });
    }

    const response = await fetch(`${API_BASE_URL}/student-scores`, {
      method: 'POST',
      body: formData, // No Content-Type header for FormData, browser sets it
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to submit assignment' }));
      throw new Error(errorData.message || 'Failed to submit assignment');
    }
    return response.json();
  },

  async gradeStudentSubmission(
    scoreId: string, 
    data: { score?: number; grade?: string; remarks?: string; evaluatedBy?: string }
    ): Promise<StudentAssessmentScore> {
    const response = await fetch(`${API_BASE_URL}/student-scores/${scoreId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to grade submission' }));
      throw new Error(errorData.message || 'Failed to grade submission');
    }
    return response.json();
  },

  async deleteStudentScore(scoreId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/student-scores/${scoreId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete student score/submission' }));
        throw new Error(errorData.message || 'Failed to delete student score/submission');
    }
  }
};
