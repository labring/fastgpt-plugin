import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  name: {
    'zh-CN': '融合搜索',
    en: 'SearchInfinity'
  },
  icon: 'core/workflow/template/searchInfinity',
  type: ToolTypeEnum.search,
  description: {
    'zh-CN': '使用融合信息搜索引擎进行网络搜索。',
    en: 'Use SearchInfinity search engine for web search.'
  },

  courseUrl: 'https://open.feedcoopapi.com/',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'query',
          label: '搜索查询词',
          description: '搜索查询词',
          toolDescription: '搜索查询词',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'count',
          label: '结果数量',
          description: '返回结果的条数。可填范围：1-50，默认为10',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          min: 1,
          max: 50
        },
        {
          key: 'sites',
          label: '包含网站',
          description: '指定搜索的site范围。多个域名使用|分隔，最多5个。例如：qq.com|m.163.com',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'time_range',
          label: '时间范围',
          description:
            '搜索指定时间范围内的网页。支持：OneDay, OneWeek, OneMonth, OneYear, 或自定义格式YYYY-MM-DD..YYYY-MM-DD',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'result',
          label: '搜索结果',
          description: '搜索返回的结果列表'
        },
        {
          type: FlowNodeOutputTypeEnum.error,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'error',
          label: '错误信息'
        }
      ]
    }
  ],
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'API密钥',
      description: 'SearchInfinity API密钥，可在 https://open.feedcoopapi.com/ 获取',
      required: false,
      inputType: 'secret'
    },
    {
      key: 'volcengineAccessKey',
      label: '火山引擎Access Key',
      description: '火山引擎Access Key，用于火山引擎认证方式',
      required: false,
      inputType: 'secret'
    },
    {
      key: 'volcengineSecretKey',
      label: '火山引擎Secret Key',
      description: '火山引擎Secret Key，用于火山引擎认证方式',
      required: false,
      inputType: 'secret'
    }
  ]
});
