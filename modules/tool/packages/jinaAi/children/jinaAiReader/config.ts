import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  WorkflowIOValueTypeEnum,
  SystemInputKeyEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.tools,
  name: {
    'zh-CN': 'Jina AI 网页解析',
    en: 'Jina AI Web Parser'
  },
  description: {
    'zh-CN': '基于 Jina AI Reader 的智能网页内容解析工具，支持多种格式输出',
    en: 'Intelligent web content parsing powered by Jina AI Reader with multiple output formats'
  },
  icon: 'core/workflow/template/jinaReader',
  courseUrl: 'https://jina.ai/reader/',
  author: 'FastGPT',
  versionList: [
    {
      value: '2.0.0',
      description: 'Enhanced version with comprehensive format support',
      inputs: [
        {
          key: SystemInputKeyEnum.systemInputConfig,
          label: '',
          inputList: [
            {
              key: 'apiKey',
              label: 'Jina AI API密钥',
              description: 'Jina AI API密钥，格式：jina_xxxxxxxxxxxxxxxx',
              required: true,
              inputType: 'secret'
            }
          ],
          renderTypeList: [FlowNodeInputTypeEnum.hidden],
          valueType: WorkflowIOValueTypeEnum.object
        },
        {
          key: 'url',
          label: '目标网页',
          description: '需要解析的网页URL地址',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          toolDescription: '目标网页URL'
        },
        {
          key: 'timeout',
          label: '超时时间（秒）',
          description: '请求超时时间，范围1-300秒',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 30,
          min: 1,
          max: 300,
          toolDescription: '请求超时时间（秒）'
        },
        {
          key: 'returnFormat',
          label: '输出格式',
          description: '指定内容返回的格式类型',
          required: false,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          list: [
            { label: '默认（针对大多数网站和大模型输入进行优化）', value: 'default' },
            { label: 'Markdown', value: 'markdown' },
            { label: 'HTML源码', value: 'html' },
            { label: '纯文本', value: 'text' },
            { label: '页面截图', value: 'screenshot' },
            { label: '完整截图', value: 'pageshot' }
          ],
          defaultValue: 'default',
          toolDescription: '内容输出格式'
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '解析结果',
          description: '网页内容解析结果',
          valueType: WorkflowIOValueTypeEnum.object
        }
      ]
    }
  ]
});
