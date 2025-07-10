import { v4 as uuidv4 } from 'uuid';

// Define the Express types locally since they're not available
declare namespace Express {
  export namespace Multer {
    export interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
      filename?: string;
      path?: string;
    }
  }
}

// Mock for missing dependencies - these would normally be actual imports
const mockStorage = {
  uploadFile: (_params: unknown) => {
    void _params; // Unused in mock implementation
    return Promise.resolve({
      url: 'https://storage.example.com/files/test.jpg',
      key: 'files/test.jpg',
    });
  },
  deleteFile: (_key: string) => {
    void _key; // Unused in mock implementation
    return Promise.resolve(true);
  },
  getSignedUrl: (_key: string, _expiresIn?: number) => {
    void _key; // Unused in mock implementation
    void _expiresIn; // Unused in mock implementation
    return Promise.resolve('https://signed-url.example.com/test.jpg');
  },
};

const mockSharp = () => ({
  metadata: () => Promise.resolve({
    width: 1200,
    height: 800,
    format: 'jpeg',
  }),
  resize: (_width?: number, _height?: number) => {
    void _width; // Unused in mock implementation
    void _height; // Unused in mock implementation
    return mockSharp();
  },
  toFormat: (_format: string) => {
    void _format; // Unused in mock implementation
    return mockSharp();
  },
  toBuffer: () => Promise.resolve(Buffer.from('processed-image')),
  jpeg: (_options?: unknown) => {
    void _options; // Unused in mock implementation
    return mockSharp();
  },
  png: (_options?: unknown) => {
    void _options; // Unused in mock implementation
    return mockSharp();
  },
  webp: (_options?: unknown) => {
    void _options; // Unused in mock implementation
    return mockSharp();
  },
});

export interface UploadOptions {
  folder?: string;
  allowedTypes?: string[];
  maxSize?: number;
  fileName?: string;
  metadata?: Record<string, unknown>;
}

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  filename: string;
  mimetype: string;
  metadata?: Record<string, unknown>;
}

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  crop?: boolean;
  blur?: number;
  brightness?: number;
  contrast?: number;
}

export interface FileValidationConstraints {
  maxSize?: number;
  allowedTypes?: string[];
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export class FileUploadError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'FileUploadError';
  }
}

