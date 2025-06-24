import { 
  examinationService, 
  getExaminations, 
  getExamination, 
  getExaminationResults, 
  getExaminationTimetable,
  createExamination,
  updateExamination,
  deleteExamination,
  type Examination,
  type ExaminationResult,
  type TimetableEntry
} from './examinations';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('ExaminationService Tests', () => {
  describe('getExaminations', () => {
    it('should return all examinations', async () => {
      const examinations = await getExaminations();
      expect(examinations).toHaveLength(2);
      expect(examinations[0]).toMatchObject({
        id: '1',
        courseId: 'CS101',
        title: 'Introduction to Computer Science - Midterm',
        type: 'midterm'
      });
      expect(examinations[1]).toMatchObject({
        id: '2',
        courseId: 'CS102',
        title: 'Data Structures - Final Exam',
        type: 'final'
      });
    });

    it('should return examinations with correct structure', async () => {
      const examinations = await getExaminations();
      examinations.forEach(exam => {
        expect(exam).toHaveProperty('id');
        expect(exam).toHaveProperty('courseId');
        expect(exam).toHaveProperty('title');
        expect(exam).toHaveProperty('type');
        expect(exam).toHaveProperty('date');
        expect(exam).toHaveProperty('duration');
        expect(exam).toHaveProperty('maxMarks');
        expect(exam).toHaveProperty('venue');
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
      expect(examination?.courseId).toBe('CS101');
      expect(examination?.title).toBe('Introduction to Computer Science - Midterm');
    });

    it('should return null for non-existent examination', async () => {
      const examination = await getExamination('nonexistent');
      expect(examination).toBeNull();
    });

    it('should return correct examination type', async () => {
      const midtermExam = await getExamination('1');
      const finalExam = await getExamination('2');
      
      expect(midtermExam?.type).toBe('midterm');
      expect(finalExam?.type).toBe('final');
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
        courseId: 'CS103',
        title: 'Database Systems - Quiz',
        type: 'quiz' as const,
        date: '2025-07-25T10:00:00Z',
        duration: 60,
        maxMarks: 50,
        venue: 'Room C-301',
        instructions: 'No electronic devices allowed'
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
        courseId: 'CS104',
        title: 'Operating Systems - Assignment',
        type: 'assignment' as const,
        date: '2025-08-01T23:59:00Z',
        duration: 1440, // 24 hours
        maxMarks: 100,
        venue: 'Online'
      };

      const createdExam = await createExamination(newExamData);
      
      expect(new Date(createdExam.createdAt)).toBeInstanceOf(Date);
      expect(new Date(createdExam.updatedAt)).toBeInstanceOf(Date);
      expect(createdExam.createdAt).toBe(createdExam.updatedAt);
    });
  });

  describe('updateExamination', () => {
    it('should update existing examination', async () => {
      const updates = {
        title: 'Updated Title',
        venue: 'Updated Venue',
        duration: 150
      };

      const updatedExam = await updateExamination('1', updates);
      
      expect(updatedExam).not.toBeNull();
      expect(updatedExam?.title).toBe('Updated Title');
      expect(updatedExam?.venue).toBe('Updated Venue');
      expect(updatedExam?.duration).toBe(150);
      expect(updatedExam?.id).toBe('1');
      expect(updatedExam?.courseId).toBe('CS101'); // unchanged fields should remain
    });

    it('should update timestamp when updating examination', async () => {
      const updates = { title: 'New Title' };
      const updatedExam = await updateExamination('1', updates);
      
      expect(updatedExam?.updatedAt).toBeDefined();
      expect(new Date(updatedExam!.updatedAt)).toBeInstanceOf(Date);
    });

    it('should return null for non-existent examination', async () => {
      const updates = { title: 'New Title' };
      const result = await updateExamination('nonexistent', updates);
      
      expect(result).toBeNull();
    });

    it('should handle partial updates', async () => {
      const updates = { maxMarks: 200 };
      const updatedExam = await updateExamination('1', updates);
      
      expect(updatedExam?.maxMarks).toBe(200);
      expect(updatedExam?.title).toBe('Introduction to Computer Science - Midterm'); // other fields unchanged
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