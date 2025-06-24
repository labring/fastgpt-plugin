import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  toolId: 'community-fetchUrl',
  type: ToolTypeEnum.tools,
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
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'url',
          label: 'url',
          description: '需要读取的网页链接',
          required: true,
          toolDescription: '需要读取的网页链接',
          defaultValue: ''
        }
      ],
      outputs: [
        {
          id: 'result',
          type: FlowNodeOutputTypeEnum.static,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'result',
          label: 'result',
          description: '获取的网页内容'
        }
      ]
    }
  ]
});
