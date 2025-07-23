import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { defineInputConfig } from '@tool/utils/tool';

export default defineTool({
  name: {
    'zh-CN': 'star3',
    en: 'star3'
  },
  description: {
    'zh-CN': '用以与libulibu星流3模型交互',
    en: 'Used to interact with the libulibu Star3 model'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        defineInputConfig([
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
        ]),
        {
          key: 'prompt',
          label: '绘画提示词',
          toolDescription: '绘画提示词',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'size',
          label: '图像尺寸',
          description: '设置生成图像的分辨率',
          toolDescription:
            '设置生成图像的分辨率, 可选值: 512*1024, 768*512, 768*1024, 1024*576, 576*1024, 1024*1024',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: '1024*1024',
          list: [
            { label: '512×1024', value: '512*1024' },
            { label: '768×512', value: '768*512' },
            { label: '768×1024', value: '768*1024' },
            { label: '1024×576', value: '1024*576' },
            { label: '576×1024', value: '576*1024' },
            { label: '1024×1024 (默认)', value: '1024*1024' }
          ]
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
          type: FlowNodeOutputTypeEnum.error,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'error',
          label: '错误消息'
        }
      ]
    }
  ]
});
