import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  name: {
    'zh-CN': 'Seedream 4.0 绘图',
    en: 'Seedream Image Generation Model'
  },
  courseUrl: 'https://www.volcengine.com/docs/82379/1541523',
  type: ToolTypeEnum.multimodal,
  description: {
    'zh-CN': '豆包 Seedream 4.0 图片生成模型',
    en: 'Seedream Image Generation Model'
  },
  toolDescription: 'Seedream 4.0 图片生成模型',
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'API Key',
      description: '豆包Seedream 4.0 图片生成模型',
      required: true,
      inputType: 'secret'
    }
  ],
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'model',
          label: '模型',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          description: '模型',
          defaultValue: 'doubao-seedream-4-0-250828',
          list: [{ label: 'Doubao-Seedream-4.0', value: 'doubao-seedream-4-0-250828' }],
          required: true
        },
        {
          key: 'prompt',
          label: '提示词',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          description: '用于生成图像的提示词，支持中英文。',
          toolDescription: '用于生成图像的提示词，支持中英文。',
          required: true
        },
        {
          key: 'size',
          label: '生成图像的尺寸信息',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          description: '生成图像的尺寸信息',
          defaultValue: '2048x2048',
          list: [
            { label: '1:1', value: '2048x2048' },
            { label: '4:3', value: '2304x1728' },
            { label: '3:4', value: '1728x2304' },
            { label: '16:9', value: '2560x1440' },
            { label: '9:16', value: '1440x2560' },
            { label: '3:2', value: '2496x1664' },
            { label: '2:3', value: '1664x2496' },
            { label: '21:9', value: '3024x1296' }
          ],
          required: false
        },
        {
          key: 'seed',
          label: '随机种子',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput],
          valueType: WorkflowIOValueTypeEnum.number,
          description: '随机数种子, 用于控制模型生成内容的随机性',
          min: -1,
          max: 2147483647,
          defaultValue: 0
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'image',
          label: '图片链接',
          required: true
        }
      ]
    }
  ]
});
