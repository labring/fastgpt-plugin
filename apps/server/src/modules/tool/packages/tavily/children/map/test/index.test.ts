import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tool } from '../src';
import * as clientModule from '../../../client';

describe('Tavily Map Tool', () => {
  const testApiKey = process.env.TEST_TAVLIY_KEY || 'tvly-test-key-1234567890abcdefgh';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Unit Tests (Mocked)', () => {
    it('should perform basic site mapping successfully', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'docs.tavily.com',
            results: [
              'https://docs.tavily.com/welcome',
              'https://docs.tavily.com/documentation/api-credits',
              'https://docs.tavily.com/documentation/about',
              'https://docs.tavily.com/sdk/python/quick-start'
            ],
            response_time: 3.45,
            request_id: 'map-test-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'docs.tavily.com',
        maxDepth: 1,
        maxBreadth: 20,
        limit: 50,
        allowExternal: true,
        timeout: 150
      });

      expect(result.baseUrl).toBe('docs.tavily.com');
      expect(result.results).toHaveLength(4);
      expect(result.urlCount).toBe(4);
      expect(result.responseTime).toBe(3.45);
      expect(result.results[0]).toBe('https://docs.tavily.com/welcome');
      expect(mockClient.post).toHaveBeenCalledWith('/map', {
        api_key: testApiKey,
        url: 'docs.tavily.com',
        instructions: undefined,
        max_depth: 1,
        max_breadth: 20,
        limit: 50,
        select_paths: undefined,
        select_domains: undefined,
        exclude_paths: undefined,
        exclude_domains: undefined,
        allow_external: true,
        timeout: 150
      });
    });

    it('should perform mapping with instructions', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'docs.tavily.com',
            results: [
              'https://docs.tavily.com/sdk/python/quick-start',
              'https://docs.tavily.com/sdk/python/advanced',
              'https://docs.tavily.com/sdk/python/examples'
            ],
            response_time: 5.67,
            request_id: 'map-instructions-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'docs.tavily.com',
        instructions: 'Find all pages about the Python SDK',
        maxDepth: 2,
        maxBreadth: 20,
        limit: 30,
        allowExternal: true,
        timeout: 150
      });

      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toBe('https://docs.tavily.com/sdk/python/quick-start');
      expect(mockClient.post).toHaveBeenCalledWith(
        '/map',
        expect.objectContaining({
          api_key: testApiKey,
          url: 'docs.tavily.com',
          instructions: 'Find all pages about the Python SDK'
        })
      );
    });

    it('should handle select and exclude patterns correctly', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'example.com',
            results: ['https://example.com/docs/api/v1', 'https://example.com/docs/api/v2'],
            response_time: 2.89,
            request_id: 'map-patterns-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'example.com',
        selectPaths: '/docs/.*\n/api/.*',
        selectDomains: '^example\\.com$',
        excludePaths: '/private/.*',
        excludeDomains: '^admin\\.example\\.com$',
        maxDepth: 1,
        maxBreadth: 20,
        limit: 50,
        allowExternal: true,
        timeout: 150
      });

      expect(result.results).toHaveLength(2);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/map',
        expect.objectContaining({
          select_paths: ['/docs/.*', '/api/.*'],
          select_domains: ['^example\\.com$'],
          exclude_paths: ['/private/.*'],
          exclude_domains: ['^admin\\.example\\.com$']
        })
      );
    });

    it('should handle empty pattern inputs', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'simple-site.com',
            results: ['https://simple-site.com/page1', 'https://simple-site.com/page2'],
            response_time: 1.23,
            request_id: 'map-simple-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'simple-site.com',
        selectPaths: '',
        selectDomains: '',
        excludePaths: '',
        excludeDomains: '',
        maxDepth: 1,
        maxBreadth: 20,
        limit: 50,
        allowExternal: true,
        timeout: 150
      });

      expect(result.results).toHaveLength(2);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/map',
        expect.objectContaining({
          select_paths: undefined,
          select_domains: undefined,
          exclude_paths: undefined,
          exclude_domains: undefined
        })
      );
    });

    it('should handle external link settings', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'internal-site.com',
            results: ['https://internal-site.com/about', 'https://internal-site.com/contact'],
            response_time: 2.1,
            request_id: 'map-external-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'internal-site.com',
        allowExternal: false,
        maxDepth: 1,
        maxBreadth: 20,
        limit: 50,
        timeout: 150
      });

      expect(result.results).toHaveLength(2);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/map',
        expect.objectContaining({
          allow_external: false
        })
      );
    });

    it('should handle maximum depth and breadth limits', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'deep-site.com',
            results: [
              'https://deep-site.com/level1/page1',
              'https://deep-site.com/level1/page2',
              'https://deep-site.com/level1/level2/page3'
            ],
            response_time: 8.76,
            request_id: 'map-limits-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'deep-site.com',
        maxDepth: 3,
        maxBreadth: 10,
        limit: 25,
        allowExternal: true,
        timeout: 150
      });

      expect(result.results).toHaveLength(3);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/map',
        expect.objectContaining({
          max_depth: 3,
          max_breadth: 10,
          limit: 25
        })
      );
    });

    it('should handle timeout settings', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'slow-site.com',
            results: ['https://slow-site.com/page1'],
            response_time: 45.32,
            request_id: 'map-timeout-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'slow-site.com',
        maxDepth: 1,
        maxBreadth: 20,
        limit: 50,
        allowExternal: true,
        timeout: 60
      });

      expect(result.results).toHaveLength(1);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/map',
        expect.objectContaining({
          timeout: 60
        })
      );
    });

    it('should validate API key format', async () => {
      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {
        throw new Error('Invalid Tavily API key format. Key should start with "tvly-"');
      });

      await expect(
        tool({
          tavilyApiKey: 'invalid-key',
          url: 'example.com',
          maxDepth: 1,
          maxBreadth: 20,
          limit: 50,
          allowExternal: true,
          timeout: 150
        })
      ).rejects.toMatch('Invalid Tavily API key format');
    });

    it('should handle authentication error', async () => {
      const mockClient = {
        post: vi.fn().mockRejectedValue({
          isAxiosError: true,
          response: {
            status: 401,
            data: { detail: { error: 'Unauthorized: missing or invalid API key' } }
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
          url: 'example.com',
          maxDepth: 1,
          maxBreadth: 20,
          limit: 50,
          allowExternal: true,
          timeout: 150
        })
      ).rejects.toMatch('Authentication failed');
    });

    it('should handle rate limit error', async () => {
      const mockClient = {
        post: vi.fn().mockRejectedValue({
          isAxiosError: true,
          response: {
            status: 429,
            data: { detail: { error: 'Rate limit exceeded' } }
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
          url: 'example.com',
          maxDepth: 1,
          maxBreadth: 20,
          limit: 50,
          allowExternal: true,
          timeout: 150
        })
      ).rejects.toMatch('Rate limit exceeded');
    });

    it('should handle forbidden URL error', async () => {
      const mockClient = {
        post: vi.fn().mockRejectedValue({
          isAxiosError: true,
          response: {
            status: 403,
            data: { detail: { error: 'URL is not supported' } }
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);
      vi.spyOn(clientModule, 'handleTavilyError').mockReturnValue(
        'Forbidden: URL is not supported'
      );

      await expect(
        tool({
          tavilyApiKey: testApiKey,
          url: 'forbidden-site.com',
          maxDepth: 1,
          maxBreadth: 20,
          limit: 50,
          allowExternal: true,
          timeout: 150
        })
      ).rejects.toMatch('Forbidden');
    });

    it('should handle empty results', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'empty-site.com',
            results: [],
            response_time: 0.5,
            request_id: 'map-empty-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'empty-site.com',
        maxDepth: 1,
        maxBreadth: 20,
        limit: 50,
        allowExternal: true,
        timeout: 150
      });

      expect(result.results).toEqual([]);
      expect(result.urlCount).toBe(0);
      expect(result.responseTime).toBe(0.5);
    });
  });

  describe('Integration Tests (Real API)', () => {
    const skipIntegration = !process.env.TEST_TAVLIY_KEY;

    it.skipIf(skipIntegration)(
      'should perform real site mapping',
      async () => {
        const result = await tool({
          tavilyApiKey: process.env.TEST_TAVLIY_KEY!,
          url: 'docs.tavily.com',
          maxDepth: 1,
          maxBreadth: 20,
          limit: 20,
          allowExternal: true,
          timeout: 150
        });

        expect(result.baseUrl).toBe('docs.tavily.com');
        expect(result.results.length).toBeGreaterThan(0);
        expect(result.urlCount).toBe(result.results.length);
        expect(result.responseTime).toBeGreaterThan(0);

        // Validate URL format
        result.results.forEach((url) => {
          expect(typeof url).toBe('string');
          expect(url.length).toBeGreaterThan(0);
          expect(url).toMatch(/^https?:\/\/.+/);
        });
      },
      120000 // 2 minutes timeout
    );

    it.skipIf(skipIntegration)(
      'should perform real mapping with path filtering',
      async () => {
        const result = await tool({
          tavilyApiKey: process.env.TEST_TAVLIY_KEY!,
          url: 'docs.tavily.com',
          selectPaths: '/documentation/.*',
          maxDepth: 1,
          maxBreadth: 20,
          limit: 10,
          allowExternal: true,
          timeout: 150
        });

        expect(result.baseUrl).toBe('docs.tavily.com');
        expect(result.results.length).toBeGreaterThan(0);

        // All URLs should match the select_paths pattern
        result.results.forEach((url) => {
          expect(url).toMatch(/\/documentation\/.*/);
        });
      },
      120000
    );
  });
});
