import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  SystemInputKeyEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { defineInputConfig } from '@tool/utils/tool';

export default defineTool({
  name: {
    'zh-CN': '通义万相文生图v2',
    en: 'Qwen Wanx Text-to-Image'
  },
  description: {
    'zh-CN':
      '使用阿里云百炼通义万相模型将文本描述转换为图像。支持多种模型、自定义尺寸、智能提示词改写等功能。',
    en: 'Convert text descriptions to images using Alibaba Qwen Wanx models. Supports multiple models, custom sizes, intelligent prompt enhancement, and more.'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        defineInputConfig([
          {
            key: 'apiKey',
            label: 'API Key',
            description: '可以在阿里云百炼控制台获取API密钥',
            required: true,
            inputType: 'secret'
          }
        ]),
        {
          key: 'model',
          label: '模型名称',
          description: '选择要使用的通义万相模型',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'wanx2.1-t2i-turbo',
          list: [
            {
              label: 'wanx2.1-t2i-turbo (快速版)',
              value: 'wanx2.1-t2i-turbo'
            },
            {
              label: 'wanx2.1-t2i-plus (精细版)',
              value: 'wanx2.1-t2i-plus'
            },
            {
              label: 'wanx2.0-t2i-turbo (性价比版)',
              value: 'wanx2.0-t2i-turbo'
            }
          ]
        },
        {
          key: 'prompt',
          label: '正向提示词',
          description: '描述期望生成的图像内容，支持中英文，长度不超过800个字符',
          toolDescription: '文本提示词',
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
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
          key: 'size',
          label: '图像尺寸',
          description: '设置生成图像的分辨率',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: '1024*1024',
          list: [
            { label: '512×512', value: '512*512' },
            { label: '512×1024', value: '512*1024' },
            { label: '768×768', value: '768*768' },
            { label: '768×1024', value: '768*1024' },
            { label: '1024×512', value: '1024*512' },
            { label: '1024×768', value: '1024*768' },
            { label: '1024×1024 (默认)', value: '1024*1024' },
            { label: '1280×720', value: '1280*720' },
            { label: '1440×720', value: '1440*720' }
          ]
        },
        {
          key: 'n',
          label: '生成数量',
          description: '生成图片的数量，取值范围为1~4张',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput],
          valueType: WorkflowIOValueTypeEnum.number,
          min: 1,
          max: 4
        },
        {
          key: 'seed',
          label: '随机种子',
          description: '用于控制模型生成内容的随机性，相同种子会生成相似结果',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput],
          valueType: WorkflowIOValueTypeEnum.number,
          min: 0,
          max: 2147483647
        },
        {
          key: 'prompt_extend',
          label: '智能改写',
          description: '是否开启prompt智能改写，开启后会使用大模型对输入prompt进行智能改写',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean
        },
        {
          key: 'watermark',
          label: '添加水印',
          description: '是否添加AI生成水印标识，水印位于图片右下角',
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          valueType: WorkflowIOValueTypeEnum.boolean
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.arrayString,
          key: 'images',
          label: '生成的图片',
          description: '生成图片的URL数组'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'error',
          label: '错误信息',
          description: '当任务执行失败时返回的错误描述'
        }
      ]
    }
  ]
});
