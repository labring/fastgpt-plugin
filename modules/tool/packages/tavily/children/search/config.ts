import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': 'AI 搜索',
    en: 'AI Search'
  },
  description: {
    'zh-CN': '使用 Tavily 执行 AI 驱动的智能网络搜索',
    en: 'Perform AI-powered intelligent web search using Tavily'
  },
  toolDescription: 'Search the web with AI-powered relevance ranking and answer generation.',

  versionList: [
    {
      value: '0.1.1',
      description: '支持高级配置',
      inputs: [
        {
          key: 'query',
          label: '搜索内容',
          description: '要搜索的内容',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          toolDescription: 'The search query string'
        },
        {
          key: 'searchDepth',
          label: '搜索深度',
          description: '基础搜索 (1 credit) | 高级搜索 (2 credits)',
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'basic',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          list: [
            { label: '基础', value: 'basic' },
            { label: '高级', value: 'advanced' }
          ]
        },
        {
          key: 'maxResults',
          label: '最大结果数',
          description: '返回的最大搜索结果数量 (1-20)',
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 10,
          min: 1,
          max: 20,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput]
        },
        {
          key: 'includeAnswer',
          label: '生成 AI 摘要',
          description: '是否生成 AI 摘要答案',
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false,
          renderTypeList: [FlowNodeInputTypeEnum.switch]
        },
        {
          key: 'searchTopic',
          label: '搜索主题',
          description: '搜索主题',
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'general',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          list: [
            { label: '通用', value: 'general' },
            { label: '新闻', value: 'news' },
            { label: '经济', value: 'finance' }
          ]
        },
        {
          key: 'includeRawContent',
          label: '包含原始内容',
          description: '是否包含原始内容',
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: false,
          renderTypeList: [FlowNodeInputTypeEnum.select],
          list: [
            { label: '不包含', value: 'none' },
            { label: 'Text 格式', value: 'text' },
            { label: 'Markdown 格式', value: 'markdown' }
          ]
        },
        {
          key: 'timeRange',
          label: '时间范围',
          description: '搜索时间范围',
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'none',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          list: [
            { label: '不限', value: 'none' },
            { label: '最近一天', value: 'day' },
            { label: '最近一周', value: 'week' },
            { label: '最近一月', value: 'month' },
            { label: '最近一年', value: 'year' }
          ]
        },
        {
          key: 'includeImages',
          label: '包含图片',
          description: '是否包含图片',
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false,
          renderTypeList: [FlowNodeInputTypeEnum.switch]
        },
        {
          key: 'includeImageDescriptions',
          label: '包含图片描述',
          description: '是否包含图片描述',
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false,
          renderTypeList: [FlowNodeInputTypeEnum.switch]
        },
        {
          key: 'includeFavicon',
          label: '包含 favicon',
          description: '是否包含 favicon',
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false,
          renderTypeList: [FlowNodeInputTypeEnum.switch]
        },
        {
          key: 'includeDomains',
          label: '包含的域名',
          description: '搜索结果中包含的域名',
          valueType: WorkflowIOValueTypeEnum.arrayString,
          defaultValue: [],
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference]
        },
        {
          key: 'excludeDomains',
          label: '排除的域名',
          description: '搜索结果中排除的域名',
          valueType: WorkflowIOValueTypeEnum.arrayString,
          defaultValue: [],
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference]
        }
      ],
      outputs: [
        {
          key: 'answer',
          label: 'AI 摘要',
          description: 'AI 生成的答案摘要',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'results',
          label: '搜索结果',
          description: '结构化的搜索结果数组',
          valueType: WorkflowIOValueTypeEnum.arrayObject
        }
      ]
    },
    {
      value: '0.1.0',
      description: 'Initial version with basic and advanced search',
      inputs: [
        {
          key: 'query',
          label: '搜索内容',
          description: '要搜索的内容',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          toolDescription: 'The search query string'
        },
        {
          key: 'searchDepth',
          label: '搜索深度',
          description: '基础搜索 (1 credit) | 高级搜索 (2 credits)',
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'basic',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          list: [
            { label: '基础', value: 'basic' },
            { label: '高级', value: 'advanced' }
          ]
        },
        {
          key: 'maxResults',
          label: '最大结果数',
          description: '返回的最大搜索结果数量 (1-20)',
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 10,
          min: 1,
          max: 20,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput]
        },
        {
          key: 'includeAnswer',
          label: '生成 AI 摘要',
          description: '是否生成 AI 摘要答案',
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false,
          renderTypeList: [FlowNodeInputTypeEnum.switch]
        }
      ],
      outputs: [
        {
          key: 'answer',
          label: 'AI 摘要',
          description: 'AI 生成的答案摘要',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'results',
          label: '搜索结果',
          description: '结构化的搜索结果数组',
          valueType: WorkflowIOValueTypeEnum.arrayObject
        }
      ]
    }
  ]
});
