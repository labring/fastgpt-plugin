import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '智能表记录管理 (极简版)',
    en: 'Smart Sheet Record (Simple)'
  },
  description: {
    'zh-CN': '极简模式管理记录：支持新增、更新、查询、删除。输入简单 JSON 对象即可操作。',
    en: 'Manage records in simple mode: add, update, list, delete. Uses simple JSON objects.'
  },
  toolDescription: 'Manage records in a WeCom Smart Sheet using simple data objects.',

  versionList: [
    {
      value: '0.1.0',
      description: 'Initial simple version',
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
          key: 'data',
          label: '记录数据',
          description: '新增或更新时的键值对，如 {"姓名": "张三", "年龄": 20}',
          required: false,
          valueType: WorkflowIOValueTypeEnum.object,
          renderTypeList: [FlowNodeInputTypeEnum.JSONEditor, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Record data as a simple object'
        },
        {
          key: 'record_id',
          label: '记录 ID',
          description: '更新或删除时的记录唯一标识',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The ID of the record'
        },
        {
          key: 'limit',
          label: '限制条数',
          description: '查询列表时的条数限制 (默认 10)',
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
