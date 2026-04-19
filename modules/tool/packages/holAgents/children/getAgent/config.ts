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
    'zh-CN': '获取代理详情',
    en: 'Get Agent Details'
  },
  description: {
    'zh-CN': '获取指定代理的详细信息，包括能力、协议、端点等',
    en: 'Get detailed information about a specific agent, including capabilities, protocols, endpoints'
  },
  versionList: [
    {
      value: '1.0.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'uaid',
          label: {
            'zh-CN': '代理 UAID',
            en: 'Agent UAID'
          },
          description: {
            'zh-CN': '通用代理 ID，例如：uaid:aid:xxx',
            en: 'Universal Agent ID, e.g., uaid:aid:xxx'
          },
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The Universal Agent ID of the agent to retrieve'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'agent',
          label: {
            'zh-CN': '代理信息',
            en: 'Agent Info'
          },
          description: {
            'zh-CN': '代理的详细信息',
            en: 'Detailed agent information'
          }
        }
      ]
    }
  ]
});
