import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.tools,
  name: {
    'zh-CN': '文档解析（官方api）',
    en: 'Parse file (official api)'
  },
  description: {
    'zh-CN': '使用官方的 MinerU api 解析文件',
    en: 'Parse the file using the official MinerU api'
  },
  courseUrl: 'https://mineru.net/apiManage/docs',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'files',
          label: 'files',
          renderTypeList: [FlowNodeInputTypeEnum.fileSelect, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.arrayString,
          required: true,
          description:
            '需要解析的文件（支持.pdf、.doc、.docx、.ppt、.pptx、.png、.jpg、.jpeg多种格式）',
          canSelectFile: true,
          canSelectImg: true
        },
        {
          key: 'is_ocr',
          label: '开启OCR',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean,
          required: false,
          description: '是否启动 ocr 功能，默认 false',
          defaultValue: false
        },
        {
          key: 'enable_formula',
          label: '开启公式识别',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean,
          required: false,
          description: '是否启动公式识别功能，默认 true',
          defaultValue: true
        },
        {
          key: 'enable_table',
          label: '开启表格识别',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean,
          required: false,
          description: '是否启动表格识别功能，默认 true',
          defaultValue: true
        },
        {
          key: 'language',
          label: '文档语言',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          list: [
            { label: 'ch', value: 'ch' },
            { label: 'en', value: 'en' },
            { label: 'ja', value: 'ja' },
            { label: 'ko', value: 'ko' },
            { label: 'fr', value: 'fr' }
          ],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description:
            '指定文档语言，默认 ch，其他可选值列表详见：https://www.paddleocr.ai/latest/en/version3.x/algorithm/PP-OCRv5/PP-OCRv5_multi_languages.html#4-supported-languages-and-abbreviations',
          defaultValue: 'ch'
        },
        {
          key: 'model_version',
          label: '模型版本',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          list: [
            { label: 'pipeline', value: 'pipeline' },
            { label: 'vlm', value: 'vlm' }
          ],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: 'mineru 模型版本，两个选项:pipeline、vlm，默认pipeline。',
          defaultValue: 'pipeline'
        },
        {
          key: 'extra_formats',
          label: '额外格式',
          renderTypeList: [FlowNodeInputTypeEnum.multipleSelect],
          valueType: WorkflowIOValueTypeEnum.arrayString,
          required: false,
          description:
            '指定额外格式，markdown、json为默认导出格式，无须设置，该参数仅支持docx、html、latex三种格式中的一个或多个',
          defaultValue: [],
          list: [
            { label: 'docx', value: 'docx' },
            { label: 'html', value: 'html' },
            { label: 'latex', value: 'latex' }
          ]
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'result',
          label: '解析结果',
          description: '解析后的数据'
        }
      ]
    }
  ]
});
