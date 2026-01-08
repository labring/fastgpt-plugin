import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '获取单个记录',
    en: 'Get Record'
  },
  description: {
    'zh-CN': '获取飞书多维表格数据表中的单条记录',
    en: 'Get a single record from a data table in Feishu Bitable app'
  },
  toolDescription: 'Retrieve a specific record from a data table by record ID.',

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
          description: '记录唯一标识',
          required: true,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The record ID to retrieve'
        }
      ],
      outputs: [
        {
          key: 'recordId',
          label: '记录 ID',
          description: '记录唯一标识',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'fields',
          label: '字段数据',
          description: '记录的字段数据对象',
          valueType: WorkflowIOValueTypeEnum.object
        }
      ]
    }
  ]
});
