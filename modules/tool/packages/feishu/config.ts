import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  isWorkerRun: false,
  tags: [ToolTagEnum.enum.communication],
  name: {
    'zh-CN': '飞书 webhook',
    en: 'Feishu Webhook'
  },
  description: {
    'zh-CN': '向飞书机器人发起 webhook 请求。',
    en: 'Send webhook request to Feishu bot.'
  },
  icon: 'core/app/templates/plugin-feishu',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'content',
          label: 'content',
          description: '需要发送的消息',
          required: true,
          toolDescription: '需要发送的消息'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'hook_url',
          label: 'hook_url',
          description: '飞书机器人地址',
          required: true
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'result',
          label: 'result'
        }
      ]
    }
  ]
});
