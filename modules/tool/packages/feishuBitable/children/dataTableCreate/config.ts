import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '新增数据表',
    en: 'Create Data Table'
  },
  description: {
    'zh-CN': '在飞书多维表格应用中创建新的数据表',
    en: 'Create a new data table in Feishu Bitable app'
  },
  toolDescription: 'Create a new data table in a Feishu Bitable application with specified name.',

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
          key: 'tableName',
          label: '数据表名称',
          description: '新建数据表的名称',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The name of the new table to create',
          maxLength: 100
        }
      ],
      outputs: [
        {
          key: 'dataTableId',
          label: '数据表 ID',
          description: '创建的数据表唯一标识',
          valueType: WorkflowIOValueTypeEnum.string
        }
      ]
    }
  ]
});
