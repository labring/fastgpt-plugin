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
    'zh-CN': 'Metaso 问答',
    en: 'Metaso Ask'
  },
  description: {
    'zh-CN': '基于 Metaso API 的智能问答工具，提供准确的问题回答和相关信息',
    en: 'Intelligent Q&A tool powered by Metaso API providing accurate answers and relevant information'
  },
  courseUrl: 'https://metaso.cn',
  author: 'FastGPT',
  versionList: [
    {
      value: '1.0.0',
      description: 'Initial version with full Q&A functionality',
      inputs: [
        {
          key: 'question',
          label: '问题',
          description: '要询问的问题或查询内容',
          toolDescription: '问题内容',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input]
        },
        {
          key: 'scope',
          label: '搜索范围',
          description: '指定问答时参考的信息范围',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          defaultValue: 'all',
          list: [
            { label: '全部', value: 'all' },
            { label: '网页', value: 'webpage' },
            { label: '学术', value: 'academic' },
            { label: '新闻', value: 'news' }
          ],
          toolDescription: '问答参考信息范围'
        },
        {
          key: 'includeReferences',
          label: '包含参考资料',
          description: '是否在回答中包含参考资料链接',
          required: false,
          valueType: WorkflowIOValueTypeEnum.boolean,
          renderTypeList: [FlowNodeInputTypeEnum.switch],
          defaultValue: true,
          toolDescription: '是否包含参考资料'
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '问答结果',
          description: `Metaso 问答返回的结构化数据，包含答案内容和可选的参考资料`,
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});
