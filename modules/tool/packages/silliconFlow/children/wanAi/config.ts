import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  SystemInputKeyEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': 'Wan-AI 视频生成',
    en: 'Wan-AI Video Generation'
  },
  description: {
    'zh-CN': '采用硅基流动提供的Wan-AI 模型进行视频生成',
    en: 'Use the Wan-AI model provided by Silicon Flow for video generation'
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
              key: 'authorization',
              label: '接口凭证（不需要 Bearer）',
              description: 'sk-xxxx',
              required: true,
              inputType: 'secret'
            }
          ],
          renderTypeList: [FlowNodeInputTypeEnum.hidden],
          valueType: WorkflowIOValueTypeEnum.object
        },
        {
          key: 'model',
          label: '模型',
          description: '对应模型名称。模型可能会定期调整，请关注公告或消息通知。',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'Wan-AI/Wan2.1-T2V-14B',
          list: [
            { label: 'Wan-AI/Wan2.1-T2V-14B', value: 'Wan-AI/Wan2.1-T2V-14B' },
            { label: 'Wan-AI/Wan2.1-T2V-14B-Turbo', value: 'Wan-AI/Wan2.1-T2V-14B-Turbo' },
            { label: 'Wan-AI/Wan2.1-I2V-14B-720P', value: 'Wan-AI/Wan2.1-I2V-14B-720P' },
            { label: 'Wan-AI/Wan2.1-I2V-14B-720P-Turbo', value: 'Wan-AI/Wan2.1-I2V-14B-720P-Turbo' }
          ]
        },
        {
          key: 'prompt',
          label: '提示词',
          description: '用于生成视频描述的文本提示词',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '视频生成的文本提示词'
        },
        {
          key: 'image_size',
          label: '尺寸',
          description: '生成内容的长宽比',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.select],
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: '1280x720',
          list: [
            { label: '1280x720', value: '1280x720' },
            { label: '720x1280', value: '720x1280' },
            { label: '960x960', value: '960x960' }
          ]
        },
        {
          key: 'negative_prompt',
          label: '负面提示词',
          description: '用于排除不希望出现在生成内容中的元素',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '负面提示词'
        },
        {
          key: 'image',
          label: '输入图片',
          description:
            '部分模型必填，支持 base64 或图片 URL。例如："data:image/png;base64,XXX" 或图片链接',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'seed',
          label: '随机种子',
          description: '用于控制生成内容的随机性',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number
        }
      ],

      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'url',
          label: '视频链接'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'status',
          label: '状态',
          description: "操作状态。可选值：'Succeed','InQueue','InProgress','Failed'"
        },
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'results',
          label: '结果',
          description: '生成结果对象，包含视频、推理时间、种子等信息'
        }
      ]
    }
  ]
});
