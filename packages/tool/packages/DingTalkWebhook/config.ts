import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  toolId: 'community-DingTalkWebhook',
  versionList: [
    {
      version: '0.1.0',
      description: 'Default version'
    }
  ],
  type: 'communication',
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
  inputs: [
    {
      valueType: WorkflowIOValueTypeEnum.string,
      key: '钉钉机器人地址',
      label: '钉钉机器人地址',
      description: '',
      defaultValue: '',
      renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
      required: true,
      value: ''
    },
    {
      renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
      selectedTypeIndex: 0,
      valueType: WorkflowIOValueTypeEnum.string,
      key: '加签值',
      label: '加签值',
      description: '钉钉机器人加签值',
      defaultValue: '',
      list: [
        {
          label: '',
          value: ''
        }
      ],
      maxFiles: 5,
      canSelectFile: true,
      canSelectImg: true,
      required: true
    },
    {
      renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
      selectedTypeIndex: 0,
      valueType: WorkflowIOValueTypeEnum.string,
      key: '发送的消息',
      label: '发送的消息',
      description: '发送的消息',
      defaultValue: '',
      list: [
        {
          label: '',
          value: ''
        }
      ],
      maxFiles: 5,
      canSelectFile: true,
      canSelectImg: true,
      required: true,
      toolDescription: '发送的消息'
    }
  ],
  outputs: []
});
