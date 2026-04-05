import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  tags: [ToolTagEnum.enum.search],
  name: {
    'zh-CN': '搜索代理',
    en: 'Search Agents'
  },
  description: {
    'zh-CN': '在 HOL 注册表中搜索 AI 代理，按能力、技能或描述查找',
    en: 'Search for AI agents in the HOL registry by capability, skill, or description'
  },
  versionList: [
    {
      value: '1.0.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'query',
          label: {
            'zh-CN': '搜索查询',
            en: 'Search Query'
          },
          description: {
            'zh-CN': '搜索关键词，例如："trading", "image generation"',
            en: 'Search query, e.g., "trading", "image generation"'
          },
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Search query to find agents by capability or skill'
        },
        {
          key: 'limit',
          label: {
            'zh-CN': '最大结果数',
            en: 'Max Results'
          },
          description: {
            'zh-CN': '返回的最大代理数量 (1-50)',
            en: 'Maximum number of agents to return (1-50)'
          },
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 10,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference]
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'agents',
          label: {
            'zh-CN': '代理列表',
            en: 'Agents List'
          },
          description: {
            'zh-CN': '搜索到的代理列表，包含 UAID、名称、描述、信任分数等',
            en: 'List of found agents with UAID, name, description, trust score, etc.'
          }
        },
        {
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'total',
          label: {
            'zh-CN': '总数',
            en: 'Total'
          },
          description: {
            'zh-CN': '匹配查询的代理总数',
            en: 'Total number of agents matching the query'
          }
        }
      ]
    }
  ]
});
