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
    'zh-CN': '查找相似代理',
    en: 'Find Similar Agents'
  },
  description: {
    'zh-CN': '查找与指定代理相似的其他代理',
    en: 'Find agents similar to a given agent based on capabilities'
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
            'zh-CN': '要查找相似代理的目标代理 ID',
            en: 'The agent UAID to find similar agents for'
          },
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The Universal Agent ID to find similar agents for'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'similarAgents',
          label: {
            'zh-CN': '相似代理列表',
            en: 'Similar Agents'
          },
          description: {
            'zh-CN': '相似代理列表',
            en: 'List of similar agents'
          }
        }
      ]
    }
  ]
});
