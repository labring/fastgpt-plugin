import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  name: {
    'zh-CN': 'Markdown 转文件',
    en: 'Markdown to file'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN': '将 Markdown 转成指定格式文件，返回的文件链接请及时下载。',
    en: 'Convert Markdown to specified format file, return the file link please download it in time.'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'markdown',
          label: 'Markdown 内容',
          description: '要转换的 Markdown 内容',
          toolDescription: '要转换的 Markdown 内容',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'format',
          label: '转换格式',
          description: '需要转换的格式，支持 xlsx 和 docx 和 pptx',
          toolDescription: '需要转换的格式，支持 xlsx 和 docx 和 pptx',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          list: [
            { label: 'xlsx', value: 'xlsx' },
            { label: 'docx', value: 'docx' },
            { label: 'pptx', value: 'pptx' }
          ]
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'url',
          label: '文件链接'
        }
      ]
    }
  ]
});
