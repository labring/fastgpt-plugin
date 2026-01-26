import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '删除缓存',
    en: 'Delete Cache'
  },
  description: {
    'zh-CN': '从 Redis 删除缓存数据',
    en: 'Delete cached data from Redis'
  },
  toolDescription: 'Delete a key and its value from Redis.',

  versionList: [
    {
      value: '0.1.1',
      description: 'Initial version',
      inputs: [
        {
          key: 'key',
          label: '缓存键',
          description: 'Redis 键名',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The Redis key to delete'
        }
      ],
      outputs: [
        {
          key: 'deleted',
          label: '是否删除',
          description: '键是否被删除 (如果键不存在则为 false)',
          valueType: WorkflowIOValueTypeEnum.boolean
        }
      ]
    }
  ]
});
