import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  tags: [ToolTagEnum.enum.communication],
  name: {
    'zh-CN': '企业微信 webhook',
    en: 'WeWork Webhook'
  },
  description: {
    'zh-CN': '向企业微信机器人发起 webhook 请求。只能内部群使用。',
    en: 'Send webhook requests to WeWork robots. Only internal groups can use this tool.'
  },
  courseUrl: 'https://developer.work.weixin.qq.com/document/path/91770',
  icon: 'plugins/qiwei',
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          key: 'webhookUrl',
          label: '企微机器人地址',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'message',
          label: '发送的消息',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        }
      ],
      outputs: []
    }
  ]
});
