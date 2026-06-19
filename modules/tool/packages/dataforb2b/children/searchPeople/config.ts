import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

const OPERATORS = [
  '=',
  '!=',
  'like',
  'not_like',
  'in',
  'not_in',
  '>',
  '>=',
  '<',
  '<=',
  'between'
].map((op) => ({ label: op, value: op }));

const COLUMN_HINT =
  'People filter column. Examples: current_title, current_company, current_company_size, ' +
  'current_company_industry, current_company_funding_stage, current_company_investor, ' +
  'profile_country (ISO-2, e.g. GB), profile_industry, skill, school, degree_level, language, ' +
  'years_of_experience, keyword (full-text headline). See docs.dataforb2b.ai for the full list.';

function slot(i: number) {
  return [
    {
      key: `filter_${i}_column`,
      label: `Filter ${i} — column`,
      description: COLUMN_HINT,
      valueType: WorkflowIOValueTypeEnum.string,
      renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
      toolDescription: `Column name for filter slot ${i}`
    },
    {
      key: `filter_${i}_operator`,
      label: `Filter ${i} — operator`,
      description:
        'Comparison operator. Use "in" for a comma-separated list, "between" for "min,max".',
      valueType: WorkflowIOValueTypeEnum.string,
      defaultValue: '=',
      renderTypeList: [FlowNodeInputTypeEnum.select],
      list: OPERATORS
    },
    {
      key: `filter_${i}_value`,
      label: `Filter ${i} — value`,
      description:
        'Value to match. For "in"/"not_in" use a comma-separated list; for "between" use "min,max".',
      valueType: WorkflowIOValueTypeEnum.string,
      renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
      toolDescription: `Value for filter slot ${i}`
    }
  ];
}

export default defineTool({
  name: {
    'zh-CN': '搜索人物',
    en: 'Search People'
  },
  description: {
    'zh-CN': '基于职位、公司、LinkedIn 链接、技能、地区、融资等结构化条件搜索 B2B 人物 / 决策者。',
    en: 'Search B2B people and decision-makers by job title, company, LinkedIn URL, skills, location, funding and more.'
  },
  toolDescription:
    'Search people (B2B professional profiles) with structured filters. Combine up to 5 filter slots (column + operator + value) plus optional advanced JSON filters. Returns matching people for lead generation and prospecting.',
  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'match',
          label: 'Match',
          description: 'Combine the filter slots with AND (all) or OR (any).',
          valueType: WorkflowIOValueTypeEnum.string,
          defaultValue: 'and',
          renderTypeList: [FlowNodeInputTypeEnum.select],
          list: [
            { label: 'AND (all conditions)', value: 'and' },
            { label: 'OR (any condition)', value: 'or' }
          ]
        },
        ...slot(1),
        ...slot(2),
        ...slot(3),
        ...slot(4),
        ...slot(5),
        {
          key: 'advanced_filters',
          label: 'Advanced filters (JSON)',
          description:
            'Optional raw filter group as JSON, e.g. {"op":"or","conditions":[{"column":"current_title","type":"like","value":"growth"}]}. Merged (AND) with the slots above.',
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference]
        },
        {
          key: 'count',
          label: 'Count',
          description: 'Number of results to return (1-100).',
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 25,
          min: 1,
          max: 100,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput]
        },
        {
          key: 'offset',
          label: 'Offset',
          description: 'Pagination offset (0, 25, 50, …).',
          valueType: WorkflowIOValueTypeEnum.number,
          defaultValue: 0,
          min: 0,
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
          key: 'total',
          label: 'Total',
          description: 'Total number of matching people.',
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'count',
          label: 'Count',
          description: 'Number of people returned in this page.',
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'results',
          label: 'Results',
          description: 'Array of matching people.',
          valueType: WorkflowIOValueTypeEnum.arrayObject
        }
      ]
    }
  ]
});
