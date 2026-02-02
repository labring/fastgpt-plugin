import { z } from 'zod';
import { handleGetAuthToken, handleBatchGetDraft } from '../../../lib/handler';

export const InputType = z
  .object({
    // 认证参数（二选一）
    accessToken: z.string().optional(),
    appId: z.string().optional(),
    secret: z.string().optional(),

    // 查询参数
    offset: z.number().int().min(0).optional().default(0),
    count: z.number().int().min(1).max(20).optional().default(20),
    noContent: z.number().int().min(0).max(1).optional()
  })
  .refine(
    (data) => {
      // 验证认证参数：要么提供 accessToken，要么同时提供 appId 和 secret
      return data.accessToken || (data.appId && data.secret);
    },
    {
      message: '必须提供 accessToken，或者同时提供 appId 和 secret',
      path: ['认证参数']
    }
  );

export const OutputType = z.object({
  total_count: z.number().optional(),
  item_count: z.number().optional(),
  item: z.array(z.any()).optional(),
  error_message: z.string().optional()
});

export async function tool({
  accessToken,
  appId,
  secret,
  offset = 0,
  count = 20,
  noContent
}: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  // 1. 获取 access_token
  let token = accessToken;
  if (!token) {
    const result = await handleGetAuthToken({
      grant_type: 'client_credential',
      appid: appId!,
      secret: secret!
    });

    if ('access_token' in result && result.access_token) {
      token = result.access_token;
    } else {
      const errorMsg = (result as any).errmsg || '未知错误';
      return {
        error_message: `获取 access_token 失败: ${errorMsg} (错误码: ${(result as any).errcode})`
      };
    }
  }

  // 2. 获取草稿列表
  const params: {
    access_token: string;
    offset: number;
    count: number;
    no_content?: number;
  } = {
    access_token: token,
    offset,
    count
  };

  if (noContent !== undefined) {
    params.no_content = noContent;
  }

  const result = await handleBatchGetDraft(params);

  return {
    total_count: result.total_count,
    item_count: result.item_count,
    item: result.item
  };
}
