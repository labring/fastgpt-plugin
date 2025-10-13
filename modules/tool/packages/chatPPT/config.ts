import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  isWorkerRun: false,
  courseUrl: 'https://wiki.yoo-ai.com/api/guide.html',
  name: {
    'zh-CN': '必优ChatPPT',
    en: 'ChatPPT'
  },
  type: ToolTypeEnum.productivity,
  description: {
    'zh-CN': '必优ChatPPT，一键生成PPT',
    en: 'ChatPPT, one-click generate PPT'
  },
  toolDescription: 'ChatPPT, one-click generate PPT',
  secretInputConfig: [
    {
      key: 'apiKey',
      label: 'API Key',
      description: '可以在必优官网获取',
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
          key: 'text',
          label: '描述文本',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          description: '生成PPT的描述文本',
          toolDescription: '生成PPT的描述文本',
          placeholder: '描述PPT内容, 如: 生成一个关于人工智能的PPT',
          required: true
        },
        {
          key: 'color',
          label: '主题色',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          description: 'PPT的主题色',
          toolDescription: 'PPT的主题色',
          placeholder: '直接填写自然语言描述主题色, 如: 蓝色'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'preview_url',
          label: 'PPT的预览URL',
          description: 'PPT的预览URL'
        }
      ]
    }
  ]
});
