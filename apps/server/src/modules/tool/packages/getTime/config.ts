import { defineTool } from '@tool/type';
import { WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTagEnum } from '@tool/type/tags';

export default defineTool({
  tags: [ToolTagEnum.enum.tools],
  name: {
    'zh-CN': '获取当前时间',
    en: 'Get current time'
  },
  description: {
    'zh-CN': '获取当前时间',
    en: 'Get current time'
  },
  icon: 'core/workflow/template/getTime',
  versionList: [
    {
      value: '0.1.1',
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
