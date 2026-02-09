import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '智能表查询',
    en: 'Smart Sheet Query'
  },
  description: {
    'zh-CN': '查询企业微信智能表中的所有记录，支持按子表ID或名称过滤',
    en: 'Query all records in WeCom Smart Sheet, support filtering by sheet ID or name'
  },
  toolDescription: 'Query all records from WeCom Smart Sheet with pagination and filtering support',

  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'accessToken',
          label: '调用凭证 (access_token)',
          description: '企业微信的调用凭证',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The access token for WeCom API'
        },
        {
          key: 'docid',
          label: '文档 ID (docid)',
          description: '智能表文档的唯一标识',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The unique ID of the smart sheet document'
        },
        {
          key: 'sheets',
          label: '子表过滤',
          description:
            '要查询的子表ID或名称数组，留空则查询所有子表。格式：["sheet_id1", "子表名称2"]',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.JSONEditor, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Array of sheet IDs or names to filter, empty means all sheets'
        },
        {
          key: 'limit_per_sheet',
          label: '每子表记录数',
          description: '每个子表最多查询的记录数（默认1000，最大1000）',
          required: false,
          valueType: WorkflowIOValueTypeEnum.number,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          defaultValue: 1000,
          toolDescription: 'Maximum records to query per sheet (default 1000, max 1000)'
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '查询结果',
          valueType: WorkflowIOValueTypeEnum.object,
          description: '包含所有查询记录的结果对象'
        },
        {
          key: 'total_records',
          label: '总记录数',
          valueType: WorkflowIOValueTypeEnum.number,
          description: '查询到的总记录数量'
        },
        {
          key: 'sheet_count',
          label: '子表数量',
          valueType: WorkflowIOValueTypeEnum.number,
          description: '查询的子表数量'
        }
      ]
    }
  ]
});
