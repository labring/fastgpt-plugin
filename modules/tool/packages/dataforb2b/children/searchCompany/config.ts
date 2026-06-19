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
  'Company filter column. Examples: name, domain, industry, category, employee_count, ' +
  'country_iso_code (ISO-2), city, region, founded_year, company_type, funding_stage_normalized, ' +
  'last_funding_amount_usd, last_funding_date, employee_growth_12m, has_funding, ' +
  'keyword (full-text company search). See docs.dataforb2b.ai for the full list.';

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
    'zh-CN': '搜索公司',
    en: 'Search Companies'
  },
  description: {
    'zh-CN':
      '基于行业、规模、地区、LinkedIn 链接、融资、成立年份等结构化条件搜索 B2B 公司 / 目标账户。',
    en: 'Search B2B companies and target accounts by industry, size, location, LinkedIn URL, funding, founding year and more.'
  },
  toolDescription:
    'Search companies (B2B accounts) with structured filters. Combine up to 5 filter slots (column + operator + value) plus optional advanced JSON filters. Returns matching companies for account-based prospecting.',
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
            'Optional raw filter group as JSON, e.g. {"op":"and","conditions":[{"column":"industry","type":"like","value":"software"}]}. Merged (AND) with the slots above.',
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
          description: 'Total number of matching companies.',
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'count',
          label: 'Count',
          description: 'Number of companies returned in this page.',
          valueType: WorkflowIOValueTypeEnum.number
        },
        {
          key: 'results',
          label: 'Results',
          description: 'Array of matching companies.',
          valueType: WorkflowIOValueTypeEnum.arrayObject
        }
      ]
    }
  ]
});
