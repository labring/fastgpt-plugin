import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  icon: 'core/workflow/template/bing',
  courseUrl:
    'https://fael3z0zfze.feishu.cn/wiki/LsKAwOmtniA4vkkC259cmfxXnAc?fromScene=spaceOverview',
  type: ToolTypeEnum.search,
  name: {
    'zh-CN': 'Bing 搜索',
    en: 'Bing Search'
  },
  description: {
    'zh-CN': '调用 Bing 搜索接口，返回搜索结果',
    en: 'Call Bing search interface and return search results'
  },
  secretInputConfig: [
    {
      key: 'key',
      label: 'Bing API Key',
      description: '可以在 https://www.bing.com/business/create 获取',
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
          key: 'query',
          label: '搜索关键词',
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input]
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'result',
          label: '搜索结果',
          description: '搜索结果'
        }
      ]
    }
  ]
});
