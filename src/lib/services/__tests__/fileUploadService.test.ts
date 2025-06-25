import { FileUploadService } from '../fileUploadService';
import { v4 as uuidv4 } from 'uuid';

// Mock external dependencies
jest.mock('uuid');
jest.mock('@/lib/storage', () => ({
  uploadFile: jest.fn().mockResolvedValue({
    url: 'https://storage.example.com/files/test.jpg',
    key: 'files/test.jpg',
  }),
  deleteFile: jest.fn().mockResolvedValue(true),
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.example.com/test.jpg'),
}));

// Mock sharp for image processing
jest.mock('sharp', () => {
  const sharp = () => ({
    metadata: jest.fn().mockResolvedValue({
      width: 1200,
      height: 800,
      format: 'jpeg',
    }),
    resize: jest.fn().mockReturnThis(),
    toFormat: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image')),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
  });
  return sharp;
});

describe('FileUploadService', () => {
  const mockFile = {
    originalname: 'test.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test file content'),
    size: 1024,
  } as Express.Multer.File;

  const mockPdfFile = {
    ...mockFile,
    mimetype: 'application/pdf',
    originalname: 'document.pdf',
  } as Express.Multer.File;

  beforeEach(() => {
    jest.clearAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue('unique-id');
  });

  describe('uploadFile', () => {
    it('should upload a file to storage', async () => {
      const result = await FileUploadService.uploadFile({
        file: mockFile,
        folder: 'uploads',
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        maxFileSize: 5 * 1024 * 1024, // 5MB
      });

      expect(result).toEqual({
        url: 'https://storage.example.com/files/test.jpg',
        key: 'files/test.jpg',
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
      });

      const storage = require('@/lib/storage');
      expect(storage.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          buffer: mockFile.buffer,
          key: expect.stringMatching(/^uploads\/unique-id\.jpg$/),
          contentType: 'image/jpeg',
        })
      );
    });

    it('should throw error for invalid file type', async () => {
      await expect(
        FileUploadService.uploadFile({
          file: { ...mockFile, mimetype: 'application/exe' },
          folder: 'uploads',
          allowedMimeTypes: ['image/jpeg', 'image/png'],
        })
      ).rejects.toThrow('File type not allowed');
    });

    it('should throw error for file size limit exceeded', async () => {
      await expect(
        FileUploadService.uploadFile({
          file: { ...mockFile, size: 6 * 1024 * 1024 },
          folder: 'uploads',
          maxFileSize: 5 * 1024 * 1024, // 5MB
        })
      ).rejects.toThrow('File size exceeds the limit');
    });
  });

  describe('processImage', () => {
    it('should process and resize an image', async () => {
      const result = await FileUploadService.processImage(mockFile, {
        maxWidth: 800,
        quality: 80,
        format: 'webp',
      });

      expect(result).toEqual({
        buffer: expect.any(Buffer),
        mimeType: 'image/webp',
        originalName: 'test.webp',
      });

      const sharp = require('sharp');
      const sharpInstance = sharp();
      
      expect(sharpInstance.resize).toHaveBeenCalledWith(800, undefined, {
        fit: 'inside',
        withoutEnlargement: true,
      });
      expect(sharpInstance.webp).toHaveBeenCalledWith({ quality: 80 });
    });

    it('should maintain original format if not specified', async () => {
      await FileUploadService.processImage(mockFile, {});
      
      const sharp = require('sharp');
      const sharpInstance = sharp();
      
      expect(sharpInstance.toFormat).not.toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    it('should delete a file from storage', async () => {
      const storage = require('@/lib/storage');
      
      await FileUploadService.deleteFile('uploads/test.jpg');
      
      expect(storage.deleteFile).toHaveBeenCalledWith('uploads/test.jpg');
    });

    it('should not throw error if file does not exist', async () => {
      const storage = require('@/lib/storage');
      storage.deleteFile.mockRejectedValueOnce(new Error('File not found'));
      
      await expect(
        FileUploadService.deleteFile('nonexistent.jpg')
      ).resolves.not.toThrow();
    });
  });

  describe('generatePresignedUrl', () => {
    it('should generate a presigned URL for a file', async () => {
      const storage = require('@/lib/storage');
      
      const url = await FileUploadService.generatePresignedUrl('uploads/test.jpg', 3600);
      
      expect(url).toBe('https://signed-url.example.com/test.jpg');
      expect(storage.getSignedUrl).toHaveBeenCalledWith('uploads/test.jpg', 3600);
    });
  });

  describe('validateFile', () => {
    it('should validate file against constraints', async () => {
      const constraints = {
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        maxFileSize: 5 * 1024 * 1024, // 5MB
      };
      
      await expect(
        FileUploadService.validateFile(mockFile, constraints)
      ).resolves.toBeUndefined();
      
      await expect(
        FileUploadService.validateFile(
          { ...mockFile, mimetype: 'application/exe' },
          constraints
        )
      ).rejects.toThrow('File type not allowed');
      
      await expect(
        FileUploadService.validateFile(
          { ...mockFile, size: 6 * 1024 * 1024 },
          constraints
        )
      ).rejects.toThrow('File size exceeds the limit');
    });
  });

  describe('getFileExtension', () => {
    it('should return correct file extension', () => {
      expect(FileUploadService.getFileExtension('image.jpg')).toBe('jpg');
      expect(FileUploadService.getFileExtension('document.pdf')).toBe('pdf');
      expect(FileUploadService.getFileExtension('file.with.dots.txt')).toBe('txt');
      expect(FileUploadService.getFileExtension('noextension')).toBe('');
    });
  });

  describe('generateUniqueFilename', () => {
    it('should generate a unique filename with extension', () => {
      const filename = FileUploadService.generateUniqueFilename('test.jpg');
      expect(filename).toMatch(/^[a-z0-9-]+\.jpg$/);
      expect(uuidv4).toHaveBeenCalled();
    });

    it('should handle files without extension', () => {
      const filename = FileUploadService.generateUniqueFilename('file');
      expect(filename).toMatch(/^[a-z0-9-]+$/);
    });
  });
});
