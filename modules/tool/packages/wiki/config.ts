import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  tags: [ToolTagEnum.enum.search],
  name: {
    'zh-CN': 'Wiki搜索',
    en: 'Wiki Search'
  },
  description: {
    'zh-CN': '在Wiki中查询释义。',
    en: 'Search meanings in Wiki.'
  },
  icon: 'core/workflow/template/wiki',
  versionList: [
    {
      value: '0.1.1',
      description: 'Default version',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.reference, FlowNodeInputTypeEnum.input],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'query',
          label: 'query',
          description: '检索词',
          required: true,
          toolDescription: '检索词'
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
