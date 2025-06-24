import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  toolId: 'community-Doc2X/PDF2text',
  name: {
    'zh-CN': 'PDF 识别',
    en: 'PDF Recognition'
  },
  description: {
    'zh-CN':
      '将PDF文件发送至Doc2X进行解析，返回结构化的LaTeX公式的文本(markdown)，支持传入String类型的URL或者流程输出中的文件链接变量',
    en: 'Send an PDF file to Doc2X for parsing and return the LaTeX formula in markdown format.'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.input],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'apikey',
          label: 'apikey',
          description: 'Doc2X的API密匙，可以从Doc2X开放平台获得',
          required: true,
          defaultValue: '',
          list: []
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.fileSelect],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.arrayString,
          key: 'files',
          label: 'files',
          description: '需要处理的PDF地址',
          required: true,
          list: [],
          canSelectFile: true,
          canSelectImg: false,
          maxFiles: 14,
          defaultValue: ''
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.switch, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.boolean,
          key: 'HTMLtable',
          label: 'HTMLtable',
          description:
            '是否以HTML格式输出表格。如果需要精确地输出表格，请打开此开关以使用HTML格式。关闭后，表格将转换为Markdown形式输出，但这可能会损失一些表格特性，如合并单元格。',
          list: [
            {
              label: '',
              value: ''
            }
          ],
          maxFiles: 5,
          canSelectFile: true,
          canSelectImg: true,
          required: true
        }
      ],
      outputs: [
        {
          id: 'result',
          type: FlowNodeOutputTypeEnum.static,
          key: 'result',
          label: '结果',
          description: '处理结果，由文件名以及文档内容组成，多个文件之间由横线分隔开',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          id: 'error',
          type: FlowNodeOutputTypeEnum.static,
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'error',
          label: '错误',
          description: '错误信息'
        },
        {
          id: 'success',
          type: FlowNodeOutputTypeEnum.static,
          valueType: WorkflowIOValueTypeEnum.boolean,
          key: 'success',
          label: '成功',
          description: '成功信息'
        }
      ]
    }
  ]
});
