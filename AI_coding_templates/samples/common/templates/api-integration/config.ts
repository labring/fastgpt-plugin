import { defineTool, ToolTypeEnum } from '../../types/tool';
import { z } from 'zod';

// 输入参数验证模式
export const InputSchema = z.object({
  // 在这里定义具体的输入参数
});

export const OutputSchema = z.object({
  // 在这里定义具体的输出参数
});

export default defineTool({
  id: 'api-integration-template',
  name: 'API集成模板',
  type: ToolTypeEnum.API_INTEGRATION,
  description: '这是一个API集成插件模板，用于快速创建调用外部API的工具插件',
  avatar: '🔗',
  author: 'FastGPT',
  version: '1.0.0',
  documentUrl: 'https://example.com/api-docs',
  updateTime: '2024-01-01',
  versionList: [
    {
      version: '1.0.0',
      updateTime: '2024-01-01',
      description: '初始版本',
      inputs: [
        {
          key: 'apiKey',
          label: 'API密钥',
          description: '可以在 https://example.com/api-keys 获取',
          type: 'string',
          required: true
        },
        {
          key: 'baseUrl',
          label: 'API基础URL',
          description: 'API服务的基础URL，默认为官方地址',
          type: 'string',
          defaultValue: 'https://api.example.com',
          required: false
        },
        {
          key: 'query',
          label: '查询内容',
          description: '要查询或处理的内容',
          type: 'string',
          required: true
        },
        {
          key: 'limit',
          label: '结果数量',
          description: '返回结果的最大数量',
          type: 'number',
          defaultValue: 10,
          required: false
        },
        {
          key: 'options',
          label: '高级选项',
          description: 'JSON格式的高级配置选项',
          type: 'textarea',
          required: false
        }
      ],
      outputs: [
        {
          key: 'result',
          label: 'API结果',
          description: 'API调用返回的结果数据',
          type: 'string'
        },
        {
          key: 'metadata',
          label: '响应元数据',
          description: 'API响应的元数据信息',
          type: 'object'
        },
        {
          key: 'rawResponse',
          label: '原始响应',
          description: 'API的原始响应数据（调试用）',
          type: 'object'
        }
      ]
    }
  ],
  handler: './src/index'
});