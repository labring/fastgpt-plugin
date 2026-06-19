import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

const TYPES = [
  'company',
  'people_industry',
  'company_industry',
  'category',
  'location',
  'city',
  'region',
  'school',
  'title',
  'skill',
  'investor'
].map((t) => ({ label: t, value: t }));

export default defineTool({
  name: {
    'zh-CN': '自动补全',
    en: 'Typeahead'
  },
  description: {
    'zh-CN': '将自由文本解析为搜索过滤器中可用的确切存储值。',
    en: 'Resolve a free-text term into the exact stored value usable in a search filter.'
  },
  toolDescription:
    'Autocomplete / value resolver. Given a type (company, title, skill, location, industry, school, investor, …) and a query string, returns the exact stored values to use in Search People / Search Companies filters. Use it when a search returns few/no results.',
  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'type',
          label: 'Type',
          description: 'Which kind of value to resolve.',
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'title',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          list: TYPES
        },
        {
          key: 'q',
          label: 'Query',
          description: 'Free-text term to autocomplete (1-100 characters).',
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Term to resolve into a stored filter value'
        },
        {
          key: 'limit',
          label: 'Limit',
          description: 'Maximum number of suggestions (1-20).',
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 20,
          min: 1,
          max: 20,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput]
        }
      ],
      outputs: [
        {
          key: 'values',
          label: 'Values',
          description: 'Resolved stored values (strings).',
          valueType: WorkflowIOValueTypeEnum.arrayString
        },
        {
          key: 'results',
          label: 'Results',
          description: 'Full suggestion objects returned by the API.',
          valueType: WorkflowIOValueTypeEnum.arrayObject
        }
      ]
    }
  ]
});
