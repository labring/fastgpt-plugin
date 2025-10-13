import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '获取缓存',
    en: 'Get Cache'
  },
  description: {
    'zh-CN': '从 Redis 获取缓存数据',
    en: 'Get cached data from Redis'
  },
  toolDescription: 'Get cached value from Redis by key. Returns null if key does not exist.',

  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'key',
          label: '缓存键',
          description: 'Redis 键名',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The Redis key to retrieve'
        }
      ],
      outputs: [
        {
          key: 'value',
          label: '缓存值',
          description: '获取到的缓存数据,如果键不存在则为 null',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'exists',
          label: '是否存在',
          description: '键是否存在',
          valueType: WorkflowIOValueTypeEnum.boolean
        }
      ]
    }
  ]
});
