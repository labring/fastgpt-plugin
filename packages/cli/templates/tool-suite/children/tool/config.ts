import { defineTool, WorkflowIOValueTypeEnum, ToolTagEnum } from '@fastgpt-plugin/helpers';

export default defineTool({
  tags: [ToolTagEnum.enum.tools],
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
      description: 'Initial version',
      inputs: [],
      outputs: [
        {
          key: 'message',
          valueType: WorkflowIOValueTypeEnum.enum.string,
          label: 'Message',
          description: 'Tool output message'
        }
      ]
    }
  ]
});
