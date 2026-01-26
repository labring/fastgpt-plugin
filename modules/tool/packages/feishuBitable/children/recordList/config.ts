import { defineTool } from '@tool/type';
import { FlowNodeInputTypeEnum, WorkflowIOValueTypeEnum } from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '批量获取记录',
    en: 'List Records'
  },
  description: {
    'zh-CN': '批量获取飞书多维表格数据表中的记录',
    en: 'List records from a data table in Feishu Bitable app'
  },
  toolDescription: 'List records from a data table with optional filtering and pagination support.',

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
          toolDescription: 'The table ID to list records from',
          placeholder: 'tblxxxxxx'
        },
        {
          key: 'viewId',
          label: '视图 ID',
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'The view ID to list records from'
        },
        {
          key: 'pageSize',
          label: '分页大小',
          description: '每页返回的记录数量(1-500,默认20)',
          required: false,
          valueType: WorkflowIOValueTypeEnum.number,
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Number of records per page (1-500, default 20)',
          defaultValue: 100,
          max: 500,
          min: 1
        },
        {
          key: 'pageToken',
          label: '分页标记',
          description: '用于获取下一页数据的标记',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Token for fetching the next page of results'
        },
        {
          key: 'filter',
          label: '筛选条件',
          description: '筛选公式(可选)',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Optional filter formula to apply'
        },
        {
          key: 'sort',
          label: '排序规则',
          description: '排序规则JSON数组(可选)',
          required: false,
          valueType: WorkflowIOValueTypeEnum.string,
          renderTypeList: [FlowNodeInputTypeEnum.textarea, FlowNodeInputTypeEnum.reference],
          toolDescription: 'Optional sort rules as JSON array'
        }
      ],
      outputs: [
        {
          key: 'records',
          label: '记录列表',
          description: '记录数组,每个记录包含recordId和fields字段数据',
          valueType: WorkflowIOValueTypeEnum.arrayObject
        },
        {
          key: 'hasMore',
          label: '是否有更多数据',
          description: '是否还有下一页数据',
          valueType: WorkflowIOValueTypeEnum.boolean
        },
        {
          key: 'pageToken',
          label: '下一页标记',
          description: '获取下一页数据的标记',
          valueType: WorkflowIOValueTypeEnum.string
        },
        {
          key: 'total',
          label: '总数量',
          description: '记录总数量',
          valueType: WorkflowIOValueTypeEnum.number
        }
      ]
    }
  ]
});
