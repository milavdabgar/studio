import {
  createAssessment,
  deleteAssessment,
  getAssessment,
  getAssessments,
  updateAssessment,
} from '@/lib/api/assessments';
import { Assessment } from '@/types/entities';

// Mock the fetch function
global.fetch = jest.fn();

describe('Assessment API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAssessment: Assessment = {
    id: '1',
    name: 'Test Assessment',
    description: 'This is a test assessment',
    courseId: 'course-1',
    startDate: new Date(),
    endDate: new Date(),
  };

  it('should get assessments', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([mockAssessment]),
    });

    const assessments = await getAssessments();
    expect(fetch).toHaveBeenCalledWith('/api/assessments');
    expect(assessments).toEqual([mockAssessment]);
  });

  it('should handle error when getting assessments', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(getAssessments()).rejects.toThrow('Internal Server Error');
    expect(fetch).toHaveBeenCalledWith('/api/assessments');
  });

  it('should get a single assessment', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockAssessment),
    });

    const assessment = await getAssessment('1');
    expect(fetch).toHaveBeenCalledWith('/api/assessments/1');
    expect(assessment).toEqual(mockAssessment);
  });

  it('should handle error when getting a single assessment', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(getAssessment('1')).rejects.toThrow('Not Found');
    expect(fetch).toHaveBeenCalledWith('/api/assessments/1');
  });

  it('should create an assessment', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockAssessment),
    });

    const newAssessmentData = {
      name: 'New Assessment',
      description: 'This is a new assessment',
      courseId: 'course-2',
      startDate: new Date(),
      endDate: new Date(),
    };
    const assessment = await createAssessment(newAssessmentData);
    expect(fetch).toHaveBeenCalledWith('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAssessmentData),
    });
    expect(assessment).toEqual(mockAssessment);
  });

  it('should handle error when creating an assessment', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    });

    const newAssessmentData = {
      name: 'New Assessment',
      description: 'This is a new assessment',
      courseId: 'course-2',
      startDate: new Date(),
      endDate: new Date(),
    };

    await expect(createAssessment(newAssessmentData)).rejects.toThrow('Bad Request');
    expect(fetch).toHaveBeenCalledWith('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAssessmentData),
    });
  });

  it('should update an assessment', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ ...mockAssessment, name: 'Updated Assessment' }),
    });

    const updatedAssessmentData = { name: 'Updated Assessment' };
    const updatedAssessment = await updateAssessment('1', updatedAssessmentData);
    expect(fetch).toHaveBeenCalledWith('/api/assessments/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedAssessmentData),
    });
    expect(updatedAssessment).toEqual({ ...mockAssessment, name: 'Updated Assessment' });
  });

  it('should handle error when updating an assessment', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    });

    const updatedAssessmentData = { name: 'Updated Assessment' };
    await expect(updateAssessment('1', updatedAssessmentData)).rejects.toThrow('Bad Request');
    expect(fetch).toHaveBeenCalledWith('/api/assessments/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedAssessmentData),
    });
  });

  it('should delete an assessment', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    await deleteAssessment('1');
    expect(fetch).toHaveBeenCalledWith('/api/assessments/1', {
      method: 'DELETE',
    });
  });

  it('should handle error when deleting an assessment', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(deleteAssessment('1')).rejects.toThrow('Not Found');
    expect(fetch).toHaveBeenCalledWith('/api/assessments/1', {
      method: 'DELETE',
    });
  });
});