import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  toolId: 'aliDocParse',
  name: {
    'zh-CN': '阿里云文档智能解析',
    en: 'Alibaba Cloud Document Mind Parse'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN':
      '使用阿里云文档智能（Document Mind）对在线文档进行版式解析，提取文本、布局和样式信息，返回原始解析 JSON。支持 PDF、Word、Excel、HTML、EPUB、MOBI、Markdown、TXT 等格式。',
    en: 'Use Alibaba Cloud Document Mind to parse online documents for layout, text, and style information, returning the raw parsed JSON. Supports PDF, Word, Excel, HTML, EPUB, MOBI, Markdown, TXT and more.'
  },
  toolDescription:
    'Parse a document from URL using Alibaba Cloud Document Mind API. Returns the full raw JSON result including layouts, styles and docInfo.',
  courseUrl: 'https://help.aliyun.com/zh/document-mind/developer-reference/digitaldocstructure',
  secretInputConfig: [
    {
      key: 'accessKeyId',
      label: 'AccessKey ID',
      description: '阿里云 AccessKey ID',
      required: true,
      inputType: 'secret'
    },
    {
      key: 'accessKeySecret',
      label: 'AccessKey Secret',
      description: '阿里云 AccessKey Secret',
      required: true,
      inputType: 'secret'
    }
  ],
  versionList: [
    {
      value: '0.1.0',
      description: 'Initial release',
      inputs: [
        {
          key: 'fileUrl',
          label: '文档 URL',
          description: '需要解析的文档公网可访问地址，最大 150 MB，15000 页',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The public URL of the document to be parsed',
          placeholder: 'https://example.com/document.pdf'
        },
        {
          key: 'fileType',
          label: '文件类型',
          description: '文档格式，用于辅助接口识别文件类型',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select],
          defaultValue: 'pdf',
          list: [
            { label: 'PDF', value: 'pdf' },
            { label: 'Word (.docx)', value: 'docx' },
            { label: 'Word (.doc)', value: 'doc' },
            { label: 'Excel (.xlsx)', value: 'xlsx' },
            { label: 'Excel (.xls)', value: 'xls' },
            { label: 'HTML', value: 'html' },
            { label: 'EPUB', value: 'epub' },
            { label: 'MOBI', value: 'mobi' },
            { label: 'Markdown (.md)', value: 'md' },
            { label: 'TXT', value: 'txt' }
          ]
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '解析结果 JSON',
          description: '阿里云文档智能返回的原始 JSON 数据，包含 layouts、styles、docInfo 等字段',
          valueType: WorkflowIOValueTypeEnum.object
        }
      ]
    }
  ]
});
