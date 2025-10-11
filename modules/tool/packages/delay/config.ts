import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { ToolTypeEnum } from '@tool/type/tool';

export default defineTool({
  isWorkerRun: false,
  type: ToolTypeEnum.tools,
  name: {
    'zh-CN': '流程等待',
    en: 'Delay'
  },
  description: {
    'zh-CN': '让工作流等待指定时间后运行',
    en: 'Delay the workflow after a specified time'
  },
  icon: 'core/workflow/template/sleep',
  versionList: [
    {
      value: '1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'ms',
          label: '延迟时长(毫秒)',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 1000
        }
      ],
      outputs: []
    }
  ]
});
