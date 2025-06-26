import { StorageService } from '../storageService';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream, createWriteStream, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';
import { createHash } from 'crypto';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { createGzip, gunzip } from 'zlib';
import { rm } from 'fs/promises';
import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('@aws-sdk/client-s3');
jest.mock('fs');
jest.mock('fs/promises');
jest.mock('stream');
jest.mock('zlib');
jest.mock('crypto');

const pipelineAsync = promisify(pipeline);

// Mock file system functions
const mockFiles: Record<string, Buffer> = {};

// Mock S3 client
const mockS3Send = jest.fn();
(S3Client as jest.Mock).mockImplementation(() => ({
  send: mockS3Send,
}));

// Mock file system functions
(mocked(createReadStream) as jest.Mock).mockImplementation((path) => {
  const fileContent = mockFiles[path];
  if (!fileContent) {
    const error = new Error('File not found');
    (error as any).code = 'ENOENT';
    throw error;
  }
  const readable = new Readable();
  readable.push(fileContent);
  readable.push(null);
  return readable;
});

(mocked(createWriteStream) as any).mockImplementation((path) => {
  const chunks: Buffer[] = [];
  const writable = new (require('stream').Writable)({
    write(chunk: Buffer, _: any, callback: () => void) {
      chunks.push(chunk);
      callback();
    },
    final(callback: () => void) {
      mockFiles[path] = Buffer.concat(chunks);
      callback();
    },
  });
  return writable;
});

(mocked(existsSync) as jest.Mock).mockImplementation((path) => path in mockFiles);
(mocked(mkdirSync) as jest.Mock).mockImplementation(() => {});
(mocked(rm) as jest.Mock).mockResolvedValue(undefined);

// Mock zlib
const mockGzip = {
  pipe: jest.fn().mockReturnThis(),
  on: jest.fn().mockImplementation(function(this: any, event, callback) {
    if (event === 'finish') {
      callback();
    }
    return this;
  }),
};

(mocked(createGzip) as jest.Mock).mockReturnValue(mockGzip);
(mocked(gunzip) as jest.Mock).mockReturnValue({
  pipe: jest.fn().mockReturnThis(),
  on: jest.fn().mockImplementation(function(this: any, event, callback) {
    if (event === 'finish') {
      callback();
    }
    return this;
  }),
});

// Mock pipeline
(mocked(pipeline) as jest.Mock).mockImplementation((...args: any[]) => {
  const callback = args[args.length - 1];
  process.nextTick(() => callback(null));
  return { pipe: jest.fn() };
});

// Mock crypto
(mocked(createHash) as jest.Mock).mockReturnValue({
  update: jest.fn().mockReturnThis(),
  digest: jest.fn().mockReturnValue('file-hash'),
});

