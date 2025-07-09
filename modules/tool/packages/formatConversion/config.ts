import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  name: {
    'zh-CN': 'Markdown文档转换',
    en: 'Markdown Document Converter'
  },
  type: ToolTypeEnum.tools,
  description: {
    'zh-CN':
      '将Markdown内容转换为指定格式文件（DOCX/DOC/Excel）并上传到MinIO，返回下载链接，链接七天过期',
    en: 'Convert Markdown content to specified format (DOCX/DOC/Excel) and upload to MinIO, return download link, link expires in 7 days'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'markdown',
          label: 'Markdown内容',
          description: '要转换的Markdown内容',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true
        },
        {
          key: 'format',
          label: '输出格式',
          description: '选择输出文件格式',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          list: [
            {
              label: 'Word文档 (DOCX)',
              value: 'docx'
            },
            {
              label: 'Excel表格 (XLSX)',
              value: 'xlsx'
            }
          ],
          required: true
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'downloadUrl',
          label: '下载链接',
          description: '转换后文件的下载链接'
        }
      ]
    }
  ]
});
