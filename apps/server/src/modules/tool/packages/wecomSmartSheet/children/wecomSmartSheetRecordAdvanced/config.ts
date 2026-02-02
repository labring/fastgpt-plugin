import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '智能表记录管理 (高级版)',
    en: 'Smart Sheet Record (Advanced)'
  },
  description: {
    'zh-CN': '高级模式管理记录：支持批量新增、更新、删除，支持复杂的过滤和排序。',
    en: 'Advanced record management: bulk operations, complex filtering and sorting.'
  },
  toolDescription: 'Advanced record management in WeCom Smart Sheet using raw JSON configurations.',

  versionList: [
    {
      value: '0.1.0',
      description: 'Initial advanced version',
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
          key: 'sheet_id',
          label: '子表 ID',
          description: '操作所属的子表 ID',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The ID of the sheet where records belong'
        },
        {
          key: 'action',
          label: '操作类型',
          description: '执行的操作：add (新增), del (删除), update (更新), list (查询列表)',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          list: [
            { label: '新增记录', value: 'add' },
            { label: '删除记录', value: 'del' },
            { label: '更新记录', value: 'update' },
            { label: '查询记录列表', value: 'list' }
          ],
          toolDescription: 'The action to perform'
        },
        {
          key: 'records',
          label: '记录列表 (JSON Array)',
          description: '新增或更新时的完整记录数组',
          required: false,
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          renderTypeList: [FlowNodeInputTypeEnum.JSONEditor, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Array of records in WeCom format'
        },
        {
          key: 'record_ids',
          label: '记录 ID 列表',
          description: '删除或查询特定记录时的 ID 数组',
          required: false,
          valueType: WorkflowIOValueTypeEnum.arrayString,
          renderTypeList: [FlowNodeInputTypeEnum.JSONEditor, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Array of record IDs'
        },
        {
          key: 'query_params',
          label: '高级查询参数 (JSON)',
          description: '查询时的 filter_spec, sort, view_id 等',
          required: false,
          valueType: WorkflowIOValueTypeEnum.object,
          renderTypeList: [FlowNodeInputTypeEnum.JSONEditor, FlowNodeInputTypeEnum.reference],
          toolDescription: 'JSON object for filtering, sorting, etc.'
        },
        {
          key: 'key_type',
          label: 'Key 类型',
          description: 'CELL_VALUE_KEY_TYPE_FIELD_TITLE 或 CELL_VALUE_KEY_TYPE_FIELD_ID',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          list: [
            { label: '使用标题 (Title)', value: 'CELL_VALUE_KEY_TYPE_FIELD_TITLE' },
            { label: '使用 ID', value: 'CELL_VALUE_KEY_TYPE_FIELD_ID' }
          ]
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '结果',
          description: '操作结果',
          valueType: WorkflowIOValueTypeEnum.any
        }
      ]
    }
  ]
});