export class FileUploadService {
  static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  static readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'text/plain',
    'text/csv',
  ];

  static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  static async uploadFile(params: {
    file: Express.Multer.File;
    options?: UploadOptions;
  }): Promise<UploadResult> {
    const { file, options = {} } = params;

    // Validate file
    await this.validateFile(file, {
      maxSize: options.maxSize || this.MAX_FILE_SIZE,
      allowedTypes: options.allowedTypes || [
        ...this.ALLOWED_IMAGE_TYPES,
        ...this.ALLOWED_DOCUMENT_TYPES,
      ],
    });

    // Generate unique filename
    const filename = options.fileName || this.generateUniqueFilename(file.originalname);
    const folder = options.folder || 'uploads';
    const key = `${folder}/${filename}`;

    try {
      // Upload to storage
      const uploadResult = await mockStorage.uploadFile({
        key,
        buffer: file.buffer,
        contentType: file.mimetype,
        metadata: options.metadata,
      });

      return {
        url: uploadResult.url,
        key: uploadResult.key,
        size: file.size,
        filename,
        mimetype: file.mimetype,
        metadata: options.metadata,
      };
    } catch (error) {
      throw new FileUploadError(
        `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
        'UPLOAD_FAILED'
      );
    }
  }

  static async processImage(
    file: Express.Multer.File,
    options: ImageProcessingOptions
  ): Promise<Buffer> {
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new FileUploadError('File is not a valid image', 'INVALID_IMAGE_TYPE');
    }

    try {
      const sharp = mockSharp();
      let processor = sharp;

      // Apply transformations
      if (options.width || options.height) {
        processor = processor.resize(options.width, options.height);
      }

      if (options.format) {
        processor = processor.toFormat(options.format);
        
        if (options.format === 'jpeg' && options.quality) {
          processor = processor.jpeg({ quality: options.quality });
        } else if (options.format === 'png' && options.quality) {
          processor = processor.png({ quality: options.quality });
        } else if (options.format === 'webp' && options.quality) {
          processor = processor.webp({ quality: options.quality });
        }
      }

      return await processor.toBuffer();
    } catch (error) {
      throw new FileUploadError(
        `Failed to process image: ${error instanceof Error ? error.message : String(error)}`,
        'IMAGE_PROCESSING_FAILED'
      );
    }
  }

  static async deleteFile(key: string): Promise<boolean> {
    try {
      return await mockStorage.deleteFile(key);
    } catch (error) {
      throw new FileUploadError(
        `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`,
        'DELETE_FAILED'
      );
    }
  }

  static async generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      return await mockStorage.getSignedUrl(key, expiresIn);
    } catch (error) {
      throw new FileUploadError(
        `Failed to generate presigned URL: ${error instanceof Error ? error.message : String(error)}`,
        'PRESIGNED_URL_FAILED'
      );
    }
  }

  static async validateFile(
    file: Express.Multer.File,
    constraints: FileValidationConstraints
  ): Promise<void> {
    // Check file size
    if (constraints.maxSize && file.size > constraints.maxSize) {
      throw new FileUploadError(
        `File size exceeds maximum allowed size of ${constraints.maxSize} bytes`,
        'FILE_TOO_LARGE'
      );
    }

    // Check file type
    if (constraints.allowedTypes && !constraints.allowedTypes.includes(file.mimetype)) {
      throw new FileUploadError(
        `File type ${file.mimetype} is not allowed`,
        'INVALID_FILE_TYPE'
      );
    }

    // For images, check dimensions if specified
    if (this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      if (constraints.minWidth || constraints.minHeight || constraints.maxWidth || constraints.maxHeight) {
        try {
          const sharp = mockSharp();
          const metadata = await sharp.metadata();
          
          if (constraints.minWidth && metadata.width && metadata.width < constraints.minWidth) {
            throw new FileUploadError(
              `Image width ${metadata.width} is below minimum required width of ${constraints.minWidth}`,
              'IMAGE_TOO_SMALL'
            );
          }
          
          if (constraints.minHeight && metadata.height && metadata.height < constraints.minHeight) {
            throw new FileUploadError(
              `Image height ${metadata.height} is below minimum required height of ${constraints.minHeight}`,
              'IMAGE_TOO_SMALL'
            );
          }
          
          if (constraints.maxWidth && metadata.width && metadata.width > constraints.maxWidth) {
            throw new FileUploadError(
              `Image width ${metadata.width} exceeds maximum allowed width of ${constraints.maxWidth}`,
              'IMAGE_TOO_LARGE'
            );
          }
          
          if (constraints.maxHeight && metadata.height && metadata.height > constraints.maxHeight) {
            throw new FileUploadError(
              `Image height ${metadata.height} exceeds maximum allowed height of ${constraints.maxHeight}`,
              'IMAGE_TOO_LARGE'
            );
          }
        } catch (error) {
          if (error instanceof FileUploadError) {
            throw error;
          }
          throw new FileUploadError(
            `Failed to validate image dimensions: ${error instanceof Error ? error.message : String(error)}`,
            'IMAGE_VALIDATION_FAILED'
          );
        }
      }
    }
  }

  static getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  static generateUniqueFilename(originalFilename: string): string {
    const extension = this.getFileExtension(originalFilename);
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    
    return extension 
      ? `${timestamp}-${uniqueId}.${extension}`
      : `${timestamp}-${uniqueId}`;
  }

  static getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      txt: 'text/plain',
      csv: 'text/csv',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  static isImageFile(file: Express.Multer.File): boolean {
    return this.ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  }

  static isDocumentFile(file: Express.Multer.File): boolean {
    return this.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype);
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static async getImageDimensions(file: Express.Multer.File): Promise<{ width: number; height: number }> {
    if (!this.isImageFile(file)) {
      throw new FileUploadError('File is not an image', 'NOT_AN_IMAGE');
    }

    try {
      const sharp = mockSharp();
      const metadata = await sharp.metadata();
      
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
      };
    } catch (error) {
      throw new FileUploadError(
        `Failed to get image dimensions: ${error instanceof Error ? error.message : String(error)}`,
        'DIMENSION_READ_FAILED'
      );
    }
  }
}
