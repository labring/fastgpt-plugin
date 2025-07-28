import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.tools,
  name: {
    'zh-CN': 'KnowS 内容管理',
    en: 'KnowS Content Management'
  },
  description: {
    'zh-CN': '管理知识库内容',
    en: 'Manage knowledge base content'
  },
  icon: 'core/app/toolCall',
  versionList: [
    {
      value: '1.0.0',
      description: 'Default version',
      inputs: [
        {
          key: 'action',
          label: '操作类型',
          description: '要执行的管理操作',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '要执行的管理操作'
        },
        {
          key: 'contentId',
          label: '内容ID',
          description: '要操作的内容ID',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '要操作的内容ID'
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
          key: 'result',
          label: '操作结果',
          description: '管理操作的结果',
          valueType: WorkflowIOValueTypeEnum.object
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
