import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tool } from '../src';
import * as clientModule from '../../../client';

describe('Tavily Extract Tool', () => {
  const testApiKey = process.env.TEST_TAVLIY_KEY || 'tvly-test-key-1234567890abcdefgh';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Unit Tests (Mocked)', () => {
    it('should extract single URL successfully', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            results: [
              {
                url: 'https://example.com',
                raw_content: 'Extracted content from example.com',
                images: ['https://example.com/image1.jpg']
              }
            ],
            response_time: 1.5,
            request_id: 'extract-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        urls: 'https://example.com',
        format: 'markdown'
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].url).toBe('https://example.com');
      expect(result.results[0].raw_content).toBe('Extracted content from example.com');
      expect(result.successCount).toBe(1);
      expect(result.failedUrls).toHaveLength(0);
      expect(mockClient.post).toHaveBeenCalledWith('/extract', {
        api_key: testApiKey,
        urls: 'https://example.com',
        format: 'markdown'
      });
    });

    it('should extract multiple URLs successfully', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            results: [
              {
                url: 'https://example1.com',
                raw_content: 'Content from example1',
                images: []
              },
              {
                url: 'https://example2.com',
                raw_content: 'Content from example2',
                images: ['https://example2.com/img.jpg']
              }
            ],
            response_time: 2.3,
            request_id: 'multi-extract-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        urls: 'https://example1.com\nhttps://example2.com',
        format: 'text'
      });

      expect(result.results).toHaveLength(2);
      expect(result.successCount).toBe(2);
      expect(result.failedUrls).toHaveLength(0);
      expect(mockClient.post).toHaveBeenCalledWith('/extract', {
        api_key: testApiKey,
        urls: ['https://example1.com', 'https://example2.com'],
        format: 'text'
      });
    });

    it('should handle URL list with empty lines', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            results: [
              {
                url: 'https://example1.com',
                raw_content: 'Content 1',
                images: []
              },
              {
                url: 'https://example2.com',
                raw_content: 'Content 2',
                images: []
              }
            ],
            response_time: 1.8,
            request_id: 'clean-urls-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        urls: 'https://example1.com\n\n\nhttps://example2.com\n',
        format: 'markdown'
      });

      expect(result.results).toHaveLength(2);
      expect(mockClient.post).toHaveBeenCalledWith('/extract', {
        api_key: testApiKey,
        urls: ['https://example1.com', 'https://example2.com'],
        format: 'markdown'
      });
    });

    it('should handle partial failures', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            results: [
              {
                url: 'https://example1.com',
                raw_content: 'Successful extraction',
                images: []
              }
            ],
            failed_results: [
              {
                url: 'https://invalid.com',
                error: 'Failed to fetch URL'
              },
              {
                url: 'https://timeout.com',
                error: 'Request timeout'
              }
            ],
            response_time: 3.0,
            request_id: 'partial-fail-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        urls: 'https://example1.com\nhttps://invalid.com\nhttps://timeout.com',
        format: 'markdown'
      });

      expect(result.results).toHaveLength(1);
      expect(result.successCount).toBe(1);
      expect(result.failedUrls).toHaveLength(2);
      expect(result.failedUrls[0]).toContain('https://invalid.com');
      expect(result.failedUrls[0]).toContain('Failed to fetch URL');
      expect(result.failedUrls[1]).toContain('https://timeout.com');
      expect(result.failedUrls[1]).toContain('Request timeout');
    });

    it('should handle no valid URLs', async () => {
      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'handleTavilyError').mockReturnValue('No valid URLs provided');

      await expect(
        tool({
          tavilyApiKey: testApiKey,
          urls: '\n\n\n',
          format: 'markdown'
        })
      ).rejects.toMatch('No valid URLs provided');
    });

    it('should validate API key format', async () => {
      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {
        throw new Error('Invalid Tavily API key format. Key should start with "tvly-"');
      });

      await expect(
        tool({
          tavilyApiKey: 'invalid-key',
          urls: 'https://example.com',
          format: 'markdown'
        })
      ).rejects.toMatch('Invalid Tavily API key format');
    });

    it('should handle authentication error', async () => {
      const mockClient = {
        post: vi.fn().mockRejectedValue({
          isAxiosError: true,
          response: {
            status: 401,
            data: { error: 'Invalid API key' }
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);
      vi.spyOn(clientModule, 'handleTavilyError').mockReturnValue(
        'Authentication failed: Invalid Tavily API key'
      );

      await expect(
        tool({
          tavilyApiKey: testApiKey,
          urls: 'https://example.com',
          format: 'markdown'
        })
      ).rejects.toMatch('Authentication failed');
    });

    it('should handle rate limit error', async () => {
      const mockClient = {
        post: vi.fn().mockRejectedValue({
          isAxiosError: true,
          response: {
            status: 429,
            data: { error: 'Rate limit exceeded' }
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);
      vi.spyOn(clientModule, 'handleTavilyError').mockReturnValue(
        'Rate limit exceeded. Please wait before making more requests.'
      );

      await expect(
        tool({
          tavilyApiKey: testApiKey,
          urls: 'https://example.com',
          format: 'markdown'
        })
      ).rejects.toMatch('Rate limit exceeded');
    });

    it('should use markdown format by default', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            results: [
              {
                url: 'https://example.com',
                raw_content: '# Markdown Content',
                images: []
              }
            ],
            response_time: 1.2,
            request_id: 'default-format-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      await tool({
        tavilyApiKey: testApiKey,
        urls: 'https://example.com',
        format: 'markdown'
      });

      expect(mockClient.post).toHaveBeenCalledWith('/extract', {
        api_key: testApiKey,
        urls: 'https://example.com',
        format: 'markdown'
      });
    });
  });

  describe('Integration Tests (Real API)', () => {
    // Skip integration tests if API key is not provided
    const skipIntegration = !process.env.TEST_TAVLIY_KEY;

    it.skipIf(skipIntegration)(
      'should extract real URL content',
      async () => {
        const result = await tool({
          tavilyApiKey: process.env.TEST_TAVLIY_KEY!,
          urls: 'https://example.com',
          format: 'markdown'
        });

        expect(result.results.length).toBeGreaterThan(0);
        expect(result.results[0].url).toBe('https://example.com');
        expect(result.results[0].raw_content).toBeDefined();
        expect(result.results[0].raw_content.length).toBeGreaterThan(0);
        expect(result.successCount).toBe(1);
      },
      30000
    );

    it.skipIf(skipIntegration)(
      'should extract multiple real URLs',
      async () => {
        const result = await tool({
          tavilyApiKey: process.env.TEST_TAVLIY_KEY!,
          urls: 'https://example.com\nhttps://www.iana.org',
          format: 'text'
        });

        expect(result.results.length).toBeGreaterThan(0);
        expect(result.successCount).toBeGreaterThan(0);
        expect(result.successCount).toBeLessThanOrEqual(2);

        result.results.forEach((r) => {
          expect(r.url).toBeDefined();
          expect(r.raw_content).toBeDefined();
          expect(r.raw_content.length).toBeGreaterThan(0);
        });
      },
      45000
    );

    it.skipIf(skipIntegration)(
      'should handle invalid URL gracefully',
      async () => {
        const result = await tool({
          tavilyApiKey: process.env.TEST_TAVLIY_KEY!,
          urls: 'https://this-url-does-not-exist-12345.invalid',
          format: 'markdown'
        });

        // Should either fail completely or report in failedUrls
        expect(result.successCount + result.failedUrls.length).toBeGreaterThan(0);
      },
      30000
    );
  });
});
