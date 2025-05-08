import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  importCourses,
} from './courses';
import { Course } from '@/types/entities';

jest.mock('./courses');

describe('Course API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCourse', () => {
    it('should call the createCourse function', async () => {
      const mockCourse: Course = {
        id: '1',
        name: 'Test Course',
        code: 'TC101',
        departmentId: 'dep1',
      };
      (createCourse as jest.Mock).mockResolvedValue(mockCourse);

      const result = await createCourse(mockCourse);

      expect(createCourse).toHaveBeenCalledWith(mockCourse);
      expect(result).toEqual(mockCourse);
    });
  });

  describe('getCourses', () => {
    it('should call the getCourses function', async () => {
      const mockCourses: Course[] = [
        { id: '1', name: 'Test Course 1', code: 'TC101', departmentId: 'dep1' },
        { id: '2', name: 'Test Course 2', code: 'TC102', departmentId: 'dep1' },
      ];
      (getCourses as jest.Mock).mockResolvedValue(mockCourses);

      const result = await getCourses();

      expect(getCourses).toHaveBeenCalled();
      expect(result).toEqual(mockCourses);
    });
  });

  describe('getCourseById', () => {
    it('should call the getCourseById function with the correct id', async () => {
      const mockCourse: Course = {
        id: '1',
        name: 'Test Course',
        code: 'TC101',
        departmentId: 'dep1',
      };
      (getCourseById as jest.Mock).mockResolvedValue(mockCourse);

      const result = await getCourseById('1');

      expect(getCourseById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCourse);
    });
  });

  describe('updateCourse', () => {
    it('should call the updateCourse function with the correct id and data', async () => {
      const mockCourse: Course = {
        id: '1',
        name: 'Updated Course',
        code: 'UC101',
        departmentId: 'dep1'
      };
      (updateCourse as jest.Mock).mockResolvedValue(mockCourse);

      const result = await updateCourse('1', mockCourse);

      expect(updateCourse).toHaveBeenCalledWith('1', mockCourse);
      expect(result).toEqual(mockCourse);
    });
  });

  describe('deleteCourse', () => {
    it('should call the deleteCourse function with the correct id', async () => {
      (deleteCourse as jest.Mock).mockResolvedValue(undefined);

      await deleteCourse('1');

      expect(deleteCourse).toHaveBeenCalledWith('1');
    });
  });
    describe('importCourses', () => {
    it('should call the importCourses function with the correct data', async () => {
      const mockData = [
        { id: '1', name: 'Test Course 1', code: 'TC101', departmentId: 'dep1' },
        { id: '2', name: 'Test Course 2', code: 'TC102', departmentId: 'dep1' },
      ];
      (importCourses as jest.Mock).mockResolvedValue(mockData);

      const result = await importCourses(mockData);

      expect(importCourses).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockData);
    });
  });
});