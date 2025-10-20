import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { FileMetadata } from '@/s3/config';
import type { FileInput } from '@/s3/type';

// Mock worker_threads to simulate non-worker environment
vi.mock('worker_threads', () => ({
  parentPort: null
}));

// Mock S3 service
const mockUploadFileAdvanced = vi.fn();
vi.mock('@/s3', () => ({
  fileUploadS3Server: {
    uploadFileAdvanced: mockUploadFileAdvanced
  }
}));

// Import after mocks are set up
import { uploadFile } from 'modules/tool/utils/uploadFile';

describe('uploadFile', () => {
  const mockFileMetadata: FileMetadata = {
    fileId: 'test-file-id-123',
    originalFilename: 'test.txt',
    contentType: 'text/plain',
    size: 1024,
    uploadTime: new Date('2024-01-01T00:00:00.000Z'),
    accessUrl: 'https://example.com/test-file-id-123-test.txt'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Main Thread (non-worker)', () => {
    describe('Normal Cases', () => {
      it('should upload file with Buffer successfully', async () => {
        mockUploadFileAdvanced.mockResolvedValue(mockFileMetadata);

        const fileData: FileInput = {
          buffer: Buffer.from('Hello World'),
          defaultFilename: 'test.txt'
        };

        const result = await uploadFile(fileData);

        expect(result).toEqual(mockFileMetadata);
        expect(mockUploadFileAdvanced).toHaveBeenCalledWith({
          buffer: expect.any(Buffer),
          defaultFilename: 'test.txt'
        });
      });

      it('should upload file with Uint8Array successfully', async () => {
        mockUploadFileAdvanced.mockResolvedValue(mockFileMetadata);

        const uint8Array = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
        const fileData: FileInput = {
          buffer: uint8Array as Buffer,
          defaultFilename: 'test.txt'
        };

        const result = await uploadFile(fileData);

        expect(result).toEqual(mockFileMetadata);
        expect(mockUploadFileAdvanced).toHaveBeenCalledWith({
          buffer: expect.any(Buffer),
          defaultFilename: 'test.txt'
        });
      });

      it('should upload file with Base64 successfully', async () => {
        mockUploadFileAdvanced.mockResolvedValue(mockFileMetadata);

        const fileData: FileInput = {
          base64: 'SGVsbG8gV29ybGQ=', // "Hello World" in base64
          defaultFilename: 'test.txt'
        };

        const result = await uploadFile(fileData);

        expect(result).toEqual(mockFileMetadata);
        expect(mockUploadFileAdvanced).toHaveBeenCalledWith({
          base64: 'SGVsbG8gV29ybGQ=',
          defaultFilename: 'test.txt'
        });
      });

      it('should upload file with Base64 data URL successfully', async () => {
        mockUploadFileAdvanced.mockResolvedValue(mockFileMetadata);

        const fileData: FileInput = {
          base64: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
          defaultFilename: 'test.txt'
        };

        const result = await uploadFile(fileData);

        expect(result).toEqual(mockFileMetadata);
        expect(mockUploadFileAdvanced).toHaveBeenCalledWith({
          base64: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
          defaultFilename: 'test.txt'
        });
      });

      it('should upload file from URL successfully', async () => {
        mockUploadFileAdvanced.mockResolvedValue(mockFileMetadata);

        const fileData: FileInput = {
          url: 'https://example.com/file.txt'
        };

        const result = await uploadFile(fileData);

        expect(result).toEqual(mockFileMetadata);
        expect(mockUploadFileAdvanced).toHaveBeenCalledWith({
          url: 'https://example.com/file.txt'
        });
      });

      it('should upload file from local path successfully', async () => {
        mockUploadFileAdvanced.mockResolvedValue(mockFileMetadata);

        const fileData: FileInput = {
          path: '/tmp/test.txt'
        };

        const result = await uploadFile(fileData);

        expect(result).toEqual(mockFileMetadata);
        expect(mockUploadFileAdvanced).toHaveBeenCalledWith({
          path: '/tmp/test.txt'
        });
      });

      it('should handle custom filename for URL upload', async () => {
        mockUploadFileAdvanced.mockResolvedValue(mockFileMetadata);

        const fileData: FileInput = {
          url: 'https://example.com/download',
          defaultFilename: 'custom-name.pdf'
        };

        const result = await uploadFile(fileData);

        expect(result).toEqual(mockFileMetadata);
        expect(mockUploadFileAdvanced).toHaveBeenCalledWith({
          url: 'https://example.com/download',
          defaultFilename: 'custom-name.pdf'
        });
      });
    });

    describe('Error Cases', () => {
      it('should reject when S3 upload fails', async () => {
        const errorMessage = 'S3 upload failed';
        mockUploadFileAdvanced.mockRejectedValue(new Error(errorMessage));

        const fileData: FileInput = {
          buffer: Buffer.from('test'),
          defaultFilename: 'test.txt'
        };

        await expect(uploadFile(fileData)).rejects.toThrow(errorMessage);
      });

      it('should reject when file size exceeds limit', async () => {
        mockUploadFileAdvanced.mockRejectedValue('File size 52428800 exceeds limit 20971520');

        const largeBuffer = Buffer.alloc(50 * 1024 * 1024); // 50MB
        const fileData: FileInput = {
          buffer: largeBuffer,
          defaultFilename: 'large-file.bin'
        };

        await expect(uploadFile(fileData)).rejects.toMatch(/exceeds limit/);
      });

      it('should reject when URL download fails', async () => {
        mockUploadFileAdvanced.mockRejectedValue(new Error('Download failed: 404 Not Found'));

        const fileData: FileInput = {
          url: 'https://example.com/nonexistent.txt'
        };

        await expect(uploadFile(fileData)).rejects.toThrow(/Download failed/);
      });

      it('should reject when local file not found', async () => {
        mockUploadFileAdvanced.mockRejectedValue(
          new Error('File not found: /nonexistent/path.txt')
        );

        const fileData: FileInput = {
          path: '/nonexistent/path.txt'
        };

        await expect(uploadFile(fileData)).rejects.toThrow(/File not found/);
      });

      it('should reject when invalid base64 provided', async () => {
        mockUploadFileAdvanced.mockRejectedValue(new Error('Invalid base64 string'));

        const fileData: FileInput = {
          base64: 'invalid-base64!!!',
          defaultFilename: 'test.txt'
        };

        await expect(uploadFile(fileData)).rejects.toThrow(/Invalid base64/);
      });

      it('should reject when buffer provided without filename', async () => {
        mockUploadFileAdvanced.mockRejectedValue(new Error('Filename required for buffer inputs'));

        const fileData = {
          buffer: Buffer.from('test')
        } as FileInput;

        await expect(uploadFile(fileData)).rejects.toThrow(/Filename required/);
      });

      it('should reject when no input method provided', async () => {
        mockUploadFileAdvanced.mockRejectedValue(new Error('Provide exactly one input method'));

        const fileData = {} as FileInput;

        await expect(uploadFile(fileData)).rejects.toThrow(/one input method/);
      });

      it('should reject when multiple input methods provided', async () => {
        mockUploadFileAdvanced.mockRejectedValue(new Error('Provide exactly one input method'));

        const fileData = {
          url: 'https://example.com/file.txt',
          path: '/tmp/file.txt'
        } as FileInput;

        await expect(uploadFile(fileData)).rejects.toThrow(/one input method/);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty buffer', async () => {
        mockUploadFileAdvanced.mockResolvedValue({
          ...mockFileMetadata,
          size: 0
        });

        const fileData: FileInput = {
          buffer: Buffer.alloc(0),
          defaultFilename: 'empty.txt'
        };

        const result = await uploadFile(fileData);

        expect(result.size).toBe(0);
        expect(mockUploadFileAdvanced).toHaveBeenCalled();
      });

      it('should handle very large filenames', async () => {
        mockUploadFileAdvanced.mockResolvedValue(mockFileMetadata);

        const longFilename = 'a'.repeat(255) + '.txt';
        const fileData: FileInput = {
          buffer: Buffer.from('test'),
          defaultFilename: longFilename
        };

        const result = await uploadFile(fileData);

        expect(result).toEqual(mockFileMetadata);
        expect(mockUploadFileAdvanced).toHaveBeenCalledWith({
          buffer: expect.any(Buffer),
          defaultFilename: longFilename
        });
      });

      it('should handle special characters in filename', async () => {
        mockUploadFileAdvanced.mockResolvedValue(mockFileMetadata);

        const specialFilename = 'KՇ� (1) [copy].txt';
        const fileData: FileInput = {
          buffer: Buffer.from('test'),
          defaultFilename: specialFilename
        };

        const result = await uploadFile(fileData);

        expect(result).toEqual(mockFileMetadata);
        expect(mockUploadFileAdvanced).toHaveBeenCalledWith({
          buffer: expect.any(Buffer),
          defaultFilename: specialFilename
        });
      });

      it('should convert Uint8Array buffer correctly', async () => {
        mockUploadFileAdvanced.mockResolvedValue(mockFileMetadata);

        const uint8Array = new Uint8Array([1, 2, 3, 4, 5]);
        const fileData: FileInput = {
          buffer: uint8Array as Buffer,
          defaultFilename: 'binary.bin'
        };

        await uploadFile(fileData);

        const callArgs = mockUploadFileAdvanced.mock.calls[0][0];
        expect(callArgs.buffer).toBeInstanceOf(Buffer);
        expect(Buffer.isBuffer(callArgs.buffer)).toBe(true);
      });
    });
  });

  describe('Performance', () => {
    it('should complete upload within reasonable time', async () => {
      mockUploadFileAdvanced.mockResolvedValue(mockFileMetadata);

      const startTime = Date.now();
      const fileData: FileInput = {
        buffer: Buffer.from('test content'),
        defaultFilename: 'perf-test.txt'
      };

      await uploadFile(fileData);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle concurrent uploads', async () => {
      // Reset and setup mock for this specific test
      mockUploadFileAdvanced.mockReset();
      mockUploadFileAdvanced.mockImplementation(async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          ...mockFileMetadata,
          originalFilename: data.defaultFilename || 'test.txt',
          size: data.buffer?.length || 1024
        };
      });

      const uploads = Array.from({ length: 5 }, (_, i) => {
        const fileData: FileInput = {
          buffer: Buffer.from(`test content ${i}`),
          defaultFilename: `test-${i}.txt`
        };
        return uploadFile(fileData);
      });

      const results = await Promise.all(uploads);

      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        // Don't check fileId as it's randomly generated by S3
        expect(result).toHaveProperty('fileId');
        expect(typeof result.fileId).toBe('string');
        expect(result.fileId.length).toBeGreaterThan(0);
        expect(result.originalFilename).toBe(`test-${i}.txt`);
        expect(result.contentType).toBe('text/plain');
        expect(typeof result.size).toBe('number');
        expect(result).toHaveProperty('uploadTime');
        expect(result).toHaveProperty('accessUrl');
      });
    });
  });

  describe('Type Safety', () => {
    it('should enforce FileInput type constraints', async () => {
      mockUploadFileAdvanced.mockResolvedValue(mockFileMetadata);

      const fileData: FileInput = {
        buffer: Buffer.from('test'),
        defaultFilename: 'test.txt'
      };

      const result = await uploadFile(fileData);

      expect(result).toHaveProperty('fileId');
      expect(result).toHaveProperty('originalFilename');
      expect(result).toHaveProperty('contentType');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('uploadTime');
      expect(result).toHaveProperty('accessUrl');
    });

    it('should return correct FileMetadata type', async () => {
      mockUploadFileAdvanced.mockResolvedValue(mockFileMetadata);

      const fileData: FileInput = {
        buffer: Buffer.from('test'),
        defaultFilename: 'test.txt'
      };

      const result: FileMetadata = await uploadFile(fileData);

      expect(typeof result.fileId).toBe('string');
      expect(typeof result.originalFilename).toBe('string');
      expect(typeof result.contentType).toBe('string');
      expect(typeof result.size).toBe('number');
      expect(result.uploadTime).toBeInstanceOf(Date);
      expect(typeof result.accessUrl).toBe('string');
    });
  });
});
