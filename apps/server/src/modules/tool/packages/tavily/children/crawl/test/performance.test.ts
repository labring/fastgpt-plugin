import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tool } from '../src';
import * as clientModule from '../../../client';

describe('Tavily Crawl Tool - Performance Tests', () => {
  const testApiKey = 'tvly-test-key-1234567890abcdefgh';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Large Scale Crawls', () => {
    it('should handle large number of results efficiently', async () => {
      const mockResults = Array.from({ length: 100 }, (_, i) => ({
        url: `https://example.com/page${i + 1}`,
        raw_content: `Content for page ${i + 1}`,
        favicon: `https://example.com/favicon${i + 1}.ico`
      }));

      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'example.com',
            results: mockResults,
            response_time: 45.67,
            request_id: 'large-crawl-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'example.com',
        limit: 100,
        maxDepth: 2,
        maxBreadth: 50,
        allowExternal: true,
        includeImages: false,
        extractDepth: 'basic',
        format: 'markdown',
        includeFavicon: false,
        timeout: 150
      });

      expect(result.results).toHaveLength(100);
      expect(result.successCount).toBe(100);
      expect(result.responseTime).toBe(45.67);
    });

    it('should handle memory-intensive operations', async () => {
      const largeContent = 'A'.repeat(10000); // 10KB of content per result
      const mockResults = Array.from({ length: 50 }, (_, i) => ({
        url: `https://large-content-site.com/page${i + 1}`,
        raw_content: `${largeContent}\nPage ${i + 1} content here.`,
        favicon: `https://large-content-site.com/favicon.ico`
      }));

      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'large-content-site.com',
            results: mockResults,
            response_time: 78.9,
            request_id: 'memory-intensive-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const startTime = Date.now();
      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'large-content-site.com',
        limit: 50,
        extractDepth: 'advanced',
        maxDepth: 1,
        maxBreadth: 20,
        allowExternal: true,
        includeImages: false,
        format: 'markdown',
        includeFavicon: false,
        timeout: 150
      });
      const endTime = Date.now();

      expect(result.results).toHaveLength(50);
      expect(result.results[0].raw_content.length).toBeGreaterThan(10000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Network Resilience', () => {
    it('should handle intermittent network failures gracefully', async () => {
      let callCount = 0;
      const mockClient = {
        post: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.reject({
              isAxiosError: true,
              code: 'ECONNRESET',
              message: 'Connection reset by peer'
            });
          }
          return Promise.resolve({
            data: {
              base_url: 'resilient-site.com',
              results: [
                {
                  url: 'https://resilient-site.com/page1',
                  raw_content: 'Successfully fetched after retry'
                }
              ],
              response_time: 12.34,
              request_id: 'resilient-request-id'
            }
          });
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      // Note: This test demonstrates that the current implementation doesn't automatically retry
      // In a production environment, you might want to add retry logic
      await expect(
        tool({
          tavilyApiKey: testApiKey,
          url: 'resilient-site.com',
          maxDepth: 1,
          maxBreadth: 20,
          limit: 50,
          allowExternal: true,
          includeImages: false,
          extractDepth: 'basic',
          format: 'markdown',
          includeFavicon: false,
          timeout: 150
        })
      ).rejects.toThrow();
    });
  });

  describe('Input Validation Performance', () => {
    it('should handle large select/exclude path lists efficiently', async () => {
      const largePathList = Array.from({ length: 1000 }, (_, i) => `/path${i + 1}/.*`).join('\n');

      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'large-path-site.com',
            results: [],
            response_time: 5.43,
            request_id: 'large-path-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const startTime = Date.now();
      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'large-path-site.com',
        selectPaths: largePathList,
        maxDepth: 1,
        maxBreadth: 20,
        limit: 50,
        allowExternal: true,
        includeImages: false,
        extractDepth: 'basic',
        format: 'markdown',
        includeFavicon: false,
        timeout: 150
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should process within 1 second
      expect(mockClient.post).toHaveBeenCalledWith(
        '/crawl',
        expect.objectContaining({
          select_paths: Array.from({ length: 1000 }, (_, i) => `/path${i + 1}/.*`)
        })
      );
    });
  });

  describe('Resource Cleanup', () => {
    it('should properly handle response cleanup', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'cleanup-test.com',
            results: [
              {
                url: 'https://cleanup-test.com/page1',
                raw_content: 'Test content 1',
                favicon: 'https://cleanup-test.com/favicon1.ico'
              },
              {
                url: 'https://cleanup-test.com/page2',
                raw_content: 'Test content 2',
                favicon: 'https://cleanup-test.com/favicon2.ico'
              }
            ],
            response_time: 3.21,
            request_id: 'cleanup-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'cleanup-test.com',
        maxDepth: 1,
        maxBreadth: 20,
        limit: 50,
        allowExternal: true,
        includeImages: false,
        extractDepth: 'basic',
        format: 'markdown',
        includeFavicon: false,
        timeout: 150
      });

      // Verify that all properties are properly handled and no undefined values exist
      result.results.forEach((crawlResult) => {
        expect(crawlResult.url).toBeDefined();
        expect(crawlResult.raw_content).toBeDefined();
        expect(typeof crawlResult.url).toBe('string');
        expect(typeof crawlResult.raw_content).toBe('string');
      });
    });
  });
});
