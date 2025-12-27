import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '查询任务状态',
    en: 'Query task status'
  },
  description: {
    'zh-CN': '查询任务状态',
    en: 'Query task status'
  },
  toolDescription:
    'Check the status of a product import/update task by task_id, returning the current state (success or failure) and any error details.',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'task_id',
          label: '任务ID',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.object,
          key: 'result',
          label: '结果',
          description: '任务查询结果'
        }
      ]
    }
  ]
});
