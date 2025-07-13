// src/lib/api/courseMaterials.ts
import type { CourseMaterial } from '@/types/entities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const courseMaterialService = {
  async getAllCourseMaterials(): Promise<CourseMaterial[]> {
    const response = await fetch(`${API_BASE_URL}/course-materials`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch all course materials' }));
      throw new Error(errorData.message || 'Failed to fetch all course materials');
    }
    return response.json();
  },

  async getMaterialsByCourseOffering(courseOfferingId: string): Promise<CourseMaterial[]> {
    const response = await fetch(`${API_BASE_URL}/course-materials?courseOfferingId=${courseOfferingId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch course materials' }));
      throw new Error(errorData.message || 'Failed to fetch course materials');
    }
    return response.json();
  },

  async getMaterialById(id: string): Promise<CourseMaterial> {
    const response = await fetch(`${API_BASE_URL}/course-materials/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to fetch material with id ${id}` }));
      throw new Error(errorData.message || `Failed to fetch material with id ${id}`);
    }
    return response.json();
  },

  // For create, we'll need to handle file uploads, so using FormData
  async createMaterial(formData: FormData): Promise<CourseMaterial> {
    // Note: The FormData should contain courseOfferingId, title, description, fileType, and the file itself if not a link
    const response = await fetch(`${API_BASE_URL}/course-materials`, {
      method: 'POST',
      body: formData, // No 'Content-Type' header when sending FormData, browser sets it
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create course material' }));
      throw new Error(errorData.message || 'Failed to create course material');
    }
    return response.json();
  },

  async updateMaterial(id: string, materialData: Partial<Omit<CourseMaterial, 'id' | 'courseOfferingId' | 'uploadedBy' | 'uploadedAt' | 'filePathOrUrl' | 'fileName' | 'fileSize' >>): Promise<CourseMaterial> {
    // Updating files is complex and usually involves deleting and re-uploading.
    // This update is for metadata like title, description.
    const response = await fetch(`${API_BASE_URL}/course-materials/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(materialData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update course material' }));
      throw new Error(errorData.message || 'Failed to update course material');
    }
    return response.json();
  },

  async deleteMaterial(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/course-materials/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete material with id ${id}` }));
      throw new Error(errorData.message || `Failed to delete material with id ${id}`);
    }
  },
};
