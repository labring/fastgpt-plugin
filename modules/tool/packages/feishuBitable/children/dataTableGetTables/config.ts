import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '获取数据表列表',
    en: 'List Data Tables'
  },
  description: {
    'zh-CN': '获取飞书多维表格应用中的所有数据表列表',
    en: 'Get a list of all data tables in Feishu Bitable app'
  },
  toolDescription: 'List all data tables in a Feishu Bitable application with pagination support.',

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
        }
      ],
      outputs: [
        {
          key: 'tables',
          label: '数据表列表',
          description: '数据表信息数组,每个元素包含tableId和name',
          valueType: WorkflowIOValueTypeEnum.arrayObject
        }
      ]
    }
  ]
});
