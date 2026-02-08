import { defineTool, ToolTagEnum, WorkflowIOValueTypeEnum } from '@fastgpt-plugin/helpers';

export default defineTool({
  tags: [ToolTagEnum.tools],
  name: {
    'zh-CN': '{{name}}',
    en: '{{name}}'
  },
  description: {
    'zh-CN': '{{description}}',
    en: '{{description}}'
  },
  icon: 'core/workflow/template/{{name}}',
  versionList: [
    {
      value: '0.0.1',
      description: 'Default version',
      inputs: [],
      outputs: [
        {
          key: 'time',
          valueType: WorkflowIOValueTypeEnum.string,
          label: '时间',
          description: '当前时间'
        }
      ]
    }
  ]
});
