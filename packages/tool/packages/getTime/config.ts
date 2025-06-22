import { defineTool, FlowNodeOutputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type';

export default defineTool({
  toolId: 'community-getTime',
  versionList: [
    {
      version: '1.0',
      description: 'Default version'
    }
  ],
  type: 'tools',
  name: {
    'zh-CN': '获取当前时间',
    en: 'Get current time'
  },
  description: {
    'zh-CN': '获取当前时间',
    en: 'Get current time'
  },
  author: 'FastGPT',
  icon: 'core/workflow/template/getTime',
  inputs: [],
  outputs: [
    {
      id: 'time',
      type: FlowNodeOutputTypeEnum.static,
      valueType: WorkflowIOValueTypeEnum.string,
      key: 'time',
      label: '时间',
      description: '当前时间'
    }
  ]
});
