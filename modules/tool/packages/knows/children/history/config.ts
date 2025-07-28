import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';
import { defineInputConfig } from '@tool/utils/tool';

export default defineTool({
  type: ToolTypeEnum.tools,
  name: {
    'zh-CN': 'KnowS 历史记录',
    en: 'KnowS History Records'
  },
  description: {
    'zh-CN': '管理检索历史记录',
    en: 'Manage search history records'
  },
  icon: 'core/app/toolCall',
  versionList: [
    {
      value: '1.0.0',
      description: 'Default version',
      inputs: [
        defineInputConfig([
          {
            key: 'apiKey',
            label: 'KnowS API Key',
            description: 'KnowS 平台的 API 密钥',
            required: true,
            inputType: 'secret'
          }
        ]),
        {
          key: 'action',
          label: '操作类型',
          description: '要执行的历史记录操作',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '要执行的历史记录操作'
        },
        {
          key: 'recordId',
          label: '记录ID',
          description: '历史记录的ID',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '历史记录的ID'
        }
      ],
      outputs: [
        {
          key: 'success',
          label: '执行状态',
          description: '操作是否成功',
          valueType: WorkflowIOValueTypeEnum.boolean
        },
        {
          key: 'action',
          label: '执行操作',
          description: '实际执行的操作类型',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'records',
          label: '历史记录',
          description: '返回的历史记录列表',
          valueType: WorkflowIOValueTypeEnum.arrayObject
        },
        {
          key: 'message',
          label: '状态信息',
          description: '操作结果信息',
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});
