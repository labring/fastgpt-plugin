import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.tools,
  name: {
    'zh-CN': 'KnowS 文献详情',
    en: 'KnowS Literature Details'
  },
  description: {
    'zh-CN': '获取文献的详细信息',
    en: 'Get detailed information of literature'
  },
  icon: 'core/app/toolCall',
  versionList: [
    {
      value: '1.0.0',
      description: 'Default version',
      inputs: [
        {
          key: 'evidenceId',
          label: '证据ID',
          description: '文献证据的唯一标识符',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '文献证据的唯一标识符'
        },
        {
          key: 'detailType',
          label: '详情类型',
          description: '获取的详情类型',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '获取的详情类型'
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
          key: 'detailType',
          label: '详情类型',
          description: '返回的详情类型',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'evidenceId',
          label: '证据ID',
          description: '文献证据ID',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'title',
          label: '文献标题',
          description: '文献的标题',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'authors',
          label: '作者信息',
          description: '文献作者列表',
          valueType: WorkflowIOValueTypeEnum.string
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