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
        if (response.status === 404) return null;
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch student score' }));
      throw new Error(errorData.message || 'Failed to fetch student score');
    }
    const data = await response.json();
    return data || null;
  },

  async submitStudentAssignment(data: {
    assessmentId: string;
    studentId: string;
    files?: File[];
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
        formData.append(`file${index}`, file);
      });
    }

    const response = await fetch(`${API_BASE_URL}/student-scores`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to submit assignment' }));
      throw new Error(errorData.message || 'Failed to submit assignment');
    }
    return response.json();
  },

  async gradeStudentSubmission(
    studentId: string, // Changed from scoreId to studentId
    assessmentId: string, // Added assessmentId
    data: { score?: number; grade?: string; remarks?: string; evaluatedBy?: string }
    ): Promise<StudentAssessmentScore> {
    
    // First, try to get existing submission to find its ID, or know if we need to create one
    let existingScoreRecord = null;
    try {
        existingScoreRecord = await this.getStudentScoreForAssessment(assessmentId, studentId);
    } catch (e) {
        // Ignore if not found, we'll create it
        if(!((e as Error)?.message?.includes("Failed to fetch student score") || (e as Error)?.message?.includes("404"))) { // Re-throw unexpected errors
            throw e;
        }
    }
    
    if (existingScoreRecord && existingScoreRecord.id) {
        // Update existing record
        const response = await fetch(`${API_BASE_URL}/student-scores/${existingScoreRecord.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(data),
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to update grade' }));
            throw new Error(errorData.message || 'Failed to update grade');
          }
          return response.json();
    } else {
        // Create new score record as faculty is grading
        const payload = {
            studentId,
            assessmentId,
            ...data,
            // submissionDate can be omitted if faculty is grading without prior student submission
        };
        const response = await fetch(`${API_BASE_URL}/student-scores`, {
            method: 'POST',
            // FormData might be overkill if not sending files from faculty side during grading
            // Using JSON if no file upload is expected from faculty during grading
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to create grade entry' }));
            throw new Error(errorData.message || 'Failed to create grade entry');
        }
        return response.json();
    }
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
