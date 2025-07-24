import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  SystemInputKeyEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  type: ToolTypeEnum.search,
  name: {
    'zh-CN': 'Search XNG 搜索',
    en: 'Search XNG'
  },
  description: {
    'zh-CN': '使用 Search XNG 服务进行搜索。',
    en: 'Use Search XNG service for search.'
  },
  icon: 'core/workflow/template/searxng',
  courseUrl: '/docs/introduction/guide/plugins/searxng_plugin_guide/',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: SystemInputKeyEnum.systemInputConfig,
          label: '',
          renderTypeList: [FlowNodeInputTypeEnum.hidden],
          valueType: WorkflowIOValueTypeEnum.object,
          inputList: [
            {
              key: 'url',
              label: 'url',
              description: 'searXNG搜索url',
              required: true,
              inputType: 'secret'
            }
          ]
        },
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
          description: ' 检索结果'
        },
        {
          type: FlowNodeOutputTypeEnum.error,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'error',
          label: '错误信息'
        }
      ]
    }
  ]
});
