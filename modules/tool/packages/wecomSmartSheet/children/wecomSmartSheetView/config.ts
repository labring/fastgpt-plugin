import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '智能表视图管理',
    en: 'Smart Sheet View'
  },
  description: {
    'zh-CN': '管理企微智能表视图，支持视图的增删改查。',
    en: 'Manage WeCom Smart Sheet views, supporting CRUD operations for views.'
  },
  toolDescription: 'Manage views in a WeCom Smart Sheet (add, delete, update, list).',

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
          key: 'sheet_id',
          label: '子表 ID',
          description: '操作所属的子表 ID',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The ID of the sheet where views belong'
        },
        {
          key: 'action',
          label: '操作类型',
          description: '执行的操作：add (新增), del (删除), update (修改), list (查询列表)',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          list: [
            { label: '新增视图', value: 'add' },
            { label: '删除视图', value: 'del' },
            { label: '修改视图', value: 'update' },
            { label: '查询视图列表', value: 'list' }
          ],
          toolDescription: 'The action to perform: add, del, update, or list'
        },
        {
          key: 'view_title',
          label: '视图标题',
          description: '视图的名称',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The title of the view'
        },
        {
          key: 'view_id',
          label: '视图 ID',
          description: '视图的唯一标识 (修改/删除时使用)',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The unique ID of the view'
        },
        {
          key: 'view_type',
          label: '视图类型',
          description: '新增视图时的类型',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          list: [
            { label: '表格视图', value: 'VIEW_TYPE_GRID' },
            { label: '看板视图', value: 'VIEW_TYPE_KANBAN' },
            { label: '画册视图', value: 'VIEW_TYPE_GALLERY' },
            { label: '甘特视图', value: 'VIEW_TYPE_GANTT' },
            { label: '日历视图', value: 'VIEW_TYPE_CALENDAR' }
          ],
          toolDescription: 'The type of the view'
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
