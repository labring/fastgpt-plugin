import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': 'PDF 识别',
    en: 'PDF Recognition'
  },
  description: {
    'zh-CN':
      '将PDF文件发送至Doc2X进行解析，返回结构化的LaTeX公式的文本(markdown)，支持传入String类型的URL或者流程输出中的文件链接变量',
    en: 'Send an PDF file to Doc2X for parsing and return the LaTeX formula in markdown format.'
  },
  courseUrl: 'https://open.noedgeai.com',
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.fileSelect, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.arrayString,
          key: 'files',
          label: 'files',
          description: '需要处理的PDF地址',
          required: true,
          canSelectFile: true,
          canSelectImg: false,
          maxFiles: 14
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '结果',
          description: '处理结果，由文档内容组成，多个文件之间由横线分隔开',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          valueType: WorkflowIOValueTypeEnum.boolean,
          key: 'success',
          label: '成功',
          description: '成功信息'
        },
        {
          type: FlowNodeOutputTypeEnum.static,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'error',
          label: '错误信息'
        }
      ]
    }
  ]
});
