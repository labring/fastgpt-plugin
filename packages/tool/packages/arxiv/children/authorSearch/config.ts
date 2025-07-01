import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.search,
  name: {
    'zh-CN': 'ArXiv 作者论文检索',
    en: 'ArXiv Author Paper Search'
  },
  description: {
    'zh-CN': '通过作者名搜索 ArXiv 论文，支持按时间排序和结果数量限制',
    en: 'Search ArXiv papers by author, supporting sorting by date and limiting result count'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'author',
          label: '作者名',
          description: '要搜索的论文作者名',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: '要搜索的论文作者名，例如: "Yann LeCun", "Smith, J" 等'
        },
        {
          key: 'maxResults',
          label: '最大结果数',
          description: '返回的最大论文数量 (1-50)',
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 5,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference]
        },
        {
          key: 'sortBy',
          label: '排序方式',
          description: '结果排序方式',
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'relevance',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          list: [
            {
              label: '相关度',
              value: 'relevance'
            },
            {
              label: '最后更新时间',
              value: 'lastUpdatedDate'
            },
            {
              label: '提交时间',
              value: 'submittedDate'
            }
          ]
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'papers',
          label: '论文列表',
          description: '搜索到的论文列表，包含标题、作者、摘要、链接等信息'
        }
      ]
    }
  ]
});
