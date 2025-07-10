import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  WorkflowIOValueTypeEnum,
  SystemInputKeyEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.search,
  name: {
    'zh-CN': 'Jina AI 搜索',
    en: 'Jina AI Search'
  },
  description: {
    'zh-CN': '基于 Jina AI 搜索引擎的智能网络搜索工具，支持多语言和地区定制',
    en: 'Intelligent web search powered by Jina AI search engine with multi-language and region support'
  },
  icon: 'core/workflow/template/jinaAi',
  courseUrl: 'https://jina.ai',
  author: 'FastGPT',
  versionList: [
    {
      value: '1.0.0',
      description: 'Initial version with full search functionality',
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
          key: 'query',
          label: '搜索关键词',
          description: '要搜索的关键词或查询语句',
          toolDescription: '搜索关键词',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input]
        },
        {
          key: 'country',
          label: '搜索地区',
          description: '指定搜索的国家或地区',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          defaultValue: 'CN',
          list: [
            { label: '中国', value: 'CN' },
            { label: '美国', value: 'US' },
            { label: '英国', value: 'GB' },
            { label: '日本', value: 'JP' },
            { label: '韩国', value: 'KR' },
            { label: '法国', value: 'FR' }
          ],
          toolDescription: '搜索地区代码'
        },
        {
          key: 'language',
          label: '搜索语言',
          description: '指定搜索所用的语言',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          defaultValue: 'zh-cn',
          list: [
            { label: '中文', value: 'zh-cn' },
            { label: 'English', value: 'en' },
            { label: '日本語', value: 'ja' },
            { label: '한국어', value: 'ko' },
            { label: 'Français', value: 'fr' }
          ],
          toolDescription: '搜索语言代码'
        },
        {
          key: 'readFullContent',
          label: '读取完整内容',
          description: '是否访问搜索结果中的每个URL并返回完整内容',
          required: false,
          valueType: WorkflowIOValueTypeEnum.boolean,
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          defaultValue: false,
          toolDescription: '是否读取SERP的完整内容'
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '搜索结果',
          description: `Jina AI 搜索返回的结构化数据: {
  title: string;
  url: string;
  description: string;
  content?: string;
}[]`,
          valueType: WorkflowIOValueTypeEnum.arrayObject
        }
      ]
    }
  ]
});
