import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tool } from '../src';
import * as clientModule from '../../../client';

describe('Tavily Search Tool', () => {
  const testApiKey = process.env.TEST_TAVLIY_KEY || 'tvly-test-key-1234567890abcdefgh';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Unit Tests (Mocked)', () => {
    it('should perform basic search successfully', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            query: 'test query',
            answer: 'Test answer',
            results: [
              {
                title: 'Test Result 1',
                url: 'https://example.com/1',
                content: 'Test content 1',
                score: 0.95
              },
              {
                title: 'Test Result 2',
                url: 'https://example.com/2',
                content: 'Test content 2',
                score: 0.85
              }
            ],
            response_time: 1.23,
            request_id: 'test-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        query: 'test query',
        searchDepth: 'basic',
        maxResults: 5,
        includeAnswer: true,
        searchTopic: 'general',
        includeRawContent: 'none',
        timeRange: 'none',
        includeImages: false,
        includeImageDescriptions: false,
        includeFavicon: false,
        includeDomains: [],
        excludeDomains: []
      });

      expect(result.answer).toBe('Test answer');
      expect(result.results).toHaveLength(2);
      expect(result.results[0].title).toBe('Test Result 1');
      expect(result.results[0].url).toBe('https://example.com/1');
      expect(mockClient.post).toHaveBeenCalledWith('/search', {
        api_key: testApiKey,
        query: 'test query',
        search_depth: 'basic',
        max_results: 5,
        include_answer: true,
        topic: 'general',
        include_raw_content: false,
        time_range: undefined,
        include_images: false,
        include_image_descriptions: false,
        include_favicon: false,
        include_domains: [],
        exclude_domains: []
      });
    });

    it('should perform advanced search successfully', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            query: 'advanced query',
            results: [
              {
                title: 'Advanced Result',
                url: 'https://example.com/advanced',
                content: 'Advanced content',
                score: 0.98,
                raw_content: 'Full raw content'
              }
            ],
            response_time: 2.45,
            request_id: 'advanced-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        query: 'advanced query',
        searchDepth: 'advanced',
        maxResults: 10,
        includeAnswer: false,
        searchTopic: 'general',
        includeRawContent: 'none',
        timeRange: 'none',
        includeImages: false,
        includeImageDescriptions: false,
        includeFavicon: false,
        includeDomains: [],
        excludeDomains: []
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].raw_content).toBe('Full raw content');
      expect(mockClient.post).toHaveBeenCalledWith('/search', {
        api_key: testApiKey,
        query: 'advanced query',
        search_depth: 'advanced',
        max_results: 10,
        include_answer: false,
        topic: 'general',
        include_raw_content: false,
        time_range: undefined,
        include_images: false,
        include_image_descriptions: false,
        include_favicon: false,
        include_domains: [],
        exclude_domains: []
      });
    });

    it('should handle empty results', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            query: 'no results query',
            results: [],
            response_time: 0.5,
            request_id: 'empty-request-id'
          }
        })
      };

      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {});
      vi.spyOn(clientModule, 'createTavilyClient').mockReturnValue(mockClient as any);

      const result = await tool({
        tavilyApiKey: testApiKey,
        query: 'no results query',
        searchDepth: 'basic',
        maxResults: 5,
        includeAnswer: false,
        searchTopic: 'general',
        includeRawContent: 'none',
        timeRange: 'none',
        includeImages: false,
        includeImageDescriptions: false,
        includeFavicon: false,
        includeDomains: [],
        excludeDomains: []
      });

      expect(result.results).toEqual([]);
      expect(result.answer).toBe('');
    });

    it('should validate API key format', async () => {
      vi.spyOn(clientModule, 'validateApiKey').mockImplementation(() => {
        throw new Error('Invalid Tavily API key format. Key should start with "tvly-"');
      });

      await expect(
        tool({
          tavilyApiKey: 'invalid-key',
          query: 'test',
          searchDepth: 'basic',
          maxResults: 5,
          includeAnswer: false,
          searchTopic: 'general',
          includeRawContent: 'none',
          timeRange: 'none',
          includeImages: false,
          includeImageDescriptions: false,
          includeFavicon: false,
          includeDomains: [],
          excludeDomains: []
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
          query: 'test',
          searchDepth: 'basic',
          maxResults: 5,
          includeAnswer: false,
          searchTopic: 'general',
          includeRawContent: 'none',
          timeRange: 'none',
          includeImages: false,
          includeImageDescriptions: false,
          includeFavicon: false,
          includeDomains: [],
          excludeDomains: []
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
          query: 'test',
          searchDepth: 'basic',
          maxResults: 5,
          includeAnswer: false,
          searchTopic: 'general',
          includeRawContent: 'none',
          timeRange: 'none',
          includeImages: false,
          includeImageDescriptions: false,
          includeFavicon: false,
          includeDomains: [],
          excludeDomains: []
        })
      ).rejects.toMatch('Rate limit exceeded');
    });

    it('should handle network timeout', async () => {
      const mockClient = {
        post: vi.fn().mockRejectedValue({
          isAxiosError: true,
          code: 'ECONNABORTED',
          message: 'timeout of 60000ms exceeded'
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
          query: 'test',
          searchDepth: 'basic',
          maxResults: 5,
          includeAnswer: false,
          searchTopic: 'general',
          includeRawContent: 'none',
          timeRange: 'none',
          includeImages: false,
          includeImageDescriptions: false,
          includeFavicon: false,
          includeDomains: [],
          excludeDomains: []
        })
      ).rejects.toMatch('Request timeout');
    });
  });

  describe('Integration Tests (Real API)', () => {
    // Skip integration tests if API key is not provided
    const skipIntegration = !process.env.TEST_TAVLIY_KEY;

    it.skipIf(skipIntegration)(
      'should perform real basic search',
      async () => {
        const result = await tool({
          tavilyApiKey: process.env.TEST_TAVLIY_KEY!,
          query: 'TypeScript programming language',
          searchDepth: 'basic',
          maxResults: 3,
          includeAnswer: false,
          searchTopic: 'general',
          includeRawContent: 'none',
          timeRange: 'none',
          includeImages: false,
          includeImageDescriptions: false,
          includeFavicon: false,
          includeDomains: [],
          excludeDomains: []
        });

        expect(result.results.length).toBeGreaterThan(0);
        expect(result.results.length).toBeLessThanOrEqual(3);
        expect(result.results[0]).toHaveProperty('title');
        expect(result.results[0]).toHaveProperty('url');
        expect(result.results[0]).toHaveProperty('content');
      },
      30000
    );

    it.skipIf(skipIntegration)(
      'should perform real search with AI answer',
      async () => {
        const result = await tool({
          tavilyApiKey: process.env.TEST_TAVLIY_KEY!,
          query: 'What is artificial intelligence?',
          searchDepth: 'basic',
          maxResults: 5,
          includeAnswer: true,
          searchTopic: 'general',
          includeRawContent: 'none',
          timeRange: 'none',
          includeImages: false,
          includeImageDescriptions: false,
          includeFavicon: false,
          includeDomains: [],
          excludeDomains: []
        });

        expect(result.answer).toBeDefined();
        expect(result.answer!.length).toBeGreaterThan(0);
        expect(result.results.length).toBeGreaterThan(0);
      },
      30000
    );

    it.skipIf(skipIntegration)(
      'should perform real advanced search',
      async () => {
        const result = await tool({
          tavilyApiKey: process.env.TEST_TAVLIY_KEY!,
          query: 'latest developments in quantum computing',
          searchDepth: 'advanced',
          maxResults: 5,
          includeAnswer: true,
          searchTopic: 'general',
          includeRawContent: 'none',
          timeRange: 'none',
          includeImages: false,
          includeImageDescriptions: false,
          includeFavicon: false,
          includeDomains: [],
          excludeDomains: []
        });

        expect(result.results.length).toBeGreaterThan(0);
        expect(result.answer).toBeDefined();
        // Advanced search may include raw_content
        result.results.forEach((r) => {
          expect(r.title).toBeDefined();
          expect(r.url).toBeDefined();
          expect(r.content).toBeDefined();
        });
      },
      60000
    );
  });
});
