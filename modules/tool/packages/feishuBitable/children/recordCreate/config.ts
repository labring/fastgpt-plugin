import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '创建记录',
    en: 'Create Record'
  },
  description: {
    'zh-CN': '在飞书多维表格数据表中新增一条记录',
    en: 'Create a new record in a data table in Feishu Bitable app'
  },
  toolDescription: 'Create a new record in a data table with specified field values.',

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
          toolDescription: 'The table ID to create record in',
          placeholder: 'tblxxxxxx'
        },
        {
          key: 'fields',
          label: '字段数据',
          description: '记录的字段数据,JSON对象格式',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The field data for the new record as JSON object',
          placeholder: '{"field_name": "value"}'
        }
      ],
      outputs: [
        {
          key: 'recordId',
          label: '记录 ID',
          description: '创建的记录唯一标识',
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});
