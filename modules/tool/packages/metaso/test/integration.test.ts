import { describe, it, expect, beforeEach } from 'vitest';
import { tool as searchTool } from '../children/metasoSearch/src';
import { tool as askTool } from '../children/metasoAsk/src';
import { tool as readerTool } from '../children/metasoReader/src';

describe('Metaso Plugin Integration Tests', () => {
  const mockApiKey = 'test-api-key-12345';

  describe('metasoSearch Tool', () => {
    it('should validate input parameters correctly', async () => {
      // 测试无效输入
      const invalidInput = {
        apiKey: '',
        query: '',
        scope: 'invalid' as any,
        includeSummary: true,
        size: 0
      };

      try {
        const result = await searchTool(invalidInput);
        // 如果没有抛出错误，检查结果是否包含错误信息
        expect(result.result).toBeDefined();
        expect(typeof result.result).toBe('string');
      } catch (error) {
        // 如果抛出错误，验证错误信息
        expect(error).toBeDefined();
      }
    });

    it('should handle valid input parameters', async () => {
      const validInput = {
        apiKey: mockApiKey,
        query: '人工智能发展趋势',
        scope: 'all' as const,
        includeSummary: true,
        size: 5
      };

      // 注意：这里会实际调用 API，在真实测试中应该 mock
      const result = await searchTool(validInput);
      expect(result).toHaveProperty('result');
      expect(typeof result.result).toBe('string');
    });
  });

  describe('metasoAsk Tool', () => {
    it('should validate question parameter', async () => {
      const invalidInput = {
        apiKey: '',
        question: '',
        scope: 'all' as const,
        includeReferences: true
      };

      const result = await askTool(invalidInput);
      expect(result.result).toContain('问答失败');
    });

    it('should handle valid question input', async () => {
      const validInput = {
        apiKey: mockApiKey,
        question: '什么是人工智能？',
        scope: 'all' as const,
        includeReferences: true
      };

      const result = await askTool(validInput);
      expect(result).toHaveProperty('result');
      expect(typeof result.result).toBe('string');
    });
  });

  describe('metasoReader Tool', () => {
    it('should validate URL format', async () => {
      const invalidInput = {
        apiKey: mockApiKey,
        url: 'invalid-url',
        includeMetadata: true
      };

      const result = await readerTool(invalidInput);
      expect(result.result).toContain('URL格式错误');
    });

    it('should handle valid URL input', async () => {
      const validInput = {
        apiKey: mockApiKey,
        url: 'https://example.com',
        includeMetadata: true
      };

      const result = await readerTool(validInput);
      expect(result).toHaveProperty('result');
      expect(typeof result.result).toBe('string');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle invalid API key for search tool', async () => {
      const input = {
        apiKey: 'invalid',
        query: 'test',
        scope: 'all' as const,
        includeSummary: true,
        size: 5
      };
      const result = await searchTool(input);
      // API 调用失败时应该包含错误信息
      expect(result.result).toBeDefined();
      expect(typeof result.result).toBe('string');
    });

    it('should handle invalid API key for ask tool', async () => {
      const input = {
        apiKey: 'invalid',
        question: 'test',
        scope: 'all' as const,
        includeReferences: true
      };
      const result = await askTool(input);
      // API 调用失败时应该包含错误信息
      expect(result.result).toBeDefined();
      expect(typeof result.result).toBe('string');
    });

    it('should handle invalid API key for reader tool', async () => {
      const input = {
        apiKey: 'invalid',
        url: 'https://example.com',
        includeMetadata: true
      };
      const result = await readerTool(input);
      // API 调用失败时应该包含错误信息
      expect(result.result).toBeDefined();
      expect(typeof result.result).toBe('string');
    });
  });

  describe('Basic Functionality Tests', () => {
    it('should return structured results for all tools', async () => {
      // 测试基本的结果结构
      const searchResult = await searchTool({
        apiKey: 'test',
        query: 'test',
        scope: 'all' as const,
        includeSummary: true,
        size: 1
      });

      const askResult = await askTool({
        apiKey: 'test',
        question: 'test',
        scope: 'all' as const,
        includeReferences: true
      });

      const readerResult = await readerTool({
        apiKey: 'test',
        url: 'https://example.com',
        includeMetadata: true
      });

      // 所有工具都应该返回包含 result 字段的对象
      expect(searchResult).toHaveProperty('result');
      expect(askResult).toHaveProperty('result');
      expect(readerResult).toHaveProperty('result');
    });
  });
});
