import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  isWorkerRun: false,
  name: {
    'zh-CN': 'Qwen-image-edit',
    en: 'Qwen-image-edit'
  },
  description: {
    'zh-CN': '采用硅基流动提供的Qwen-image-edit-2509 模型进行绘图',
    en: 'Use the Qwen-imageedit-2509 model provided by Silicon Flow for painting'
  },
  versionList: [
    {
      value: '0.1.0',
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
          key: 'image',
          label: '参考图片1',
          description: '参考图片URL或base64编码',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '参考图片1 (URL或base64格式)'
        },
        {
          key: 'image2',
          label: '参考图片2',
          description: '参考图片URL或base64编码',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '参考图片2 (URL或base64格式)'
        },
        {
          key: 'image3',
          label: '参考图片3',
          description: '参考图片URL或base64编码',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '参考图片3 (URL或base64格式)'
        },
        {
          key: 'seed',
          label: '随机种子',
          description: '用于控制生成图像的随机性。相同的种子将产生相同的图像。范围为 0-9999999999',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
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
