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
  courseUrl: 'https://jina.ai/reader/',
  versionList: [
    {
      value: '0.1.0',
      description: 'Enhanced version with comprehensive format support',
      inputs: [
        {
          key: 'url',
          label: '目标网页',
          description: '需要解析的网页URL地址',
          toolDescription: '需要解析的网页URL地址',
          required: true,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          valueType: WorkflowIOValueTypeEnum.string
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
            { label: '默认（针对大多数网站和大模型输入优化的默认管道）', value: 'default' },
            { label: 'Markdown', value: 'markdown' },
            { label: 'HTML源码', value: 'html' },
            { label: '纯文本', value: 'text' },
            { label: '页面截图', value: 'screenshot' },
            { label: '完整截图', value: 'pageshot' }
          ],
          defaultValue: 'default'
        }
      ],
      outputs: [
        {
          key: 'title',
          label: '页面标题',
          description: '网页的标题信息',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'description',
          label: '页面描述',
          description: '网页的描述信息',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'content',
          label: '页面内容',
          description: '网页的主要内容',
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});
