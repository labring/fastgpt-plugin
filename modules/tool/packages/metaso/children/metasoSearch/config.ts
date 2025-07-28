import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  WorkflowIOValueTypeEnum,
  SystemInputKeyEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.search,
  name: {
    'zh-CN': 'Metaso 搜索',
    en: 'Metaso Search'
  },
  description: {
    'zh-CN': '基于 Metaso API 的智能搜索工具，支持多种搜索范围和结果摘要',
    en: 'Intelligent search tool powered by Metaso API with multiple search scopes and result summaries'
  },
  courseUrl: 'https://metaso.cn',
  author: 'FastGPT',
  versionList: [
    {
      value: '1.0.0',
      description: 'Initial version with full search functionality',
      inputs: [
        {
          key: 'query',
          label: '搜索关键词',
          description: '要搜索的关键词或查询语句',
          toolDescription: '搜索关键词',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input]
        },
        {
          key: 'scope',
          label: '搜索范围',
          description: '指定搜索的范围类型',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          defaultValue: 'all',
          list: [
            { label: '全部', value: 'all' },
            { label: '网页', value: 'web' },
            { label: '学术', value: 'academic' },
            { label: '新闻', value: 'news' },
            { label: '图片', value: 'images' },
            { label: '视频', value: 'videos' }
          ],
          toolDescription: '搜索范围类型'
        },
        {
          key: 'includeSummary',
          label: '包含摘要',
          description: '是否在搜索结果中包含智能摘要',
          required: false,
          valueType: WorkflowIOValueTypeEnum.boolean,
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          defaultValue: true,
          toolDescription: '是否包含搜索结果摘要'
        },
        {
          key: 'size',
          label: '结果数量',
          description: '返回的搜索结果数量（1-20）',
          required: false,
          valueType: WorkflowIOValueTypeEnum.number,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          defaultValue: 10,
          min: 1,
          max: 20,
          toolDescription: '搜索结果数量'
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '搜索结果',
          description: `Metaso 搜索返回的结构化数据，包含搜索结果和可选的摘要信息`,
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});
