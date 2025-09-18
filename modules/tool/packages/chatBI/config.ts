import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  name: {
    'zh-CN': 'chatBI',
    en: 'Template tool'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': 'chatBI 工具',
    en: 'chatBI Tool'
  },
  toolDescription:
    'send user natural language instructions to ChatBI application for execution, sse stream interface returns results',
  secretInputConfig: [
    {
      key: 'chatBIUrl',
      label: 'chatBI 服务根地址',
      description: '根地址，例如：http://example.com',
      required: true,
      inputType: 'secret'
    },
    {
      key: 'sysAccessKey',
      label: 'chatBI 系统AccessKey',
      description: '系统AccessKey',
      required: true,
      inputType: 'secret'
    },
    {
      key: 'corpId',
      label: 'chatBI 企业ID',
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
          label: 'chatBI 应用ID',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true
        },
        {
          key: 'appAccessKey',
          label: 'chatBI 应用AccessKey',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true
        },
        {
          key: 'sessionId',
          label: '会话id',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.arrayAny,
          key: 'displayContentList',
          label: '展示内容列表',
          description: 'ChatBI返回的核心展示内容，包含文本、图表、表格等多种类型'
        }
      ]
    }
  ]
});
