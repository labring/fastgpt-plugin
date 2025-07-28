import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.tools,
  name: {
    'zh-CN': 'KnowS 证据分析',
    en: 'KnowS Evidence Analysis'
  },
  description: {
    'zh-CN': '对检索到的证据进行深度分析',
    en: 'Conduct in-depth analysis of retrieved evidence'
  },
  icon: 'core/app/toolCall',
  versionList: [
    {
      value: '1.0.0',
      description: 'Default version',
      inputs: [
        {
          key: 'analysisType',
          label: '分析类型',
          description: '证据分析的类型',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '证据分析的类型'
        },
        {
          key: 'evidenceId',
          label: '证据ID',
          description: '需要分析的证据ID',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '需要分析的证据ID'
        },
        {
          key: 'questionId',
          label: '问题ID',
          description: '相关问题的ID',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '相关问题的ID'
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
          key: 'analysisType',
          label: '分析类型',
          description: '执行的分析类型',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'summary',
          label: '分析摘要',
          description: '证据分析的摘要结果',
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
