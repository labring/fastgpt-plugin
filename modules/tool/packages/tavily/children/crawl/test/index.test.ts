import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tool } from '../src';
import * as clientModule from '../../../client';

describe('Tavily Crawl Tool', () => {
  const testApiKey = process.env.TEST_TAVLIY_KEY || 'tvly-test-key-1234567890abcdefgh';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Unit Tests (Mocked)', () => {
    it('should perform basic crawl successfully', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'docs.tavily.com',
            results: [
              {
                url: 'https://docs.tavily.com/welcome',
                raw_content: '# Welcome to Tavily Docs\nThis is the welcome page content.',
                favicon: 'https://docs.tavily.com/favicon.ico'
              },
              {
                url: 'https://docs.tavily.com/documentation/about',
                raw_content: '# About Tavily\nTavily is a search engine for AI agents.'
              }
            ],
            response_time: 12.34,
            request_id: 'crawl-test-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'docs.tavily.com',
        maxDepth: 1,
        maxBreadth: 10,
        limit: 25,
        allowExternal: true,
        includeImages: false,
        extractDepth: 'basic',
        format: 'markdown',
        includeFavicon: true,
        timeout: 120
      });

      expect(result.baseUrl).toBe('docs.tavily.com');
      expect(result.results).toHaveLength(2);
      expect(result.successCount).toBe(2);
      expect(result.responseTime).toBe(12.34);
      expect(result.results[0].url).toBe('https://docs.tavily.com/welcome');
      expect(result.results[0].favicon).toBe('https://docs.tavily.com/favicon.ico');
      expect(mockClient.post).toHaveBeenCalledWith('/crawl', {
        api_key: testApiKey,
        url: 'docs.tavily.com',
        instructions: undefined,
        max_depth: 1,
        max_breadth: 10,
        limit: 25,
        select_paths: undefined,
        select_domains: undefined,
        exclude_paths: undefined,
        exclude_domains: undefined,
        allow_external: true,
        include_images: false,
        extract_depth: 'basic',
        format: 'markdown',
        include_favicon: true,
        timeout: 120
      });
    });

    it('should perform crawl with instructions', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'docs.tavily.com',
            results: [
              {
                url: 'https://docs.tavily.com/sdk/python/quick-start',
                raw_content: '# Python SDK Quick Start\nThis is the Python SDK documentation.'
              }
            ],
            response_time: 8.76,
            request_id: 'crawl-instructions-request-id'
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
        maxBreadth: 15,
        limit: 50,
        allowExternal: true,
        includeImages: false,
        extractDepth: 'basic',
        format: 'markdown',
        includeFavicon: false,
        timeout: 150
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].url).toBe('https://docs.tavily.com/sdk/python/quick-start');
      expect(mockClient.post).toHaveBeenCalledWith(
        '/crawl',
        expect.objectContaining({
          api_key: testApiKey,
          url: 'docs.tavily.com',
          instructions: 'Find all pages about the Python SDK'
        })
      );
    });

    it('should handle select and exclude paths correctly', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'example.com',
            results: [
              {
                url: 'https://example.com/docs/api/v1',
                raw_content: 'API Documentation v1'
              }
            ],
            response_time: 5.43,
            request_id: 'crawl-paths-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'example.com',
        selectPaths: '/docs/.*\n/api/v1.*',
        excludePaths: '/private/.*\n/admin/.*',
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

      expect(result.results).toHaveLength(1);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/crawl',
        expect.objectContaining({
          select_paths: ['/docs/.*', '/api/v1.*'],
          exclude_paths: ['/private/.*', '/admin/.*']
        })
      );
    });

    it('should handle empty select/exclude paths', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'example.com',
            results: [],
            response_time: 2.1,
            request_id: 'crawl-empty-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'example.com',
        selectPaths: '',
        excludePaths: '',
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

      expect(result.results).toEqual([]);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/crawl',
        expect.objectContaining({
          select_paths: undefined,
          exclude_paths: undefined
        })
      );
    });

    it('should handle advanced extraction', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'data-heavy-site.com',
            results: [
              {
                url: 'https://data-heavy-site.com/tables',
                raw_content:
                  '# Data Tables\n| Column 1 | Column 2 |\n|----------|----------|\n| Data 1  | Data 2  |'
              }
            ],
            response_time: 15.67,
            request_id: 'crawl-advanced-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'data-heavy-site.com',
        extractDepth: 'advanced',
        includeImages: true,
        format: 'text',
        maxDepth: 1,
        maxBreadth: 20,
        limit: 50,
        allowExternal: true,
        includeFavicon: false,
        timeout: 150
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].raw_content).toContain('Data Tables');
      expect(mockClient.post).toHaveBeenCalledWith(
        '/crawl',
        expect.objectContaining({
          extract_depth: 'advanced',
          include_images: true,
          format: 'text'
        })
      );
    });

    it('should handle maximum depth and breadth limits', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            base_url: 'deep-site.com',
            results: [
              {
                url: 'https://deep-site.com/page1',
                raw_content: 'Page 1 content'
              },
              {
                url: 'https://deep-site.com/page2',
                raw_content: 'Page 2 content'
              }
            ],
            response_time: 25.89,
            request_id: 'crawl-limits-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        url: 'deep-site.com',
        maxDepth: 3,
        maxBreadth: 5,
        limit: 10,
        allowExternal: true,
        includeImages: false,
        extractDepth: 'basic',
        format: 'markdown',
        includeFavicon: false,
        timeout: 150
      });

      expect(result.results).toHaveLength(2);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/crawl',
        expect.objectContaining({
          max_depth: 3,
          max_breadth: 5,
          limit: 10
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
          includeImages: false,
          extractDepth: 'basic',
          format: 'markdown',
          includeFavicon: false,
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
            data: { detail: { error: 'Invalid API key' } }
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
          includeImages: false,
          extractDepth: 'basic',
          format: 'markdown',
          includeFavicon: false,
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
          includeImages: false,
          extractDepth: 'basic',
          format: 'markdown',
          includeFavicon: false,
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
          includeImages: false,
          extractDepth: 'basic',
          format: 'markdown',
          includeFavicon: false,
          timeout: 150
        })
      ).rejects.toMatch('Forbidden');
    });

    it('should handle timeout error', async () => {
      const mockClient = {
        post: vi.fn().mockRejectedValue({
          isAxiosError: true,
          code: 'ECONNABORTED',
          message: 'timeout of 150000ms exceeded'
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);
      vi.spyOn(clientModule, 'handleTavilyError').mockReturnValue(
        'Request timeout. Please check your network connection.'
      );

      await expect(
        tool({
          tavilyApiKey: testApiKey,
          url: 'slow-site.com',
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
      ).rejects.toMatch('Request timeout');
    });
  });

  describe('Integration Tests (Real API)', () => {
    const skipIntegration = !process.env.TEST_TAVLIY_KEY;

    it.skipIf(skipIntegration)(
      'should perform real basic crawl',
      async () => {
        const result = await tool({
          tavilyApiKey: process.env.TEST_TAVLIY_KEY!,
          url: 'docs.tavily.com',
          maxDepth: 1,
          maxBreadth: 10,
          limit: 15,
          allowExternal: true,
          includeImages: false,
          extractDepth: 'basic',
          format: 'markdown',
          includeFavicon: true,
          timeout: 150
        });

        expect(result.baseUrl).toBe('docs.tavily.com');
        expect(result.results.length).toBeGreaterThan(0);
        expect(result.results.length).toBeLessThanOrEqual(15);
        expect(result.successCount).toBe(result.results.length);
        expect(result.responseTime).toBeGreaterThan(0);

        // Validate result structure
        result.results.forEach((crawlResult) => {
          expect(crawlResult).toHaveProperty('url');
          expect(crawlResult).toHaveProperty('raw_content');
          expect(typeof crawlResult.url).toBe('string');
          expect(typeof crawlResult.raw_content).toBe('string');
          expect(crawlResult.url.length).toBeGreaterThan(0);
          expect(crawlResult.raw_content.length).toBeGreaterThan(0);
        });
      },
      180000 // 3 minutes timeout for crawl operations
    );

    it.skipIf(skipIntegration)(
      'should perform real crawl with instructions',
      async () => {
        const result = await tool({
          tavilyApiKey: process.env.TEST_TAVLIY_KEY!,
          url: 'docs.tavily.com',
          instructions: 'Find pages about the Python SDK',
          maxDepth: 1,
          limit: 10,
          maxBreadth: 20,
          allowExternal: true,
          includeImages: false,
          extractDepth: 'basic',
          format: 'markdown',
          includeFavicon: false,
          timeout: 150
        });

        expect(result.baseUrl).toBe('docs.tavily.com');
        expect(result.results.length).toBeGreaterThan(0);

        // Results should contain content related to Python SDK
        const hasPythonContent = result.results.some(
          (r) =>
            r.raw_content.toLowerCase().includes('python') || r.url.toLowerCase().includes('python')
        );
        expect(hasPythonContent).toBe(true);
      },
      180000
    );

    it.skipIf(skipIntegration)(
      'should perform real crawl with path filtering',
      async () => {
        const result = await tool({
          tavilyApiKey: process.env.TEST_TAVLIY_KEY!,
          url: 'docs.tavily.com',
          selectPaths: '/documentation/.*',
          excludePaths: '/private/.*',
          maxDepth: 1,
          limit: 10,
          maxBreadth: 20,
          allowExternal: true,
          includeImages: false,
          extractDepth: 'basic',
          format: 'markdown',
          includeFavicon: false,
          timeout: 150
        });

        expect(result.baseUrl).toBe('docs.tavily.com');

        // All URLs should match the select_paths pattern
        result.results.forEach((crawlResult) => {
          expect(crawlResult.url).toMatch(/\/documentation\/.*/);
        });
      },
      180000
    );
  });
});
