import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  name: {
    'zh-CN': '热榜工具',
    en: 'Hot List Tool'
  },
  tags: [ToolTagEnum.enum.tools],
  description: {
    'zh-CN': '获取热榜信息，支持36氪、知乎、微博、掘金、头条等多个平台',
    en: 'Get hot list information from multiple platforms including 36kr, zhihu, weibo, juejin, and toutiao'
  },
  toolDescription:
    'Get hot trending content from multiple platforms including 36kr, zhihu, weibo, juejin, and toutiao with accurate publish times',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'sources',
          label: '热榜来源',
          renderTypeList: [FlowNodeInputTypeEnum.multipleSelect],
          valueType: WorkflowIOValueTypeEnum.arrayString,
          required: true,
          description: '选择热榜来源网站（可多选）',
          defaultValue: ['36kr'],
          list: [
            { label: '36氪', value: '36kr' },
            { label: '知乎', value: 'zhihu' },
            { label: '微博', value: 'weibo' },
            { label: '掘金', value: 'juejin' },
            { label: '头条', value: 'toutiao' }
          ]
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          key: 'hotNewsList',
          label: '新闻热榜列表',
          description: '新闻热榜数据列表'
        }
      ]
    }
  ]
});
