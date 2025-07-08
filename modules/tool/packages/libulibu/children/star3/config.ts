import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  SystemInputKeyEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': 'star3',
    en: 'star3'
  },
  description: {
    'zh-CN': '用以与libulibu星流3模型交互',
    en: 'description'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: SystemInputKeyEnum.systemInputConfig,
          label: '',
          inputList: [
            {
              key: 'accessKey',
              label: 'accessKey',
              description: '可以在 https://www.liblib.art/apis 获取',
              required: true,
              inputType: 'secret'
            },
            {
              key: 'secretKey',
              label: 'secretKey',
              description: '可以在 https://www.liblib.art/apis 获取',
              required: true,
              inputType: 'secret'
            }
          ],
          renderTypeList: [FlowNodeInputTypeEnum.hidden],
          valueType: WorkflowIOValueTypeEnum.object
        },
        {
          key: 'prompt',
          label: '绘画提示词',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'width',
          label: '宽度',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'height',
          label: '高度',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'link',
          label: '图片链接',
          description: '绘画结果图片链接'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'code',
          label: '状态码',
          description: '状态码'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'msg',
          label: '状态码',
          description: '成功或者失败信息'
        }
      ]
    }
  ]
});
