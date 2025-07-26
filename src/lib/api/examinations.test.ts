import { 
  examinationService, 
  getExaminations, 
  getExamination, 
  getExaminationResults, 
  getExaminationTimetable,
  createExamination,
  updateExamination,
  deleteExamination
} from './examinations';
import { describe, it, expect } from '@jest/globals';

describe('ExaminationService Tests', () => {
  describe('getExaminations', () => {
    it('should return all examinations', async () => {
      const examinations = await getExaminations();
      expect(examinations).toHaveLength(2);
      expect(examinations[0]).toMatchObject({
        id: '1',
        name: 'Mid Semester Examination - Fall 2024',
        examType: 'Mid Semester'
      });
      expect(examinations[1]).toMatchObject({
        id: '2',
        name: 'End Semester Examination - Fall 2024',
        examType: 'End Semester Theory'
      });
    });

    it('should return examinations with correct structure', async () => {
      const examinations = await getExaminations();
      examinations.forEach(exam => {
        expect(exam).toHaveProperty('id');
        expect(exam).toHaveProperty('name');
        expect(exam).toHaveProperty('examType');
        expect(exam).toHaveProperty('startDate');
        expect(exam).toHaveProperty('endDate');
        expect(exam).toHaveProperty('academicYear');
        expect(exam).toHaveProperty('programIds');
        expect(exam).toHaveProperty('status');
        expect(exam).toHaveProperty('createdAt');
        expect(exam).toHaveProperty('updatedAt');
      });
    });
  });

  describe('getExamination', () => {
    it('should return examination by ID', async () => {
      const examination = await getExamination('1');
      expect(examination).not.toBeNull();
      expect(examination?.id).toBe('1');
      expect(examination?.name).toBe('Mid Semester Examination - Fall 2024');
      expect(examination?.examType).toBe('Mid Semester');
    });

    it('should return null for non-existent examination', async () => {
      const examination = await getExamination('nonexistent');
      expect(examination).toBeNull();
    });

    it('should return correct examination type', async () => {
      const midtermExam = await getExamination('1');
      const finalExam = await getExamination('2');
      
      expect(midtermExam?.examType).toBe('Mid Semester');
      expect(finalExam?.examType).toBe('End Semester Theory');
    });
  });

  describe('getExaminationResults', () => {
    it('should return results for specific examination', async () => {
      const results = await getExaminationResults('1');
      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        id: '1',
        examinationId: '1',
        studentId: 'STU001',
        marksObtained: 85,
        grade: 'A'
      });
      expect(results[1]).toMatchObject({
        id: '2',
        examinationId: '1',
        studentId: 'STU002',
        marksObtained: 78,
        grade: 'B+'
      });
    });

    it('should return empty array for examination with no results', async () => {
      const results = await getExaminationResults('2');
      expect(results).toHaveLength(0);
    });

    it('should return results with correct structure', async () => {
      const results = await getExaminationResults('1');
      results.forEach(result => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('examinationId');
        expect(result).toHaveProperty('studentId');
        expect(result).toHaveProperty('marksObtained');
        expect(result).toHaveProperty('evaluatedBy');
        expect(result).toHaveProperty('evaluatedAt');
        expect(typeof result.marksObtained).toBe('number');
      });
    });
  });

  describe('getExaminationTimetable', () => {
    it('should return timetable for examination', async () => {
      const timetable = await getExaminationTimetable('1');
      expect(timetable).toHaveLength(1);
      expect(timetable[0]).toMatchObject({
        id: '1',
        courseId: 'CS101',
        day: 'Monday',
        startTime: '09:00',
        endTime: '11:00',
        venue: 'Room A-101',
        facultyId: 'FAC001',
        type: 'examination'
      });
    });

    it('should return timetable with correct structure', async () => {
      const timetable = await getExaminationTimetable('1');
      timetable.forEach(entry => {
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('courseId');
        expect(entry).toHaveProperty('day');
        expect(entry).toHaveProperty('startTime');
        expect(entry).toHaveProperty('endTime');
        expect(entry).toHaveProperty('venue');
        expect(entry).toHaveProperty('facultyId');
        expect(entry).toHaveProperty('type');
      });
    });
  });

  describe('createExamination', () => {
    it('should create new examination', async () => {
      const newExamData = {
        name: 'Database Systems - Quiz',
        academicYear: '2024-25',
        examType: 'Mid Semester' as const,
        startDate: '2025-07-25T10:00:00Z',
        endDate: '2025-07-25T11:00:00Z',
        programIds: ['prog_dce_gpp'],
        status: 'scheduled' as const
      };

      const createdExam = await createExamination(newExamData);
      
      expect(createdExam).toMatchObject(newExamData);
      expect(createdExam.id).toBeDefined();
      expect(createdExam.createdAt).toBeDefined();
      expect(createdExam.updatedAt).toBeDefined();
      expect(typeof createdExam.id).toBe('string');
    });

    it('should set timestamps for new examination', async () => {
      const newExamData = {
        name: 'Operating Systems - Assignment',
        academicYear: '2024-25',
        examType: 'Mid Semester' as const,
        startDate: '2025-08-01T00:00:00Z',
        endDate: '2025-08-01T23:59:00Z',
        programIds: ['prog_dce_gpp'],
        status: 'scheduled' as const
      };

      const createdExam = await createExamination(newExamData);
      
      expect(createdExam.createdAt).toBeDefined();
      expect(createdExam.updatedAt).toBeDefined();
      // Allow for small timing differences between createdAt and updatedAt
      const createdTime = new Date(createdExam.createdAt!).getTime();
      const updatedTime = new Date(createdExam.updatedAt!).getTime();
      expect(Math.abs(createdTime - updatedTime)).toBeLessThan(1000); // Within 1 second
    });
  });

  describe('updateExamination', () => {
    it('should update existing examination', async () => {
      const updates = {
        name: 'Updated Examination Name',
        status: 'ongoing' as const
      };

      const updatedExam = await updateExamination('1', updates);
      
      expect(updatedExam).not.toBeNull();
      expect(updatedExam?.name).toBe('Updated Examination Name');
      expect(updatedExam?.status).toBe('ongoing');
      expect(updatedExam?.id).toBe('1');
    });

    it('should update timestamp when updating examination', async () => {
      const updates = { name: 'New Name' };
      const updatedExam = await updateExamination('1', updates);
      
      expect(updatedExam?.updatedAt).toBeDefined();
      expect(new Date(updatedExam!.updatedAt as string)).toBeInstanceOf(Date);
    });

    it('should return null for non-existent examination', async () => {
      const updates = { name: 'New Name' };
      const result = await updateExamination('nonexistent', updates);
      
      expect(result).toBeNull();
    });

    it('should handle partial updates', async () => {
      const updates = { academicYear: '2025-26' };
      const updatedExam = await updateExamination('1', updates);
      
      expect(updatedExam?.academicYear).toBe('2025-26');
      expect(updatedExam?.name).toBe('Mid Semester Examination - Fall 2024'); // other fields unchanged
    });
  });

  describe('deleteExamination', () => {
    it('should delete examination successfully', async () => {
      const result = await deleteExamination('1');
      expect(result).toBe(true);
    });

    it('should return true even for non-existent examination', async () => {
      const result = await deleteExamination('nonexistent');
      expect(result).toBe(true);
    });
  });

  describe('examinationService object', () => {
    it('should expose all examination methods', () => {
      expect(examinationService).toHaveProperty('getAllExaminations');
      expect(examinationService).toHaveProperty('getExaminationById');
      expect(examinationService).toHaveProperty('getExaminationResults');
      expect(examinationService).toHaveProperty('getExaminationTimetable');
      expect(examinationService).toHaveProperty('createExamination');
      expect(examinationService).toHaveProperty('updateExamination');
      expect(examinationService).toHaveProperty('deleteExamination');
    });

    it('should have methods that are functions', () => {
      expect(typeof examinationService.getAllExaminations).toBe('function');
      expect(typeof examinationService.getExaminationById).toBe('function');
      expect(typeof examinationService.getExaminationResults).toBe('function');
      expect(typeof examinationService.getExaminationTimetable).toBe('function');
      expect(typeof examinationService.createExamination).toBe('function');
      expect(typeof examinationService.updateExamination).toBe('function');
      expect(typeof examinationService.deleteExamination).toBe('function');
    });

    it('should work through service object methods', async () => {
      const examinations = await examinationService.getAllExaminations();
      expect(examinations).toHaveLength(2);

      const examination = await examinationService.getExaminationById('1');
      expect(examination?.id).toBe('1');
    });
  });
});