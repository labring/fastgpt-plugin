import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '智能表字段管理 (高级版)',
    en: 'Smart Sheet Field (Advanced)'
  },
  description: {
    'zh-CN': '高级模式管理字段：支持批量新增、更新、删除，支持视图 ID 和分页查询。',
    en: 'Advanced field management: bulk add, update, delete, with view ID and pagination support.'
  },
  toolDescription: 'Advanced field management in WeCom Smart Sheet using raw JSON configurations.',

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
          toolDescription: 'The ID of the sheet where fields belong'
        },
        {
          key: 'action',
          label: '操作类型',
          description: '执行的操作：add (新增), del (删除), update (更新), list (查询列表)',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          list: [
            { label: '新增字段', value: 'add' },
            { label: '删除字段', value: 'del' },
            { label: '更新字段', value: 'update' },
            { label: '查询字段列表', value: 'list' }
          ],
          toolDescription: 'The action to perform'
        },
        {
          key: 'fields',
          label: '字段配置 (JSON Array)',
          description: '新增或更新时的字段配置数组',
          required: false,
          valueType: WorkflowIOValueTypeEnum.arrayObject,
          renderTypeList: [FlowNodeInputTypeEnum.JSONEditor, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Array of field configurations'
        },
        {
          key: 'field_ids',
          label: '字段 ID 列表',
          description: '删除操作时的字段 ID 数组',
          required: false,
          valueType: WorkflowIOValueTypeEnum.arrayString,
          renderTypeList: [FlowNodeInputTypeEnum.JSONEditor, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Array of field IDs to delete'
        },
        {
          key: 'view_id',
          label: '视图 ID',
          description: '查询列表时的视图 ID',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'View ID for listing fields'
        },
        {
          key: 'offset',
          label: '偏移量',
          description: '查询列表的分页偏移',
          required: false,
          valueType: WorkflowIOValueTypeEnum.number,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference]
        },
        {
          key: 'limit',
          label: '限制条数',
          description: '查询列表的分页限制',
          required: false,
          valueType: WorkflowIOValueTypeEnum.number,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference]
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
