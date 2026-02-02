import { expect, test, describe, vi, beforeEach } from 'vitest';
import tool from '..';
import { tool as toolFunction, InputType, OutputType } from '../src';

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('SEO关键词挖掘工具', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('工具基础配置应该正确', async () => {
    expect(tool.name).toBeDefined();
    expect(tool.description).toBeDefined();
    expect(tool.cb).toBeDefined();
  });

  test('输入类型验证应该正确', () => {
    const validInput = {
      apiKey: 'test-api-key',
      keyword: 'SEO优化',
      filter: 1,
      pageIndex: 1,
      pageSize: 50,
      sortFields: 4,
      sortType: 'desc' as const
    };

    expect(InputType.parse(validInput)).toEqual(validInput);
  });

  test('应该拒绝无效的API Key', () => {
    const invalidInput = {
      apiKey: '',
      keyword: 'SEO优化',
      filter: 1,
      pageIndex: 1,
      pageSize: 50,
      sortFields: 4,
      sortType: 'desc' as const
    };

    expect(() => InputType.parse(invalidInput)).toThrow('API Key 不能为空');
  });

  test('应该拒绝空的关键词', () => {
    const invalidInput = {
      apiKey: 'test-api-key',
      keyword: '',
      filter: 1,
      pageIndex: 1,
      pageSize: 50,
      sortFields: 4,
      sortType: 'desc' as const
    };

    expect(() => InputType.parse(invalidInput)).toThrow('种子关键词不能为空');
  });

  test('应该验证limit范围', () => {
    const invalidInput1 = {
      apiKey: 'test-api-key',
      keyword: 'SEO优化',
      filter: 1,
      pageIndex: 1,
      pageSize: 0,
      sortFields: 4,
      sortType: 'desc' as const
    };

    const invalidInput2 = {
      apiKey: 'test-api-key',
      keyword: 'SEO优化',
      filter: 1,
      pageIndex: 1,
      pageSize: 101,
      sortFields: 4,
      sortType: 'desc' as const
    };

    expect(() => InputType.parse(invalidInput1)).toThrow();
    expect(() => InputType.parse(invalidInput2)).toThrow();
  });

  test('成功API调用应该返回正确的数据格式', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      data: {
        total: 2,
        list: [
          {
            keyword: 'SEO优化工具',
            search_volume: 1200,
            bid_price: 5.5,
            competition: 0.7,
            cpc: 3.2,
            related_keywords: ['SEO关键词', '搜索引擎优化']
          },
          {
            keyword: '关键词挖掘工具',
            search_volume: 800,
            bid_price: 4.2,
            competition: 0.5,
            cpc: 2.8,
            related_keywords: ['关键词研究', '长尾关键词']
          }
        ]
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const input = {
      apiKey: 'test-api-key',
      keyword: 'SEO优化',
      filter: 1,
      pageIndex: 1,
      pageSize: 10,
      sortFields: 4,
      sortType: 'desc' as const
    };

    const result = await toolFunction(input);

    expect(OutputType.parse(result));
    expect(result.success).toBe(true);
    expect(result.total).toBe(2);

    // 解析JSON字符串验证关键词数据
    const keywordsData = JSON.parse(result.keywords);
    expect(keywordsData).toHaveLength(2);
    expect(keywordsData[0].keyword).toBe('SEO优化工具');
    expect(keywordsData[0].searchVolume).toBe(1200);
  });

  test('API错误应该返回失败状态', async () => {
    const mockErrorResponse = {
      code: 400,
      message: 'Invalid API key'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockErrorResponse)
    });

    const input = {
      apiKey: 'invalid-key',
      keyword: 'SEO优化',
      filter: 1,
      pageIndex: 1,
      pageSize: 10,
      sortFields: 4,
      sortType: 'desc' as const
    };

    const result = await toolFunction(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid API key');
    expect(result.keywords).toBe('[]');
  });

  test('网络错误应该被正确处理', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const input = {
      apiKey: 'test-api-key',
      keyword: 'SEO优化',
      filter: 1,
      pageIndex: 1,
      pageSize: 10,
      sortFields: 4,
      sortType: 'desc' as const
    };

    const result = await toolFunction(input);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Network error');
    expect(result.keywords).toBe('[]');
  });

  test('应该调用正确的API端点', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ code: 0, data: { total: 0, list: [] } })
    });

    const input = {
      apiKey: 'test-api-key',
      keyword: 'SEO优化',
      filter: 1,
      pageIndex: 1,
      pageSize: 10,
      sortFields: 4,
      sortType: 'desc' as const
    };

    await toolFunction(input);

    expect(mockFetch).toHaveBeenCalledWith('http://apis.5118.com/keyword/word/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Authorization: 'test-api-key'
      },
      body: expect.stringContaining('keyword=SEO优化')
    });
  });
});
