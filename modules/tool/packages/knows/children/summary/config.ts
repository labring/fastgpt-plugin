import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.tools,
  name: {
    'zh-CN': 'KnowS 总结生成',
    en: 'KnowS Summary Generation'
  },
  description: {
    'zh-CN': '基于问题ID生成智能总结',
    en: 'Generate intelligent summaries based on question ID'
  },
  icon: 'core/app/toolCall',
  versionList: [
    {
      value: '1.0.0',
      description: 'Default version',
      inputs: [
        {
          key: 'questionId',
          label: '问题ID',
          description: '需要生成总结的问题ID',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '需要生成总结的问题ID（可从检索工具获取）'
        },
        {
          key: 'answerType',
          label: '答案类型',
          description: '选择总结的答案类型',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '选择总结的答案类型',
          list: [
            { label: '临床', value: 'CLINICAL' },
            { label: '研究', value: 'RESEARCH' },
            { label: '科普', value: 'POPULAR_SCIENCE' }
          ],
          defaultValue: 'CLINICAL' // 默认选择临床类型
        }
      ],
      outputs: [
        {
          key: 'content',
          label: '总结内容',
          description: '生成的总结内容',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'success',
          label: '执行状态',
          description: '操作是否成功',
          valueType: WorkflowIOValueTypeEnum.boolean
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
