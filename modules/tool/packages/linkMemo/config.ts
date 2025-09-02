import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  name: {
    'zh-CN': '钉钉 Memo',
    en: 'Template tool'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '钉钉Memo工具',
    en: 'DingTalk Memo Tool'
  },
  secretInputConfig: [
    {
      key: 'dingdingUrl',
      label: '钉钉Memo服务根地址',
      description: '根地址，例如：http://example.com',
      required: true,
      inputType: 'secret'
    },
    {
      key: 'sysAccessKey',
      label: '钉钉Memo系统AccessKey',
      description: '系统AccessKey',
      required: true,
      inputType: 'secret'
    },
    {
      key: 'corpId',
      label: '钉钉Memo企业ID',
      description: '企业ID',
      required: true,
      inputType: 'secret'
    }
  ],
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'query',
          label: '用户提问内容',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true
        },
        {
          key: 'appId',
          label: '钉钉Memo应用ID',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true
        },
        {
          key: 'appAccessKey',
          label: '钉钉Memo应用AccessKey',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true
        },
        {
          key: 'iscontact',
          label: '是否使用职级',
          renderTypeList: [FlowNodeInputTypeEnum.switch, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.boolean,
          required: false
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'content',
          label: '答案内容',
          description: '工具返回的完整答案'
        },
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'citeLinks',
          label: '参考文档',
          description: '相关的参考文档链接列表'
        }
      ]
    }
  ]
});
