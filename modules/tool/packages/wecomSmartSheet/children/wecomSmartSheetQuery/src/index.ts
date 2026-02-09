import { z } from 'zod';
import axios from 'axios';

export const InputType = z.object({
  accessToken: z.string(),
  docid: z.string(),
  sheets: z.string().optional().nullable(), // JSON string array of sheet IDs or names
  limit_per_sheet: z.number().optional().default(1000)
});

export const OutputType = z.object({
  result: z.record(z.any()),
  total_records: z.number(),
  sheet_count: z.number()
});

const WECOM_API_BASE = 'https://qyapi.weixin.qq.com/cgi-bin';

// 接口101182: 获取子表列表
export async function getSheetList(accessToken: string, docid: string) {
  const client = axios.create({
    baseURL: WECOM_API_BASE,
    params: { access_token: accessToken }
  });

  const response = await client.post('/wedoc/smartsheet/get_sheet', {
    docid,
    need_all_type_sheet: true // 获取所有类型的子表
  });

  return response.data.sheet_list || [];
}

// 接口101185: 获取记录列表（带分页处理）
export async function getRecordsWithPagination(
  accessToken: string,
  docid: string,
  sheetId: string,
  limit: number = 1000
) {
  const client = axios.create({
    baseURL: WECOM_API_BASE,
    params: { access_token: accessToken }
  });

  let allRecords: any[] = [];
  let cursor = '';
  let hasMore = true;

  while (hasMore && allRecords.length < limit) {
    const response = await client.post('/wedoc/smartsheet/get_records', {
      docid,
      sheet_id: sheetId,
      limit: Math.min(100, limit - allRecords.length), // 每次最多100条
      cursor,
      key_type: 'CELL_VALUE_KEY_TYPE_FIELD_TITLE'
    });

    const records = response.data.records || [];
    allRecords = [...allRecords, ...records];

    hasMore = response.data.has_more === 1;
    cursor = response.data.next_cursor || '';

    // 如果已经达到限制或者没有更多数据，退出循环
    if (allRecords.length >= limit || !hasMore) {
      break;
    }
  }

  return allRecords.slice(0, limit); // 确保不超过限制
}

// 检查是否匹配过滤条件
function matchesFilter(sheet: any, filterSheets: string[] = []) {
  if (!filterSheets || filterSheets.length === 0) {
    return true; // 没有过滤条件，查询所有子表
  }

  return filterSheets.some(
    (filter) =>
      sheet.sheet_id === filter ||
      sheet.title === filter ||
      (sheet.title && sheet.title.includes(filter))
  );
}

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { accessToken, docid, sheets, limit_per_sheet } = props;

  try {
    // 解析用户输入的sheet过滤条件
    let filterSheets: string[] = [];
    if (sheets && sheets.trim()) {
      try {
        filterSheets = JSON.parse(sheets);
        if (!Array.isArray(filterSheets)) {
          filterSheets = [];
        }
      } catch (error) {
        console.warn('Failed to parse sheets filter, using all sheets:', error);
        filterSheets = [];
      }
    }

    // 1. 获取所有子表列表
    const allSheets = await getSheetList(accessToken, docid);

    // 2. 根据过滤条件筛选需要查询的子表
    const sheetsToQuery = allSheets.filter((sheet: any) => matchesFilter(sheet, filterSheets));

    console.log(`查询 ${sheetsToQuery.length} 个子表，过滤条件:`, filterSheets);

    // 3. 并行查询每个子表的记录
    const queryPromises = sheetsToQuery.map(async (sheet: any) => {
      try {
        const records = await getRecordsWithPagination(
          accessToken,
          docid,
          sheet.sheet_id,
          limit_per_sheet
        );

        return {
          sheet_id: sheet.sheet_id,
          sheet_title: sheet.title,
          records,
          record_count: records.length
        };
      } catch (error) {
        console.error(`查询子表 ${sheet.sheet_id} (${sheet.title}) 失败:`, error);
        return {
          sheet_id: sheet.sheet_id,
          sheet_title: sheet.title,
          records: [],
          record_count: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const sheetResults = await Promise.all(queryPromises);

    // 4. 汇总结果
    const totalRecords = sheetResults.reduce((sum, sheet) => sum + sheet.record_count, 0);

    const result = {
      docid,
      total_sheets: sheetsToQuery.length,
      total_records: totalRecords,
      sheets: sheetResults.reduce(
        (acc, sheet) => {
          acc[sheet.sheet_id] = {
            title: sheet.sheet_title,
            records: sheet.records,
            record_count: sheet.record_count
          };
          return acc;
        },
        {} as Record<string, any>
      )
    };

    return {
      result,
      total_records: totalRecords,
      sheet_count: sheetsToQuery.length
    };
  } catch (error) {
    console.error('智能表查询失败:', error);
    throw new Error(`智能表查询失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
