import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '获取表字段配置',
    en: 'Get Table Fields'
  },
  description: {
    'zh-CN': '获取飞书多维表格数据表的字段配置信息',
    en: 'Get field configuration of a data table in Feishu Bitable app'
  },
  toolDescription: 'List all field configurations of a data table with pagination support.',

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
          toolDescription: 'The table ID to get fields from',
          placeholder: 'tblxxxxxx'
        }
      ],
      outputs: [
        {
          key: 'fields',
          label: '字段列表',
          description: '字段配置信息数组,包含fieldId、fieldName、type等',
          valueType: WorkflowIOValueTypeEnum.arrayObject
        }
      ]
    }
  ]
});
