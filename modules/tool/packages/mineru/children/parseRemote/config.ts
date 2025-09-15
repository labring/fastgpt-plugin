import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.tools,
  name: {
    'zh-CN': 'MinerU Saas 解析',
    en: 'MinerU Saas Parse'
  },
  description: {
    'zh-CN':
      '使用 MinerU 官方的 Saas 解析文件，支持.pdf、.doc、.docx、.ppt、.pptx、.png、.jpg、.jpeg',
    en: 'Parse files using the official MinerU Sass, support .pdf, .doc, .docx, .ppt, .pptx, .png, .jpg, .jpeg'
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
            { label: '中文', value: 'ch' },
            { label: '英文', value: 'en' },
            { label: '日文', value: 'japan' },
            { label: '韩文', value: 'korean' },
            { label: '法文', value: 'fr' },
            { label: '德文', value: 'de' },
            { label: '意大利文', value: 'it' },
            { label: '俄文', value: 'ru' },
            { label: '波兰文', value: 'pl' },
            { label: '葡萄牙文', value: 'pt' },
            { label: '罗马尼亚文', value: 'ro' },
            { label: '塞尔维亚文(西里尔)', value: 'rs_cyrillic' },
            { label: '塞尔维亚文(拉丁)', value: 'rs_latin' },
            { label: '斯洛伐克文', value: 'sk' },
            { label: '斯洛文尼亚文', value: 'sl' },
            { label: '阿尔巴尼亚文', value: 'sq' },
            { label: '瑞典文', value: 'sv' },
            { label: '斯瓦希里文', value: 'sw' },
            { label: '塔加洛文', value: 'tl' },
            { label: '土耳其文', value: 'tr' },
            { label: '维吾尔文', value: 'ug' },
            { label: '乌克兰文', value: 'uk' },
            { label: '乌尔都文', value: 'ur' },
            { label: '乌兹别克文', value: 'uz' },
            { label: '越南文', value: 'vi' },
            { label: '塔巴萨兰文', value: 'tab' },
            { label: '泰米尔文', value: 'ta' },
            { label: '泰卢固文', value: 'te' }
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
