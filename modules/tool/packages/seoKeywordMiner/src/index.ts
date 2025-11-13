import { z } from 'zod';

export const InputType = z.object({
  apiKey: z.string().min(1, 'API Key 不能为空'),
  keyword: z.string().min(1, '种子关键词不能为空'),
  pageIndex: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(100),
  sortFields: z.number().int().min(2).max(9).default(4),
  sortType: z.enum(['asc', 'desc']).default('desc'),
  filter: z.number().int().min(1).max(9).default(1),
  filterDate: z.string().optional()
});

export const KeywordDataType = z.object({
  keyword: z.string(),
  index: z.number(), // 流量指数
  mobileIndex: z.number(), // 移动指数
  douyinIndex: z.number().optional(), // 抖音指数
  haosouIndex: z.number(), // 好搜360指数
  longKeywordCount: z.number(), // 长尾词数量
  pageUrl: z.string(), // 推荐网站
  bidwordCompanyCount: z.number(), // 竞价公司数量
  bidwordKwc: z.number(), // 竞价竞争度(1、高 2、中 3、低)
  bidwordPcpv: z.number(), // PC检索量
  bidwordWisepv: z.number(), // 移动检索量
  semReason: z.string(), // 流量特点
  semPrice: z.string() // SEM点击价格
});

export const OutputType = z.object({
  keywords: z.string(),
  total: z.number(),
  pageCount: z.number(),
  pageIndex: z.number(),
  pageSize: z.number(),
  success: z.boolean(),
  message: z.string().optional()
});

export async function tool({
  apiKey,
  keyword,
  pageIndex,
  pageSize,
  sortFields,
  sortType,
  filter,
  filterDate
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  try {
    // 基于5118官方API文档实现
    // 参考PHP示例代码和文档：https://www.5118.com/apistore/detail/8cf3d6ed-2b12-ed11-8da8-e43d1a103141/-1

    const apiUrl = 'http://apis.5118.com/keyword/word/v2'; // 5118官方API端点
    const requestData: any = {
      keyword,
      page_index: pageIndex,
      page_size: pageSize,
      sort_fields: sortFields,
      sort_type: sortType,
      filter
    };

    // 如果提供了过滤日期，添加到请求中
    if (filterDate) {
      requestData.filter_date = filterDate;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      body: new URLSearchParams(requestData).toString()
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 检查API返回状态
    if (data.errcode !== '0') {
      return {
        keywords: '[]',
        total: 0,
        pageCount: 0,
        pageIndex: 1,
        pageSize: 100,
        success: false,
        message: data.errmsg || 'API返回错误'
      };
    }

    // 处理返回的关键词数据
    const keywords = (data.data?.word || []).map((item: any) => ({
      keyword: item.keyword || '',
      index: item.index || 0,
      mobileIndex: item.mobile_index || 0,
      douyinIndex: item.douyin_index || 0,
      haosouIndex: item.haosou_index || 0,
      longKeywordCount: item.long_keyword_count || 0,
      pageUrl: item.page_url || '',
      bidwordCompanyCount: item.bidword_company_count || 0,
      bidwordKwc: item.bidword_kwc || 1,
      bidwordPcpv: item.bidword_pcpv || 0,
      bidwordWisepv: item.bidword_wisepv || 0,
      semReason: item.sem_reason || '',
      semPrice: item.sem_price || ''
    }));

    return {
      keywords: JSON.stringify(keywords),
      total: data.data?.total || keywords.length,
      pageCount: data.data?.page_count || 1,
      pageIndex: data.data?.page_index || pageIndex,
      pageSize: data.data?.page_size || pageSize,
      success: true
    };
  } catch (error) {
    return {
      keywords: '[]',
      total: 0,
      pageCount: 0,
      pageIndex: 1,
      pageSize: 100,
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    };
  }
}
