import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '网站地图',
    en: 'Site Map'
  },
  description: {
    'zh-CN': '像图一样遍历网站，并行探索数百个路径以生成全面的站点地图',
    en: 'Traverse websites like a graph and explore hundreds of paths in parallel to generate comprehensive site maps'
  },
  toolDescription:
    'Map website structure by discovering and cataloging all accessible URLs. ' +
    'Perfect for understanding site architecture, content inventory, and planning crawls.',

  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version with intelligent site mapping capabilities',
      inputs: [
        {
          key: 'url',
          label: '起始 URL',
          description: '开始映射的根 URL',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          toolDescription: 'The root URL to begin the mapping'
        },
        {
          key: 'instructions',
          label: '映射指令',
          description: '自然语言指令，指导映射器查找特定内容（使用会增加成本）',
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Natural language instructions for the crawler'
        },
        {
          key: 'maxDepth',
          label: '最大深度',
          description: '映射的最大深度（1-5）',
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 1,
          min: 1,
          max: 5,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput],
          toolDescription: 'Max depth of the mapping'
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
          key: 'selectDomains',
          label: '包含域名',
          description: '正则表达式模式，选择特定域名或子域名（每行一个）',
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Regex patterns to select specific domains or subdomains'
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
          key: 'excludeDomains',
          label: '排除域名',
          description: '正则表达式模式，排除特定域名或子域名（每行一个）',
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Regex patterns to exclude specific domains or subdomains'
        },
        {
          key: 'allowExternal',
          label: '允许外部链接',
          description: '是否在最终结果列表中包含外部域链接',
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: true,
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          toolDescription: 'Whether to include external domain links'
        },
        {
          key: 'timeout',
          label: '超时时间（秒）',
          description: '映射操作的最大等待时间（10-150秒）',
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
          description: '被映射的基础 URL',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'results',
          label: '发现的 URL',
          description: '映射过程中发现的 URL 列表',
          valueType: WorkflowIOValueTypeEnum.arrayString
        },
        {
          key: 'urlCount',
          label: 'URL 数量',
          description: '发现的 URL 总数',
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
