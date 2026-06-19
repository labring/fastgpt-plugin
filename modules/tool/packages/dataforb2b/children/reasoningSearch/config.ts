import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '智能推理搜索',
    en: 'Reasoning Search'
  },
  description: {
    'zh-CN': '用自然语言描述目标客户,自动转换为 B2B 人物/公司搜索。',
    en: 'Describe your ideal customer in natural language and get a B2B people or company search automatically.'
  },
  toolDescription:
    'Natural-language B2B search. Pass a plain-English query (e.g. "Heads of Growth at Series B SaaS startups in Germany"). If the API needs clarification it returns status "needs_input" with questions and a session_id — call again with session_id + answers to resolve.',
  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'query',
          label: 'Query',
          description:
            'Natural-language description of who you want to find (required on the first call).',
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Plain-English description of the target people or companies'
        },
        {
          key: 'category',
          label: 'Category',
          description: 'Search people or companies.',
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'people',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          list: [
            { label: 'People', value: 'people' },
            { label: 'Companies', value: 'companies' }
          ]
        },
        {
          key: 'session_id',
          label: 'Session ID',
          description:
            'Returned by a previous "needs_input" turn. Provide it together with answers to resolve clarifications.',
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference]
        },
        {
          key: 'answers',
          label: 'Answers (JSON)',
          description:
            'Answers to a "needs_input" turn as JSON, e.g. {"q1":"Germany","q2":"Series B"}.',
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference]
        },
        {
          key: 'max_results',
          label: 'Max results',
          description: 'Number of results to return (1-100).',
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 25,
          min: 1,
          max: 100,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput]
        },
        {
          key: 'enrich_live',
          label: 'Enrich live',
          description: 'Fetch fresh live data (uses more credits). Off by default.',
          valueType: WorkflowIOValueTypeEnum.boolean,
          defaultValue: false,
          renderTypeList: [FlowNodeInputTypeEnum.switch]
        }
      ],
      outputs: [
        {
          key: 'status',
          label: 'Status',
          description: '"needs_input" when clarification is required, otherwise the search status.',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'session_id',
          label: 'Session ID',
          description: 'Session id to reuse when answering a clarification turn.',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'questions',
          label: 'Clarifying questions',
          description: 'Questions to answer when status is "needs_input".',
          valueType: WorkflowIOValueTypeEnum.arrayObject
        },
        {
          key: 'total',
          label: 'Total',
          description: 'Total number of matching results.',
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'results',
          label: 'Results',
          description: 'Array of matching people or companies.',
          valueType: WorkflowIOValueTypeEnum.arrayObject
        }
      ]
    }
  ]
});
