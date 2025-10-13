import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  isWorkerRun: false,
  name: {
    'zh-CN': '通义千问图像编辑',
    en: 'Qwen Image Editing'
  },
  description: {
    'zh-CN':
      '通义千问-图像编辑模型（Qwen-Image-Edit）支持多图编辑，可精确修改图内文字、增删或移动物体、改变主体动作、迁移图片风格及增强画面细节。',
    en: 'Qwen-Image-Edit supports multi-image editing, can accurately modify text in the image, add, delete or move objects, change the main action, migrate image style and enhance image details.'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'generateType',
          label: '生成类型',
          description: '选择生成类型, 单图编辑只能输入1张图片, 多图融合可以输入1-3张图片',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'single',
          list: [
            { label: '单图编辑', value: 'single' },
            { label: '多图融合', value: 'multiple' }
          ]
        },
        {
          key: 'image1',
          label: '图片1',
          description: '第一张输入图片的URL或Base64编码数据（必需）',
          toolDescription: '第一张输入图片',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true
        },
        {
          key: 'image2',
          label: '图片2',
          description: '第二张输入图片的URL或Base64编码数据（可选）',
          toolDescription: '第二张输入图片',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false
        },
        {
          key: 'image3',
          label: '图片3',
          description: '第三张输入图片的URL或Base64编码数据（可选）',
          toolDescription: '第三张输入图片',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: false
        },
        {
          key: 'prompt',
          label: '正向提示词',
          description: '描述期望生成的图像内容，支持中英文，长度不超过800个字符',
          toolDescription: '文本提示词',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true
        },
        {
          key: 'negative_prompt',
          label: '反向提示词',
          description: '描述不希望在画面中看到的内容，长度不超过500个字符',
          toolDescription: '反向提示词',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'watermark',
          label: '水印',
          description: '是否添加水印',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean
        },
        {
          key: 'seed',
          label: '随机种子',
          description:
            '用于控制模型生成内容的随机性，相同种子会生成相似结果，最小值为0，最大值为2147483647',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput],
          valueType: WorkflowIOValueTypeEnum.number,
          min: 0,
          max: 2147483647
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'image',
          label: '生成的图片',
          description: '生成图片的URL'
        },
        {
          type: FlowNodeOutputTypeEnum.error,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'error',
          label: '错误信息'
        }
      ]
    }
  ]
});