describe('StorageService', () => {
  let storageService: StorageService;
  const testFileContent = Buffer.from('test file content');
  const testFilePath = '/tmp/test-upload.txt';
  const testKey = 'uploads/test-file.txt';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock files
    Object.keys(mockFiles).forEach(key => delete mockFiles[key]);
    
    // Create test file
    mockFiles[testFilePath] = testFileContent;
    
    // Create storage service with mock config
    storageService = new StorageService({
      local: {
        basePath: '/storage',
      },
      s3: {
        bucket: 'test-bucket',
        region: 'us-east-1',
      },
    });
  });
  
  afterEach(async () => {
    await storageService.close();
  });

  describe('local storage', () => {
    it('should upload a file to local storage', async () => {
      const destination = 'uploads/local-test.txt';
      
      const result = await storageService.uploadLocal(testFilePath, destination);
      
      expect(result).toEqual({
        key: destination,
        size: testFileContent.length,
        mimeType: 'text/plain',
        etag: 'file-hash',
      });
      
      // Verify file was copied
      const destPath = join('/storage', destination);
      expect(mockFiles[destPath]).toEqual(testFileContent);
    });
    
    it('should download a file from local storage', async () => {
      const destination = 'uploads/local-download.txt';
      const destPath = join('/storage', destination);
      mockFiles[destPath] = testFileContent;
      
      const outputPath = '/tmp/downloaded-file.txt';
      
      const result = await storageService.downloadLocal(destination, outputPath);
      
      expect(result).toBe(outputPath);
      expect(mockFiles[outputPath]).toEqual(testFileContent);
    });
    
    it('should get file info from local storage', async () => {
      const destination = 'uploads/local-info.txt';
      const destPath = join('/storage', destination);
      mockFiles[destPath] = testFileContent;
      
      const result = await storageService.getFileInfo(destination);
      
      expect(result).toEqual({
        key: destination,
        size: testFileContent.length,
        mimeType: 'text/plain',
        lastModified: expect.any(Date),
        etag: 'file-hash',
      });
    });
    
    it('should delete a file from local storage', async () => {
      const destination = 'uploads/to-delete.txt';
      const destPath = join('/storage', destination);
      mockFiles[destPath] = testFileContent;
      
      await storageService.deleteFile(destination);
      
      expect(mockFiles[destPath]).toBeUndefined();
    });
    
    it('should generate a signed URL for local file', async () => {
      const fileKey = 'uploads/private-file.txt';
      const url = await storageService.getSignedUrl(fileKey, { expiresIn: 3600 });
      
      expect(url).toContain(`/api/files/signed?key=${encodeURIComponent(fileKey)}`);
    });
  });

  describe('S3 storage', () => {
    beforeEach(() => {
      // Mock S3 responses
      mockSend.mockReset();
      mockS3Send.mockImplementation((command) => {
        if (command instanceof PutObjectCommand) {
          return Promise.resolve({
            ETag: '"s3-etag"',
          });
        }
        if (command instanceof GetObjectCommand) {
          const stream = new Readable();
          stream.push(testFileContent);
          stream.push(null);
          return Promise.resolve({
            Body: stream,
            ContentLength: testFileContent.length,
            ContentType: 'text/plain',
            LastModified: new Date(),
            ETag: '"s3-etag"',
          });
        }
        if (command instanceof DeleteObjectCommand) {
          return Promise.resolve({});
        }
        if (command instanceof HeadObjectCommand) {
          return Promise.resolve({
            ContentLength: testFileContent.length,
            ContentType: 'text/plain',
            LastModified: new Date(),
            ETag: '"s3-etag"',
          });
        }
        return Promise.resolve({});
      });
    });
    
    it('should upload a file to S3', async () => {
      const result = await storageService.uploadS3(testFilePath, testKey, {
        contentType: 'text/plain',
        metadata: { uploadedBy: 'test-user' },
      });
      
      expect(result).toEqual({
        key: testKey,
        size: testFileContent.length,
        mimeType: 'text/plain',
        etag: 's3-etag',
      });
      
      // Verify S3 putObject was called with correct params
      expect(mockS3Send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
      const putCommand = mockS3Send.mock.calls[0][0];
      expect(putCommand.input).toEqual({
        Bucket: 'test-bucket',
        Key: testKey,
        Body: expect.any(Readable),
        ContentType: 'text/plain',
        Metadata: { uploadedBy: 'test-user' },
      });
    });
    
    it('should download a file from S3', async () => {
      const outputPath = '/tmp/s3-download.txt';
      
      const result = await storageService.downloadS3(testKey, outputPath);
      
      expect(result).toBe(outputPath);
      expect(mockFiles[outputPath]).toEqual(testFileContent);
      
      // Verify S3 getObject was called with correct params
      expect(mockS3Send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
      const getCommand = mockS3Send.mock.calls[0][0];
      expect(getCommand.input).toEqual({
        Bucket: 'test-bucket',
        Key: testKey,
      });
    });
    
    it('should get file info from S3', async () => {
      const result = await storageService.getFileInfo(testKey, { storageType: 's3' });
      
      expect(result).toEqual({
        key: testKey,
        size: testFileContent.length,
        mimeType: 'text/plain',
        lastModified: expect.any(Date),
        etag: 's3-etag',
      });
      
      // Verify S3 headObject was called
      expect(mockS3Send).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
    });
    
    it('should generate a signed URL for S3 object', async () => {
      const signedUrl = 'https://s3.amazonaws.com/test-bucket/presigned-url';
      
      // Mock the presigned URL generation
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      getSignedUrl.mockResolvedValue(signedUrl);
      
      const result = await storageService.getSignedUrl(testKey, {
        storageType: 's3',
        expiresIn: 3600,
      });
      
      expect(result).toBe(signedUrl);
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(S3Client),
        expect.any(GetObjectCommand),
        { expiresIn: 3600 }
      );
    });
  });

  describe('file processing', () => {
    it('should compress a file with gzip', async () => {
      const outputPath = '/tmp/compressed.gz';
      
      await storageService.compressFile(testFilePath, outputPath);
      
      // Verify gzip was used
      expect(createGzip).toHaveBeenCalled();
      
      // Verify pipeline was called with correct streams
      expect(pipeline).toHaveBeenCalledWith(
        expect.any(Object), // Readable stream
        expect.any(Object), // Gzip transform
        expect.any(Object), // Writable stream
        expect.any(Function) // Callback
      );
    });
    
    it('should generate a file hash', async () => {
      const hash = await storageService.getFileHash(testFilePath);
      
      expect(hash).toBe('file-hash');
      expect(createHash).toHaveBeenCalledWith('sha256');
    });
    
    it('should validate file type', async () => {
      const imageBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG magic number
      mockFiles['/tmp/image.jpg'] = imageBuffer;
      
      const isValid = await storageService.validateFileType('/tmp/image.jpg', ['image/jpeg', 'image/png']);
      
      expect(isValid).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle file not found during download', async () => {
      const nonExistentFile = '/non/existent/file.txt';
      
      await expect(
        storageService.downloadLocal(nonExistentFile, '/tmp/output.txt')
      ).rejects.toThrow('File not found');
    });
    
    it('should handle S3 errors', async () => {
      const s3Error = new Error('S3 error');
      mockS3Send.mockRejectedValueOnce(s3Error);
      
      await expect(
        storageService.uploadS3(testFilePath, 'uploads/error.txt')
      ).rejects.toThrow(s3Error);
    });
    
    it('should handle file system errors', async () => {
      const fsError = new Error('File system error');
      (mocked(createReadStream) as jest.Mock).mockImplementationOnce(() => {
        throw fsError;
      });
      
      await expect(
        storageService.uploadLocal('/invalid/path.txt', 'uploads/error.txt')
      ).rejects.toThrow(fsError);
    });
  });

  describe('cleanup', () => {
    it('should clean up temporary files', async () => {
      const tempFile = '/tmp/temp-file.txt';
      mockFiles[tempFile] = Buffer.from('temporary content');
      
      await storageService.cleanupTempFiles(0); // 0ms - should clean all files
      
      expect(rm).toHaveBeenCalledWith(tempFile, { force: true });
    });
  });
});

// Helper function to mock the 'pipeline' callback
function mockPipelineCallback(error?: Error) {
  return jest.fn().mockImplementation((...args: any[]) => {
    const callback = args[args.length - 1];
    process.nextTick(() => callback(error));
    return { pipe: jest.fn() };
  });
}
