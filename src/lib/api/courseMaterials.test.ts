import { courseMaterialService } from './courseMaterials';
import type { CourseMaterial } from '@/types/entities';
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

describe('CourseMaterialService API Tests', () => {
  const now = new Date().toISOString();
  const mockCourseMaterial: CourseMaterial = {
    id: "material1",
    courseOfferingId: "offering1",
    title: "Introduction to Data Structures",
    description: "Basic concepts of data structures",
    fileType: "pdf",
    filePathOrUrl: "/uploads/materials/ds-intro.pdf",
    fileName: "ds-intro.pdf",
    fileSize: 2048000,
    uploadedBy: "faculty1",
    uploadedAt: now,
  };
  const mockCourseMaterials: CourseMaterial[] = [mockCourseMaterial];

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getMaterialsByCourseOffering', () => {
    it('should fetch materials for a course offering successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockCourseMaterials }));
      const result = await courseMaterialService.getMaterialsByCourseOffering('offering1');
      expect(fetch).toHaveBeenCalledWith('/api/course-materials?courseOfferingId=offering1');
      expect(result).toEqual(mockCourseMaterials);
    });

    it('should throw error if fetch fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        status: 404, 
        json: async () => ({ message: "Course offering not found" }) 
      }));
      await expect(courseMaterialService.getMaterialsByCourseOffering('nonexistent')).rejects.toThrow("Course offering not found");
    });

    it('should handle JSON parse error', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        status: 500, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(courseMaterialService.getMaterialsByCourseOffering('offering1')).rejects.toThrow('Failed to fetch course materials');
    });
  });

  describe('getMaterialById', () => {
    it('should fetch material by ID successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => mockCourseMaterial }));
      const result = await courseMaterialService.getMaterialById('material1');
      expect(fetch).toHaveBeenCalledWith('/api/course-materials/material1');
      expect(result).toEqual(mockCourseMaterial);
    });

    it('should throw error if material not found', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        status: 404, 
        json: async () => ({ message: "Failed to fetch material with id nonexistent" }) 
      }));
      await expect(courseMaterialService.getMaterialById('nonexistent')).rejects.toThrow("Failed to fetch material with id nonexistent");
    });

    it('should handle JSON parse error', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        status: 500, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(courseMaterialService.getMaterialById('material1')).rejects.toThrow('Failed to fetch material with id material1');
    });
  });

  describe('createMaterial', () => {
    it('should create material successfully with FormData', async () => {
      const formData = new FormData();
      formData.append('courseOfferingId', 'offering1');
      formData.append('title', 'New Material');
      formData.append('description', 'New course material');
      formData.append('fileType', 'pdf');
      
      const createdMaterial = { ...mockCourseMaterial, id: 'newMaterial1', title: 'New Material' };
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: true, 
        status: 201, 
        json: async () => createdMaterial 
      }));
      
      const result = await courseMaterialService.createMaterial(formData);
      expect(fetch).toHaveBeenCalledWith('/api/course-materials', expect.objectContaining({
        method: 'POST',
        body: formData
      }));
      expect(result).toEqual(createdMaterial);
    });

    it('should throw error if creation fails', async () => {
      const formData = new FormData();
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        status: 400, 
        json: async () => ({ message: "Validation error" }) 
      }));
      await expect(courseMaterialService.createMaterial(formData)).rejects.toThrow("Validation error");
    });

    it('should handle JSON parse error during creation', async () => {
      const formData = new FormData();
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        status: 500, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(courseMaterialService.createMaterial(formData)).rejects.toThrow('Failed to create course material');
    });
  });

  describe('updateMaterial', () => {
    const updateData = {
      title: "Updated Material Title",
      description: "Updated description"
    };

    it('should update material successfully', async () => {
      const updatedMaterial = { ...mockCourseMaterial, ...updateData };
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true, json: async () => updatedMaterial }));
      
      const result = await courseMaterialService.updateMaterial('material1', updateData);
      expect(fetch).toHaveBeenCalledWith('/api/course-materials/material1', expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      }));
      expect(result).toEqual(updatedMaterial);
    });

    it('should throw error if update fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        status: 404, 
        json: async () => ({ message: "Material not found" }) 
      }));
      await expect(courseMaterialService.updateMaterial('nonexistent', updateData)).rejects.toThrow("Material not found");
    });

    it('should handle JSON parse error during update', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        status: 500, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(courseMaterialService.updateMaterial('material1', updateData)).rejects.toThrow('Failed to update course material');
    });
  });

  describe('deleteMaterial', () => {
    it('should delete material successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ ok: true }));
      await courseMaterialService.deleteMaterial('material1');
      expect(fetch).toHaveBeenCalledWith('/api/course-materials/material1', expect.objectContaining({
        method: 'DELETE'
      }));
    });

    it('should throw error if deletion fails', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        status: 404, 
        json: async () => ({ message: "Failed to delete material with id nonexistent" }) 
      }));
      await expect(courseMaterialService.deleteMaterial('nonexistent')).rejects.toThrow("Failed to delete material with id nonexistent");
    });

    it('should handle JSON parse error during deletion', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ 
        ok: false, 
        status: 500, 
        json: async () => { throw new Error('Invalid JSON'); }
      }));
      await expect(courseMaterialService.deleteMaterial('material1')).rejects.toThrow('Failed to delete material with id material1');
    });
  });
});