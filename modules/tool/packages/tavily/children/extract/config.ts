import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '内容提取',
    en: 'Content Extract'
  },
  description: {
    'zh-CN': '从网页提取结构化内容',
    en: 'Extract structured content from web pages'
  },
  toolDescription:
    'Extract clean, structured content from web pages in Markdown or text format. ' +
    'Supports batch extraction from multiple URLs.',

  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version with content extraction',
      inputs: [
        {
          key: 'urls',
          label: 'URL 地址',
          description: '单个或多个 URL (多个用换行分隔)',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Single URL or multiple URLs (one per line)'
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
        }
      ],
      outputs: [
        {
          key: 'results',
          label: '提取结果',
          description: '成功提取的内容数组',
          valueType: WorkflowIOValueTypeEnum.arrayObject
        },
        {
          key: 'successCount',
          label: '成功数量',
          description: '成功提取的 URL 数量',
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'failedUrls',
          label: '失败列表',
          description: '提取失败的 URL 及原因',
          valueType: WorkflowIOValueTypeEnum.arrayString
        }
      ]
    }
  ]
});
