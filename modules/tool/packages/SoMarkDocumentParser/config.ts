import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  toolId: 'SoMarkDocumentParser',
  name: {
    'zh-CN': 'SoMark 文档解析',
    en: 'SoMark Document Parser'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN':
      '使用 SoMark 文档解析工具 将各种文档（如 PDF、图片等）转换为结构化的 Markdown 或 JSON 格式。',
    en: 'Convert various document types—including PDFs, images, and more—into structured Markdown or JSON using the SoMark Document Parser.'
  },
  toolDescription:
    'A precise and reliable tool that utilizes the SoMark Document Parser to convert various document formats (PDF, PNG, JPG, etc.) into clean, structured Markdown or JSON format, preserving the original layout and content hierarchy.',
  secretInputConfig: [
    {
      key: 'deploymentType',
      label: '部署方式',
      description:
        '选择"SoMark API"使用官方云服务；如果是自建 SoMark 服务，请选择"SoMark Self-host"。',
      required: true,
      inputType: 'select',
      list: [
        { label: 'SoMark API', value: 'api' },
        { label: 'SoMark Self-host', value: 'private' }
      ]
    },
    {
      key: 'apiKey',
      label: 'API Key',
      description: '使用 SoMark 官方 API 时填写；SoMark Self-host 无需填写',
      required: false,
      inputType: 'secret'
    },
    {
      key: 'baseUrl',
      label: 'Base URL',
      description:
        '使用SoMark API时填写 https://somark.tech/api/v1;SoMark Self-host 时填写本地部署的Base URL。',
      required: true,
      inputType: 'input'
    }
  ],
  versionList: [
    {
      value: '0.1.1',
      description: '初始版本，支持文档解析基础能力。',
      inputs: [
        {
          key: 'file',
          label: '文件',
          description: '待解析的文件，支持 PDF、图片、Office 格式。',
          renderTypeList: [FlowNodeInputTypeEnum.fileSelect, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.arrayString,
          required: true,
          canSelectFile: true,
          canSelectImg: true,
          maxFiles: 1
        },
        {
          key: 'outputFormats',
          label: '输出格式',
          description: '选择解析结果的输出格式，支持 JSON 和 Markdown。默认同时输出两种格式。',
          renderTypeList: [FlowNodeInputTypeEnum.multipleSelect],
          valueType: WorkflowIOValueTypeEnum.arrayString,
          defaultValue: ['json', 'markdown'],
          required: false,
          list: [
            { label: 'JSON', value: 'json' },
            { label: 'Markdown', value: 'markdown' }
          ]
        },
        {
          key: 'imageFormat',
          label: '图片格式',
          description: '选择图片元素的返回格式，默认为 URL 格式，支持 URL、Base64、None 格式。',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'url',
          required: false,
          list: [
            { label: 'URL', value: 'url' },
            { label: 'Base64', value: 'base64' },
            { label: 'None', value: 'none' }
          ]
        },
        {
          key: 'formulaFormat',
          label: '公式格式',
          description:
            '选择公式元素的返回格式，默认为 LaTeX 格式，支持 LaTeX、MathML、ASCII 格式。',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'latex',
          required: false,
          list: [
            { label: 'LaTeX', value: 'latex' },
            { label: 'MathML', value: 'mathml' },
            { label: 'ASCII', value: 'ascii' }
          ]
        },
        {
          key: 'tableFormat',
          label: '表格格式',
          description:
            '选择表格元素的返回格式，默认为 HTML 格式，支持 Markdown、HTML、Image 格式。',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'html',
          required: false,
          list: [
            { label: 'Markdown', value: 'markdown' },
            { label: 'HTML', value: 'html' },
            { label: 'Image', value: 'image' }
          ]
        },
        {
          key: 'chemicalStructureFormat',
          label: '化学结构式格式',
          description: '选择化学结构式元素的返回格式，默认为 Image 格式，仅支持 Image 格式。',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'image',
          required: false,
          list: [{ label: 'Image', value: 'image' }]
        },
        {
          key: 'enableTextCrossPage',
          label: '文字跨页拼接',
          description: '跨页文字段合并为连续段落',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false
        },
        {
          key: 'enableTableCrossPage',
          label: '表格跨页拼接',
          description: '跨页表格合并为完整表格',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false
        },
        {
          key: 'enableTitleLevelRecognition',
          label: '标题层级识别',
          description: '识别文档标题层级结构（H1/H2/H3…）',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false
        },
        {
          key: 'enableInlineImage',
          label: '文中图',
          description: '返回文字段落中的图片',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: true
        },
        {
          key: 'enableTableImage',
          label: '表格图',
          description: '返回表格单元格内的图片',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: true
        },
        {
          key: 'enableImageUnderstanding',
          label: '图片理解',
          description: '对文档内图片进行语义理解和结构化描述',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: true
        },
        {
          key: 'keepHeaderFooter',
          label: '保留页眉页脚',
          description: '默认过滤了页眉页脚，如果使用页眉页脚可开启保留',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'markdown',
          label: 'Markdown',
          description: 'Markdown 格式全文'
        },
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'json',
          label: 'JSON',
          description: 'JSON 格式输出'
        }
      ]
    }
  ]
});
