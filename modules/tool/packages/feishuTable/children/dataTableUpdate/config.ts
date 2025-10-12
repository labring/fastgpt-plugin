import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '更新数据表',
    en: 'Update Data Table'
  },
  description: {
    'zh-CN': '更新飞书多维表格应用中指定数据表的名称',
    en: 'Update the name of a specific data table in Feishu Bitable app'
  },
  toolDescription: 'Update the name of a data table in a Feishu Bitable application.',

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
          toolDescription: 'The table ID to update',
          placeholder: 'tblxxxxxx'
        },
        {
          key: 'name',
          label: '新的数据表名称',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The new name for the table',
          maxLength: 100
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
