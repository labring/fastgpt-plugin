import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '抓取网页内容',
    en: 'Scrape web content'
  },
  description: {
    'zh-CN': '从任何网站抓取干净的数据。',
    en: 'Scrape clean data from any website.'
  },
  courseUrl: 'https://www.firecrawl.dev/',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'url',
          label: 'Url',
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          toolDescription: 'The URL of the webpage to scrape'
        },
        {
          key: 'format',
          label: '返回格式',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          list: [
            { label: 'Markdown', value: 'markdown' },
            { label: 'HTML', value: 'html' }
          ],
          defaultValue: 'markdown'
        },
        {
          key: 'faster',
          label: '快速模式',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: true
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'result',
          label: '抓取结果'
        }
      ]
    }
  ]
});
