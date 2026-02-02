import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': 'Qwen-image',
    en: 'Qwen-image'
  },
  description: {
    'zh-CN': '采用硅基流动提供的Qwen-image 模型进行绘图',
    en: 'Use the Qwen-image model provided by Silicon Flow for painting'
  },
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          key: 'prompt',
          label: '绘图提示词',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '绘图提示词'
        },
        {
          key: 'image_size',
          label: '绘图尺寸',
          description: '绘图尺寸，支持 512x512, 1024x1024, 2048x2048',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: '1328x1328',
          list: [
            { label: '1328x1328 (1:1)', value: '1328x1328' },
            { label: '1664x928 (16:9)', value: '1664x928' },
            { label: '928x1664 (9:16)', value: '928x1664' },
            { label: '1472x1140 (4:3)', value: '1472x1140' },
            { label: '1140x1472 (3:4)', value: '1140x1472' },
            { label: '1584x1056 (3:2)', value: '1584x1056' },
            { label: '1056x1584 (2:3)', value: '1056x1584' }
          ]
        },
        {
          key: 'num_inference_steps',
          label: '推理步数',
          description: '推理步数，范围为 1-100',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 20,
          min: 1,
          max: 100
        },
        {
          key: 'negative_prompt',
          label: '负面提示词',
          description: '用于排除不希望出现在生成图像中的元素',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '负面提示词'
        },
        {
          key: 'seed',
          label: '随机种子',
          description: '用于控制生成图像的随机性。相同的种子将产生相同的图像。范围为 0-9999999999',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
        }
      ],

      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'imageUrl',
          label: '图片链接'
        }
      ]
    }
  ]
});
