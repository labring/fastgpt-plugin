import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  isWorkerRun: false,
  tags: [ToolTagEnum.enum.search],
  name: {
    'zh-CN': '秘塔搜索',
    en: 'Metaso Search'
  },
  description: {
    'zh-CN': '基于秘塔API的智能搜索工具，支持多种搜索范围和结果摘要',
    en: 'Intelligent search tool powered by Metaso API with multiple search scopes and result summaries'
  },
  toolDescription: '使用秘塔 API 进行网络搜索。',
  courseUrl: 'https://metaso.cn',
  author: 'FastGPT',
  versionList: [
    {
      value: '0.1.0',
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
            { label: '网页', value: 'webpage' },
            { label: '文库', value: 'document' },
            { label: '学术', value: 'scholar' },
            { label: '图片', value: 'image' },
            { label: '视频', value: 'video' },
            { label: '播客', value: 'podcast' }
          ]
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
          max: 20
        },
        {
          key: 'includeSummary',
          label: '包含摘要',
          description: '是否在搜索结果中包含智能摘要',
          required: false,
          valueType: WorkflowIOValueTypeEnum.boolean,
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          defaultValue: true
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '搜索结果',
          valueType: WorkflowIOValueTypeEnum.arrayObject
        }
      ]
    }
  ]
});
