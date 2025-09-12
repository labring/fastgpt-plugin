import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.tools,
  name: {
    'zh-CN': '本地部署解析',
    en: 'Local Deployment Parse'
  },
  description: {
    'zh-CN': '使用本地部署的 MinerU api v2 解析文件，支持 pdf、png、jpg、jpeg 等多种格式',
    en: 'Parse the file using the local MinerU api v2, support pdf, png, jpg, jpeg, and other formats'
  },
  courseUrl: 'https://github.com/opendatalab/MinerU/blob/master/mineru/cli/fast_api.py#L63',
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
          description: '需要解析的文件（支持.pdf、.png、.jpg、.jpeg 多种格式）',
          canSelectFile: true,
          canSelectImg: true
        },
        {
          key: 'parse_method',
          label: '解析方法',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          list: [
            { label: 'auto', value: 'auto' },
            { label: 'ocr', value: 'ocr' },
            { label: 'txt', value: 'txt' }
          ],
          required: false,
          description: '解析方法，默认 auto',
          defaultValue: 'auto'
        },
        {
          key: 'formula_enable',
          label: '开启公式识别',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean,
          required: false,
          description: '是否启动公式识别功能，默认 true',
          defaultValue: true
        },
        {
          key: 'table_enable',
          label: '开启表格识别',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean,
          required: false,
          description: '是否启动表格识别功能，默认 true',
          defaultValue: true
        },
        {
          key: 'return_content_list',
          label: '返回结构化 json',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean,
          required: false,
          description: '是否返回结构化 json，默认 false',
          defaultValue: false
        },
        {
          key: 'lang_list',
          label: '文档语言',
          renderTypeList: [FlowNodeInputTypeEnum.textarea],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description:
            '指定文档语言，默认 ch，长度跟文件数量一致，否则取第一个，按逗号分隔，其他可选值列表详见：https://www.paddleocr.ai/latest/en/version3.x/algorithm/PP-OCRv5/PP-OCRv5_multi_languages.html#4-supported-languages-and-abbreviations',
          defaultValue: 'ch'
        },
        {
          key: 'backend',
          label: '解析后端',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: 'mineru 解析后端，默认pipeline。',
          list: [
            { label: 'pipeline', value: 'pipeline' },
            { label: 'vlm-transformers', value: 'vlm-transformers' },
            { label: 'vlm-sglang-engine', value: 'vlm-sglang-engine' },
            { label: 'vlm-sglang-client', value: 'vlm-sglang-client' }
          ],
          defaultValue: 'pipeline'
        },
        {
          key: 'sglang_server_url',
          label: 'sglang 服务地址',
          renderTypeList: [FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false,
          description: 'sglang 服务地址，当 backend 为 vlm-sglang-client 时必填。',
          defaultValue: ''
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
