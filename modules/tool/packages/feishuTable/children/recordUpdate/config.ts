import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '更新记录',
    en: 'Update Record'
  },
  description: {
    'zh-CN': '更新飞书多维表格数据表中的记录字段数据',
    en: 'Update field values of a record in a data table in Feishu Bitable app'
  },
  toolDescription: 'Update specific field values of an existing record in a data table.',

  versionList: [
    {
      value: '0.1.0',
      description: 'Initial version',
      inputs: [
        {
          key: 'biTableId',
          label: '多维表格 ID',
          description: '多维表格应用的唯一标识',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The BiTable ID (app token) of the Bitable application',
          placeholder: 'bascxxxxxx'
        },
        {
          key: 'dataTableId',
          label: '数据表 ID',
          description: '数据表唯一标识',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The table ID containing the record',
          placeholder: 'tblxxxxxx'
        },
        {
          key: 'recordId',
          label: '记录 ID',
          description: '记录唯一标识',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The record ID to update',
          placeholder: 'recxxxxxx'
        },
        {
          key: 'fields',
          label: '字段数据',
          description: '要更新的字段数据,JSON对象格式',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The field data to update as JSON object',
          placeholder: '{"field_name": "new_value"}'
        }
      ],
      outputs: [
        {
          key: 'success',
          label: '是否成功',
          description: '操作是否成功',
          valueType: WorkflowIOValueTypeEnum.boolean
        }
      ]
    }
  ]
});
