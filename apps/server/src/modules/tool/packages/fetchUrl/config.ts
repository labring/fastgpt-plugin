import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  tags: [ToolTagEnum.enum.tools],
  name: {
    'zh-CN': '网页内容抓取',
    en: 'Fetch Url'
  },
  description: {
    'zh-CN': '可获取一个网页链接内容，并以 Markdown 格式输出，仅支持获取静态网站。',
    en: 'Get the content of a website link and output it in Markdown format, only supports static websites.'
  },
  icon: 'core/workflow/template/fetchUrl',
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'url',
          label: 'url',
          description: '需要读取的网页链接',
          required: true,
          toolDescription: '需要读取的网页链接'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'title',
          label: '网页标题'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'result',
          label: '网页内容'
        }
      ]
    }
  ]
});
