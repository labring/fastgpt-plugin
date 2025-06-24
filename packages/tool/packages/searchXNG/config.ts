import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  toolId: 'community-searchXNG',
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
  courseUrl: '/docs/guide/plugins/searxng_plugin_guide/',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'query',
          label: 'query',
          description: '检索词',
          required: true,
          toolDescription: '检索词'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'url',
          label: 'url',
          description: '部署的searXNG服务的链接',
          defaultValue: '',
          list: [
            {
              label: '',
              value: ''
            }
          ],
          maxFiles: 5,
          canSelectFile: true,
          canSelectImg: true,
          required: true
        }
      ],
      outputs: [
        {
          id: 'result',
          type: FlowNodeOutputTypeEnum.static,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'result',
          label: '搜索结果',
          description: ' 检索结果'
        },
        {
          id: 'error',
          type: FlowNodeOutputTypeEnum.static,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'error',
          label: '错误信息',
          description: '错误信息'
        }
      ]
    }
  ]
});
