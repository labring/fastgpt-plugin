import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  isWorkerRun: false,
  tags: [ToolTagEnum.enum.multimodal],
  name: {
    'zh-CN': 'Dalle3 绘图',
    en: 'Dalle3 Drawing'
  },
  description: {
    'zh-CN': '调用 Dalle3 接口绘图',
    en: 'Call Dalle3 Interface to Draw'
  },
  icon: 'common/openai',
  courseUrl: 'https://openai.com',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'prompt',
          label: '绘图提示词',
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          toolDescription: '绘图提示词'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'link',
          label: '图片访问链接',
          description: '图片访问链接'
        },
        {
          type: FlowNodeOutputTypeEnum.error,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'system_error',
          label: '错误信息'
        }
      ]
    }
  ],
  secretInputConfig: [
    {
      key: 'url',
      label: 'Dalle3 接口基础地址',
      description: '例如：https://api.openai.com',
      inputType: 'input',
      required: true
    },
    {
      key: 'authorization',
      label: '接口凭证（不需要 Bearer）',
      description: 'sk-xxxx',
      required: true,
      inputType: 'secret'
    }
  ]
});
