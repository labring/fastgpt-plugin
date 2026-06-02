import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';
import { contextTemplate } from './src/contextTemplate';

export default defineTool({
  name: {
    'zh-CN': '搜索记忆',
    en: 'Search Memory'
  },
  description: {
    'zh-CN': '用于通过 MemMachine API 搜索记忆。',
    en: 'Used to search memory via the MemMachine API.'
  },
  toolDescription: 'Searches memory efficiently via the MemMachine API.',
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
          description: '可选，指定搜索记忆的组织 ID'
        },
        {
          key: 'projectId',
          label: '项目 ID',
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 1,
          valueType: WorkflowIOValueTypeEnum.string,
          description: '可选，指定搜索记忆的项目 ID'
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
          description: '指定记忆的类型。未指定时将搜索所有类型的记忆。'
        },
        {
          key: 'query',
          label: '搜索内容',
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          required: true,
          description: '用于语义记忆检索的自然语言查询。应为对所需信息的描述性字符串。'
        },
        {
          key: 'limit',
          label: '最大返回数量',
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 10,
          required: true,
          description: '指定搜索结果中要返回的最大记忆条目数量。'
        },
        {
          key: 'filter',
          label: '过滤条件',
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          placeholder: '例如：metadata.session_id=session_123 AND metadata.user_id=user_456',
          description:
            "可选，指定用于过滤记忆的条件。应用于记忆的附加属性，支持简单查询语法（如 'metadata.user_id=123'）来实现精确匹配，多个条件可通过 AND 组合。"
        },
        {
          key: 'contextTemplate',
          label: '上下文模板',
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: contextTemplate,
          description: '用于构建记忆上下文的模板，支持占位符替换。'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'memoryContext',
          label: '记忆上下文',
          description: '记忆上下文'
        }
      ]
    }
  ]
});
