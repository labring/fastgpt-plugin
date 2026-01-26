import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '删除记录',
    en: 'Delete Record'
  },
  description: {
    'zh-CN': '删除飞书多维表格数据表中的指定记录',
    en: 'Delete a specific record from a data table in Feishu Bitable app'
  },
  toolDescription: 'Delete a record from a data table by record ID.',

  versionList: [
    {
      value: '0.1.1',
      description: 'Initial version',
      inputs: [
        {
          key: 'biTableId',
          label: '多维表格 ID',
          description: '多维表格应用的唯一标识',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The BiTable ID (app token) of the Bitable application'
        },
        {
          key: 'dataTableId',
          label: '数据表 ID',
          description: '数据表唯一标识',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The table ID containing the record'
        },
        {
          key: 'recordId',
          label: '记录 ID',
          description: '要删除的记录唯一标识',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The record ID to delete'
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
