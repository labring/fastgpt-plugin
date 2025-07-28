import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.search,
  name: {
    'zh-CN': 'KnowS 智能检索',
    en: 'KnowS Smart Search'
  },
  description: {
    'zh-CN': '基于自然语言进行医学文献检索',
    en: 'Medical literature search based on natural language'
  },
  icon: 'core/app/toolCall',
  versionList: [
    {
      value: '1.0.0',
      description: 'Default version',
      inputs: [
        {
          key: 'query',
          label: '检索问题',
          description: '自然语言检索问题',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.textarea],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '自然语言检索问题'
        },
        {
          key: 'dataScope',
          label: '数据范围',
          description: '选择要检索的数据类型',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.multipleSelect],
          valueType: WorkflowIOValueTypeEnum.arrayString,
          toolDescription: '选择要检索的数据类型',
          list: [
            { label: '英文文献', value: 'PAPER' },
            { label: '中文文献', value: 'PAPER_CN' },
            { label: '指南文档', value: 'GUIDE' },
            { label: '会议文献', value: 'MEETING' }
          ],
          defaultValue: ['PAPER', 'PAPER_CN', 'GUIDE', 'MEETING'] // 默认选择全部
        },
        {
          key: 'maxResults',
          label: '最大结果数',
          description: '返回的最大结果数量',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput],
          valueType: WorkflowIOValueTypeEnum.number,
          toolDescription: '返回的最大结果数量'
        }
      ],
      outputs: [
        {
          key: 'success',
          label: '执行状态',
          description: '检索是否成功',
          valueType: WorkflowIOValueTypeEnum.boolean
        },
        {
          key: 'questionId',
          label: '问题ID',
          description: '生成的问题唯一标识符',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'results',
          label: '检索结果',
          description: '检索到的文献结果列表',
          valueType: WorkflowIOValueTypeEnum.arrayObject
        },
        {
          key: 'totalCount',
          label: '结果总数',
          description: '检索到的结果总数',
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'message',
          label: '状态信息',
          description: '检索结果信息',
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});
