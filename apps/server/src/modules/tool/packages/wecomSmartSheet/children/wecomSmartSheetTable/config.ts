import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '智能表子表管理',
    en: 'Smart Sheet Table Management'
  },
  description: {
    'zh-CN': '管理企业微信智能表中的子表（增删改查）',
    en: 'Manage sub-sheets in WeCom Smart Sheet (Add, Delete, Update, Get)'
  },
  toolDescription:
    'A unified tool to manage sub-sheets in WeCom Smart Sheet, supporting adding, deleting, updating, and querying sheet information.',

  versionList: [
    {
      value: '0.1.0',
      description: 'Unified sheet management',
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
          key: 'action',
          label: '操作类型',
          description:
            '执行的操作：add (添加子表), delete (删除子表), update (更新子表), get (查询子表)',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          list: [
            { label: '添加子表', value: 'add' },
            { label: '删除子表', value: 'delete' },
            { label: '更新子表', value: 'update' },
            { label: '查询子表', value: 'get' }
          ],
          toolDescription: 'The action to perform: add, delete, update, or get'
        },
        {
          key: 'sheet_id',
          label: '子表 ID',
          description: '操作所属的子表 ID (删除、更新、查询时使用)',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The ID of the sub-sheet'
        },
        {
          key: 'title',
          label: '子表标题',
          description: '子表标题 (添加、更新时使用)',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The title of the sub-sheet'
        },
        {
          key: 'need_all_type_sheet',
          label: '获取所有类型子表',
          description: '是否获取所有类型的子表，包含仪表盘和说明页 (查询时使用)',
          required: false,
          valueType: WorkflowIOValueTypeEnum.boolean,
          renderTypeList: [FlowNodeInputTypeEnum.switch, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Whether to get all types of sheets (dashboard, external, etc.)'
        }
      ],
      outputs: [
        {
          key: 'result',
          label: '操作结果',
          valueType: WorkflowIOValueTypeEnum.any,
          description: 'API 返回的原始结果'
        }
      ]
    }
  ]
});
