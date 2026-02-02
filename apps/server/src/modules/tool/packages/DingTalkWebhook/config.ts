import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  tags: [ToolTagEnum.enum.communication],
  name: {
    'zh-CN': '钉钉 webhook',
    en: 'DingTalk Webhook'
  },
  description: {
    'zh-CN': '向钉钉机器人发起 webhook 请求。',
    en: 'Send a webhook request to DingTalk.'
  },
  icon: 'plugins/dingding',
  courseUrl: 'https://open.dingtalk.com/document/robots/custom-robot-access',
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'webhookUrl',
          label: '钉钉机器人地址',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          required: true
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'secret',
          label: '加签值',
          description: '钉钉机器人加签值',
          required: true
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'message',

          label: '发送的消息',
          description: '发送的消息',
          required: true,
          toolDescription: '发送的消息'
        }
      ],
      outputs: []
    }
  ]
});
