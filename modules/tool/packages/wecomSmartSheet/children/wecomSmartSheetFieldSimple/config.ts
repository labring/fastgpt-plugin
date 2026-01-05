import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '智能表字段管理 (极简版)',
    en: 'Smart Sheet Field (Simple)'
  },
  description: {
    'zh-CN': '极简模式管理字段：支持新增字段、查询列表、根据名称删除。',
    en: 'Manage fields in simple mode: add fields, list fields, or delete by name.'
  },
  toolDescription: 'Manage fields in a WeCom Smart Sheet using simple names and types.',

  versionList: [
    {
      value: '0.1.1',
      description: 'Enhanced simple version with type-specific properties',
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
          description:
            '执行的操作：add (新增), del (根据名称删除), update (修改名称), list (查询列表)',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          list: [
            { label: '新增字段', value: 'add' },
            { label: '删除字段', value: 'del' },
            { label: '修改字段名称', value: 'update' },
            { label: '查询字段列表', value: 'list' }
          ],
          toolDescription: 'The action to perform: add, del, update, or list'
        },
        {
          key: 'field_title',
          label: '字段名称 / 旧名称',
          description: '字段的名称，或修改前的旧名称',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The name of the field or the old name when updating'
        },
        {
          key: 'new_field_title',
          label: '新字段名称 (修改时使用)',
          description: '修改字段名称时的新名称',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The new name for the field'
        },
        {
          key: 'field_type',
          label: '字段类型',
          description: '新增字段时的类型',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          list: [
            { label: '文本', value: 'FIELD_TYPE_TEXT' },
            { label: '数字', value: 'FIELD_TYPE_NUMBER' },
            { label: '日期', value: 'FIELD_TYPE_DATE_TIME' },
            { label: '单选', value: 'FIELD_TYPE_SINGLE_SELECT' },
            { label: '多选', value: 'FIELD_TYPE_SELECT' },
            { label: '复选框', value: 'FIELD_TYPE_CHECKBOX' },
            { label: '人员', value: 'FIELD_TYPE_USER' },
            { label: '电话', value: 'FIELD_TYPE_PHONE_NUMBER' },
            { label: '链接', value: 'FIELD_TYPE_URL' },
            { label: '评分', value: 'FIELD_TYPE_RATING' }
          ],
          toolDescription: 'The type of the field'
        },
        {
          key: 'options',
          label: '选项 (单选/多选)',
          description: '多个选项用英文逗号隔开，如“男,女”',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Comma separated options for select types'
        },
        {
          key: 'decimal_places',
          label: '小数位数',
          description: '数字类型字段的小数位数',
          required: false,
          valueType: WorkflowIOValueTypeEnum.number,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Decimal places for number type'
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
