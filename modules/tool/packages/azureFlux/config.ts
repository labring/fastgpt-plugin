import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  toolId: 'azureFlux',
  name: {
    'zh-CN': 'Azure Flux 图片生成',
    en: 'Azure Flux Image Generation'
  },
  tags: [ToolTagEnum.enum.multimodal],
  description: {
    'zh-CN':
      '使用 Azure AI 上的 Flux 模型根据文本提示生成图片，返回 base64 格式的图片原始数据。支持 FLUX-1.1-pro（$40/1K 张）和 FLUX-2-pro（首 MP $0.03，后续 $0.015/MP）',
    en: 'Generate images using Flux model on Azure AI from text prompts, returns raw base64 encoded image data. Supports FLUX-1.1-pro ($40/1K images) and FLUX-2-pro ($0.03 first MP, $0.015/MP after)'
  },
  toolDescription:
    'Generate an image using Azure Flux model based on a text prompt. Supports FLUX-1.1-pro and FLUX-2-pro. Returns the raw base64 encoded image data.',
  secretInputConfig: [
    {
      key: 'endpoint',
      label: 'Azure Endpoint',
      description: 'Azure AI Foundry endpoint，例如 https://xxx.services.ai.azure.com',
      required: true,
      inputType: 'secret'
    },
    {
      key: 'apiKey',
      label: 'API Key',
      description: 'Azure API 访问密钥',
      required: true,
      inputType: 'secret'
    }
  ],
  versionList: [
    {
      value: '0.1.0',
      description: 'Initial release',
      inputs: [
        {
          key: 'model',
          label: '模型',
          description:
            '选择图片生成模型\n• FLUX-1.1-pro：$40 / 1K 张\n• FLUX-2-pro：首 1MP $0.03，后续每 MP $0.015（不足 1MP 按 1MP 计）',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select],
          defaultValue: 'FLUX-1.1-pro',
          list: [
            { label: 'FLUX-1.1-pro（$40 / 1K images）', value: 'FLUX-1.1-pro' },
            { label: 'FLUX-2-pro（首 MP $0.03，后续 $0.015/MP）', value: 'FLUX-2-pro' }
          ]
        },
        {
          key: 'prompt',
          label: '图片描述',
          description: '描述要生成的图片内容',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Describe the image you want to generate in detail',
          placeholder: 'A photograph of a red fox in an autumn forest'
        },
        {
          key: 'width',
          label: '宽度 (px)',
          description: '图片宽度，仅 FLUX-2-pro 生效',
          valueType: WorkflowIOValueTypeEnum.number,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          defaultValue: 1024,
          min: 256,
          max: 2048
        },
        {
          key: 'height',
          label: '高度 (px)',
          description: '图片高度，仅 FLUX-2-pro 生效',
          valueType: WorkflowIOValueTypeEnum.number,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          defaultValue: 1024,
          min: 256,
          max: 2048
        },
        {
          key: 'inputImages',
          label: '参考图片（仅 FLUX-2-pro）',
          description:
            '可选，最多 2 张，仅 FLUX-2-pro 生效。计费：$0.015/MP/张（不足 1MP 按 1MP 计）',
          valueType: WorkflowIOValueTypeEnum.arrayString,
          renderTypeList: [FlowNodeInputTypeEnum.fileSelect, FlowNodeInputTypeEnum.reference],
          canSelectImg: true,
          maxFiles: 2
        },
        {
          key: 'safetyTolerance',
          label: '内容安全等级',
          description: '内容审核宽松度：0（最严格）到 5（最宽松），两个模型均支持',
          valueType: WorkflowIOValueTypeEnum.number,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          defaultValue: 2,
          min: 0,
          max: 5
        }
      ],
      outputs: [
        {
          key: 'b64Json',
          label: '图片 Base64',
          description: '生成图片的 base64 原始数据',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'cost',
          label: '费用 (USD)',
          description: '本次请求的实际费用（美元）',
          valueType: WorkflowIOValueTypeEnum.number
        }
      ]
    }
  ]
});
