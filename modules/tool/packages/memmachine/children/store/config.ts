import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '存储记忆',
    en: 'Store Memory'
  },
  description: {
    'zh-CN': '用于通过 MemMachine API 存储记忆。',
    en: 'Used to store memory via the MemMachine API.'
  },
  toolDescription: 'Stores memory efficiently via the MemMachine API.',
  versionList: [
    {
      value: '0.1.0',
      description: 'Default version',
      inputs: [
        {
          key: 'orgId',
          label: '组织 ID',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 1,
          valueType: WorkflowIOValueTypeEnum.string,
          description: '可选，指定存储记忆的组织 ID'
        },
        {
          key: 'projectId',
          label: '项目 ID',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 1,
          valueType: WorkflowIOValueTypeEnum.string,
          description: '可选，指定存储记忆的项目 ID'
        },
        {
          key: 'types',
          label: '记忆类型',
          renderTypeList: [FlowNodeInputTypeEnum.multipleSelect, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.arrayString,
          list: [
            { label: '情节记忆', value: 'episodic' },
            { label: '语义记忆', value: 'semantic' }
          ],
          defaultValue: ['episodic', 'semantic'],
          description: '指定记忆的类型。未指定时将存储为所有类型的记忆。'
        },
        {
          key: 'content',
          label: '记忆消息',
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          description: '要存储的记忆内容'
        },
        {
          key: 'producer',
          label: '消息发送者',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 1,
          valueType: WorkflowIOValueTypeEnum.string,
          description: '可选，记忆内容的发送者'
        },
        {
          key: 'producedFor',
          label: '消息接收者',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          description: '可选，记忆内容的接收者'
        },
        {
          key: 'timestamp',
          label: '消息创建时间（ISO 8601格式）',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          description: '可选，记忆内容的创建时间，格式如 2023-10-05T14:48:00.000Z'
        },
        {
          key: 'role',
          label: '消息角色',
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          list: [
            { label: '用户', value: 'user' },
            { label: '助手', value: 'assistant' },
            { label: '系统', value: 'system' }
          ],
          defaultValue: 'user',
          description: '可选，记忆内容在对话中的角色'
        },
        {
          key: 'metadata',
          label: '附加属性（JSON格式）',
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          placeholder: '例如：{"session_id":"session_123", "user_id":"user_456"}',
          description: '可选，附加的记忆内容属性，需为有效的 JSON 格式字符串'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'memoryId',
          label: '新的记忆 ID',
          description: '返回创建的记忆 ID'
        }
      ]
    }
  ]
});
