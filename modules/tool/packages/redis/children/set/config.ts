import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '设置缓存',
    en: 'Set Cache'
  },
  description: {
    'zh-CN': '设置 Redis 缓存数据,支持过期时间',
    en: 'Set Redis cache data with optional TTL'
  },
  toolDescription: 'Set a value in Redis with optional expiration time (TTL in seconds).',

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
          toolDescription: 'The Redis key to set'
        },
        {
          key: 'value',
          label: '缓存值',
          description: '要存储的数据',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The value to cache'
        },
        {
          key: 'ttl',
          label: '过期时间 (秒)',
          description: '数据过期时间,单位秒。0 表示永不过期',
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 0,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Time to live in seconds (0 = no expiration)'
        }
      ],
      outputs: [
        {
          key: 'success',
          label: '设置成功',
          description: '是否成功设置',
          valueType: WorkflowIOValueTypeEnum.boolean
        }
      ]
    }
  ]
});
