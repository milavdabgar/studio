import type { CourseOffering, Course, Batch, Faculty } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const courseOfferingService = {
  async getAllCourseOfferings(): Promise<CourseOffering[]> {
    const response = await fetch(`${API_BASE_URL}/course-offerings`);
    if (!response.ok) {
      throw new Error('Failed to fetch course offerings');
    }
    return response.json();
  },

  async getCourseOfferingById(id: string): Promise<CourseOffering> {
    const response = await fetch(`${API_BASE_URL}/course-offerings/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch course offering with id ${id}`);
    }
    return response.json();
  },

  async createCourseOffering(offeringData: Omit<CourseOffering, 'id'>): Promise<CourseOffering> {
    const response = await fetch(`${API_BASE_URL}/course-offerings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(offeringData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create course offering' }));
      throw new Error(errorData.message || 'Failed to create course offering');
    }
    return response.json();
  },

  async updateCourseOffering(id: string, offeringData: Partial<Omit<CourseOffering, 'id'>>): Promise<CourseOffering> {
    const response = await fetch(`${API_BASE_URL}/course-offerings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(offeringData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update course offering' }));
      throw new Error(errorData.message || 'Failed to update course offering');
    }
    return response.json();
  },

  async deleteCourseOffering(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/course-offerings/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete course offering with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete course offering with id ${id}`);
    }
  },

  async importCourseOfferings(
    file: File, 
    courses: Course[], 
    batches: Batch[], 
    faculties: Faculty[]
  ): Promise<{ newCount: number; updatedCount: number; skippedCount: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('courses', JSON.stringify(courses));
    formData.append('batches', JSON.stringify(batches));
    formData.append('faculties', JSON.stringify(faculties));

    const response = await fetch(`${API_BASE_URL}/course-offerings/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to import course offerings' }));
      let detailedMessage = errorData.message || 'Failed to import course offerings';
      if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        detailedMessage += ` Specific issues: ${errorData.errors.slice(0, 3).join('; ')}${errorData.errors.length > 3 ? '...' : ''}`;
      }
      throw new Error(detailedMessage);
    }
    return response.json();
  },

  async exportCourseOfferings(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/course-offerings/export?format=${format}`);
    if (!response.ok) {
      throw new Error('Failed to export course offerings');
    }
    return response.blob();
  },

  async downloadSampleCSV(): Promise<Blob> {
    const sampleCsvContent = `id,courseId,courseName,courseSubcode,batchId,batchName,academicYear,semester,facultyIds,facultyNames,roomIds,startDate,endDate,status,maxEnrollments,currentEnrollments
co_sample_1,course_cs101_dce_gpp,Introduction to Programming,CS101,batch_dce_2022_gpp,DCE 2022,2024-25,1,"user_faculty_cs01_gpp,fac_cs01_gpp","John Doe, Jane Smith","room_a101_gpp,room_a102_gpp",2024-07-15T00:00:00.000Z,2024-11-15T00:00:00.000Z,scheduled,60,45
,course_me101_dme_gpp,Engineering Mechanics,ME101,batch_dme_2023_gpp,DME 2023,2024-25,1,user_faculty_me01_gpp,Mike Johnson,room_b202_gpp,2024-07-15T00:00:00.000Z,2024-11-15T00:00:00.000Z,ongoing,50,30`;
    
    return new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
  }
};