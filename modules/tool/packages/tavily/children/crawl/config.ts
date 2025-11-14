import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '网站爬取',
    en: 'Web Crawler'
  },
  description: {
    'zh-CN': '使用基于图的并行网站爬取功能，深度探索网站内容',
    en: 'Graph-based parallel website crawling with intelligent discovery'
  },
  toolDescription:
    'Crawl hundreds of website paths in parallel with built-in extraction and intelligent discovery. ' +
    'Perfect for comprehensive site exploration, documentation scraping, and content aggregation.',

  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version with comprehensive crawling capabilities',
      inputs: [
        {
          key: 'url',
          label: '起始 URL',
          description: '开始爬取的根 URL',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          toolDescription: 'The root URL to begin the crawl'
        },
        {
          key: 'instructions',
          label: '爬取指令',
          description: '自然语言指令，指导爬虫查找特定内容（使用会增加成本）',
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Natural language instructions for the crawler'
        },
        {
          key: 'maxDepth',
          label: '最大深度',
          description: '爬取的最大深度（1-5）',
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 1,
          min: 1,
          max: 5,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput],
          toolDescription: 'Max depth of the crawl'
        },
        {
          key: 'maxBreadth',
          label: '最大广度',
          description: '每层跟随的最大链接数',
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 20,
          min: 1,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput],
          toolDescription: 'Max number of links to follow per level'
        },
        {
          key: 'limit',
          label: '总限制',
          description: '处理的总链接数上限',
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 50,
          min: 1,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput],
          toolDescription: 'Total number of links to process'
        },
        {
          key: 'selectPaths',
          label: '包含路径',
          description: '正则表达式模式，选择特定路径（每行一个）',
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Regex patterns to select specific path patterns'
        },
        {
          key: 'excludePaths',
          label: '排除路径',
          description: '正则表达式模式，排除特定路径（每行一个）',
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Regex patterns to exclude specific path patterns'
        },
        {
          key: 'allowExternal',
          label: '允许外部链接',
          description: '是否在结果中包含外部域链接',
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: true,
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          toolDescription: 'Whether to include external domain links'
        },
        {
          key: 'includeImages',
          label: '包含图片',
          description: '是否在爬取结果中包含图片',
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false,
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          toolDescription: 'Whether to include images in the crawl results'
        },
        {
          key: 'extractDepth',
          label: '提取深度',
          description: '基础提取（1 credit/5 pages）或高级提取（2 credits/5 pages）',
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'basic',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          list: [
            { label: '基础', value: 'basic' },
            { label: '高级', value: 'advanced' }
          ]
        },
        {
          key: 'format',
          label: '输出格式',
          description: '内容输出格式',
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'markdown',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          list: [
            { label: 'Markdown', value: 'markdown' },
            { label: 'Text', value: 'text' }
          ]
        },
        {
          key: 'includeFavicon',
          label: '包含图标',
          description: '是否为每个结果包含 favicon URL',
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false,
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          toolDescription: 'Whether to include the favicon URL for each result'
        },
        {
          key: 'timeout',
          label: '超时时间（秒）',
          description: '爬取操作的最大等待时间（10-150秒）',
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 150,
          min: 10,
          max: 150,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput],
          toolDescription: 'Maximum time in seconds to wait before timing out'
        }
      ],
      outputs: [
        {
          key: 'baseUrl',
          label: '基础 URL',
          description: '被爬取的基础 URL',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'results',
          label: '爬取结果',
          description: '从爬取 URL 中提取的内容列表',
          valueType: WorkflowIOValueTypeEnum.arrayObject
        },
        {
          key: 'successCount',
          label: '成功数量',
          description: '成功爬取的页面数量',
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'responseTime',
          label: '响应时间',
          description: '完成请求所花费的时间（秒）',
          valueType: WorkflowIOValueTypeEnum.number
        }
      ]
    }
  ]
});
