import { z } from 'zod';

const xiaoyibaoURL = 'https://admin.xiaoyibao.com.cn';

export const InputType = z.object({
  key: z.string(),
  query: z.string() // 从工作流全局变量获取患者咨询问题
});

export const OutputType = z.object({
  result: z.string()
});

export async function tool(props: z.infer<typeof InputType>): Promise<z.infer<typeof OutputType>> {
  const { key, query } = props;

  try {
    // 构建API请求URL - 使用正确的小X宝API端点
    const url = new URL(`${xiaoyibaoURL}/api/v1/chat/completions`);

    // 发送POST请求到小X宝API
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId: 'fastgpt_' + Date.now(),
        stream: false,
        detail: false,
        messages: [
          {
            role: 'user',
            content: query
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 根据实际API返回格式处理数据
    let result;
    if (data.choices && data.choices[0] && data.choices[0].message) {
      result = data.choices[0].message.content;
    } else if (data.answer) {
      result = data.answer;
    } else if (data.result) {
      result = data.result;
    } else if (data.response) {
      result = data.response;
    } else {
      result = JSON.stringify(data);
    }

    return {
      result: typeof result === 'string' ? result : JSON.stringify(result)
    };
  } catch (error) {
    // 错误处理
    console.error('小X宝API调用错误:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return {
      result: `小X宝癌症患者助手调用失败: ${errorMessage}。如有紧急情况，请立即就医咨询专业医生。`
    };
  }
}
